import test from "node:test";
import assert from "node:assert/strict";
import { hashPin, hashPinLegacy, isLegacyPinHash, verifyPin } from "../src/Utils/hash.js";

test("legacy hashes are still recognized and verified", async () => {
  const legacyHash = hashPinLegacy("5678");
  assert.equal(isLegacyPinHash(legacyHash), true);
  assert.equal(await verifyPin("5678", legacyHash), true);
  assert.equal(await verifyPin("1234", legacyHash), false);
});

test("new hashes verify correctly", async () => {
  const hash = await hashPin("1234");
  assert.equal(hash.startsWith("pbkdf2$") || isLegacyPinHash(hash), true);
  assert.equal(await verifyPin("1234", hash), true);
  assert.equal(await verifyPin("9999", hash), false);
});
