import { API_BASE_URL } from "@/lib/utils";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface ScanRequest {
  input_data?: string;
  file?: File;
  sharePublicly?: boolean;
}

export interface ScanResponse {
  id: string;
  risk_score: number;
  risk_level: string;
  scan_type: string;
  attack_type: string;
  phishing_probability: number;
  explanation: string[];
  recommendations: string[];
  detected_type?: string;
  input_data?: string;
  features: {
    urgency_score: number;
    credential_request: boolean;
    suspicious_keywords: string[];
    domain_entropy?: number;
    has_suspicious_tld?: boolean;
  };
  created_at: string;
}

/** Fetch with a timeout (default 8 seconds) */
function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

class ApiService {
  private baseUrl: string;

  // ── In-memory cache ──
  private _cache: ScanResponse[] | null = null;
  private _cacheTime = 0;
  private _cacheTTL = 10_000; // 10 seconds
  private _inflight: Promise<ScanResponse[]> | null = null;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private get supabaseHeaders() {
    if (!SUPABASE_URL || !SUPABASE_KEY) return null;
    return {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    };
  }

  /** Invalidate cache so next getHistory() fetches fresh */
  invalidateCache() {
    this._cache = null;
    this._cacheTime = 0;
  }

  async analyzeScan(request: ScanRequest): Promise<ScanResponse> {
    const formData = new FormData();
    
    if (request.input_data) {
      formData.append("input_data", request.input_data);
    }
    
    if (request.file) {
      formData.append("file", request.file);
    }

    const res = await fetch(`${this.baseUrl}/api/scan`, { 
      method: "POST", 
      body: formData 
    });
    
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Scan failed: ${errorText}`);
    }
    
    const data: ScanResponse = await res.json();
    const inputForSave = request.input_data || (request.file ? request.file.name : "Unknown File");
    
    // Save to Supabase if configured and user opted-in
    const headers = this.supabaseHeaders;
    if (request.sharePublicly && SUPABASE_URL && headers) {
        try {
            const sbRes = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/sentinelhistory`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    input_data: inputForSave,
                    scan_type: data.scan_type || "text",
                    detected_type: data.detected_type || data.scan_type,
                    risk_score: data.risk_score || 0,
                    risk_level: data.risk_level || "Safe",
                    attack_type: data.attack_type || "None",
                    phishing_probability: data.phishing_probability || 0,
                    explanation: data.explanation || [],
                    recommendations: data.recommendations || [],
                    features: data.features || {}
                })
            });
            if (sbRes.ok) {
                const sbData = await sbRes.json();
                if (sbData && sbData.length > 0) {
                    data.id = sbData[0].id; // use the Supabase UUID
                }
            } else {
                console.warn("Failed to save to Supabase:", await sbRes.text());
            }
        } catch (err) {
            console.error("Supabase insert error:", err);
        }
    }

    data.input_data = inputForSave;

    // Invalidate cache so the new scan shows up
    this.invalidateCache();

    return data;
  }

  async getHistory(): Promise<ScanResponse[]> {
    // Return cached data if fresh
    if (this._cache && (Date.now() - this._cacheTime) < this._cacheTTL) {
      return this._cache;
    }

    // Deduplicate in-flight requests — if a fetch is already running, wait for it
    if (this._inflight) {
      return this._inflight;
    }

    this._inflight = this._fetchHistory();
    try {
      const result = await this._inflight;
      return result;
    } finally {
      this._inflight = null;
    }
  }

  private async _fetchHistory(): Promise<ScanResponse[]> {
    const headers = this.supabaseHeaders;
    if (SUPABASE_URL && headers) {
      try {
        const fetchHeaders = { ...headers } as Record<string, string>;
        delete fetchHeaders["Prefer"]; // not needed for GET
        
        const res = await fetchWithTimeout(
          `${SUPABASE_URL}/rest/v1/sentinelhistory?select=*&order=created_at.desc`,
          { headers: fetchHeaders },
          6000 // 6 second timeout for history fetch
        );
        if (res.ok) {
          const data = await res.json();
          this._cache = data;
          this._cacheTime = Date.now();
          return data;
        }
      } catch (err) {
         console.error("Supabase fetch error:", err);
      }
    }

    // Fallback to local backend
    const res = await fetchWithTimeout(`${this.baseUrl}/api/scans`, {}, 6000);
    if (!res.ok) throw new Error("Failed to fetch history");
    const data = await res.json();
    this._cache = data;
    this._cacheTime = Date.now();
    return data;
  }

  async deleteScan(id: string): Promise<void> {
    const headers = this.supabaseHeaders;
    if (SUPABASE_URL && headers) {
        try {
            await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/sentinelhistory?id=eq.${id}`, {
                method: "DELETE",
                headers
            });
            this.invalidateCache();
            return;
        } catch (err) {
            console.error("Supabase delete error:", err);
        }
    }

    const res = await fetch(`${this.baseUrl}/api/scans/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete");
    this.invalidateCache();
  }
}

export const apiService = new ApiService();
