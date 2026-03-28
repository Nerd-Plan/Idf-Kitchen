import {
  loadBases as loadBasesFromCloud,
  loadKitchenConfig,
  loadStaff as loadStaffFromCloud,
  saveKitchenConfig,
  syncBasesList,
  syncStaffList,
} from "../FireBase/firestoreService";
import { ensureFirebaseAuth } from "../FireBase/firebase";
import { DEFAULT_BASES, DEFAULT_STAFF, DEFAULT_TEAM_CATEGORIES, makeKitchen } from "./defaultdata.js";

export const SK = "idf-kitchen-v7";
export const SS = "idf-staff-v7";
export const SB = "idf-bases-v1";
const LEGACY_BASE_IDS = new Set(["base-north", "base-center", "base-south"]);

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeStaff(staff) {
  if (!Array.isArray(staff) || !staff.length) {
    return deepClone(DEFAULT_STAFF);
  }
  const fallbackBase = DEFAULT_BASES[0] ?? { id: "main", name: "Main Base" };
  return staff.map((member, index) => {
    const fallbackMember = DEFAULT_STAFF[index % DEFAULT_STAFF.length] ?? DEFAULT_STAFF[0] ?? {};
    const assignedBase =
      DEFAULT_BASES.find((base) => base.id === member?.baseId) ?? DEFAULT_BASES[index % DEFAULT_BASES.length] ?? fallbackBase;
    const role = member?.role ?? "cook";
    const isNagadRole = role === "nagad";
    return {
      ...member,
      role,
      pinHash: member?.pinHash ?? fallbackMember.pinHash ?? "",
      baseId: member?.baseId ?? assignedBase.id,
      baseName: member?.baseName ?? assignedBase.name,
      hogerId: member?.hogerId ?? "",
      active: member?.active !== false,
      isAppManager: Boolean(member?.isAppManager),
      isVerifiedNagad: isNagadRole ? member?.isVerifiedNagad ?? true : true,
      canCreateBase: isNagadRole ? member?.canCreateBase ?? (member?.isVerifiedNagad ?? true) : false,
      verifiedBy: member?.verifiedBy ?? "",
      verifiedAt: member?.verifiedAt ?? null,
      categoryIds: Array.isArray(member?.categoryIds) ? [...new Set(member.categoryIds.map((id) => String(id)))] : [],
    };
  });
}

function normalizeBases(bases) {
  const fallback = deepClone(DEFAULT_BASES);
  if (!Array.isArray(bases) || !bases.length) return fallback;
  const cleaned = bases
    .filter((base) => base?.id && base?.name && !LEGACY_BASE_IDS.has(String(base.id)))
    .map((base) => ({
      id: String(base.id),
      name: base.name,
      battalion: base.battalion ?? "",
      brigade: base.brigade ?? "",
      division: base.division ?? "",
      command: base.command ?? "",
    }));
  return cleaned.length ? cleaned : fallback;
}

function normalizeKitchen(kitchen) {
  if (!kitchen?.inventory || !kitchen?.salads) return makeKitchen();
  const base = makeKitchen();
  const rawFeedback = Array.isArray(kitchen.feedback) ? kitchen.feedback : [];
  const feedback = rawFeedback.map((entry, index) => {
    if (entry?.id) return entry;
    const timePart = String(entry?.time ?? entry?.submittedAt ?? Date.now());
    return { ...entry, id: `fb-${timePart}-${index}` };
  });

  const nextLocations = {
    ...base.locations,
    ...(kitchen.locations || {}),
    fridges: Array.isArray(kitchen.locations?.fridges) ? kitchen.locations.fridges : base.locations.fridges,
    cabinets: Array.isArray(kitchen.locations?.cabinets) ? kitchen.locations.cabinets : base.locations.cabinets,
    coolingName: kitchen.locations?.coolingName ?? base.locations.coolingName,
  };

  return {
    ...base,
    ...kitchen,
    teamCategories: Array.isArray(kitchen.teamCategories) && kitchen.teamCategories.length
      ? kitchen.teamCategories
      : DEFAULT_TEAM_CATEGORIES.map((category) => ({ ...category })),
    locations: nextLocations,
    morningCooks: Array.isArray(kitchen.morningCooks) ? kitchen.morningCooks : [],
    morningTasks: Array.isArray(kitchen.morningTasks) ? kitchen.morningTasks : [],
    prepTasks: Array.isArray(kitchen.prepTasks) ? kitchen.prepTasks : [],
    bulletins: kitchen.bulletins ?? base.bulletins,
    tasks: kitchen.tasks ?? base.tasks,
    feedback,
    auditLog: kitchen.auditLog ?? [],
  };
}

function readCache(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}

function kitchenCacheKey(baseId = "main") {
  return `${SK}-${String(baseId || "main")}`;
}

export async function loadBases() {
  const cached = normalizeBases(readCache(SB));
  try {
    await ensureFirebaseAuth();
    const remote = await loadBasesFromCloud();
    if (!remote?.length) {
      await syncBasesList(cached);
      writeCache(SB, cached);
      return cached;
    }
    const normalized = normalizeBases(remote);
    writeCache(SB, normalized);
    return normalized;
  } catch (error) {
    console.error("[CloudSync] Failed to load bases from Firestore, using cache.", error);
    return cached;
  }
}

export async function saveBases(bases) {
  const normalized = normalizeBases(bases);
  writeCache(SB, normalized);
  try {
    await ensureFirebaseAuth();
    await syncBasesList(normalized);
  } catch (error) {
    console.error("[CloudSync] Failed to save bases to Firestore.", error);
    throw error;
  }
}

export async function loadStaff() {
  const cached = normalizeStaff(readCache(SS));
  try {
    await ensureFirebaseAuth();
    const remote = await loadStaffFromCloud();
    if (!remote?.length) return cached;
    const normalized = normalizeStaff(remote);
    writeCache(SS, normalized);
    return normalized;
  } catch (error) {
    console.error("[CloudSync] Failed to load staff from Firestore, using cache.", error);
    return cached;
  }
}

export async function saveStaff(staff) {
  const normalized = normalizeStaff(staff);
  writeCache(SS, normalized);
  try {
    await ensureFirebaseAuth();
    await syncStaffList(normalized);
  } catch (error) {
    console.error("[CloudSync] Failed to save staff to Firestore.", error);
    throw error;
  }
}

export async function loadKitchen(baseId = "main") {
  const cacheKey = kitchenCacheKey(baseId);
  const cached = normalizeKitchen(readCache(cacheKey));
  try {
    await ensureFirebaseAuth();
    const remote = await loadKitchenConfig(baseId);
    if (!remote) return cached;
    const normalized = normalizeKitchen(remote);
    writeCache(cacheKey, normalized);
    return normalized;
  } catch (error) {
    console.error("[CloudSync] Failed to load kitchen from Firestore, using cache.", error);
    return cached;
  }
}

export async function saveKitchen(kitchen, baseId = "main") {
  const normalized = normalizeKitchen(kitchen);
  writeCache(kitchenCacheKey(baseId), normalized);
  try {
    await ensureFirebaseAuth();
    await saveKitchenConfig(baseId, normalized);
  } catch (error) {
    console.error("[CloudSync] Failed to save kitchen to Firestore.", error);
    throw error;
  }
}
