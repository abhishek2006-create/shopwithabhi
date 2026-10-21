import { requireSession } from "@/lib/guard";
import { AdminNav } from "@/components/admin-nav";
import { AuthGate } from "@/components/auth-gate";
export const metadata = {
  title: "Editorial dashboard",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession(true);
  return (
    <div className="container dashboard-shell">
      <AdminNav />
      <div className="dashboard-main">
        <AuthGate>{children}</AuthGate>
      </div>
    </div>
  );
}
