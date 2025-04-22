import { NextResponse } from 'next/server';
import { processThreatSources } from '@/utils/threat-scraper';
import { ThreatResponse, ThreatSummary } from '@/types/threat';

export async function GET() {
  try {
    const threats = await processThreatSources();
    
    // Calculate summary statistics
    const cvesMonitored = new Set(threats.flatMap(t => t.cves.map(c => c.id))).size;
    const mitigationsApplied = threats.reduce((acc, t) => 
      acc + t.cves.filter(c => c.mitigation.length > 0).length, 0
    );

    const severityDistribution = threats.reduce((acc, t) => {
      t.cves.forEach(cve => {
        acc[cve.severity.toLowerCase()]++;
      });
      return acc;
    }, { critical: 0, high: 0, medium: 0, low: 0 });

    const threatLevel = severityDistribution.critical > 0 ? 'Critical' :
                       severityDistribution.high > 0 ? 'High' :
                       severityDistribution.medium > 0 ? 'Medium' : 'Low';

    const summary: ThreatSummary = {
      activeThreats: threats.length,
      cvesMonitored,
      mitigationsApplied,
      threatLevel,
      severityDistribution,
    };

    const response: ThreatResponse = {
      summary,
      threats,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing threats:', error);
    return NextResponse.json(
      { error: 'Failed to process threat data' },
      { status: 500 }
    );
  }
} 