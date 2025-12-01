import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-client';
import { createApplication, getCandidateProfile } from '@/lib/db';
import { applicationSchema } from '@/lib/validations';
import { ApiResponse, Application } from '@/types';

// POST /api/jobs/[jobId]/apply - Apply to a job
export async function POST(
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

    // Validate user role
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!user || user.role !== 'candidate') {
      const response: ApiResponse = { error: 'Only candidates can apply to jobs' };
      return NextResponse.json(response, { status: 403 });
    }

    // Check if candidate profile is complete
    const candidateProfile = await getCandidateProfile(session.user.id);
    if (!candidateProfile || !candidateProfile.resume_url) {
      const response: ApiResponse = { 
        error: 'Please complete your profile and upload a resume before applying' 
      };
      return NextResponse.json(response, { status: 400 });
    }

    const body = await request.json();
    const validatedData = applicationSchema.parse({
      job_id: params.jobId,
      cover_letter: body.cover_letter,
    });

    const application = await createApplication(
      validatedData.job_id,
      session.user.id,
      validatedData.cover_letter
    );

    const response: ApiResponse<Application> = {
      data: application,
      message: 'Application submitted successfully!'
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating application:', error);
    
    let errorMessage = 'Failed to submit application';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        errorMessage = 'You have already applied to this job';
        statusCode = 409;
      } else {
        errorMessage = error.message;
      }
    }

    const response: ApiResponse = { error: errorMessage };
    return NextResponse.json(response, { status: statusCode });
  }
}