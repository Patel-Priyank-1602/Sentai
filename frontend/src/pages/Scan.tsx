import { useState, useCallback, useRef } from "react";
import {
  Upload, Shield, ShieldAlert, ShieldCheck, ShieldX,
  AlertTriangle, CheckCircle2, Loader2, Sparkles, RotateCcw, Eye, X, Image as ImageIcon
} from "lucide-react";
import { cn, getRiskColor, getRiskLabel, getRiskLevel } from "@/lib/utils";
import { apiService, ScanResponse } from "@/services/api";

export default function Scan() {
  const [inputValue, setInputValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScan = useCallback(async () => {
    if (!inputValue.trim() && !selectedFile) return;
    
    setIsScanning(true); 
    setResult(null);
    setError(null);
    
    try { 
      const res = await apiService.analyzeScan({
          input_data: inputValue,
          file: selectedFile || undefined
      });
      setResult(res); 
    } catch (err: any) {
      setError(err.message || "An error occurred during scanning.");
    } finally { 
      setIsScanning(false); 
    }
  }, [inputValue, selectedFile]);

  const handleReset = () => { 
    setInputValue(""); 
    setSelectedFile(null);
    setResult(null); 
    setError(null);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) setSelectedFile(f);
  };

  const riskLevel = result ? getRiskLevel(result.risk_score) : null;
  const riskColor = result ? getRiskColor(result.risk_score) : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-surface-100">Unified Threat Scanner</h1>
        <p className="text-sm text-surface-500 mt-1">Paste any text, URL, email, phone number, or upload an image to analyze for threats.</p>
      </div>

      {/* Input Section */}
      <div 
        className={cn("glass-card p-6 border-2 transition-all", dragOver ? "border-brand-500 bg-brand-500/5" : "border-transparent")}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }} 
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setSelectedFile(f); }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-brand-400" />
          <h3 className="text-sm font-semibold text-surface-200">Auto-Detect Input</h3>
        </div>
        
        <div className="relative">
            <textarea 
              value={inputValue} 
              onChange={e => setInputValue(e.target.value)} 
              placeholder="Paste suspicious URL, email, phone number, or text here..." 
              rows={6} 
              className="input-field resize-none font-mono text-sm pb-14" 
            />
            
            {/* Embedded File Upload/Indicator inside textarea area */}
            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center bg-surface-900/50 p-2 rounded-lg backdrop-blur-sm border border-surface-700/50">
                {selectedFile ? (
                    <div className="flex items-center gap-2 text-sm text-brand-300">
                        <ImageIcon className="w-4 h-4" />
                        <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                        <button onClick={() => setSelectedFile(null)} className="p-1 hover:text-danger-400 transition-colors">
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ) : (
                    <div className="text-xs text-surface-500 flex items-center gap-2">
                        <span>Or drag & drop an image/QR code</span>
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
                    className="flex items-center gap-1.5 text-xs bg-surface-800 hover:bg-surface-700 text-surface-300 px-3 py-1.5 rounded-md transition-colors"
                >
                    <Upload className="w-3.5 h-3.5" /> Upload Image
                </button>
            </div>
        </div>

        {error && (
            <div className="mt-4 p-3 bg-danger-500/10 border border-danger-500/20 rounded-xl text-danger-400 text-sm flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5" />
                <p>{error}</p>
            </div>
        )}

        <div className="flex items-center gap-3 mt-4">
          <button 
            onClick={handleScan} 
            disabled={isScanning || (!inputValue.trim() && !selectedFile)} 
            className={cn("btn-primary flex items-center gap-2", (isScanning || (!inputValue.trim() && !selectedFile)) && "opacity-50 cursor-not-allowed")}
          >
            {isScanning ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Sparkles className="w-4 h-4" /> Analyze with AI</>}
          </button>
          {(inputValue || selectedFile || result || error) && (
            <button onClick={handleReset} className="btn-secondary flex items-center gap-2">
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Scanning animation */}
      {isScanning && (
        <div className="glass-card p-8 relative overflow-hidden">
          <div className="scan-overlay" />
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Shield className="w-16 h-16 text-brand-400 animate-pulse" />
              <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-brand-400/30 animate-ping" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-surface-200">AI Analysis in Progress</h3>
              <p className="text-sm text-surface-500 mt-1">Auto-detecting type, running ML models, heuristics, and OCR...</p>
            </div>
            <div className="flex items-center gap-6 mt-2">
              {["Input Analysis", "Heuristics", "ML Prediction", "Risk Scoring"].map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", i <= 1 ? "bg-cyber-400 animate-pulse" : "bg-surface-600")} />
                  <span className={cn("text-[11px] font-medium", i <= 1 ? "text-cyber-400" : "text-surface-600")}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && !isScanning && (
        <div className="space-y-4 animate-slide-up">
          <div className={cn("glass-card p-6 border-l-4", riskLevel === "dangerous" ? "border-l-danger-500" : riskLevel === "suspicious" ? "border-l-warning-500" : "border-l-cyber-500")}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex-shrink-0 flex items-center justify-center">
                <div className="relative w-28 h-28">
                  <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8" className="text-surface-800" />
                    <circle cx="60" cy="60" r="52" fill="none" stroke={riskColor || "#10b981"} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${((result.risk_score || 0) / 100) * 327} 327`} className="transition-all duration-1000 ease-out" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-extrabold" style={{ color: riskColor || "#10b981" }}>{result.risk_score || 0}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-surface-500">Risk</span>
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {riskLevel === "dangerous" ? <ShieldX className="w-6 h-6 text-danger-400" /> : riskLevel === "suspicious" ? <ShieldAlert className="w-6 h-6 text-warning-400" /> : <ShieldCheck className="w-6 h-6 text-cyber-400" />}
                  <h2 className="text-xl font-bold" style={{ color: riskColor || "#10b981" }}>{result.risk_level || "Unknown"}</h2>
                  <span className={cn("text-xs font-bold px-3 py-1 rounded-full", riskLevel === "dangerous" ? "badge-dangerous" : riskLevel === "suspicious" ? "badge-suspicious" : "badge-safe")}>{result.attack_type || "None Detected"}</span>
                  
                  {result.detected_type && (
                     <span className="text-xs font-bold px-3 py-1 rounded-full bg-surface-800 text-surface-300 border border-surface-700 uppercase">
                         Detected: {result.detected_type}
                     </span>
                  )}
                </div>
                <p className="text-sm text-surface-400">Phishing Probability: <span className="font-bold text-surface-200">{((result.phishing_probability || 0) * 100).toFixed(1)}%</span></p>
                <div className="flex items-center flex-wrap gap-4 mt-3 text-xs text-surface-500">
                  <span>Urgency: <span className="text-surface-300 font-semibold">{((result.features?.urgency_score || 0) * 100).toFixed(0)}%</span></span>
                  {result.features?.domain_entropy != null && <span>Entropy: <span className="text-surface-300 font-semibold">{Number(result.features.domain_entropy).toFixed(2)}</span></span>}
                  <span>Credential Request: <span className={cn("font-semibold", result.features?.credential_request ? "text-danger-400" : "text-cyber-400")}>{result.features?.credential_request ? "Yes" : "No"}</span></span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4"><Eye className="w-4 h-4 text-brand-400" /><h3 className="text-sm font-semibold text-surface-200">AI Explanation</h3></div>
              <div className="space-y-3">{result.explanation?.map((e, i) => <div key={i} className="p-3 rounded-lg bg-surface-800/40"><p className="text-sm text-surface-300">{e}</p></div>) || <p className="text-sm text-surface-500">No explanation provided.</p>}</div>
            </div>
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4"><ShieldCheck className="w-4 h-4 text-cyber-400" /><h3 className="text-sm font-semibold text-surface-200">Recommendations</h3></div>
              <div className="space-y-3">{result.recommendations?.map((r, i) => <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-surface-800/40"><CheckCircle2 className="w-4 h-4 text-cyber-400 flex-shrink-0 mt-0.5" /><p className="text-sm text-surface-300">{r}</p></div>) || <p className="text-sm text-surface-500">No recommendations provided.</p>}</div>
            </div>
          </div>

          {(result.features?.suspicious_keywords?.length || 0) > 0 && (
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3"><AlertTriangle className="w-4 h-4 text-warning-400" /><h3 className="text-sm font-semibold text-surface-200">Suspicious Keywords Detected</h3></div>
              <div className="flex flex-wrap gap-2">{result.features?.suspicious_keywords?.map(kw => <span key={kw} className="px-3 py-1.5 rounded-lg bg-warning-500/15 text-warning-400 text-xs font-semibold border border-warning-500/20">{kw}</span>)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
