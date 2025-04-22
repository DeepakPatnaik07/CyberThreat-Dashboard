'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { AlertTriangle, Search, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { PDFDownloadLink } from '@react-pdf/renderer';
import { MitigationPDF } from '@/app/components/pdf/MitigationPDF';

// Interface for the direct API/Gemini response
interface MitigationPlan {
  immediateActions: string[];
  shortTermRemediation: string[];
  longTermSolutions: string[];
  additionalRecommendations: string[];
}

// Interface for the data structure used for display state
interface MitigationDisplayData {
  cveId: string;
  environment?: string;
  affectedSystems?: string[];
  constraints?: string[];
  plan: MitigationPlan;
  // cveDetails?: { /* If fetched */ };
}

export default function Mitigation() {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Use the new state structure and name
  const [mitigationDisplay, setMitigationDisplay] = useState<MitigationDisplayData | null>(null);
  const [formData, setFormData] = useState({
    cveId: '',
    environment: '',
    affectedSystems: '',
    constraints: '',
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const validateCveId = (cveId: string): boolean => {
    const cveRegex = /^CVE-\d{4}-\d{4,}$/;
    return cveRegex.test(cveId);
  };

  // Updated handler to clear mitigationDisplay state
  const handleCveIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setFormData({ ...formData, cveId: value });
    setValidationError(null);
    setMitigationDisplay(null); // Clear plan when ID changes
    if (value && !validateCveId(value)) {
      setValidationError('Invalid CVE ID format. Please use format: CVE-YYYY-XXXXX');
    }
  };

  // Updated handler to clear mitigationDisplay state
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'cveId') {
        const upperValue = value.toUpperCase();
        setValidationError(null);
        setMitigationDisplay(null); // Clear plan when ID changes
        if (value && !validateCveId(upperValue)) {
            setValidationError('Invalid CVE ID format. Please use format: CVE-YYYY-XXXXX');
        }
    }
  };

  // Updated handler to use the new structure and validation
  const handleGenerateMitigation = async () => {
    if (!formData.cveId) {
      toast.error('Please enter a CVE ID');
      return;
    }
    if (!validateCveId(formData.cveId)) {
      setValidationError('Invalid CVE ID format. Please use format: CVE-YYYY-XXXXX');
      return;
    }
    setValidationError(null);
    setMitigationDisplay(null); // Clear previous results
    setIsLoading(true);
    try {
      const trimmedCveId = formData.cveId.trim();
      const environment = formData.environment.trim() || undefined;
      const affectedSystems = formData.affectedSystems.split(',').map(s => s.trim()).filter(Boolean);
      const constraints = formData.constraints.split(',').map(s => s.trim()).filter(Boolean);

      console.log('[Mitigation Page] Sending fetch request...');
      const response = await fetch('/api/mitigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cveId: trimmedCveId, environment, affectedSystems, constraints }),
      });

      console.log('[Mitigation Page] API Response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        console.error('[Mitigation Page] API Error Data:', errorData);
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      // Expecting the direct plan structure
      const planData: MitigationPlan = await response.json();
      console.log('[Mitigation Page] Received mitigation plan data:', planData);
      
      // Update the validation check for the new structure
      if (!planData || !planData.immediateActions || !planData.shortTermRemediation || !planData.longTermSolutions || !planData.additionalRecommendations) {
        console.error('[Mitigation Page] Invalid plan format received:', planData);
        throw new Error('Invalid response format received from AI service.');
      }

      // Update state with the new structure
      setMitigationDisplay({
          cveId: trimmedCveId,
          environment: environment,
          affectedSystems: affectedSystems,
          constraints: constraints,
          plan: planData
      });
      toast.success('Mitigation plan generated successfully');
    } catch (error) {
      console.error('[Mitigation Page] Error generating mitigation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate mitigation plan');
    } finally {
      setIsLoading(false);
    }
  };

  // Needs update for PDF generation if structure changed
  const handleSavePlan = async () => { /* Placeholder */ };
  const handleExportPlan = () => { /* Placeholder */ };

  if (!mounted) { return null; }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-white/30">
        <div className="flex h-16 items-center px-4">
          <SidebarTrigger className="mr-2 md:hidden" />
          <div className="flex items-center justify-between w-full">
            <h1 className="text-lg font-semibold text-white">Mitigation</h1>
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 overflow-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight text-white">Mitigation Plan Generator</h2>
        </div>

        <Card className="border-white/30 bg-card">
            <CardHeader>
                <CardTitle className="text-white">Enter Details</CardTitle>
                <CardDescription className="text-white/70">Provide CVE ID and context to generate a plan.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div>
                     <label htmlFor="cveId" className="block text-sm font-medium text-white/90 mb-1">CVE ID *</label>
                     <Input
                         id="cveId"
                         name="cveId"
                         type="text"
                         placeholder="CVE-YYYY-NNNN..."
                         className={`w-full bg-background border-white/30 focus-visible:ring-white text-white ${validationError ? 'border-red-500' : ''}`}
                         value={formData.cveId}
                         onChange={handleCveIdChange}
                         required
                     />
                     {validationError && (
                         <p className="text-red-500 text-xs mt-1">{validationError}</p>
                     )}
                 </div>
                 <div>
                     <label htmlFor="environment" className="block text-sm font-medium text-white/90 mb-1">Target Environment (Optional)</label>
                     <Input
                         id="environment"
                         name="environment"
                         type="text"
                         placeholder="e.g., Production Cloud, Internal Network, Specific Application"
                         className="w-full bg-background border-white/30 focus-visible:ring-white text-white"
                         value={formData.environment}
                         onChange={handleInputChange}
                     />
                 </div>
                 <div>
                     <label htmlFor="affectedSystems" className="block text-sm font-medium text-white/90 mb-1">Affected Systems/Assets (Optional, comma-separated)</label>
                     <Input
                         id="affectedSystems"
                         name="affectedSystems"
                         type="text"
                         placeholder="e.g., webserver-01, database-cluster, auth-service"
                         className="w-full bg-background border-white/30 focus-visible:ring-white text-white"
                         value={formData.affectedSystems}
                         onChange={handleInputChange}
                     />
                 </div>
                 <div>
                     <label htmlFor="constraints" className="block text-sm font-medium text-white/90 mb-1">Operational Constraints (Optional, comma-separated)</label>
                     <Input 
                         id="constraints"
                         name="constraints"
                         placeholder="e.g., Downtime restriction, Compliance needs, Specific tools"
                         className="w-full bg-background border-white/30 focus-visible:ring-white text-white"
                         value={formData.constraints}
                         onChange={handleInputChange}
                     />
                 </div>
                  <Button 
                    className="w-full bg-white/90 hover:bg-white text-black"
                    onClick={handleGenerateMitigation}
                    disabled={isLoading || !!validationError || !formData.cveId}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate Mitigation Plan'
                    )}
                  </Button>
            </CardContent>
        </Card>

        {mitigationDisplay && (
          <Card className="border-white/30 mt-6">
            <CardHeader>
              <CardTitle className="text-white">Mitigation Plan for {mitigationDisplay.cveId}</CardTitle>
              <CardDescription className="text-white/70 mt-2">
                 Generated for Environment: {mitigationDisplay.environment || 'N/A'} \
                 {mitigationDisplay.affectedSystems && mitigationDisplay.affectedSystems.length > 0 && ` | Systems: ${mitigationDisplay.affectedSystems.join(', ')}` } \
                 {mitigationDisplay.constraints && mitigationDisplay.constraints.length > 0 && ` | Constraints: ${mitigationDisplay.constraints.join(', ')}` }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Immediate Actions</h3>
                  <ul className="list-disc list-inside space-y-1 text-white/80">
                    {mitigationDisplay.plan.immediateActions.map((action, index) => (
                      <li key={`imm-${index}`}>{action}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Short-term Remediation</h3>
                  <ul className="list-disc list-inside space-y-1 text-white/80">
                    {mitigationDisplay.plan.shortTermRemediation.map((action, index) => (
                      <li key={`st-${index}`}>{action}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Long-term Solutions</h3>
                  <ul className="list-disc list-inside space-y-1 text-white/80">
                    {mitigationDisplay.plan.longTermSolutions.map((action, index) => (
                      <li key={`lt-${index}`}>{action}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Additional Recommendations</h3>
                  <ul className="list-disc list-inside space-y-1 text-white/80">
                    {mitigationDisplay.plan.additionalRecommendations.map((action, index) => (
                      <li key={`add-${index}`}>{action}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
