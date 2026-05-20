"""
OCR Processing Pipeline
Preprocesses images and extracts text using EasyOCR (pure Python, no Tesseract needed).
"""

import io
from typing import Optional, Dict

try:
    import cv2
    import numpy as np
    HAS_OPENCV = True
except ImportError:
    HAS_OPENCV = False

try:
    import easyocr
    HAS_EASYOCR = True
    # Initialize the reader once globally to save time on repeated scans
    # Uses English language. Will automatically use CPU or GPU depending on PyTorch availability.
    # Note: On first run, it will download a ~15MB detection model and a ~10MB recognition model to ~/.EasyOCR/
    reader = easyocr.Reader(['en'], gpu=False)
except ImportError:
    HAS_EASYOCR = False

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False


def preprocess_image(image_bytes: bytes) -> Optional[any]:
    """Preprocess image for better OCR accuracy (Optional for EasyOCR but can help)."""
    if not HAS_OPENCV:
        return None

    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        return None

    # SPEED OPTIMIZATION 1: Resize large images
    # EasyOCR is exponentially slower on large images. 
    # Downscaling to a max width/height of 1024px gives a massive speed boost on CPU.
    max_dim = 1024
    h, w = img.shape[:2]
    if w > max_dim or h > max_dim:
        scale = max_dim / max(w, h)
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)

    # SPEED OPTIMIZATION 2: Convert to grayscale
    # Reduces the data the ML model has to process (1 channel instead of 3)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    return img


def extract_text_from_image(image_bytes: bytes) -> Dict:
    """Extract text from image using EasyOCR."""
    if not HAS_EASYOCR:
        return {"text": "", "error": "EasyOCR is not installed. Please run: pip install easyocr", "confidence": 0}

    try:
        if HAS_OPENCV:
            # Use OpenCV to load the image into a numpy array (EasyOCR prefers this)
            img = preprocess_image(image_bytes)
            if img is not None:
                # readtext returns a list of tuples: (bbox, text, confidence)
                results = reader.readtext(img)
            else:
                return {"text": "", "error": "Failed to decode image with OpenCV", "confidence": 0}
        else:
            # Fallback if OpenCV isn't available (EasyOCR can also accept raw bytes)
            results = reader.readtext(image_bytes)
            
        if not results:
            return {"text": "", "error": "No text detected in image", "confidence": 0}

        # Combine text and calculate average confidence
        texts = []
        confidences = []
        
        for (bbox, text, prob) in results:
            if prob > 0.15: # Filter out absolute noise
                texts.append(text)
                confidences.append(prob)

        final_text = " ".join(texts)
        avg_conf = sum(confidences) / len(confidences) if confidences else 0

        return {
            "text": final_text.strip(),
            "confidence": round(avg_conf * 100, 1),
            "method": "easyocr",
            "error": ""
        }

    except Exception as e:
        return {"text": "", "error": str(e), "confidence": 0}
