import { NextResponse } from 'next/server';

// Helper function to get CVE details (placeholder - replace with actual NVD API call)
async function getCveDetails(cveId: string): Promise<{ description: string } | null> {
    try {
        console.log(`Fetching details for ${cveId} from NVD (simulated)...`);
        // In a real app, fetch from NVD API:
        // const nvdApiUrl = `https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${cveId}`;
        // const nvdResponse = await fetch(nvdApiUrl, { headers: { 'apiKey': process.env.NVD_API_KEY || '' } }); // Use NVD API key if needed
        // if (!nvdResponse.ok) {
        //     console.warn(`NVD API request failed for ${cveId}: ${nvdResponse.status}`);
        //     return null;
        // }
        // const nvdData = await nvdResponse.json();
        // const description = nvdData?.vulnerabilities?.[0]?.cve?.descriptions?.find((d: any) => d.lang === 'en')?.value;
        // return description ? { description } : null;

        // --- Simulation ---
        await new Promise(resolve => setTimeout(resolve, 50)); // Simulate network delay
        const simulatedDescriptions: { [key: string]: string } = {
            'CVE-2024-12477': 'Stored Cross-Site Scripting (XSS) vulnerability in Avada Builder plugin for WordPress allows authenticated attackers with contributor-level access and above, including 3.11.11 due to insufficient input sanitization and output escaping on user supplied attributes.',
            'CVE-2021-20035': 'Example CVE description for testing purposes.',
            // Add more simulated descriptions as needed
        };
        const description = simulatedDescriptions[cveId] || `Simulated description for ${cveId}.`;
        return { description };
        // --- End Simulation ---

    } catch (error) {
        console.error(`Error fetching NVD details for ${cveId}:`, error);
        return null;
    }
}


export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { cveId, environment, affectedSystems, constraints } = body;

        // Log the raw received value
        console.log(`[Mitigation API] Received raw cveId: "${cveId}", type: ${typeof cveId}`);

        // Validate CVE ID format
        const trimmedCveId = cveId ? String(cveId).trim() : '';
        console.log(`[Mitigation API] Trimmed cveId: "${trimmedCveId}"`);

        const cveRegex = /^CVE-\d{4}-\d{4,}$/;
        const isServerValid = cveRegex.test(trimmedCveId);
        console.log(`[Mitigation API] Server-side validation result for "${trimmedCveId}": ${isServerValid}`);

        if (!trimmedCveId || !isServerValid) {
            console.log(`[Mitigation API] Validation failed. Returning 400.`);
            return NextResponse.json({ error: 'Valid CVE ID is required (e.g., CVE-YYYY-NNNN)' }, { status: 400 });
        }

        // Check for Gemini API Key
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
             console.error("Security Alert: GEMINI_API_KEY environment variable is not set.");
             // Return a generic error to the client
             return NextResponse.json({ error: 'Server configuration error prevented AI analysis.' }, { status: 500 });
        }

        console.log(`Generating mitigation plan for ${cveId}`);

        // 1. Fetch CVE description
        const cveDetails = await getCveDetails(cveId);
        const cveDescription = cveDetails?.description || 'No official description readily available.';

        // 2. Construct the prompt for Gemini
        const prompt = `
Generate a structured cybersecurity mitigation plan for the vulnerability identified as ${cveId}.

CVE Description:
"${cveDescription}"

Provide the plan based on the following context (if specified):
- Target Environment: ${environment || 'General / Not specified'}
- Specific Affected Systems/Assets: ${affectedSystems || 'Not specified'}
- Operational Constraints or Considerations: ${constraints || 'None specified'}

Structure the response as a JSON object containing ONLY the following keys: "immediateActions", "shortTermRemediation", "longTermSolutions", "additionalRecommendations".
The value for each key MUST be an array of strings, where each string represents a distinct, actionable mitigation step or recommendation.
Focus on practical steps relevant to the CVE description and provided context.

Example format:
{
  "immediateActions": ["Isolate affected systems.", "Block known malicious IPs."],
  "shortTermRemediation": ["Apply vendor patch XYZ.", "Implement stricter firewall rules."],
  "longTermSolutions": ["Upgrade underlying library.", "Implement network segmentation."],
  "additionalRecommendations": ["Monitor logs for indicators.", "Conduct user awareness training."]
}
`;

        // 3. Call Gemini API
        // Use string concatenation to avoid potential parsing issues with template literal
        const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + apiKey;
        const geminiPayload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                 responseMimeType: "application/json", // Request JSON directly
                 temperature: 0.5 // Adjust for creativity vs determinism
            },
             safetySettings: [ // Add basic safety settings
                 { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                 { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                 { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                 { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
             ]
        };

         console.log("Sending request to Gemini API...");
         const geminiResponse = await fetch(geminiUrl, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(geminiPayload),
         });

        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.text();
            // Use string concatenation for console.error
            console.error('Gemini API Error (' + geminiResponse.status + '):', errorBody);
            // Provide a more helpful error if possible
            let clientError = `AI service failed with status ${geminiResponse.status}.`;
            try {
                const parsedError = JSON.parse(errorBody);
                if (parsedError?.error?.message) {
                    clientError = 'AI service error: ' + parsedError.error.message;
                }
            } catch {} // Ignore parsing errors
            throw new Error(clientError);
        }

        // 4. Parse Gemini Response
        const geminiData = await geminiResponse.json();
        const candidate = geminiData?.candidates?.[0];
        const contentPart = candidate?.content?.parts?.[0];
        const responseText = contentPart?.text;

        // Safety check
        if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
             console.warn('Gemini response generation finished due to: ' + candidate.finishReason);
             // Optionally return specific error based on reason (e.g., SAFETY)
             if (candidate.finishReason === 'SAFETY') {
                 return NextResponse.json({ error: 'Failed to generate plan due to safety settings.' }, { status: 400 });
             }
         }

        if (!responseText) {
             console.error("Invalid response structure from Gemini (missing text):", JSON.stringify(geminiData, null, 2));
             throw new Error("AI service returned an unexpected response format.");
        }

         let mitigationPlan;
         try {
             mitigationPlan = JSON.parse(responseText);
             // Validate the structure more rigorously
             const requiredKeys = ["immediateActions", "shortTermRemediation", "longTermSolutions", "additionalRecommendations"];
             for (const key of requiredKeys) {
                 if (!mitigationPlan[key] || !Array.isArray(mitigationPlan[key]) || !mitigationPlan[key].every((item: unknown) => typeof item === 'string')) {
                    throw new Error(`Parsed JSON missing or invalid format for key: '${key}'. Expected array of strings.`);
                 }
             }
         } catch (parseError) {
             console.error("Failed to parse JSON from Gemini response:", parseError);
             console.error("Raw Gemini response text:", responseText);
             throw new Error("AI service returned an invalid plan format.");
         }

        // 5. Return the AI-generated plan
        console.log(`Successfully generated mitigation plan for ${cveId}`);
        return NextResponse.json(mitigationPlan);

    } catch (error) {
        console.error('Error in POST /api/mitigation:', error);
        // Censor potentially sensitive details before sending to client
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        const clientMessage = message.includes("API key") || message.includes("configuration error")
            ? "A server configuration error occurred."
            : message.startsWith("AI service error:") || message.startsWith("Failed to generate plan")
            ? message // Forward specific AI errors if safe
            : "Failed to generate mitigation plan due to an internal error.";

        return NextResponse.json({ error: clientMessage }, { status: 500 });
    }
} 