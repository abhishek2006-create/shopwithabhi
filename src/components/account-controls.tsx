"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import {
  ChevronDown,
  LogOut,
  ShieldCheck,
  Bookmark,
  UserRound,
} from "lucide-react";
import { api } from "../../convex/_generated/api";

type AccountControlsProps = {
  placement?: "header" | "mobile";
  onNavigate?: () => void;
};

export function AccountControls({
  placement = "header",
  onNavigate,
}: AccountControlsProps) {
  const { status } = useSession();
  if (status !== "authenticated") {
    return (
      <div
        className={`account-controls account-${placement}`}
        aria-label="Account access"
      >
        <Link href="/signin" className="account-login" onClick={onNavigate}>
          Log in
        </Link>
        <Link
          href="/signin?mode=signup"
          className="account-signup"
          onClick={onNavigate}
        >
          Sign up <span aria-hidden="true">↗</span>
        </Link>
      </div>
    );
  }
  return process.env.NEXT_PUBLIC_CONVEX_URL ? (
    <ConnectedAccount placement={placement} onNavigate={onNavigate} />
  ) : (
    <AccountLinks
      placement={placement}
      onNavigate={onNavigate}
      isAdmin={false}
    />
  );
}

function ConnectedAccount(props: AccountControlsProps) {
  const { isAuthenticated } = useConvexAuth();
  const reader = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  return <AccountLinks {...props} isAdmin={reader?.role === "ADMIN"} />;
}

function AccountLinks({
  placement = "header",
  onNavigate,
  isAdmin,
}: AccountControlsProps & { isAdmin: boolean }) {
  const details = useRef<HTMLDetailsElement>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    function dismiss(event: PointerEvent) {
      if (details.current && !details.current.contains(event.target as Node))
        details.current.open = false;
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, []);
  function navigate() {
    if (details.current) details.current.open = false;
    onNavigate?.();
  }
  const links = (
    <>
      {isAdmin && (
        <Link href="/admin" onClick={navigate}>
          <ShieldCheck size={17} />
          Admin dashboard
        </Link>
      )}
      <Link href="/dashboard" onClick={navigate}>
        <Bookmark size={17} />
        My reading list
      </Link>
      <Link
        href="/dashboard#settings"
        onNavigate={(event) => {
          navigate();
          if (window.location.pathname === "/dashboard") {
            event.preventDefault();
            window.location.hash = "settings";
          }
        }}
      >
        <UserRound size={17} />
        My account
      </Link>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          void signOut({ callbackUrl: "/" }).catch(() => setBusy(false));
        }}
      >
        <LogOut size={17} />
        {busy ? "Signing out…" : "Sign out"}
      </button>
    </>
  );
  if (placement === "mobile")
    return (
      <div className="mobile-account-links" aria-label="Your account">
        {links}
      </div>
    );
  return (
    <details
      className="account-dropdown"
      ref={details}
      onKeyDown={(event) => {
        if (event.key === "Escape" && details.current?.open) {
          details.current.open = false;
          details.current.querySelector("summary")?.focus();
        }
      }}
    >
      <summary aria-label="Open account menu">
        <UserRound className="account-icon" size={18} />
        <span className="account-label">{isAdmin ? "Admin" : "Account"}</span>
        <ChevronDown size={13} />
      </summary>
      <div className="account-dropdown-panel">{links}</div>
    </details>
  );
}
