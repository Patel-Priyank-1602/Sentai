import { Link, useLocation } from "react-router-dom";
import { Shield, LayoutDashboard, ScanSearch, History, Settings, Bell, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/scan", label: "New Scan", icon: ScanSearch },
  { href: "/history", label: "History", icon: History },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      "hidden lg:flex flex-col h-screen border-r border-surface-800/80 bg-surface-950/90 backdrop-blur-xl transition-all duration-300",
      collapsed ? "w-20" : "w-64"
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 p-6 border-b border-surface-800/80">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyber-500 border-2 border-surface-950 animate-pulse" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-lg font-bold gradient-text">Sentinel AI</h1>
            <p className="text-[10px] font-medium text-surface-500 uppercase tracking-widest">Threat Detection</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} to={item.href} className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
              isActive
                ? "bg-brand-600/20 text-brand-400 border border-brand-500/30 shadow-glow"
                : "text-surface-400 hover:text-surface-200 hover:bg-surface-800/50"
            )}>
              <item.icon className={cn("w-5 h-5 flex-shrink-0 transition-colors", isActive ? "text-brand-400" : "text-surface-500 group-hover:text-surface-300")} />
              {!collapsed && <span>{item.label}</span>}
              {isActive && !collapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />}
            </Link>
          );
        })}
      </nav>

      {/* Collapse */}
      <div className="p-4 border-t border-surface-800/80">
        <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm text-surface-500 hover:text-surface-300 hover:bg-surface-800/50 transition-all">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
        </button>
      </div>

      {/* Status */}
      {!collapsed && (
        <div className="p-4 mx-4 mb-4 rounded-xl bg-cyber-500/10 border border-cyber-500/20">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyber-500 animate-pulse" />
            <span className="text-xs font-medium text-cyber-400">AI Engine Active</span>
          </div>
          <p className="text-[11px] text-surface-500 mt-1">All systems operational</p>
        </div>
      )}
    </aside>
  );
}
