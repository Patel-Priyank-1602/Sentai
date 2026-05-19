import { useState } from "react";
import { Shield, Bell, Palette, Save, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Settings() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    notifications: true, emailAlerts: true, autoScan: false,
    sensitivity: "balanced", theme: "dark",
  });

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const toggle = (key: string) => setSettings(s => ({ ...s, [key]: !s[key as keyof typeof s] }));

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-surface-100">Settings</h1>
        <p className="text-sm text-surface-500 mt-1">Configure your Sentinel AI preferences</p>
      </div>

      {/* Notifications */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-5"><Bell className="w-5 h-5 text-brand-400" /><h3 className="text-base font-semibold text-surface-200">Notifications</h3></div>
        <div className="space-y-4">
          {[{ key: "notifications", label: "Push Notifications", desc: "Get notified about high-risk scan results" }, { key: "emailAlerts", label: "Email Alerts", desc: "Receive email summaries of critical threats" }].map(item => (
            <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-surface-800/30">
              <div><p className="text-sm font-medium text-surface-200">{item.label}</p><p className="text-xs text-surface-500 mt-0.5">{item.desc}</p></div>
              <button onClick={() => toggle(item.key)} className={cn("w-12 h-7 rounded-full transition-all duration-300 relative", (settings as any)[item.key] ? "bg-brand-500" : "bg-surface-700")}>
                <div className={cn("w-5 h-5 rounded-full bg-white absolute top-1 transition-all duration-300", (settings as any)[item.key] ? "left-6" : "left-1")} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Detection */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-5"><Shield className="w-5 h-5 text-cyber-400" /><h3 className="text-base font-semibold text-surface-200">Detection Settings</h3></div>
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-surface-800/30">
            <p className="text-sm font-medium text-surface-200 mb-3">Sensitivity Level</p>
            <div className="grid grid-cols-3 gap-2">
              {[{ v: "low", l: "Low", d: "Fewer alerts" }, { v: "balanced", l: "Balanced", d: "Recommended" }, { v: "high", l: "High", d: "Max protection" }].map(s => (
                <button key={s.v} onClick={() => setSettings(p => ({ ...p, sensitivity: s.v }))}
                  className={cn("p-3 rounded-xl text-center transition-all border", settings.sensitivity === s.v ? "bg-brand-600/20 border-brand-500/40 text-brand-400" : "bg-surface-800/50 border-surface-700/50 text-surface-400 hover:border-surface-600")}>
                  <p className="text-sm font-semibold">{s.l}</p><p className="text-[11px] text-surface-500 mt-0.5">{s.d}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-surface-800/30">
            <div><p className="text-sm font-medium text-surface-200">Auto-Scan URLs</p><p className="text-xs text-surface-500 mt-0.5">Automatically scan URLs pasted in the input</p></div>
            <button onClick={() => toggle("autoScan")} className={cn("w-12 h-7 rounded-full transition-all duration-300 relative", settings.autoScan ? "bg-brand-500" : "bg-surface-700")}>
              <div className={cn("w-5 h-5 rounded-full bg-white absolute top-1 transition-all duration-300", settings.autoScan ? "left-6" : "left-1")} />
            </button>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-5"><Palette className="w-5 h-5 text-warning-400" /><h3 className="text-base font-semibold text-surface-200">Appearance</h3></div>
        <div className="grid grid-cols-2 gap-3">
          {[{ v: "dark", l: "Dark Mode", e: "🌙" }, { v: "light", l: "Light Mode", e: "☀️" }].map(t => (
            <button key={t.v} onClick={() => setSettings(s => ({ ...s, theme: t.v }))}
              className={cn("p-4 rounded-xl text-center transition-all border", settings.theme === t.v ? "bg-brand-600/20 border-brand-500/40 text-brand-400" : "bg-surface-800/50 border-surface-700/50 text-surface-400 hover:border-surface-600")}>
              <span className="text-2xl">{t.e}</span><p className="text-sm font-semibold mt-2">{t.l}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} className="btn-primary flex items-center gap-2">
          {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Settings</>}
        </button>
      </div>
    </div>
  );
}
