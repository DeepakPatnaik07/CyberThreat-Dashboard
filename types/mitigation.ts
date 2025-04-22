export interface MitigationSuggestion {
  cveId: string;
  environment: string;
  affectedSystems: string[];
  constraints: string[];
  suggestions: {
    immediateActions: string[];
    shortTerm: string[];
    longTerm: string[];
    additionalRecommendations: string[];
  };
  riskLevel: string;
  estimatedEffort: string;
  priority: string;
  cveDetails?: {
    description: string;
    cvssScore: number;
    severity: string;
    publishedDate: string;
    lastModifiedDate: string;
  };
} 