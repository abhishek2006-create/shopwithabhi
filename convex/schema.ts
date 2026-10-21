import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
export const kind = v.union(
  v.literal("product"),
  v.literal("guide"),
  v.literal("article"),
  v.literal("comparison"),
);
export const status = v.union(
  v.literal("draft"),
  v.literal("published"),
  v.literal("archived"),
);
export const contentFields = {
  kind,
  title: v.string(),
  slug: v.string(),
  excerpt: v.string(),
  body: v.string(),
  categoryId: v.optional(v.id("categories")),
  image: v.optional(v.string()),
  imageAlt: v.optional(v.string()),
  specifications: v.array(v.object({ label: v.string(), value: v.string() })),
  pros: v.array(v.string()),
  cons: v.array(v.string()),
  audience: v.string(),
  editorial: v.string(),
  affiliateUrl: v.optional(v.string()),
  marketplace: v.string(),
  source: v.string(),
  verifiedAt: v.optional(v.number()),
  relatedIds: v.array(v.id("content")),
  tags: v.array(v.string()),
  status,
  featured: v.boolean(),
  seoTitle: v.string(),
  seoDescription: v.string(),
  author: v.string(),
  publishedAt: v.optional(v.number()),
  updatedAt: v.number(),
};
export default defineSchema({
  users: defineTable({
    subject: v.string(),
    name: v.string(),
    email: v.string(),
    avatar: v.optional(v.string()),
    role: v.union(v.literal("USER"), v.literal("ADMIN")),
    newsletter: v.boolean(),
    deletionRequestedAt: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_subject", ["subject"]),
  content: defineTable(contentFields)
    .index("by_slug", ["slug"])
    .index("by_status_kind", ["status", "kind", "updatedAt"])
    .index("by_category_status", ["categoryId", "status", "kind", "updatedAt"])
    .searchIndex("search_content", {
      searchField: "title",
      filterFields: ["status", "kind", "categoryId"],
    }),
  categories: defineTable({
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    image: v.string(),
    seoDescription: v.string(),
    order: v.number(),
    active: v.boolean(),
  })
    .index("by_slug", ["slug"])
    .index("by_active", ["active"])
    .searchIndex("search_categories", {
      searchField: "title",
      filterFields: ["active"],
    }),
  savedItems: defineTable({ userId: v.id("users"), contentId: v.id("content") })
    .index("by_user", ["userId"])
    .index("by_user_content", ["userId", "contentId"])
    .index("by_content", ["contentId"]),
  newsletterSubscribers: defineTable({
    email: v.string(),
    consent: v.boolean(),
    consentAt: v.number(),
    source: v.string(),
    unsubscribeHash: v.string(),
    unsubscribedAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_token", ["unsubscribeHash"]),
  contactMessages: defineTable({
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    message: v.string(),
    status: v.union(v.literal("new"), v.literal("read"), v.literal("archived")),
    updatedAt: v.number(),
  }).index("by_status", ["status"]),
  siteSettings: defineTable({ key: v.string(), value: v.string() }).index(
    "by_key",
    ["key"],
  ),
  auditLogs: defineTable({
    actorId: v.id("users"),
    action: v.string(),
    target: v.string(),
    timestamp: v.number(),
  }).index("by_timestamp", ["timestamp"]),
  affiliateClicks: defineTable({
    contentId: v.id("content"),
    marketplace: v.string(),
    timestamp: v.number(),
  }).index("by_timestamp", ["timestamp"]),
  rateLimits: defineTable({
    key: v.string(),
    count: v.number(),
    expiresAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_expiry", ["expiresAt"]),
});
