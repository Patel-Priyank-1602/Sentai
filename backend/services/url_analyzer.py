"""
URL Analysis Engine — Enhanced
Analyzes URLs for phishing indicators using domain entropy,
typosquatting detection, TLD analysis, Levenshtein distance,
and structural URL heuristics.
"""

import re
import math
import string
from typing import Dict, List, Optional
from urllib.parse import urlparse, parse_qs, unquote

try:
    import tldextract
except ImportError:
    tldextract = None

try:
    import validators
except ImportError:
    validators = None

# Suspicious TLDs commonly used in phishing
SUSPICIOUS_TLDS = {
    "xyz", "top", "club", "online", "site", "icu", "buzz", "tk",
    "ml", "ga", "cf", "gq", "wang", "work", "click", "link",
    "info", "bid", "trade", "webcam", "stream", "download",
    "racing", "win", "review", "country", "cricket", "science",
    "party", "date", "faith", "accountant", "loan", "men",
    "zip", "mov", "ninja", "rocks", "church", "marketing",
}

# Known legitimate domains for comparison
LEGITIMATE_DOMAINS = {
    "google.com", "facebook.com", "amazon.com", "apple.com",
    "microsoft.com", "paypal.com", "netflix.com", "instagram.com",
    "twitter.com", "linkedin.com", "github.com", "youtube.com",
    "wikipedia.org", "reddit.com", "stackoverflow.com",
    "dropbox.com", "slack.com", "zoom.us", "spotify.com",
    "adobe.com", "salesforce.com", "outlook.com", "live.com",
    "office.com", "icloud.com", "chase.com", "bankofamerica.com",
    "wellsfargo.com", "citibank.com", "usps.com", "fedex.com",
    "ups.com", "dhl.com", "ebay.com", "walmart.com",
    "target.com", "bestbuy.com", "stripe.com",
}

# Common brand names used in typosquatting
BRAND_NAMES = [
    "google", "facebook", "amazon", "apple", "microsoft", "paypal",
    "netflix", "instagram", "twitter", "linkedin", "bank", "chase",
    "wells", "citi", "amex", "visa", "mastercard", "walmart",
    "target", "bestbuy", "costco", "ebay", "dropbox", "icloud",
    "outlook", "yahoo", "aol", "usps", "fedex", "ups", "dhl",
    "whatsapp", "telegram", "signal", "zoom", "slack", "discord",
    "venmo", "zelle", "cashapp", "coinbase", "binance", "robinhood",
]

# URL shortener domains
URL_SHORTENERS = {
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "short.link",
    "cutt.ly", "rb.gy", "is.gd", "v.gd", "ow.ly", "buff.ly",
    "tiny.cc", "lnkd.in", "soo.gd", "s2r.co", "clck.ru",
    "qr.ae", "adf.ly", "bc.vc", "j.mp", "surl.li",
}

# Suspicious URL path keywords
SUSPICIOUS_PATH_WORDS = [
    "login", "signin", "sign-in", "verify", "verification",
    "secure", "security", "account", "update", "confirm",
    "authenticate", "auth", "validate", "banking", "wallet",
    "password", "credential", "reset", "recover", "unlock",
    "suspended", "blocked", "restricted", "reactivate",
]


def calculate_entropy(text: str) -> float:
    """Calculate Shannon entropy of a string."""
    if not text:
        return 0.0
    freq = {}
    for c in text:
        freq[c] = freq.get(c, 0) + 1
    length = len(text)
    entropy = -sum((count / length) * math.log2(count / length) for count in freq.values())
    return round(entropy, 3)


def levenshtein_distance(s1: str, s2: str) -> int:
    """Calculate the Levenshtein distance between two strings."""
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)
    prev_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        curr_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = prev_row[j + 1] + 1
            deletions = curr_row[j] + 1
            substitutions = prev_row[j] + (c1 != c2)
            curr_row.append(min(insertions, deletions, substitutions))
        prev_row = curr_row
    return prev_row[-1]


def detect_typosquatting(domain: str) -> List[str]:
    """Detect if domain is typosquatting a known brand using Levenshtein distance."""
    findings = []
    domain_lower = domain.lower().replace("-", "").replace("_", "")

    for brand in BRAND_NAMES:
        # Direct inclusion check
        if brand in domain_lower and f"{brand}.com" != domain_lower and f"{brand}.net" != domain_lower and f"{brand}.org" != domain_lower:
            # Check for character substitution (e.g., amaz0n, paypa1)
            if any(c.isdigit() for c in domain_lower):
                findings.append(f"Possible typosquatting of '{brand}' with character substitution (l33tspeak)")
            elif "-" in domain.lower():
                findings.append(f"Possible typosquatting of '{brand}' using hyphenation technique")
            elif len(domain_lower) > len(brand) + 5:
                findings.append(f"Domain embeds brand name '{brand}' — likely impersonation attempt")
            else:
                findings.append(f"Domain contains brand name '{brand}' — may be impersonation")

        # Levenshtein distance check for close misspellings
        elif len(domain_lower) > 3:
            dist = levenshtein_distance(domain_lower, brand)
            if 0 < dist <= 2 and len(brand) > 4:
                findings.append(f"Domain '{domain}' is suspiciously similar to '{brand}' (edit distance: {dist})")

    return findings


def analyze_url(url: str) -> Dict:
    """Analyze a URL for phishing and malicious indicators with enhanced detection."""
    # Ensure URL has scheme
    original_url = url
    if not url.startswith(("http://", "https://")):
        url = "http://" + url

    parsed = urlparse(url)
    hostname = parsed.hostname or ""
    path = parsed.path or ""
    query = parsed.query or ""

    # Extract domain parts
    domain = hostname
    subdomain = ""
    tld = ""

    if tldextract:
        extracted = tldextract.extract(url)
        domain = extracted.domain
        subdomain = extracted.subdomain
        tld = extracted.suffix
    else:
        parts = hostname.split(".")
        if len(parts) >= 2:
            tld = parts[-1]
            domain = parts[-2]
            subdomain = ".".join(parts[:-2])

    # ── Feature Extraction ──
    domain_length = len(hostname)
    domain_entropy = calculate_entropy(hostname)
    has_suspicious_tld = tld.lower() in SUSPICIOUS_TLDS
    has_ip_address = bool(re.match(r'^\d{1,3}(\.\d{1,3}){3}$', hostname))
    is_https = parsed.scheme == "https"
    subdomain_count = len(subdomain.split(".")) if subdomain else 0
    path_depth = len([p for p in path.split("/") if p])
    has_at_symbol = "@" in url
    has_double_slash_redirect = "//" in path
    total_url_length = len(url)

    # Count special characters in domain
    special_chars_in_domain = sum(1 for c in hostname if c in "-_.")
    digits_in_domain = sum(1 for c in hostname if c.isdigit())

    # Decoded URL check (encoded phishing)
    decoded_url = unquote(url)
    has_encoded_chars = decoded_url != url

    # Query parameter analysis
    query_params = parse_qs(query)
    suspicious_params = [k for k in query_params if k.lower() in
                         ["redirect", "url", "next", "return", "goto", "target", "dest", "redir"]]

    # URL shortener check
    full_hostname = hostname.lower()
    is_shortened = any(shortener in full_hostname for shortener in URL_SHORTENERS)

    # Path word analysis
    path_lower = (path + "?" + query).lower()
    suspicious_path_matches = [w for w in SUSPICIOUS_PATH_WORDS if w in path_lower]

    # Typosquatting check
    typosquat_findings = detect_typosquatting(hostname)

    # Check if legitimate
    full_domain = f"{domain}.{tld}" if tld else domain
    is_known_legit = full_domain.lower() in LEGITIMATE_DOMAINS

    # ── Risk Score Calculation ──
    score = 0.0
    if is_known_legit:
        score = max(score, 5)  # Even legit domains get a small base
    else:
        # Domain-level signals
        score += 18 if has_suspicious_tld else 0
        score += 28 if has_ip_address else 0
        score += 8 if not is_https else 0
        score += min(domain_entropy * 4, 16) if domain_entropy > 3.2 else 0
        score += 8 if domain_length > 30 else (4 if domain_length > 20 else 0)
        score += 8 if subdomain_count > 2 else (3 if subdomain_count > 1 else 0)
        score += 6 if digits_in_domain > 4 else 0
        score += 5 if special_chars_in_domain > 3 else 0

        # Typosquatting is a very strong signal
        score += min(len(typosquat_findings) * 22, 44)

        # Path-level signals
        score += min(len(suspicious_path_matches) * 6, 18)
        score += 5 if path_depth > 4 else 0

        # Structural signals
        score += 15 if has_at_symbol else 0
        score += 10 if has_double_slash_redirect else 0
        score += 12 if is_shortened else 0
        score += 6 if has_encoded_chars else 0
        score += 5 if total_url_length > 100 else 0
        score += min(len(suspicious_params) * 8, 16)

    score = min(max(int(score), 0), 100)

    # ── Explanations ──
    explanations = []
    if has_ip_address:
        explanations.append("🌐 URL uses raw IP address instead of domain name — classic phishing tactic")
    if has_suspicious_tld:
        explanations.append(f"⚠️ Suspicious TLD '.{tld}' — frequently abused in phishing campaigns")
    if not is_https:
        explanations.append("🔓 No HTTPS encryption — data transmitted in plaintext, can be intercepted")
    if typosquat_findings:
        for f in typosquat_findings:
            explanations.append(f"🎭 {f}")
    if domain_entropy > 3.5:
        explanations.append(f"🔢 High domain entropy ({domain_entropy}) — appears randomly generated")
    if suspicious_path_matches:
        explanations.append(f"🔑 Suspicious keywords in URL path: {', '.join(suspicious_path_matches[:5])}")
    if has_at_symbol:
        explanations.append("📧 URL contains @ symbol — browser may redirect to a different domain")
    if has_double_slash_redirect:
        explanations.append("↪️ Double-slash in path — possible redirect to malicious site")
    if is_shortened:
        explanations.append("🔗 URL shortener detected — hides the true destination")
    if has_encoded_chars:
        explanations.append("🔣 URL contains encoded characters — may be obfuscating malicious content")
    if suspicious_params:
        explanations.append(f"🔀 Suspicious redirect parameters: {', '.join(suspicious_params)}")
    if domain_length > 30:
        explanations.append("📏 Unusually long domain name — common in phishing URLs")
    if subdomain_count > 2:
        explanations.append(f"🏗️ Excessive subdomains ({subdomain_count}) — may be impersonating a legitimate site")
    if is_known_legit:
        explanations.append("✅ Domain belongs to a known legitimate website")
    if not explanations:
        explanations.append("ℹ️ No major red flags detected, but always exercise caution with unfamiliar URLs")

    # ── Attack Type ──
    attack_type = "None Detected"
    if score > 60:
        if typosquat_findings:
            attack_type = "Typosquatting / Brand Impersonation"
        elif has_ip_address:
            attack_type = "IP-based Phishing"
        elif is_shortened:
            attack_type = "Obfuscated / Shortened URL Attack"
        else:
            attack_type = "Suspicious / Potentially Malicious URL"
    elif score > 30:
        attack_type = "Suspicious URL"

    # ── Recommendations ──
    recommendations = []
    if score > 60:
        recommendations.append("🚫 Do NOT visit this URL or enter any information")
        recommendations.append("📢 Report this URL to Google Safe Browsing or PhishTank")
        recommendations.append("🔍 If you must check, use a URL scanner like VirusTotal first")
    elif score > 30:
        recommendations.append("⚠️ Verify this URL through official sources before visiting")
        recommendations.append("🔒 Check the SSL certificate if you visit the site")
        recommendations.append("🔍 Consider using a URL reputation checker before proceeding")
    else:
        recommendations.append("✅ URL appears safe, but always verify before entering credentials")
        recommendations.append("🔒 Look for the padlock icon in your browser's address bar")

    return {
        "risk_score": score,
        "phishing_probability": round(score / 100, 3),
        "attack_type": attack_type,
        "explanations": explanations,
        "recommendations": recommendations,
        "features": {
            "domain": domain,
            "subdomain": subdomain,
            "tld": tld,
            "domain_length": domain_length,
            "domain_entropy": domain_entropy,
            "has_suspicious_tld": has_suspicious_tld,
            "is_https": is_https,
            "has_ip_address": has_ip_address,
            "typosquatting": typosquat_findings,
            "suspicious_url_words": suspicious_path_matches,
            "is_shortened_url": is_shortened,
            "subdomain_count": subdomain_count,
            "url_length": total_url_length,
        },
    }
