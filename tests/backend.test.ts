import { convexTest } from "convex-test";
import { describe, it, expect, vi } from "vitest";
import schema from "../convex/schema";
import { api, internal } from "../convex/_generated/api";
const modules = import.meta.glob("../convex/**/*.ts");
it("creates starter categories once and preserves editorial changes", async () => {
  const backend = convexTest(schema, modules);
  expect(await backend.mutation(internal.bootstrap.categories, {})).toBe(6);
  await backend.run(async (ctx) => {
    const category = await ctx.db.query("categories").first();
    await ctx.db.patch(category!._id, { title: "Owner's category title" });
  });
  expect(await backend.mutation(internal.bootstrap.categories, {})).toBe(0);
  const categories = await backend.query(api.content.categories, {});
  expect(categories).toHaveLength(6);
  expect(
    categories.some((category) => category.title === "Owner's category title"),
  ).toBe(true);
});
const base = {
  kind: "product" as const,
  title: "Test product",
  slug: "test-product",
  excerpt: "Test-only fixture",
  body: "<p>Test content, never seed data.</p>",
  specifications: [],
  pros: [],
  cons: [],
  audience: "",
  editorial: "",
  marketplace: "IN",
  source: "Test fixture",
  relatedIds: [],
  tags: [],
  status: "draft" as const,
  featured: false,
  seoTitle: "",
  seoDescription: "",
  author: "Test editor",
  updatedAt: 1,
};
async function setup() {
  const t = convexTest(schema, modules);
  vi.stubEnv("ADMIN_EMAILS", "editor@example.test");
  const admin = t.withIdentity({
    subject: "editor",
    issuer: "https://test.local",
    email: "editor@example.test",
    emailVerified: true,
    name: "Editor",
  });
  const reader = t.withIdentity({
    subject: "reader",
    issuer: "https://test.local",
    email: "reader@example.test",
    emailVerified: true,
    name: "Reader",
  });
  await admin.mutation(api.users.sync, {});
  await reader.mutation(api.users.sync, {});
  return { t, admin, reader };
}
describe("Convex authorization and content", () => {
  it("shows the complete administrator team only to administrators", async () => {
    const { t, admin, reader } = await setup();
    vi.stubEnv(
      "ADMIN_EMAILS",
      "editor@example.test, second-admin@example.test, SECOND-ADMIN@example.test",
    );
    await expect(t.query(api.admin.administrators, {})).rejects.toThrow(
      "Sign in to continue",
    );
    await expect(reader.query(api.admin.administrators, {})).rejects.toThrow(
      "Administrator access required",
    );
    expect(await admin.query(api.admin.administrators, {})).toEqual({
      total: 2,
      active: [{ name: "Editor", email: "editor@example.test", isYou: true }],
      pendingEmails: ["second-admin@example.test"],
    });
    const second = t.withIdentity({
      subject: "second-admin",
      issuer: "https://test.local",
      email: "second-admin@example.test",
      email_verified: true,
      name: "Second admin",
    });
    await second.mutation(api.users.sync, {});
    const team = await second.query(api.admin.administrators, {});
    expect(team.total).toBe(2);
    expect(team.pendingEmails).toEqual([]);
    expect(team.active).toEqual([
      { name: "Editor", email: "editor@example.test", isYou: false },
      { name: "Second admin", email: "second-admin@example.test", isYou: true },
    ]);
    const readerId = (await reader.query(api.users.me, {}))!._id;
    await admin.mutation(api.admin.setRole, { id: readerId, role: "ADMIN" });
    expect((await admin.query(api.admin.administrators, {})).total).toBe(3);
    await admin.mutation(api.admin.setRole, { id: readerId, role: "USER" });
    expect((await admin.query(api.admin.administrators, {})).total).toBe(2);
  });
  it("promotes an existing allowlisted account and gives it full shop administration", async () => {
    const backend = convexTest(schema, modules);
    vi.stubEnv("ADMIN_EMAILS", "owner@example.test");
    const ankit = backend.withIdentity({
      subject: "new-admin",
      issuer: "https://test.local",
      email: "Ankit@Example.Test",
      email_verified: true,
      name: "Ankit",
    });
    const id = await ankit.mutation(api.users.sync, {});
    await ankit.mutation(api.users.preferences, {
      name: "Ankit's profile",
      newsletter: false,
    });
    await expect(ankit.query(api.admin.overview, {})).rejects.toThrow(
      "Administrator access required",
    );
    vi.stubEnv("ADMIN_EMAILS", "owner@example.test, ankit@example.test");
    expect(await ankit.mutation(api.users.sync, {})).toBe(id);
    expect(await ankit.query(api.users.me, {})).toMatchObject({
      role: "ADMIN",
      name: "Ankit's profile",
    });
    const categoryId = await ankit.mutation(api.admin.saveCategory, {
      title: "Admin category",
      slug: "admin-category",
      description: "Test category",
      image: "",
      seoDescription: "",
      order: 0,
      active: true,
    });
    const contentId = await ankit.mutation(api.admin.saveContent, {
      data: { ...base, categoryId },
    });
    await ankit.mutation(api.admin.saveSetting, {
      key: "siteName",
      value: "ShopWithAbhi",
    });
    const reader = backend.withIdentity({
      subject: "another-reader",
      issuer: "https://test.local",
      email: "reader@example.test",
      email_verified: true,
    });
    const readerId = await reader.mutation(api.users.sync, {});
    await ankit.mutation(api.admin.setRole, { id: readerId, role: "ADMIN" });
    expect((await reader.query(api.users.me, {}))?.role).toBe("ADMIN");
    await ankit.mutation(api.admin.deleteContent, { id: contentId });
    expect(
      (await ankit.query(api.admin.getContent, { id: contentId }))?.status,
    ).toBe("archived");
    expect(await ankit.query(api.admin.overview, {})).toBeDefined();
    await ankit.mutation(api.users.sync, {});
    const promotions = await backend.run(async (ctx) =>
      (await ctx.db.query("auditLogs").collect()).filter(
        (row) => row.action === "role.ADMIN.allowlist",
      ),
    );
    expect(promotions).toHaveLength(1);
  });
  it("does not promote unlisted accounts or reactivate accounts pending deletion", async () => {
    const backend = convexTest(schema, modules);
    vi.stubEnv("ADMIN_EMAILS", "");
    const deleted = backend.withIdentity({
      subject: "deleted-admin",
      issuer: "https://test.local",
      email: "ankit@example.test",
      email_verified: true,
    });
    const id = await deleted.mutation(api.users.sync, {});
    await deleted.mutation(api.users.requestDeletion, {});
    vi.stubEnv("ADMIN_EMAILS", "ankit@example.test");
    await deleted.mutation(api.users.sync, {});
    expect(await deleted.query(api.users.me, {})).toBeNull();
    expect((await backend.run((ctx) => ctx.db.get(id)))?.role).toBe("USER");
    const lookalike = backend.withIdentity({
      subject: "lookalike",
      issuer: "https://test.local",
      email: "notankit@example.test",
      email_verified: true,
    });
    await lookalike.mutation(api.users.sync, {});
    expect((await lookalike.query(api.users.me, {}))?.role).toBe("USER");
    await expect(
      lookalike.mutation(api.admin.saveSetting, {
        key: "siteName",
        value: "Changed",
      }),
    ).rejects.toThrow("Administrator access required");
  });
  it("syncs raw custom-JWT claims and saves profile settings", async () => {
    const backend = convexTest(schema, modules);
    vi.stubEnv("ADMIN_EMAILS", "editor@example.test");
    const reader = backend.withIdentity({
      subject: "raw-google-subject",
      issuer: "https://test.local",
      email: "Editor@Example.Test",
      email_verified: true,
      name: "Editor",
      picture: "https://example.test/avatar.png",
    });
    expect(await reader.query(api.users.connectionStatus, {})).toEqual({
      authenticated: true,
      verifiedEmail: true,
    });
    const userId = await reader.mutation(api.users.sync, {});
    expect(await reader.query(api.users.me, {})).toMatchObject({
      _id: userId,
      role: "ADMIN",
      email: "editor@example.test",
      avatar: "https://example.test/avatar.png",
    });
    await reader.mutation(api.users.preferences, {
      name: "Updated editor",
      newsletter: false,
    });
    expect(await reader.query(api.users.me, {})).toMatchObject({
      name: "Updated editor",
      newsletter: false,
    });
    expect(await reader.query(api.admin.overview, {})).toBeDefined();
    const normalized = backend.withIdentity({
      subject: "raw-google-subject",
      issuer: "https://test.local",
      email: "editor@example.test",
      emailVerified: true,
    });
    expect(await normalized.mutation(api.users.sync, {})).toBe(userId);
    expect((await normalized.query(api.users.me, {}))?.name).toBe(
      "Updated editor",
    );
  });
  it("rejects missing, false and truthy non-boolean verification claims", async () => {
    const backend = convexTest(schema, modules);
    for (const verification of [undefined, false, "true", "false", 1, null]) {
      const identity = backend.withIdentity({
        subject: "unverified",
        issuer: "https://test.local",
        email: "reader@example.test",
        ...(verification !== undefined ? { email_verified: verification } : {}),
      });
      await expect(identity.mutation(api.users.sync, {})).rejects.toThrow(
        "Verified Google identity required",
      );
      expect(
        await identity.query(api.users.connectionStatus, {}),
      ).toMatchObject({ verifiedEmail: false });
    }
    const conflict = backend.withIdentity({
      subject: "conflicting",
      issuer: "https://test.local",
      email: "reader@example.test",
      emailVerified: false,
      email_verified: true,
    });
    await expect(conflict.mutation(api.users.sync, {})).rejects.toThrow(
      "Verified Google identity required",
    );
    await expect(backend.mutation(api.users.sync, {})).rejects.toThrow(
      "Verified Google identity required",
    );
    expect(await backend.query(api.users.connectionStatus, {})).toEqual({
      authenticated: false,
      verifiedEmail: false,
    });
    const verified = backend.withIdentity({
      subject: "existing-user",
      issuer: "https://test.local",
      email: "reader@example.test",
      email_verified: true,
    });
    await verified.mutation(api.users.sync, {});
    const unverified = backend.withIdentity({
      subject: "existing-user",
      issuer: "https://test.local",
      email: "reader@example.test",
      email_verified: "true",
    });
    expect(await unverified.query(api.users.me, {})).toBeNull();
    await expect(
      unverified.mutation(api.users.preferences, {
        name: "Unauthorized edit",
        newsletter: false,
      }),
    ).rejects.toThrow("Verified Google identity required");
  });
  it("blocks anonymous and reader admin access", async () => {
    const { t, reader } = await setup();
    await expect(t.query(api.admin.overview, {})).rejects.toThrow();
    await expect(
      reader.mutation(api.admin.saveContent, { data: base }),
    ).rejects.toThrow("Administrator");
  });
  it("keeps drafts private and publishes real content", async () => {
    const { t, admin } = await setup();
    const id = await admin.mutation(api.admin.saveContent, { data: base });
    expect(await t.query(api.content.bySlug, { slug: base.slug })).toBeNull();
    await admin.mutation(api.admin.saveContent, {
      id,
      data: { ...base, status: "published" },
    });
    expect((await t.query(api.content.bySlug, { slug: base.slug }))?._id).toBe(
      id,
    );
    await expect(
      admin.mutation(api.admin.saveContent, { data: base }),
    ).rejects.toThrow("slug");
  });
  it("isolates saved items and toggles without duplicates", async () => {
    const { t, admin, reader } = await setup();
    const id = await admin.mutation(api.admin.saveContent, {
      data: { ...base, status: "published" },
    });
    await reader.mutation(api.users.toggleSaved, { contentId: id });
    expect(await admin.query(api.users.saved, {})).toHaveLength(0);
    expect(await reader.query(api.users.saved, {})).toHaveLength(1);
    await expect(t.query(api.users.saved, {})).rejects.toThrow();
    await reader.mutation(api.users.toggleSaved, { contentId: id });
    expect(await reader.query(api.users.saved, {})).toHaveLength(0);
  });
  it("allows missing links but rejects hostile destinations", async () => {
    const { admin } = await setup();
    await admin.mutation(api.admin.saveContent, { data: base });
    await expect(
      admin.mutation(api.admin.saveContent, {
        data: { ...base, slug: "hostile", affiliateUrl: "https://evil.com" },
      }),
    ).rejects.toThrow("Amazon");
  });
  it("protects categories with references", async () => {
    const { admin } = await setup();
    const id = await admin.mutation(api.admin.saveCategory, {
      title: "Test",
      slug: "test",
      description: "Test",
      image: "",
      seoDescription: "",
      order: 0,
      active: true,
    });
    await admin.mutation(api.admin.saveContent, {
      data: { ...base, categoryId: id },
    });
    await expect(
      admin.mutation(api.admin.deleteCategory, { id }),
    ).rejects.toThrow("Reassign");
  });
  it("protects verified identity and role changes", async () => {
    const { t, admin, reader } = await setup();
    await expect(
      t
        .withIdentity({
          subject: "imposter",
          email: "editor@example.test",
          emailVerified: false,
        })
        .mutation(api.users.sync, {}),
    ).rejects.toThrow("Verified");
    const me = await reader.query(api.users.me, {});
    expect(me?.role).toBe("USER");
    await expect(
      reader.mutation(api.admin.setRole, { id: me!._id, role: "ADMIN" }),
    ).rejects.toThrow();
    const editor = await admin.query(api.users.me, {});
    await expect(
      admin.mutation(api.admin.setRole, { id: editor!._id, role: "USER" }),
    ).rejects.toThrow("own role");
  });
});
describe("contact and newsletter", () => {
  it("requires gateway, persists contact and enforces rate limit", async () => {
    const { t } = await setup();
    vi.stubEnv("FORM_GATEWAY_SECRET", "test-only-secret");
    const args = {
      secret: "test-only-secret",
      visitorHash: "test",
      name: "Reader",
      email: "reader@example.test",
      subject: "A question",
      message: "This is a message long enough for validation.",
    };
    await expect(
      t.mutation(api.forms.contact, { ...args, secret: "bad" }),
    ).rejects.toThrow();
    for (let i = 0; i < 5; i++) await t.mutation(api.forms.contact, args);
    await expect(t.mutation(api.forms.contact, args)).rejects.toThrow(
      "Too many",
    );
  });
  it("deduplicates newsletters and supports secret unsubscribe", async () => {
    const { t } = await setup();
    vi.stubEnv("FORM_GATEWAY_SECRET", "test-only-secret");
    const args = {
      secret: "test-only-secret",
      visitorHash: "newsletter-test",
      email: "reader@example.test",
      consent: true,
      unsubscribeHash: "a".repeat(64),
    };
    expect(await t.mutation(api.forms.subscribe, args)).toBe(true);
    expect(await t.mutation(api.forms.subscribe, args)).toBe(false);
    await t.mutation(api.forms.unsubscribe, { hash: "b".repeat(64) });
    expect(
      await t.run(
        async (ctx) =>
          (await ctx.db.query("newsletterSubscribers").first())?.consent,
      ),
    ).toBe(true);
    await t.mutation(api.forms.unsubscribe, { hash: "a".repeat(64) });
    expect(
      await t.run(
        async (ctx) =>
          (await ctx.db.query("newsletterSubscribers").first())?.consent,
      ),
    ).toBe(false);
  });
});

describe("publication integrity", () => {
  it("keeps category filtering scoped to content type", async () => {
    const { t, admin } = await setup();
    const categoryId = await admin.mutation(api.admin.saveCategory, {
      title: "Electronics",
      slug: "electronics",
      description: "Test category",
      image: "",
      seoDescription: "",
      order: 0,
      active: true,
    });
    await admin.mutation(api.admin.saveContent, {
      data: { ...base, categoryId, status: "published" },
    });
    await admin.mutation(api.admin.saveContent, {
      data: {
        ...base,
        categoryId,
        kind: "guide",
        slug: "test-guide",
        status: "published",
      },
    });
    const result = await t.query(api.content.list, {
      categoryId,
      kind: "product",
      paginationOpts: { numItems: 12, cursor: null },
    });
    expect(result.page).toHaveLength(1);
    expect(result.page[0].kind).toBe("product");
  });
  it("keeps archived content out of public reads and saved lists", async () => {
    const { t, admin, reader } = await setup();
    const id = await admin.mutation(api.admin.saveContent, {
      data: { ...base, status: "published" },
    });
    await reader.mutation(api.users.toggleSaved, { contentId: id });
    await admin.mutation(api.admin.deleteContent, { id });
    expect(await t.query(api.content.bySlug, { slug: base.slug })).toBeNull();
    expect(await reader.query(api.users.saved, {})).toHaveLength(0);
    const result = await t.query(api.content.sitemap, {
      paginationOpts: { numItems: 20, cursor: null },
    });
    expect(result.page).toHaveLength(0);
  });
  it("prevents settings from becoming a public secret store", async () => {
    const { admin, reader } = await setup();
    await expect(
      admin.mutation(api.admin.saveSetting, {
        key: "GOOGLE_CLIENT_SECRET",
        value: "not-a-real-secret",
      }),
    ).rejects.toThrow("Invalid public setting");
    await expect(
      reader.mutation(api.admin.saveSetting, {
        key: "heroTitle",
        value: "Changed",
      }),
    ).rejects.toThrow();
    await expect(
      admin.mutation(api.admin.saveSetting, {
        key: "logo",
        value: "//evil.test/image",
      }),
    ).rejects.toThrow();
  });
  it("disables accounts requesting deletion and supports operator completion", async () => {
    const { admin, reader } = await setup();
    const user = await reader.query(api.users.me, {});
    await reader.mutation(api.users.requestDeletion, {});
    expect(await reader.query(api.users.me, {})).toBeNull();
    await expect(reader.query(api.users.saved, {})).rejects.toThrow(
      "Account unavailable",
    );
    await admin.mutation(api.admin.completeDeletion, { id: user!._id });
    expect(
      await admin.query(api.admin.list, {
        section: "users",
        paginationOpts: { numItems: 20, cursor: null },
      }),
    ).toMatchObject({ page: [expect.objectContaining({ role: "ADMIN" })] });
  });
});
