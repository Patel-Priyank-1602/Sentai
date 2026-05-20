"""
Phishing Detection ML Model
Loads a pre-trained .pkl model for instant predictions.
Falls back to embedded dataset training if no .pkl exists.

To train the model on your datasets, run:
    cd backend
    python -m ml.train_model
"""

import re
import logging
from pathlib import Path
from typing import Dict

import numpy as np

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────
# Paths
# ─────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent  # backend/
PIPELINE_PATH = BASE_DIR / "ml" / "trained_models" / "full_pipeline.pkl"


# ─────────────────────────────────────────────────
# Text preprocessing (must match train_model.py)
# ─────────────────────────────────────────────────
def _preprocess_text(text: str) -> str:
    """Clean and normalize text for ML processing."""
    if not isinstance(text, str):
        return ""
    text = text.lower().strip()
    text = re.sub(r'https?://\S+', ' URL_TOKEN ', text)
    text = re.sub(r'\S+@\S+', ' EMAIL_TOKEN ', text)
    text = re.sub(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', ' PHONE_TOKEN ', text)
    text = re.sub(r'\$[\d,]+\.?\d*', ' MONEY_TOKEN ', text)
    text = re.sub(r'\b\d+\b', ' NUM_TOKEN ', text)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


# ─────────────────────────────────────────────────
# Minimal fallback dataset (only used if no .pkl)
# ─────────────────────────────────────────────────
FALLBACK_DATA = [
    ("Your account has been suspended due to suspicious activity. Click here to verify your identity immediately.", 1),
    ("URGENT: Your bank account will be closed within 24 hours. Enter your password to prevent this.", 1),
    ("We detected unusual sign-in activity on your account. Please verify your identity now.", 1),
    ("Your Apple ID has been locked for security reasons. Tap here to unlock your account.", 1),
    ("Alert: Your Netflix account payment failed. Update your billing info to avoid suspension.", 1),
    ("Your Amazon account has been temporarily restricted. Confirm your details to restore access.", 1),
    ("Your PayPal account requires immediate verification. Failure to act will result in permanent suspension.", 1),
    ("Security alert: Someone tried to access your account. Reset your password immediately.", 1),
    ("Congratulations! You've won $1,000,000 in the international lottery. Send your details to claim.", 1),
    ("You have been selected as the lucky winner of a $500,000 prize. Pay the processing fee to receive.", 1),
    ("Please enter your username and password to continue with the verification process.", 1),
    ("We need you to confirm your credit card number and CVV for security purposes.", 1),
    ("WARNING: Your computer has been infected with a virus. Call this number immediately for support.", 1),
    ("FBI WARNING: Your IP address has been logged visiting illegal websites. Pay the fine to avoid arrest.", 1),
    ("WORK FROM HOME! Earn $5000/week with no experience required. Send your resume and bank details.", 1),
    ("Click this link to verify your account: http://amaz0n-security.xyz/verify?user=you", 1),
    ("Your bank: Unusual activity detected. Verify at bank-secure.xyz/verify. Ignore if not you.", 1),
    ("Dear valued customer, we are updating our security protocols. Re-enter your account information.", 1),
    ("Your e-transfer of $2,500.00 is pending. Click here to accept the transfer before it expires.", 1),
    ("I am a wealthy prince and need your help transferring $10 million. You will receive 30% commission.", 1),

    ("Hi team, please find the attached quarterly report for your review. Let me know if you have questions.", 0),
    ("Meeting scheduled for tomorrow at 3pm in Conference Room B. Please confirm your attendance.", 0),
    ("Just wanted to follow up on our conversation yesterday. Let me know when you're free to discuss.", 0),
    ("The project deadline has been extended to next Friday. Please update your timelines accordingly.", 0),
    ("Hey! Are we still on for dinner tonight? Let me know the time and place.", 0),
    ("Happy birthday! Hope you have an amazing day. Looking forward to celebrating with you this weekend.", 0),
    ("Your order #12345 has been shipped. Expected delivery: March 15. Track at amazon.com/orders.", 0),
    ("Your monthly statement is ready. Log in to your account at chase.com to view it.", 0),
    ("Password changed successfully. If you didn't make this change, contact support.", 0),
    ("New login from Chrome on Windows. If this was you, no action needed.", 0),
    ("Your flight confirmation: NYC to LAX on March 20, departing at 8:00 AM. Confirmation: ABC123.", 0),
    ("Thank you for your purchase. Your receipt is attached. Total: $45.99.", 0),
    ("Here's the study material for next week's exam. Chapters 5-8 will be covered.", 0),
    ("Breaking: New climate agreement reached at the international summit. Full details inside.", 0),
    ("Thank you for applying to the Software Engineer position. We'd like to schedule an interview.", 0),
    ("Your payment of $150.00 to Electric Company has been processed successfully.", 0),
    ("Action required: Please review and approve the attached expense report by end of business today.", 0),
    ("Security update: We've enabled two-factor authentication on your account. No action needed from you.", 0),
    ("Reminder: Annual security training is due by end of month. Complete it through the learning portal.", 0),
    ("Thank you for reporting the issue. Our team has identified the bug and a fix will be deployed tonight.", 0),
]


class PhishingClassifier:
    """
    ML-based phishing classifier.
    Loads pre-trained .pkl model if available, otherwise trains on fallback data.
    """

    def __init__(self):
        self.pipeline = None
        self.is_trained = False
        self.model_source = "none"
        self._load_or_train()

    def _load_or_train(self):
        """Try to load pre-trained model, fall back to embedded training."""
        # Try loading pre-trained .pkl
        if PIPELINE_PATH.exists():
            try:
                import joblib
                self.pipeline = joblib.load(PIPELINE_PATH)
                self.is_trained = True
                self.model_source = "pre-trained (.pkl)"
                file_size = PIPELINE_PATH.stat().st_size / 1024 / 1024
                logger.info(f"✅ Loaded pre-trained model ({file_size:.1f} MB) from {PIPELINE_PATH}")
                return
            except Exception as e:
                logger.warning(f"⚠ Failed to load .pkl model: {e}. Falling back to embedded training.")

        # Fallback: train on embedded dataset
        logger.info("📦 No pre-trained model found. Training on fallback dataset...")
        logger.info("   💡 Run 'python -m ml.train_model' to train on your full datasets for better accuracy!")
        self._train_fallback()

    def _train_fallback(self):
        """Train on the minimal embedded dataset."""
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.linear_model import LogisticRegression
            from sklearn.ensemble import VotingClassifier, RandomForestClassifier, GradientBoostingClassifier
            from sklearn.pipeline import Pipeline

            texts = [_preprocess_text(t) for t, _ in FALLBACK_DATA]
            labels = [l for _, l in FALLBACK_DATA]

            vectorizer = TfidfVectorizer(
                max_features=5000,
                ngram_range=(1, 3),
                min_df=1,
                max_df=0.95,
                sublinear_tf=True,
                strip_accents='unicode',
            )

            lr = LogisticRegression(C=1.0, max_iter=1000, class_weight='balanced', solver='lbfgs')
            rf = RandomForestClassifier(n_estimators=100, max_depth=15, class_weight='balanced', random_state=42)
            gb = GradientBoostingClassifier(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42)

            ensemble = VotingClassifier(
                estimators=[('lr', lr), ('rf', rf), ('gb', gb)],
                voting='soft',
            )

            self.pipeline = Pipeline([
                ('tfidf', vectorizer),
                ('clf', ensemble),
            ])

            self.pipeline.fit(texts, labels)
            self.is_trained = True
            self.model_source = "fallback (embedded)"
            logger.info(f"✅ Fallback model trained on {len(FALLBACK_DATA)} samples")

        except Exception as e:
            logger.error(f"✗ Failed to train fallback model: {e}")
            self.is_trained = False

    def predict(self, text: str) -> Dict:
        """
        Predict phishing probability for given text.
        Returns dict with probability (0-1), confidence, and model source.
        """
        if not self.is_trained or self.pipeline is None:
            return {"probability": 0.5, "confidence": 0.0, "is_trained": False, "model_source": "none"}

        try:
            processed = _preprocess_text(text)
            proba = self.pipeline.predict_proba([processed])[0]
            phishing_prob = float(proba[1])  # probability of class 1 (phishing)

            # Confidence = how far from 0.5 (uncertain)
            confidence = abs(phishing_prob - 0.5) * 2  # 0.0 = no confidence, 1.0 = max

            return {
                "probability": round(phishing_prob, 4),
                "confidence": round(confidence, 4),
                "is_trained": True,
                "model_source": self.model_source,
            }
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return {"probability": 0.5, "confidence": 0.0, "is_trained": False, "model_source": "error"}


# ─────────────────────────────────────────────────
# Singleton instance — loads model once at import
# ─────────────────────────────────────────────────
_classifier = None


def get_classifier() -> PhishingClassifier:
    """Get or create the singleton classifier instance."""
    global _classifier
    if _classifier is None:
        logger.info("Initializing phishing ML classifier...")
        _classifier = PhishingClassifier()
    return _classifier


def predict_phishing(text: str) -> Dict:
    """Convenience function to predict phishing probability."""
    clf = get_classifier()
    return clf.predict(text)
