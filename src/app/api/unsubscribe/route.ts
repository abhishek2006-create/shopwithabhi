import { createHash } from "node:crypto";
import { db } from "@/lib/data";
import { api } from "../../../../convex/_generated/api";
export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token))
      return Response.json({ error: "Invalid link." }, { status: 400 });
    const client = db();
    if (!client)
      return Response.json(
        { error: "Newsletter service is not configured." },
        { status: 503 },
      );
    await client.mutation(api.forms.unsubscribe, {
      hash: createHash("sha256").update(token).digest("hex"),
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "Unable to unsubscribe. Please retry." },
      { status: 400 },
    );
  }
}
