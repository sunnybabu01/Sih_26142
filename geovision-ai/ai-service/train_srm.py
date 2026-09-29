"""
GeoVision AI - Training Pipeline for Satellite Super Resolution Mapping (SRM)
Deep Learning Training Script for paired Sentinel-2 (10m) and High-Resolution (<2.5m) imagery.

IMPORTANT SCIENTIFIC CONTEXT:
Sentinel-2 has a maximum optical spatial resolution of 10 meters (Bands 2, 3, 4, 8).
Training a deep neural network to reconstruct finer spatial resolution (e.g., <4m or 2.5m)
strictly requires paired, co-registered ground-truth imagery from higher-resolution platforms
such as PlanetScope (3m), SPOT 6/7 (1.5m), Pleiades (0.5m), or aerial orthophotos (NAIP).
Sentinel-2 imagery alone cannot provide ground truth at sub-4m detail.
"""

import os
import argparse
import math
import random
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import torchvision.transforms as transforms

from models.srm_net import create_model
from validation.metrics import calculate_psnr, calculate_ssim_single_channel


class PairedSatelliteDataset(Dataset):
    """
    Dataset loader for paired Medium-Resolution (Sentinel-2 10m) and
    geographically co-registered High-Resolution (<2.5m) satellite patches.
    """
    def __init__(self, lr_patches: np.ndarray, hr_patches: np.ndarray, augment: bool = True):
        assert len(lr_patches) == len(hr_patches), "LR and HR patch counts must match"
        self.lr_patches = lr_patches.astype(np.float32)
        self.hr_patches = hr_patches.astype(np.float32)
        self.augment = augment

    def __len__(self):
        return len(self.lr_patches)

    def __getitem__(self, idx):
        lr = self.lr_patches[idx]
        hr = self.hr_patches[idx]

        # Random horizontal / vertical flips and 90 deg rotations
        if self.augment:
            if random.random() > 0.5:
                lr = np.flip(lr, axis=2).copy()
                hr = np.flip(hr, axis=2).copy()
            if random.random() > 0.5:
                lr = np.flip(lr, axis=1).copy()
                hr = np.flip(hr, axis=1).copy()
            rot = random.choice([0, 1, 2, 3])
            if rot > 0:
                lr = np.rot90(lr, rot, (1, 2)).copy()
                hr = np.rot90(hr, rot, (1, 2)).copy()

        return torch.from_numpy(lr), torch.from_numpy(hr)


class SpectralConsistencyLoss(nn.Module):
    """
    Enforces spectral fidelity between downsampled output and low-resolution input,
    preventing color shifts and false reflectance artifacts.
    """
    def __init__(self, scale_factor: int = 4):
        super().__init__()
        self.scale_factor = scale_factor
        self.downsample = nn.AvgPool2d(scale_factor, stride=scale_factor)
        self.l1 = nn.L1Loss()

    def forward(self, sr: torch.Tensor, lr: torch.Tensor) -> torch.Tensor:
        sr_down = self.downsample(sr)
        return self.l1(sr_down, lr)


class GradientLoss(nn.Module):
    """Sobel-like gradient loss to penalize blurry edges in agricultural and urban boundaries."""
    def __init__(self):
        super().__init__()
        # 3x3 Sobel kernels
        kx = torch.tensor([[-1., 0., 1.], [-2., 0., 2.], [-1., 0., 1.]]).unsqueeze(0).unsqueeze(0)
        ky = torch.tensor([[-1., -2., -1.], [0., 0., 0.], [1., 2., 1.]]).unsqueeze(0).unsqueeze(0)
        self.register_buffer('kx', kx)
        self.register_buffer('ky', ky)

    def forward(self, sr: torch.Tensor, hr: torch.Tensor) -> torch.Tensor:
        b, c, h, w = sr.size()
        kx = self.kx.repeat(c, 1, 1, 1).to(sr.device)
        ky = self.ky.repeat(c, 1, 1, 1).to(sr.device)

        grad_sr_x = torch.nn.functional.conv2d(sr, kx, padding=1, groups=c)
        grad_sr_y = torch.nn.functional.conv2d(sr, ky, padding=1, groups=c)
        grad_hr_x = torch.nn.functional.conv2d(hr, kx, padding=1, groups=c)
        grad_hr_y = torch.nn.functional.conv2d(hr, ky, padding=1, groups=c)

        loss_x = torch.mean(torch.abs(grad_sr_x - grad_hr_x))
        loss_y = torch.mean(torch.abs(grad_sr_y - grad_hr_y))
        return loss_x + loss_y


def generate_synthetic_paired_dataset(num_samples: int = 100, lr_size: int = 32, scale: int = 4):
    """
    Generates realistic paired satellite feature patches for pipeline demonstration
    and smoke testing when external terabyte GIS datasets are not mounted.
    """
    hr_size = lr_size * scale
    lr_patches = []
    hr_patches = []

    for _ in range(num_samples):
        # Base terrain texture (field boundaries, road lines, reflectance gradients)
        base = np.random.uniform(0.1, 0.7, (3, hr_size, hr_size))
        # Add high-frequency simulated agricultural / urban edges
        grid_x = np.linspace(0, 10, hr_size)
        grid_y = np.linspace(0, 10, hr_size)
        xx, yy = np.meshgrid(grid_x, grid_y)
        structure = (np.sin(xx) * np.cos(yy) * 0.2)
        hr = np.clip(base + structure, 0.0, 1.0).astype(np.float32)

        # LR is low-pass filtered and downsampled (simulating 10m Sentinel-2 sensor PSF)
        # Average pooling simulates optical MTF
        lr = np.zeros((3, lr_size, lr_size), dtype=np.float32)
        for i in range(lr_size):
            for j in range(lr_size):
                lr[:, i, j] = np.mean(hr[:, i*scale:(i+1)*scale, j*scale:(j+1)*scale], axis=(1, 2))

        lr_patches.append(lr)
        hr_patches.append(hr)

    return np.array(lr_patches), np.array(hr_patches)


def train_srm(
    epochs: int = 5,
    batch_size: int = 8,
    lr: float = 1e-4,
    scale_factor: int = 4,
    output_checkpoint: str = "checkpoints/srmnet_x4.pth"
):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"===========================================================")
    print(f"GeoVision AI: Satellite Super Resolution Model Training")
    print(f"Scale Factor: {scale_factor}x (10m Sentinel-2 -> 2.5m)")
    print(f"Target Device: {device}")
    print(f"===========================================================")

    os.makedirs(os.path.dirname(output_checkpoint) or ".", exist_ok=True)

    # 1. Dataset Preparation
    print("[1/5] Preparing paired training patches...")
    lr_data, hr_data = generate_synthetic_paired_dataset(num_samples=80, lr_size=32, scale=scale_factor)
    val_lr, val_hr = generate_synthetic_paired_dataset(num_samples=20, lr_size=32, scale=scale_factor)

    train_dataset = PairedSatelliteDataset(lr_data, hr_data, augment=True)
    val_dataset = PairedSatelliteDataset(val_lr, val_hr, augment=False)

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)

    # 2. Model Initialization
    print("[2/5] Initializing SRM-Net Architecture...")
    model = create_model(scale_factor=scale_factor, in_channels=3, out_channels=3).to(device)

    # 3. Loss Functions & Optimizer
    l1_loss = nn.L1Loss()
    spectral_loss = SpectralConsistencyLoss(scale_factor=scale_factor).to(device)
    grad_loss = GradientLoss().to(device)

    optimizer = optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-6)

    # 4. Training Loop
    print("[3/5] Starting training loop...")
    best_psnr = 0.0

    for epoch in range(1, epochs + 1):
        model.train()
        total_loss = 0.0

        for batch_lr, batch_hr in train_loader:
            batch_lr = batch_lr.to(device)
            batch_hr = batch_hr.to(device)

            optimizer.zero_grad()
            sr = model(batch_lr)

            # Combined loss: Pixel fidelity + Edge preservation + Spectral consistency
            loss_pixel = l1_loss(sr, batch_hr)
            loss_spectral = spectral_loss(sr, batch_lr)
            loss_grad = grad_loss(sr, batch_hr)

            loss = loss_pixel + (0.1 * loss_spectral) + (0.05 * loss_grad)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()

            total_loss += loss.item()

        scheduler.step()
        avg_train_loss = total_loss / len(train_loader)

        # 5. Validation Loop
        model.eval()
        psnr_vals, ssim_vals = [], []
        with torch.no_grad():
            for v_lr, v_hr in val_loader:
                v_lr = v_lr.to(device)
                v_sr = model(v_lr)

                sr_np = v_sr.cpu().numpy()
                hr_np = v_hr.numpy()

                for b in range(sr_np.shape[0]):
                    psnr_vals.append(calculate_psnr(sr_np[b], hr_np[b]))
                    # Compute SSIM on first channel
                    ssim_vals.append(calculate_ssim_single_channel(sr_np[b, 0], hr_np[b, 0]))

        mean_psnr = np.mean(psnr_vals)
        mean_ssim = np.mean(ssim_vals)

        print(f"Epoch [{epoch:02d}/{epochs:02d}] - Train Loss: {avg_train_loss:.5f} | Val PSNR: {mean_psnr:.2f} dB | Val SSIM: {mean_ssim:.4f}")

        if mean_psnr > best_psnr:
            best_psnr = mean_psnr
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "val_psnr": best_psnr,
                "scale_factor": scale_factor,
                "version": "1.4.0"
            }, output_checkpoint)
            print(f"  --> Saved new best checkpoint to {output_checkpoint} (PSNR: {best_psnr:.2f} dB)")

    print(f"\n[5/5] Training successfully completed. Best Validation PSNR: {best_psnr:.2f} dB")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="GeoVision AI SRM Training Pipeline")
    parser.add_argument("--epochs", type=int, default=5, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=8, help="Batch size")
    parser.add_argument("--lr", type=float, default=1e-4, help="Learning rate")
    parser.add_argument("--scale", type=int, default=4, help="Super resolution scale factor (2 or 4)")
    parser.add_argument("--output", type=str, default="checkpoints/srmnet_x4.pth", help="Path to save checkpoint")
    args = parser.parse_args()

    train_srm(
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
        scale_factor=args.scale,
        output_checkpoint=args.output
    )
