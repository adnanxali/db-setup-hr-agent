import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-client';
import { ApiResponse, Application } from '@/types';

// GET /api/my/applications/[appId] - View specific application status
export async function GET(
  request: NextRequest,
  { params }: { params: { appId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      const response: ApiResponse = { error: 'Unauthorized' };
      return NextResponse.json(response, { status: 401 });
    }

    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        job:jobs(
          *,
          recruiter_profiles(company_name, company_logo)
        )
      `)
      .eq('id', params.appId)
      .eq('candidate_id', session.user.id)
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