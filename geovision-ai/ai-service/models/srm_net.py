"""
GeoVision AI - Deep Learning Super Resolution Mapping (SRM) Architecture
PyTorch implementation of SRM-Net: Residual in Residual Dense Network with Channel Attention (RCAN/RRDB-inspired)
Designed specifically for Sentinel-2 satellite imagery enhancement (10m -> 4m / 2.5m).
"""

import math
import torch
import torch.nn as nn
import torch.nn.functional as F


class ChannelAttention(nn.Module):
    """Squeeze-and-Excitation Channel Attention module for spectral band recalibration."""
    def __init__(self, channels: int, reduction: int = 16):
        super().__init__()
        self.avg_pool = nn.AdaptiveAvgPool2d(1)
        self.fc = nn.Sequential(
            nn.Linear(channels, channels // reduction, bias=False),
            nn.ReLU(inplace=True),
            nn.Linear(channels // reduction, channels, bias=False),
            nn.Sigmoid()
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        b, c, _, _ = x.size()
        y = self.avg_pool(x).view(b, c)
        y = self.fc(y).view(b, c, 1, 1)
        return x * y.expand_as(x)


class ResidualDenseBlock(nn.Module):
    """Residual Dense Block (RDB) allowing multi-level feature reuse."""
    def __init__(self, in_channels: int, growth_rate: int = 32):
        super().__init__()
        self.conv1 = nn.Conv2d(in_channels, growth_rate, 3, padding=1)
        self.conv2 = nn.Conv2d(in_channels + growth_rate, growth_rate, 3, padding=1)
        self.conv3 = nn.Conv2d(in_channels + 2 * growth_rate, growth_rate, 3, padding=1)
        self.conv4 = nn.Conv2d(in_channels + 3 * growth_rate, growth_rate, 3, padding=1)
        self.conv5 = nn.Conv2d(in_channels + 4 * growth_rate, in_channels, 3, padding=1)
        self.lrelu = nn.LeakyReLU(0.2, inplace=True)
        self.ca = ChannelAttention(in_channels)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        c1 = self.lrelu(self.conv1(x))
        c2 = self.lrelu(self.conv2(torch.cat([x, c1], 1)))
        c3 = self.lrelu(self.conv3(torch.cat([x, c1, c2], 1)))
        c4 = self.lrelu(self.conv4(torch.cat([x, c1, c2, c3], 1)))
        c5 = self.conv5(torch.cat([x, c1, c2, c3, c4], 1))
        ca = self.ca(c5)
        return x + ca * 0.2  # Residual scaling


class ResidualGroup(nn.Module):
    """Residual Group containing stacked Residual Dense Blocks."""
    def __init__(self, channels: int, num_blocks: int = 4, growth_rate: int = 32):
        super().__init__()
        self.blocks = nn.ModuleList([
            ResidualDenseBlock(channels, growth_rate=growth_rate)
            for _ in range(num_blocks)
        ])
        self.conv = nn.Conv2d(channels, channels, 3, padding=1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        res = x
        for block in self.blocks:
            res = block(res)
        return x + self.conv(res)


class SRMNet(nn.Module):
    """
    Satellite Super Resolution Mapping Network (SRM-Net).
    Supports 2x and 4x scale factors for RGB and multispectral Sentinel-2 imagery.
    
    Attributes:
        in_channels: Number of input spectral bands (typically 3 for RGB or 4 for RGB+NIR)
        out_channels: Number of output spectral bands
        scale_factor: Super resolution magnification factor (2 or 4)
        num_features: Number of intermediate feature channels
        num_groups: Number of residual feature extraction groups
    """
    def __init__(
        self,
        in_channels: int = 3,
        out_channels: int = 3,
        scale_factor: int = 4,
        num_features: int = 64,
        num_groups: int = 4,
        num_blocks: int = 3
    ):
        super().__init__()
        self.scale_factor = scale_factor
        self.in_channels = in_channels
        self.out_channels = out_channels

        # Shallow feature extraction
        self.entry_conv = nn.Conv2d(in_channels, num_features, kernel_size=3, padding=1)

        # Deep feature extraction with residual dense groups
        self.groups = nn.ModuleList([
            ResidualGroup(num_features, num_blocks=num_blocks, growth_rate=32)
            for _ in range(num_groups)
        ])
        self.trunk_conv = nn.Conv2d(num_features, num_features, kernel_size=3, padding=1)

        # Upsampling block via PixelShuffle (sub-pixel convolution)
        upsampling_layers = []
        if scale_factor == 2:
            upsampling_layers.extend([
                nn.Conv2d(num_features, num_features * 4, kernel_size=3, padding=1),
                nn.PixelShuffle(2),
                nn.PReLU()
            ])
        elif scale_factor == 4:
            for _ in range(2):
                upsampling_layers.extend([
                    nn.Conv2d(num_features, num_features * 4, kernel_size=3, padding=1),
                    nn.PixelShuffle(2),
                    nn.PReLU()
                ])
        else:
            raise ValueError(f"Unsupported scale factor {scale_factor}. Supported values are 2 and 4.")

        self.upsample = nn.Sequential(*upsampling_layers)

        # High-resolution reconstruction and refinement
        self.exit_conv1 = nn.Conv2d(num_features, num_features, kernel_size=3, padding=1)
        self.exit_lrelu = nn.LeakyReLU(0.2, inplace=True)
        self.exit_conv2 = nn.Conv2d(num_features, out_channels, kernel_size=3, padding=1)

        # Base bicubic skip connection for stable residual learning
        self._init_weights()

    def _init_weights(self):
        for m in self.modules():
            if isinstance(m, nn.Conv2d):
                nn.init.kaiming_normal_(m.weight, mode='fan_out', nonlinearity='relu')
                if m.bias is not None:
                    nn.init.zeros_(m.bias)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Base residual from interpolated input
        base = F.interpolate(x, scale_factor=self.scale_factor, mode='bicubic', align_corners=False)

        # Deep high-frequency residual extraction
        feat0 = self.entry_conv(x)
        feat = feat0
        for group in self.groups:
            feat = group(feat)
        trunk = self.trunk_conv(feat) + feat0

        up = self.upsample(trunk)
        residual = self.exit_conv2(self.exit_lrelu(self.exit_conv1(up)))

        # Output = base upsampled + learned high-resolution details
        out = base + residual
        return out


def create_model(scale_factor: int = 4, in_channels: int = 3, out_channels: int = 3) -> SRMNet:
    """Factory helper to construct SRM-Net."""
    return SRMNet(
        in_channels=in_channels,
        out_channels=out_channels,
        scale_factor=scale_factor,
        num_features=64,
        num_groups=4,
        num_blocks=3
    )
