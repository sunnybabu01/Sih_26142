"""
FastAPI Routes for GeoVision AI Processing Service
"""

import os
from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

from services.inference_service import InferenceService
from preprocessing.raster_io import read_raster
from validation.metrics import evaluate_super_resolution

router = APIRouter()
inference_service = InferenceService()


class InspectRequest(BaseModel):
    filepath: str = Field(..., description="Absolute path to satellite raster on disk")


class SuperResolveRequest(BaseModel):
    job_id: str
    input_path: str
    output_dir: str
    scale_factor: int = 4
    reference_path: Optional[str] = None
    tile_size: int = 128
    tile_overlap: int = 32


class ValidateRequest(BaseModel):
    enhanced_path: str
    reference_path: Optional[str] = None


@router.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "GeoVision AI Processing Engine",
        "device": str(inference_service.device),
        "version": "1.0.0"
    }


@router.get("/models")
def get_models():
    return inference_service.get_supported_models()


@router.post("/metadata/inspect")
def inspect_metadata(req: InspectRequest):
    if not os.path.exists(req.filepath):
        raise HTTPException(status_code=404, detail=f"File not found: {req.filepath}")
    try:
        _, metadata = read_raster(req.filepath)
        return {
            "success": True,
            "filepath": req.filepath,
            "metadata": metadata.to_dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to inspect metadata: {str(e)}")


@router.post("/super-resolve")
def run_super_resolution(req: SuperResolveRequest):
    if not os.path.exists(req.input_path):
        raise HTTPException(status_code=404, detail=f"Input file not found: {req.input_path}")
    
    try:
        result = inference_service.process_image(
            input_path=req.input_path,
            output_dir=req.output_dir,
            job_id=req.job_id,
            scale_factor=req.scale_factor,
            reference_path=req.reference_path,
            tile_size=req.tile_size,
            tile_overlap=req.tile_overlap
        )
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Super-resolution inference failed: {str(e)}")


@router.post("/validate")
def run_validation(req: ValidateRequest):
    if not os.path.exists(req.enhanced_path):
        raise HTTPException(status_code=404, detail=f"Enhanced file not found: {req.enhanced_path}")

    ref_data = None
    if req.reference_path and os.path.exists(req.reference_path):
        try:
            ref_raw, _ = read_raster(req.reference_path)
            ref_data = ref_raw[:3] if ref_raw.shape[0] >= 3 else None
        except Exception:
            pass

    try:
        enh_raw, _ = read_raster(req.enhanced_path)
        enh_data = enh_raw[:3] if enh_raw.shape[0] >= 3 else None
        report = evaluate_super_resolution(enhanced=enh_data, reference=ref_data)
        return {"success": True, "report": report}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")
