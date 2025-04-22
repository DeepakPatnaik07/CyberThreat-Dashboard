import { ThreatArticle } from '@/types/threat';

export const mockThreats: ThreatArticle[] = [
  {
    id: '1',
    title: 'Critical RCE Vulnerability in Apache Log4j',
    description: 'A critical remote code execution vulnerability has been discovered in Apache Log4j library.',
    type: 'vulnerability',
    source: 'CVE Database',
    publishedDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    criticalityScore: 9.8,
    mitigationStatus: 'pending',
    link: 'https://nvd.nist.gov/vuln/detail/CVE-2021-44228',
    cves: [
      { 
        id: 'CVE-2021-44228', 
        cvssScore: 9.8, 
        cvss: '9.8',
        severity: 'Critical',
        description: 'Remote Code Execution in Log4j',
        affectedSystems: ['Apache Log4j 2.0-beta9 through 2.15.0']
      }
    ]
  },
  {
    id: '2',
    title: 'New Phishing Campaign Targeting Financial Institutions',
    description: 'A sophisticated phishing campaign has been detected targeting major banks and financial institutions.',
    type: 'phishing',
    source: 'Threat Intelligence Feed',
    publishedDate: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    criticalityScore: 7.5,
    mitigationStatus: 'applied',
    link: 'https://example.com/phishing-alert',
    cves: []
  },
  {
    id: '3',
    title: 'Ransomware Attack on Healthcare Provider',
    description: 'A major healthcare provider has been hit by a ransomware attack affecting patient data.',
    type: 'malware',
    source: 'Security News',
    publishedDate: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    criticalityScore: 8.2,
    mitigationStatus: 'pending',
    link: 'https://example.com/ransomware-alert',
    cves: [
      { 
        id: 'CVE-2022-12345', 
        cvssScore: 7.5, 
        cvss: '7.5',
        severity: 'High',
        description: 'Ransomware Exploit',
        affectedSystems: ['Healthcare Management System v2.1']
      }
    ]
  },
  {
    id: '4',
    title: 'Zero-Day Exploit in Microsoft Exchange',
    description: 'A new zero-day vulnerability has been discovered in Microsoft Exchange Server.',
    type: 'vulnerability',
    source: 'Microsoft Security Response',
    publishedDate: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
    criticalityScore: 9.0,
    mitigationStatus: 'applied',
    link: 'https://msrc.microsoft.com/update-guide/vulnerability/CVE-2022-23456',
    cves: [
      { 
        id: 'CVE-2022-23456', 
        cvssScore: 9.0, 
        cvss: '9.0',
        severity: 'Critical',
        description: 'Exchange Server Zero-Day',
        affectedSystems: ['Microsoft Exchange Server 2019', 'Microsoft Exchange Server 2016']
      }
    ]
  },
  {
    id: '5',
    title: 'Supply Chain Attack on NPM Package',
    description: 'A malicious package has been discovered in the NPM registry.',
    type: 'supply-chain',
    source: 'NPM Security',
    publishedDate: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString(),
    criticalityScore: 8.5,
    mitigationStatus: 'pending',
    link: 'https://example.com/npm-alert',
    cves: [
      { 
        id: 'CVE-2022-34567', 
        cvssScore: 8.5, 
        cvss: '8.5',
        severity: 'High',
        description: 'NPM Package Compromise',
        affectedSystems: ['Affected NPM Package v1.0-1.2']
      }
    ]
  }
]; 