import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-client';
import { getApplications } from '@/lib/db';
import { applicationFiltersSchema } from '@/lib/validations';
import { ApiResponse, PaginatedResponse, Application } from '@/types';

// GET /api/recruiter/jobs/[jobId]/applications - View all candidates for a job
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

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    const filters = applicationFiltersSchema.parse(queryParams);
    
    const { data, count } = await getApplications({
      ...filters,
      jobId: params.jobId,
    });

    const totalPages = Math.ceil(count / filters.limit);

    const response: PaginatedResponse<Application> = {
      data,
      count,
      page: filters.page,
      limit: filters.limit,
      totalPages,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching job applications:', error);
    
    const apiResponse: ApiResponse = {
      error: error instanceof Error ? error.message : 'Failed to fetch applications'
    };
    
    return NextResponse.json(apiResponse, { status: 500 });
  }
}