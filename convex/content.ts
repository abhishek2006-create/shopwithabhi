import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { kind } from "./schema";
import { affiliateAllowed, gateway, rateLimit } from "./security";
export const list = query({
  args: {
    kind: v.optional(kind),
    categoryId: v.optional(v.id("categories")),
    search: v.optional(v.string()),
    sort: v.optional(v.union(v.literal("newest"), v.literal("oldest"))),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    if (args.paginationOpts.numItems > 50 || args.paginationOpts.numItems < 1)
      throw new Error("Page size must be between 1 and 50.");
    if (args.search?.trim())
      return ctx.db
        .query("content")
        .withSearchIndex("search_content", (q) => {
          let s = q
            .search("title", args.search!.trim().slice(0, 100))
            .eq("status", "published");
          if (args.kind) s = s.eq("kind", args.kind);
          if (args.categoryId) s = s.eq("categoryId", args.categoryId);
          return s;
        })
        .paginate(args.paginationOpts);
    if (args.categoryId)
      return ctx.db
        .query("content")
        .withIndex("by_category_status", (q) =>
          args.kind
            ? q
                .eq("categoryId", args.categoryId)
                .eq("status", "published")
                .eq("kind", args.kind)
            : q.eq("categoryId", args.categoryId).eq("status", "published"),
        )
        .order(args.sort === "oldest" ? "asc" : "desc")
        .paginate(args.paginationOpts);
    return ctx.db
      .query("content")
      .withIndex("by_status_kind", (q) =>
        args.kind
          ? q.eq("status", "published").eq("kind", args.kind)
          : q.eq("status", "published"),
      )
      .order(args.sort === "oldest" ? "asc" : "desc")
      .paginate(args.paginationOpts);
  },
});
export const bySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const item = await ctx.db
      .query("content")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!item || item.status !== "published") return null;
    const related = await Promise.all(
      item.relatedIds.slice(0, 12).map((id) => ctx.db.get(id)),
    );
    return {
      ...item,
      related: related.filter((x) => x?.status === "published"),
    };
  },
});
export const categories = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, { search }) =>
    search
      ? ctx.db
          .query("categories")
          .withSearchIndex("search_categories", (q) =>
            q.search("title", search.slice(0, 100)).eq("active", true),
          )
          .take(30)
      : ctx.db
          .query("categories")
          .withIndex("by_active", (q) => q.eq("active", true))
          .take(100),
});
export const settings = query({
  args: {},
  handler: async (ctx) => ctx.db.query("siteSettings").take(100),
});
export const sitemap = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) =>
    ctx.db
      .query("content")
      .withIndex("by_status_kind", (q) => q.eq("status", "published"))
      .paginate(args.paginationOpts),
});
export const click = mutation({
  args: { slug: v.string(), secret: v.string(), visitorHash: v.string() },
  handler: async (ctx, args) => {
    gateway(args.secret);
    const item = await ctx.db
      .query("content")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (
      !item ||
      item.kind !== "product" ||
      item.status !== "published" ||
      !item.affiliateUrl ||
      !affiliateAllowed(item.affiliateUrl)
    )
      throw new Error("Link unavailable.");
    if (process.env.AFFILIATE_CLICK_TRACKING === "true") {
      await rateLimit(ctx, `click:${args.visitorHash}`, 60);
      await ctx.db.insert("affiliateClicks", {
        contentId: item._id,
        marketplace: item.marketplace,
        timestamp: Date.now(),
      });
    }
    return item.affiliateUrl;
  },
});
