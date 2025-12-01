import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-client';
import { getJobById, updateJob, deleteJob } from '@/lib/db';
import { jobUpdateSchema, jobStatusSchema } from '@/lib/validations';
import { ApiResponse, Job } from '@/types';

async function validateJobOwnership(jobId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('jobs')
    .select('recruiter_id')
    .eq('id', jobId)
    .single();

  if (error || !data || data.recruiter_id !== userId) {
    throw new Error('Job not found or access denied');
  }
}

// GET /api/recruiter/jobs/[jobId] - Get details of owned job
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      const response: ApiResponse = { error: 'Unauthorized' };
      return NextResponse.json(response, { status: 401 });
    }

    await validateJobOwnership(params.jobId, session.user.id);
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

// PUT /api/recruiter/jobs/[jobId] - Update job details
export async function PUT(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      const response: ApiResponse = { error: 'Unauthorized' };
      return NextResponse.json(response, { status: 401 });
    }

    await validateJobOwnership(params.jobId, session.user.id);

    const body = await request.json();
    const validatedData = jobUpdateSchema.parse(body);

    const job = await updateJob(params.jobId, validatedData);

    const response: ApiResponse<Job> = {
      data: job,
      message: 'Job updated successfully!'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating job:', error);
    
    const apiResponse: ApiResponse = {
      error: error instanceof Error ? error.message : 'Failed to update job'
    };
    
    return NextResponse.json(apiResponse, { status: 500 });
  }
}

// DELETE /api/recruiter/jobs/[jobId] - Close/Delete job
export async function DELETE(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      const response: ApiResponse = { error: 'Unauthorized' };
      return NextResponse.json(response, { status: 401 });
    }

    await validateJobOwnership(params.jobId, session.user.id);
    await deleteJob(params.jobId);

    const response: ApiResponse = {
      message: 'Job deleted successfully!'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting job:', error);
    
    const apiResponse: ApiResponse = {
      error: error instanceof Error ? error.message : 'Failed to delete job'
    };
    
    return NextResponse.json(apiResponse, { status: 500 });
  }
}