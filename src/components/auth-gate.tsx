"use client";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import Link from "next/link";
export function AuthGate({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthLoading>
        <div className="skeleton" aria-label="Connecting account" />
      </AuthLoading>
      <Authenticated>{children}</Authenticated>
      <Unauthenticated>
        <div className="notice">
          Connecting your account… If this persists,{" "}
          <Link href="/signin">sign in again</Link>.
        </div>
      </Unauthenticated>
    </>
  );
}
