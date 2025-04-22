'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, LineChart } from "@/components/ui/chart"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { CriticalityRating } from "@/components/criticality-rating"
import { ThreatCard } from "@/components/threat-card"
import { AlertTriangle, CalendarDays, ShieldCheck, ShieldAlert, Info, RefreshCw, AlertCircle, CheckCircle } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ThreatArticle } from '@/types/threat'
import { Badge } from "@/components/ui/badge"

interface ThreatItem {
  id: string;
  title: string;
  description: string;
  source?: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  publishedDate: string;
  lastModifiedDate: string;
  cvssScore: number;
  cves: { id: string; cvssScore: number; severity: string; }[];
  severityElevated?: boolean;
}

interface DashboardData {
  totalThreats: number;
  recentThreats: number;
  mitigatedThreats: number;
  criticalThreats: number;
  cvesMonitored: number;
  threatLevel: number;
  threatTrends: { name: string; Malware: number; Phishing: number; Vulnerability: number; DDoS: number; Other: number; }[];
  threatDistribution: { name: string; value: number; }[];
  recentThreatsList: ThreatItem[];
  cveSeverity: { critical: number; high: number; medium: number; low: number; };
}

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch("/api/dashboard");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const apiData = await response.json();
      console.log("Raw API response:", apiData);

      const transformedData: DashboardData = {
        totalThreats: Number(apiData.totalThreats) || 0,
        recentThreats: Number(apiData.recentThreats) || 0,
        mitigatedThreats: Number(apiData.mitigatedThreats) || 0,
        criticalThreats: Number(apiData.criticalThreats) || 0,
        cvesMonitored: Number(apiData.cvesMonitored) || 0,
        threatLevel: Number(apiData.threatLevel) || 0,
        threatTrends: Array.isArray(apiData.threatTrends) ? apiData.threatTrends : [],
        threatDistribution: Array.isArray(apiData.threatDistribution) ? apiData.threatDistribution : [],
        recentThreatsList: Array.isArray(apiData.recentThreatsList) ? apiData.recentThreatsList.map((threat: any): ThreatItem => ({
          id: String(threat.id || ''),
          title: String(threat.title || ''),
          description: String(threat.description || ''),
          source: String(threat.source || 'Unknown Source'),
          severity: threat.severity || 'Low',
          publishedDate: String(threat.publishedDate || new Date().toISOString()),
          lastModifiedDate: String(threat.lastModifiedDate || new Date().toISOString()),
          cvssScore: Number(threat.cvssScore) || 0,
          cves: Array.isArray(threat.cves) ? threat.cves.map((cve: any) => ({
            id: String(cve.id || ''),
            cvssScore: Number(cve.cvssScore) || 0,
            severity: String(cve.severity || 'Low'),
          })) : [],
          severityElevated: Boolean(threat.severityElevated)
        })) : [],
        cveSeverity: {
          critical: Number(apiData.cveSeverity?.critical) || 0,
          high: Number(apiData.cveSeverity?.high) || 0,
          medium: Number(apiData.cveSeverity?.medium) || 0,
          low: Number(apiData.cveSeverity?.low) || 0,
        },
      };

      console.log("Transformed data for state:", transformedData);
      setData(transformedData);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return <div className="p-8 text-center text-white/60">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-white/60">No data available</div>;
  }

  return (
    <TooltipProvider>
      <div className="h-full w-full flex flex-col bg-background">
        <div className="w-full border-b border-border">
          <div className="flex h-16 items-center px-4">
            <SidebarTrigger className="mr-2 md:hidden" />
            <div className="flex items-center justify-between w-full">
              <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4" />
                  <span>Updated just now</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 overflow-auto bg-background">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Threat Intelligence Dashboard
            </h2>
            <button
              onClick={loadData}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Total Threats</CardTitle>
                <ShieldAlert className="h-4 w-4 text-white/70" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{data.totalThreats}</div>
                <p className="text-xs text-white/70">Total threats monitored</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Recent Threats</CardTitle>
                <CalendarDays className="h-4 w-4 text-white/70" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{data.recentThreats}</div>
                <p className="text-xs text-white/70">Threats in the last 7 days</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Mitigated Threats</CardTitle>
                <ShieldCheck className="h-4 w-4 text-white/70" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{data.mitigatedThreats}</div>
                <p className="text-xs text-white/70">Threats with mitigation info</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Critical Threats</CardTitle>
                <AlertTriangle className="h-4 w-4 text-white/70" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{data.criticalThreats}</div>
                <p className="text-xs text-white/70">High priority threats</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 bg-card border-border">
              <CardHeader>
                <CardTitle className="text-white">Threat Trends</CardTitle>
                <CardDescription className="text-white/70">Daily threat activity over time</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-[300px] w-full">
                  {data?.threatTrends && data.threatTrends.length > 0 ? (
                    <LineChart
                      data={data.threatTrends}
                      index="name"
                      categories={['Malware', 'Phishing', 'Vulnerability', 'DDoS', 'Other']}
                      colors={['#0ea5e9', '#f97316', '#ef4444', '#8b5cf6', '#6b7280']}
                      valueFormatter={(value: number) => value.toString()}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-white/70">
                      No trend data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3 bg-card border-border">
              <CardHeader>
                <CardTitle className="text-white">Threat Distribution</CardTitle>
                <CardDescription className="text-white/70">Types of threats detected</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-[300px] w-full">
                  {data?.threatDistribution && data.threatDistribution.length > 0 ? (
                    <BarChart
                      data={data.threatDistribution}
                      index="name"
                      categories={['value']}
                      colors={['#0ea5e9']}
                      valueFormatter={(value: number) => value.toString()}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-white/70">
                      No distribution data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-white">Recent Threats</CardTitle>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-white/50 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs bg-background border-border text-white">
                        <p>Displays the latest threats. Severity shown is the assessed risk, potentially elevated based on title/description if CVE data indicates low risk.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <CardDescription className="text-white/70 pt-1"> 
                    Latest threats detected. Severity reflects overall assessed risk.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {data.recentThreatsList && data.recentThreatsList.length > 0 ? (
                    <div className="space-y-4">
                      {data.recentThreatsList.map((threat, index) => (
                        <div key={threat.id || index} className="relative">
                          <ThreatCard
                            title={threat.title}
                            date={threat.publishedDate}
                            source={threat.source || 'Unknown Source'}
                            cves={threat.cves.map(cve => cve.id)}
                            cvssScore={threat.cvssScore}
                            severity={threat.severity}
                          />
                          {threat.severityElevated && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertTriangle className="absolute top-3 right-3 h-4 w-4 text-yellow-400 z-10" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs bg-background border-border text-white">
                                <p>Severity elevated from original CVE data based on contextual analysis.</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-white/70 py-4">No recent threats to display.</p>
                  )}
                </CardContent>
              </Card>
            </div>
            <Card className="lg:col-span-1 bg-card border-border">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-white">CVE Severity Distribution</CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-white/50 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs bg-background border-border text-white">
                      <p>Shows the breakdown based *only* on the original CVSS scores of the associated CVEs, before contextual analysis.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <CardDescription className="text-white/70 pt-1">
                  Severity breakdown based on original CVE scores.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <div>
                      <div className="font-semibold text-white">Critical</div>
                      <div className="text-xs text-white/70">CVSS 9.0-10.0</div>
                    </div>
                  </div>
                  <div className="font-medium text-white">
                    {data.cveSeverity.critical}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-orange-500" />
                    <div>
                      <div className="font-semibold text-white">High</div>
                      <div className="text-xs text-white/70">CVSS 7.0-8.9</div>
                    </div>
                  </div>
                  <div className="font-medium text-white">
                    {data.cveSeverity.high}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div>
                      <div className="font-semibold text-white">Medium</div>
                      <div className="text-xs text-white/70">CVSS 4.0-6.9</div>
                    </div>
                  </div>
                  <div className="font-medium text-white">
                    {data.cveSeverity.medium}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    <div>
                      <div className="font-semibold text-white">Low</div>
                      <div className="text-xs text-white/70">CVSS 0.1-3.9</div>
                    </div>
                  </div>
                  <div className="font-medium text-white">
                    {data.cveSeverity.low}
                  </div>
                </div>
                <Separator className="my-4 bg-border" />
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-white">Total CVEs</div>
                  <div className="font-medium text-white">
                    {data.cvesMonitored}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

