import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { initialCategories } from "../src/config/navigation";

export const categories = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    let created = 0;
    for (const [order, category] of initialCategories.entries()) {
      const existing = await ctx.db
        .query("categories")
        .withIndex("by_slug", (query) => query.eq("slug", category.slug))
        .unique();
      if (existing) continue;
      await ctx.db.insert("categories", {
        title: category.title,
        slug: category.slug,
        description: category.description,
        seoDescription: category.description,
        image: "",
        order,
        active: true,
      });
      created += 1;
    }
    return created;
  },
});
