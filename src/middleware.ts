import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if ((process.env.APP_MODE ?? "DEV").trim().toUpperCase() !== "DEV" || process.env.NODE_ENV === "production") {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  if (pathname === "/sign-in" || pathname.startsWith("/demo") || pathname.startsWith("/api/") || pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }

  const demoUrl = request.nextUrl.clone();
  demoUrl.pathname = "/demo";
  demoUrl.searchParams.set("path", pathname);
  return NextResponse.rewrite(demoUrl);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
