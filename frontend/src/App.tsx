import { Routes, Route } from "react-router-dom";
import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";
import Dashboard from "./pages/Dashboard";
import Scan from "./pages/Scan";
import History from "./pages/History";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <>
      {/* Ambient glow effects */}
      <div
        className="fixed w-[600px] h-[600px] rounded-full pointer-events-none z-0"
        style={{
          background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
          filter: "blur(150px)",
          top: "-200px",
          left: "-200px",
        }}
      />
      <div
        className="fixed w-[600px] h-[600px] rounded-full pointer-events-none z-0"
        style={{
          background: "radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)",
          filter: "blur(150px)",
          bottom: "-200px",
          right: "-200px",
        }}
      />

      <div className="flex h-screen relative z-10">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/scan" element={<Scan />} />
              <Route path="/history" element={<History />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
    </>
  );
}
