import { db } from "./firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit as fsLimit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";

export const COLLECTIONS = {
  BASES: "bases", // list of all bases
  KITCHEN: "kitchen", // single doc: kitchen/main
  STAFF: "staff", // one doc per cook
  INVENTORY: "inventory", // one doc per category
  SALADS: "salads", // one doc per salad
  HOT_FOOD: "hotFood", // one doc per dish
  BULLETINS: "bulletins", // one doc per bulletin
  TASKS: "tasks", // bulletin-board daily tasks
  MORNING_TASKS: "morningTasks", // opening checklist items
  AUDIT_LOG: "auditLog", // append-only
  FEEDBACK: "feedback", // soldier ratings
  PREPARATIONS: "preparations", // one doc per prep item
};

function toDocList(snapshot) {
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

function kitchenDoc(baseId = "main") {
  return doc(db, COLLECTIONS.KITCHEN, String(baseId || "main"));
}

function normalizeBasesList(bases) {
  const list = Array.isArray(bases) ? bases : [];
  return list
    .filter((b) => b?.id && b?.name)
    .map((b) => ({
      id: String(b.id),
      name: b.name,
      battalion: b.battalion ?? "",
      brigade: b.brigade ?? "",
      division: b.division ?? "",
      command: b.command ?? "",
    }));
}

// BASES
export async function loadBases() {
  const snap = await getDocs(collection(db, COLLECTIONS.BASES));
  return toDocList(snap);
}

export function subscribeBases(callback) {
  return onSnapshot(collection(db, COLLECTIONS.BASES), (snap) => {
    callback(toDocList(snap));
  });
}

export async function syncBasesList(bases, options = {}) {
  const { pruneMissing = false } = options;
  const normalized = normalizeBasesList(bases);
  const batch = writeBatch(db);

  normalized.forEach((base) => {
    batch.set(doc(db, COLLECTIONS.BASES, base.id), base, { merge: true });
  });

  if (pruneMissing) {
    const existing = await getDocs(collection(db, COLLECTIONS.BASES));
    const existingIds = new Set(existing.docs.map((d) => d.id));
    const incomingIds = new Set(normalized.map((base) => base.id));
    existingIds.forEach((id) => {
      if (!incomingIds.has(id)) {
        batch.delete(doc(db, COLLECTIONS.BASES, id));
      }
    });
  }

  await batch.commit();
  return normalized;
}

// STAFF
export async function loadStaff() {
  const snap = await getDocs(collection(db, COLLECTIONS.STAFF));
  return toDocList(snap);
}

export function subscribeStaff(callback) {
  return onSnapshot(collection(db, COLLECTIONS.STAFF), (snap) => {
    callback(toDocList(snap));
  });
}

export async function addStaff(member) {
  const id = member?.id ? String(member.id) : doc(collection(db, COLLECTIONS.STAFF)).id;
  await setDoc(
    doc(db, COLLECTIONS.STAFF, id),
    {
      ...member,
      id,
      createdAt: member?.createdAt ?? serverTimestamp(),
    },
    { merge: true }
  );
  return id;
}

export async function updateStaff(id, fields) {
  await setDoc(doc(db, COLLECTIONS.STAFF, String(id)), fields, { merge: true });
}

export async function deactivateStaff(id) {
  await setDoc(doc(db, COLLECTIONS.STAFF, String(id)), { active: false }, { merge: true });
}

export async function syncStaffList(staffList, options = {}) {
  const { pruneMissing = false, softDeactivateMissing = false } = options;
  const incoming = Array.isArray(staffList) ? staffList : [];
  const normalized = incoming.map((member) => {
    const id = member?.id ? String(member.id) : doc(collection(db, COLLECTIONS.STAFF)).id;
    return { ...member, id };
  });

  const batch = writeBatch(db);

  normalized.forEach((member) => {
    batch.set(doc(db, COLLECTIONS.STAFF, member.id), member, { merge: true });
  });

  if (pruneMissing || softDeactivateMissing) {
    const existing = await getDocs(collection(db, COLLECTIONS.STAFF));
    const existingIds = new Set(existing.docs.map((d) => d.id));
    const incomingIds = new Set(normalized.map((member) => member.id));

    existingIds.forEach((id) => {
      if (incomingIds.has(id)) return;
      if (pruneMissing) {
        batch.delete(doc(db, COLLECTIONS.STAFF, id));
        return;
      }
      batch.set(
        doc(db, COLLECTIONS.STAFF, id),
        { active: false, deactivatedAt: serverTimestamp() },
        { merge: true }
      );
    });
  }

  await batch.commit();
  return normalized;
}

// KITCHEN CONFIG
export async function loadKitchenConfig(baseId = "main") {
  const snap = await getDoc(kitchenDoc(baseId));
  return snap.exists() ? snap.data() : null;
}

export function subscribeKitchenConfig(callback, baseId = "main") {
  return onSnapshot(kitchenDoc(baseId), (snap) => {
    if (snap.exists()) callback(snap.data());
  });
}

export async function saveKitchenConfig(baseIdOrConfig, maybeConfig) {
  const baseId = maybeConfig === undefined ? "main" : baseIdOrConfig;
  const config = maybeConfig === undefined ? baseIdOrConfig : maybeConfig;
  await setDoc(
    kitchenDoc(baseId),
    { ...(config ?? {}), updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function updateKitchenConfig(baseIdOrFields, maybeFields) {
  const baseId = maybeFields === undefined ? "main" : baseIdOrFields;
  const fields = maybeFields === undefined ? baseIdOrFields : maybeFields;
  await setDoc(
    kitchenDoc(baseId),
    { ...(fields ?? {}), updatedAt: serverTimestamp() },
    { merge: true }
  );
}

// INVENTORY
export async function loadInventory() {
  const snap = await getDocs(collection(db, COLLECTIONS.INVENTORY));
  const result = {};
  snap.docs.forEach((d) => {
    result[d.id] = d.data().items || [];
  });
  return result;
}

export function subscribeInventoryCategory(category, callback) {
  return onSnapshot(doc(db, COLLECTIONS.INVENTORY, String(category)), (snap) => {
    callback(snap.exists() ? snap.data().items || [] : []);
  });
}

export async function saveInventoryCategory(category, items) {
  await setDoc(doc(db, COLLECTIONS.INVENTORY, String(category)), { items: items || [] }, { merge: true });
}

export async function updateInventoryItem(category, items) {
  await setDoc(doc(db, COLLECTIONS.INVENTORY, String(category)), { items: items || [] }, { merge: true });
}

// SALADS
export function subscribeSalads(callback) {
  return onSnapshot(collection(db, COLLECTIONS.SALADS), (snap) => {
    callback(toDocList(snap));
  });
}

export async function addSalad(salad) {
  const id = salad?.id ? String(salad.id) : doc(collection(db, COLLECTIONS.SALADS)).id;
  await setDoc(doc(db, COLLECTIONS.SALADS, id), { ...salad, id }, { merge: true });
  return id;
}

export async function updateSalad(id, fields) {
  await setDoc(doc(db, COLLECTIONS.SALADS, String(id)), fields, { merge: true });
}

export async function deleteSalad(id) {
  await deleteDoc(doc(db, COLLECTIONS.SALADS, String(id)));
}

// HOT FOOD
export function subscribeHotFood(callback) {
  return onSnapshot(collection(db, COLLECTIONS.HOT_FOOD), (snap) => {
    callback(toDocList(snap));
  });
}

export async function addHotDish(dish) {
  const id = dish?.id ? String(dish.id) : doc(collection(db, COLLECTIONS.HOT_FOOD)).id;
  await setDoc(doc(db, COLLECTIONS.HOT_FOOD, id), { ...dish, id }, { merge: true });
  return id;
}

export async function updateHotDish(id, fields) {
  await setDoc(doc(db, COLLECTIONS.HOT_FOOD, String(id)), fields, { merge: true });
}

export async function deleteHotDish(id) {
  await deleteDoc(doc(db, COLLECTIONS.HOT_FOOD, String(id)));
}

// BULLETINS
export function subscribeBulletins(callback) {
  return onSnapshot(collection(db, COLLECTIONS.BULLETINS), (snap) => {
    callback(toDocList(snap));
  });
}

export async function addBulletin(bulletin) {
  const id = bulletin?.id ? String(bulletin.id) : doc(collection(db, COLLECTIONS.BULLETINS)).id;
  await setDoc(doc(db, COLLECTIONS.BULLETINS, id), { ...bulletin, id }, { merge: true });
  return id;
}

export async function updateBulletin(id, fields) {
  await setDoc(doc(db, COLLECTIONS.BULLETINS, String(id)), fields, { merge: true });
}

export async function deleteBulletin(id) {
  await deleteDoc(doc(db, COLLECTIONS.BULLETINS, String(id)));
}

// DAILY TASKS
export function subscribeTasks(callback) {
  return onSnapshot(collection(db, COLLECTIONS.TASKS), (snap) => {
    callback(toDocList(snap));
  });
}

export async function addTask(task) {
  const id = task?.id ? String(task.id) : doc(collection(db, COLLECTIONS.TASKS)).id;
  await setDoc(doc(db, COLLECTIONS.TASKS, id), { ...task, id }, { merge: true });
  return id;
}

export async function updateTask(id, fields) {
  await setDoc(doc(db, COLLECTIONS.TASKS, String(id)), fields, { merge: true });
}

export async function deleteTask(id) {
  await deleteDoc(doc(db, COLLECTIONS.TASKS, String(id)));
}

// MORNING TASKS
export function subscribeMorningTasks(callback) {
  return onSnapshot(collection(db, COLLECTIONS.MORNING_TASKS), (snap) => {
    callback(toDocList(snap));
  });
}

export async function addMorningTask(task) {
  const id = task?.id ? String(task.id) : doc(collection(db, COLLECTIONS.MORNING_TASKS)).id;
  await setDoc(doc(db, COLLECTIONS.MORNING_TASKS, id), { ...task, id }, { merge: true });
  return id;
}

export async function toggleMorningTask(id, done) {
  await setDoc(doc(db, COLLECTIONS.MORNING_TASKS, String(id)), { done: !!done }, { merge: true });
}

export async function deleteMorningTask(id) {
  await deleteDoc(doc(db, COLLECTIONS.MORNING_TASKS, String(id)));
}

// AUDIT LOG
export function subscribeAuditLog(limit = 50, callback) {
  const q = query(collection(db, COLLECTIONS.AUDIT_LOG), orderBy("at", "desc"), fsLimit(limit));
  return onSnapshot(q, (snap) => {
    callback(toDocList(snap));
  });
}

export async function addAuditLog(entry) {
  const id = entry?.id ? String(entry.id) : doc(collection(db, COLLECTIONS.AUDIT_LOG)).id;
  await setDoc(doc(db, COLLECTIONS.AUDIT_LOG, id), { ...entry, id }, { merge: true });
  return id;
}

// FEEDBACK
export function subscribeFeedback(callback) {
  return onSnapshot(collection(db, COLLECTIONS.FEEDBACK), (snap) => {
    callback(toDocList(snap));
  });
}

export async function addFeedback(feedback) {
  const id = feedback?.id ? String(feedback.id) : doc(collection(db, COLLECTIONS.FEEDBACK)).id;
  await setDoc(
    doc(db, COLLECTIONS.FEEDBACK, id),
    { ...feedback, id, submittedAt: feedback?.submittedAt ?? serverTimestamp() },
    { merge: true }
  );
  return id;
}

// PREPARATIONS
export function subscribePreparations(callback) {
  return onSnapshot(collection(db, COLLECTIONS.PREPARATIONS), (snap) => {
    callback(toDocList(snap));
  });
}

export async function addPreparation(preparation) {
  const id = preparation?.id ? String(preparation.id) : doc(collection(db, COLLECTIONS.PREPARATIONS)).id;
  await setDoc(doc(db, COLLECTIONS.PREPARATIONS, id), { ...preparation, id }, { merge: true });
  return id;
}

export async function updatePreparation(id, fields) {
  await setDoc(doc(db, COLLECTIONS.PREPARATIONS, String(id)), fields, { merge: true });
}

export async function deletePreparation(id) {
  await deleteDoc(doc(db, COLLECTIONS.PREPARATIONS, String(id)));
}

// Legacy aliases kept for compatibility with old typo names.
export async function AddPreprations(preparation) {
  return addPreparation(preparation);
}

export function subscribePreprations(callback) {
  return subscribePreparations(callback);
}
