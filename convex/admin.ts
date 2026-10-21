import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { contentFields } from "./schema";
import {
  requireAdmin,
  audit,
  affiliateAllowed,
  imageAllowed,
} from "./security";
const section = v.union(
  v.literal("content"),
  v.literal("categories"),
  v.literal("users"),
  v.literal("contactMessages"),
  v.literal("newsletterSubscribers"),
  v.literal("auditLogs"),
);
export const administrators = query({
  args: {},
  returns: v.object({
    total: v.number(),
    active: v.array(
      v.object({ name: v.string(), email: v.string(), isYou: v.boolean() }),
    ),
    pendingEmails: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const actor = await requireAdmin(ctx);
    const rows = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "ADMIN"))
      .collect();
    const byEmail = new Map<
      string,
      { name: string; email: string; isYou: boolean }
    >();
    for (const user of rows) {
      if (user.deletionRequestedAt) continue;
      const email = user.email.trim().toLowerCase();
      byEmail.set(email, {
        name: user.name,
        email,
        isYou: user._id === actor._id || byEmail.get(email)?.isYou === true,
      });
    }
    const configured = [
      ...new Set(
        (process.env.ADMIN_EMAILS || "")
          .split(",")
          .map((email) => email.trim().toLowerCase())
          .filter(Boolean),
      ),
    ];
    const pendingEmails: string[] = [];
    for (const email of configured) {
      if (byEmail.has(email)) continue;
      const accounts = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .collect();
      if (accounts.length && accounts.every((user) => user.deletionRequestedAt))
        continue;
      pendingEmails.push(email);
    }
    const active = [...byEmail.values()].sort((a, b) =>
      a.email.localeCompare(b.email),
    );
    pendingEmails.sort();
    return {
      total: active.length + pendingEmails.length,
      active,
      pendingEmails,
    };
  },
});
export const list = query({
  args: { section, paginationOpts: paginationOptsValidator },
  handler: async (ctx, a) => {
    await requireAdmin(ctx);
    return ctx.db.query(a.section).order("desc").paginate(a.paginationOpts);
  },
});
export const overview = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const tables = [
      "users",
      "content",
      "categories",
      "contactMessages",
      "newsletterSubscribers",
      "affiliateClicks",
    ] as const;
    const results = await Promise.all(
      tables.map(async (table) => {
        const rows = await ctx.db.query(table).take(1001);
        return {
          table,
          count: Math.min(rows.length, 1000),
          capped: rows.length > 1000,
        };
      }),
    );
    return results;
  },
});
export const contentMetrics = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const metrics = [];
    for (const kind of ["product", "article", "guide"] as const)
      for (const status of ["draft", "published"] as const) {
        const rows = await ctx.db
          .query("content")
          .withIndex("by_status_kind", (q) =>
            q.eq("status", status).eq("kind", kind),
          )
          .take(1001);
        metrics.push({
          label: `${status} ${kind}s`,
          count: Math.min(rows.length, 1000),
          capped: rows.length > 1000,
        });
      }
    return metrics;
  },
});
export const getContent = query({
  args: { id: v.id("content") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    return ctx.db.get(id);
  },
});
export const saveContent = mutation({
  args: { id: v.optional(v.id("content")), data: v.object(contentFields) },
  handler: async (ctx, { id, data }) => {
    const actor = await requireAdmin(ctx);
    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug) ||
      data.slug.length > 120 ||
      data.title.trim().length < 3 ||
      data.title.length > 200 ||
      data.body.length > 150000 ||
      data.excerpt.length > 1000
    )
      throw new Error("Check title, slug and content length.");
    if (
      data.relatedIds.length > 12 ||
      data.tags.length > 20 ||
      data.specifications.length > 50
    )
      throw new Error("Too many related items, tags, or specifications.");
    if (data.affiliateUrl && !affiliateAllowed(data.affiliateUrl))
      throw new Error(
        "Use a full HTTPS URL on an approved Amazon marketplace.",
      );
    if (data.image && !imageAllowed(data.image))
      throw new Error("Use a local image or a permitted HTTPS image host.");
    const duplicate = await ctx.db
      .query("content")
      .withIndex("by_slug", (q) => q.eq("slug", data.slug))
      .unique();
    if (duplicate && duplicate._id !== id)
      throw new Error("This slug is already used.");
    if (data.categoryId && !(await ctx.db.get(data.categoryId)))
      throw new Error("Category does not exist.");
    for (const relatedId of data.relatedIds)
      if (!(await ctx.db.get(relatedId)))
        throw new Error("Related item does not exist.");
    if (
      data.status === "published" &&
      (!data.excerpt.trim() ||
        !data.body.trim() ||
        !data.author.trim() ||
        (data.kind === "product" && !data.source.trim()))
    )
      throw new Error(
        "Published content needs an excerpt, body, author, and product data source.",
      );
    const old = id ? await ctx.db.get(id) : null;
    if (id && !old) throw new Error("Item not found.");
    const record = {
      ...data,
      updatedAt: Date.now(),
      publishedAt:
        data.status === "published"
          ? old?.publishedAt || Date.now()
          : old?.publishedAt,
    };
    const target = id || (await ctx.db.insert("content", record));
    if (id) await ctx.db.patch(id, record);
    await audit(
      ctx,
      actor._id,
      id ? "content.update" : "content.create",
      target,
    );
    return target;
  },
});
export const deleteContent = mutation({
  args: { id: v.id("content") },
  handler: async (ctx, { id }) => {
    const actor = await requireAdmin(ctx);
    // Archive preserves comparison relations and saved-item references.
    await ctx.db.patch(id, { status: "archived", updatedAt: Date.now() });
    await audit(ctx, actor._id, "content.archive", id);
  },
});
export const saveCategory = mutation({
  args: {
    id: v.optional(v.id("categories")),
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    image: v.string(),
    seoDescription: v.string(),
    order: v.number(),
    active: v.boolean(),
  },
  handler: async (ctx, { id, ...data }) => {
    const actor = await requireAdmin(ctx);
    if (
      data.title.length < 2 ||
      data.title.length > 100 ||
      data.description.length > 1000 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)
    )
      throw new Error("Invalid category.");
    if (data.image && !imageAllowed(data.image))
      throw new Error("Use a local image or a permitted HTTPS image host.");
    const old = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", data.slug))
      .unique();
    if (old && old._id !== id) throw new Error("Duplicate category slug.");
    const target = id || (await ctx.db.insert("categories", data));
    if (id) await ctx.db.patch(id, data);
    await audit(ctx, actor._id, "category.save", target);
    return target;
  },
});
export const deleteCategory = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, { id }) => {
    const actor = await requireAdmin(ctx);
    const related = await ctx.db
      .query("content")
      .withIndex("by_category_status", (q) => q.eq("categoryId", id))
      .first();
    if (related)
      throw new Error("Reassign all content before deleting this category.");
    await ctx.db.delete(id);
    await audit(ctx, actor._id, "category.delete", id);
  },
});
export const setRole = mutation({
  args: {
    id: v.id("users"),
    role: v.union(v.literal("USER"), v.literal("ADMIN")),
  },
  handler: async (ctx, { id, role }) => {
    const actor = await requireAdmin(ctx);
    if (id === actor._id) throw new Error("You cannot change your own role.");
    await ctx.db.patch(id, { role, updatedAt: Date.now() });
    await audit(ctx, actor._id, `role.${role}`, id);
  },
});
export const messageStatus = mutation({
  args: {
    id: v.id("contactMessages"),
    status: v.union(
      v.literal("new"),
      v.literal("read"),
      v.literal("archived"),
      v.literal("delete"),
    ),
  },
  handler: async (ctx, { id, status }) => {
    const actor = await requireAdmin(ctx);
    if (status === "delete") await ctx.db.delete(id);
    else await ctx.db.patch(id, { status, updatedAt: Date.now() });
    await audit(ctx, actor._id, `message.${status}`, id);
  },
});
export const removeSubscriber = mutation({
  args: { id: v.id("newsletterSubscribers"), remove: v.boolean() },
  handler: async (ctx, { id, remove }) => {
    const actor = await requireAdmin(ctx);
    if (remove) await ctx.db.delete(id);
    else
      await ctx.db.patch(id, {
        consent: false,
        unsubscribedAt: Date.now(),
        updatedAt: Date.now(),
      });
    await audit(
      ctx,
      actor._id,
      remove ? "newsletter.delete" : "newsletter.unsubscribe",
      id,
    );
  },
});
export const saveSetting = mutation({
  args: { key: v.string(), value: v.string() },
  handler: async (ctx, { key, value }) => {
    const actor = await requireAdmin(ctx);
    if (
      !/^(heroTitle|heroDescription|siteName|contactEmail|logo|favicon|socialLinks|featuredSections|affiliateDisclosure|marketplace|seoTitle|seoDescription|newsletterEnabled|legal:[a-z-]+)$/.test(
        key,
      ) ||
      value.length > 30000
    )
      throw new Error("Invalid public setting.");
    if (
      value &&
      ["logo", "favicon"].includes(key) &&
      !/^\/(?!\/)[a-zA-Z0-9/_\-.]+$/.test(value)
    )
      throw new Error("Use a local asset path starting with a single slash.");
    if (
      value &&
      key === "newsletterEnabled" &&
      !["true", "false"].includes(value)
    )
      throw new Error("Use true or false.");
    if (value && key === "marketplace" && !["IN", "US", "UK"].includes(value))
      throw new Error("Choose IN, US, or UK.");
    if (
      value &&
      key === "contactEmail" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    )
      throw new Error("Enter a valid email address.");
    if (key === "socialLinks")
      for (const line of value.split("\n").filter(Boolean)) {
        try {
          const u = new URL(line);
          if (u.protocol !== "https:" || u.username || u.password)
            throw new Error();
        } catch {
          throw new Error("Social profiles must be full HTTPS URLs.");
        }
      }
    const old = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    if (old) await ctx.db.patch(old._id, { value });
    else await ctx.db.insert("siteSettings", { key, value });
    await audit(ctx, actor._id, "settings.update", key);
  },
});
export const completeDeletion = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    const actor = await requireAdmin(ctx);
    const user = await ctx.db.get(id);
    if (!user?.deletionRequestedAt || user.role === "ADMIN")
      throw new Error("A non-admin deletion request is required.");
    const saved = await ctx.db
      .query("savedItems")
      .withIndex("by_user", (q) => q.eq("userId", id))
      .take(200);
    for (const item of saved) await ctx.db.delete(item._id);
    const sub = await ctx.db
      .query("newsletterSubscribers")
      .withIndex("by_email", (q) => q.eq("email", user.email.toLowerCase()))
      .unique();
    if (sub) await ctx.db.delete(sub._id);
    await ctx.db.delete(id);
    await audit(ctx, actor._id, "user.deletion-completed", id);
  },
});
