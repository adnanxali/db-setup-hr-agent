import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-client';
import { ApiResponse, User } from '@/types';

async function validateAdminAccess(session: any) {
  const supabase = await createClient();
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!user || user.role !== 'super_admin') {
    throw new Error('Admin access required');
  }
}

// GET /api/admin/users/[userId] - View user details
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      const response: ApiResponse = { error: 'Unauthorized' };
      return NextResponse.json(response, { status: 401 });
    }

    await validateAdminAccess(session);

    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        candidate_profiles(*),
        recruiter_profiles(*)
      `)
      .eq('id', params.userId)
      .single();

    if (error) {
      const response: ApiResponse = { error: 'User not found' };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<User> = {
      data: data as User
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching user:', error);
    
    const apiResponse: ApiResponse = {
      error: error instanceof Error ? error.message : 'Failed to fetch user'
    };
    
    return NextResponse.json(apiResponse, { status: 500 });
  }
}

// DELETE /api/admin/users/[userId] - Ban/Remove user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      const response: ApiResponse = { error: 'Unauthorized' };
      return NextResponse.json(response, { status: 401 });
    }

    await validateAdminAccess(session);

    // Prevent self-deletion
    if (params.userId === session.user.id) {
      const response: ApiResponse = { error: 'Cannot delete your own account' };
      return NextResponse.json(response, { status: 400 });
    }

    // Use admin client to delete user from auth
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ADMIN_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { error } = await adminSupabase.auth.admin.deleteUser(params.userId);

    if (error) {
      const response: ApiResponse = { error: error.message };
      return NextResponse.json(response, { status: 500 });
    }

    const response: ApiResponse = {
      message: 'User deleted successfully'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting user:', error);
    
    const apiResponse: ApiResponse = {
      error: error instanceof Error ? error.message : 'Failed to delete user'
    };
    
    return NextResponse.json(apiResponse, { status: 500 });
  }
}