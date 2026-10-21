import { beforeEach, expect, it, vi } from "vitest";
import { requireSession } from "../src/lib/guard";

const state = vi.hoisted(() => ({
  token: vi.fn(),
  mutation: vi.fn(),
  query: vi.fn(),
  setAuth: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("../src/lib/token", () => ({ convexToken: state.token }));
vi.mock("../src/lib/data", () => ({
  db: () => ({
    mutation: state.mutation,
    query: state.query,
    setAuth: state.setAuth,
  }),
}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));
beforeEach(() => {
  vi.resetAllMocks();
  state.token.mockResolvedValue("server-session-token");
  state.mutation.mockResolvedValue("reader-id");
  state.query.mockResolvedValue({ _id: "reader-id", role: "USER" });
});
it("loads the dashboard after syncing the verified profile", async () => {
  await expect(requireSession()).resolves.toMatchObject({ role: "USER" });
  expect(state.setAuth).toHaveBeenCalledWith("server-session-token");
  expect(state.mutation).toHaveBeenCalledOnce();
});
it("redirects account connection errors to a useful sign-in state", async () => {
  state.mutation.mockRejectedValue(
    new Error("Verified Google identity required."),
  );
  await expect(requireSession()).rejects.toThrow(
    "redirect:/signin?error=AccountConnection",
  );
  expect(state.query).not.toHaveBeenCalled();
});
it("keeps anonymous visitors and readers out of the admin dashboard", async () => {
  state.token.mockResolvedValueOnce(null);
  await expect(requireSession(true)).rejects.toThrow("redirect:/signin");
  await expect(requireSession(true)).rejects.toThrow("redirect:/dashboard");
  state.query.mockResolvedValue({ _id: "admin-id", role: "ADMIN" });
  await expect(requireSession(true)).resolves.toMatchObject({ role: "ADMIN" });
});
