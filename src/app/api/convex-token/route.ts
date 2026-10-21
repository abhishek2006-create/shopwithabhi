import { convexToken } from "@/lib/token";
export async function GET() {
  try {
    const token = await convexToken();
    return Response.json(
      { token },
      { status: token ? 200 : 401, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Sign-in is not configured." },
      { status: 503 },
    );
  }
}
