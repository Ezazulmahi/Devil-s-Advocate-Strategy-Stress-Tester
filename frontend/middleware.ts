import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/api-config";

const PUBLIC_PATHS = ["/", "/register"];

// Deployments with no backend to talk to (e.g. a standalone marketing/demo
// preview) can set NEXT_PUBLIC_DEMO_MODE=true in their own env to render
// dashboard/projects/etc. on mock data with no login required. Local dev and
// any deployment wired to a real backend should leave this unset (real auth).
const DEMO_MODE_PUBLIC = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = DEMO_MODE_PUBLIC || PUBLIC_PATHS.includes(pathname);
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!isPublic && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === "/" && token) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
