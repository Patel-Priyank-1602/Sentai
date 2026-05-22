import { useState, useCallback, useRef, useEffect } from "react";
import {
  Upload, Shield, ShieldAlert, ShieldCheck, ShieldX,
  AlertTriangle, CheckCircle2, Loader2, Sparkles, RotateCcw, Eye, X,
  Image as ImageIcon, ScanSearch, FileText, Activity, Cpu, Database, Fingerprint, Lock
} from "lucide-react";
import { cn, getRiskColor, getRiskLevel } from "@/lib/utils";
import { apiService, ScanResponse } from "@/services/api";

type TabType = "scan" | "result";

export default function Scan() {
  const [inputValue, setInputValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("scan");
  const [sharePublicly, setSharePublicly] = useState(false);
  const [scanStep, setScanStep] = useState(0);

  useEffect(() => {
    if (isScanning) {
      setScanStep(0);
      const speed = selectedFile ? 1200 : 600;
      const interval = setInterval(() => {
        setScanStep((prev) => (prev < 4 ? prev + 1 : prev));
      }, speed);
      return () => clearInterval(interval);
    }
  }, [isScanning, selectedFile]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScan = useCallback(async () => {
    if (!inputValue.trim() && !selectedFile) return;

    setIsScanning(true);
    setResult(null);
    setError(null);

    try {
      const res = await apiService.analyzeScan({
        input_data: inputValue,
        file: selectedFile || undefined,
        sharePublicly,
      });
      setResult(res);
      setActiveTab("result");
    } catch (err: any) {
      setError(err.message || "An error occurred during scanning.");
    } finally {
      setIsScanning(false);
    }
  }, [inputValue, selectedFile, sharePublicly]);

  const handleReset = () => {
    setInputValue("");
    setSelectedFile(null);
    setResult(null);
    setError(null);
    setActiveTab("scan");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setSelectedFile(f);
  };

  const riskLevel = result ? getRiskLevel(result.risk_score) : null;
  const riskColor = result ? getRiskColor(result.risk_score) : null;

  return (
    <div className="w-full px-2 sm:px-3 lg:px-4 py-3 sm:py-4">
      <div className="relative w-full max-w-[1400px] mx-auto rounded-2xl sm:rounded-[2rem] overflow-hidden min-h-[85vh]">
        {/* Background Image Setup */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{
            backgroundImage: 'url(/newha.png)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 100%)'
          }}
        />

        {/* Content Container */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-4 sm:space-y-6 animate-fade-in">
          {/* Page Header */}
          <div className="text-center">
            {/* <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-500/10 border border-accent-500/20 text-accent-400 text-xs font-semibold mb-4">
          <Shield className="w-3.5 h-3.5" />
          AI-Powered Threat Scanner
        </div> */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-surface-100">
              Unified Threat <span className="text-accent-500">Scanner</span>
            </h1>
            <p className="text-xs sm:text-sm text-surface-500 mt-1.5 sm:mt-2 max-w-lg mx-auto px-2 sm:px-0">
              Paste any text, URL, email, phone number, or upload an image to
              analyze for threats using our AI engine.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-1 bg-surface-900/60 backdrop-blur-md border border-surface-700/50 p-1.5 rounded-2xl">
              <button
                onClick={() => setActiveTab("scan")}
                className={cn(
                  "tab-btn flex items-center gap-2",
                  activeTab === "scan" ? "tab-btn-active" : "tab-btn-inactive"
                )}
              >
                <ScanSearch className="w-4 h-4" />
                Scan
              </button>
              <button
                onClick={() => setActiveTab("result")}
                disabled={!result && !isScanning}
                className={cn(
                  "tab-btn flex items-center gap-2",
                  activeTab === "result" ? "tab-btn-active" : "tab-btn-inactive",
                  !result && !isScanning && "opacity-40 cursor-not-allowed"
                )}
              >
                <FileText className="w-4 h-4" />
                Result
                {result && (
                  <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
                )}
              </button>
            </div>
          </div>

          {/* ────────────── SCAN TAB ────────────── */}
          {activeTab === "scan" && (
            <div className="space-y-6 animate-fade-in">
              <div
                className={cn(
                  "glass-card p-6 border-2 transition-all",
                  dragOver ? "border-accent-500 bg-accent-500/5" : "border-transparent"
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files[0];
                  if (f) setSelectedFile(f);
                }}
              >
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <h3 className="text-xs sm:text-sm font-semibold text-surface-200">
                    Auto-Detect Input
                  </h3>
                </div>

                <div className="relative">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Paste suspicious URL, email, phone number, or text here..."
                    rows={8}
                    className="input-field resize-none font-mono text-xs sm:text-sm pb-12 sm:pb-14"
                  />

                  {/* Embedded File Upload */}
                  <div className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-3 flex justify-between items-center bg-surface-900/50 p-1 sm:p-2 rounded-md sm:rounded-lg backdrop-blur-sm border border-surface-700/50">
                    {selectedFile ? (
                      <div className="flex items-center gap-1.5 text-[11px] sm:text-sm text-accent-300">
                        <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="truncate max-w-[120px] sm:max-w-[200px]">
                          {selectedFile.name}
                        </span>
                        <button
                          onClick={() => setSelectedFile(null)}
                          className="p-0.5 hover:text-danger-400 transition-colors"
                        >
                          <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-[10px] sm:text-xs text-surface-500 flex items-center gap-1.5">
                        <span>Drag & drop image / QR</span>
                      </div>
                    )}

                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1 text-[10px] sm:text-xs bg-surface-800 hover:bg-surface-700 text-surface-300 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md transition-colors flex-shrink-0"
                    >
                      <Upload className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Upload
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-danger-500/10 border border-danger-500/20 rounded-xl text-danger-400 text-sm flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5" />
                    <p>{error}</p>
                  </div>
                )}

                {/* Image Upload Note */}
                <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-accent-500/5 border border-accent-500/15 rounded-lg sm:rounded-xl flex items-start gap-2 sm:gap-2.5">
                  <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] sm:text-xs text-surface-400 leading-relaxed">
                    <span className="text-accent-300 font-semibold">Image scanning note:</span>{" "}
                    The hosted demo runs on Render's free tier with limited resources. Image/OCR scans may be slow or timeout.
                    For reliable image scanning, <a href="https://github.com/Patel-Priyank-1602/Sentinel_Cyber_AI" target="_blank" rel="noopener noreferrer" className="text-accent-400 underline underline-offset-2 hover:text-accent-300 transition-colors">fork the repo</a> and run the backend locally.
                  </p>
                </div>

                {/* Privacy Toggle */}
                <div className="mt-3 sm:mt-4 flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-surface-800/30 rounded-lg sm:rounded-xl border border-surface-700/50">
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={sharePublicly}
                      onChange={(e) => setSharePublicly(e.target.checked)}
                    />
                    <div className="w-8 h-[18px] sm:w-9 sm:h-5 bg-surface-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 sm:after:h-4 sm:after:w-4 after:transition-all peer-checked:bg-accent-500"></div>
                  </label>
                  <div>
                    <p className="text-[11px] sm:text-sm font-semibold text-surface-200 leading-tight">Share Publicly</p>
                    <p className="text-[10px] sm:text-xs text-surface-500 leading-tight">Save to public threat history</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mt-3 sm:mt-4">
                  <button
                    onClick={handleScan}
                    disabled={isScanning || (!inputValue.trim() && !selectedFile)}
                    className={cn(
                      "btn-primary flex items-center justify-center gap-2 text-sm sm:text-base px-4 py-2.5 sm:px-6 sm:py-3",
                      (isScanning || (!inputValue.trim() && !selectedFile)) &&
                      "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
                      </>
                    ) : (
                      <>
                        Analyze with AI
                      </>
                    )}
                  </button>
                  {(inputValue || selectedFile || result || error) && (
                    <button
                      onClick={handleReset}
                      className="btn-secondary flex items-center justify-center gap-2 text-sm sm:text-base px-4 py-2.5 sm:px-6 sm:py-3"
                    >
                      <RotateCcw className="w-4 h-4" /> Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Scanning Animation */}
              {isScanning && (
                <div className="glass-card p-5 sm:p-10 relative overflow-hidden flex flex-col items-center justify-center min-h-[200px] sm:min-h-[300px]">
                  <div className="scan-overlay opacity-30" />
                  
                  {/* Icon */}
                  <div className="relative mb-6">
                    <Shield className="w-12 h-12 sm:w-16 sm:h-16 text-accent-500 animate-pulse relative z-10" />
                    <div className="absolute inset-0 rounded-full bg-accent-500/20 blur-xl animate-pulse" />
                  </div>

                  {/* Title */}
                  <h3 className="text-base sm:text-xl font-bold text-surface-100 mb-4 sm:mb-8 tracking-tight">
                    AI Analysis in Progress
                  </h3>

                  {/* Progress Bar Container */}
                  <div className="w-full max-w-sm space-y-3">
                    {/* The Bar */}
                    <div className="h-1.5 w-full bg-surface-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-accent-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                        style={{ width: `${Math.max(5, Math.min(100, (scanStep / 4) * 100))}%` }}
                      />
                    </div>
                    
                    {/* Step Text */}
                    <div className="flex justify-between items-center text-xs font-medium text-surface-400">
                      <span className="animate-pulse">
                        {scanStep === 0 && "Extracting metadata..."}
                        {scanStep === 1 && "Running heuristics..."}
                        {scanStep === 2 && "Evaluating ML models..."}
                        {scanStep === 3 && "Cross-referencing databases..."}
                        {scanStep >= 4 && "Finalizing risk assessment..."}
                      </span>
                      <span className="text-surface-500">{Math.round(Math.min(100, (scanStep / 4) * 100))}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ────────────── RESULT TAB ────────────── */}
          {activeTab === "result" && (
            <>
              {result && !isScanning ? (
                <div className="space-y-4 animate-fade-in">
                  {/* Risk Score Card */}
                  <div
                    className={cn(
                      "glass-card p-6 border-l-4",
                      riskLevel === "dangerous"
                        ? "border-l-danger-500"
                        : riskLevel === "suspicious"
                          ? "border-l-warning-500"
                          : "border-l-cyber-500"
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                      <div className="flex-shrink-0 flex items-center justify-center">
                        <div className="relative w-28 h-28">
                          <svg
                            className="w-28 h-28 -rotate-90"
                            viewBox="0 0 120 120"
                          >
                            <circle
                              cx="60"
                              cy="60"
                              r="52"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="8"
                              className="text-surface-800"
                            />
                            <circle
                              cx="60"
                              cy="60"
                              r="52"
                              fill="none"
                              stroke={riskColor || "#10b981"}
                              strokeWidth="8"
                              strokeLinecap="round"
                              strokeDasharray={`${((result.risk_score || 0) / 100) * 327
                                } 327`}
                              className="transition-all duration-1000 ease-out"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span
                              className="text-3xl font-extrabold"
                              style={{ color: riskColor || "#10b981" }}
                            >
                              {result.risk_score || 0}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-surface-500">
                              Risk
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          {riskLevel === "dangerous" ? (
                            <ShieldX className="w-6 h-6 text-danger-400" />
                          ) : riskLevel === "suspicious" ? (
                            <ShieldAlert className="w-6 h-6 text-warning-400" />
                          ) : (
                            <ShieldCheck className="w-6 h-6 text-cyber-400" />
                          )}
                          <h2
                            className="text-xl font-bold"
                            style={{ color: riskColor || "#10b981" }}
                          >
                            {result.risk_level || "Unknown"}
                          </h2>
                          <span
                            className={cn(
                              "text-xs font-bold px-3 py-1 rounded-full",
                              riskLevel === "dangerous"
                                ? "badge-dangerous"
                                : riskLevel === "suspicious"
                                  ? "badge-suspicious"
                                  : "badge-safe"
                            )}
                          >
                            {result.attack_type || "None Detected"}
                          </span>
                          {result.detected_type && (
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-surface-800 text-surface-300 border border-surface-700 uppercase">
                              Detected: {result.detected_type}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-surface-400">
                          Phishing Probability:{" "}
                          <span className="font-bold text-surface-200">
                            {((result.phishing_probability || 0) * 100).toFixed(1)}%
                          </span>
                        </p>
                        <div className="flex items-center flex-wrap gap-4 mt-3 text-xs text-surface-500">
                          <span>
                            Urgency:{" "}
                            <span className="text-surface-300 font-semibold">
                              {(
                                (result.features?.urgency_score || 0) * 100
                              ).toFixed(0)}
                              %
                            </span>
                          </span>
                          {result.features?.domain_entropy != null && (
                            <span>
                              Entropy:{" "}
                              <span className="text-surface-300 font-semibold">
                                {Number(result.features.domain_entropy).toFixed(2)}
                              </span>
                            </span>
                          )}
                          <span>
                            Credential Request:{" "}
                            <span
                              className={cn(
                                "font-semibold",
                                result.features?.credential_request
                                  ? "text-danger-400"
                                  : "text-cyber-400"
                              )}
                            >
                              {result.features?.credential_request ? "Yes" : "No"}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Explanation + Recommendations */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="glass-card p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <Eye className="w-4 h-4 text-accent-400" />
                        <h3 className="text-sm font-semibold text-surface-200">
                          AI Explanation
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {result.explanation?.map((e, i) => (
                          <div key={i} className="p-3 rounded-lg bg-surface-800/40">
                            <p className="text-sm text-surface-300">{e}</p>
                          </div>
                        )) || (
                            <p className="text-sm text-surface-500">
                              No explanation provided.
                            </p>
                          )}
                      </div>
                    </div>
                    <div className="glass-card p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <ShieldCheck className="w-4 h-4 text-cyber-400" />
                        <h3 className="text-sm font-semibold text-surface-200">
                          Recommendations
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {result.recommendations?.map((r, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 p-3 rounded-lg bg-surface-800/40"
                          >
                            <CheckCircle2 className="w-4 h-4 text-cyber-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-surface-300">{r}</p>
                          </div>
                        )) || (
                            <p className="text-sm text-surface-500">
                              No recommendations provided.
                            </p>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Suspicious Keywords */}
                  {(result.features?.suspicious_keywords?.length || 0) > 0 && (
                    <div className="glass-card p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-warning-400" />
                        <h3 className="text-sm font-semibold text-surface-200">
                          Suspicious Keywords Detected
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {result.features?.suspicious_keywords?.map((kw) => (
                          <span
                            key={kw}
                            className="px-3 py-1.5 rounded-lg bg-warning-500/15 text-warning-400 text-xs font-semibold border border-warning-500/20"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Back to Scan */}
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={handleReset}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" /> New Scan
                    </button>
                  </div>
                </div>
              ) : isScanning ? (
                <div className="glass-card p-8 relative overflow-hidden animate-fade-in">
                  <div className="scan-overlay" />
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <Shield className="w-16 h-16 text-accent-400 animate-pulse" />
                      <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-accent-400/30 animate-ping" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-surface-200">
                        Processing...
                      </h3>
                      <p className="text-sm text-surface-500 mt-1">
                        Results will appear here shortly.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-card p-16 text-center animate-fade-in">
                  <FileText className="w-12 h-12 text-surface-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-surface-400 mb-2">
                    No Results Yet
                  </h3>
                  <p className="text-sm text-surface-500 mb-6">
                    Run a scan first to see analysis results here.
                  </p>
                  <button
                    onClick={() => setActiveTab("scan")}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <ScanSearch className="w-4 h-4" /> Go to Scan
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
