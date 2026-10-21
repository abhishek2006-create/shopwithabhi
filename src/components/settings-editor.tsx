"use client";
import { useQuery, useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { legal } from "@/config/legal";
const fields = [
  ["siteName", "Publication name"],
  ["heroTitle", "Homepage headline"],
  ["heroDescription", "Homepage introduction"],
  ["contactEmail", "Public contact email"],
  ["logo", "Logo path"],
  ["favicon", "Favicon path"],
  ["socialLinks", "Social profile links (one per line)"],
  [
    "featuredSections",
    "Featured sections (comma-separated: guides, products, journal)",
  ],
  ["affiliateDisclosure", "Affiliate disclosure"],
  ["marketplace", "Default marketplace"],
  ["seoTitle", "Default SEO title"],
  ["seoDescription", "Default SEO description"],
  ["newsletterEnabled", "Show newsletter (true / false)"],
  ...Object.entries(legal).map(([key, value]) => [`legal:${key}`, value.title]),
];
export function SettingsEditor() {
  const settings = useQuery(api.content.settings, {});
  const save = useMutation(api.admin.saveSetting);
  const [busy, setBusy] = useState("");
  if (!settings) return <div className="skeleton" />;
  return (
    <>
      <span className="eyebrow">MAKE IT YOURS</span>
      <h1>Site settings.</h1>
      <p>
        Public copy and policy drafts. Keep API keys and authentication secrets
        in environment variables.
      </p>
      <div className="notice">
        Legal content remains labelled as a draft until the publication workflow
        is reviewed. Logo, social, marketplace, and SEO defaults also have typed
        configuration files; review those before launch.
      </div>
      {fields.map(([key, label]) => (
        <form
          className="panel form-stack"
          key={key}
          onSubmit={async (e) => {
            e.preventDefault();
            const value = String(new FormData(e.currentTarget).get("value"));
            setBusy(key);
            try {
              await save({ key, value });
              toast.success("Setting saved.");
            } catch {
              toast.error("Unable to save setting.");
            } finally {
              setBusy("");
            }
          }}
        >
          <label>
            {label}
            <textarea
              name="value"
              rows={key.startsWith("legal:") ? 6 : 2}
              defaultValue={
                settings.find((s) => s.key === key)?.value ||
                legal[key.replace("legal:", "")]?.body ||
                ""
              }
            />
          </label>
          <button className="button secondary" disabled={busy === key}>
            Save {label.toLowerCase()}
          </button>
        </form>
      ))}
    </>
  );
}
