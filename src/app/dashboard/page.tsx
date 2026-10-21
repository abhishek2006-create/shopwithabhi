import { requireSession } from "@/lib/guard";
import { ReaderDashboard } from "@/components/reader-dashboard";
import { AuthGate } from "@/components/auth-gate";
export const metadata = {
  title: "Your reading list",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function Dashboard() {
  await requireSession();
  return (
    <AuthGate>
      <ReaderDashboard />
    </AuthGate>
  );
}
