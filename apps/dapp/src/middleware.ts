import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const JWT_COOKIE = 'tb_jwt';

// Protege el área privada: sin cookie de sesión → redirige a /login.
// La validación real del JWT la hace la API (401); acá solo gateamos presencia.
export function middleware(request: NextRequest) {
  const token = request.cookies.get(JWT_COOKIE)?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
