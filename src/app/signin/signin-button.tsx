"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
export function GoogleSignIn({
  callbackUrl = "/dashboard",
}: {
  callbackUrl?: "/dashboard" | "/admin";
}) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="button"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        void signIn("google", { callbackUrl });
      }}
    >
      {busy ? "Connecting…" : "Continue with Google"}
      <span>↗</span>
    </button>
  );
}
