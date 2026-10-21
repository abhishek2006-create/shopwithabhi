import { createHash, createHmac, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { db } from "@/lib/data";
import { publicOrigin } from "@/config/site";
import { contactSchema, newsletterSchema } from "@/lib/validation";
import { api } from "../../../../../convex/_generated/api";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ kind: string }> },
) {
  const client = db();
  const secret = process.env.FORM_GATEWAY_SECRET;
  if (!client || !secret)
    return Response.json(
      {
        error:
          "This form is not connected yet. Please try again after site setup.",
      },
      { status: 503 },
    );
  if (request.headers.get("origin") !== publicOrigin())
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  if (Number(request.headers.get("content-length") || 0) > 12000)
    return Response.json({ error: "Message too large." }, { status: 413 });
  try {
    const text = await request.text();
    if (text.length > 12000) throw new Error("Message too large.");
    const input = JSON.parse(text);
    const { kind } = await params;
    const h = await headers();
    const ip = process.env.VERCEL
      ? h.get("x-vercel-forwarded-for") || "unknown"
      : "local";
    const visitorHash = createHmac("sha256", secret)
      .update(`${ip}:${new Date().toISOString().slice(0, 10)}`)
      .digest("hex");
    if (kind === "contact") {
      const { website, ...data } = contactSchema.parse(input);
      void website;
      await client.mutation(api.forms.contact, {
        ...data,
        secret,
        visitorHash,
      });
      return Response.json({ ok: true });
    }
    if (kind === "newsletter") {
      const { email, consent } = newsletterSchema.parse(input);
      const token = randomBytes(32).toString("hex");
      const unsubscribeHash = createHash("sha256").update(token).digest("hex");
      const created = await client.mutation(api.forms.subscribe, {
        email,
        consent,
        secret,
        visitorHash,
        unsubscribeHash,
      });
      return Response.json({
        ok: true,
        unsubscribeUrl: created ? `/unsubscribe?token=${token}` : null,
      });
    }
    return Response.json({ error: "Unknown form." }, { status: 404 });
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("Too many")
        ? "Too many requests. Please try again later."
        : "Please check your details and try again.";
    return Response.json({ error: message }, { status: 400 });
  }
}
