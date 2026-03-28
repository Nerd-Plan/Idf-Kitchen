import test from "node:test";
import assert from "node:assert/strict";
import {
  canAccessStaffArea,
  canCreateBase,
  canAssignMembersAcrossBases,
  canEditKitchen,
  canManageAppRoles,
  canManageStaffMembers,
  canResetMemberPin,
  canToggleMemberAccess,
  canVerifySergeant,
  isVerifiedNagad,
} from "../src/Utils/permissions.js";

test("verified nagad has kitchen and staff-management permissions", () => {
  const user = { role: "nagad", isVerifiedNagad: true, isAppManager: false };
  assert.equal(isVerifiedNagad(user), true);
  assert.equal(canEditKitchen(user), true);
  assert.equal(canManageStaffMembers(user), true);
  assert.equal(canToggleMemberAccess(user), true);
  assert.equal(canResetMemberPin(user), true);
  assert.equal(canCreateBase(user), true);
  assert.equal(canAccessStaffArea(user), true);
  assert.equal(canManageAppRoles(user), false);
  assert.equal(canVerifySergeant(user), false);
});

test("app manager can manage global roles and base assignment", () => {
  const user = { role: "cook", isAppManager: true };
  assert.equal(canAccessStaffArea(user), true);
  assert.equal(canManageAppRoles(user), true);
  assert.equal(canAssignMembersAcrossBases(user), true);
  assert.equal(canVerifySergeant(user), true);
});

test("soldier has no privileged permissions", () => {
  const user = { role: "soldier" };
  assert.equal(canEditKitchen(user), false);
  assert.equal(canManageStaffMembers(user), false);
  assert.equal(canCreateBase(user), false);
  assert.equal(canAccessStaffArea(user), false);
});
