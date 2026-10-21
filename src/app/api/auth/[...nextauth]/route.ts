import NextAuth from "next-auth";
import { authOptions, authConfigured } from "@/lib/auth";
const handler = NextAuth(authOptions);
export async function GET(
  request: Request,
  context: { params: Promise<{ nextauth: string[] }> },
) {
  if (!authConfigured) {
    const { nextauth } = await context.params;
    if (nextauth[0] === "session")
      return Response.json(null, { headers: { "Cache-Control": "no-store" } });
    return Response.json(
      { error: "Google authentication is not configured." },
      { status: 503 },
    );
  }
  return handler(request, context);
}
export async function POST(
  request: Request,
  context: { params: Promise<{ nextauth: string[] }> },
) {
  if (!authConfigured)
    return Response.json(
      { error: "Google authentication is not configured." },
      { status: 503 },
    );
  return handler(request, context);
}
