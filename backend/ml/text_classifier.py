"""
Text Classification Engine — Hybrid ML + Heuristic Analysis
Combines a trained scikit-learn phishing classifier with comprehensive
rule-based feature extraction for high-accuracy threat detection.
"""

import re
import math
from typing import Dict, List, Tuple

from ml.phishing_model import predict_phishing

# ─────────────────────────────────────────────────
# Expanded Keyword Dictionaries
# ─────────────────────────────────────────────────

URGENCY_WORDS = [
    "urgent", "immediately", "asap", "right now", "expires", "deadline",
    "suspended", "blocked", "locked", "disabled", "limited time",
    "act now", "hurry", "final warning", "last chance", "don't delay",
    "time is running out", "within 24 hours", "within 48 hours",
    "respond immediately", "action required", "immediate action",
    "time sensitive", "expiring soon", "will be closed",
    "will be terminated", "will be deleted", "will be suspended",
    "before it's too late", "don't wait", "now or never",
    "offer expires", "today only", "hours left", "minutes left",
    "do it now", "without delay", "as soon as possible",
    "must act now", "final notice", "last warning",
]

CREDENTIAL_WORDS = [
    "password", "otp", "pin", "ssn", "social security", "credit card",
    "bank account", "cvv", "verify your", "confirm your", "update your",
    "login", "sign in", "credentials", "authentication",
    "enter your", "provide your", "submit your", "share your",
    "account number", "routing number", "debit card", "card number",
    "security code", "access code", "verification code",
    "date of birth", "mother's maiden", "security question",
    "tax id", "passport number", "driver's license",
    "billing information", "payment information", "bank details",
    "re-enter your", "re-verify", "reconfirm", "validate your",
    "authenticate your", "unlock your account",
]

FEAR_WORDS = [
    "unauthorized", "suspicious activity", "compromised", "hacked",
    "breach", "illegal", "arrested", "fine", "penalty", "court",
    "lawsuit", "investigation", "fraud detected", "security alert",
    "your account has been", "someone tried to", "unusual activity",
    "unauthorized access", "identity theft", "data breach",
    "compromised account", "security threat", "malware detected",
    "virus detected", "trojan", "ransomware", "cyber attack",
    "law enforcement", "legal action", "criminal charges",
    "warrant issued", "federal investigation", "irs notice",
    "tax violation", "compliance violation", "terms violation",
    "account flagged", "suspicious login", "unusual sign-in",
    "unrecognized device", "foreign access",
]

PAYMENT_WORDS = [
    "wire transfer", "bitcoin", "gift card", "western union", "money order",
    "payment", "deposit", "fee", "charge", "transaction", "refund",
    "prize", "winner", "lottery", "inheritance",
    "processing fee", "transfer fee", "handling fee", "customs fee",
    "shipping fee", "activation fee", "registration fee",
    "send money", "pay now", "make payment", "pay immediately",
    "cryptocurrency", "crypto wallet", "eth", "usdt",
    "moneygram", "cash app", "zelle", "venmo",
    "bank transfer", "direct deposit", "advance payment",
    "upfront payment", "initial deposit", "security deposit",
]

REWARD_WORDS = [
    "congratulations", "you've won", "winner", "selected", "lucky",
    "free", "bonus", "reward", "claim", "prize", "giveaway",
    "you have been chosen", "exclusively selected", "pre-approved",
    "guaranteed", "no cost", "complimentary", "gift",
    "jackpot", "sweepstakes", "raffle", "drawing",
    "cash prize", "million dollars", "thousand dollars",
    "claim your", "collect your", "receive your",
    "100% free", "risk free", "obligation free",
    "special offer", "exclusive offer", "limited offer",
]

IMPERSONATION_WORDS = [
    "dear customer", "dear valued customer", "dear account holder",
    "dear user", "dear member", "dear beneficiary",
    "this is your bank", "we are your", "official notice",
    "from the desk of", "on behalf of",
    "technical support", "customer service", "fraud department",
    "security department", "compliance department",
    "system administrator", "it department", "helpdesk",
]

# ─────────────────────────────────────────────────
# Suspicious Regex Patterns
# ─────────────────────────────────────────────────

SUSPICIOUS_PATTERNS = [
    (r'https?://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', "IP-based URL", 15),
    (r'(bit\.ly|tinyurl|t\.co|goo\.gl|short\.link|cutt\.ly|rb\.gy|is\.gd|v\.gd)', "Shortened URL", 12),
    (r'https?://[a-z0-9-]+\.(xyz|tk|ml|ga|cf|gq|top|club|buzz|icu|site|online)', "Suspicious TLD URL", 10),
    (r'(paypa[l1]|amaz[o0]n|g[o0]{2}gle|app[l1]e|micr[o0]s[o0]ft|faceb[o0]{2}k)', "Brand typosquatting", 20),
    (r'click\s*(here|below|this|the\s*link)', "Click-bait language", 8),
    (r'(reply|respond|act|click|call|contact)\s*(now|immediately|urgently|asap)', "Pressure to act", 10),
    (r'\b(ssn|cvv|pin|otp)\b', "Sensitive data request acronym", 15),
    (r'\$[\d,]+\.?\d*\s*(million|thousand|hundred)', "Large money reference", 10),
    (r'(won|win|winning|winner).*\$', "Prize/lottery claim", 12),
    (r'(account|access|service).*(suspend|terminat|clos|delet|deactivat|restrict)', "Account threat", 12),
    (r'(verify|confirm|validate|authenticate).*(identity|account|information|details)', "Verification demand", 10),
    (r'(https?://\S*login\S*|https?://\S*verify\S*|https?://\S*secure\S*)', "Suspicious URL keywords", 8),
    (r'dear\s+(sir|madam|customer|user|member|beneficiary|account\s*holder)', "Generic greeting", 6),
    (r'(do not|don\'t)\s*(ignore|disregard|delete)\s*this', "Anti-deletion pressure", 8),
    (r'(100%|completely|totally|absolutely)\s*(free|safe|secure|guaranteed|risk.free)', "Exaggerated claims", 8),
]


def extract_text_features(text: str) -> Dict:
    """Extract comprehensive NLP features from text for phishing/scam detection."""
    text_lower = text.lower()
    words = text_lower.split()
    text_len = len(text)

    # ── Keyword Category Matching ──
    urgency_matches = [w for w in URGENCY_WORDS if w in text_lower]
    cred_matches = [w for w in CREDENTIAL_WORDS if w in text_lower]
    fear_matches = [w for w in FEAR_WORDS if w in text_lower]
    payment_matches = [w for w in PAYMENT_WORDS if w in text_lower]
    reward_matches = [w for w in REWARD_WORDS if w in text_lower]
    impersonation_matches = [w for w in IMPERSONATION_WORDS if w in text_lower]

    # Normalized scores (0.0 — 1.0)
    urgency_score = min(len(urgency_matches) / 3.0, 1.0)
    credential_request = len(cred_matches) > 0
    fear_language = len(fear_matches) > 0
    payment_request = len(payment_matches) > 0

    # ── Regex Pattern Matching ──
    pattern_score = 0.0
    pattern_findings = []
    for pattern, label, weight in SUSPICIOUS_PATTERNS:
        if re.search(pattern, text_lower):
            pattern_score += weight
            pattern_findings.append(label)

    # ── Text Statistical Features ──
    has_url = bool(re.search(r'https?://\S+', text))
    has_shortened_url = bool(re.search(r'(bit\.ly|tinyurl|t\.co|goo\.gl|short\.link|cutt\.ly|rb\.gy)', text_lower))
    url_count = len(re.findall(r'https?://\S+', text))
    excessive_caps_ratio = sum(1 for c in text if c.isupper()) / max(text_len, 1)
    exclamation_count = text.count('!')
    question_count = text.count('?')

    # Spelling / obfuscation detection (l33tspeak)
    leet_substitutions = len(re.findall(r'[0-9]', re.sub(r'\b\d+\b', '', text)))

    # Sentence structure analysis
    sentences = re.split(r'[.!?]+', text)
    avg_sentence_len = sum(len(s.split()) for s in sentences) / max(len(sentences), 1)

    # All suspicious keywords found
    all_suspicious = list(set(
        urgency_matches + cred_matches + fear_matches +
        payment_matches + reward_matches + impersonation_matches
    ))

    # ── Heuristic Risk Score Calculation ──
    heuristic_score = 0.0

    # Category-based scoring
    heuristic_score += urgency_score * 20
    heuristic_score += min(len(cred_matches) / 2.0, 1.0) * 22
    heuristic_score += min(len(fear_matches) / 2.0, 1.0) * 18
    heuristic_score += min(len(payment_matches) / 2.0, 1.0) * 15
    heuristic_score += min(len(reward_matches) / 2.0, 1.0) * 12
    heuristic_score += min(len(impersonation_matches) / 2.0, 1.0) * 8

    # Pattern-based scoring
    heuristic_score += min(pattern_score, 40)

    # Statistical scoring
    heuristic_score += 5 if has_shortened_url else 0
    heuristic_score += 3 if has_url else 0
    heuristic_score += 5 if excessive_caps_ratio > 0.3 else 0
    heuristic_score += 3 if exclamation_count > 3 else 0
    heuristic_score += 3 if url_count > 2 else 0

    heuristic_score = min(max(heuristic_score, 0), 100)

    return {
        "urgency_score": round(urgency_score, 3),
        "credential_request": credential_request,
        "fear_language": fear_language,
        "payment_request": payment_request,
        "suspicious_keywords": all_suspicious[:15],
        "pattern_findings": pattern_findings[:10],
        "heuristic_score": round(heuristic_score, 1),
        "has_url": has_url,
        "has_shortened_url": has_shortened_url,
        "url_count": url_count,
        "excessive_caps_ratio": round(excessive_caps_ratio, 3),
        "exclamation_count": exclamation_count,
    }


def classify_text(text: str) -> Dict:
    """
    Classify text for phishing/scam using hybrid ML + heuristic analysis.
    
    Scoring strategy:
    - ML model prediction: 60% weight (trained classifier)
    - Heuristic analysis:  40% weight (rule-based features)
    - Final score: weighted combination, clamped to 0-100
    """
    features = extract_text_features(text)
    heuristic_score = features["heuristic_score"]

    # ── ML Model Prediction ──
    ml_result = predict_phishing(text)
    ml_probability = ml_result["probability"]  # 0.0 - 1.0
    ml_confidence = ml_result["confidence"]     # 0.0 - 1.0
    ml_score = ml_probability * 100             # scale to 0-100

    # ── Hybrid Score Combination ──
    # Weight ML more when it's confident, heuristics more when ML is unsure
    if ml_result["is_trained"] and ml_confidence > 0.3:
        ml_weight = 0.60
        heuristic_weight = 0.40
    elif ml_result["is_trained"]:
        ml_weight = 0.40
        heuristic_weight = 0.60
    else:
        # Fallback to pure heuristics if model failed
        ml_weight = 0.0
        heuristic_weight = 1.0

    risk_score = int(ml_score * ml_weight + heuristic_score * heuristic_weight)
    risk_score = min(max(risk_score, 0), 100)

    # ── Attack Type Classification ──
    attack_type = _classify_attack_type(risk_score, features)

    # ── Explanations ──
    explanations = _generate_explanations(features, ml_result, risk_score)

    # ── Recommendations ──
    recommendations = _generate_recommendations(risk_score, features)

    return {
        "risk_score": risk_score,
        "phishing_probability": round(risk_score / 100, 3),
        "attack_type": attack_type,
        "explanations": explanations,
        "recommendations": recommendations,
        "features": {
            **{k: v for k, v in features.items()
               if k not in ("heuristic_score", "pattern_findings")},
            "ml_probability": ml_probability,
            "ml_confidence": ml_confidence,
        },
        "analysis_method": "hybrid_ml_heuristic" if ml_result["is_trained"] else "heuristic_only",
    }


def _classify_attack_type(risk_score: int, features: Dict) -> str:
    """Determine the specific attack type based on score and features."""
    if risk_score <= 25:
        return "None Detected"

    if risk_score <= 45:
        return "Suspicious Content"

    # High risk — determine specific type
    scores = {
        "Phishing / Credential Harvesting": (
            (1 if features["credential_request"] else 0) * 3 +
            (1 if features["has_url"] else 0) * 2
        ),
        "Financial Fraud / Scam": (
            (1 if features["payment_request"] else 0) * 3 +
            len([k for k in features["suspicious_keywords"]
                 if k in REWARD_WORDS or k in PAYMENT_WORDS])
        ),
        "Social Engineering / Fear Tactics": (
            (1 if features["fear_language"] else 0) * 3 +
            features["urgency_score"] * 3
        ),
        "Identity Theft Attempt": (
            len([k for k in features["suspicious_keywords"]
                 if k in ["ssn", "social security", "passport number",
                          "driver's license", "date of birth", "tax id"]])
            * 4
        ),
    }

    best_type = max(scores, key=scores.get)
    if scores[best_type] > 0:
        return best_type

    return "Suspected Scam" if risk_score > 60 else "Suspicious Content"


def _generate_explanations(features: Dict, ml_result: Dict, risk_score: int) -> List[str]:
    """Generate detailed, human-readable explanations."""
    explanations = []

    # ML model insight
    if ml_result["is_trained"]:
        prob = ml_result["probability"]
        conf = ml_result["confidence"]
        if prob > 0.7:
            explanations.append(
                f"🤖 AI Model detected phishing patterns (confidence: {conf*100:.0f}%)"
            )
        elif prob > 0.4:
            explanations.append(
                f"🤖 AI Model found borderline suspicious patterns (confidence: {conf*100:.0f}%)"
            )
        elif risk_score <= 25:
            explanations.append(
                f"🤖 AI Model classified as likely legitimate (confidence: {conf*100:.0f}%)"
            )

    # Feature-based explanations
    if features["urgency_score"] > 0.3:
        explanations.append("⚠️ Urgency manipulation — pressure tactics to force immediate action")
    if features["credential_request"]:
        explanations.append("🔑 Credential harvesting attempt — requesting sensitive login or personal information")
    if features["fear_language"]:
        explanations.append("😰 Fear-based manipulation — using threats or alarming language to provoke panic")
    if features["payment_request"]:
        explanations.append("💳 Financial fraud indicators — requesting money, payments, or financial details")
    if features.get("has_shortened_url"):
        explanations.append("🔗 Shortened URL detected — may hide a malicious destination")
    if features.get("url_count", 0) > 2:
        explanations.append("🌐 Multiple URLs detected — excessive links may indicate phishing")
    elif features.get("has_url"):
        explanations.append("🌐 Contains URL — verify the link before clicking")
    if features.get("excessive_caps_ratio", 0) > 0.3:
        explanations.append("🔠 Excessive capitalization — common in scam messages")
    if features.get("exclamation_count", 0) > 3:
        explanations.append("❗ Excessive exclamation marks — sign of sensationalized content")

    # Pattern-based explanations
    for finding in features.get("pattern_findings", [])[:3]:
        explanations.append(f"🔍 Pattern detected: {finding}")

    if not explanations:
        explanations.append("✅ No significant threat indicators detected in the text")

    return explanations


def _generate_recommendations(risk_score: int, features: Dict) -> List[str]:
    """Generate actionable security recommendations."""
    recommendations = []

    if risk_score > 60:
        recommendations.append("🚫 Do NOT interact with this content or click any links")
        recommendations.append("📢 Report this to your service provider or IT security team")
        if features["credential_request"]:
            recommendations.append("🔐 Never share passwords, OTPs, PINs, or personal info via messages")
        if features["payment_request"]:
            recommendations.append("💰 Verify payment requests through official channels only")
        if features.get("has_url"):
            recommendations.append("🔗 Do not click any links — they may lead to phishing sites")
        recommendations.append("🗑️ Delete this message and block the sender")
    elif risk_score > 30:
        recommendations.append("⚠️ Exercise caution — verify the sender through official channels")
        recommendations.append("🔗 Do not click links without verifying the destination URL")
        recommendations.append("📞 Contact the organization directly using their official website or phone number")
    else:
        recommendations.append("✅ Content appears safe, but always remain vigilant")
        recommendations.append("🛡️ Keep your security software updated")

    return recommendations
