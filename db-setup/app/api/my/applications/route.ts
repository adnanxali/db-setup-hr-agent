import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-client';
import { getApplications } from '@/lib/db';
import { applicationFiltersSchema } from '@/lib/validations';
import { ApiResponse, PaginatedResponse, Application } from '@/types';

// GET /api/my/applications - List user's applications
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      const response: ApiResponse = { error: 'Unauthorized' };
      return NextResponse.json(response, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    
    const filters = applicationFiltersSchema.parse(params);
    
    const { data, count } = await getApplications({
      ...filters,
      candidateId: session.user.id,
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
    console.error('Error fetching applications:', error);
    
    const apiResponse: ApiResponse = {
      error: error instanceof Error ? error.message : 'Failed to fetch applications'
    };
    
    return NextResponse.json(apiResponse, { status: 500 });
  }
}