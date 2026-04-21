import test from "node:test";
import assert from "node:assert/strict";
import { getCollectorForSource } from "../src/lib/collectors";

test("returns collectors for all supported source types", () => {
  assert.equal(getCollectorForSource("francetravail").sourceType, "francetravail");
  assert.equal(getCollectorForSource("greenhouse").sourceType, "greenhouse");
  assert.equal(getCollectorForSource("lever").sourceType, "lever");
  assert.equal(getCollectorForSource("custom").sourceType, "custom");
});
