import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Redirect logged-in users away from auth pages
  if (user && (request.nextUrl.pathname === "/signin" || request.nextUrl.pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Protect dashboard routes — returning members are the likelier visitor, and
  // /signin links to /signup for anyone new.
  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  // Protect the application flow — must be signed in
  if (!user && request.nextUrl.pathname.startsWith("/apply")) {
    return NextResponse.redirect(new URL("/signin?redirect=/apply", request.url));
  }

  // Protect admin — must have admin, outreach, or operations role in app_metadata
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const role = user?.app_metadata?.role;
    const allowed = role === "admin" || role === "outreach" || role === "operations";
    if (!allowed) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/admin", "/apply", "/signin", "/signup"],
};
