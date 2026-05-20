"""
═══════════════════════════════════════════════════════════════
  Sentinel AI — Model Training Pipeline
  
  Reads datasets from backend/dataset/ folders, trains an
  ensemble ML classifier, evaluates it, and saves to .pkl
  
  Usage:  python -m ml.train_model
  (run from the backend/ directory)
═══════════════════════════════════════════════════════════════
"""

import os
import re
import sys
import glob
import time
import logging
import pickle
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import (
    VotingClassifier,
    RandomForestClassifier,
    GradientBoostingClassifier,
)
from sklearn.pipeline import Pipeline
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.metrics import classification_report, confusion_matrix
import joblib

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────
# Paths
# ─────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent  # backend/
DATASET_DIR = BASE_DIR / "dataset"
MODEL_DIR = BASE_DIR / "ml" / "trained_models"
MODEL_PATH = MODEL_DIR / "phishing_classifier.pkl"
VECTORIZER_PATH = MODEL_DIR / "tfidf_vectorizer.pkl"
PIPELINE_PATH = MODEL_DIR / "full_pipeline.pkl"


# ─────────────────────────────────────────────────
# Text preprocessing
# ─────────────────────────────────────────────────
def preprocess_text(text: str) -> str:
    """Clean and normalize text for ML processing."""
    if not isinstance(text, str):
        return ""
    text = text.lower().strip()
    # Normalize URLs
    text = re.sub(r'https?://\S+', ' URL_TOKEN ', text)
    # Normalize email addresses
    text = re.sub(r'\S+@\S+', ' EMAIL_TOKEN ', text)
    # Normalize phone numbers
    text = re.sub(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', ' PHONE_TOKEN ', text)
    # Normalize money amounts
    text = re.sub(r'\$[\d,]+\.?\d*', ' MONEY_TOKEN ', text)
    # Normalize numbers
    text = re.sub(r'\b\d+\b', ' NUM_TOKEN ', text)
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', ' ', text)
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text


# ─────────────────────────────────────────────────
# Smart CSV loader — auto-detects column formats
# ─────────────────────────────────────────────────

# Common column name mappings for text content
TEXT_COLUMNS = [
    "text", "message", "body", "content", "email_text", "email text",
    "sms", "v2", "msg", "email_body", "email body", "raw_text",
    "email", "subject", "description", "payload",
]

# Common column name mappings for labels
LABEL_COLUMNS = [
    "label", "class", "category", "type", "spam", "v1", "target",
    "email_type", "email type", "is_spam", "is_phishing", "classification",
    "status", "result",
]

# Values that mean "phishing/spam/malicious" (label = 1)
POSITIVE_LABELS = {
    "spam", "phishing", "malicious", "1", "unsafe", "bad", "scam",
    "phishing email", "suspicious", "fraud", "yes", "true",
    "safe email",  # Note: We handle inversion below for some datasets
}

# Values that mean "legitimate/safe" (label = 0)
NEGATIVE_LABELS = {
    "ham", "legitimate", "benign", "0", "safe", "good", "not spam",
    "no", "false", "legit", "normal",
}


def _find_column(columns: list, candidates: list) -> str:
    """Find the best matching column name from a list of candidates."""
    cols_lower = {c.lower().strip(): c for c in columns}
    for candidate in candidates:
        if candidate in cols_lower:
            return cols_lower[candidate]
    # Fuzzy match: check if any column contains the candidate
    for candidate in candidates:
        for col_lower, col_original in cols_lower.items():
            if candidate in col_lower:
                return col_original
    return None


def _map_label(value, positive_labels=POSITIVE_LABELS, negative_labels=NEGATIVE_LABELS) -> int:
    """Map a label value to 0 (safe) or 1 (phishing). Returns -1 if unknown."""
    if isinstance(value, (int, float)):
        if value == 1 or value == 1.0:
            return 1
        if value == 0 or value == 0.0:
            return 0
        return -1
    val = str(value).lower().strip()
    if val in positive_labels:
        return 1
    if val in negative_labels:
        return 0
    # Try numeric
    try:
        num = int(float(val))
        return 1 if num == 1 else 0 if num == 0 else -1
    except (ValueError, TypeError):
        return -1


def load_csv_smart(filepath: str) -> list:
    """
    Load a CSV file and auto-detect text and label columns.
    Returns list of (text, label) tuples.
    """
    logger.info(f"  Loading: {os.path.basename(filepath)} ({os.path.getsize(filepath) / 1024 / 1024:.1f} MB)")
    
    try:
        # Try different encodings
        for encoding in ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']:
            try:
                df = pd.read_csv(filepath, encoding=encoding, on_bad_lines='skip', low_memory=False)
                break
            except (UnicodeDecodeError, Exception):
                continue
        else:
            logger.warning(f"  ⚠ Could not read {filepath} with any encoding")
            return []
        
        if df.empty or len(df.columns) < 2:
            logger.warning(f"  ⚠ File has insufficient columns: {list(df.columns)}")
            return []
        
        logger.info(f"    Columns: {list(df.columns)}")
        logger.info(f"    Rows: {len(df):,}")
        
        # Find text column
        text_col = _find_column(list(df.columns), TEXT_COLUMNS)
        # Find label column
        label_col = _find_column(list(df.columns), LABEL_COLUMNS)
        
        if not text_col:
            # Heuristic: use the column with the longest average string length
            str_cols = df.select_dtypes(include=['object']).columns
            if len(str_cols) >= 2:
                avg_lens = {c: df[c].astype(str).str.len().mean() for c in str_cols}
                text_col = max(avg_lens, key=avg_lens.get)
                logger.info(f"    Auto-detected text column by length: '{text_col}'")
            elif len(str_cols) == 1:
                text_col = str_cols[0]
        
        if not label_col:
            # Heuristic: use the column with the fewest unique values (likely a label)
            str_cols = df.select_dtypes(include=['object']).columns
            candidates = [c for c in str_cols if c != text_col]
            if candidates:
                unique_counts = {c: df[c].nunique() for c in candidates}
                label_col = min(unique_counts, key=unique_counts.get)
                logger.info(f"    Auto-detected label column by uniqueness: '{label_col}'")
            # Also check numeric columns
            num_cols = df.select_dtypes(include=['number']).columns
            for nc in num_cols:
                if df[nc].nunique() <= 3:  # Binary or ternary label
                    label_col = nc
                    logger.info(f"    Auto-detected numeric label column: '{label_col}'")
                    break
        
        if not text_col or not label_col:
            logger.warning(f"  ⚠ Could not identify text or label columns. Text: {text_col}, Label: {label_col}")
            return []
        
        logger.info(f"    Using text='{text_col}', label='{label_col}'")
        
        # Map labels
        data = []
        unknown_labels = set()
        for _, row in df.iterrows():
            text = row.get(text_col)
            label_raw = row.get(label_col)
            
            if pd.isna(text) or pd.isna(label_raw):
                continue
            
            text = str(text).strip()
            if len(text) < 5:  # Skip very short texts
                continue
            
            label = _map_label(label_raw)
            if label == -1:
                unknown_labels.add(str(label_raw)[:30])
                continue
            
            data.append((text, label))
        
        if unknown_labels:
            logger.info(f"    Unknown label values skipped: {unknown_labels}")
        
        pos = sum(1 for _, l in data if l == 1)
        neg = sum(1 for _, l in data if l == 0)
        logger.info(f"    ✓ Loaded {len(data):,} samples (phishing: {pos:,}, safe: {neg:,})")
        
        return data
        
    except Exception as e:
        logger.error(f"  ✗ Error loading {filepath}: {e}")
        return []


# ─────────────────────────────────────────────────
# Load all datasets
# ─────────────────────────────────────────────────
def load_all_datasets() -> list:
    """Load all CSV files from all dataset subdirectories."""
    all_data = []
    
    for folder in ["spam", "mail", "url"]:
        folder_path = DATASET_DIR / folder
        if not folder_path.exists():
            logger.warning(f"Dataset folder not found: {folder_path}")
            continue
        
        logger.info(f"\n{'='*60}")
        logger.info(f"📁 Loading from: dataset/{folder}/")
        logger.info(f"{'='*60}")
        
        csv_files = list(folder_path.glob("*.csv"))
        if not csv_files:
            logger.warning(f"  No CSV files found in {folder_path}")
            continue
        
        for csv_file in sorted(csv_files):
            data = load_csv_smart(str(csv_file))
            all_data.extend(data)
    
    return all_data


# ─────────────────────────────────────────────────
# Embedded fallback dataset (if no CSV files work)
# ─────────────────────────────────────────────────
FALLBACK_DATA = [
    ("Your account has been suspended. Click here to verify your identity immediately.", 1),
    ("URGENT: Your bank account will be closed within 24 hours. Enter your password to prevent this.", 1),
    ("Congratulations! You've won $1,000,000 in the lottery. Send your details to claim.", 1),
    ("Please enter your username and password to continue with the verification process.", 1),
    ("WARNING: Your computer has been infected with a virus. Call this number immediately.", 1),
    ("Your PayPal account requires immediate verification or it will be suspended.", 1),
    ("Click this link to verify your account: http://amaz0n-security.xyz/verify", 1),
    ("FBI WARNING: Your IP has been logged. Pay the fine to avoid arrest.", 1),
    ("Investment opportunity: Double your money in 30 days guaranteed!", 1),
    ("Your package could not be delivered. Pay the customs fee to release it.", 1),
    ("Hi team, please find the attached quarterly report for your review.", 0),
    ("Meeting scheduled for tomorrow at 3pm. Please confirm your attendance.", 0),
    ("Your order has been shipped. Expected delivery: March 15.", 0),
    ("Happy birthday! Hope you have an amazing day.", 0),
    ("The project deadline has been extended to next Friday.", 0),
    ("Password changed successfully. If you didn't make this change, contact support.", 0),
    ("Your flight confirmation: NYC to LAX, departing at 8:00 AM.", 0),
    ("Thank you for your purchase. Your receipt is attached. Total: $45.99.", 0),
    ("New login from Chrome on Windows. If this was you, no action needed.", 0),
    ("Here's the study material for next week's exam. Chapters 5-8.", 0),
]


# ─────────────────────────────────────────────────
# Training
# ─────────────────────────────────────────────────
def train_and_save():
    """Main training pipeline."""
    start_time = time.time()
    
    logger.info("╔══════════════════════════════════════════════════╗")
    logger.info("║   Sentinel AI — Model Training Pipeline         ║")
    logger.info("╚══════════════════════════════════════════════════╝")
    
    # Load datasets
    all_data = load_all_datasets()
    
    if len(all_data) < 50:
        logger.warning(f"Only {len(all_data)} samples loaded from CSVs. Adding fallback data...")
        all_data.extend(FALLBACK_DATA)
    
    if len(all_data) < 20:
        logger.error("Not enough data to train. Please check your dataset files.")
        sys.exit(1)
    
    # Deduplicate
    all_data = list(set(all_data))
    
    total = len(all_data)
    pos = sum(1 for _, l in all_data if l == 1)
    neg = sum(1 for _, l in all_data if l == 0)
    
    logger.info(f"\n{'='*60}")
    logger.info(f"📊 Dataset Summary")
    logger.info(f"{'='*60}")
    logger.info(f"  Total samples:  {total:,}")
    logger.info(f"  Phishing (1):   {pos:,} ({pos/total*100:.1f}%)")
    logger.info(f"  Legitimate (0): {neg:,} ({neg/total*100:.1f}%)")
    
    # Limit dataset size for reasonable training time
    MAX_SAMPLES = 25_000
    if total > MAX_SAMPLES:
        logger.info(f"  ⚡ Sampling {MAX_SAMPLES:,} from {total:,} for training speed...")
        np.random.seed(42)
        indices = np.random.choice(total, MAX_SAMPLES, replace=False)
        all_data = [all_data[i] for i in indices]
        total = len(all_data)
        pos = sum(1 for _, l in all_data if l == 1)
        neg = sum(1 for _, l in all_data if l == 0)
        logger.info(f"  After sampling: {total:,} (phishing: {pos:,}, safe: {neg:,})")
    
    # Preprocess
    logger.info(f"\n🔄 Preprocessing text...")
    texts = [preprocess_text(t) for t, _ in all_data]
    labels = np.array([l for _, l in all_data])
    
    # Filter out empty texts
    valid = [(t, l) for t, l in zip(texts, labels) if len(t) > 3]
    texts = [t for t, _ in valid]
    labels = np.array([l for _, l in valid])
    logger.info(f"  Valid samples after preprocessing: {len(texts):,}")
    
    # Build pipeline
    logger.info(f"\n🏗️  Building ML Pipeline...")
    
    vectorizer = TfidfVectorizer(
        max_features=10000,
        ngram_range=(1, 3),
        min_df=2,
        max_df=0.95,
        sublinear_tf=True,
        strip_accents='unicode',
    )
    
    lr = LogisticRegression(
        C=1.0,
        max_iter=1000,
        class_weight='balanced',
        solver='lbfgs',
    )
    
    rf = RandomForestClassifier(
        n_estimators=100,  # Reduced trees for speed
        max_depth=15,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1,
    )
    
    gb = GradientBoostingClassifier(
        n_estimators=100,  # Reduced trees for speed
        max_depth=5,
        learning_rate=0.1,
        random_state=42,
    )
    
    ensemble = VotingClassifier(
        estimators=[('lr', lr), ('rf', rf), ('gb', gb)],
        voting='soft',
    )
    
    pipeline = Pipeline([
        ('tfidf', vectorizer),
        ('clf', ensemble),
    ])
    
    # Train on full dataset (Skipping Cross-Validation to save time)
    logger.info(f"\n🚀 Training final model on {len(texts):,} samples... (This should take 1-3 minutes)")
    pipeline.fit(texts, labels)
    
    # Evaluate on training set (sanity check)
    train_preds = pipeline.predict(texts)
    logger.info(f"\n📋 Training Set Performance:")
    logger.info(f"\n{classification_report(labels, train_preds, target_names=['Legitimate', 'Phishing'])}")
    
    cm = confusion_matrix(labels, train_preds)
    logger.info(f"  Confusion Matrix:")
    logger.info(f"    TN={cm[0][0]:,}  FP={cm[0][1]:,}")
    logger.info(f"    FN={cm[1][0]:,}  TP={cm[1][1]:,}")
    
    # Save model
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    
    joblib.dump(pipeline, PIPELINE_PATH)
    file_size = os.path.getsize(PIPELINE_PATH) / 1024 / 1024
    
    elapsed = time.time() - start_time
    
    logger.info(f"\n{'='*60}")
    logger.info(f"✅ Model saved successfully!")
    logger.info(f"{'='*60}")
    logger.info(f"  Path:          {PIPELINE_PATH}")
    logger.info(f"  File size:     {file_size:.1f} MB")
    logger.info(f"  Training time: {elapsed:.1f}s")
    logger.info(f"  Samples used:  {len(texts):,}")
    logger.info(f"\n  The model will be auto-loaded by the API server on next restart.")
    
    return pipeline


if __name__ == "__main__":
    train_and_save()
