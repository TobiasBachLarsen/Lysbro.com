import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Kører før hver side i matcher-listen: fornyer Supabase-sessionen, sender uloggede
// brugere til /login (med den ønskede side i ?next=) og loggede brugere væk fra
// login/register.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          // Fornyede cookies skal både videre til browseren (response) og til det, der
          // renderes i samme request (request), ellers ser en server-komponent stadig
          // den gamle, udløbne token. Det er mønsteret fra Supabases egen dokumentation.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  // "Ingen session" kommer som user = null uden fejl eller som en 4xx-auth-fejl. Alt
  // andet (netværk, 5xx, 429) er Supabase, der er nede - ikke en udlogget bruger. Så
  // lader vi siden passere i stedet for at sende en logget bruger til /login.
  if (error && !user && !isAuthError(error.status)) {
    return response;
  }

  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

  // Uloggede brugere sendes til /login og tilbage igen bagefter
  if (!user && !isAuthPage) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
    return redirectWithCookies(loginUrl, response);
  }

  // Loggede brugere sendes væk fra login/register
  if (user && isAuthPage) {
    return redirectWithCookies(new URL("/dashboard", request.url), response);
  }

  return response;
}

// Supabase svarer 401/403 for en manglende eller ugyldig session; alt andet er ikke
// et svar på spørgsmålet "er brugeren logget ind".
function isAuthError(status: number | undefined) {
  return status === 400 || status === 401 || status === 403;
}

// En redirect er et nyt svar-objekt, så cookies fornyet af getUser() skal kopieres med,
// ellers går den nye refresh-token tabt, og brugeren bliver logget ud på næste side.
function redirectWithCookies(url: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/meetings/:path*",
    "/messages/:path*",
    "/calendar/:path*",
    "/contacts/:path*",
    "/history/:path*",
    "/subscription/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
