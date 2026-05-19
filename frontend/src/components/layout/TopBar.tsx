import { Bell, Search, Menu, Shield, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const mobileNav = [
  { href: "/", label: "Dashboard" },
  { href: "/scan", label: "New Scan" },
  { href: "/history", label: "History" },
  { href: "/alerts", label: "Alerts" },
  { href: "/settings", label: "Settings" },
];

export function TopBar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { pathname } = useLocation();

  const pageTitle = (() => {
    switch (pathname) {
      case "/": return "Dashboard";
      case "/scan": return "New Scan";
      case "/history": return "Scan History";
      case "/alerts": return "Alerts";
      case "/settings": return "Settings";
      default: return "Sentinel AI";
    }
  })();

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-6 lg:px-8 border-b border-surface-800/80 bg-surface-950/80 backdrop-blur-xl">
        <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-800/50 transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <div className="lg:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm gradient-text">Sentinel AI</span>
        </div>
        <div className="hidden lg:block">
          <h2 className="text-lg font-semibold text-surface-200">{pageTitle}</h2>
        </div>
        <div className="flex items-center gap-2">
          {searchOpen ? (
            <div className="flex items-center gap-2 animate-slide-down">
              <input type="text" placeholder="Search scans..." className="input-field w-48 lg:w-64 !py-2 text-sm" autoFocus onBlur={() => setSearchOpen(false)} />
              <button onClick={() => setSearchOpen(false)} className="p-2 rounded-lg text-surface-400 hover:text-surface-200"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <button onClick={() => setSearchOpen(true)} className="p-2.5 rounded-xl text-surface-400 hover:text-surface-200 hover:bg-surface-800/50 transition-all" title="Search">
              <Search className="w-4 h-4" />
            </button>
          )}
          <button className="relative p-2.5 rounded-xl text-surface-400 hover:text-surface-200 hover:bg-surface-800/50 transition-all" title="Notifications">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger-500 animate-pulse" />
          </button>
          <button className="ml-2 w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-cyber-500 flex items-center justify-center text-white text-sm font-bold hover:shadow-glow transition-shadow">U</button>
        </div>
      </header>

      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-surface-950 border-r border-surface-800 p-6 lg:hidden animate-slide-up">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold gradient-text">Sentinel AI</h1>
                <p className="text-[10px] font-medium text-surface-500 uppercase tracking-widest">Threat Detection</p>
              </div>
            </div>
            <nav className="space-y-2">
              {mobileNav.map(item => (
                <Link key={item.href} to={item.href} onClick={() => setMobileOpen(false)}
                  className={cn("block px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    pathname === item.href ? "bg-brand-600/20 text-brand-400 border border-brand-500/30" : "text-surface-400 hover:text-surface-200 hover:bg-surface-800/50"
                  )}>{item.label}</Link>
              ))}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
