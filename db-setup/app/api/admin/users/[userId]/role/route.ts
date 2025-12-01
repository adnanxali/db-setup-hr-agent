import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-client';
import { userRoleUpdateSchema } from '@/lib/validations';
import { ApiResponse, User } from '@/types';

// PUT /api/admin/users/[userId]/role - Force update user role
export async function PUT(
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

    // Validate admin role
    const { data: adminUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!adminUser || adminUser.role !== 'super_admin') {
      const response: ApiResponse = { error: 'Admin access required' };
      return NextResponse.json(response, { status: 403 });
    }

    const body = await request.json();
    const { role } = userRoleUpdateSchema.parse(body);

    // Prevent changing own role
    if (params.userId === session.user.id) {
      const response: ApiResponse = { error: 'Cannot change your own role' };
      return NextResponse.json(response, { status: 400 });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', params.userId)
      .select()
      .single();

    if (error) {
      const response: ApiResponse = { error: error.message };
      return NextResponse.json(response, { status: 500 });
    }

    const response: ApiResponse<User> = {
      data: data as User,
      message: 'User role updated successfully'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating user role:', error);
    
    const apiResponse: ApiResponse = {
      error: error instanceof Error ? error.message : 'Failed to update user role'
    };
    
    return NextResponse.json(apiResponse, { status: 500 });
  }
}