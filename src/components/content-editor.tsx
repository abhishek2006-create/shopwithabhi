"use client";
import { useQuery, useMutation } from "convex/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { RichEditor } from "./rich-editor";
import { slugify } from "@/lib/validation";
import { contentPath } from "@/lib/routes";
function EditorForm({
  item,
  section,
}: {
  item: Doc<"content"> | null;
  section: string;
}) {
  const router = useRouter();
  const settings = useQuery(api.content.settings, {});
  const categories = useQuery(api.content.categories, {});
  const related = useQuery(api.admin.list, {
    section: "content",
    paginationOpts: { numItems: 100, cursor: null },
  });
  const save = useMutation(api.admin.saveContent);
  const [body, setBody] = useState(item?.body || "<p></p>");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const isProduct = section === "products";
  const isComparison = section === "comparisons";
  async function previewContent() {
    const r = await fetch("/api/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html: body }),
    });
    if (r.ok) {
      setPreviewHtml((await r.json()).html);
      setPreview(true);
    } else toast.error("Preview unavailable.");
  }
  return (
    <>
      <span className="eyebrow">
        {item ? "REFINE THE DETAILS" : "START SOMETHING USEFUL"}
      </span>
      <h1>
        {item ? "Edit" : "Create"}{" "}
        {isProduct
          ? "product"
          : isComparison
            ? "comparison"
            : "article or guide"}
        .
      </h1>
      <div className="toolbar">
        <button
          className="button secondary"
          onClick={() => void previewContent()}
        >
          Preview body
        </button>
        {item?.status === "published" && (
          <a
            className="text-link"
            href={contentPath(item)}
            target="_blank"
            rel="noopener noreferrer"
          >
            View published page ↗
          </a>
        )}
      </div>
      {preview && (
        <div className="panel">
          <div className="toolbar">
            <h3>Body preview</h3>
            <button
              className="button secondary"
              onClick={() => setPreview(false)}
            >
              Close preview
            </button>
          </div>
          <div
            className="prose"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      )}
      <form
        className="panel editor-grid"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const fd = new FormData(e.currentTarget);
          const text = (key: string) => String(fd.get(key) || "");
          const lines = (key: string) =>
            text(key)
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean);
          try {
            const id = await save({
              id: item?._id,
              data: {
                kind: isProduct
                  ? "product"
                  : isComparison
                    ? "comparison"
                    : (text("kind") as "article" | "guide"),
                title: text("title"),
                slug: slugify(text("slug") || text("title")),
                excerpt: text("excerpt"),
                body,
                categoryId: (text("categoryId") || undefined) as
                  Id<"categories"> | undefined,
                image: text("image") || undefined,
                imageAlt: text("imageAlt") || undefined,
                specifications: lines("specifications").map((line) => {
                  const split = line.indexOf(":");
                  return {
                    label: split >= 0 ? line.slice(0, split).trim() : line,
                    value:
                      split >= 0
                        ? line.slice(split + 1).trim()
                        : "Not provided",
                  };
                }),
                pros: lines("pros"),
                cons: lines("cons"),
                audience: text("audience"),
                editorial: text("editorial"),
                affiliateUrl: text("affiliateUrl") || undefined,
                marketplace: text("marketplace") || "IN",
                source: text("source"),
                verifiedAt: text("verifiedAt")
                  ? new Date(text("verifiedAt")).getTime()
                  : undefined,
                relatedIds: fd.getAll("relatedIds") as Id<"content">[],
                tags: text("tags")
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
                status: text("status") as "draft" | "published" | "archived",
                featured: fd.get("featured") === "on",
                seoTitle: text("seoTitle"),
                seoDescription: text("seoDescription"),
                author: text("author"),
                updatedAt: Date.now(),
              },
            });
            toast.success("Content saved.");
            router.push(`/admin/${section}/${id}`);
            router.refresh();
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Unable to save content.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="full">
          Title
          <input
            name="title"
            defaultValue={item?.title}
            required
            minLength={3}
            maxLength={200}
          />
        </label>
        <label>
          Slug
          <input
            name="slug"
            defaultValue={item?.slug}
            placeholder="Generated from title if blank"
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
          />
        </label>
        <label>
          Category
          <select name="categoryId" defaultValue={item?.categoryId || ""}>
            <option value="">Uncategorized</option>
            {categories?.map((c) => (
              <option value={c._id} key={c._id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        {!isProduct && !isComparison && (
          <label>
            Content type
            <select name="kind" defaultValue={item?.kind || "article"}>
              <option value="article">Journal article</option>
              <option value="guide">Buying guide</option>
            </select>
          </label>
        )}
        <label>
          Status
          <select name="status" defaultValue={item?.status || "draft"}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label>
          Author
          <input
            name="author"
            defaultValue={item?.author || "ShopWithAbhi Editorial"}
            required
          />
        </label>
        <label className="full">
          Excerpt
          <textarea
            name="excerpt"
            defaultValue={item?.excerpt}
            maxLength={1000}
            rows={3}
          />
        </label>
        <div className="full">
          <label>Body</label>
          <RichEditor value={body} onChange={setBody} />
        </div>
        <label>
          Image URL
          <input
            name="image"
            defaultValue={item?.image}
            placeholder="Local /image.webp or permitted HTTPS image"
          />
          <small>Only use imagery you are authorized to publish.</small>
        </label>
        <label>
          Image alternative text
          <input name="imageAlt" defaultValue={item?.imageAlt} />
        </label>
        {isProduct && (
          <>
            <label>
              Affiliate URL
              <input
                name="affiliateUrl"
                type="url"
                defaultValue={item?.affiliateUrl}
                placeholder="https://www.amazon.in/…"
              />
              {!item?.affiliateUrl && (
                <small>
                  Missing retailer link. The public button stays disabled.
                </small>
              )}
            </label>
            <label>
              Marketplace
              <select
                name="marketplace"
                defaultValue={
                  item?.marketplace ||
                  settings?.find((s) => s.key === "marketplace")?.value ||
                  "IN"
                }
              >
                <option value="IN">Amazon India</option>
                <option value="US">Amazon US</option>
                <option value="UK">Amazon UK</option>
              </select>
            </label>
            <label className="full">
              Specifications — one “Label: value” per line
              <textarea
                name="specifications"
                defaultValue={item?.specifications
                  .map((s) => `${s.label}: ${s.value}`)
                  .join("\n")}
                rows={5}
              />
            </label>
            <label>
              Pros — one per line
              <textarea name="pros" defaultValue={item?.pros.join("\n")} />
            </label>
            <label>
              Cons — one per line
              <textarea name="cons" defaultValue={item?.cons.join("\n")} />
            </label>
            <label>
              Data source
              <input
                name="source"
                defaultValue={item?.source}
                placeholder="Permitted source / manufacturer documentation"
              />
            </label>
            <label>
              Last verified
              <input
                name="verifiedAt"
                type="date"
                defaultValue={
                  item?.verifiedAt
                    ? new Date(item.verifiedAt).toISOString().slice(0, 10)
                    : ""
                }
              />
            </label>
            <label className="full">
              Who should consider it?
              <textarea name="audience" defaultValue={item?.audience} />
            </label>
          </>
        )}
        <label className="full">
          Editorial conclusion
          <textarea name="editorial" defaultValue={item?.editorial} rows={4} />
        </label>
        <label className="full">
          {isComparison ? "Products to compare" : "Related content"}
          <select
            name="relatedIds"
            multiple
            defaultValue={item?.relatedIds || []}
            size={5}
          >
            {related?.page
              .filter(
                (c): c is Doc<"content"> =>
                  "kind" in c &&
                  c._id !== item?._id &&
                  (!isComparison || c.kind === "product"),
              )
              .map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title} ({c.status})
                </option>
              ))}
          </select>
          <small>
            Hold Ctrl / Cmd to select multiple. Up to 12; unpublished items stay
            private.
          </small>
        </label>
        <label>
          Tags (comma separated)
          <input name="tags" defaultValue={item?.tags.join(", ")} />
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={item?.featured}
          />
          Featured content
        </label>
        <label>
          SEO title
          <input
            name="seoTitle"
            defaultValue={item?.seoTitle}
            maxLength={160}
          />
        </label>
        <label>
          SEO description
          <textarea
            name="seoDescription"
            defaultValue={item?.seoDescription}
            maxLength={320}
          />
        </label>
        <div className="full">
          <button className="button" disabled={busy}>
            {busy ? "Saving…" : "Save content"}
          </button>
        </div>
      </form>
    </>
  );
}
export function ContentEditor({
  id,
  section,
}: {
  id: string;
  section: string;
}) {
  const item = useQuery(
    api.admin.getContent,
    id !== "new" ? { id: id as Id<"content"> } : "skip",
  );
  if (id !== "new" && item === undefined) return <div className="skeleton" />;
  if (id !== "new" && !item)
    return <div className="notice">Content not found.</div>;
  return <EditorForm key={id} item={item || null} section={section} />;
}
