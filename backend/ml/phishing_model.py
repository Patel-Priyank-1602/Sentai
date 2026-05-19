"""
Phishing Detection ML Model
Trained classifier using TF-IDF + Logistic Regression ensemble.
Trains on embedded labeled dataset at startup for instant predictions.
"""

import re
import logging
from typing import Dict, Tuple

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import VotingClassifier, RandomForestClassifier, GradientBoostingClassifier
from sklearn.pipeline import Pipeline
from sklearn.calibration import CalibratedClassifierCV
import numpy as np

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────
# Embedded Training Dataset
# Label: 1 = phishing/scam, 0 = legitimate
# ─────────────────────────────────────────────────

TRAINING_DATA = [
    # ── PHISHING / SCAM (label=1) ──────────────────
    # Account suspension / verification
    ("Your account has been suspended due to suspicious activity. Click here to verify your identity immediately.", 1),
    ("URGENT: Your bank account will be closed within 24 hours. Enter your password to prevent this.", 1),
    ("We detected unusual sign-in activity on your account. Please verify your identity now.", 1),
    ("Your Apple ID has been locked for security reasons. Tap here to unlock your account.", 1),
    ("Alert: Your Netflix account payment failed. Update your billing info to avoid suspension.", 1),
    ("Your Amazon account has been temporarily restricted. Confirm your details to restore access.", 1),
    ("We noticed suspicious login from an unrecognized device. Verify now to secure your account.", 1),
    ("Your PayPal account requires immediate verification. Failure to act will result in permanent suspension.", 1),
    ("Important: Your email account will be deactivated. Click the link to confirm your identity.", 1),
    ("Security alert: Someone tried to access your account. Reset your password immediately.", 1),
    ("Your Google account has been compromised. Sign in here to secure it before it's too late.", 1),
    ("Microsoft account security warning. Your account shows unusual activity. Verify now.", 1),
    ("Your Instagram account will be deleted for violating terms. Appeal here within 24 hours.", 1),
    ("URGENT: Confirm your bank account details to avoid service interruption.", 1),
    ("Your account is about to expire. Update your information within 2 hours to continue using our services.", 1),

    # Credential harvesting
    ("Please enter your username and password to continue with the verification process.", 1),
    ("To unlock your account, please provide your social security number and date of birth.", 1),
    ("We need you to confirm your credit card number and CVV for security purposes.", 1),
    ("Enter your OTP and PIN to verify your recent transaction.", 1),
    ("Please share your login credentials so we can update our security records.", 1),
    ("Verify your account by entering your banking PIN and mother's maiden name.", 1),
    ("For security, please confirm your debit card number, expiry date, and CVV code.", 1),
    ("Submit your tax identification number and bank routing number to process your refund.", 1),
    ("Please reply with your password and security question answers for account recovery.", 1),
    ("Confirm your identity by providing your passport number and banking details.", 1),

    # Financial fraud / lottery scams
    ("Congratulations! You've won $1,000,000 in the international lottery. Send your details to claim.", 1),
    ("You have been selected as the lucky winner of a $500,000 prize. Pay the processing fee to receive.", 1),
    ("Dear beneficiary, you have an unclaimed inheritance of $4.5 million. Contact us immediately.", 1),
    ("You've won a free iPhone 15! Click here and enter your shipping address and payment for handling.", 1),
    ("ALERT: You are owed a tax refund of $3,450. Enter your bank details to receive the payment.", 1),
    ("As a loyal customer, you've been selected for a $1000 gift card. Claim it now before it expires!", 1),
    ("Your compensation of $2,000,000 is ready for transfer. Pay the $500 transfer fee to receive funds.", 1),
    ("You've been randomly selected to receive a government grant of $25,000. Apply now with your details.", 1),
    ("Free $100 Amazon gift card! Just complete this survey and enter your credit card for verification.", 1),
    ("Special promotion: Get $5000 deposited to your account today. Limited time offer, act fast!", 1),

    # Fear / threat based
    ("WARNING: Your computer has been infected with a virus. Call this number immediately for support.", 1),
    ("CRITICAL SECURITY ALERT: Your personal data has been exposed in a data breach. Act now.", 1),
    ("Law enforcement has flagged your account for illegal activity. Contact us to resolve.", 1),
    ("Your social media account is being used for fraud. Failure to respond will result in legal action.", 1),
    ("FBI WARNING: Your IP address has been logged visiting illegal websites. Pay the fine to avoid arrest.", 1),
    ("IRS Notice: You owe $5,000 in back taxes. Pay immediately or face arrest and prosecution.", 1),
    ("ALERT: A warrant has been issued in your name. Call immediately to resolve this matter.", 1),
    ("Your device has been locked by the cyber police. Pay the fine to unlock your device.", 1),
    ("Unauthorized access detected on your device. Your files are being encrypted. Pay to decrypt.", 1),
    ("Someone filed a complaint against you. Respond within 24 hours or face legal consequences.", 1),

    # Social engineering
    ("Hi, this is your bank's fraud department. We need to verify a suspicious transaction on your account.", 1),
    ("Dear customer, your package could not be delivered. Pay the customs fee to release it.", 1),
    ("Your subscription auto-renewal of $499.99 has been processed. Call to cancel and get a refund.", 1),
    ("IT Department: Your email storage is full. Click here to upgrade or your emails will be deleted.", 1),
    ("HR Notice: Your direct deposit details need updating. Click here to verify your banking information.", 1),
    ("Your Zoom account requires an update. Download the new version from this link to continue.", 1),
    ("Delivery notification: Your package is held at customs. Pay $3.99 to proceed with delivery.", 1),
    ("Tech support: We've detected a problem with your Windows license. Call us to reactivate.", 1),
    ("Your cloud storage is 95% full. Upgrade now or lose your files permanently.", 1),
    ("This is an automated message from your ISP. Your internet will be disconnected in 2 hours.", 1),

    # Romance / advance fee scams
    ("I am a wealthy prince and need your help transferring $10 million. You will receive 30% commission.", 1),
    ("Hello dear, I found your profile online and I believe we are destined to be together. Please send money for my visa.", 1),
    ("I am a dying widow with $7.5 million in my account. I want to donate it to you. Reply urgently.", 1),
    ("My late father left $15 million in a trunk. I need your help to move it to your country. Share your bank details.", 1),
    ("I am a soldier deployed overseas. I found a large sum of money and need your help to move it. You keep 40%.", 1),

    # Job / investment scams
    ("WORK FROM HOME! Earn $5000/week with no experience required. Send your resume and bank details.", 1),
    ("Investment opportunity: Double your money in 30 days guaranteed! Minimum investment $1000.", 1),
    ("Congratulations! You've been selected for a high-paying remote position. Pay $200 for training materials.", 1),
    ("Bitcoin investment guaranteed 500% returns in one week. Send your initial deposit now.", 1),
    ("Secret shopping job opportunity. We'll send you a check, deposit it and wire the difference.", 1),

    # Phishing URLs in text
    ("Click this link to verify your account: http://amaz0n-security.xyz/verify?user=you", 1),
    ("Login to update your details at http://paypa1-secure.tk/login now before your account is locked.", 1),
    ("Visit bit.ly/free-prize-claim to receive your reward before it expires today!", 1),
    ("Confirm your identity at http://192.168.1.100/bank-login/verify.html", 1),
    ("Download the security patch from http://micros0ft-update.club/download immediately.", 1),

    # SMS phishing (smishing)
    ("Your bank: Unusual activity detected. Verify at bank-secure.xyz/verify. Ignore if not you.", 1),
    ("FedEx: Your package is on hold. Track and pay customs: fedex-delivery.top/track", 1),
    ("IRS: File your tax refund immediately or lose it. Click: irs-refund.site/claim", 1),
    ("USPS: Delivery attempted. Schedule re-delivery: usps-redelivery.click/schedule", 1),
    ("Your phone bill is overdue. Pay now to avoid disconnection: t-mobile-pay.xyz/bill", 1),

    # ── LEGITIMATE (label=0) ──────────────────
    # Business communications
    ("Hi team, please find the attached quarterly report for your review. Let me know if you have questions.", 0),
    ("Meeting scheduled for tomorrow at 3pm in Conference Room B. Please confirm your attendance.", 0),
    ("Just wanted to follow up on our conversation yesterday. Let me know when you're free to discuss.", 0),
    ("The project deadline has been extended to next Friday. Please update your timelines accordingly.", 0),
    ("Attached is the updated proposal. I've incorporated all the feedback from the last review.", 0),
    ("Please review the pull request I submitted this morning. It includes the bug fixes we discussed.", 0),
    ("The client meeting went well. They approved the design mockups. Next step is development.", 0),
    ("Reminder: Company all-hands meeting is at 2pm today in the main auditorium.", 0),
    ("The Q4 budget has been approved. Please proceed with the planned hiring.", 0),
    ("I've shared the Google Doc with you. Please add your comments by end of day.", 0),

    # Personal emails
    ("Hey! Are we still on for dinner tonight? Let me know the time and place.", 0),
    ("Happy birthday! Hope you have an amazing day. Looking forward to celebrating with you this weekend.", 0),
    ("Thanks for helping me move last weekend. Really appreciate it!", 0),
    ("Can you pick up some groceries on your way home? We need milk and bread.", 0),
    ("Great catching up with you yesterday. Let's plan another get-together soon.", 0),
    ("Just saw your post on Instagram - that trip looked amazing! Where was that?", 0),
    ("Mom's birthday is next week. Should we plan a surprise party?", 0),
    ("The kids had a great time at the play date. Let's do it again next Saturday.", 0),
    ("I'll be arriving at the airport at 6pm. Can you pick me up?", 0),
    ("Sending you the recipe you asked about. Let me know how it turns out!", 0),

    # Legitimate service notifications
    ("Your order #12345 has been shipped. Expected delivery: March 15. Track at amazon.com/orders.", 0),
    ("Your monthly statement is ready. Log in to your account at chase.com to view it.", 0),
    ("Password changed successfully. If you didn't make this change, contact support.", 0),
    ("Your subscription will renew on April 1st. Manage your subscription in account settings.", 0),
    ("New login from Chrome on Windows. If this was you, no action needed.", 0),
    ("Your flight confirmation: NYC to LAX on March 20, departing at 8:00 AM. Confirmation: ABC123.", 0),
    ("Thank you for your purchase. Your receipt is attached. Total: $45.99.", 0),
    ("Your appointment with Dr. Smith is confirmed for Thursday at 10:00 AM.", 0),
    ("Welcome to our newsletter! You'll receive weekly updates on the latest tech news.", 0),
    ("Your return has been processed. Refund of $29.99 will appear in 3-5 business days.", 0),

    # Educational / informational
    ("Here's the study material for next week's exam. Chapters 5-8 will be covered.", 0),
    ("The university has updated the course schedule for the fall semester. Check the portal.", 0),
    ("Attached are the lecture notes from today's class. The assignment is due next Monday.", 0),
    ("The research paper submission deadline is November 30th. Guidelines are on the website.", 0),
    ("Your library books are due on March 25th. You can renew them online or at the front desk.", 0),

    # News / updates
    ("Breaking: New climate agreement reached at the international summit. Full details inside.", 0),
    ("This week's tech roundup: AI advances, new smartphone releases, and cybersecurity updates.", 0),
    ("Sports update: Local team wins championship after thrilling overtime victory.", 0),
    ("Weather alert: Rain expected this weekend. Plan indoor activities accordingly.", 0),
    ("Community notice: Road construction on Main Street starting next week. Plan alternate routes.", 0),

    # Professional networking
    ("I came across your profile on LinkedIn and would love to connect. Your experience in AI is impressive.", 0),
    ("Thank you for applying to the Software Engineer position. We'd like to schedule an interview.", 0),
    ("Congratulations on your new role! Wishing you the best in your career.", 0),
    ("Here's the job description for the position we discussed. Let me know if you're interested.", 0),
    ("The conference registration is now open. Early bird pricing ends March 1st.", 0),

    # Customer service
    ("Thank you for contacting customer support. Your ticket #789 has been created. We'll respond within 24 hours.", 0),
    ("Your feedback is important to us. Please take a moment to rate your recent experience.", 0),
    ("We've resolved the issue you reported. Please check and confirm everything is working correctly.", 0),
    ("Your warranty claim has been approved. We'll ship the replacement within 5 business days.", 0),
    ("Thank you for your loyalty. As a valued customer, you have early access to our new product line.", 0),

    # Transactional
    ("Your payment of $150.00 to Electric Company has been processed successfully.", 0),
    ("Direct deposit of $3,200.00 from ACME Corp received on March 15.", 0),
    ("Your credit card ending in 4521 has a new balance of $1,234.56.", 0),
    ("Rent payment received. Thank you. Next payment due April 1st.", 0),
    ("Your auto-pay for internet service ($79.99/month) has been set up successfully.", 0),

    # More sophisticated phishing (harder to detect)
    ("Dear valued customer, we are updating our security protocols. As part of this process, we need you to re-enter your account information through our secure portal.", 1),
    ("This is to inform you that your recent transaction of $899.99 at Best Buy has been flagged. If this was not you, please call 1-800-555-0199 immediately with your card details ready.", 1),
    ("We are writing to inform you that you have been approved for a pre-approved credit line of $50,000. To activate, simply provide your Social Security number and current bank information.", 1),
    ("Our records indicate that your account information is outdated. Federal regulations require us to verify your identity. Please submit your documents through the attached link.", 1),
    ("Thank you for being a loyal member. Your account qualifies for an exclusive upgrade. Complete your profile with your banking details to receive premium benefits at no cost.", 1),
    ("We regret to inform you that your recent application was flagged for review. To expedite processing, please provide additional verification documents including your passport and utility bill.", 1),
    ("Your e-transfer of $2,500.00 is pending. The sender requires you to answer a security question. Click here to accept the transfer before it expires.", 1),
    ("System maintenance notice: All users must re-authenticate before March 1st. Use the link below to log in and confirm your credentials to maintain access.", 1),

    # More legitimate messages (harder to distinguish)
    ("Action required: Please review and approve the attached expense report by end of business today.", 0),
    ("Security update: We've enabled two-factor authentication on your account. No action needed from you.", 0),
    ("Your account has been upgraded to Premium. Enjoy ad-free browsing and exclusive content.", 0),
    ("Important: Company policy update regarding remote work. Please read and acknowledge by Friday.", 0),
    ("Urgent: The server is down and affecting production. Engineering team please join the war room.", 0),
    ("Your password will expire in 14 days. Visit the IT portal to update it at your convenience.", 0),
    ("Reminder: Annual security training is due by end of month. Complete it through the learning portal.", 0),
    ("Thank you for reporting the issue. Our team has identified the bug and a fix will be deployed tonight.", 0),
]


def _preprocess_text(text: str) -> str:
    """Clean and normalize text for ML processing."""
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
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text


class PhishingClassifier:
    """ML-based phishing classifier using TF-IDF + ensemble methods."""

    def __init__(self):
        self.pipeline = None
        self.is_trained = False
        self._train()

    def _train(self):
        """Train the classifier on embedded dataset."""
        try:
            texts = [_preprocess_text(t) for t, _ in TRAINING_DATA]
            labels = [l for _, l in TRAINING_DATA]

            # TF-IDF with n-grams for better context capture
            vectorizer = TfidfVectorizer(
                max_features=5000,
                ngram_range=(1, 3),    # unigrams, bigrams, and trigrams
                min_df=1,
                max_df=0.95,
                sublinear_tf=True,
                strip_accents='unicode',
            )

            # Ensemble classifier for better accuracy
            lr = LogisticRegression(
                C=1.0,
                max_iter=1000,
                class_weight='balanced',
                solver='lbfgs',
            )

            rf = RandomForestClassifier(
                n_estimators=100,
                max_depth=15,
                class_weight='balanced',
                random_state=42,
            )

            gb = GradientBoostingClassifier(
                n_estimators=100,
                max_depth=5,
                learning_rate=0.1,
                random_state=42,
            )

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
            logger.info(f"Phishing classifier trained on {len(TRAINING_DATA)} samples")

        except Exception as e:
            logger.error(f"Failed to train phishing classifier: {e}")
            self.is_trained = False

    def predict(self, text: str) -> Dict:
        """
        Predict phishing probability for given text.
        Returns dict with probability (0-1) and confidence.
        """
        if not self.is_trained or self.pipeline is None:
            return {"probability": 0.5, "confidence": 0.0, "is_trained": False}

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
            }
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return {"probability": 0.5, "confidence": 0.0, "is_trained": False}


# ─────────────────────────────────────────────────
# Singleton instance — trains once at import time
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
