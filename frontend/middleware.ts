// middleware.ts (à la racine de votre projet Next.js)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Routes publiques accessibles sans connexion
  const publicRoutes = ['/login', '/inscription', '/forgot-password'];
  const isPublicRoute = publicRoutes.includes(pathname);
  const isApiRoute = pathname.startsWith('/api/');

  // Laisser passer les routes API
  if (isApiRoute) {
    return NextResponse.next();
  }

  // Bloquer l'accès aux routes protégées sans token
  if (!token && !isPublicRoute) {
    console.log('🚫 Middleware: Accès refusé - redirection vers login');
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Rediriger les utilisateurs connectés vers le dashboard
  if (token && isPublicRoute) {
    console.log('✅ Middleware: Utilisateur connecté - redirection vers dashboard');
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};