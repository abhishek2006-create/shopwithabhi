import { createHmac } from "node:crypto";
import { getContent, db } from "@/lib/data";
import { validAffiliateUrl } from "@/lib/validation";
import { api } from "../../../../convex/_generated/api";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const item = await getContent(slug);
  if (
    !item ||
    item.kind !== "product" ||
    !item.affiliateUrl ||
    !validAffiliateUrl(item.affiliateUrl)
  )
    return new Response("This retailer link is unavailable.", { status: 404 });
  if (
    process.env.AFFILIATE_CLICK_TRACKING === "true" &&
    process.env.FORM_GATEWAY_SECRET
  ) {
    const secret = process.env.FORM_GATEWAY_SECRET;
    const ip = process.env.VERCEL
      ? request.headers.get("x-vercel-forwarded-for") || "unknown"
      : "local";
    const visitorHash = createHmac("sha256", secret)
      .update(`${ip}:${new Date().toISOString().slice(0, 10)}`)
      .digest("hex");
    try {
      await db()!.mutation(api.content.click, { slug, secret, visitorHash });
    } catch {
      /* Tracking failure must not change the validated destination. */
    }
  }
  return new Response(null, {
    status: 302,
    headers: {
      Location: item.affiliateUrl,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
