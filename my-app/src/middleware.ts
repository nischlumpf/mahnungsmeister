import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(_req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ req, token }) {
        if (req.nextUrl.pathname.startsWith("/api/")) {
          if (req.nextUrl.pathname.startsWith("/api/auth/")) {
            return true;
          }
          return token !== null;
        }
        return token !== null;
      },
    },
  }
);

export const config = {
  matcher: [
    "/api/:path*",
    "/dashboard/:path*",
    "/customers/:path*",
    "/invoices/:path*",
    "/reminders/:path*",
    "/kunden/:path*",
    "/rechnungen/:path*",
    "/mahnungen/:path*",
    "/einstellungen/:path*",
  ],
};
