import { Routes, Route } from "react-router-dom";
import { Navbar } from "./components/layout/Navbar";
import AllTracked from "./pages/AllTracked";
import Scan from "./pages/Scan";
import History from "./pages/History";
import About from "./pages/About";
import Contact from "./pages/Contact";

export default function App() {
  return (
    <>
      {/* Ambient glow effects */}
      <div
        className="fixed w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] rounded-full pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)",
          filter: "blur(150px)",
          top: "-200px",
          left: "-200px",
        }}
      />
      <div
        className="fixed w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] rounded-full pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(circle, rgba(234,88,12,0.06) 0%, transparent 70%)",
          filter: "blur(150px)",
          bottom: "-200px",
          right: "-200px",
        }}
      />

      <div className="min-h-screen flex flex-col relative z-10">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Scan />} />
            <Route path="/dashboard" element={<AllTracked />} />
            <Route path="/scan" element={<Scan />} />
            <Route path="/history" element={<History />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t border-surface-800/60 bg-surface-950/80 backdrop-blur-xl py-4 sm:py-6 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-[10px] sm:text-xs text-surface-500">
            <p>© 2025 Sentinel AI-Powered Threat Detection</p>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="hover:text-accent-400 transition-colors"
              >
                Privacy
              </a>
              <a
                href="#"
                className="hover:text-accent-400 transition-colors"
              >
                Terms
              </a>
              <a
                href="https://github.com/Patel-Priyank-1602/Sentinel_Cyber_AI"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent-400 transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
