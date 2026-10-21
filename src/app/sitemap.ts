import type { MetadataRoute } from "next";
import { publicOrigin } from "@/config/site";
import { legal } from "@/config/legal";
import { db, getCategories } from "@/lib/data";
import { contentPath } from "@/lib/routes";
import { api } from "../../convex/_generated/api";
import type { PaginationResult } from "convex/server";
import type { Doc } from "../../convex/_generated/dataModel";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = publicOrigin();
  const entries: MetadataRoute.Sitemap = [
    "",
    "/guides",
    "/products",
    "/blog",
    "/compare",
    "/contact",
    ...Object.keys(legal).map((x) => `/${x}`),
  ].map((path) => ({ url: origin + path }));
  const client = db();
  if (client) {
    let cursor: string | null = null;
    for (let page = 0; page < 100; page++) {
      const result: PaginationResult<Doc<"content">> = await client.query(
        api.content.sitemap,
        { paginationOpts: { numItems: 200, cursor } },
      );
      entries.push(
        ...result.page.map((i) => ({
          url: origin + contentPath(i),
          lastModified: new Date(i.updatedAt),
        })),
      );
      if (result.isDone) break;
      cursor = result.continueCursor;
    }
  }
  entries.push(
    ...(await getCategories()).map((c) => ({
      url: `${origin}/categories/${c.slug}`,
    })),
  );
  return entries;
}
