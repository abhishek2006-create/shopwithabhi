import Link from "next/link";
import { authConfigured } from "@/lib/auth";
import { GoogleSignIn } from "./signin-button";
import { ShoppingBag } from "lucide-react";
export const metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};
export default async function SignIn({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; mode?: string }>;
}) {
  const { error, mode } = await searchParams;
  const signup = mode === "signup";
  const admin = mode === "admin";
  return (
    <div className="signin-box">
      <ShoppingBag
        size={36}
        style={{ margin: "auto", color: "var(--green)" }}
      />
      <span className="eyebrow signin-eyebrow">
        {admin
          ? "EDITORIAL TEAM"
          : signup
            ? "CREATE YOUR ACCOUNT"
            : "WELCOME BACK"}
      </span>
      <h1>
        {admin ? (
          "Your editorial desk awaits."
        ) : signup ? (
          <>
            Make room for
            <br />
            your next great find.
          </>
        ) : (
          <>
            Your next great find,
            <br />
            saved for later.
          </>
        )}
      </h1>
      <p>
        {admin
          ? "Sign in with your authorized Google account to manage products, guides, and your publication."
          : signup
            ? "Create your free account with Google to save discoveries and build a reading list. Your account is created on your first sign-in."
            : "Sign in to build a reading list, save product discoveries, and make yourself at home."}
      </p>
      {error && (
        <div className="notice">
          {error === "AccountConnection"
            ? "Your sign-in succeeded, but we couldn’t connect your profile. Please try signing in again."
            : "Sign-in could not be completed. Check your account or try again."}
        </div>
      )}
      {authConfigured ? (
        <GoogleSignIn callbackUrl={admin ? "/admin" : "/dashboard"} />
      ) : (
        <div className="notice">
          Google sign-in is not configured yet. Add the Google OAuth,
          authentication signing, and Convex settings described in the README to
          enable accounts.
        </div>
      )}
      <p className="signin-switch">
        {signup ? (
          <>
            Already have an account? <Link href="/signin">Log in</Link>
          </>
        ) : (
          <>
            New to ShopWithAbhi? <Link href="/signin?mode=signup">Sign up</Link>
          </>
        )}
      </p>
      {!admin && (
        <Link className="signin-admin-link" href="/signin?mode=admin">
          Editorial team? Admin sign in ↗
        </Link>
      )}
      <p className="muted">
        By continuing, you agree to the <Link href="/terms">terms</Link> and
        acknowledge our <Link href="/privacy-policy">privacy policy</Link>.
      </p>
    </div>
  );
}
