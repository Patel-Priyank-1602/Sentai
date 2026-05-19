"""Pydantic models for request/response validation"""

from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum
from datetime import datetime


class ScanType(str, Enum):
    TEXT = "text"
    URL = "url"
    IMAGE = "image"
    EMAIL = "email"
    QR = "qr"
    PHONE = "phone"


class RiskLevel(str, Enum):
    SAFE = "Safe"
    SUSPICIOUS = "Suspicious"
    DANGEROUS = "Dangerous"


class FeatureExtraction(BaseModel):
    urgency_score: float = Field(default=0.0, ge=0.0, le=1.0)
    credential_request: bool = False
    suspicious_keywords: List[str] = []
    domain_entropy: Optional[float] = None
    has_suspicious_tld: Optional[bool] = None
    fear_language: bool = False
    payment_request: bool = False


class ScanResponse(BaseModel):
    id: str
    risk_score: int = Field(ge=0, le=100)
    risk_level: RiskLevel
    scan_type: ScanType
    attack_type: str
    phishing_probability: float = Field(ge=0.0, le=1.0)
    explanation: List[str]
    recommendations: List[str]
    detected_type: str = ""  # What the auto-detection classified the input as
    features: FeatureExtraction
    created_at: str


class ScanHistoryItem(BaseModel):
    id: str
    scan_type: ScanType
    input_data: str
    risk_score: int
    attack_type: str
    created_at: str
