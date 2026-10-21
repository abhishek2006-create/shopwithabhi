import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { gateway, rateLimit } from "./security";
const validEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
export const contact = mutation({
  args: {
    secret: v.string(),
    visitorHash: v.string(),
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    message: v.string(),
  },
  handler: async (ctx, a) => {
    gateway(a.secret);
    if (
      !validEmail(a.email) ||
      a.name.trim().length < 2 ||
      a.name.length > 100 ||
      a.subject.trim().length < 3 ||
      a.subject.length > 150 ||
      a.message.trim().length < 20 ||
      a.message.length > 5000
    )
      throw new Error("Please check your form.");
    await rateLimit(ctx, `contact:${a.visitorHash}`);
    await ctx.db.insert("contactMessages", {
      name: a.name.trim(),
      email: a.email.toLowerCase(),
      subject: a.subject.trim(),
      message: a.message.trim(),
      status: "new",
      updatedAt: Date.now(),
    });
    return true;
  },
});
export const subscribe = mutation({
  args: {
    secret: v.string(),
    visitorHash: v.string(),
    email: v.string(),
    consent: v.boolean(),
    unsubscribeHash: v.string(),
  },
  handler: async (ctx, a) => {
    gateway(a.secret);
    if (!validEmail(a.email) || !a.consent)
      throw new Error("Email and consent are required.");
    await rateLimit(ctx, `newsletter:${a.visitorHash}`);
    const email = a.email.toLowerCase();
    const old = await ctx.db
      .query("newsletterSubscribers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    // Do not rotate a live subscriber's secret, or reveal whether an address exists.
    if (old?.consent) return false;
    const data = {
      email,
      consent: true,
      consentAt: Date.now(),
      source: "website",
      unsubscribeHash: a.unsubscribeHash,
      unsubscribedAt: undefined,
      updatedAt: Date.now(),
    };
    if (old) await ctx.db.patch(old._id, data);
    else await ctx.db.insert("newsletterSubscribers", data);
    return true;
  },
});
export const unsubscribe = mutation({
  args: { hash: v.string() },
  handler: async (ctx, { hash }) => {
    if (!/^[a-f0-9]{64}$/.test(hash))
      throw new Error("Invalid unsubscribe link.");
    const row = await ctx.db
      .query("newsletterSubscribers")
      .withIndex("by_token", (q) => q.eq("unsubscribeHash", hash))
      .unique();
    if (row)
      await ctx.db.patch(row._id, {
        consent: false,
        unsubscribedAt: Date.now(),
        updatedAt: Date.now(),
      });
    return true;
  },
});
