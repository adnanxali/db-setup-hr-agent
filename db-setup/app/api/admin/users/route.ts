import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-client';
import { paginationSchema } from '@/lib/validations';
import { ApiResponse, PaginatedResponse, User } from '@/types';

// GET /api/admin/users - List all system users
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      const response: ApiResponse = { error: 'Unauthorized' };
      return NextResponse.json(response, { status: 401 });
    }

    // Validate admin role
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!user || user.role !== 'super_admin') {
      const response: ApiResponse = { error: 'Admin access required' };
      return NextResponse.json(response, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    
    const { page, limit } = paginationSchema.parse(params);
    
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('users')
      .select(`
        *,
        candidate_profiles(id, resume_url, skills, experience_years),
        recruiter_profiles(id, company_name, company_website)
      `, { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      const response: ApiResponse = { error: error.message };
      return NextResponse.json(response, { status: 500 });
    }

    const totalPages = Math.ceil((count || 0) / limit);

    const response: PaginatedResponse<User> = {
      data: data as User[],
      count: count || 0,
      page,
      limit,
      totalPages,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching users:', error);
    
    const apiResponse: ApiResponse = {
      error: error instanceof Error ? error.message : 'Failed to fetch users'
    };
    
    return NextResponse.json(apiResponse, { status: 500 });
  }
}