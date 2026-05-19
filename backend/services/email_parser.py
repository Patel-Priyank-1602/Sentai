"""
Email Parser — Enhanced
Analyzes email content including headers, body, sender information,
display name spoofing, domain mismatch, and header anomalies.
"""

import re
from typing import Dict, List
from ml.text_classifier import classify_text


# Domains commonly spoofed in phishing emails
COMMONLY_SPOOFED_BRANDS = [
    "paypal", "amazon", "apple", "microsoft", "google", "netflix",
    "facebook", "instagram", "linkedin", "twitter", "bank", "chase",
    "wells fargo", "citibank", "american express", "visa", "mastercard",
    "usps", "fedex", "ups", "dhl", "irs", "social security",
    "dropbox", "icloud", "outlook", "yahoo", "aol",
    "coinbase", "binance", "venmo", "zelle", "cashapp",
    "uber", "lyft", "doordash", "grubhub",
]

# Known free email providers (suspicious when posing as business)
FREE_EMAIL_PROVIDERS = {
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
    "aol.com", "mail.com", "protonmail.com", "icloud.com",
    "zoho.com", "yandex.com", "gmx.com", "mail.ru",
    "live.com", "msn.com", "inbox.com",
}


def _extract_email_address(sender_field: str) -> str:
    """Extract the actual email address from a From: field."""
    match = re.search(r'<(.+?)>', sender_field)
    if match:
        return match.group(1).strip().lower()
    # If no angle brackets, try to find email pattern
    match = re.search(r'[\w.+-]+@[\w.-]+\.\w+', sender_field)
    if match:
        return match.group(0).strip().lower()
    return sender_field.strip().lower()


def _extract_display_name(sender_field: str) -> str:
    """Extract the display name from a From: field."""
    if "<" in sender_field:
        return sender_field.split("<")[0].strip().strip('"').strip("'")
    return ""


def _get_domain(email: str) -> str:
    """Extract domain from email address."""
    if "@" in email:
        return email.split("@")[-1].strip(">").strip().lower()
    return ""


def parse_email(raw_email: str) -> Dict:
    """Parse and analyze email content for phishing indicators with enhanced detection."""
    lines = raw_email.strip().split("\n")

    # ── Extract Headers ──
    subject = ""
    sender = ""
    reply_to = ""
    return_path = ""
    x_mailer = ""
    received_headers = []
    headers_ended = False
    body_lines = []

    for line in lines:
        if not headers_ended:
            line_lower = line.lower().strip()
            if line_lower.startswith("subject:"):
                subject = line.split(":", 1)[1].strip()
            elif line_lower.startswith("from:"):
                sender = line.split(":", 1)[1].strip()
            elif line_lower.startswith("reply-to:"):
                reply_to = line.split(":", 1)[1].strip()
            elif line_lower.startswith("return-path:"):
                return_path = line.split(":", 1)[1].strip()
            elif line_lower.startswith("x-mailer:"):
                x_mailer = line.split(":", 1)[1].strip()
            elif line_lower.startswith("received:"):
                received_headers.append(line.split(":", 1)[1].strip())
            elif line.strip() == "":
                headers_ended = True
        else:
            body_lines.append(line)

    body = "\n".join(body_lines) if body_lines else raw_email

    # ── Analyze Body Text with Hybrid ML + Heuristics ──
    text_result = classify_text(body)

    explanations = list(text_result["explanations"])
    risk_score = text_result["risk_score"]

    # ── Sender Analysis ──
    sender_email = _extract_email_address(sender)
    sender_display = _extract_display_name(sender)
    sender_domain = _get_domain(sender_email)

    # Display name spoofing detection
    if sender_display:
        display_lower = sender_display.lower()
        for brand in COMMONLY_SPOOFED_BRANDS:
            if brand in display_lower:
                # Check if the actual email domain matches
                if brand.replace(" ", "") not in sender_email:
                    risk_score = min(risk_score + 25, 100)
                    explanations.append(
                        f"🎭 Display name spoofing: claims to be '{sender_display}' "
                        f"but actual email is '{sender_email}'"
                    )
                    break

    # Free email provider impersonating business
    if sender_domain in FREE_EMAIL_PROVIDERS:
        if sender_display and any(b in sender_display.lower() for b in COMMONLY_SPOOFED_BRANDS):
            risk_score = min(risk_score + 20, 100)
            explanations.append(
                f"📧 Business impersonation from free email provider ({sender_domain})"
            )

    # ── Reply-To Mismatch ──
    if reply_to and sender:
        reply_email = _extract_email_address(reply_to)
        reply_domain = _get_domain(reply_email)
        if sender_domain and reply_domain and sender_domain != reply_domain:
            risk_score = min(risk_score + 18, 100)
            explanations.append(
                f"📨 Reply-To domain mismatch: sender is @{sender_domain} but reply goes to @{reply_domain}"
            )

    # ── Return-Path Mismatch ──
    if return_path:
        return_email = _extract_email_address(return_path)
        return_domain = _get_domain(return_email)
        if sender_domain and return_domain and sender_domain != return_domain:
            risk_score = min(risk_score + 10, 100)
            explanations.append(
                f"↩️ Return-Path mismatch: bounced emails go to @{return_domain}, not @{sender_domain}"
            )

    # ── Subject Line Analysis ──
    if subject:
        subject_lower = subject.lower()
        urgency_subjects = [
            "urgent", "action required", "suspended", "verify",
            "confirm", "security alert", "unauthorized", "locked",
            "final notice", "immediate action", "act now",
            "your account", "important update", "limited time",
        ]
        urgent_matches = [w for w in urgency_subjects if w in subject_lower]
        if urgent_matches:
            risk_score = min(risk_score + min(len(urgent_matches) * 8, 20), 100)
            explanations.append(
                f"📧 Alarming subject line: '{subject}' — classic phishing tactic"
            )

        # RE: / FW: prefix on unsolicited email (fake thread)
        if re.match(r'^(re:|fw:|fwd:)\s', subject_lower) and not body_lines:
            risk_score = min(risk_score + 8, 100)
            explanations.append("📧 Fake reply/forward prefix — creates false familiarity")

    # ── Body Analysis Extras ──
    # Check for hidden text / HTML tricks
    if re.search(r'<div\s+style="[^"]*display:\s*none', body, re.IGNORECASE):
        risk_score = min(risk_score + 15, 100)
        explanations.append("👻 Hidden HTML content detected — may be hiding malicious elements")

    # Excessive links in body
    url_count = len(re.findall(r'https?://\S+', body))
    if url_count > 5:
        risk_score = min(risk_score + 10, 100)
        explanations.append(f"🔗 Excessive links ({url_count}) in email body")

    # Generic greeting detection
    if re.search(r'dear\s+(sir|madam|customer|user|member|account\s*holder|valued)', body.lower()):
        risk_score = min(risk_score + 5, 100)
        explanations.append("👤 Generic greeting used — legitimate services usually address you by name")

    # ── Attack Type ──
    attack_type = text_result["attack_type"]
    has_spoofing = "spoof" in " ".join(explanations).lower() or "mismatch" in " ".join(explanations).lower()
    if risk_score > 60 and has_spoofing:
        attack_type = "Email Spoofing / Phishing"
    elif risk_score > 60 and text_result["features"].get("credential_request"):
        attack_type = "Phishing / Credential Harvesting Email"

    # ── Recommendations ──
    recommendations = list(text_result["recommendations"])
    if risk_score > 50:
        recommendations.append("📧 Check the actual sender email address (not just the display name)")
        recommendations.append("📎 Do not download attachments from suspicious emails")
        recommendations.append("🔗 Hover over links to preview URLs before clicking")
        if has_spoofing:
            recommendations.append("🎭 This email shows signs of spoofing — contact the sender through official channels")

    return {
        "risk_score": min(risk_score, 100),
        "phishing_probability": round(min(risk_score, 100) / 100, 3),
        "attack_type": attack_type,
        "explanations": explanations,
        "recommendations": recommendations,
        "features": {
            **text_result["features"],
            "subject": subject,
            "sender": sender,
            "sender_email": sender_email,
            "sender_domain": sender_domain,
            "reply_to": reply_to,
            "has_reply_to_mismatch": (
                reply_to != "" and sender != "" and
                _get_domain(_extract_email_address(reply_to)) != sender_domain
            ),
            "has_display_name_spoofing": (
                sender_display != "" and
                any(b in sender_display.lower() for b in COMMONLY_SPOOFED_BRANDS) and
                not any(b.replace(" ", "") in sender_email for b in COMMONLY_SPOOFED_BRANDS)
            ),
            "url_count_in_body": url_count,
        },
    }
