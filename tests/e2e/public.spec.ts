import { test, expect } from "@playwright/test";
const connected = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);
const signInConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.NEXTAUTH_SECRET &&
  process.env.AUTH_PRIVATE_JWK &&
  process.env.AUTH_ISSUER &&
  connected,
);
test("homepage and search work without fabricated products", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Find the right products/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: /Find your buying guide/ }).click();
  await expect(
    page.getByRole("heading", { name: "Buy with a little more clarity." }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Search this collection" })
    .fill("unknown product");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "No matches just yet." }),
  ).toBeVisible();
});

test("header search and mobile dialog submit queries accessibly", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  if (!isMobile) {
    const search = page.getByRole("search", { name: "Site search" });
    await search
      .getByRole("textbox", { name: "Search the website" })
      .fill("headphones");
    await search.getByRole("button", { name: "Search website" }).click();
    await expect(page).toHaveURL(/\/search\?q=headphones/);
    await expect(
      page.getByRole("heading", { name: "No matches just yet." }),
    ).toBeVisible();
    return;
  }
  const trigger = page.getByRole("button", { name: "Open search" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "What’s on your mind?" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page
    .getByRole("textbox", { name: "Search products and guides" })
    .fill("headphones");
  await dialog.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/\/search\?q=headphones/);
  await expect(
    page.getByRole("heading", { name: "No matches just yet." }),
  ).toBeVisible();
});

test("category menus navigate to real category pages", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  if (isMobile) {
    const trigger = page.getByRole("button", { name: "Open menu" });
    await trigger.click();
    await page
      .getByRole("navigation", { name: "Mobile navigation" })
      .getByRole("link", { name: "Buying guides" })
      .focus();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await trigger.click();
    await page
      .getByRole("navigation", { name: "Mobile navigation" })
      .getByRole("link", { name: "Home & kitchen" })
      .click();
  } else {
    const trigger = page.getByRole("button", {
      name: "Categories",
      exact: true,
    });
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await page.locator("#category-menu a").first().focus();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.click();
    await page
      .locator("#category-menu")
      .getByRole("link", { name: /Home & kitchen/ })
      .click();
  }
  await expect(page).toHaveURL(/\/categories\/home-kitchen/);
  await expect(
    page.getByRole("heading", { name: "Home & kitchen", exact: true }),
  ).toBeVisible();
});

test("homepage sections stay useful without fabricated product reviews", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Shop by category" }),
  ).toBeVisible();
  await expect(page.locator(".shop-category-card")).toHaveCount(6);
  await expect(
    page.getByRole("heading", { name: "Featured product reviews" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "How we review", exact: true }),
  ).toHaveAttribute("href", "/review-methodology");
  const search = page.getByRole("search", { name: "Product discovery" });
  await search.getByRole("textbox").fill("thoughtful desk");
  await search.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/\/search\?q=thoughtful\+desk/);
});

test("reduced motion keeps content readable without horizontal page overflow", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Find the right products/ }),
  ).toBeVisible();
  await expect(page.locator(".shopping-hero-copy")).toHaveCSS("opacity", "1");
  await expect
    .poll(async () =>
      page
        .locator(".shopping-hero-photo img")
        .evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBeGreaterThan(0);
  const dimensions = await page.evaluate(() => ({
    width: innerWidth,
    page: document.documentElement.scrollWidth,
  }));
  expect(dimensions.page).toBeLessThanOrEqual(dimensions.width);
  await page.locator("#newsletter").scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("heading", { name: "A more thoughtful inbox." }),
  ).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: testInfo.outputPath("homepage.png"),
    fullPage: true,
  });
});
test("protected routes redirect to sign in", async ({ page }) => {
  await page.goto("/admin/products");
  await expect(page).toHaveURL(/\/signin/);
  if (signInConfigured) {
    await expect(
      page.getByRole("button", { name: /Continue with Google/ }),
    ).toBeVisible();
  } else {
    await expect(
      page.getByText("Google sign-in is not configured yet.", { exact: false }),
    ).toBeVisible();
  }
});
test("legal drafts and contact form validation are honest", async ({
  page,
  request,
}) => {
  await page.goto("/privacy-policy");
  await expect(page.getByText("Draft content", { exact: false })).toBeVisible();
  await page.goto("/contact");
  if (connected) {
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByLabel("Name", { exact: true })).toBeFocused();
    const response = await request.post("/api/forms/contact", {
      headers: { origin: "https://untrusted.example" },
      data: {},
    });
    expect(response.status()).toBe(403);
    return;
  }
  await page.getByLabel("Name", { exact: true }).fill("Test Reader");
  await page.getByLabel("Email", { exact: true }).fill("reader@example.test");
  await page.getByLabel("Subject", { exact: true }).fill("Test message");
  await page
    .getByLabel("Message", { exact: true })
    .fill("This is a test message with enough characters.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(
    page.getByText("This form is not connected yet.", { exact: false }),
  ).toBeVisible();
});
test("navigation, metadata and sitemap", async ({
  page,
  request,
  isMobile,
}) => {
  await page.goto("/");
  if (isMobile) {
    await page.getByRole("button", { name: "Open menu" }).click();
    await page
      .getByRole("navigation", { name: "Mobile navigation" })
      .getByRole("link", { name: "Blog" })
      .click();
  } else
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Blog" })
      .click();
  await expect(page).toHaveTitle(/The journal/);
  expect((await request.get("/sitemap.xml")).status()).toBe(200);
  expect((await request.get("/go/missing-product")).status()).toBe(404);
  const width = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    viewport: innerWidth,
  }));
  expect(width.scroll).toBeLessThanOrEqual(width.viewport);
});

test("glass layouts fit narrow phones, tablets and desktops", async ({
  page,
}) => {
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/", "/search", "/contact", "/signin"]) {
      const response = await page.goto(route);
      expect(response?.status(), `${route} at ${width}px`).toBe(200);
      const pageWidth = await page.evaluate(
        () => document.documentElement.scrollWidth,
      );
      const overflowing =
        pageWidth > width
          ? await page.evaluate(() =>
              Array.from(document.querySelectorAll("main *, header *"))
                .filter(
                  (element) =>
                    element.getBoundingClientRect().right > innerWidth + 1,
                )
                .map(
                  (element) =>
                    `${element.tagName}.${element.className} parent=${element.parentElement?.className} right=${Math.round(element.getBoundingClientRect().right)}`,
                )
                .slice(0, 10),
            )
          : [];
      expect(
        pageWidth,
        `${route} at ${width}px: ${overflowing.join(", ")}`,
      ).toBeLessThanOrEqual(width);
    }
  }
});

test("anonymous visitors cannot retrieve account tokens", async ({
  request,
}) => {
  const response = await request.get("/api/convex-token");
  expect(response.status()).toBe(401);
  if (signInConfigured) {
    const providers = await request.get("/api/auth/providers");
    expect(providers.status()).toBe(200);
    expect((await providers.json()).google.id).toBe("google");
  }
});

test("visible login and signup lead to Google authentication and admin access", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Admin dashboard", exact: true }),
  ).toHaveCount(0);
  await page
    .locator(".account-header")
    .getByRole("link", { name: "Log in", exact: true })
    .click();
  await expect(page.getByText("WELCOME BACK", { exact: true })).toBeVisible();
  await page.goto("/");
  if (isMobile) {
    await page.getByRole("button", { name: "Open menu" }).click();
    await page
      .locator(".account-mobile")
      .getByRole("link", { name: /Sign up/ })
      .click();
  } else {
    await page
      .locator(".account-header")
      .getByRole("link", { name: /Sign up/ })
      .click();
  }
  await expect(
    page.getByText("CREATE YOUR ACCOUNT", { exact: true }),
  ).toBeVisible();
  if (signInConfigured)
    await expect(
      page.getByRole("button", { name: /Continue with Google/ }),
    ).toBeVisible();
  await page.getByRole("link", { name: /Admin sign in/ }).click();
  await expect(
    page.getByRole("heading", { name: "Your editorial desk awaits." }),
  ).toBeVisible();
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/signin/);
});
