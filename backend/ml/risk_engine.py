"""
Risk Scoring Engine
Combines signals from text NLP, URL analysis, OCR, and heuristics
into a unified risk score with explainable output.
"""

from typing import Dict, List, Optional


def calculate_combined_risk(
    text_score: Optional[float] = None,
    url_score: Optional[float] = None,
    image_score: Optional[float] = None,
    heuristic_score: Optional[float] = None,
) -> int:
    """
    Calculate weighted combined risk score.
    Weights: text=0.4, url=0.3, image=0.2, heuristics=0.1
    """
    scores = []
    weights = []

    if text_score is not None:
        scores.append(text_score)
        weights.append(0.4)
    if url_score is not None:
        scores.append(url_score)
        weights.append(0.3)
    if image_score is not None:
        scores.append(image_score)
        weights.append(0.2)
    if heuristic_score is not None:
        scores.append(heuristic_score)
        weights.append(0.1)

    if not scores:
        return 0

    # Normalize weights
    total_weight = sum(weights)
    normalized = [w / total_weight for w in weights]

    combined = sum(s * w for s, w in zip(scores, normalized))
    return min(max(int(combined), 0), 100)


def get_risk_level(score: int) -> str:
    """Classify risk score into levels."""
    if score <= 30:
        return "Safe"
    elif score <= 60:
        return "Suspicious"
    return "Dangerous"


def generate_risk_report(
    scan_type: str,
    risk_score: int,
    explanations: List[str],
    recommendations: List[str],
    features: Dict,
) -> Dict:
    """Generate a complete risk report with all analysis data."""
    risk_level = get_risk_level(risk_score)

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "scan_type": scan_type,
        "phishing_probability": round(risk_score / 100, 3),
        "explanations": explanations,
        "recommendations": recommendations,
        "features": features,
    }
