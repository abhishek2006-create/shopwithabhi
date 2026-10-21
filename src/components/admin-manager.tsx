"use client";
import { usePaginatedQuery, useMutation } from "convex/react";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { initialCategories } from "@/config/navigation";
import { slugify } from "@/lib/validation";
import { Empty } from "./empty";
import { AdminTeam } from "./admin-team";
const sections = {
  products: "content",
  articles: "content",
  comparisons: "content",
  categories: "categories",
  users: "users",
  messages: "contactMessages",
  newsletter: "newsletterSubscribers",
  audit: "auditLogs",
} as const;
export function AdminManager({ section }: { section: string }) {
  const table = sections[section as keyof typeof sections];
  const { results, status, loadMore } = usePaginatedQuery(
    api.admin.list,
    { section: table },
    { initialNumItems: 30 },
  );
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [category, setCategory] = useState<
    Doc<"categories"> | null | undefined
  >();
  const [busy, setBusy] = useState(false);
  const archive = useMutation(api.admin.deleteContent);
  const saveCategory = useMutation(api.admin.saveCategory);
  const deleteCategory = useMutation(api.admin.deleteCategory);
  const setRole = useMutation(api.admin.setRole);
  const messageStatus = useMutation(api.admin.messageStatus);
  const subscriber = useMutation(api.admin.removeSubscriber);
  const completeDeletion = useMutation(api.admin.completeDeletion);
  async function run(task: () => Promise<unknown>) {
    setBusy(true);
    try {
      await task();
      toast.success("Changes saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to update.");
    } finally {
      setBusy(false);
    }
  }
  const records = results.filter((r) => {
    if (
      "kind" in r &&
      !(section === "products"
        ? r.kind === "product"
        : section === "comparisons"
          ? r.kind === "comparison"
          : r.kind === "article" || r.kind === "guide")
    )
      return false;
    const searchable =
      "title" in r
        ? r.title
        : "email" in r
          ? r.email
          : "action" in r
            ? r.action
            : "";
    return (
      searchable.toLowerCase().includes(search.toLowerCase()) &&
      (!filter || ("status" in r && r.status === filter))
    );
  });
  return (
    <>
      <span className="eyebrow">MANAGE YOUR PUBLICATION</span>
      <h1>
        {
          {
            products: "Product library",
            articles: "Articles & guides",
            comparisons: "Comparisons",
            categories: "Categories",
            users: "Users & admins",
            messages: "Contact inbox",
            newsletter: "Newsletter",
            audit: "Audit trail",
          }[section]
        }
        .
      </h1>
      {section === "users" && (
        <p className="muted">
          Administrators can manage products, articles, guides, comparisons,
          categories, site settings, messages, subscribers, and user roles. A
          person must sign in before their account appears here.
        </p>
      )}
      {section === "users" && <AdminTeam />}
      <div className="toolbar">
        <input
          aria-label="Filter loaded records"
          placeholder="Filter loaded records…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {["content", "contactMessages"].includes(table) && (
          <select
            aria-label="Status filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">All states</option>
            {(table === "content"
              ? ["draft", "published", "archived"]
              : ["new", "read", "archived"]
            ).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        )}
        {table === "content" && (
          <Link className="button" href={`/admin/${section}/new`}>
            Create new ↗
          </Link>
        )}
        {table === "categories" && (
          <button className="button" onClick={() => setCategory(null)}>
            Add category
          </button>
        )}
        {table === "newsletterSubscribers" && (
          <a download className="button secondary" href="/api/admin/export">
            Export consented subscribers
          </a>
        )}
      </div>
      {table === "categories" && results.length === 0 && (
        <button
          className="button secondary"
          disabled={busy}
          onClick={() =>
            void run(async () => {
              for (const [order, c] of initialCategories.entries())
                await saveCategory({
                  title: c.title,
                  slug: c.slug,
                  description: c.description,
                  image: "",
                  seoDescription: c.description,
                  order,
                  active: true,
                });
            })
          }
        >
          Create the six starter categories
        </button>
      )}
      {category !== undefined && (
        <form
          className="panel editor-grid"
          onSubmit={async (e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            await run(async () => {
              await saveCategory({
                id: category?._id,
                title: String(data.get("title")),
                slug: slugify(String(data.get("slug") || data.get("title"))),
                description: String(data.get("description")),
                image: String(data.get("image")),
                seoDescription: String(data.get("seoDescription")),
                order: Number(data.get("order")),
                active: data.get("active") === "on",
              });
              setCategory(undefined);
            });
          }}
        >
          <label>
            Title
            <input name="title" required defaultValue={category?.title} />
          </label>
          <label>
            Slug
            <input name="slug" defaultValue={category?.slug} />
          </label>
          <label className="full">
            Description
            <textarea name="description" defaultValue={category?.description} />
          </label>
          <label>
            Image URL
            <input name="image" defaultValue={category?.image} />
          </label>
          <label>
            SEO description
            <input
              name="seoDescription"
              defaultValue={category?.seoDescription}
            />
          </label>
          <label>
            Display order
            <input
              name="order"
              type="number"
              defaultValue={category?.order || 0}
            />
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              name="active"
              defaultChecked={category?.active ?? true}
            />
            Active
          </label>
          <div className="table-actions">
            <button className="button" disabled={busy}>
              Save category
            </button>
            <button type="button" onClick={() => setCategory(undefined)}>
              Cancel
            </button>
          </div>
        </form>
      )}
      {status === "LoadingFirstPage" ? (
        <div className="skeleton" />
      ) : records.length === 0 ? (
        <Empty
          title="Nothing here yet."
          description="Records will appear as you create content or receive reader activity."
        />
      ) : (
        <div className="panel table-scroll">
          <table className="specs">
            <thead>
              <tr>
                <th>Record</th>
                <th>State / details</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((row) => (
                <tr key={row._id}>
                  <td>
                    {"title" in row
                      ? row.title
                      : "email" in row
                        ? row.email
                        : "action" in row
                          ? row.action
                          : ""}
                    <small style={{ display: "block" }}>
                      {"slug" in row
                        ? row.slug
                        : "name" in row
                          ? row.name
                          : "target" in row
                            ? row.target
                            : ""}
                    </small>
                    {"message" in row && (
                      <details>
                        <summary>{row.subject}</summary>
                        <p style={{ whiteSpace: "pre-wrap" }}>{row.message}</p>
                      </details>
                    )}
                  </td>
                  <td>
                    {"status" in row ? (
                      <span className="badge">{row.status}</span>
                    ) : "role" in row ? (
                      <span className="badge">
                        {row.role}
                        {row.deletionRequestedAt ? " · deletion requested" : ""}
                      </span>
                    ) : "consent" in row ? (
                      <>
                        <span className="badge">
                          {row.consent ? "Consented" : "Unsubscribed"}
                        </span>
                        <small style={{ display: "block" }}>
                          {new Date(row.consentAt).toLocaleString("en-IN")}
                        </small>
                      </>
                    ) : "active" in row ? (
                      row.active ? (
                        "Active"
                      ) : (
                        "Inactive"
                      )
                    ) : "timestamp" in row ? (
                      new Date(row.timestamp).toLocaleString("en-IN")
                    ) : (
                      ""
                    )}
                    {"kind" in row &&
                      row.kind === "product" &&
                      !row.affiliateUrl && (
                        <small style={{ display: "block", color: "#986d35" }}>
                          Missing affiliate link
                        </small>
                      )}
                  </td>
                  <td>
                    <div className="table-actions">
                      {"kind" in row && (
                        <>
                          <Link href={`/admin/${section}/${row._id}`}>
                            Edit
                          </Link>
                          <button
                            disabled={busy}
                            onClick={() => {
                              if (
                                confirm(
                                  "Archive this item? It will be hidden from the public site.",
                                )
                              )
                                void run(() => archive({ id: row._id }));
                            }}
                          >
                            Archive
                          </button>
                        </>
                      )}
                      {"order" in row && (
                        <>
                          <button onClick={() => setCategory(row)}>Edit</button>
                          <button
                            disabled={busy}
                            onClick={() => {
                              if (
                                confirm(
                                  "Delete category? Linked content must be reassigned first.",
                                )
                              )
                                void run(() => deleteCategory({ id: row._id }));
                            }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {"role" in row && (
                        <>
                          <button
                            disabled={busy}
                            onClick={() => {
                              if (
                                confirm(
                                  `Change this account to ${row.role === "ADMIN" ? "USER" : "ADMIN"}?`,
                                )
                              )
                                void run(() =>
                                  setRole({
                                    id: row._id,
                                    role:
                                      row.role === "ADMIN" ? "USER" : "ADMIN",
                                  }),
                                );
                            }}
                          >
                            Change role
                          </button>
                          {row.deletionRequestedAt && (
                            <button
                              disabled={busy}
                              onClick={() => {
                                if (
                                  confirm(
                                    "Permanently erase this requested account, saved items and newsletter record?",
                                  )
                                )
                                  void run(() =>
                                    completeDeletion({ id: row._id }),
                                  );
                              }}
                            >
                              Complete deletion
                            </button>
                          )}
                        </>
                      )}
                      {"message" in row &&
                        (["read", "archived", "delete"] as const).map((s) => (
                          <button
                            key={s}
                            disabled={busy}
                            onClick={() => {
                              if (
                                s !== "delete" ||
                                confirm("Permanently delete this message?")
                              )
                                void run(() =>
                                  messageStatus({ id: row._id, status: s }),
                                );
                            }}
                          >
                            {s}
                          </button>
                        ))}
                      {"consent" in row && (
                        <>
                          <button
                            disabled={busy}
                            onClick={() =>
                              void run(() =>
                                subscriber({ id: row._id, remove: false }),
                              )
                            }
                          >
                            Unsubscribe
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => {
                              if (
                                confirm(
                                  "Permanently delete this subscriber record?",
                                )
                              )
                                void run(() =>
                                  subscriber({ id: row._id, remove: true }),
                                );
                            }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {"actorId" in row && <small>Actor: {row.actorId}</small>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="toolbar">
        <small>
          Filters apply to loaded records. Load more to extend the list.
        </small>
        {status === "CanLoadMore" && (
          <button className="button secondary" onClick={() => loadMore(30)}>
            Load more
          </button>
        )}
        {status === "LoadingMore" && <span>Loading…</span>}
      </div>
    </>
  );
}
