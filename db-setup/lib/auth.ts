import { createClient } from "@/lib/supabase/browser-client";

interface AuthData {
  email: string;
  password: string;
  role?: 'candidate' | 'recruiter' | 'super_admin';
}

// Sign up user
export async function signup(data: AuthData) {
  // Use the API route instead of direct Supabase call to handle confirmation
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Signup failed');
  }

  return result;
}

// Sign in user
export async function signin(data: AuthData) {
  const supabase = createClient();
  const { data: result, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  // If error is about email not confirmed, try to confirm it automatically
  if (error && error.message.includes('Email not confirmed')) {
    try {
      // Call our confirm user API
      const confirmResponse = await fetch('/api/auth/confirm-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      });

      if (confirmResponse.ok) {
        // Try signing in again after confirmation
        const { data: retryResult, error: retryError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (retryError) {
          throw new Error(retryError.message);
        }

        return retryResult;
      }
    } catch (confirmError) {
      // If confirmation fails, still throw the original error
      throw new Error(error.message);
    }
  }

  if (error) {
    throw new Error(error.message);
  }

  return result;
}

// Sign out user
export async function signout() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw new Error(error.message);
  }
}