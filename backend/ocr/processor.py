"""
OCR Processing Pipeline
Preprocesses images and extracts text using Tesseract OCR (lightweight, no PyTorch needed).
Uses multiple OCR strategies to maximize text extraction accuracy.
"""

import io
import logging
from typing import Optional, Dict

logger = logging.getLogger(__name__)

try:
    import cv2
    import numpy as np
    HAS_OPENCV = True
except ImportError:
    HAS_OPENCV = False

try:
    import pytesseract
    import platform
    import os
    HAS_TESSERACT = True

    # Auto-detect Tesseract path on Windows (not in PATH by default)
    if platform.system() == "Windows":
        win_paths = [
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
            os.path.expanduser(r"~\AppData\Local\Tesseract-OCR\tesseract.exe"),
        ]
        for p in win_paths:
            if os.path.isfile(p):
                pytesseract.pytesseract.tesseract_cmd = p
                break
except ImportError:
    HAS_TESSERACT = False

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False


def _resize_if_large(img, max_dim=2048):
    """Resize large images for faster OCR while preserving enough detail."""
    h, w = img.shape[:2]
    if w > max_dim or h > max_dim:
        scale = max_dim / max(w, h)
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    return img


def _run_tesseract(img, config="") -> tuple:
    """Run Tesseract on an image and return (text, confidence)."""
    try:
        pil_img = Image.fromarray(img) if HAS_PIL else img
        ocr_data = pytesseract.image_to_data(pil_img, output_type=pytesseract.Output.DICT, config=config)

        texts = []
        confidences = []
        for i, text in enumerate(ocr_data["text"]):
            conf = int(ocr_data["conf"][i])
            word = text.strip()
            if word and conf > 10:
                texts.append(word)
                confidences.append(conf)

        final_text = " ".join(texts)
        avg_conf = sum(confidences) / len(confidences) if confidences else 0
        return final_text.strip(), round(avg_conf, 1)
    except Exception as e:
        logger.warning(f"Tesseract run failed: {e}")
        return "", 0


def extract_text_from_image(image_bytes: bytes) -> Dict:
    """
    Extract text from image using Tesseract OCR with multiple strategies.
    Tries different preprocessing methods and picks the best result.
    """
    if not HAS_TESSERACT:
        return {"text": "", "error": "pytesseract is not installed. Please run: pip install pytesseract", "confidence": 0}

    if not HAS_OPENCV:
        # Fallback: try PIL directly without preprocessing
        if HAS_PIL:
            try:
                pil_img = Image.open(io.BytesIO(image_bytes))
                text, conf = _run_tesseract(np.array(pil_img))
                if text:
                    return {"text": text, "confidence": conf, "method": "tesseract-pil", "error": ""}
            except Exception:
                pass
        return {"text": "", "error": "OpenCV is not available for image preprocessing", "confidence": 0}

    try:
        # Decode image
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return {"text": "", "error": "Failed to decode image", "confidence": 0}

        img = _resize_if_large(img)

        # ── Strategy 1: Original image (works great for clean screenshots) ──
        results = []

        text1, conf1 = _run_tesseract(img, config="--psm 6")
        if text1:
            results.append((text1, conf1, "original"))
            logger.info(f"Strategy 1 (original): {len(text1.split())} words, conf={conf1}")

        # ── Strategy 2: Grayscale (good for most images) ──
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        text2, conf2 = _run_tesseract(gray, config="--psm 6")
        if text2:
            results.append((text2, conf2, "grayscale"))
            logger.info(f"Strategy 2 (grayscale): {len(text2.split())} words, conf={conf2}")

        # ── Strategy 3: Inverted grayscale (for light text on dark background) ──
        inverted = cv2.bitwise_not(gray)
        text3, conf3 = _run_tesseract(inverted, config="--psm 6")
        if text3:
            results.append((text3, conf3, "inverted"))
            logger.info(f"Strategy 3 (inverted): {len(text3.split())} words, conf={conf3}")

        # ── Strategy 4: OTSU thresholding (good for low contrast) ──
        _, otsu = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        text4, conf4 = _run_tesseract(otsu, config="--psm 6")
        if text4:
            results.append((text4, conf4, "otsu"))
            logger.info(f"Strategy 4 (otsu): {len(text4.split())} words, conf={conf4}")

        if not results:
            return {"text": "", "error": "No text detected in image", "confidence": 0}

        # Pick the result with the most words (best text extraction)
        # If tied, prefer higher confidence
        best = max(results, key=lambda r: (len(r[0].split()), r[1]))
        best_text, best_conf, best_method = best

        logger.info(f"✅ Best OCR result: method={best_method}, words={len(best_text.split())}, conf={best_conf}")

        return {
            "text": best_text,
            "confidence": best_conf,
            "method": f"tesseract-{best_method}",
            "error": ""
        }

    except Exception as e:
        logger.error(f"OCR extraction failed: {e}")
        return {"text": "", "error": str(e), "confidence": 0}
