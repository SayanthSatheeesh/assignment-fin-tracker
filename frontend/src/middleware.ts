import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * This middleware deliberately does NOT redirect based on authentication
 * because auth state lives in localStorage (client-side only).
 *
 * Server-side middleware cannot read localStorage, so any cookie-based
 * redirect here would cause 307 loops on Vercel where there is no cookie
 * set yet on the first SSR pass.
 *
 * Route protection is handled client-side inside the investments page
 * via the useAuth() hook and the AuthProvider.
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
