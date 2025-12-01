import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-client';
import { updateApplicationStatus } from '@/lib/db';
import { applicationStatusSchema } from '@/lib/validations';
import { ApiResponse, Application } from '@/types';

// GET /api/recruiter/jobs/[jobId]/applications/[appId] - View specific candidate profile & resume
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string; appId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      const response: ApiResponse = { error: 'Unauthorized' };
      return NextResponse.json(response, { status: 401 });
    }

    // Validate job ownership
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('recruiter_id')
      .eq('id', params.jobId)
      .single();

    if (jobError || !job || job.recruiter_id !== session.user.id) {
      const response: ApiResponse = { error: 'Job not found or access denied' };
      return NextResponse.json(response, { status: 404 });
    }

    // Get application with candidate details
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        candidate:users!applications_candidate_id_fkey(
          *,
          candidate_profiles(*)
        ),
        job:jobs(*)
      `)
      .eq('id', params.appId)
      .eq('job_id', params.jobId)
      .single();

    if (error) {
      const response: ApiResponse = { error: 'Application not found' };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<Application> = {
      data: data as Application
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching application:', error);
    
    const apiResponse: ApiResponse = {
      error: error instanceof Error ? error.message : 'Failed to fetch application'
    };
    
    return NextResponse.json(apiResponse, { status: 500 });
  }
}

// PUT /api/recruiter/jobs/[jobId]/applications/[appId] - Update application status
export async function PUT(
  request: NextRequest,
  { params }: { params: { jobId: string; appId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      const response: ApiResponse = { error: 'Unauthorized' };
      return NextResponse.json(response, { status: 401 });
    }

    // Validate job ownership
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('recruiter_id')
      .eq('id', params.jobId)
      .single();

    if (jobError || !job || job.recruiter_id !== session.user.id) {
      const response: ApiResponse = { error: 'Job not found or access denied' };
      return NextResponse.json(response, { status: 404 });
    }

    const body = await request.json();
    const validatedData = applicationStatusSchema.parse(body);

    const application = await updateApplicationStatus(
      params.appId,
      validatedData.status,
      validatedData.score
    );

    const response: ApiResponse<Application> = {
      data: application,
      message: 'Application status updated successfully!'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating application:', error);
    
    const apiResponse: ApiResponse = {
      error: error instanceof Error ? error.message : 'Failed to update application'
    };
    
    return NextResponse.json(apiResponse, { status: 500 });
  }
}