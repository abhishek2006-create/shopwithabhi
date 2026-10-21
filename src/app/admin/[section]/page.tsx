import { notFound } from "next/navigation";
import { AdminManager } from "@/components/admin-manager";
import { SettingsEditor } from "@/components/settings-editor";
export default async function AdminSection({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (section === "settings") return <SettingsEditor />;
  if (
    ![
      "products",
      "articles",
      "comparisons",
      "categories",
      "users",
      "messages",
      "newsletter",
      "audit",
    ].includes(section)
  )
    notFound();
  return <AdminManager section={section} />;
}
