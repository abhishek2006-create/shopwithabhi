// This suite uses Node because sanitize-html uses Node's parser dependencies.
// @vitest-environment node
import { expect, it } from "vitest";
import { cleanHtml } from "../src/lib/sanitize";
it("removes executable rich text while preserving editorial formatting", () => {
  const clean = cleanHtml(
    '<h2>Guide</h2><p onclick="evil()">Useful</p><script>evil()</script><img src=x onerror=evil()><a href="javascript:evil()">Bad link</a><a href="https://example.test">Source</a>',
  );
  expect(clean).toContain("<h2>Guide</h2>");
  expect(clean).not.toMatch(/<script|onclick|onerror|javascript:|<img/);
  expect(clean).toContain('rel="nofollow noopener noreferrer"');
});
