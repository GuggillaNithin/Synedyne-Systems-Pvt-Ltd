import { clerkMiddleware } from "@clerk/nextjs/server";

// Minimal Clerk proxy — prototype mode (auth checks happen at page level)
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sign-in|sign-up).*)",
  ],
};
