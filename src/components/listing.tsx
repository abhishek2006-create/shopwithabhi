import Link from "next/link";
import Image from "next/image";
import { ContentCard } from "./content-card";
import { Empty } from "./empty";
import { getList, getCategories } from "@/lib/data";
import type { Id } from "../../convex/_generated/dataModel";
export async function Listing({
  title,
  description,
  kind,
  params,
  categoryId,
  image,
  path,
}: {
  title: string;
  description: string;
  kind?: "product" | "guide" | "article" | "comparison";
  params: { q?: string; sort?: string; cursor?: string; category?: string };
  categoryId?: Id<"categories">;
  image?: string;
  path: string;
}) {
  const categories = await getCategories();
  const selected =
    categoryId || categories.find((c) => c.slug === params.category)?._id;
  const query = (params.q || "").trim().slice(0, 100);
  const data = await getList({
    kind,
    categoryId: selected,
    search: query || undefined,
    sort: params.sort === "oldest" ? "oldest" : "newest",
    cursor: params.cursor,
  });
  const next = new URLSearchParams();
  if (query) next.set("q", query);
  if (params.category) next.set("category", params.category);
  next.set("cursor", data.continueCursor);
  if (params.sort) next.set("sort", params.sort);
  return (
    <div className="container page-body">
      <div className="breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span>{title}</span>
      </div>
      <div className="page-heading">
        <span className="eyebrow">THE SHOPWITHABHI EDIT</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {image && (
        <div className="article-image">
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 760px) 100vw, 1180px"
          />
        </div>
      )}
      <form className="filter-form" action={path}>
        <label className="sr-only" htmlFor="collection-search">
          Search this collection
        </label>
        <input
          id="collection-search"
          name="q"
          defaultValue={query}
          maxLength={100}
          placeholder="What are you looking for?"
        />
        {!categoryId && (
          <>
            <label className="sr-only" htmlFor="category-filter">
              Category
            </label>
            <select
              id="category-filter"
              name="category"
              defaultValue={params.category || ""}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option value={c.slug} key={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
          </>
        )}
        <select
          aria-label="Sort results"
          name="sort"
          defaultValue={params.sort || "newest"}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
        <button className="button">Search</button>
        {query && (
          <Link className="text-link" href={path}>
            Clear
          </Link>
        )}
      </form>
      {path === "/search" && query && (
        <div className="toolbar">
          {categories
            .filter((c) => c.title.toLowerCase().includes(query.toLowerCase()))
            .map((c) => (
              <Link
                className="badge"
                href={`/categories/${c.slug}`}
                key={c._id}
              >
                {c.title} ↗
              </Link>
            ))}
        </div>
      )}
      {data.page.length ? (
        <div className="content-grid">
          {data.page.map((item) => (
            <ContentCard key={item._id} item={item} />
          ))}
        </div>
      ) : (
        <Empty
          title={query ? "No matches just yet." : undefined}
          description={
            query
              ? "Try a broader search or explore a different category."
              : undefined
          }
        />
      )}
      <nav className="pagination" aria-label="Results pages">
        {params.cursor && (
          <Link href={path} className="button secondary">
            Back to first page
          </Link>
        )}
        {!data.isDone && (
          <Link href={`${path}?${next}`} className="button secondary">
            Next page →
          </Link>
        )}
      </nav>
    </div>
  );
}
