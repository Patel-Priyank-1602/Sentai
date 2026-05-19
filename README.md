<p align="center">
  <img src="https://img.shields.io/badge/Sentinel_AI-Threat_Detection-6366f1?style=for-the-badge&logo=shield&logoColor=white" alt="Sentinel AI" />
</p>

<h1 align="center">🛡️ Sentinel AI</h1>
<h3 align="center">AI-Powered Multimodal Scam & Phishing Detection Platform</h3>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi" />
  <img src="https://img.shields.io/badge/Python-3.11-3776ab?style=flat-square&logo=python" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178c6?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwindcss" />
  <img src="https://img.shields.io/badge/PyTorch-ML-ee4c2c?style=flat-square&logo=pytorch" />
</p>

---

## 🎯 Overview

**Sentinel AI** is a production-grade security platform that analyzes suspicious content across **6 input modalities** — SMS, emails, screenshots, URLs, QR codes, and phone numbers — using a combination of NLP, computer vision, heuristic analysis, and explainable AI.

Users upload or paste suspicious content and receive:
- **Risk Score** (0-100) with visual threat level classification
- **Attack Type** identification (Phishing, BEC, Scam, Social Engineering)
- **AI Explanations** — human-readable analysis of detected threats
- **Actionable Recommendations** — what to do next
- **Feature Breakdown** — urgency score, credential requests, domain entropy

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  Dashboard │ Scan │ History │ Alerts │ Settings              │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────────────────┐
│                  FastAPI Gateway                             │
├──────────┬──────────┬──────────┬──────────┬─────────────────┤
│  Text    │  URL     │  OCR     │  QR      │  Phone/Email    │
│  NLP     │  Intel   │  Engine  │  Decoder │  Analyzer       │
├──────────┴──────────┴──────────┴──────────┴─────────────────┤
│              Feature Extraction Layer                        │
├─────────────────────────────────────────────────────────────┤
│           Risk Scoring Engine (Weighted Fusion)              │
├─────────────────────────────────────────────────────────────┤
│           Explainable AI Layer                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
sentinel-ai/
├── frontend/                    # Next.js 15 Application
│   ├── app/
│   │   ├── layout.tsx           # Root layout with sidebar
│   │   ├── page.tsx             # Dashboard with analytics
│   │   ├── globals.css          # Design system & tokens
│   │   ├── scan/page.tsx        # Multi-modal scan interface
│   │   ├── history/page.tsx     # Searchable scan history
│   │   ├── alerts/page.tsx      # Severity-based alerts
│   │   └── settings/page.tsx    # User preferences
│   ├── components/
│   │   ├── layout/              # Sidebar, TopBar
│   │   └── providers.tsx        # React Query provider
│   ├── lib/utils.ts             # Utilities & helpers
│   └── services/api.ts          # API service layer
│
├── backend/                     # FastAPI Application
│   ├── main.py                  # App entry point
│   ├── api/routes.py            # REST endpoints
│   ├── ml/
│   │   ├── text_classifier.py   # NLP phishing detection
│   │   └── risk_engine.py       # Multi-signal fusion
│   ├── ocr/processor.py         # Tesseract + OpenCV
│   ├── services/
│   │   ├── url_analyzer.py      # Domain intel & entropy
│   │   ├── qr_decoder.py        # pyzbar QR decoding
│   │   ├── phone_analyzer.py    # Phone reputation
│   │   └── email_parser.py      # Header + body analysis
│   ├── models/schemas.py        # Pydantic validation
│   └── core/config.py           # Configuration
│
├── docker/Dockerfile            # Production container
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- (Optional) Tesseract OCR for image scanning

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# → http://localhost:8000/docs
```

### Docker (Backend)
```bash
docker build -f docker/Dockerfile -t sentinel-ai-backend .
docker run -p 8000:8000 sentinel-ai-backend
```

---

## 🔬 Detection Capabilities

| Input Type | Engine | Features |
|------------|--------|----------|
| **Text/SMS** | NLP Heuristics + DistilBERT | Urgency, credentials, fear, payment detection |
| **URL** | Domain Intel + Entropy | Typosquatting, TLD analysis, brand impersonation |
| **Email** | Header + Body Parser | Sender spoofing, reply-to mismatch, BEC patterns |
| **Screenshot** | Tesseract OCR + OpenCV | Image preprocessing → text extraction → NLP |
| **QR Code** | pyzbar Decoder | Decode → URL analysis pipeline |
| **Phone** | Pattern Analysis | Premium rate, VoIP, area code risk |

---

## 🧠 Risk Engine

The risk scoring engine fuses multiple analysis signals:

```
risk_score = 0.4 × text_score + 0.3 × url_score + 0.2 × image_score + 0.1 × heuristics
```

| Score Range | Classification | Action |
|-------------|---------------|--------|
| 0 – 30 | 🟢 **Safe** | Normal — exercise standard caution |
| 31 – 60 | 🟡 **Suspicious** | Verify through official channels |
| 61 – 100 | 🔴 **Dangerous** | Do NOT interact — report immediately |

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS, Recharts, Framer Motion |
| **Backend** | FastAPI, Uvicorn, Pydantic v2, Python 3.11 |
| **AI/ML** | Heuristic NLP, DistilBERT (ready), scikit-learn |
| **OCR** | Tesseract OCR, OpenCV, Pillow |
| **URL Intel** | tldextract, python-whois, validators |
| **QR** | pyzbar |
| **Database** | Supabase (PostgreSQL + Auth) — ready for integration |
| **Deployment** | Docker, Vercel (frontend), Railway (backend) |

---

## 📜 License

MIT License — free for personal and commercial use.
