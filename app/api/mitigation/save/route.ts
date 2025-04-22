import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cveId, mitigationPlan } = body;

    if (!cveId || !mitigationPlan) {
      return NextResponse.json(
        { error: 'CVE ID and mitigation plan are required' },
        { status: 400 }
      );
    }

    // Create a directory for saved plans if it doesn't exist
    const plansDir = join(process.cwd(), 'data', 'mitigation-plans');
    await mkdir(plansDir, { recursive: true });

    // Save the plan as a JSON file
    const fileName = `${cveId}-${new Date().toISOString().split('T')[0]}.json`;
    const filePath = join(plansDir, fileName);
    
    await writeFile(filePath, JSON.stringify(mitigationPlan, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Mitigation plan saved successfully',
      fileName,
    });
  } catch (error) {
    console.error('Error saving mitigation plan:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save mitigation plan' },
      { status: 500 }
    );
  }
} 