"use client";
import { useCallback, useMemo, useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import {
  ConvexProviderWithAuth,
  ConvexReactClient,
  useConvexAuth,
  useMutation,
} from "convex/react";
import { Toaster, toast } from "sonner";
import { api } from "../../convex/_generated/api";
function useAuthBridge() {
  const { status } = useSession();
  const fetchAccessToken = useCallback(async () => {
    const r = await fetch("/api/convex-token", { cache: "no-store" });
    if (!r.ok) return null;
    return (await r.json()).token as string | null;
  }, []);
  return {
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    fetchAccessToken,
  };
}
function SyncUser() {
  const { isAuthenticated } = useConvexAuth();
  const sync = useMutation(api.users.sync);
  useEffect(() => {
    if (isAuthenticated)
      void sync().catch(() => {
        toast.error("We couldn’t connect your account. Please sign in again.", {
          id: "account-connection",
        });
      });
  }, [isAuthenticated, sync]);
  return null;
}
export function Providers({ children }: { children: React.ReactNode }) {
  const client = useMemo(
    () =>
      process.env.NEXT_PUBLIC_CONVEX_URL
        ? new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL)
        : null,
    [],
  );
  return (
    <SessionProvider>
      {client ? (
        <ConvexProviderWithAuth client={client} useAuth={useAuthBridge}>
          <SyncUser />
          {children}
        </ConvexProviderWithAuth>
      ) : (
        children
      )}
      <Toaster position="bottom-right" richColors />
    </SessionProvider>
  );
}
