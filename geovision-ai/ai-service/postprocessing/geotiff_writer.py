"""
Postprocessing and GeoTIFF Exporter for Super-Resolution Outputs
Handles tile stitching with Hann window blending, affine transform scaling,
and dual export of GeoTIFF and web preview PNG.
"""

import os
import numpy as np
from PIL import Image
from typing import List, Tuple, Dict, Any, Optional

try:
    import rasterio
    from rasterio.transform import Affine
    HAS_RASTERIO = True
except ImportError:
    HAS_RASTERIO = False
    rasterio = None

try:
    import tifffile
    HAS_TIFFFILE = True
except ImportError:
    HAS_TIFFFILE = False


def create_hann_window_2d(h: int, w: int) -> np.ndarray:
    """Creates a 2D Hann window for smooth tile blending and edge artifact suppression."""
    wy = np.hanning(h)
    wx = np.hanning(w)
    window = np.outer(wy, wx)
    # Ensure center is not zero and edge minimum threshold
    window = np.maximum(window, 1e-4)
    return window.astype(np.float32)


def stitch_tiles(
    tiles: List[np.ndarray],
    coords: List[Tuple[int, int, int, int]],
    target_shape: Tuple[int, int],
    scale_factor: int = 4
) -> np.ndarray:
    """
    Stitches super-resolved tiles into full resolution image with cosine/Hann window blending.
    
    Args:
        tiles: list of super-resolved tiles, each of shape (C, tile_h * scale, tile_w * scale)
        coords: original coordinates (y_start, y_end, x_start, x_end)
        target_shape: original (H, W)
        scale_factor: 2 or 4
    """
    c = tiles[0].shape[0]
    out_h = target_shape[0] * scale_factor
    out_w = target_shape[1] * scale_factor

    accumulator = np.zeros((c, out_h, out_w), dtype=np.float32)
    weights = np.zeros((1, out_h, out_w), dtype=np.float32)

    for tile, (y0, y1, x0, x1) in zip(tiles, coords):
        ty0, ty1 = y0 * scale_factor, y1 * scale_factor
        tx0, tx1 = x0 * scale_factor, x1 * scale_factor
        th, tw = ty1 - ty0, tx1 - tx0

        window = create_hann_window_2d(th, tw)[np.newaxis, :, :]

        accumulator[:, ty0:ty1, tx0:tx1] += tile * window
        weights[:, ty0:ty1, tx0:tx1] += window

    # Avoid division by zero
    weights = np.maximum(weights, 1e-5)
    stitched = accumulator / weights
    return np.clip(stitched, 0.0, 1.0)


def save_enhanced_geotiff(
    data: np.ndarray,
    output_geotiff_path: str,
    output_preview_path: str,
    metadata: Dict[str, Any],
    scale_factor: int = 4
) -> Dict[str, Any]:
    """
    Saves the super-resolved output as a valid GeoTIFF with scaled geospatial transform,
    plus generates an optimized 8-bit PNG preview for the web application UI.
    """
    os.makedirs(os.path.dirname(output_geotiff_path), exist_ok=True)
    os.makedirs(os.path.dirname(output_preview_path), exist_ok=True)

    c, out_h, out_w = data.shape

    # Update geotransform
    old_gt = metadata.get("geotransform")
    new_gt = None
    crs = metadata.get("crs") or "EPSG:32643"

    if old_gt and len(old_gt) >= 6:
        # Affine transform: [dx, 0, x0, 0, dy, y0]
        # dx_new = dx / scale, dy_new = dy / scale, origin remains same
        dx_new = old_gt[0] / scale_factor
        dy_new = old_gt[4] / scale_factor
        new_gt = [dx_new, old_gt[1], old_gt[2], old_gt[3], dy_new, old_gt[5]]

    # 1. Write GeoTIFF
    saved_geotiff = False
    if HAS_RASTERIO and old_gt:
        try:
            transform = Affine(new_gt[0], new_gt[1], new_gt[2], new_gt[3], new_gt[4], new_gt[5])
            # Save 32-bit float reflectance GeoTIFF
            with rasterio.open(
                output_geotiff_path,
                'w',
                driver='GTiff',
                height=out_h,
                width=out_w,
                count=c,
                dtype='float32',
                crs=crs,
                transform=transform,
                compress='lzw'
            ) as dst:
                for band_idx in range(c):
                    dst.write(data[band_idx], band_idx + 1)
            saved_geotiff = True
        except Exception as e:
            print(f"[GeoTIFF Writer] Rasterio write fallback: {e}")

    if not saved_geotiff and HAS_TIFFFILE:
        try:
            # Use tifffile with GeoTIFF model tags
            tags = {}
            if new_gt:
                # ModelPixelScaleTag: (dx, dy, dz)
                pixel_scale = (abs(new_gt[0]), abs(new_gt[4]), 0.0)
                # ModelTiepointTag: (i, j, k, x, y, z)
                tie_point = (0.0, 0.0, 0.0, new_gt[2], new_gt[5], 0.0)
                tags[33550] = pixel_scale
                tags[33922] = tie_point

            # Transpose (C, H, W) to (H, W, C) for standard TIFF
            out_img = np.transpose((data * 255.0).astype(np.uint8), (1, 2, 0))
            tifffile.imwrite(
                output_geotiff_path,
                out_img,
                photometric='rgb' if c == 3 else 'minisblack',
                extratags=[(33550, 'd', 3, (abs(new_gt[0]), abs(new_gt[4]), 0.0), False),
                           (33922, 'd', 6, (0.0, 0.0, 0.0, new_gt[2], new_gt[5], 0.0), False)] if new_gt else None
            )
            saved_geotiff = True
        except Exception as e:
            print(f"[Tifffile Writer] Failed: {e}")

    # Fallback if neither succeeded: save 8-bit image with .tif extension
    if not saved_geotiff:
        out_img = np.transpose((data * 255.0).astype(np.uint8), (1, 2, 0))
        if c == 1:
            out_img = out_img.squeeze()
        Image.fromarray(out_img).save(output_geotiff_path)

    # 2. Save web preview PNG (3-channel RGB, uint8, contrast stretched)
    if c >= 3:
        # Use first 3 bands as RGB
        rgb = np.transpose(data[:3], (1, 2, 0))
    elif c == 1:
        # Grayscale to RGB
        rgb = np.repeat(data[0, :, :, np.newaxis], 3, axis=2)
    else:
        rgb = np.zeros((out_h, out_w, 3), dtype=np.float32)
        for i in range(min(c, 3)):
            rgb[:, :, i] = data[i]

    # Percentile 2%-98% linear stretch for clear satellite visual contrast
    p2, p98 = np.percentile(rgb, (2, 98))
    if p98 > p2:
        rgb_stretched = np.clip((rgb - p2) / (p98 - p2), 0.0, 1.0)
    else:
        rgb_stretched = rgb

    preview_uint8 = (rgb_stretched * 255.0).astype(np.uint8)
    Image.fromarray(preview_uint8).save(output_preview_path, format="PNG", optimize=True)

    target_res = round(metadata.get("source_resolution_m", 10.0) / scale_factor, 2)

    return {
        "geotiff_path": output_geotiff_path,
        "preview_path": output_preview_path,
        "output_width": out_w,
        "output_height": out_h,
        "bands": c,
        "crs": crs,
        "new_geotransform": new_gt,
        "target_resolution_m": target_res,
        "georeferenced": new_gt is not None
    }
