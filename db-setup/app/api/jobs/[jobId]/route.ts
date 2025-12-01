import { NextRequest, NextResponse } from 'next/server';
import { getJobById } from '@/lib/db';
import { ApiResponse, Job } from '@/types';

// GET /api/jobs/[jobId] - Get job details
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const job = await getJobById(params.jobId);
    
    const response: ApiResponse<Job> = {
      data: job
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching job:', error);
    
    const apiResponse: ApiResponse = {
      error: error instanceof Error ? error.message : 'Job not found'
    };
    
    return NextResponse.json(apiResponse, { status: 404 });
  }
}