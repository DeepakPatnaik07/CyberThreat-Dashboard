const { processThreatSources } = require('../utils/threat-scraper');
const fs = require('fs').promises;
const path = require('path');

async function updateThreats() {
  try {
    console.log('Starting threat data update...');
    
    // Process threats from all sources
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

    const summary = {
      activeThreats: threats.length,
      cvesMonitored,
      mitigationsApplied,
      threatLevel,
      severityDistribution,
    };

    const response = {
      summary,
      threats,
      lastUpdated: new Date().toISOString(),
    };

    // Save the data to a file
    const dataPath = path.join(process.cwd(), 'data', 'threats.json');
    await fs.mkdir(path.dirname(dataPath), { recursive: true });
    await fs.writeFile(dataPath, JSON.stringify(response, null, 2));
    
    console.log('Threat data update completed successfully');
  } catch (error) {
    console.error('Error updating threat data:', error);
    process.exit(1);
  }
}

updateThreats(); 