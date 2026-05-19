import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, ShieldCheck, ShieldX, TrendingUp, ScanSearch, Zap, Clock, ArrowRight, Loader2, BarChart2, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { apiService, ScanResponse } from "@/services/api";
import { cn, getRiskColor, getRiskLevel } from "@/lib/utils";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 !rounded-lg border border-surface-700/50 backdrop-blur-md">
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

export default function Dashboard() {
  const [history, setHistory] = useState<ScanResponse[]>([]);
  const [loading, setLoading] = useState(true);

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
    
    // Auto refresh every 10 seconds to keep dashboard live
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Compute stats dynamically from real data
  const stats = useMemo(() => {
    const totalScans = history.length;
    let threatsDetected = 0;
    let safeResults = 0;

    history.forEach(scan => {
        const risk = getRiskLevel(scan.risk_score);
        if (risk === "dangerous" || risk === "suspicious") threatsDetected++;
        else safeResults++;
    });

    const detectionRate = totalScans > 0 ? ((threatsDetected / totalScans) * 100).toFixed(1) : "0.0";

    return [
      { label: "Total Scans", value: totalScans.toString(), icon: ScanSearch, color: "text-brand-400", bg: "bg-brand-500/10" },
      { label: "Threats Detected", value: threatsDetected.toString(), icon: ShieldAlert, color: "text-danger-400", bg: "bg-danger-500/10" },
      { label: "Safe Results", value: safeResults.toString(), icon: ShieldCheck, color: "text-cyber-400", bg: "bg-cyber-500/10" },
      { label: "Detection Rate", value: `${detectionRate}%`, icon: Zap, color: "text-warning-400", bg: "bg-warning-500/10" },
    ];
  }, [history]);

  // Compute threat types dynamically
  const threatTypesData = useMemo(() => {
      const typeCounts: Record<string, number> = {};
      history.forEach(scan => {
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

  // Compute scan source types dynamically
  const scanSourcesData = useMemo(() => {
      const sourceCounts: Record<string, number> = {};
      history.forEach(scan => {
          const type = (scan.detected_type || scan.scan_type).toUpperCase();
          sourceCounts[type] = (sourceCounts[type] || 0) + 1;
      });
      
      return Object.entries(sourceCounts)
          .map(([type, count]) => ({ type, count }))
          .sort((a, b) => b.count - a.count);
  }, [history]);

  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-surface-500 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
              <p className="animate-pulse">Loading live intelligence...</p>
          </div>
      );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-card p-6 border-b-0 rounded-b-none border-x-0 border-t-0 bg-transparent shadow-none">
        <div>
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-400 border border-brand-500/30">
                  <Activity className="w-5 h-5" />
              </div>
              <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-surface-100 to-surface-400">Threat Intelligence</h1>
                  <p className="text-sm text-surface-500 mt-1">Live AI-driven monitoring of malicious activities</p>
              </div>
          </div>
        </div>
        <Link to="/scan" className="btn-primary flex items-center gap-2 w-fit group">
          <ScanSearch className="w-4 h-4 group-hover:scale-110 transition-transform" /> New Analysis <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-1">
        {stats.map((s, i) => (
          <div key={s.label} className="glass-card-hover p-5 group relative overflow-hidden" style={{ animationDelay: `${i * 100}ms` }}>
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-20 transition-opacity group-hover:opacity-40 ${s.bg}`} />
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest">{s.label}</p>
                <p className="text-3xl font-bold text-surface-100 mt-2 tracking-tight">{s.value}</p>
              </div>
              <div className={cn("p-3 rounded-xl border border-white/5 transition-transform duration-300 group-hover:scale-110", s.bg, s.color)}>
                <s.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-1">
        
        {/* Threat Distribution Pie */}
        <div className="glass-card p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
              <ShieldAlert className="w-4 h-4 text-brand-400" />
              <h3 className="text-sm font-semibold text-surface-200">Threat Distribution</h3>
          </div>
          
          {threatTypesData.length > 0 ? (
              <>
                  <div className="flex-1 min-h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={threatTypesData} 
                            cx="50%" cy="50%" 
                            innerRadius={60} 
                            outerRadius={85} 
                            paddingAngle={5} 
                            dataKey="value" 
                            stroke="none"
                            cornerRadius={4}
                          >
                            {threatTypesData.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                  </div>
                  <div className="space-y-3 mt-4">
                    {threatTypesData.map(t => (
                      <div key={t.name} className="flex items-center justify-between p-2 rounded-lg bg-surface-800/30 border border-surface-700/30">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-md shadow-sm" style={{ backgroundColor: t.color }} />
                          <span className="text-xs font-medium text-surface-300 truncate max-w-[120px]">{t.name}</span>
                        </div>
                        <span className="text-xs font-bold text-surface-100 bg-surface-900 px-2 py-1 rounded-md">{t.value}</span>
                      </div>
                    ))}
                  </div>
              </>
          ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-surface-500">
                  <ShieldCheck className="w-12 h-12 text-cyber-500/20 mb-3" />
                  <p className="text-sm font-medium text-surface-400">No threats detected yet</p>
              </div>
          )}
        </div>

        {/* Input Types Bar */}
        <div className="glass-card p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
              <BarChart2 className="w-4 h-4 text-cyber-400" />
              <h3 className="text-sm font-semibold text-surface-200">Input Analysis Volume</h3>
          </div>
          
          {scanSourcesData.length > 0 ? (
              <div className="flex-1 min-h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scanSourcesData} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} opacity={0.5} />
                      <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="type" type="category" tick={{ fill: "#cbd5e1", fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} width={60} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b', opacity: 0.4 }} />
                      <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} name="Analyses" barSize={24}>
                          {scanSourcesData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index === 0 ? "#10b981" : index === 1 ? "#3b82f6" : "#6366f1"} />
                          ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
              </div>
          ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-surface-500">
                  <ScanSearch className="w-12 h-12 text-brand-500/20 mb-3" />
                  <p className="text-sm font-medium text-surface-400">No scans performed yet</p>
              </div>
          )}
        </div>

        {/* Live Threat Feed */}
        <div className="glass-card flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-6 pb-4 border-b border-surface-700/50 bg-surface-900/50">
            <div className="flex items-center gap-2">
                <div className="relative">
                    <div className="w-2 h-2 rounded-full bg-danger-500" />
                    <div className="absolute inset-0 w-2 h-2 rounded-full bg-danger-500 animate-ping opacity-75" />
                </div>
                <h3 className="text-sm font-semibold text-surface-200">Live Threat Feed</h3>
            </div>
            <Link to="/history" className="text-[10px] font-bold uppercase tracking-wider text-brand-400 hover:text-brand-300 transition-colors">View Logs</Link>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar min-h-[300px]">
            {history.length > 0 ? (
                history.slice(0, 7).map((scan, i) => {
                  const rLvl = getRiskLevel(scan.risk_score);
                  return (
                      <div key={scan.id} className="flex items-start gap-3 p-3 rounded-xl bg-surface-800/20 hover:bg-surface-800/60 border border-transparent hover:border-surface-700/50 transition-all cursor-pointer group" style={{ animationDelay: `${i * 50}ms` }}>
                        <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border transition-colors group-hover:border-transparent", 
                            rLvl === "dangerous" ? "bg-danger-500/10 text-danger-400 border-danger-500/20" : 
                            rLvl === "suspicious" ? "bg-warning-500/10 text-warning-400 border-warning-500/20" : 
                            "bg-cyber-500/10 text-cyber-400 border-cyber-500/20"
                        )}>
                          {rLvl === "dangerous" ? <ShieldX className="w-4 h-4" /> : rLvl === "suspicious" ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400 flex items-center gap-1.5">
                                {(scan.detected_type || scan.scan_type)}
                                <span className={cn("px-1.5 py-0.5 rounded-sm text-[9px]", 
                                    rLvl === "dangerous" ? "bg-danger-500/20 text-danger-300" : 
                                    rLvl === "suspicious" ? "bg-warning-500/20 text-warning-300" : 
                                    "bg-cyber-500/20 text-cyber-300"
                                )}>
                                    {scan.risk_score} RISK
                                </span>
                            </span>
                            <span className="text-[9px] text-surface-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">Just now</span>
                          </div>
                          <p className="text-xs text-surface-300 truncate">{scan.attack_type || "No Threat Detected"}</p>
                        </div>
                      </div>
                  );
                })
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-surface-500">
                    <p className="text-sm">Feed is empty</p>
                </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
