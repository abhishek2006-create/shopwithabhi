"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { useSession } from "next-auth/react";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
function ConnectedSave({ id }: { id: Id<"content"> }) {
  const router = useRouter();
  const { status } = useSession();
  const me = useQuery(api.users.me, {});
  const saved = useQuery(api.users.saved, me ? {} : "skip");
  const toggle = useMutation(api.users.toggleSaved);
  const [busy, setBusy] = useState(false);
  const isSaved = saved?.some((x) => x?._id === id);
  return (
    <button
      className="button secondary"
      disabled={busy}
      onClick={async () => {
        if (status !== "authenticated") {
          router.push("/signin");
          return;
        }
        if (!me) {
          toast.error("Your account is still connecting. Please try again.");
          return;
        }
        setBusy(true);
        try {
          const result = await toggle({ contentId: id });
          toast.success(
            result
              ? "Saved to your reading list."
              : "Removed from your reading list.",
          );
        } catch {
          toast.error("Unable to update your reading list.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} />
      {isSaved ? "Saved" : "Save for later"}
    </button>
  );
}
export function SaveButton({ id }: { id: Id<"content"> }) {
  return process.env.NEXT_PUBLIC_CONVEX_URL ? (
    <ConnectedSave id={id} />
  ) : (
    <Link href="/signin" className="button secondary">
      <Bookmark size={16} />
      Save for later
    </Link>
  );
}
