import { Link, useLocation } from "react-router-dom";
import {
  Github, Menu, X, ScanSearch,
  History, Info, MessageSquare, BarChart3, Linkedin, Mail,
  Shield, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const navLinks = [
  { href: "/scan", label: "New Scan", icon: ScanSearch },
  { href: "/history", label: "History", icon: History },
  { href: "/", label: "All Tracked", icon: BarChart3 },
  { href: "/about", label: "About", icon: Info },
  { href: "/contact", label: "Contact", icon: MessageSquare },
];

const socialLinks = [
  {
    href: "https://github.com/Patel-Priyank-1602/Sentinel_Cyber_AI",
    label: "GitHub",
    icon: Github,
    color: "#e5e5e5",
  },
  {
    href: "https://www.linkedin.com/in/patel-priyank-d/",
    label: "LinkedIn",
    icon: Linkedin,
    color: "#0a66c2",
  },
  {
    href: "mailto:patelpriyank2526@gmail.com",
    label: "Email",
    icon: Mail,
    color: "#f97316",
  },
];

export function Navbar() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-surface-800/60 bg-surface-950/80 backdrop-blur-xl">
        <div className="w-full px-4 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-20">
            {/* Left — Logo + Name */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <img 
                  src="/iconbgno.png" 
                  alt="Sentinel Logo" 
                  className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md group-hover:drop-shadow-glow transition-all duration-300 group-hover:scale-110" 
                />
              </div>
              <div className="group-hover:translate-x-1 transition-transform duration-300">
                <h1 className="text-lg sm:text-xl font-bold gradient-text leading-tight group-hover:brightness-125 transition-all">
                  Sentinel
                </h1>
                <p className="text-[9px] sm:text-[10px] font-semibold text-surface-500 uppercase tracking-[0.2em]">
                  Threat Detection
                </p>
              </div>
            </Link>

            {/* Center — Nav Links (Desktop) */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-300",
                      isActive
                        ? "text-accent-400"
                        : "text-surface-400 hover:text-surface-200 hover:bg-surface-800/30"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-accent-500/15 border border-accent-500/25 rounded-xl z-0"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <item.icon
                      className={cn(
                        "w-4 h-4 relative z-10 transition-colors duration-300",
                        isActive ? "text-accent-400" : "text-surface-500"
                      )}
                    />
                    <span className="relative z-10">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right — Social Links (Desktop) + Hamburger */}
            <div className="flex items-center gap-2">
              {/* Desktop social icons */}
              <div className="hidden lg:flex items-center gap-1">
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target={link.href.startsWith("mailto:") ? undefined : "_blank"}
                    rel={link.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                    className="p-2.5 rounded-xl text-surface-400 hover:text-accent-400 hover:bg-surface-800/80 hover:shadow-glow transition-all duration-300 hover:-translate-y-0.5"
                    title={link.label}
                  >
                    <link.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2.5 rounded-xl text-surface-400 hover:text-surface-200 hover:bg-surface-800/50 transition-all relative z-[60]"
                aria-label="Toggle menu"
              >
                <AnimatePresence mode="wait">
                  {mobileOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ────── Mobile Drawer (Right to Left) ────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[300px] max-w-[85vw] bg-surface-950/98 backdrop-blur-2xl border-l border-surface-800/60 lg:hidden flex flex-col shadow-2xl shadow-black/50"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-surface-800/60">
                <p className="text-sm font-bold text-surface-200 uppercase tracking-widest">Menu</p>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-lg hover:bg-surface-800/50 text-surface-400 hover:text-surface-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                <p className="text-[10px] font-bold text-surface-600 uppercase tracking-widest px-3 mb-2">
                  Navigation
                </p>
                {navLinks.map((item, i) => {
                  const isActive = pathname === item.href;
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.3 }}
                    >
                      <Link
                        to={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                          isActive
                            ? "bg-accent-500/15 text-accent-400 border border-accent-500/25"
                            : "text-surface-400 hover:text-surface-200 hover:bg-surface-800/50 border border-transparent"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200",
                          isActive 
                            ? "bg-accent-500/20 text-accent-400" 
                            : "bg-surface-800/60 text-surface-500 group-hover:text-surface-300 group-hover:bg-surface-800"
                        )}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        <span className="flex-1">{item.label}</span>
                        <ChevronRight className={cn(
                          "w-4 h-4 transition-all duration-200",
                          isActive 
                            ? "text-accent-500/60" 
                            : "text-surface-700 group-hover:text-surface-500 group-hover:translate-x-0.5"
                        )} />
                      </Link>
                    </motion.div>
                  );
                })}

                {/* Social / Contact Section */}
                <div className="pt-4 mt-4 border-t border-surface-800/60">
                  <p className="text-[10px] font-bold text-surface-600 uppercase tracking-widest px-3 mb-3">
                    Connect
                  </p>
                  {socialLinks.map((link, i) => (
                    <motion.a
                      key={link.label}
                      href={link.href}
                      target={link.href.startsWith("mailto:") ? undefined : "_blank"}
                      rel={link.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (navLinks.length + i) * 0.05, duration: 0.3 }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-surface-400 hover:text-surface-200 hover:bg-surface-800/50 transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-surface-800/60 flex items-center justify-center text-surface-500 group-hover:text-surface-300 group-hover:bg-surface-800 transition-colors duration-200">
                        <link.icon className="w-4 h-4" />
                      </div>
                      <span className="flex-1">{link.label}</span>
                      <ChevronRight className="w-4 h-4 text-surface-700 group-hover:text-surface-500 group-hover:translate-x-0.5 transition-all duration-200" />
                    </motion.a>
                  ))}
                </div>
              </nav>

              {/* Drawer Footer */}
              <div className="px-6 py-4 border-t border-surface-800/60">
                <Link
                  to="/scan"
                  onClick={() => setMobileOpen(false)}
                  className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
                >
                  <ScanSearch className="w-4 h-4" />
                  Start New Scan
                </Link>
                <p className="text-center text-[10px] text-surface-600 mt-3">
                  © 2025 Sentinel AI
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
