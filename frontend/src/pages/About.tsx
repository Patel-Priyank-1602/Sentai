import {
  Shield, ScanSearch, Brain, Eye, Lock, Zap,
  Globe, Smartphone, Mail, QrCode, Image as ImageIcon, MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Detection",
    description: "Uses machine learning models trained on real-world phishing and scam datasets to classify threats with high accuracy.",
  },
  {
    icon: ScanSearch,
    title: "Multimodal Analysis",
    description: "Analyze text, URLs, emails, phone numbers, images, and QR codes — all from a single unified input.",
  },
  {
    icon: Eye,
    title: "OCR & Image Scanning",
    description: "Extracts text from screenshots and images using Tesseract OCR to detect hidden threats in visual content.",
  },
  {
    icon: Lock,
    title: "URL Heuristics",
    description: "Evaluates domain entropy, suspicious TLDs, URL length, and typosquatting patterns to flag malicious links.",
  },
  {
    icon: Zap,
    title: "Real-Time Risk Scoring",
    description: "Provides an instant 0-100 risk score with detailed explanations, confidence levels, and actionable recommendations.",
  },
  {
    icon: Globe,
    title: "Comprehensive Threat Coverage",
    description: "Detects phishing, BEC attacks, smishing, vishing, gift card scams, fake invoices, and more.",
  },
];

const inputTypes = [
  { icon: Globe, label: "URLs & Links" },
  { icon: MessageSquare, label: "SMS / Text" },
  { icon: Mail, label: "Emails" },
  { icon: Smartphone, label: "Phone Numbers" },
  { icon: QrCode, label: "QR Codes" },
  { icon: ImageIcon, label: "Screenshots" },
];

export default function About() {
  return (
    <div className="w-full px-2 sm:px-3 lg:px-4 py-3 sm:py-4">
      <div className="relative w-full max-w-[1400px] mx-auto rounded-2xl sm:rounded-[2rem] overflow-hidden min-h-[85vh]">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{
            backgroundImage: 'url(/bgq.jpg)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 100%)'
          }}
        />
        <div className="relative z-10 max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 sm:space-y-16 animate-fade-in">
      {/* Hero Section */}
      <section className="text-center">
        {/* <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-500/10 border border-accent-500/20 text-accent-400 text-xs font-semibold mb-6">
          <Shield className="w-3.5 h-3.5" />
          About Sentinel
        </div> */}
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-surface-100 leading-tight mb-3 sm:mb-4">
          AI-Powered <span className="gradient-text">Threat Detection</span>
          <br />
          Made Simple
        </h1>
        <p className="text-sm sm:text-lg text-surface-400 max-w-2xl mx-auto leading-relaxed px-2 sm:px-0">
          Sentinel is an intelligent phishing and scam detection platform that leverages
          machine learning, NLP, and computer vision to protect you from digital threats.
          Paste any suspicious content and get instant AI analysis.
        </p>
      </section>

      {/* What is Sentinel */}
      <section className="glass-card p-5 sm:p-8 lg:p-10">
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <img src="/iconbgno.png" alt="Sentinel Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-surface-100">What is Sentinel?</h2>
            <p className="text-xs text-surface-500 uppercase tracking-wider font-semibold">Project Overview</p>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4 text-surface-300 leading-relaxed text-xs sm:text-base">
          <p>
            Sentinel is a full-stack, AI-powered cybersecurity tool designed to detect phishing,
            scam messages, and malicious content across multiple input modalities. It combines a
            React frontend with a FastAPI backend implementing sophisticated multimodal analysis
            pipelines.
          </p>
          <p>
            The core AI engine performs <strong className="text-surface-200">Natural Language Processing (NLP)</strong> to
            analyze text sentiment and urgency, <strong className="text-surface-200">URL heuristic analysis</strong> to
            evaluate domain reputation, <strong className="text-surface-200">OCR-based image scanning</strong> using
            Tesseract, <strong className="text-surface-200">QR code decoding</strong>, and
            <strong className="text-surface-200"> machine learning classification</strong> using pre-trained models
            to provide accurate threat assessments.
          </p>
          <p>
            Whether it's a suspicious SMS, a phishing email, a questionable URL, or even a
            screenshot of a fake notification — Sentinel analyzes it all and provides a comprehensive
            risk score with actionable recommendations.
          </p>
        </div>
      </section>

      {/* Supported Input Types */}
      <section>
        <h2 className="text-xl sm:text-2xl font-bold text-surface-100 text-center mb-5 sm:mb-8">
          Supported Input Types
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
          {inputTypes.map((type) => (
            <div
              key={type.label}
              className="glass-card-hover p-5 text-center group"
            >
              <type.icon className="w-6 h-6 sm:w-8 sm:h-8 text-accent-400 mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300" />
              <p className="text-[10px] sm:text-xs font-semibold text-surface-300">{type.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section>
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-surface-100 mb-3 sm:mb-4 tracking-tight">
            Key <span className="text-accent-500">Features</span>
          </h2>
          <p className="text-xs sm:text-base text-surface-400">
            Everything you need to stay protected from digital threats
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="relative group rounded-xl sm:rounded-2xl bg-surface-900/50 border border-surface-700/50 p-5 sm:p-8 hover:bg-surface-800/80 hover:border-accent-500/30 transition-all duration-500 overflow-hidden shadow-lg shadow-black/20"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {/* Refined subtle top glow on hover */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Soft ambient background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="relative z-10">
                <h3 className="text-sm sm:text-lg font-semibold text-surface-50 mb-2 sm:mb-3 tracking-wide">
                  {feature.title}
                </h3>
                
                <p className="text-xs sm:text-sm text-surface-400 leading-relaxed font-light">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      {/* <section className="glass-card p-8 text-center">
        <h2 className="text-2xl font-bold text-surface-100 mb-6">
          Tech Stack
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {[
            "React",
            "TypeScript",
            "Tailwind CSS",
            "FastAPI",
            "Python",
            "Scikit-learn",
            "Tesseract OCR",
            "Vite",
            "Framer Motion",
          ].map((tech) => (
            <span
              key={tech}
              className="px-4 py-2 rounded-xl bg-surface-800/60 text-surface-300 text-sm font-medium border border-surface-700/50 hover:border-accent-500/30 hover:text-accent-400 transition-all cursor-default"
            >
              {tech}
            </span>
          ))}
        </div>
      </section> */}
        </div>
      </div>
    </div>
  );
}
