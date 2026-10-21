"use client";
import { useState } from "react";
export function UnsubscribeButton({ token }: { token: string }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button
        className="button"
        disabled={busy || !/^[a-f0-9]{64}$/.test(token)}
        onClick={async () => {
          setBusy(true);
          try {
            const r = await fetch("/api/unsubscribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token }),
            });
            const data = await r.json();
            setMessage(
              r.ok ? "Your unsubscribe request is complete." : data.error,
            );
          } catch {
            setMessage("Please try again.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Updating…" : "Unsubscribe"}
      </button>
      <p role="status">
        {message ||
          (!token
            ? "Open the unsubscribe link saved when you subscribed."
            : "")}
      </p>
    </>
  );
}
