"""
Sentinel AI — FastAPI Backend
AI-Powered Multimodal Scam & Phishing Detection
"""

import uuid
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from api.routes import scan_router
from core.config import settings

app = FastAPI(
    title="Sentinel AI API",
    description="AI-powered multimodal scam and phishing detection API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(scan_router, prefix="/api")


@app.get("/")
async def root():
    return {
        "name": "Sentinel AI API",
        "version": "1.0.0",
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "ai_engine": "active"}
