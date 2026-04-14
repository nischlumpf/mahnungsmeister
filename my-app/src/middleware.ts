import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Zusätzliche Prüfungen können hier hinzugefügt werden
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ req, token }) {
        // API Routes und geschützte Seiten erfordern einen Token
        if (req.nextUrl.pathname.startsWith("/api/")) {
          // Auth API Routes sind öffentlich
          if (req.nextUrl.pathname.startsWith("/api/auth/")) {
            return true;
          }
          // Alle anderen API Routes erfordern Authentifizierung
          return token !== null;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/api/:path*",
    "/dashboard/:path*",
    "/kunden/:path*",
    "/rechnungen/:path*",
    "/mahnungen/:path*",
    "/einstellungen/:path*",
  ],
};
