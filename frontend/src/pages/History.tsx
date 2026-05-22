import { useState, useEffect } from "react";
import {
  ShieldCheck, ShieldAlert, ShieldX, Search, Calendar, Eye,
  Trash2, MessageSquareText, Link2, Image, Mail, QrCode, Phone,
  Loader2, ArrowLeft, CheckCircle2, AlertTriangle, X
} from "lucide-react";
import { cn, getRiskLevel, getRiskColor } from "@/lib/utils";
import { apiService, ScanResponse } from "@/services/api";

const typeIcons: Record<string, any> = {
  text: MessageSquareText,
  url: Link2,
  image: Image,
  email: Mail,
  qr: QrCode,
  phone: Phone,
};

export default function History() {
  const [history, setHistory] = useState<ScanResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");
  const [selectedScan, setSelectedScan] = useState<ScanResponse | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await apiService.getHistory();
      setHistory(data);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiService.deleteScan(id);
      setHistory((prev) => prev.filter((s) => s.id !== id));
      if (selectedScan?.id === id) setSelectedScan(null);
    } catch (err) {
      console.error("Failed to delete scan:", err);
    }
  };

  const filtered = history.filter((s) => {
    const inputStr = (s.input_data || (s as any).input || "").toLowerCase();
    const matchSearch =
      inputStr.includes(search.toLowerCase()) ||
      (s.attack_type && s.attack_type.toLowerCase().includes(search.toLowerCase()));
    const matchRisk =
      filterRisk === "all" || getRiskLevel(s.risk_score) === filterRisk;
    return matchSearch && matchRisk;
  });

  const displayedScans = showAll ? filtered : filtered.slice(0, 6);

  // ──── DETAIL VIEW ────
  if (selectedScan) {
    const scan = selectedScan;
    const riskLevel = getRiskLevel(scan.risk_score);
    const riskColor = getRiskColor(scan.risk_score);

    return (
      <div className="w-full px-2 sm:px-3 lg:px-4 py-3 sm:py-4">
        <div className="relative w-full max-w-[1400px] mx-auto rounded-2xl sm:rounded-[2rem] overflow-hidden min-h-[85vh]">
          <div
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40"
            style={{
              backgroundImage: 'url(/image.png)',
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 100%)'
            }}
          />
          <div className="relative z-10 max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-4 sm:space-y-6 animate-fade-in">
            {/* Back button */}
        <button
          onClick={() => setSelectedScan(null)}
          className="flex items-center gap-2 text-sm text-surface-400 hover:text-accent-400 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to History
        </button>

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
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="flex-shrink-0 flex items-center justify-center">
              <div className="relative w-28 h-28">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8" className="text-surface-800" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke={riskColor} strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${((scan.risk_score || 0) / 100) * 327} 327`}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold" style={{ color: riskColor }}>{scan.risk_score || 0}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-surface-500">Risk</span>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                {riskLevel === "dangerous" ? <ShieldX className="w-6 h-6 text-danger-400" /> : riskLevel === "suspicious" ? <ShieldAlert className="w-6 h-6 text-warning-400" /> : <ShieldCheck className="w-6 h-6 text-cyber-400" />}
                <h2 className="text-xl font-bold" style={{ color: riskColor }}>{scan.risk_level || "Unknown"}</h2>
                <span className={cn("text-xs font-bold px-3 py-1 rounded-full", riskLevel === "dangerous" ? "badge-dangerous" : riskLevel === "suspicious" ? "badge-suspicious" : "badge-safe")}>
                  {scan.attack_type || "None Detected"}
                </span>
                {scan.detected_type && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-surface-800 text-surface-300 border border-surface-700 uppercase">
                    {scan.detected_type}
                  </span>
                )}
              </div>
              <p className="text-sm text-surface-400">Phishing Probability: <span className="font-bold text-surface-200">{((scan.phishing_probability || 0) * 100).toFixed(1)}%</span></p>
              <div className="flex items-center flex-wrap gap-4 mt-3 text-xs text-surface-500">
                <span>Urgency: <span className="text-surface-300 font-semibold">{((scan.features?.urgency_score || 0) * 100).toFixed(0)}%</span></span>
                {scan.features?.domain_entropy != null && <span>Entropy: <span className="text-surface-300 font-semibold">{Number(scan.features.domain_entropy).toFixed(2)}</span></span>}
                <span>Credential Request: <span className={cn("font-semibold", scan.features?.credential_request ? "text-danger-400" : "text-cyber-400")}>{scan.features?.credential_request ? "Yes" : "No"}</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Input Data */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-surface-200 mb-3">Scanned Input</h3>
          <div className="p-4 rounded-xl bg-surface-800/40 font-mono text-sm text-surface-300 break-all">
            {scan.input_data || (scan as any).input || "—"}
          </div>
        </div>

        {/* Explanation + Recommendations */}
        <div className="grid grid-cols-1 gap-4">
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-4 h-4 text-accent-400" />
              <h3 className="text-sm font-semibold text-surface-200">AI Explanation</h3>
            </div>
            <div className="space-y-3">
              {scan.explanation?.map((e, i) => (
                <div key={i} className="p-3 rounded-lg bg-surface-800/40"><p className="text-sm text-surface-300">{e}</p></div>
              )) || <p className="text-sm text-surface-500">No explanation provided.</p>}
            </div>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-cyber-400" />
              <h3 className="text-sm font-semibold text-surface-200">Recommendations</h3>
            </div>
            <div className="space-y-3">
              {scan.recommendations?.map((r, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-surface-800/40">
                  <CheckCircle2 className="w-4 h-4 text-cyber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-surface-300">{r}</p>
                </div>
              )) || <p className="text-sm text-surface-500">No recommendations provided.</p>}
            </div>
          </div>
        </div>

        {/* Suspicious Keywords */}
        {(scan.features?.suspicious_keywords?.length || 0) > 0 && (
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-warning-400" />
              <h3 className="text-sm font-semibold text-surface-200">Suspicious Keywords</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {scan.features?.suspicious_keywords?.map(kw => (
                <span key={kw} className="px-3 py-1.5 rounded-lg bg-warning-500/15 text-warning-400 text-xs font-semibold border border-warning-500/20">{kw}</span>
              ))}
            </div>
          </div>
        )}

        {/* Scan Date */}
        <div className="text-center text-xs text-surface-500 flex items-center justify-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          Scanned on {new Date(scan.created_at).toLocaleString()}
        </div>
        </div>
      </div>
    </div>
  );
}

  // ──── LIST VIEW ────
  return (
      <div className="w-full px-2 sm:px-3 lg:px-4 py-3 sm:py-4">
        <div className="relative w-full max-w-[1400px] mx-auto rounded-2xl sm:rounded-[2rem] overflow-hidden min-h-[85vh]">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{
            backgroundImage: 'url(/image.png)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 100%)'
          }}
        />
        <div className="relative z-10 max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-4 sm:space-y-6 animate-fade-in">
          <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-surface-100">
          Scan <span className="text-accent-500">History</span>
        </h1>
        <p className="text-xs sm:text-sm text-surface-500 mt-1">
          Review all previous threat analysis results. Click any scan to view
          full details.
        </p>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <input
              type="text"
              placeholder="Search scans..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field !pl-10 !py-2.5 text-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { v: "all", l: "All" },
              { v: "dangerous", l: "🔴 Dangerous" },
              { v: "suspicious", l: "🟡 Suspicious" },
              { v: "safe", l: "🟢 Safe" },
            ].map((f) => (
              <button
                key={f.v}
                onClick={() => setFilterRisk(f.v)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-semibold transition-all",
                  filterRisk === f.v
                    ? "bg-accent-500/15 text-accent-400 border border-accent-500/25"
                    : "bg-surface-800/50 text-surface-400 border border-surface-700/50 hover:border-surface-600"
                )}
              >
                {f.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Count */}
      <div className="flex justify-between items-center text-xs text-surface-500 px-1">
        <p>
          Total{" "}
           {history.length} scans
        </p>
        <button
          onClick={fetchHistory}
          className="hover:text-accent-400 transition-colors underline"
        >
          Refresh
        </button>
      </div>

      {/* Scan Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-surface-500 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent-500" />
          <p className="animate-pulse">Loading history...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Search className="w-10 h-10 text-surface-600 mx-auto mb-3" />
          <p className="text-sm text-surface-500">
            {history.length === 0
              ? "You have no scan history yet."
              : "No scans match your filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {displayedScans.map((scan) => {
            const level = getRiskLevel(scan.risk_score);
            const color = getRiskColor(scan.risk_score);
            const typeStr = scan.detected_type || scan.scan_type || "text";
            const TypeIcon = typeIcons[typeStr] || MessageSquareText;

            return (
              <div
                key={scan.id}
                onClick={() => setSelectedScan(scan)}
                className="glass-card-hover p-5 cursor-pointer group relative overflow-hidden"
              >
                {/* Glow */}
                <div
                  className="absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-10 group-hover:opacity-25 transition-opacity"
                  style={{ backgroundColor: color }}
                />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor: `${color}15`,
                          color: color,
                        }}
                      >
                        <TypeIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-surface-400 uppercase">
                          {typeStr}
                        </span>
                        <p className="text-sm text-surface-300 truncate max-w-[140px] sm:max-w-[200px]">
                          {scan.input_data || (scan as any).input}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                        style={{
                          backgroundColor: `${color}15`,
                          color: color,
                        }}
                      >
                        {scan.risk_score}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full",
                          level === "dangerous"
                            ? "badge-dangerous"
                            : level === "suspicious"
                            ? "badge-suspicious"
                            : "badge-safe"
                        )}
                      >
                        {level.toUpperCase()}
                      </span>
                      <span className="text-xs text-surface-500">
                        {scan.attack_type || "No threat"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-surface-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(scan.created_at).toLocaleDateString()}
                      </span>
                      <button
                        onClick={(e) => handleDelete(scan.id, e)}
                        className="p-1.5 rounded-lg hover:bg-danger-500/20 text-surface-500 hover:text-danger-400 opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
          {!showAll && filtered.length > 6 && (
            <div className="flex justify-center pt-2 pb-6">
              <button
                onClick={() => setShowAll(true)}
                className="btn-secondary rounded-full px-8 flex items-center gap-2 text-sm"
              >
                Show All {filtered.length} Scans
              </button>
            </div>
          )}
        </div>
          )}
        </div>
      </div>
    </div>
  );
}
