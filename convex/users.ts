import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { audit, currentUser } from "./security";
import { verifiedProfile } from "./identity";
export const connectionStatus = query({
  args: {},
  returns: v.object({ authenticated: v.boolean(), verifiedEmail: v.boolean() }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    return {
      authenticated: identity !== null,
      verifiedEmail: verifiedProfile(identity) !== null,
    };
  },
});
export const sync = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const profile = verifiedProfile(identity);
    if (!identity || !profile)
      throw new Error("Verified Google identity required.");
    // Only signed, verified identity claims can match this server-owned allowlist.
    const admins = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);
    const old = await ctx.db
      .query("users")
      .withIndex("by_subject", (q) => q.eq("subject", identity.tokenIdentifier))
      .unique();
    if (old) {
      // Adding an administrator must also work after they already signed up.
      // Preserve edited profiles, existing admin grants, and deletion requests.
      if (
        admins.includes(profile.email) &&
        old.role !== "ADMIN" &&
        !old.deletionRequestedAt &&
        old.email.toLowerCase() === profile.email
      ) {
        await ctx.db.patch(old._id, { role: "ADMIN", updatedAt: Date.now() });
        await audit(ctx, old._id, "role.ADMIN.allowlist", old._id);
      }
      return old._id;
    }
    return ctx.db.insert("users", {
      subject: identity.tokenIdentifier,
      name: profile.name,
      email: profile.email,
      avatar: profile.avatar,
      role: admins.includes(profile.email) ? "ADMIN" : "USER",
      newsletter: false,
      updatedAt: Date.now(),
    });
  },
});
export const me = query({
  args: {},
  handler: async (ctx) => {
    try {
      return await currentUser(ctx);
    } catch {
      return null;
    }
  },
});
export const saved = query({
  args: {},
  handler: async (ctx) => {
    const user = await currentUser(ctx);
    const rows = await ctx.db
      .query("savedItems")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(200);
    const items = await Promise.all(rows.map((x) => ctx.db.get(x.contentId)));
    return items.filter((x) => x?.status === "published");
  },
});
export const toggleSaved = mutation({
  args: { contentId: v.id("content") },
  handler: async (ctx, { contentId }) => {
    const user = await currentUser(ctx);
    const item = await ctx.db.get(contentId);
    if (!item || item.status !== "published")
      throw new Error("Item unavailable.");
    const old = await ctx.db
      .query("savedItems")
      .withIndex("by_user_content", (q) =>
        q.eq("userId", user._id).eq("contentId", contentId),
      )
      .unique();
    if (old) {
      await ctx.db.delete(old._id);
      return false;
    }
    const count = await ctx.db
      .query("savedItems")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(200);
    if (count.length >= 200)
      throw new Error("Your reading list is full (200 items).");
    await ctx.db.insert("savedItems", { userId: user._id, contentId });
    return true;
  },
});
export const preferences = mutation({
  args: { name: v.string(), newsletter: v.boolean() },
  handler: async (ctx, args) => {
    const user = await currentUser(ctx);
    if (args.name.trim().length < 2 || args.name.length > 100)
      throw new Error("Name must be 2–100 characters.");
    await ctx.db.patch(user._id, {
      name: args.name.trim(),
      newsletter: args.newsletter,
      updatedAt: Date.now(),
    });
    const subscription = await ctx.db
      .query("newsletterSubscribers")
      .withIndex("by_email", (q) => q.eq("email", user.email.toLowerCase()))
      .unique();
    if (!args.newsletter && subscription)
      await ctx.db.patch(subscription._id, {
        consent: false,
        unsubscribedAt: Date.now(),
        updatedAt: Date.now(),
      });
  },
});
export const requestDeletion = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await currentUser(ctx);
    if (user.role === "ADMIN")
      throw new Error(
        "Transfer administrator responsibilities before requesting deletion.",
      );
    await ctx.db.patch(user._id, {
      deletionRequestedAt: Date.now(),
      newsletter: false,
      updatedAt: Date.now(),
    });
    const sub = await ctx.db
      .query("newsletterSubscribers")
      .withIndex("by_email", (q) => q.eq("email", user.email.toLowerCase()))
      .unique();
    if (sub)
      await ctx.db.patch(sub._id, {
        consent: false,
        unsubscribedAt: Date.now(),
        updatedAt: Date.now(),
      });
  },
});
