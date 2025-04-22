import { NextResponse } from 'next/server';
import { processThreatSources, categorizeThreat } from '@/utils/threat-scraper';
import { PaginatedResponse } from '@/types/pagination'; // Add back pagination type

// Define the structure for cached data
interface CacheData {
  timestamp: number;
  data: any; // Store the processed dashboard data
}

// In-memory cache (simple example)
let cache: CacheData = { timestamp: 0, data: null };
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function GET(request: Request) {
  console.log('API Route hit: /api/dashboard - Fetching/Processing Data');
  const now = Date.now();

  // 1. Check cache first
  if (cache.data && (now - cache.timestamp < CACHE_TTL)) {
    console.log('Returning cached dashboard data.');
    // TODO: Implement pagination/filtering on cached data if needed later
    return NextResponse.json(cache.data);
  }

  console.log('Cache stale or empty, fetching fresh data...');

  try {
    // 2. Fetch fresh data if cache is stale or empty
    const threats = await processThreatSources(); // Assume this fetches ALL threats

    // 3. Process and structure the data (similar logic as was moved to the cron job)
    if (!threats || threats.length === 0) {
      console.log('No threats found from sources.');
      const emptyData = {
        totalThreats: 0, recentThreats: 0, mitigatedThreats: 0, criticalThreats: 0,
        cvesMonitored: 0, threatLevel: 0, threatTrends: [], threatDistribution: [],
        recentThreatsList: [], cveSeverity: { critical: 0, high: 0, medium: 0, low: 0 },
        lastUpdated: new Date().toISOString(),
      };
      cache = { timestamp: now, data: emptyData }; // Cache the empty result
      return NextResponse.json(emptyData);
    }

    // --- Transform threats ---
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const threatItems = threats.map(threat => {
        const publishedDate = new Date(threat.date);
        const isRecent = publishedDate > sevenDaysAgo;
        const isMitigated = threat.cves?.some((cve: any) => cve.mitigation?.length > 0) || false;

        let highestCvssScoreFromCVEs = 0;
        const mappedCVEs = (threat.cves || []).map((cve: any) => {
            const cvssScore = Number(cve.cvssScore) || Number(cve.cvss) || 0;
            highestCvssScoreFromCVEs = Math.max(highestCvssScoreFromCVEs, cvssScore);
            let cveSeverity: "Critical" | "High" | "Medium" | "Low";
            if (cvssScore >= 9.0) cveSeverity = 'Critical'; else if (cvssScore >= 7.0) cveSeverity = 'High'; else if (cvssScore >= 4.0) cveSeverity = 'Medium'; else cveSeverity = 'Low';
            return { id: String(cve.id), cvssScore: !isNaN(cvssScore) ? cvssScore : 0, severity: cveSeverity };
        });

        const cvssFromTitleText = (threat.title.match(/CVSS\s+(\d+\.?\d*)/i) || [])[1];
        const cvssFromDescText = (threat.description?.match(/CVSS score:\s*(\d+\.?\d*)/i) || [])[1];
        const scoresFromText = [ cvssFromTitleText ? Number(cvssFromTitleText) : -1, cvssFromDescText ? Number(cvssFromDescText) : -1 ].filter(score => !isNaN(score) && score >= 0);
        const highestScoreFromText = scoresFromText.length > 0 ? Math.max(...scoresFromText) : 0;

        let overallSeverity: "Critical" | "High" | "Medium" | "Low";
        let scoreToReport = 0;
        let severityElevated = false;
        let originalSeverityFromCVEs: "Critical" | "High" | "Medium" | "Low";
        if (highestCvssScoreFromCVEs >= 9.0) originalSeverityFromCVEs = "Critical"; else if (highestCvssScoreFromCVEs >= 7.0) originalSeverityFromCVEs = "High"; else if (highestCvssScoreFromCVEs >= 4.0) originalSeverityFromCVEs = "Medium"; else originalSeverityFromCVEs = "Low";

        if (highestCvssScoreFromCVEs >= 4.0) {
            scoreToReport = highestCvssScoreFromCVEs;
            overallSeverity = originalSeverityFromCVEs;
        } else {
            if (highestScoreFromText >= 4.0) {
                scoreToReport = highestScoreFromText;
                if (highestScoreFromText >= 9.0) overallSeverity = "Critical"; else if (highestScoreFromText >= 7.0) overallSeverity = "High"; else overallSeverity = "Medium";
            } else {
                scoreToReport = highestCvssScoreFromCVEs;
                const titleLower = threat.title.toLowerCase();
                const criticalKeywords = ['critical', 'actively exploited', 'zero-day', 'rce', 'remote code execution'];
                const highKeywords = ['high', 'important', 'security bypass'];
                const mediumKeywords = ['medium', 'moderate'];
                if (threat.threatLevel === "Critical" || criticalKeywords.some((k: string) => titleLower.includes(k))) overallSeverity = "Critical";
                else if (threat.threatLevel === "High" || highKeywords.some((k: string) => titleLower.includes(k))) overallSeverity = "High";
                else if (threat.threatLevel === "Medium" || mediumKeywords.some((k: string) => titleLower.includes(k))) overallSeverity = "Medium";
                else overallSeverity = "Low";
            }
            const severityOrder = { "Low": 1, "Medium": 2, "High": 3, "Critical": 4 };
            if (severityOrder[overallSeverity] > severityOrder[originalSeverityFromCVEs]) {
                severityElevated = true;
            }
        }

        return {
            id: String(threat.cves?.[0]?.id || threat.title),
            title: String(threat.title),
            description: String(threat.description || ''),
            source: String(threat.source || 'Unknown Source'),
            severity: overallSeverity,
            publishedDate: publishedDate.toISOString(),
            lastModifiedDate: publishedDate.toISOString(),
            cvssScore: scoreToReport,
            cves: mappedCVEs,
            severityElevated
        };
    });

    // --- Calculate Final Statistics ---
    const overallSeverityCounts = threatItems.reduce((acc, item) => { acc[item.severity]++; return acc; }, { Critical: 0, High: 0, Medium: 0, Low: 0 });
    const cvesMonitored = threats.reduce((acc, threat) => acc + (threat.cves?.length || 0), 0);

    const initialCveSeverityCounts = threats.reduce((acc, threat) => {
        (threat.cves || []).forEach((cve: any) => {
            const score = Number(cve.cvssScore) || Number(cve.cvss) || 0;
            if (score >= 9.0) acc.Critical++; else if (score >= 7.0) acc.High++; else if (score >= 4.0) acc.Medium++; else if (score > 0) acc.Low++;
        });
        return acc;
    }, { Critical: 0, High: 0, Medium: 0, Low: 0 });

    const threatTrends = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(); date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayThreats = threats.filter(t => new Date(t.date).toDateString() === date.toDateString());
      const categorizedThreats = dayThreats.reduce((acc, t) => { const type = categorizeThreat(t.title, t.description || ''); acc[type] = (acc[type] || 0) + 1; return acc; }, {} as Record<string, number>);
      return { name: dateStr, Malware: categorizedThreats['Malware'] || 0, Phishing: categorizedThreats['Phishing'] || 0, Vulnerability: categorizedThreats['Vulnerability'] || 0, DDoS: categorizedThreats['DDoS'] || 0, Other: categorizedThreats['Other'] || 0 };
    });

    const threatTypes = threats.reduce((acc, t) => { const type = categorizeThreat(t.title, t.description || ''); acc[type] = (acc[type] || 0) + 1; return acc; }, {} as Record<string, number>);
    const threatDistribution = Object.entries(threatTypes).map(([name, value]) => ({ name, value }));

    const criticalThreats = overallSeverityCounts.Critical;
    const threatLevel = Math.min(100, Math.max(0, (criticalThreats * 25 + overallSeverityCounts.High * 15 + overallSeverityCounts.Medium * 10 + overallSeverityCounts.Low * 5) / Math.max(1, threatItems.length) * 10)); // Recalculate threat level based on items

    const responseData = {
        totalThreats: threatItems.length,
        recentThreats: threatItems.filter(item => new Date(item.publishedDate) > sevenDaysAgo).length,
        mitigatedThreats: threats.filter(t => t.cves?.some((cve: any) => cve.mitigation?.length > 0)).length,
        criticalThreats,
        cvesMonitored,
        threatLevel,
        threatTrends,
        threatDistribution,
        recentThreatsList: threatItems, // Consider adding pagination here if needed
        cveSeverity: {
            critical: initialCveSeverityCounts.Critical,
            high: initialCveSeverityCounts.High,
            medium: initialCveSeverityCounts.Medium,
            low: initialCveSeverityCounts.Low
        },
        lastUpdated: new Date().toISOString()
    };

    // 4. Update cache
    cache = { timestamp: now, data: responseData };
    console.log('Dashboard data fetched, processed, and cached.');

    // 5. Return response
    // TODO: Add pagination/filtering logic here based on searchParams if needed
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error in GET /api/dashboard:', error);
    return NextResponse.json(
      { error: 'Internal server error processing dashboard data.', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Remove the old GET_OLD function if it exists 