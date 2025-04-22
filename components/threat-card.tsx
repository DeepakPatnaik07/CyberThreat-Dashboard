"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CriticalityRating } from "@/components/criticality-rating"
import { ChevronDown, ChevronUp, ExternalLink, FileWarning } from "lucide-react"

// Basic URL validation (consider a more robust library if needed)
function isValidUrl(urlString: string): boolean {
  if (!urlString) return false; // Handle null/empty strings
  try {
    // Basic check for protocol
    if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
        return false;
    }
    new URL(urlString); // Check if it parses
    return true;
  } catch (_) {
    return false;
  }
}

interface ThreatCardProps {
  title: string
  date: string
  source: string
  cves: string[]
  cvssScore: number
  severity: "Critical" | "High" | "Medium" | "Low"
}

export function ThreatCard({
  title,
  date,
  source,
  cves,
  cvssScore,
  severity,
}: ThreatCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleViewDetails = () => {
    setIsExpanded(!isExpanded);
  };

  const handleSourceClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
  };

  const handleCVEClick = (event: React.MouseEvent<HTMLAnchorElement>, cveId: string) => {
    event.stopPropagation();
    const trimmedCveId = cveId.trim();
    if (/^CVE-\d{4}-\d{4,}$/.test(trimmedCveId)) {
      window.open(`https://nvd.nist.gov/vuln/detail/${trimmedCveId}`, '_blank');
    } else {
      console.warn("Invalid CVE format for link:", cveId);
    }
  };

  const getSeverityBadgeColor = (severityLevel: string) => {
    switch (severityLevel?.toLowerCase()) {
      case 'critical': return 'bg-red-600/10 text-red-500 border-red-600/50';
      case 'high': return 'bg-orange-600/10 text-orange-500 border-orange-600/50';
      case 'medium': return 'bg-yellow-600/10 text-yellow-500 border-yellow-600/50';
      case 'low': return 'bg-blue-600/10 text-blue-500 border-blue-600/50';
      default: return 'bg-gray-600/10 text-gray-400 border-gray-600/50';
    }
  };

  const getSeverityDescription = (severityLevel: string, score: number) => {
    const scoreText = score > 0 ? `(CVSS ${score.toFixed(1)})` : '';
    switch (severityLevel?.toLowerCase()) {
      case 'critical': return `Critical Severity ${scoreText}. Potential for significant impact, immediate action required.`;
      case 'high': return `High Severity ${scoreText}. Exploitation could lead to major compromise. Prioritize patching.`;
      case 'medium': return `Medium Severity ${scoreText}. Could allow unauthorized access or disruption. Address appropriately.`;
      case 'low': return `Low Severity ${scoreText}. Limited potential impact, address during routine maintenance.`;
      default: return `Severity Unknown ${scoreText}. Assess based on context.`;
    }
  };

  const getRecommendedActions = (severityLevel: string) => {
    switch (severityLevel?.toLowerCase()) {
      case 'critical': return [
        "Immediate patching or mitigation is strongly advised.",
        "Isolate affected systems if patch unavailable.",
        "Increase monitoring for exploitation attempts.",
        "Activate incident response plan if necessary."
      ];
      case 'high': return [
        "Apply patches or vendor mitigations promptly.",
        "Review system configurations for hardening.",
        "Monitor logs for related indicators of compromise.",
        "Prepare incident response procedures."
      ];
      case 'medium': return [
        "Schedule patching within standard maintenance windows.",
        "Assess applicability and impact in your environment.",
        "Ensure logging and monitoring are adequate.",
        "Consider compensating controls if patching is delayed."
      ];
      case 'low': return [
        "Incorporate patching into routine maintenance cycles.",
        "Verify if the vulnerability affects your specific use case.",
        "Document decision if choosing not to patch."
      ];
      default: return ["Review vulnerability details and assess risk based on your environment."];
    }
  };

  const formattedDate = date ? new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'Date not available';

  let displaySource: React.ReactNode = source || 'Source Unknown';
  if (source && isValidUrl(source)) {
    try {
      const url = new URL(source);
      displaySource = (
        <a 
          href={source} 
          target="_blank" 
          rel="noopener noreferrer" 
          onClick={handleSourceClick}
          className="text-sm text-blue-400 hover:text-blue-300 hover:underline cursor-pointer z-20"
        >
          Source: {url.hostname}
        </a>
      );
    } catch (e) {
      console.warn(`Failed to parse source URL: ${source}`, e);
      displaySource = <span className="text-sm text-gray-400">Source: {source}</span>;
    }
  } else if (source) {
    displaySource = <span className="text-sm text-gray-400">Source: {source}</span>;
  }

  return (
    <Card className="bg-card border border-border shadow-sm w-full transition-all duration-200 hover:border-primary/20">
      <CardHeader className="p-4 cursor-pointer" onClick={handleViewDetails}>
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-base font-semibold text-white leading-tight">{title}</CardTitle>
          <Badge variant="outline" className={`shrink-0 text-xs px-2 py-0.5 ${getSeverityBadgeColor(severity)}`}>
            {severity}
          </Badge>
        </div>
        <CardDescription className="text-xs text-gray-400 pt-1">
          {formattedDate}
        </CardDescription>
      </CardHeader>
      {isExpanded && (
        <CardContent className="p-4 pt-0">
          <Separator className="mb-3 bg-border/50" />
          <div className="space-y-3">
            <p className="text-sm text-gray-300">
              {getSeverityDescription(severity, cvssScore)}
            </p>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-200">Recommended Actions:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-400">
                {getRecommendedActions(severity).map((action, index) => (
                  <li key={index}>{action}</li>
                ))}
              </ul>
            </div>
            
            {cves && cves.length > 0 && (
              <div className="space-y-1 pt-2">
                <p className="text-sm font-medium text-gray-200">Associated CVEs:</p>
                <div className="flex flex-wrap gap-2">
                  {cves.map((cveId) => (
                    <a 
                      key={cveId} 
                      href="#"
                      onClick={(e) => handleCVEClick(e, cveId)}
                      className="text-xs bg-blue-900/30 hover:bg-blue-800/50 text-blue-300 px-2 py-0.5 rounded border border-blue-700/50 transition-colors"
                    >
                      {cveId.trim()}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2">
              {displaySource}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
