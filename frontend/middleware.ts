import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/api-config";

const PUBLIC_PATHS = ["/", "/register"];

// Deployments with no backend to talk to (e.g. a standalone marketing/demo
// preview) can set NEXT_PUBLIC_DEMO_MODE=true in their own env to render
// dashboard/projects/etc. on mock data with no login required. Local dev and
// any deployment wired to a real backend should leave this unset (real auth).
const DEMO_MODE_PUBLIC = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const secret = process.env.JWT_SECRET ? new TextEncoder().encode(process.env.JWT_SECRET) : null;

async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token || !secret) return false;
  try {
    await jwtVerify(token, secret, { algorithms: ["HS256"] });
    return true;
  } catch {
    // Wrong signature, expired, or malformed — all equally "not signed in".
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = DEMO_MODE_PUBLIC || PUBLIC_PATHS.includes(pathname);
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const valid = DEMO_MODE_PUBLIC || (await isValidSession(token));

  if (!isPublic && !valid) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("from", pathname);
    const response = NextResponse.redirect(url);
    response.cookies.delete(AUTH_COOKIE_NAME);
    return response;
  }

  if (pathname === "/" && valid) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (token && !valid) {
    // A stale/invalid cookie surviving on a public page (e.g. "/" itself) —
    // clear it so its mere presence stops being mistaken for a session.
    const response = NextResponse.next();
    response.cookies.delete(AUTH_COOKIE_NAME);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
