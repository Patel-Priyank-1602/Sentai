"""
API Routes — Unified Scan Endpoint
Single input field: auto-detects text, URL, email, phone.
Optional image upload for OCR + QR analysis.
"""

import re
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from models.schemas import ScanResponse, FeatureExtraction, RiskLevel, ScanType
from ml.text_classifier import classify_text
from ml.risk_engine import get_risk_level
from services.url_analyzer import analyze_url
from services.phone_analyzer import analyze_phone
from services.email_parser import parse_email

scan_router = APIRouter(tags=["scans"])

# In-memory storage (replace with Supabase in production)
scan_history = []


# ─────────────────────────────────────────────────
# Auto-detection logic
# ─────────────────────────────────────────────────

def _detect_input_type(text: str) -> str:
    """
    Auto-detect what kind of input the user pasted.
    Priority: URL > Email > Phone > Text
    """
    stripped = text.strip()

    # URL detection — starts with http/https or looks like a domain
    if re.match(r'^https?://', stripped, re.IGNORECASE):
        return "url"
    if re.match(r'^www\.', stripped, re.IGNORECASE):
        return "url"
    # Bare domain-like pattern (e.g., "google.com/path")
    if re.match(r'^[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}(/\S*)?$', stripped):
        return "url"

    # Email detection — has email headers (From:, Subject:, etc.)
    lines = stripped.split('\n')
    email_headers_found = 0
    for line in lines[:10]:  # Check first 10 lines for headers
        if re.match(r'^(from|to|subject|date|reply-to|cc|bcc|received|return-path):', line, re.IGNORECASE):
            email_headers_found += 1
    if email_headers_found >= 2:
        return "email"

    # Phone detection — mostly digits with optional +, -, (, ), spaces
    cleaned_digits = re.sub(r'[\s\-\(\)\+\.]', '', stripped)
    if cleaned_digits.isdigit() and 7 <= len(cleaned_digits) <= 15:
        return "phone"
    # Phone with country code like +1-555-0123
    if re.match(r'^\+?\d[\d\s\-\(\)\.]{6,18}$', stripped):
        return "phone"

    # Default: treat as text/message
    return "text"


def _build_response(scan_type: str, result: dict, input_data: str) -> ScanResponse:
    """Build a standardized ScanResponse from analysis results."""
    scan_id = str(uuid.uuid4())
    risk_score = result["risk_score"]

    features = FeatureExtraction(
        urgency_score=result.get("features", {}).get("urgency_score", 0.0),
        credential_request=result.get("features", {}).get("credential_request", False),
        suspicious_keywords=result.get("features", {}).get("suspicious_keywords", []),
        domain_entropy=result.get("features", {}).get("domain_entropy"),
        has_suspicious_tld=result.get("features", {}).get("has_suspicious_tld"),
        fear_language=result.get("features", {}).get("fear_language", False),
        payment_request=result.get("features", {}).get("payment_request", False),
    )

    response = ScanResponse(
        id=scan_id,
        risk_score=risk_score,
        risk_level=RiskLevel(get_risk_level(risk_score)),
        scan_type=ScanType(scan_type),
        attack_type=result.get("attack_type", "Unknown"),
        phishing_probability=result.get("phishing_probability", risk_score / 100),
        explanation=result.get("explanations", []),
        recommendations=result.get("recommendations", []),
        detected_type=scan_type,
        features=features,
        created_at=datetime.now(timezone.utc).isoformat(),
    )

    # Store in history
    scan_history.append({
        "id": scan_id,
        "scan_type": scan_type,
        "input_data": input_data[:200],
        "risk_score": risk_score,
        "attack_type": result.get("attack_type", "Unknown"),
        "created_at": response.created_at,
    })

    return response


# ─────────────────────────────────────────────────
# Unified scan endpoint — text input (auto-detect)
# ─────────────────────────────────────────────────

@scan_router.post("/scan", response_model=ScanResponse)
async def unified_scan(
    input_data: str = Form(None),
    file: Optional[UploadFile] = File(None),
):
    """
    Unified scan endpoint.
    - Send text in `input_data` → auto-detects URL, email, phone, or text
    - Send an image in `file` → runs OCR to extract text, then analyzes
    - Can send both: image + text (image takes priority)
    """

    # ── Image upload path ──
    if file is not None:
        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File too large (max 10MB)")

        # Try QR decode first
        from services.qr_decoder import decode_qr
        qr_result = decode_qr(contents)

        if qr_result.get("data"):
            qr_data = qr_result["data"]
            # If QR contains URL, analyze it
            if qr_data.startswith(("http://", "https://", "www.")):
                url_result = analyze_url(qr_data)
                url_result["explanations"].insert(0, f"📱 QR Code decoded → {qr_data}")
                return _build_response("qr", url_result, qr_data)
            # Otherwise analyze QR text
            text_result = classify_text(qr_data)
            text_result["explanations"].insert(0, f"📱 QR Code decoded → {qr_data}")
            return _build_response("qr", text_result, qr_data)

        # No QR found → try OCR
        from ocr.processor import extract_text_from_image
        ocr_result = extract_text_from_image(contents)
        extracted_text = ocr_result.get("text", "")
        ocr_error = ocr_result.get("error", "")

        if not extracted_text:
            error_msg = f"⚠️ OCR Error: {ocr_error}" if ocr_error else "⚠️ No text or QR code could be extracted from the image"
            return _build_response("image", {
                "risk_score": 0,
                "attack_type": "Unable to Extract Text",
                "explanations": [error_msg],
                "recommendations": ["Make sure Tesseract-OCR is installed on your system if you are running locally.", "Try uploading a clearer image with visible text or QR code."],
                "features": {},
            }, file.filename or "uploaded_image")

        # Analyze the extracted text
        result = classify_text(extracted_text)
        result["explanations"].insert(
            0, f"📷 Text extracted via OCR (confidence: {ocr_result.get('confidence', 'N/A')}%)"
        )
        return _build_response("image", result, extracted_text[:200])

    # ── Text input path ──
    if not input_data or not input_data.strip():
        raise HTTPException(status_code=400, detail="Please provide text input or upload an image")

    input_data = input_data.strip()

    # Auto-detect input type
    detected_type = _detect_input_type(input_data)

    if detected_type == "url":
        result = analyze_url(input_data)
    elif detected_type == "email":
        result = parse_email(input_data)
    elif detected_type == "phone":
        result = analyze_phone(input_data)
    else:
        result = classify_text(input_data)

    return _build_response(detected_type, result, input_data)


# ─────────────────────────────────────────────────
# History endpoints
# ─────────────────────────────────────────────────

@scan_router.get("/scans")
async def get_scan_history():
    """Get all scan history."""
    return sorted(scan_history, key=lambda x: x["created_at"], reverse=True)


@scan_router.get("/scans/{scan_id}")
async def get_scan(scan_id: str):
    """Get a specific scan by ID."""
    scan = next((s for s in scan_history if s["id"] == scan_id), None)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan


@scan_router.delete("/scans/{scan_id}")
async def delete_scan(scan_id: str):
    """Delete a scan from history."""
    global scan_history
    scan_history = [s for s in scan_history if s["id"] != scan_id]
    return {"status": "deleted"}
