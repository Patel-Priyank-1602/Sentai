import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRiskLevel(score: number): "safe" | "suspicious" | "dangerous" {
  if (score <= 30) return "safe";
  if (score <= 60) return "suspicious";
  return "dangerous";
}

export function getRiskColor(score: number): string {
  const level = getRiskLevel(score);
  switch (level) {
    case "safe": return "#10b981";
    case "suspicious": return "#f59e0b";
    case "dangerous": return "#ef4444";
    default: return "#ef4444";
  }
}

export function getRiskLabel(score: number): string {
  const level = getRiskLevel(score);
  switch (level) {
    case "safe": return "Safe";
    case "suspicious": return "Suspicious";
    case "dangerous": return "Dangerous";
    default: return "Unknown";
  }
}

export const API_BASE_URL = import.meta.env.VITE_API_URL || "https://sentinel-cyber-ai.onrender.com";
