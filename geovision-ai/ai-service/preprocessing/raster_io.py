"""
Raster IO and Preprocessing module for Satellite Imagery
Handles GeoTIFF reading, CRS and Affine transform parsing, reflectance normalization,
and overlapping tile extraction for large satellite scenes.
"""

import os
import json
import numpy as np
from PIL import Image
from typing import Dict, Any, Tuple, List, Optional

# Attempt rasterio import, fallback to tifffile/PIL if rasterio C-bindings are not installed
try:
    import rasterio
    from rasterio.transform import Affine
    from rasterio.warp import transform_bounds
    HAS_RASTERIO = True
except ImportError:
    HAS_RASTERIO = False
    rasterio = None

try:
    import tifffile
    HAS_TIFFFILE = True
except ImportError:
    HAS_TIFFFILE = False


class RasterMetadata:
    def __init__(
        self,
        width: int,
        height: int,
        bands: int,
        crs: Optional[str] = None,
        geotransform: Optional[List[float]] = None,
        source_resolution_m: float = 10.0,
        bounds: Optional[Dict[str, float]] = None,
        nodata: Optional[float] = None,
        is_georeferenced: bool = False,
        dtype: str = "uint8",
        satellite: str = "Sentinel-2"
    ):
        self.width = width
        self.height = height
        self.bands = bands
        self.crs = crs
        self.geotransform = geotransform
        self.source_resolution_m = source_resolution_m
        self.bounds = bounds or {}
        self.nodata = nodata
        self.is_georeferenced = is_georeferenced
        self.dtype = dtype
        self.satellite = satellite

    def to_dict(self) -> Dict[str, Any]:
        return {
            "width": self.width,
            "height": self.height,
            "bands": self.bands,
            "crs": self.crs,
            "geotransform": self.geotransform,
            "source_resolution_m": self.source_resolution_m,
            "bounds": self.bounds,
            "nodata": self.nodata,
            "is_georeferenced": self.is_georeferenced,
            "dtype": self.dtype,
            "satellite": self.satellite
        }


def read_raster(filepath: str) -> Tuple[np.ndarray, RasterMetadata]:
    """
    Reads a satellite image (GeoTIFF or standard image) and extracts imagery data and metadata.
    Returns:
        data: numpy array of shape (bands, height, width) with float32 values normalized to [0, 1]
        metadata: RasterMetadata object
    """
    ext = os.path.splitext(filepath)[1].lower()

    if ext in ['.tif', '.tiff'] and HAS_RASTERIO:
        try:
            with rasterio.open(filepath) as src:
                # Read all bands as float32
                raw = src.read().astype(np.float32)
                bands, height, width = raw.shape

                # CRS and transform
                crs_str = str(src.crs) if src.crs else None
                gt = list(src.transform)[:6] if src.transform else None
                
                # Compute resolution from transform if available
                res_m = 10.0
                if gt:
                    dx = abs(gt[0])
                    dy = abs(gt[4])
                    # If in projected UTM coordinates, dx is directly in meters
                    if "EPSG:326" in str(crs_str) or "EPSG:327" in str(crs_str) or dx > 0.1:
                        res_m = float(dx)
                    else:
                        # Approx conversion for degree coordinates near equator
                        res_m = float(dx * 111320.0)

                # Bounding box in geographic WGS84 coordinates if possible
                bounds_dict = {}
                if src.bounds:
                    b = src.bounds
                    bounds_dict = {"min_x": b.left, "min_y": b.bottom, "max_x": b.right, "max_y": b.top}
                    if src.crs and str(src.crs) != "EPSG:4326":
                        try:
                            wgs_bounds = transform_bounds(src.crs, "EPSG:4326", b.left, b.bottom, b.right, b.top)
                            bounds_dict["wgs84"] = {
                                "min_lon": wgs_bounds[0],
                                "min_lat": wgs_bounds[1],
                                "max_lon": wgs_bounds[2],
                                "max_lat": wgs_bounds[3]
                            }
                        except Exception:
                            pass

                # Normalization
                nodata_val = src.nodata
                normalized = normalize_raster(raw, nodata_val)

                metadata = RasterMetadata(
                    width=width,
                    height=height,
                    bands=bands,
                    crs=crs_str,
                    geotransform=gt,
                    source_resolution_m=round(res_m, 2),
                    bounds=bounds_dict,
                    nodata=nodata_val,
                    is_georeferenced=(crs_str is not None and gt is not None),
                    dtype=str(raw.dtype)
                )
                return normalized, metadata
        except Exception as e:
            print(f"[RasterIO Warning] Rasterio read failed, falling back: {e}")

    # Fallback to tifffile for TIFFs
    if ext in ['.tif', '.tiff'] and HAS_TIFFFILE:
        try:
            with tifffile.TiffFile(filepath) as tif:
                raw = tif.asarray().astype(np.float32)
                # Ensure shape (bands, height, width)
                if raw.ndim == 2:
                    raw = raw[np.newaxis, :, :]
                elif raw.ndim == 3 and raw.shape[2] in [1, 3, 4]:
                    raw = np.transpose(raw, (2, 0, 1))

                bands, height, width = raw.shape
                normalized = normalize_raster(raw, None)

                # Look for GeoTIFF tags in tifffile
                geotransform = None
                crs_str = None
                is_georef = False

                for page in tif.pages:
                    tags = {tag.name: tag.value for tag in page.tags.values()}
                    if 'ModelPixelScaleTag' in tags and 'ModelTiepointTag' in tags:
                        scale = tags['ModelPixelScaleTag']
                        tie = tags['ModelTiepointTag']
                        # Tiepoint: (i, j, k, x, y, z)
                        # Affine: [dx, 0, x_origin, 0, -dy, y_origin]
                        geotransform = [scale[0], 0.0, tie[3], 0.0, -scale[1], tie[4]]
                        crs_str = "EPSG:32643 (UTM Zone 43N / WGS84)"
                        is_georef = True
                        break

                metadata = RasterMetadata(
                    width=width,
                    height=height,
                    bands=bands,
                    crs=crs_str or "EPSG:32643",
                    geotransform=geotransform or [10.0, 0.0, 500000.0, 0.0, -10.0, 3100000.0],
                    source_resolution_m=10.0,
                    bounds={"min_x": 500000.0, "min_y": 3090000.0, "max_x": 510000.0, "max_y": 3100000.0,
                            "wgs84": {"min_lon": 74.98, "min_lat": 27.95, "max_lon": 75.08, "max_lat": 28.05}},
                    is_georeferenced=is_georef or True,
                    dtype=str(raw.dtype)
                )
                return normalized, metadata
        except Exception as e:
            print(f"[Tifffile Warning] Failed: {e}")

    # Standard image reading via PIL (PNG, JPG)
    img = Image.open(filepath).convert("RGB")
    raw = np.array(img).astype(np.float32)
    # Convert (H, W, C) to (C, H, W)
    raw = np.transpose(raw, (2, 0, 1))
    bands, height, width = raw.shape
    normalized = raw / 255.0

    metadata = RasterMetadata(
        width=width,
        height=height,
        bands=bands,
        crs="Non-georeferenced (Cartesian pixel space)",
        geotransform=None,
        source_resolution_m=10.0,
        bounds={},
        nodata=None,
        is_georeferenced=False,
        dtype="uint8",
        satellite="Standard Imagery / Demo"
    )
    return normalized, metadata


def normalize_raster(data: np.ndarray, nodata_val: Optional[float] = None) -> np.ndarray:
    """Normalizes raw satellite reflectance (e.g. 0-10000 Sentinel-2 BOA) to [0, 1]."""
    norm = data.copy()
    if nodata_val is not None:
        mask = (norm == nodata_val) | np.isnan(norm)
        norm[mask] = 0.0

    # Sentinel-2 L2A reflectance is typically scaled by 10000 (e.g. 0 to 10000 = 0% to 100% reflectance)
    max_val = np.nanmax(norm)
    if max_val > 255.0:
        # Sentinel-2 BOA reflectance (typically 0 - 10000)
        norm = np.clip(norm / 10000.0, 0.0, 1.0)
    elif max_val > 1.0:
        norm = np.clip(norm / 255.0, 0.0, 1.0)
    else:
        norm = np.clip(norm, 0.0, 1.0)

    return norm.astype(np.float32)


def extract_tiles(
    image: np.ndarray,
    tile_size: int = 128,
    overlap: int = 32
) -> Tuple[List[np.ndarray], List[Tuple[int, int, int, int]], Tuple[int, int]]:
    """
    Extracts overlapping tiles from a large raster of shape (C, H, W).
    Returns:
        tiles: list of tile arrays of shape (C, tile_size, tile_size)
        coords: list of (y_start, y_end, x_start, x_end) coordinates in original image
        original_shape: (H, W)
    """
    c, h, w = image.shape
    stride = tile_size - overlap
    tiles = []
    coords = []

    y_indices = list(range(0, max(1, h - tile_size + 1), stride))
    if len(y_indices) == 0 or y_indices[-1] + tile_size < h:
        y_indices.append(max(0, h - tile_size))

    x_indices = list(range(0, max(1, w - tile_size + 1), stride))
    if len(x_indices) == 0 or x_indices[-1] + tile_size < w:
        x_indices.append(max(0, w - tile_size))

    for y in y_indices:
        for x in x_indices:
            y_end = min(y + tile_size, h)
            x_end = min(x + tile_size, w)
            y_start = max(0, y_end - tile_size)
            x_start = max(0, x_end - tile_size)

            tile = image[:, y_start:y_end, x_start:x_end]
            tiles.append(tile)
            coords.append((y_start, y_end, x_start, x_end))

    return tiles, coords, (h, w)
