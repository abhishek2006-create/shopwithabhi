import { internalMutation } from "./_generated/server";
export const cleanup = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const item of await ctx.db
      .query("rateLimits")
      .withIndex("by_expiry", (q) => q.lt("expiresAt", Date.now()))
      .take(500))
      await ctx.db.delete(item._id);
    for (const item of await ctx.db
      .query("affiliateClicks")
      .withIndex("by_timestamp", (q) =>
        q.lt("timestamp", Date.now() - 90 * 86400000),
      )
      .take(500))
      await ctx.db.delete(item._id);
  },
});
