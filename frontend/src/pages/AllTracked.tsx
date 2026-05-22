import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ShieldAlert, ShieldCheck, ShieldX, TrendingUp, ScanSearch, Zap,
  ArrowRight, Loader2, BarChart2, Clock, X, AlertTriangle, CheckCircle2
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar
} from "recharts";
import { apiService, ScanResponse } from "@/services/api";
import { cn, getRiskColor, getRiskLevel } from "@/lib/utils";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-900 p-3 rounded-xl border border-surface-700/50 shadow-xl">
      <p className="text-xs font-semibold text-surface-300 mb-2">{label}</p>
      {payload.map((e: any, i: number) => (
        <p key={i} className="text-xs flex items-center gap-2" style={{ color: e.color }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} />
          {e.name}: <span className="font-bold text-surface-200">{e.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function AllTracked() {
  const [history, setHistory] = useState<ScanResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedScan, setSelectedFeedScan] = useState<ScanResponse | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await apiService.getHistory();
        setHistory(data);
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();

    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // ── Compute Stats ──
  const stats = useMemo(() => {
    const totalScans = history.length;
    let threatsDetected = 0;
    let safeResults = 0;

    history.forEach((scan) => {
      const risk = getRiskLevel(scan.risk_score);
      if (risk === "dangerous" || risk === "suspicious") threatsDetected++;
      else safeResults++;
    });

    const detectionRate =
      totalScans > 0 ? ((threatsDetected / totalScans) * 100).toFixed(1) : "0.0";

    return [
      { label: "Total Scans", value: totalScans.toString(), color: "text-accent-400", border: "border-accent-500/30", dot: "bg-accent-500" },
      { label: "Threats Detected", value: threatsDetected.toString(), color: "text-danger-400", border: "border-danger-500/30", dot: "bg-danger-500" },
      { label: "Safe Results", value: safeResults.toString(), color: "text-cyber-400", border: "border-cyber-500/30", dot: "bg-cyber-500" },
      { label: "Detection Rate", value: `${detectionRate}%`, color: "text-warning-400", border: "border-warning-500/30", dot: "bg-warning-500" },
    ];
  }, [history]);

  // ── Threat Types (Pie) ──
  const threatTypesData = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    history.forEach((scan) => {
      if (getRiskLevel(scan.risk_score) !== "safe") {
        const type = scan.attack_type || "Unknown";
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      }
    });

    const colors = ["#ef4444", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#10b981"];
    return Object.entries(typeCounts)
      .map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }))
      .sort((a, b) => b.value - a.value);
  }, [history]);

  // ── Input Types (Bar) ──
  const scanSourcesData = useMemo(() => {
    const sourceCounts: Record<string, number> = {};
    history.forEach((scan) => {
      const type = (scan.detected_type || scan.scan_type || "text").toUpperCase();
      sourceCounts[type] = (sourceCounts[type] || 0) + 1;
    });

    return Object.entries(sourceCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [history]);

  // ── Risk Distribution (Area) ──
  const riskDistribution = useMemo(() => {
    const dateMap: Record<string, { safe: number; suspicious: number; dangerous: number }> = {};

    history.forEach((scan) => {
      const date = new Date(scan.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      if (!dateMap[date]) dateMap[date] = { safe: 0, suspicious: 0, dangerous: 0 };
      const level = getRiskLevel(scan.risk_score);
      dateMap[date][level]++;
    });

    return Object.entries(dateMap)
      .map(([date, data]) => ({ date, ...data }))
      .slice(-14);
  }, [history]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-surface-500 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-accent-500" />
        <p className="animate-pulse">Loading analytics...</p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-8 animate-fade-in">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-surface-100 tracking-tight">
              Analytics
            </h1>
            <p className="text-xs sm:text-sm text-surface-500 mt-1">
              Real-time threat intelligence overview
            </p>
          </div>
          <Link
            to="/"
            className="btn-primary flex items-center gap-2 w-fit group"
          >
            <ScanSearch className="w-4 h-4" />
            New Scan
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className={cn("p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-surface-900/60 border transition-colors duration-300 hover:bg-surface-800/60", s.border)}
            >
              <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                <div className={cn("w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full", s.dot)} />
                <p className="text-[8px] sm:text-[10px] font-semibold text-surface-500 uppercase tracking-widest truncate">
                  {s.label}
                </p>
              </div>
              <p className={cn("text-xl sm:text-3xl font-bold tracking-tight", s.color)}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">

          {/* Threat Distribution Pie */}
          <div className="rounded-xl sm:rounded-2xl bg-surface-900/60 border border-surface-700/40 p-4 sm:p-6 flex flex-col">
            <h3 className="text-xs sm:text-sm font-semibold text-surface-200 mb-4 sm:mb-6">
              Threat Distribution
            </h3>
            {threatTypesData.length > 0 ? (
              <>
                <div className="flex-1 min-h-[180px] sm:min-h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={threatTypesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={4}
                      >
                        {threatTypesData.map((e, i) => (
                          <Cell key={i} fill={e.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  {threatTypesData.map((t) => (
                    <div key={t.name} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                        <span className="text-xs text-surface-400">{t.name}</span>
                      </div>
                      <span className="text-xs font-bold text-surface-200">{t.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-surface-500 py-8">
                <ShieldCheck className="w-10 h-10 text-surface-700 mb-3" />
                <p className="text-sm text-surface-400">No threats detected</p>
              </div>
            )}
          </div>

          {/* Input Analysis Bar */}
          <div className="rounded-xl sm:rounded-2xl bg-surface-900/60 border border-surface-700/40 p-4 sm:p-6 flex flex-col">
            <h3 className="text-xs sm:text-sm font-semibold text-surface-200 mb-4 sm:mb-6">
              Scan Volume by Type
            </h3>
            {scanSourcesData.length > 0 ? (
              <div className="flex-1 min-h-[180px] sm:min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={scanSourcesData}
                    layout="vertical"
                    margin={{ top: 0, right: 0, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} opacity={0.5} />
                    <XAxis type="number" tick={{ fill: "#737373", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="type" type="category" tick={{ fill: "#d4d4d4", fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} width={55} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "#262626", opacity: 0.4 }} />
                    <Bar dataKey="count" fill="#f97316" radius={[0, 4, 4, 0]} name="Scans" barSize={22}>
                      {scanSourcesData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? "#f97316" : index === 1 ? "#fb923c" : "#fdba74"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-surface-500 py-8">
                <BarChart2 className="w-10 h-10 text-surface-700 mb-3" />
                <p className="text-sm text-surface-400">No scans yet</p>
              </div>
            )}
          </div>

          {/* Live Threat Feed */}
          <div className="rounded-xl sm:rounded-2xl bg-surface-900/60 border border-surface-700/40 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-700/30">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-danger-500" />
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-danger-500 animate-ping opacity-60" />
                </div>
                <h3 className="text-sm font-semibold text-surface-200">Recent Threats</h3>
              </div>
              <Link
                to="/history"
                className="text-[10px] font-bold uppercase tracking-wider text-accent-400 hover:text-accent-300 transition-colors"
              >
                View All
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[280px]">
              {history.length > 0 ? (
                history.slice(0, 6).map((scan) => {
                  const rLvl = getRiskLevel(scan.risk_score);
                  return (
                    <div
                      key={scan.id}
                      onClick={() => setSelectedFeedScan(scan)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-800/50 transition-colors cursor-pointer group"
                    >
                      <div className={cn(
                        "w-2 h-full min-h-[32px] rounded-full flex-shrink-0",
                        rLvl === "dangerous" ? "bg-danger-500" : rLvl === "suspicious" ? "bg-warning-500" : "bg-cyber-500"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-surface-200 font-medium truncate">
                          {scan.attack_type || "No Threat"}
                        </p>
                        <p className="text-[10px] text-surface-500 mt-0.5">
                          {(scan.detected_type || scan.scan_type || "text").toUpperCase()} · Score {scan.risk_score}
                        </p>
                      </div>
                      <span className="text-[10px] text-surface-600 whitespace-nowrap">
                        {new Date(scan.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-surface-500 py-12">
                  <ScanSearch className="w-10 h-10 text-surface-700 mb-3" />
                  <p className="text-sm">No scans yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Risk Trend Area Chart */}
        {riskDistribution.length > 0 && (
          <div className="rounded-xl sm:rounded-2xl bg-surface-900/60 border border-surface-700/40 p-4 sm:p-6">
            <h3 className="text-xs sm:text-sm font-semibold text-surface-200 mb-4 sm:mb-6">
              Risk Trend Over Time
            </h3>
            <div className="h-[200px] sm:h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={riskDistribution} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSafe" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSuspicious" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDangerous" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" opacity={0.5} />
                  <XAxis dataKey="date" tick={{ fill: "#737373", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#737373", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="safe" name="Safe" stroke="#10b981" fill="url(#colorSafe)" strokeWidth={2} />
                  <Area type="monotone" dataKey="suspicious" name="Suspicious" stroke="#f59e0b" fill="url(#colorSuspicious)" strokeWidth={2} />
                  <Area type="monotone" dataKey="dangerous" name="Dangerous" stroke="#ef4444" fill="url(#colorDangerous)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* ──── Feed Detail Modal ──── */}
      {selectedFeedScan && (() => {
        const scan = selectedFeedScan;
        const rLvl = getRiskLevel(scan.risk_score);
        const rColor = getRiskColor(scan.risk_score);
        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedFeedScan(null)}>
            <div className="relative w-full sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-surface-900 border border-surface-700/50 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              {/* Top accent */}
              <div className="h-1 w-full rounded-t-2xl" style={{ background: rColor }} />

              {/* Header */}
              <div className="flex items-center justify-between p-6 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ borderColor: `${rColor}33`, background: `${rColor}15`, color: rColor }}>
                    {rLvl === "dangerous" ? <ShieldX className="w-5 h-5" /> : rLvl === "suspicious" ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-surface-100">Threat Detail</h3>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-surface-500">{scan.detected_type || scan.scan_type || "text"} scan</p>
                  </div>
                </div>
                <button onClick={() => setSelectedFeedScan(null)} className="p-2 rounded-lg hover:bg-surface-800 text-surface-400 hover:text-surface-200 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 pb-6 space-y-4">
                {/* Risk Score */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-surface-800/50 border border-surface-700/40">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-surface-500">Risk Score</p>
                    <p className="text-3xl font-black mt-1" style={{ color: rColor }}>{scan.risk_score}<span className="text-sm text-surface-500">/100</span></p>
                  </div>
                  <div className={cn("px-3 py-1.5 rounded-full text-xs font-bold uppercase",
                    rLvl === "dangerous" ? "bg-danger-500/20 text-danger-400" : rLvl === "suspicious" ? "bg-warning-500/20 text-warning-400" : "bg-cyber-500/20 text-cyber-400"
                  )}>{rLvl}</div>
                </div>

                {/* Attack Type */}
                <div className="p-4 rounded-xl bg-surface-800/50 border border-surface-700/40">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-surface-500 mb-1">Attack Type</p>
                  <p className="text-sm font-semibold text-surface-200">{scan.attack_type || "None Detected"}</p>
                </div>

                {/* Input Data */}
                {scan.input_data && (
                  <div className="p-4 rounded-xl bg-surface-800/50 border border-surface-700/40">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-surface-500 mb-1">Scanned Input</p>
                    <p className="text-xs text-surface-300 font-mono break-all line-clamp-4">{scan.input_data}</p>
                  </div>
                )}

                {/* Explanations */}
                {scan.explanation && scan.explanation.length > 0 && (
                  <div className="p-4 rounded-xl bg-surface-800/50 border border-surface-700/40">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-3.5 h-3.5 text-warning-400" />
                      <p className="text-[10px] font-bold uppercase tracking-wider text-surface-500">Analysis</p>
                    </div>
                    <ul className="space-y-2">
                      {scan.explanation.map((e, i) => (
                        <li key={i} className="text-xs text-surface-300 pl-4 relative before:absolute before:left-0 before:top-[7px] before:w-1.5 before:h-1.5 before:rounded-full" style={{ '--tw-before-bg': rColor } as any}>
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {scan.recommendations && scan.recommendations.length > 0 && (
                  <div className="p-4 rounded-xl bg-surface-800/50 border border-surface-700/40">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyber-400" />
                      <p className="text-[10px] font-bold uppercase tracking-wider text-surface-500">Recommendations</p>
                    </div>
                    <ul className="space-y-2">
                      {scan.recommendations.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-surface-300">
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-cyber-400 flex-shrink-0" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suspicious Keywords */}
                {scan.features?.suspicious_keywords && scan.features.suspicious_keywords.length > 0 && (
                  <div className="p-4 rounded-xl bg-surface-800/50 border border-surface-700/40">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-surface-500 mb-3">Suspicious Keywords</p>
                    <div className="flex flex-wrap gap-2">
                      {scan.features.suspicious_keywords.map(kw => (
                        <span key={kw} className="px-2.5 py-1 rounded-lg bg-warning-500/10 text-warning-400 text-[11px] font-medium border border-warning-500/20">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="text-center text-[10px] text-surface-500 flex items-center justify-center gap-1.5 pt-1">
                  <Clock className="w-3 h-3" />
                  Scanned on {new Date(scan.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
