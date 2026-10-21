"use client";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { ContentCard } from "./content-card";
import { Empty } from "./empty";
import { SaveButton } from "./save-button";
export function ReaderDashboard() {
  const me = useQuery(api.users.me, {});
  const saved = useQuery(api.users.saved, me ? {} : "skip");
  const preferences = useMutation(api.users.preferences);
  const deletion = useMutation(api.users.requestDeletion);
  const [tab, setTab] = useState("saved");
  useEffect(() => {
    const selectTab = () =>
      setTab(window.location.hash === "#settings" ? "settings" : "saved");
    selectTab();
    window.addEventListener("hashchange", selectTab);
    return () => window.removeEventListener("hashchange", selectTab);
  }, []);
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  if (me === undefined)
    return (
      <div className="container page-body">
        <div className="skeleton" />
      </div>
    );
  if (!me)
    return (
      <div className="container page-body">
        <Empty
          title="Your account is unavailable."
          description="Please sign out and reconnect, or contact the editor if you requested account deletion."
        />
        <button
          className="button"
          onClick={() => void signOut({ callbackUrl: "/" })}
        >
          Sign out
        </button>
      </div>
    );
  const items = saved?.filter(
    (x) => x && (filter === "all" || x.kind === filter),
  );
  return (
    <div className="container dashboard-shell">
      <nav className="dashboard-nav" aria-label="Your account">
        <span className="eyebrow">YOUR LITTLE COLLECTION</span>
        {["saved", "settings"].map((t) => (
          <a
            className={tab === t ? "active" : ""}
            href={`#${t}`}
            key={t}
            onClick={() => setTab(t)}
          >
            {t === "saved" ? "Saved discoveries" : "Profile & preferences"}
          </a>
        ))}
        {me.role === "ADMIN" && (
          <Link href="/admin">Editorial dashboard ↗</Link>
        )}
        <Link href="/">Back to the website ↗</Link>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            void signOut({ callbackUrl: "/" });
          }}
        >
          Sign out
        </a>
      </nav>
      <div className="dashboard-main">
        <span className="eyebrow">A SPACE FOR YOUR FAVORITES</span>
        <h1>Hello, {me.name.split(" ")[0]}.</h1>
        <p>Your considered collection, ready when you are.</p>
        {tab === "saved" ? (
          <>
            <div className="toolbar">
              <h2 style={{ fontSize: 24 }}>Saved discoveries</h2>
              <select
                aria-label="Filter saved items"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">Everything</option>
                <option value="product">Products</option>
                <option value="guide">Buying guides</option>
                <option value="article">Articles</option>
                <option value="comparison">Comparisons</option>
              </select>
            </div>
            {!saved ? (
              <div className="skeleton" />
            ) : items?.length ? (
              <div className="content-grid">
                {items.map(
                  (x) =>
                    x && (
                      <div key={x._id}>
                        <ContentCard item={x} />
                        <div style={{ marginTop: 10 }}>
                          <SaveButton id={x._id} />
                        </div>
                      </div>
                    ),
                )}
              </div>
            ) : (
              <Empty
                title="Make room for your next find."
                description="Save a product, article, or guide and it will be waiting for you here."
              />
            )}
          </>
        ) : (
          <>
            <div className="panel">
              <h2 style={{ fontSize: 24 }}>Profile & preferences</h2>
              <form
                className="form-stack"
                style={{ marginTop: 20 }}
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  const data = new FormData(e.currentTarget);
                  try {
                    await preferences({
                      name: String(data.get("name")),
                      newsletter: data.get("newsletter") === "on",
                    });
                    toast.success("Preferences saved.");
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Unable to save.",
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <label>
                  Display name
                  <input
                    name="name"
                    defaultValue={me.name}
                    required
                    minLength={2}
                    maxLength={100}
                  />
                </label>
                <label>
                  Google account email
                  <input value={me.email} disabled />
                </label>
                <label className="check-label">
                  <input
                    type="checkbox"
                    name="newsletter"
                    defaultChecked={me.newsletter}
                  />
                  I’m interested in editorial updates.
                </label>
                <p className="muted">
                  This preference does not enroll you in marketing. Use the
                  newsletter form to record subscription consent. Turning it off
                  also unsubscribes your account email.
                </p>
                <button className="button" disabled={busy}>
                  Save preferences
                </button>
              </form>
            </div>
            <div className="panel">
              <h3>Account deletion</h3>
              <p style={{ margin: "15px 0" }}>
                Request deletion of your profile and saved items. Your account
                is disabled immediately while an administrator completes the
                request.
              </p>
              <button
                className="button secondary"
                disabled={busy}
                onClick={async () => {
                  if (
                    !confirm(
                      "Request account deletion? Your account will become unavailable immediately.",
                    )
                  )
                    return;
                  setBusy(true);
                  try {
                    await deletion({});
                    await signOut({ callbackUrl: "/" });
                  } catch (e) {
                    toast.error(
                      e instanceof Error
                        ? e.message
                        : "Unable to request deletion.",
                    );
                    setBusy(false);
                  }
                }}
              >
                Request account deletion
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
