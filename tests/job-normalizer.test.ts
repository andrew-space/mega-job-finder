import test from "node:test";
import assert from "node:assert/strict";
import { buildNormalizedJob } from "../src/lib/normalizers/job";

test("normalizes html description to plain text", () => {
  const normalized = buildNormalizedJob({
    externalId: "abc-1",
    sourceType: "greenhouse",
    sourceCompany: "Acme",
    title: "Software Engineer",
    locationRaw: "Paris, Ile-de-France, France",
    descriptionHtml: "<p>Hello <strong>world</strong></p>",
    applyUrl: "https://example.com/apply",
    employmentTypeRaw: "Full-time",
    publishedAt: "2026-04-21T00:00:00.000Z",
  });

  assert.equal(normalized.descriptionText, "Hello world");
  assert.equal(normalized.employmentType, "full_time");
  assert.equal(normalized.city, "Paris");
  assert.equal(normalized.country, "France");
});
