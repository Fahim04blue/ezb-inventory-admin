import { NextResponse, type NextRequest } from "next/server";

import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { verifyAuthToken } from "@/lib/auth/jwt";

const PUBLIC_ROUTES = new Set([
  "/login",
  "/api/auth/register",
  "/api/auth/login",
]);

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/inventory",
  "/purchasing",
  "/sales",
  "/finance",
  "/settings",
];

function isProtectedRoute(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => {
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_ROUTES.has(pathname)) {
    if (pathname === "/login") {
      const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
      const payload = token ? await verifyAuthToken(token) : null;

      if (payload) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    return NextResponse.next();
  }

  if (!isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const payload = token ? await verifyAuthToken(token) : null;

  if (!payload) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/inventory/:path*",
    "/purchasing/:path*",
    "/sales/:path*",
    "/finance/:path*",
    "/settings/:path*",
  ],
};
