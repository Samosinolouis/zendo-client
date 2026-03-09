import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Enforce onboarding completion.
 *
 * Any authenticated user whose session `appUser` is null (meaning they have
 * not yet completed the onboarding flow) is redirected to /onboarding.
 * This prevents pressing "back" from onboarding from landing on stale OAuth
 * routes like /api/auth/signin?error=OAuthCallback.
 *
 * Public routes (sign-in, onboarding itself, API, static assets) are excluded.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Let the onboarding page, auth API, and static assets through unconditionally.
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Not authenticated — nothing to enforce, let the page handle it.
  if (!token) {
    return NextResponse.next();
  }

  // Authenticated but onboarding not done (appUser is null).
  const appUser = (token as any).appUser;
  if (!appUser) {
    const onboardingUrl = new URL(`/onboarding`, req.url);
    // Preserve the originally requested page so onboarding can redirect back.
    if (pathname !== "/") {
      onboardingUrl.searchParams.set("r", pathname);
    }
    return NextResponse.redirect(onboardingUrl);
  } else if (appUser && pathname.startsWith("/onboarding")) {
    console.log(
      "Middleware - Authenticated user trying to access onboarding, redirecting to home.",
    );

    // Authenticated and onboarding done but trying to access onboarding page — redirect to home.
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on all app routes except Next.js internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
