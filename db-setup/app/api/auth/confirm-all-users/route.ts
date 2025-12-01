import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Use admin client to confirm all users
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ADMIN_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get all users
    const { data: users, error: getUserError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (getUserError) {
      return NextResponse.json(
        { error: getUserError.message },
        { status: 400 }
      );
    }

    let confirmedCount = 0;
    const errors = [];

    // Confirm all unconfirmed users
    for (const user of users.users) {
      if (!user.email_confirmed_at) {
        try {
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            user.id,
            { email_confirm: true }
          );

          if (updateError) {
            errors.push(`Failed to confirm ${user.email}: ${updateError.message}`);
          } else {
            confirmedCount++;
          }
        } catch (error) {
          errors.push(`Failed to confirm ${user.email}: ${error}`);
        }
      }
    }

    return NextResponse.json(
      { 
        message: `Confirmed ${confirmedCount} users`,
        errors: errors.length > 0 ? errors : undefined
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}