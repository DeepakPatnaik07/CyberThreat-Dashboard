import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { MitigationSuggestion } from '@/types/mitigation';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    borderBottom: 1,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 8,
    color: '#1a1a1a',
  },
  listItem: {
    fontSize: 12,
    marginBottom: 4,
    color: '#333333',
  },
  metadata: {
    fontSize: 10,
    color: '#666666',
    marginTop: 20,
  },
});

interface MitigationPDFProps {
  mitigation: MitigationSuggestion;
}

export const MitigationPDF = ({ mitigation }: MitigationPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Mitigation Plan for {mitigation.cveId}</Text>
        {mitigation.cveDetails && (
          <Text style={styles.subtitle}>
            Severity: {mitigation.cveDetails.severity} | CVSS Score: {mitigation.cveDetails.cvssScore}
          </Text>
        )}
      </View>

      {mitigation.cveDetails && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CVE Details</Text>
          <Text style={styles.listItem}>{mitigation.cveDetails.description}</Text>
          <Text style={styles.listItem}>
            Published: {new Date(mitigation.cveDetails.publishedDate).toLocaleDateString()}
          </Text>
          <Text style={styles.listItem}>
            Last Modified: {new Date(mitigation.cveDetails.lastModifiedDate).toLocaleDateString()}
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Immediate Actions</Text>
        {mitigation.suggestions.immediateActions.map((action, index) => (
          <Text key={index} style={styles.listItem}>• {action}</Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Short-term Measures</Text>
        {mitigation.suggestions.shortTerm.map((action, index) => (
          <Text key={index} style={styles.listItem}>• {action}</Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Long-term Solutions</Text>
        {mitigation.suggestions.longTerm.map((action, index) => (
          <Text key={index} style={styles.listItem}>• {action}</Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Recommendations</Text>
        {mitigation.suggestions.additionalRecommendations.map((action, index) => (
          <Text key={index} style={styles.listItem}>• {action}</Text>
        ))}
      </View>

      <View style={styles.metadata}>
        <Text>Environment: {mitigation.environment || 'Not specified'}</Text>
        <Text>Risk Level: {mitigation.riskLevel}</Text>
        <Text>Priority: {mitigation.priority}</Text>
        <Text>Estimated Effort: {mitigation.estimatedEffort}</Text>
        <Text>Generated on: {new Date().toLocaleDateString()}</Text>
      </View>
    </Page>
  </Document>
); 