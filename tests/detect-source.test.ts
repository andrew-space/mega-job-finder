import test from "node:test";
import assert from "node:assert/strict";
import { detectSourceFromCareersUrl } from "../src/lib/sources/detect-source";

test("detects greenhouse board token", () => {
  const detected = detectSourceFromCareersUrl("https://boards.greenhouse.io/notion");
  assert.equal(detected.sourceType, "greenhouse");
  assert.equal(detected.sourceIdentifier, "notion");
});

test("detects lever company slug", () => {
  const detected = detectSourceFromCareersUrl("https://jobs.lever.co/stripe");
  assert.equal(detected.sourceType, "lever");
  assert.equal(detected.sourceIdentifier, "stripe");
});

test("falls back to custom source", () => {
  const detected = detectSourceFromCareersUrl("https://careers.example.com/jobs");
  assert.equal(detected.sourceType, "custom");
  assert.ok(detected.sourceIdentifier.includes("careers.example.com"));
});
