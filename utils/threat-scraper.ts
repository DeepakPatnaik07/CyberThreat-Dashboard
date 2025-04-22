import { ThreatArticle, CVE } from '../types/threat';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as dotenv from 'dotenv';
import { parseStringPromise } from 'xml2js';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

if (!process.env.GOOGLE_API_KEY) {
  throw new Error('GOOGLE_API_KEY is not set in environment variables');
}

// Helper function to extract CVEs from text
function extractCVEs(text: string): string[] {
  // Improved CVE regex to catch more variations
  const cveRegex = /(CVE-\d{4}-\d+)|(CVE\s*\d{4}\s*\d+)/gi;
  const matches = text.match(cveRegex) || [];
  return [...new Set(matches.map(match => match.replace(/\s+/g, '-').toUpperCase()))];
}

// Helper function to get CVE details from NVD
async function getCVEDetails(cveId: string): Promise<CVE | null> {
  try {
    const response = await axios.get(`https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${cveId}`, {
      headers: {
        'apiKey': process.env.NVD_API_KEY
      }
    });
    
    if (!response.data.vulnerabilities || response.data.vulnerabilities.length === 0) {
      console.log(`No data found for CVE ${cveId}`);
      return null;
    }

    const cveData = response.data.vulnerabilities[0].cve;
    
    const cvssScore = cveData.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore || 
                     cveData.metrics?.cvssMetricV30?.[0]?.cvssData?.baseScore || '0.0';
    
    const severity = Number(cvssScore) >= 9.0 ? 'Critical' :
                    Number(cvssScore) >= 7.0 ? 'High' :
                    Number(cvssScore) >= 4.0 ? 'Medium' : 'Low';

    return {
      id: cveId,
      severity,
      cvss: cvssScore.toString(),
      cvssScore: Number(cvssScore),
      description: cveData.descriptions?.[0]?.value || 'No description available',
      affectedSystems: cveData.configurations?.[0]?.nodes?.map((node: any) => 
        node.cpeMatch?.[0]?.criteria || 'Unknown'
      ) || ['Unknown'],
      mitigation: [], // Will be populated by OpenAI
    };
  } catch (error) {
    console.error(`Error fetching CVE details for ${cveId}:`, error);
    return null;
  }
}

// Helper function to get mitigation suggestions from Gemini
async function getMitigationSuggestions(cve: string, description: string): Promise<string[]> {
  if (!process.env.GOOGLE_API_KEY) {
    console.log('Google API key not found. Using fallback mitigation suggestions.');
    return getFallbackMitigationSuggestions(description);
  }

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `You are a cybersecurity expert. For the following CVE vulnerability, provide 3 specific, actionable mitigation steps. Keep each step concise.

CVE: ${cve}
Description: ${description}

Mitigation steps:`
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const text = response.data.candidates[0].content.parts[0].text;
    return text.split('\n')
      .filter((step: string) => step.trim().length > 0)
      .map((step: string) => step.replace(/^\d+\.\s*/, '')); // Remove numbering if present
  } catch (error: any) {
    console.error('Detailed error:', error);
    console.log(`Error getting mitigation suggestions for ${cve}: ${error.message}`);
    return getFallbackMitigationSuggestions(description);
  }
}

// Fallback mitigation suggestions based on CVE description
function getFallbackMitigationSuggestions(description: string): string[] {
  const suggestions: string[] = [];
  
  // Extract key terms from description
  const lowerDesc = description.toLowerCase();
  
  // Check for common vulnerability types
  if (lowerDesc.includes('remote code execution') || lowerDesc.includes('rce')) {
    suggestions.push('Apply the latest security patches');
    suggestions.push('Restrict network access to affected services');
    suggestions.push('Implement proper input validation and sanitization');
  } else if (lowerDesc.includes('denial of service') || lowerDesc.includes('dos')) {
    suggestions.push('Implement rate limiting and request throttling');
    suggestions.push('Configure proper resource limits and monitoring');
    suggestions.push('Use a web application firewall (WAF)');
  } else if (lowerDesc.includes('information disclosure') || lowerDesc.includes('data leak')) {
    suggestions.push('Update to the latest version with security fixes');
    suggestions.push('Implement proper access controls and authentication');
    suggestions.push('Encrypt sensitive data at rest and in transit');
  } else if (lowerDesc.includes('buffer overflow') || lowerDesc.includes('memory corruption')) {
    suggestions.push('Apply the latest security patches');
    suggestions.push('Enable address space layout randomization (ASLR)');
    suggestions.push('Implement proper bounds checking and input validation');
  } else if (lowerDesc.includes('sql injection') || lowerDesc.includes('xss')) {
    suggestions.push('Use parameterized queries and prepared statements');
    suggestions.push('Implement proper input validation and sanitization');
    suggestions.push('Enable web application firewall (WAF) rules');
  } else {
    // Generic suggestions for unknown vulnerability types
    suggestions.push('Update to the latest version with security patches');
    suggestions.push('Review and apply vendor security advisories');
    suggestions.push('Implement proper monitoring and logging');
  }

  return suggestions;
}

// Scrape The Hacker News RSS
async function scrapeTheHackerNews(): Promise<ThreatArticle[]> {
  try {
    const response = await axios.get('https://feeds.feedburner.com/TheHackersNews');
    const feed = await parseStringPromise(response.data);
    const articles: ThreatArticle[] = [];

    for (const item of feed.rss.channel[0].item) {
      const title = item.title[0];
      const description = item.description[0];
      const link = item.link[0];
      const date = new Date(item.pubDate[0]).toISOString();
      
      const cves = extractCVEs(title + ' ' + description);
      if (cves.length > 0) {
        // Set initial threat level based on title keywords
        const titleLower = title.toLowerCase();
        let initialThreatLevel: "Critical" | "High" | "Medium" | "Low" = "Medium"; // Default to Medium instead of High

        if (titleLower.includes('critical') || 
            titleLower.includes('zero-day') || 
            titleLower.includes('actively exploited')) {
          initialThreatLevel = "Critical";
        } else if (titleLower.includes('high') || 
                  titleLower.includes('severe') || 
                  titleLower.includes('security breach')) {
          initialThreatLevel = "High";
        } else if (titleLower.includes('low') || 
                  titleLower.includes('minor')) {
          initialThreatLevel = "Low";
        }

        console.log('Initial threat level assessment:', {
          title,
          initialThreatLevel,
          keywords: {
            critical: titleLower.includes('critical'),
            zeroDay: titleLower.includes('zero-day'),
            exploited: titleLower.includes('actively exploited'),
            high: titleLower.includes('high'),
            severe: titleLower.includes('severe'),
            breach: titleLower.includes('security breach'),
            low: titleLower.includes('low'),
            minor: titleLower.includes('minor')
          }
        });

        articles.push({
          title,
          date,
          source: 'The Hacker News',
          link,
          description,
          threatLevel: initialThreatLevel,
          cves: [], // Will be populated after CVE processing
        });
      }
    }

    return articles;
  } catch (error) {
    console.error('Error scraping The Hacker News:', error);
    return [];
  }
}

// Scrape NCSC News RSS
async function scrapeNCSCNews(): Promise<ThreatArticle[]> {
  try {
    const response = await axios.get('https://www.ncsc.gov.uk/api/1/services/v1/all-rss-feed.xml');
    const feed = await parseStringPromise(response.data);
    const articles: ThreatArticle[] = [];

    for (const item of feed.rss.channel[0].item) {
      const title = item.title[0];
      const description = item.description[0];
      const link = item.link[0];
      const date = new Date(item.pubDate[0]).toISOString();
      
      const cves = extractCVEs(title + ' ' + description);
      if (cves.length > 0) {
        // Set initial threat level based on title keywords
        const titleLower = title.toLowerCase();
        let initialThreatLevel: "Critical" | "High" | "Medium" | "Low" = "Medium"; // Default to Medium instead of High

        if (titleLower.includes('critical') || 
            titleLower.includes('zero-day') || 
            titleLower.includes('actively exploited')) {
          initialThreatLevel = "Critical";
        } else if (titleLower.includes('high') || 
                  titleLower.includes('severe') || 
                  titleLower.includes('security breach')) {
          initialThreatLevel = "High";
        } else if (titleLower.includes('low') || 
                  titleLower.includes('minor')) {
          initialThreatLevel = "Low";
        }

        console.log('Initial threat level assessment:', {
          title,
          initialThreatLevel,
          keywords: {
            critical: titleLower.includes('critical'),
            zeroDay: titleLower.includes('zero-day'),
            exploited: titleLower.includes('actively exploited'),
            high: titleLower.includes('high'),
            severe: titleLower.includes('severe'),
            breach: titleLower.includes('security breach'),
            low: titleLower.includes('low'),
            minor: titleLower.includes('minor')
          }
        });

        articles.push({
          title,
          date,
          source: 'NCSC',
          link,
          description,
          threatLevel: initialThreatLevel,
          cves: [], // Will be populated after CVE processing
        });
      }
    }

    return articles;
  } catch (error) {
    console.error('Error scraping NCSC News:', error);
    return [];
  }
}

type ThreatLevel = "Critical" | "High" | "Medium" | "Low";

function determineThreatLevel(title: string, cves: CVE[]): ThreatLevel {
  const titleLower = title.toLowerCase();
  
  // Check for critical keywords
  const criticalKeywords = ['critical', 'cvss 10.0', 'actively exploited', 'zero-day', 'rce', 'remote code execution'];
  if (criticalKeywords.some(keyword => titleLower.includes(keyword))) {
    console.log('Critical threat detected by keywords:', { title, keywords: criticalKeywords.filter(k => titleLower.includes(k)) });
    return "Critical";
  }

  // Check CVE severity
  const hasCriticalCVE = cves.some(cve => 
    cve.cvssScore >= 9.0 || 
    cve.severity?.toLowerCase() === 'critical'
  );
  if (hasCriticalCVE) {
    console.log('Critical threat detected by CVE:', { 
      title, 
      cves: cves.map(cve => ({ id: cve.id, score: cve.cvssScore, severity: cve.severity }))
    });
    return "Critical";
  }

  // Check for high-risk keywords
  const highRiskKeywords = ['high', 'severe', 'security breach', 'under attack', 'exploit'];
  if (highRiskKeywords.some(keyword => titleLower.includes(keyword)) || 
      cves.some(cve => cve.cvssScore >= 7.0)) {
    console.log('High threat detected:', { 
      title, 
      keywords: highRiskKeywords.filter(k => titleLower.includes(k)),
      cves: cves.map(cve => ({ id: cve.id, score: cve.cvssScore, severity: cve.severity }))
    });
    return "High";
  }

  // Check for medium-risk keywords
  const mediumRiskKeywords = ['vulnerability', 'security', 'patch', 'update'];
  if (mediumRiskKeywords.some(keyword => titleLower.includes(keyword)) || 
      cves.some(cve => cve.cvssScore >= 4.0)) {
    console.log('Medium threat detected:', { 
      title, 
      keywords: mediumRiskKeywords.filter(k => titleLower.includes(k)),
      cves: cves.map(cve => ({ id: cve.id, score: cve.cvssScore, severity: cve.severity }))
    });
    return "Medium";
  }

  console.log('Low threat detected (default):', { 
    title, 
    cves: cves.map(cve => ({ id: cve.id, score: cve.cvssScore, severity: cve.severity }))
  });
  // Default to Low if no other conditions are met
  return "Low";
}

// Helper function to categorize threat type
export function categorizeThreat(title: string, description: string): string {
  const text = (title + ' ' + description).toLowerCase();
  
  if (text.includes('malware') || text.includes('ransomware') || text.includes('trojan')) {
    return 'Malware';
  }
  if (text.includes('phishing') || text.includes('social engineering') || text.includes('credential')) {
    return 'Phishing';
  }
  if (text.includes('vulnerability') || text.includes('exploit') || text.includes('cve')) {
    return 'Vulnerability';
  }
  if (text.includes('ddos') || text.includes('denial of service')) {
    return 'DDoS';
  }
  return 'Other';
}

// Main function to process all sources
export async function processThreatSources(): Promise<ThreatArticle[]> {
  try {
    console.log('Starting threat scraping process...');
    const [hackerNews, ncscNews] = await Promise.all([
      scrapeTheHackerNews(),
      scrapeNCSCNews(),
    ]);

    console.log(`Found ${hackerNews.length} threats from Hacker News and ${ncscNews.length} threats from NCSC`);
    const allArticles = [...hackerNews, ...ncscNews];
    
    // Process CVEs for each article
    for (const article of allArticles) {
      // Extract CVEs from both title and description
      const cveIds = extractCVEs(article.title + ' ' + article.description);
      console.log(`Found ${cveIds.length} CVEs in article: ${article.title}`);
      console.log('CVE IDs:', cveIds);
      
      const cvePromises = cveIds.map(getCVEDetails);
      const cves = (await Promise.all(cvePromises)).filter((cve): cve is CVE => cve !== null);
      console.log('CVE details:', cves.map(cve => ({
        id: cve.id,
        severity: cve.severity,
        cvssScore: cve.cvssScore
      })));
      
      // Get mitigation suggestions for each CVE
      for (const cve of cves) {
        if (cve.description) {
          cve.mitigation = await getMitigationSuggestions(cve.id, cve.description);
          console.log(`Got mitigation suggestions for ${cve.id}`);
        }
      }
      
      article.cves = cves;
      
      // Update threat level based on highest CVE severity
      article.threatLevel = determineThreatLevel(article.title, cves);
      console.log(`Article threat level determined:`, {
        title: article.title,
        threatLevel: article.threatLevel,
        cves: cves.map(cve => ({
          id: cve.id,
          severity: cve.severity,
          cvssScore: cve.cvssScore
        }))
      });
    }

    console.log(`Processed ${allArticles.length} articles with CVEs`);
    return allArticles;
  } catch (error) {
    console.error('Error in processThreatSources:', error);
    return [];
  }
}

// If this file is being run directly (not imported as a module)
if (require.main === module) {
  console.log('Starting threat scraping process...');
  processThreatSources().then(threats => {
    console.log(`Found ${threats.length} threats with CVEs`);
    console.log('Threats:', JSON.stringify(threats, null, 2));
  }).catch(error => {
    console.error('Error processing threats:', error);
    process.exit(1);
  });
} 