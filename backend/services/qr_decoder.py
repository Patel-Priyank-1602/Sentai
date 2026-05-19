"""
QR Code Decoder
Decodes QR codes from images and passes extracted URLs to URL analyzer.
"""

import io
from typing import Dict, Optional

try:
    from pyzbar import pyzbar
    HAS_PYZBAR = True
except ImportError:
    HAS_PYZBAR = False

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False


def decode_qr(image_bytes: bytes) -> Dict:
    """Decode QR code from image bytes."""
    if not HAS_PIL:
        return {"data": None, "error": "PIL not installed"}

    if not HAS_PYZBAR:
        return {"data": None, "error": "pyzbar not installed"}

    try:
        image = Image.open(io.BytesIO(image_bytes))
        decoded = pyzbar.decode(image)

        if not decoded:
            return {"data": None, "error": "No QR code found in image"}

        results = []
        for obj in decoded:
            data = obj.data.decode("utf-8")
            results.append({
                "data": data,
                "type": obj.type,
                "is_url": data.startswith(("http://", "https://", "www.")),
            })

        return {
            "data": results[0]["data"],
            "all_results": results,
            "count": len(results),
        }

    except Exception as e:
        return {"data": None, "error": str(e)}
