import { CVEDetails, ThreatArticle } from '../types/threat';
import OpenAI from 'openai';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// URLs to scrape - replace with actual trusted sources
const TRUSTED_SOURCES = [
  {
    url: 'https://thehackernews.com/',
    name: 'The Hacker News'
  }
];

// Regular expression for finding CVE IDs
const CVE_REGEX = /CVE-\d{4}-\d{4,7}/gi;

export async function scrapeArticles(): Promise<ThreatArticle[]> {
  const articles: ThreatArticle[] = [];
  
  // Test with specific article
  const testUrl = 'https://thehackernews.com/2025/04/kimsuky-exploits-bluekeep-rdp.html';
  
  try {
    const response = await axios.get(testUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });
    
    const $ = cheerio.load(response.data);
    
    // Parse article content
    const title = $('h1').first().text().trim();
    const content = $('.articlebody').text().trim();
    const publishedDate = $('.date').first().text().trim();
    
    // Extract CVE IDs from content
    const cveMatches = content.match(CVE_REGEX) || [];
    
    // Extract CVSS score if available
    const cvssScoreMatch = content.match(/CVSS score: (\d+\.?\d*)/i);
    const cvssScore = cvssScoreMatch ? parseFloat(cvssScoreMatch[1]) : 0;
    
    articles.push({
      title,
      url: testUrl,
      source: 'The Hacker News',
      publishedDate,
      summary: content.substring(0, 200) + '...',
      cves: cveMatches.map(cveId => ({
        id: cveId,
        description: '',
        severity: cvssScore >= 9.0 ? 'CRITICAL' : cvssScore >= 7.0 ? 'HIGH' : 'MEDIUM',
        cvssScore,
        mitigation: ''
      })),
      criticalityScore: cvssScore
    });
    
  } catch (error) {
    console.error('Error scraping article:', error);
  }
  
  return articles;
}

export async function getCVEDetails(cveId: string): Promise<CVEDetails | null> {
  try {
    // Replace with actual NVD API endpoint
    const response = await axios.get(
      `https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${cveId}`,
      {
        headers: {
          'apiKey': process.env.NVD_API_KEY
        }
      }
    );
    
    const cveData = response.data.vulnerabilities[0].cve;
    
    return {
      id: cveId,
      description: cveData.descriptions[0].value,
      severity: cveData.metrics?.cvssMetricV31?.[0]?.cvssData?.baseSeverity || 'UNKNOWN',
      cvssScore: cveData.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore,
      publishedDate: cveData.published,
      lastModifiedDate: cveData.lastModified,
      mitigation: '', // Will be populated by OpenAI
    };
  } catch (error) {
    console.error(`Error fetching CVE details for ${cveId}:`, error);
    return null;
  }
}

export async function getMitigationSuggestion(cve: CVEDetails): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a cybersecurity expert. Provide a concise mitigation strategy for the following CVE."
        },
        {
          role: "user",
          content: `CVE ID: ${cve.id}\nDescription: ${cve.description}\nSeverity: ${cve.severity}`
        }
      ],
      max_tokens: 150
    });

    return completion.choices[0].message.content || '';
  } catch (error) {
    console.error(`Error getting mitigation for ${cve.id}:`, error);
    return '';
  }
}

export function calculateCriticality(cves: CVEDetails[]): number {
  if (cves.length === 0) return 0;
  
  // Convert CVSS scores to numbers, default to 0 if not available
  const scores = cves.map(cve => cve.cvssScore || 0);
  
  // Return the highest score
  return Math.max(...scores);
} 