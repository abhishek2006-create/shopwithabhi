import { cleanHtml } from "@/lib/sanitize";
import { requireSession } from "@/lib/guard";
export async function POST(req: Request) {
  await requireSession(true);
  const { html } = await req.json();
  if (typeof html !== "string" || html.length > 150000)
    return Response.json({ error: "Invalid content." }, { status: 400 });
  return Response.json({ html: cleanHtml(html) });
}
