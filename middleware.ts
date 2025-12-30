import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/types";

/**
 * =====================================================
 * Next.js Middleware - Authentication & Route Protection
 * =====================================================
 * This middleware handles:
 * - Session validation and refresh
 * - Route protection (authenticated vs. unauthenticated routes)
 * - Automatic redirects based on auth state
 * - Organization context injection
 * =====================================================
 */

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client with proper cookie handling
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Define route patterns
  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isTestRoute = pathname.startsWith("/test-");
  const isPublicRoute =
    pathname === "/" || pathname.startsWith("/api") || isTestRoute;
  const isApiRoute = pathname.startsWith("/api");
  // Dashboard routes: /dashboard, /onboarding, or /{orgSlug}/... BUT NOT auth routes
  const isDashboardRoute =
    (pathname === "/dashboard" ||
      pathname === "/onboarding" ||
      /^\/[^\/]+(?:\/|$)/.test(pathname)) &&
    !isAuthRoute &&
    !isPublicRoute;

  // Allow API routes to proceed without redirect logic
  if (isApiRoute) {
    return response;
  }

  // If user is authenticated and trying to access auth routes, redirect to dashboard
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If user is not authenticated and trying to access protected routes, redirect to login
  if (!user && isDashboardRoute) {
    const redirectUrl = new URL("/login", request.url);
    // Preserve the original URL as a redirect parameter
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (e.g., /images/*, /fonts/*)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
