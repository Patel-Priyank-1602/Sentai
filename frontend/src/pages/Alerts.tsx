import { ShieldAlert, ShieldX, AlertTriangle, BellOff, CheckCircle2, Clock } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const mockAlerts = [
  { id: "a1", severity: "critical", title: "Phishing URL Detected", description: "URL mimicking Amazon login detected. Typosquatting with .xyz TLD.", recommendation: "Block this URL and report to anti-phishing databases.", created_at: "2025-01-15T10:30:00Z", read: false },
  { id: "a2", severity: "critical", title: "Business Email Compromise", description: "Email impersonating CEO requesting wire transfer. Classic BEC pattern.", recommendation: "Verify wire transfers via phone call to actual sender.", created_at: "2025-01-12T09:00:00Z", read: false },
  { id: "a3", severity: "high", title: "Gift Card Scam SMS", description: "SMS offering fake $500 gift card. Advance-fee fraud pattern.", recommendation: "Delete the message. Legitimate companies don't offer prizes via unsolicited SMS.", created_at: "2025-01-13T19:30:00Z", read: true },
  { id: "a4", severity: "medium", title: "Suspicious QR Redirect", description: "QR code points to URL shortener which may redirect to malicious site.", recommendation: "Avoid scanning unknown QR codes.", created_at: "2025-01-14T11:00:00Z", read: true },
  { id: "a5", severity: "high", title: "Fake Banking Notification", description: "Screenshot contains fake banking notification with urgency language.", recommendation: "Contact your bank directly via official channels.", created_at: "2025-01-13T12:45:00Z", read: false },
];

const sevCfg: Record<string, any> = {
  critical: { icon: ShieldX, color: "text-danger-400", bg: "bg-danger-500/15", border: "border-danger-500/30", label: "CRITICAL", labelBg: "bg-danger-500/20 text-danger-400" },
  high: { icon: ShieldAlert, color: "text-warning-400", bg: "bg-warning-500/15", border: "border-warning-500/30", label: "HIGH", labelBg: "bg-warning-500/20 text-warning-400" },
  medium: { icon: AlertTriangle, color: "text-brand-400", bg: "bg-brand-500/15", border: "border-brand-500/30", label: "MEDIUM", labelBg: "bg-brand-500/20 text-brand-400" },
};

export default function Alerts() {
  const [filter, setFilter] = useState("all");
  const [alerts, setAlerts] = useState(mockAlerts);
  const filtered = filter === "all" ? alerts : filter === "unread" ? alerts.filter(a => !a.read) : alerts.filter(a => a.severity === filter);
  const unreadCount = alerts.filter(a => !a.read).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-surface-100 flex items-center gap-3">
            Alerts
            {unreadCount > 0 && <span className="text-sm font-bold px-3 py-1 rounded-full bg-danger-500/20 text-danger-400 border border-danger-500/30">{unreadCount} new</span>}
          </h1>
          <p className="text-sm text-surface-500 mt-1">Security alerts from threat detections</p>
        </div>
        <button onClick={() => setAlerts(alerts.map(a => ({ ...a, read: true })))} className="btn-secondary flex items-center gap-2 w-fit">
          <CheckCircle2 className="w-4 h-4" /> Mark All Read
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {[{ v: "all", l: "All" }, { v: "unread", l: `Unread (${unreadCount})` }, { v: "critical", l: "🔴 Critical" }, { v: "high", l: "🟠 High" }, { v: "medium", l: "🟡 Medium" }].map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)} className={cn("px-4 py-2 rounded-xl text-xs font-semibold transition-all", filter === f.v ? "bg-brand-600/20 text-brand-400 border border-brand-500/30" : "bg-surface-800/50 text-surface-400 border border-surface-700/50 hover:border-surface-600")}>{f.l}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(alert => {
          const c = sevCfg[alert.severity]; const Icon = c.icon;
          return (
            <div key={alert.id} className={cn("glass-card p-5 border-l-4 transition-all", c.border, !alert.read && "ring-1 ring-brand-500/10")}>
              <div className="flex items-start gap-4">
                <div className={cn("p-2.5 rounded-xl flex-shrink-0", c.bg)}><Icon className={cn("w-5 h-5", c.color)} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                    <h3 className="text-sm font-semibold text-surface-200">{alert.title}</h3>
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", c.labelBg)}>{c.label}</span>
                    {!alert.read && <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />}
                  </div>
                  <p className="text-sm text-surface-400 mb-3">{alert.description}</p>
                  <div className="p-3 rounded-lg bg-cyber-500/10 border border-cyber-500/20">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-cyber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-cyber-300">{alert.recommendation}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 text-surface-500">
                    <Clock className="w-3 h-3" /><span className="text-[11px]">{new Date(alert.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="glass-card p-12 text-center"><BellOff className="w-10 h-10 text-surface-600 mx-auto mb-3" /><p className="text-sm text-surface-500">No alerts match your filter</p></div>
        )}
      </div>
    </div>
  );
}
