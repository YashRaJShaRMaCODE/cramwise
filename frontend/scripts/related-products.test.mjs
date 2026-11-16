import test from "node:test";
import assert from "node:assert/strict";
import { requestRelatedProducts, safeLeadHubOrigin } from "../app/related-products.ts";

test("LeadHub recommendations require a valid HTTPS origin and opt-in", async () => {
  assert.equal(safeLeadHubOrigin("https://leads.example.test/"), "https://leads.example.test");
  assert.equal(safeLeadHubOrigin("http://leads.example.test"), "");
  let requested = "";
  const items = await requestRelatedProducts("https://leads.example.test", "cramwise", false);
  assert.deepEqual(items, []);
  assert.equal(requested, "");
  const oldFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    requested = url;
    return { ok: true, json: async () => ({ items: [
      { id: "campusflow", name: "CampusFlow", url: "https://schools.example.test/", reason: "School planning" },
      { id: "unsafe", name: "Bad", url: "javascript:alert(1)", reason: "Unsafe" },
    ] }) };
  };
  try {
    const suggestions = await requestRelatedProducts("https://leads.example.test", "cramwise", true);
    assert.equal(requested, "https://leads.example.test/api/recommendations?project=cramwise&consent=true");
    assert.deepEqual(suggestions.map(({ id }) => id), ["campusflow"]);
  } finally {
    globalThis.fetch = oldFetch;
  }
});
