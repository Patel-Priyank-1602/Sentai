#!/usr/bin/env bash
set -e

# Install system dependencies (Tesseract OCR + QR code reader)
apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libzbar0 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
pip install --no-cache-dir -r requirements.txt
