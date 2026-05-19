import { useState, useEffect } from "react";
import { ShieldCheck, ShieldAlert, ShieldX, Search, Download, Calendar, Eye, Trash2, MessageSquareText, Link2, Image, Mail, QrCode, Phone, Loader2 } from "lucide-react";
import { cn, getRiskLevel, getRiskColor } from "@/lib/utils";
import { apiService, ScanResponse } from "@/services/api";

const typeIcons: Record<string, any> = { text: MessageSquareText, url: Link2, image: Image, email: Mail, qr: QrCode, phone: Phone };

export default function History() {
  const [history, setHistory] = useState<ScanResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");
  const [filterType, setFilterType] = useState("all");

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

  const handleDelete = async (id: string) => {
      try {
          await apiService.deleteScan(id);
          setHistory(prev => prev.filter(s => s.id !== id));
      } catch (err) {
          console.error("Failed to delete scan:", err);
      }
  };

  const filtered = history.filter(s => {
    const inputStr = (s.input_data || (s as any).input || "").toLowerCase();
    const typeStr = (s.detected_type || s.scan_type || "").toLowerCase();
    
    const matchSearch = inputStr.includes(search.toLowerCase()) || (s.attack_type && s.attack_type.toLowerCase().includes(search.toLowerCase()));
    const matchRisk = filterRisk === "all" || getRiskLevel(s.risk_score) === filterRisk;
    const matchType = filterType === "all" || typeStr === filterType;
    return matchSearch && matchRisk && matchType;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-surface-100">Scan History</h1>
          <p className="text-sm text-surface-500 mt-1">Review all previous threat analysis results</p>
        </div>
        <button className="btn-secondary flex items-center gap-2 w-fit"><Download className="w-4 h-4" /> Export CSV</button>
      </div>

      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <input type="text" placeholder="Search scans..." value={search} onChange={e => setSearch(e.target.value)} className="input-field !pl-10 !py-2.5 text-sm" />
          </div>
          <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)} className="input-field !py-2.5 text-sm !w-auto min-w-[150px] cursor-pointer">
            <option value="all">All Risk Levels</option>
            <option value="dangerous">🔴 Dangerous</option>
            <option value="suspicious">🟡 Suspicious</option>
            <option value="safe">🟢 Safe</option>
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input-field !py-2.5 text-sm !w-auto min-w-[130px] cursor-pointer">
            <option value="all">All Types</option>
            <option value="text">Text / SMS</option>
            <option value="url">URL</option>
            <option value="image">Image</option>
            <option value="email">Email</option>
            <option value="qr">QR Code</option>
            <option value="phone">Phone</option>
          </select>
        </div>
      </div>

      <div className="flex justify-between items-center text-xs text-surface-500 px-1">
          <p>Showing <span className="text-surface-300 font-semibold">{filtered.length}</span> of {history.length} scans</p>
          <button onClick={fetchHistory} className="hover:text-surface-300 transition-colors underline">Refresh Log</button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-64 text-surface-500 gap-4">
                 <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                 <p className="animate-pulse">Loading history...</p>
             </div>
          ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-800/80 bg-surface-900/30">
                {["Type", "Input", "Risk", "Attack Type", "Date", ""].map((h, i) => (
                  <th key={h || i} className={cn("px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wider", i === 5 ? "text-right" : "text-left")}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(scan => {
                const level = getRiskLevel(scan.risk_score);
                const color = getRiskColor(scan.risk_score);
                const typeStr = scan.detected_type || scan.scan_type || "text";
                const TypeIcon = typeIcons[typeStr] || MessageSquareText;
                
                return (
                  <tr key={scan.id} className="border-b border-surface-800/40 hover:bg-surface-800/30 transition-colors group">
                    <td className="px-5 py-4"><div className="flex items-center gap-2"><TypeIcon className="w-4 h-4 text-surface-400" /><span className="text-xs font-semibold text-surface-400 uppercase">{typeStr}</span></div></td>
                    <td className="px-5 py-4"><p className="text-sm text-surface-300 truncate max-w-xs">{scan.input_data || (scan as any).input}</p></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ backgroundColor: `${color}20`, color }}>{scan.risk_score}</div>
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", level === "dangerous" ? "badge-dangerous" : level === "suspicious" ? "badge-suspicious" : "badge-safe")}>{level.toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4"><span className="text-xs text-surface-400">{scan.attack_type}</span></td>
                    <td className="px-5 py-4"><div className="flex items-center gap-1.5 text-surface-500"><Calendar className="w-3 h-3" /><span className="text-xs">{new Date(scan.created_at).toLocaleDateString()}</span></div></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleDelete(scan.id)} className="p-2 rounded-lg hover:bg-danger-500/20 text-surface-400 hover:text-danger-400" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          )}
        </div>
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16"><Search className="w-10 h-10 text-surface-600 mx-auto mb-3" /><p className="text-sm text-surface-500">{history.length === 0 ? "You have no scan history yet." : "No scans match your filters"}</p></div>
        )}
      </div>
    </div>
  );
}
