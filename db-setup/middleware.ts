import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createClient } from '@supabase/supabase-js';

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/sign-in',
  '/sign-up',
  '/jobs',
  '/about',
  '/contact'
];

// Routes that require authentication but no specific role
const PROTECTED_ROUTES = [
  '/profile',
  '/jobs/create'
];

// Role-specific route patterns
const ROLE_ROUTES = {
  candidate: ['/dashboard/candidate'],
  recruiter: ['/dashboard/recruiter'],
  admin: ['/dashboard/admin', '/admin']
};

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
}

function getRequiredRole(pathname: string): string | null {
  for (const [role, routes] of Object.entries(ROLE_ROUTES)) {
    if (routes.some(route => pathname.startsWith(route))) {
      return role;
    }
  }
  return null;
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => 
    pathname.startsWith(route)
  ) || getRequiredRole(pathname) !== null;
}

async function getUserRole(userId: string): Promise<string | null> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !data) return null;
    return data.role;
  } catch (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { user, response } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  // Allow public routes
  if (isPublicRoute(pathname)) {
    // Redirect authenticated users away from auth pages
    if (user && (pathname === '/sign-in' || pathname === '/sign-up')) {
      const userRole = await getUserRole(user.id);
      
      // Redirect to appropriate dashboard
      const dashboardUrl = userRole === 'candidate' 
        ? '/dashboard/candidate'
        : userRole === 'recruiter'
        ? '/dashboard/recruiter'
        : userRole === 'admin'
        ? '/dashboard/admin'
        : '/';

      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }
    return response;
  }

  // Require authentication for protected routes
  if (!user && isProtectedRoute(pathname)) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Handle authenticated users
  if (user) {
    const userRole = await getUserRole(user.id);

    // Check role-based access
    const requiredRole = getRequiredRole(pathname);
    if (requiredRole && userRole !== requiredRole) {
      // Redirect to appropriate dashboard based on user's actual role
      let redirectUrl = '/';
      
      if (userRole === 'candidate') {
        redirectUrl = '/dashboard/candidate';
      } else if (userRole === 'recruiter') {
        redirectUrl = '/dashboard/recruiter';
      } else if (userRole === 'admin') {
        redirectUrl = '/dashboard/admin';
      }

      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    // Restrict job creation to recruiters only
    if (pathname === '/jobs/create' && userRole !== 'recruiter') {
      return NextResponse.redirect(new URL('/jobs', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};