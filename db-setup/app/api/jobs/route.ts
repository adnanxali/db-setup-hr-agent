import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-client';

// GET /api/jobs - Fetch all open jobs
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const location = searchParams.get('location') || '';
    const type = searchParams.get('type') || '';
    
    let query = supabase
      .from('jobs')
      .select(`
        *,
        recruiter:users!jobs_recruiter_id_fkey(
          id,
          full_name,
          company
        )
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    if (location) {
      query = query.ilike('location', `%${location}%`);
    }

    if (type) {
      query = query.eq('pipeline_config->>type', type);
    }

    const { data: jobs, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }

    return NextResponse.json(jobs || []);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}