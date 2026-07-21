import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/register'];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('access_token')?.value
    ?? request.headers.get('x-auth-token');

  // Using a simple check — for localStorage-based auth, the real guard
  // is the client-side useAuth() hook. Middleware catches cookie-based tokens.
  const isPublic = PUBLIC_ROUTES.includes(pathname);

  if (!token && !isPublic && pathname.startsWith('/investments')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
