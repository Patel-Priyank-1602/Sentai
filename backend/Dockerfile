FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (Tesseract OCR + QR code reader)
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    libzbar0 \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY . .

# Expose port (Render sets PORT env var)
EXPOSE 8000

# Run with uvicorn — Render injects $PORT
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
