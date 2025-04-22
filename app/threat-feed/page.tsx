'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Search, RefreshCw, Loader2, Info, ChevronDown, ChevronUp, ExternalLink } from "lucide-react"
import { ThreatArticle } from '@/types/threat'
import { cache } from '@/lib/cache'
import { PaginatedResponse } from '@/types/pagination'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface CveDetail {
  id: string;
  cvssScore: number;
  severity: "Critical" | "High" | "Medium" | "Low";
}

interface ThreatFeedItem {
  id: string;
  title: string;
  description: string;
  source: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  publishedDate: string;
  lastModifiedDate: string;
  cvssScore: number;
  cves: CveDetail[];
}

const ITEMS_PER_PAGE = 10;
const CACHE_KEY = 'threatFeedCache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Basic URL validation
function isValidUrl(urlString: string): boolean {
  if (!urlString) return false;
  try {
    if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
        return false;
    }
    new URL(urlString);
    return true;
  } catch (_) {
    return false;
  }
}

const handleCVEClick = (event: React.MouseEvent<HTMLAnchorElement>, cveId: string) => {
  event.preventDefault();
  event.stopPropagation();
  const trimmedCveId = cveId.trim();
  if (/^CVE-\d{4}-\d{4,}$/.test(trimmedCveId)) {
    window.open(`https://nvd.nist.gov/vuln/detail/${trimmedCveId}`, '_blank', 'noopener,noreferrer');
  } else {
    console.warn("Invalid CVE format for link:", cveId);
  }
};

const getSeverityBadgeColor = (severityLevel: string | undefined) => {
  switch (severityLevel?.toLowerCase()) {
    case 'critical': return 'bg-red-600/10 text-red-500 border-red-600/50';
    case 'high': return 'bg-orange-600/10 text-orange-500 border-orange-600/50';
    case 'medium': return 'bg-yellow-600/10 text-yellow-500 border-yellow-600/50';
    case 'low': return 'bg-blue-600/10 text-blue-500 border-blue-600/50';
    default: return 'bg-gray-600/10 text-gray-400 border-gray-600/50';
  }
};

function ThreatFeedCard({ threat }: { threat: ThreatFeedItem }) {
  const [isExpanded, setIsExpanded] = useState(false);

  let displaySource: React.ReactNode = threat.source || 'Source Unknown';
  if (threat.source && isValidUrl(threat.source)) {
    try {
      const url = new URL(threat.source);
      displaySource = (
        <a 
          href={threat.source} 
          target="_blank" 
          rel="noopener noreferrer" 
          onClick={(e) => e.stopPropagation()}
          className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
        >
          {url.hostname}
        </a>
      );
    } catch (e) {
      displaySource = <span className="text-sm text-gray-400">{threat.source}</span>;
    }
  } else if (threat.source) {
      displaySource = <span className="text-sm text-gray-400">{threat.source}</span>;
  }

  return (
    <Card className="bg-card border border-border shadow-sm w-full">
      <CardHeader className="p-4">
        <div className="flex justify-between items-start gap-2 mb-1">
          <CardTitle className="text-base font-semibold text-white leading-tight flex-1 mr-2">{threat.title}</CardTitle>
          <Badge variant="outline" className={`shrink-0 text-xs px-2 py-0.5 ${getSeverityBadgeColor(threat.severity)}`}>
            {threat.severity}
          </Badge>
        </div>
        <CardDescription className="text-xs text-gray-400 pt-1 flex justify-between items-center">
           <span>{format(new Date(threat.publishedDate), 'PPpp')}</span>
           <span className="ml-2">Source: {displaySource}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
          <p className={`text-sm text-gray-300 mb-2 ${!isExpanded ? 'line-clamp-3' : ''}`}>
            {threat.description}
          </p>
          <Button 
            variant="link"
            size="sm"
            className="text-blue-400 hover:text-blue-300 px-0 h-auto text-sm mb-3"
            onClick={() => setIsExpanded(!isExpanded)}
          >
             {isExpanded ? 'Show less' : 'Show more...'}
          </Button>
          
          <Separator className="mb-3 bg-border/50" />

          <div className="mb-3 text-sm text-gray-400">
            Assessed Score: <span className="font-medium text-gray-200">{threat.cvssScore.toFixed(1)}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-gray-500 inline-block ml-1 mb-px cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-background border-border text-white">
                <p>Overall assessed score based on CVE data and contextual analysis (e.g., title text).</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {threat.cves && threat.cves.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-200">Associated CVEs (Original Data):</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {threat.cves.map((cve) => (
                  <div key={cve.id} className="flex items-center gap-1 text-xs">
                     <a 
                       href="#" 
                       onClick={(e) => handleCVEClick(e, cve.id)}
                       className="text-blue-400 hover:text-blue-300 hover:underline"
                       title={`View ${cve.id} on NVD`}
                     >
                       {cve.id}
                     </a>
                     <Badge variant="outline" className={`px-1.5 py-0 text-[10px] font-normal ${getSeverityBadgeColor(cve.severity)}`}>
                        {cve.severity} ({cve.cvssScore.toFixed(1)})
                     </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
      </CardContent>
    </Card>
  );
}

export default function ThreatFeed() {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [threats, setThreats] = useState<ThreatFeedItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const observer = useRef<IntersectionObserver>();
  const lastItemRef = useCallback((node: HTMLDivElement) => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });
    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore]);

  const loadData = useCallback(async (pageNum: number, refresh = false) => {
    try {
      if (pageNum === 1) {
        setIsLoading(true);
      }
      setError(null);

      if (!refresh && pageNum === 1) {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setThreats(data.items || []);
            setTotal(data.total || 0);
            setHasMore(data.hasMore || false);
            setIsLoading(false);
            return;
          }
        }
      }

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        ...(searchQuery && { search: searchQuery })
      });

      console.log('Fetching threats from:', `/api/dashboard?${params}`);
      const response = await fetch(`/api/dashboard?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch threat feed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data || !Array.isArray(data.recentThreatsList)) {
        throw new Error('Invalid data received: recentThreatsList is missing or not an array');
      }

      const newThreats: ThreatFeedItem[] = data.recentThreatsList.map((threat: any) => ({
        id: String(threat.id || ''),
        title: String(threat.title || ''),
        description: String(threat.description || 'No description available.'),
        source: String(threat.source || 'Unknown Source'),
        severity: threat.severity || 'Low',
        publishedDate: String(threat.publishedDate || new Date().toISOString()),
        lastModifiedDate: String(threat.lastModifiedDate || new Date().toISOString()),
        cvssScore: Number(threat.cvssScore) || 0,
        cves: Array.isArray(threat.cves) ? threat.cves.map((cve: any): CveDetail => ({
          id: String(cve.id || ''),
          cvssScore: Number(cve.cvssScore) || 0,
          severity: cve.severity || 'Low',
        })) : [],
      }));
      
      if (pageNum === 1) {
        setThreats(newThreats);
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: {
            items: newThreats,
            total: data.total || newThreats.length,
            hasMore: data.hasMore || false
          },
          timestamp: Date.now()
        }));
      } else {
        setThreats(prev => [...prev, ...newThreats]);
      }
      
      setTotal(data.total || newThreats.length);
      setHasMore(data.hasMore || false);
    } catch (err) {
      console.error('Error loading threat feed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load threat feed');
      toast.error('Failed to load threat feed');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [searchQuery]);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setPage(prev => prev + 1);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await loadData(1, true);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setPage(1);
    setThreats([]);
    setLoadingMore(false);
  };

  useEffect(() => {
    setMounted(true);
    loadData(1);
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (mounted) {
        loadData(page);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [page, searchQuery, mounted]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (mounted && searchQuery !== '') {
        setThreats([]);
        setPage(1);
        loadData(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, mounted]);

  if (!mounted) {
    return null;
  }

  const filteredThreats = threats?.filter(threat => {
    if (!threat) return false;
    const matchesSearch = !searchQuery || 
      (threat.title && threat.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (threat.description && threat.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  }) || [];

  return (
    <TooltipProvider>
      <div className="h-full w-full flex flex-col bg-background">
        <div className="w-full flex h-16 items-center justify-between border-b border-border px-4">
          <h1 className="text-lg font-semibold text-foreground">Threat Feed</h1>
        </div>

        <div className="flex-1 p-4 space-y-6 overflow-hidden bg-background">
          <h2 className="text-3xl font-bold text-foreground">Threat Feed</h2>

          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search threats (handled by API)..."
                className="pl-8 w-full bg-transparent border-border"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            <Button 
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Refresh</span>
            </Button>
          </div>

          <div className="rounded-lg border border-border bg-card flex flex-col h-[calc(100vh-240px)]">
            <div className="p-4 border-b border-border shrink-0">
              <p className="text-sm text-muted-foreground">
                Showing {filteredThreats.length} of {total} threats
              </p>
            </div>

            {isLoading && page === 1 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                Error: {error}
              </div>
            ) : filteredThreats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No threats found matching your search." : "No threats available."}
              </div>
            ) : (
              <div className="divide-y divide-border overflow-y-auto">
                {filteredThreats.map((threat, index) => {
                  const isLastItem = index === filteredThreats.length - 1;
                  return (
                    <div 
                      key={`${threat.id}-${index}`}
                      ref={isLastItem ? lastItemRef : undefined}
                      className="p-4"
                    >
                      <ThreatFeedCard threat={threat} />
                    </div>
                  );
                })}
                {loadingMore && (
                  <div className="p-4">
                    <Skeleton className="h-32 w-full" />
                  </div>
                )}
                {!hasMore && filteredThreats.length > 0 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">End of results.</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
