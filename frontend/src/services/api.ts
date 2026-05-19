import { API_BASE_URL } from "@/lib/utils";

export interface ScanRequest {
  input_data?: string;
  file?: File;
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
  features: {
    urgency_score: number;
    credential_request: boolean;
    suspicious_keywords: string[];
    domain_entropy?: number;
    has_suspicious_tld?: boolean;
  };
  created_at: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
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
    return res.json();
  }

  async getHistory(): Promise<ScanResponse[]> {
    const res = await fetch(`${this.baseUrl}/api/scans`);
    if (!res.ok) throw new Error("Failed to fetch history");
    return res.json();
  }

  async deleteScan(id: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/scans/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete");
  }
}

export const apiService = new ApiService();
