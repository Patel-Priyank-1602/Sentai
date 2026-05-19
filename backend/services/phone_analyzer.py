"""
Phone Number Analyzer — Enhanced
Analyzes phone numbers for scam indicators using area code databases,
pattern analysis, and international risk assessment.
"""

import re
from typing import Dict, List


# High-risk area codes (US-centric) — premium rate, Caribbean, known scam origins
HIGH_RISK_AREA_CODES = {
    # Premium rate numbers
    "900": "Premium rate number — often used for expensive pay-per-minute scams",
    "976": "Premium rate number — pay-per-call service, frequently abused",
    # Caribbean fraud hotspots (one-ring scam / Wangiri)
    "809": "Dominican Republic — known for one-ring callback scams",
    "829": "Dominican Republic — associated with callback fraud",
    "849": "Dominican Republic — associated with callback fraud",
    "284": "British Virgin Islands — linked to advance-fee fraud calls",
    "876": "Jamaica — heavily associated with lottery and romance scams",
    "473": "Grenada — known for one-ring callback scams",
    "649": "Turks and Caicos — linked to phone fraud operations",
    "242": "Bahamas — associated with callback scams",
    "246": "Barbados — linked to international scam calls",
    "268": "Antigua and Barbuda — associated with fraud calls",
    "345": "Cayman Islands — linked to financial scams",
    "664": "Montserrat — associated with callback fraud",
    "721": "Sint Maarten — linked to phone scams",
    "758": "Saint Lucia — associated with fraud calls",
    "767": "Dominica — linked to callback scams",
    "784": "Saint Vincent — associated with phone fraud",
    "868": "Trinidad and Tobago — linked to scam operations",
    "869": "Saint Kitts and Nevis — associated with fraud",
}

# Moderate risk area codes
MODERATE_RISK_AREA_CODES = {
    "710": "US Government reserved — may indicate spoofing",
    "500": "Personal communication services — sometimes abused",
    "521": "Personal communication services — sometimes abused",
    "522": "Personal communication services — sometimes abused",
    "533": "Personal communication services — sometimes abused",
    "544": "Personal communication services — sometimes abused",
}

# Known scam international prefixes
HIGH_RISK_COUNTRY_CODES = {
    "+234": "Nigeria — frequently associated with advance-fee fraud",
    "+233": "Ghana — associated with romance and lottery scams",
    "+225": "Ivory Coast — linked to phone scams",
    "+228": "Togo — associated with fraud calls",
    "+222": "Mauritania — linked to scam operations",
    "+231": "Liberia — associated with fraud calls",
    "+252": "Somalia — linked to scam calls",
    "+373": "Moldova — associated with premium rate fraud",
    "+375": "Belarus — linked to callback scams",
    "+381": "Serbia — associated with phone fraud",
}

# Known toll-free prefixes (less risky but watch for spoofing)
TOLL_FREE_PREFIXES = {"800", "833", "844", "855", "866", "877", "888"}

# VoIP / Testing indicators
VOIP_PATTERNS = ["555", "1234567", "0000000", "9999999"]


def analyze_phone(phone: str) -> Dict:
    """Analyze a phone number for scam indicators with enhanced detection."""
    # Clean the number
    original = phone.strip()
    cleaned = re.sub(r'[^\d+]', '', phone)

    explanations = []
    recommendations = []
    risk_score = 5  # Very low base risk
    findings = []

    # ── International Country Code Check ──
    for prefix, desc in HIGH_RISK_COUNTRY_CODES.items():
        if cleaned.startswith(prefix.replace("+", "")):
            risk_score += 35
            explanations.append(f"🌍 High-risk country code {prefix} — {desc}")
            findings.append("high_risk_country")
            break

    # ── US Area Code Check ──
    # Extract area code (handle +1, 1, or direct 10-digit)
    us_number = cleaned
    if us_number.startswith("+1"):
        us_number = us_number[2:]
    elif us_number.startswith("1") and len(us_number) == 11:
        us_number = us_number[1:]

    if len(us_number) >= 3:
        area_code = us_number[:3]

        # High risk
        if area_code in HIGH_RISK_AREA_CODES:
            risk_score += 45
            explanations.append(f"⚠️ Area code {area_code} — {HIGH_RISK_AREA_CODES[area_code]}")
            findings.append("high_risk_area_code")

        # Moderate risk
        elif area_code in MODERATE_RISK_AREA_CODES:
            risk_score += 20
            explanations.append(f"📱 Area code {area_code} — {MODERATE_RISK_AREA_CODES[area_code]}")
            findings.append("moderate_risk_area_code")

        # Toll-free (could be legit or spoofed)
        elif area_code in TOLL_FREE_PREFIXES:
            risk_score += 5
            explanations.append(f"📞 Toll-free number ({area_code}) — commonly spoofed by scammers")
            findings.append("toll_free")

    # ── VoIP / Test Number Detection ──
    for pattern in VOIP_PATTERNS:
        if pattern in cleaned:
            risk_score += 15
            explanations.append("📱 Number pattern suggests VoIP, temporary, or test number")
            findings.append("voip_pattern")
            break

    # ── Number Length Analysis ──
    digits_only = re.sub(r'[^\d]', '', cleaned)
    if len(digits_only) < 7:
        risk_score += 20
        explanations.append(f"📏 Unusually short number ({len(digits_only)} digits) — may be a short code or premium service")
        findings.append("short_number")
    elif len(digits_only) > 15:
        risk_score += 18
        explanations.append(f"📏 Unusually long number ({len(digits_only)} digits) — likely spoofed or malformed")
        findings.append("long_number")

    # ── Repeating Pattern Detection ──
    if len(digits_only) >= 6:
        # Check for repeating digits (e.g., 1111111)
        if len(set(digits_only[-7:])) <= 2:
            risk_score += 12
            explanations.append("🔢 Repeating digit pattern — often indicates a spoofed number")
            findings.append("repeating_pattern")

        # Check for sequential digits (e.g., 1234567)
        sequential_up = all(int(digits_only[i]) == int(digits_only[i-1]) + 1
                           for i in range(max(1, len(digits_only)-5), len(digits_only))
                           if digits_only[i].isdigit() and digits_only[i-1].isdigit())
        if sequential_up:
            risk_score += 10
            explanations.append("🔢 Sequential digit pattern — likely a test or fake number")
            findings.append("sequential_pattern")

    # ── International Number (informational) ──
    if cleaned.startswith("+") and "high_risk_country" not in findings:
        explanations.append("🌍 International number detected — exercise caution with unknown international callers")

    # ── No Findings ──
    if not explanations:
        explanations.append("ℹ️ No significant risk indicators found for this number")

    # Clamp score
    risk_score = min(max(risk_score, 0), 100)

    # ── Attack Type ──
    attack_type = "None Detected"
    if risk_score > 60:
        if "high_risk_area_code" in findings:
            attack_type = "One-Ring / Callback Scam Number"
        elif "high_risk_country" in findings:
            attack_type = "International Fraud / Scam Number"
        else:
            attack_type = "Suspected Scam / Robocall Number"
    elif risk_score > 30:
        attack_type = "Suspicious Number"

    # ── Recommendations ──
    if risk_score > 60:
        recommendations.append("🚫 Do NOT call back or respond to this number")
        recommendations.append("📵 Block the number immediately on your phone")
        recommendations.append("📢 Report it to your carrier and the FTC (reportfraud.ftc.gov)")
        if "high_risk_area_code" in findings:
            recommendations.append("⚠️ This area code is a known scam hotspot — never return calls from it")
    elif risk_score > 30:
        recommendations.append("⚠️ Exercise caution — verify the caller's identity before sharing any info")
        recommendations.append("📞 Look up the number on a reverse phone lookup service")
        recommendations.append("🚫 Never share financial or personal information over the phone")
    else:
        recommendations.append("✅ Number appears normal, but stay alert for scam call tactics")
        recommendations.append("📞 If unsolicited, verify the caller by calling the organization directly")

    return {
        "risk_score": risk_score,
        "phishing_probability": round(risk_score / 100, 3),
        "attack_type": attack_type,
        "explanations": explanations,
        "recommendations": recommendations,
        "features": {
            "cleaned_number": cleaned,
            "number_length": len(digits_only),
            "is_international": cleaned.startswith("+"),
            "findings": findings,
        },
    }
