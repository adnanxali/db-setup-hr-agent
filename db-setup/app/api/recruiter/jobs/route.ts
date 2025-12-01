import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-client';
import { createJob, getJobs } from '@/lib/db';
import { jobSchema, jobFiltersSchema } from '@/lib/validations';
import { ApiResponse, PaginatedResponse, Job } from '@/types';

// GET /api/recruiter/jobs - List jobs posted by logged-in recruiter
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      const response: ApiResponse = { error: 'Unauthorized' };
      return NextResponse.json(response, { status: 401 });
    }

    // Validate user role
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!user || user.role !== 'recruiter') {
      const response: ApiResponse = { error: 'Only recruiters can access this endpoint' };
      return NextResponse.json(response, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    
    const filters = jobFiltersSchema.parse(params);
    
    const { data, count } = await getJobs({
      ...filters,
      recruiterId: session.user.id,
    });

    const totalPages = Math.ceil(count / filters.limit);

    const response: PaginatedResponse<Job> = {
      data,
      count,
      page: filters.page,
      limit: filters.limit,
      totalPages,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching recruiter jobs:', error);
    
    const apiResponse: ApiResponse = {
      error: error instanceof Error ? error.message : 'Failed to fetch jobs'
    };
    
    return NextResponse.json(apiResponse, { status: 500 });
  }
}

// POST /api/recruiter/jobs - Create a new job posting
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      const response: ApiResponse = { error: 'Unauthorized' };
      return NextResponse.json(response, { status: 401 });
    }

    // Validate user role
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!user || user.role !== 'recruiter') {
      const response: ApiResponse = { error: 'Only recruiters can create jobs' };
      return NextResponse.json(response, { status: 403 });
    }

    const body = await request.json();
    const validatedData = jobSchema.parse(body);

    const job = await createJob(session.user.id, validatedData);

    const response: ApiResponse<Job> = {
      data: job,
      message: 'Job created successfully!'
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating job:', error);
    
    const apiResponse: ApiResponse = {
      error: error instanceof Error ? error.message : 'Failed to create job'
    };
    
    return NextResponse.json(apiResponse, { status: 500 });
  }
}