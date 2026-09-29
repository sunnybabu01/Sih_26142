"""
GeoVision AI - Main FastAPI Application Server
Runs on port 8000 for Super Resolution Mapping Deep Learning Service.
"""

import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.api import router as api_router

app = FastAPI(
    title="GeoVision AI - Satellite Super Resolution Mapping (SRM) Engine",
    description="Deep Learning API for Sentinel-2 10m to sub-4m Super Resolution Mapping with Geospatial Metadata Preservation",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")

@app.get("/")
def root():
    return {
        "platform": "GeoVision AI",
        "description": "Satellite Image Super Resolution Mapping (SRM) AI Service",
        "endpoints": {
            "health": "/api/health",
            "models": "/api/models",
            "inspect_metadata": "POST /api/metadata/inspect",
            "super_resolve": "POST /api/super-resolve",
            "validate": "POST /api/validate",
            "docs": "/docs"
        }
    }


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"===========================================================")
    print(f"  GeoVision AI Processing Engine Starting on Port {port}")
    print(f"  Interactive OpenAPI Docs: http://localhost:{port}/docs")
    print(f"===========================================================")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
