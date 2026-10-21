import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AccountControls } from "../src/components/account-controls";

const state = vi.hoisted(() => ({
  session: "unauthenticated",
  connected: false,
  role: "USER",
  sessionRole: "ADMIN",
}));
vi.mock("next-auth/react", () => ({
  useSession: () => ({
    status: state.session,
    data: { user: { role: state.sessionRole } },
  }),
  signOut: vi.fn(),
}));
vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: state.connected }),
  useQuery: (_query: unknown, args: unknown) =>
    args === "skip" ? undefined : { role: state.role },
}));
afterEach(() => {
  vi.unstubAllEnvs();
  state.session = "unauthenticated";
  state.connected = false;
  state.role = "USER";
});
describe("header account access", () => {
  it("offers login and signup to anonymous visitors", () => {
    const html = renderToStaticMarkup(createElement(AccountControls));
    expect(html).toContain('href="/signin"');
    expect(html).toContain('href="/signin?mode=signup"');
    expect(html).not.toContain('href="/admin"');
  });
  it("waits for Convex before displaying administrator access", () => {
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://test.convex.cloud");
    state.session = "authenticated";
    state.role = "ADMIN";
    const html = renderToStaticMarkup(createElement(AccountControls));
    expect(html).toContain('href="/dashboard"');
    expect(html).not.toContain('href="/admin"');
  });
  it("uses the backend reader role rather than a session role", () => {
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://test.convex.cloud");
    state.session = "authenticated";
    state.connected = true;
    const html = renderToStaticMarkup(createElement(AccountControls));
    expect(html).toContain("Sign out");
    expect(html).not.toContain('href="/admin"');
  });
  it("offers the admin dashboard on desktop and mobile to backend administrators", () => {
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://test.convex.cloud");
    state.session = "authenticated";
    state.connected = true;
    state.role = "ADMIN";
    for (const placement of ["header", "mobile"] as const) {
      const html = renderToStaticMarkup(
        createElement(AccountControls, { placement }),
      );
      expect(html).toContain('href="/admin"');
      expect(html).toContain("Admin dashboard");
      expect(html).toContain('href="/dashboard#settings"');
      expect(html).not.toContain('href="/signin?mode=signup"');
    }
  });
});
