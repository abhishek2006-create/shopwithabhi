import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { affiliate } from "../src/config/affiliate";
import { verifiedProfile } from "./identity";
export async function currentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Sign in to continue.");
  if (!verifiedProfile(identity))
    throw new Error("Verified Google identity required.");
  const user = await ctx.db
    .query("users")
    .withIndex("by_subject", (q) => q.eq("subject", identity.tokenIdentifier))
    .unique();
  if (!user || user.deletionRequestedAt)
    throw new Error("Account unavailable.");
  return user;
}
export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const user = await currentUser(ctx);
  if (user.role !== "ADMIN") throw new Error("Administrator access required.");
  return user;
}
export async function audit(
  ctx: MutationCtx,
  actorId: Id<"users">,
  action: string,
  target: string,
) {
  await ctx.db.insert("auditLogs", {
    actorId,
    action,
    target,
    timestamp: Date.now(),
  });
}
export function affiliateAllowed(value: string) {
  try {
    const u = new URL(value);
    return (
      u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      !u.port &&
      (affiliate.allowedDomains as readonly string[]).includes(u.hostname) &&
      !/YOUR_|PLACEHOLDER/i.test(value)
    );
  } catch {
    return false;
  }
}
export function imageAllowed(value: string) {
  if (/^\/(?!\/)[a-zA-Z0-9/_\-.]+$/.test(value)) return true;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      (url.hostname === "images.unsplash.com" ||
        url.hostname.endsWith(".convex.cloud") ||
        url.hostname.endsWith(".convex.site"))
    );
  } catch {
    return false;
  }
}
export function gateway(secret: string) {
  if (
    !process.env.FORM_GATEWAY_SECRET ||
    secret !== process.env.FORM_GATEWAY_SECRET
  )
    throw new Error("Invalid form gateway.");
}
export async function rateLimit(ctx: MutationCtx, key: string, max = 5) {
  const now = Date.now();
  const row = await ctx.db
    .query("rateLimits")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();
  if (!row) {
    await ctx.db.insert("rateLimits", {
      key,
      count: 1,
      expiresAt: now + 3600000,
    });
    return;
  }
  if (row.expiresAt < now) {
    await ctx.db.patch(row._id, { count: 1, expiresAt: now + 3600000 });
    return;
  }
  if (row.count >= max)
    throw new Error("Too many requests. Try again in an hour.");
  await ctx.db.patch(row._id, { count: row.count + 1 });
}
