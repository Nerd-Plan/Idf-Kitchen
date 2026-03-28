export const ROLES = Object.freeze({
  SOLDIER: "soldier",
  COOK: "cook",
  ADMIN: "admin",
  NAGAD: "nagad",
});

export function isAppManager(user) {
  return Boolean(user?.isAppManager);
}

export function isVerifiedNagad(user) {
  return user?.role === ROLES.NAGAD && user?.isVerifiedNagad !== false;
}

export function canEditKitchen(user) {
  if (!user) return false;
  if (isVerifiedNagad(user)) return true;
  return user.role === ROLES.COOK || user.role === ROLES.ADMIN;
}

export function canAccessStaffArea(user) {
  return isVerifiedNagad(user) || isAppManager(user);
}

export function canManageStaffMembers(user) {
  return isVerifiedNagad(user) || isAppManager(user);
}

export function canCreateBase(user) {
  return isAppManager(user) || isVerifiedNagad(user) || user?.canCreateBase === true;
}

export function canAssignMembersAcrossBases(user) {
  return isAppManager(user);
}

export function canManageAppRoles(user) {
  return isAppManager(user);
}

export function canToggleMemberAccess(user) {
  return isVerifiedNagad(user) || isAppManager(user);
}

export function canResetMemberPin(user) {
  return isVerifiedNagad(user) || isAppManager(user);
}

export function canVerifySergeant(user) {
  return isAppManager(user);
}
