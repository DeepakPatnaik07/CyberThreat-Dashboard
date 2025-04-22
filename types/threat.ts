export interface CVEDetails {
  id: string;
  description: string;
  severity: string;
  cvssScore?: number;
  mitigation?: string;
  publishedDate?: string;
  lastModifiedDate?: string;
}

export interface CVE {
  id: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  cvss: string;
  cvssScore: number;
  description: string;
  affectedSystems: string[];
  mitigation: string[];
}

export interface ThreatArticle {
  title: string;
  date: string;
  source: string;
  link: string;
  description: string;
  threatLevel: "Critical" | "High" | "Medium" | "Low";
  cves: CVE[];
}

export interface ThreatSummary {
  activeThreats: number;
  cvesMonitored: number;
  mitigationsApplied: number;
  threatLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  severityDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface ThreatResponse {
  summary: ThreatSummary;
  threats: ThreatArticle[];
} 