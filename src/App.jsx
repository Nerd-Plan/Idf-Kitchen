import React, { useState, useCallback, useEffect, useRef, lazy, Suspense } from "react";
import { loadBases, loadKitchen, loadStaff, saveBases, saveKitchen, saveStaff } from "./Utils/storage";
import { DEFAULT_BASES, DEFAULT_STAFF, DEFAULT_TEAM_CATEGORIES, makeKitchen } from "./Utils/defaultdata";
import { APP_NAME } from "./Utils/branding";
import { warmTheme } from "./Utils/uiTheme";
import { hashPin } from "./Utils/hash";
import { AVATARS, STAFF_COLORS } from "./Utils/constans";
import { isAppManager as isAppManagerUser } from "./Utils/permissions";

const LoginScreen = lazy(() => import("./Screens/Login/loginScreen"));
const SoldierView = lazy(() => import("./Screens/Soldier/soldierScreen"));
const CookView = lazy(() => import("./Screens/KitchenView/cookViewScreen"));
const AdminDashboard = lazy(() => import("./Screens/Admin/AdminDashboard"));

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function attachStaffBases(staffList, baseList) {
  const bases = Array.isArray(baseList) && baseList.length ? baseList : DEFAULT_BASES;
  const fallback = bases[0] ?? { id: "main", name: "Main Base" };
  return (Array.isArray(staffList) ? staffList : []).map((member, index) => {
    const assigned = bases.find((base) => base.id === member?.baseId) ?? bases[index % bases.length] ?? fallback;
    const isNagad = member?.role === "nagad";
    return {
      ...member,
      baseId: member?.baseId ?? assigned.id,
      baseName: member?.baseName ?? assigned.name,
      canCreateBase: isNagad ? member?.canCreateBase ?? (member?.isVerifiedNagad !== false) : false,
    };
  });
}

function slugifyBaseId(value) {
  const text = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[/?#]+/g, "")
    .replace(/\[/g, "")
    .replace(/\]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");
  return text ? `base-${text}` : `base-${Date.now()}`;
}

function snapshot(value) {
  return JSON.stringify(value);
}

function formatCloudError(context, error) {
  const code = error?.code ? ` (${error.code})` : "";
  const rawCode = String(error?.code || "");
  if (rawCode.startsWith("auth/")) {
    return `${context} failed${code}. Configure Firebase Authentication provider/token.`;
  }
  if (rawCode === "permission-denied" || rawCode === "firestore/permission-denied") {
    return `${context} failed${code}. Check Firestore rules and roles/{uid}.`;
  }
  return `${context} failed${code}.`;
}

const KITCHEN_SYNC_DEBOUNCE_MS = 700;
const STAFF_SYNC_DEBOUNCE_MS = 600;

export default function App() {
  const [user, setUser] = useState(null);
  const [bases, setBases] = useState(() => clone(DEFAULT_BASES));
  const [activeBaseId, setActiveBaseId] = useState(() => DEFAULT_BASES[0]?.id ?? "main");
  const [staff, setStaff] = useState(() => clone(DEFAULT_STAFF));
  const [data, setData] = useState(() => makeKitchen());
  const [isReady, setIsReady] = useState(false);
  const [isBaseSwitching, setIsBaseSwitching] = useState(false);
  const [cloudError, setCloudError] = useState("");
  const kitchenSyncTimerRef = useRef(null);
  const staffSyncTimerRef = useRef(null);
  const lastKitchenSnapshotRef = useRef("");
  const lastKitchenBaseIdRef = useRef("");
  const lastStaffSnapshotRef = useRef("");

  useEffect(() => {
    document.title = APP_NAME;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrateAppState() {
      try {
        const loadedBases = await loadBases();
        const initialBaseId = loadedBases[0]?.id ?? DEFAULT_BASES[0]?.id ?? "main";
        const [loadedStaff, loadedKitchen] = await Promise.all([loadStaff(), loadKitchen(initialBaseId)]);
        const normalizedStaff = attachStaffBases(loadedStaff, loadedBases);
        if (cancelled) return;
        setBases(loadedBases);
        setActiveBaseId(initialBaseId);
        setStaff(normalizedStaff);
        setData(loadedKitchen);
        lastKitchenBaseIdRef.current = initialBaseId;
        lastKitchenSnapshotRef.current = snapshot(loadedKitchen);
        lastStaffSnapshotRef.current = snapshot(normalizedStaff);
      } catch (error) {
        if (!cancelled) {
          setCloudError(formatCloudError("Cloud init", error));
        }
      } finally {
        if (!cancelled) setIsReady(true);
      }
    }

    void hydrateAppState();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isReady || !activeBaseId || isBaseSwitching) return undefined;
    const nextSnapshot = snapshot(data);

    if (lastKitchenBaseIdRef.current !== activeBaseId) {
      lastKitchenBaseIdRef.current = activeBaseId;
      lastKitchenSnapshotRef.current = nextSnapshot;
      return undefined;
    }
    if (lastKitchenSnapshotRef.current === nextSnapshot) return undefined;

    if (kitchenSyncTimerRef.current) clearTimeout(kitchenSyncTimerRef.current);
    let cancelled = false;
    kitchenSyncTimerRef.current = setTimeout(async () => {
      try {
        await saveKitchen(data, activeBaseId);
        if (cancelled) return;
        lastKitchenSnapshotRef.current = nextSnapshot;
        setCloudError("");
      } catch (error) {
        if (cancelled) return;
        setCloudError(formatCloudError("Cloud sync", error));
      }
    }, KITCHEN_SYNC_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      if (kitchenSyncTimerRef.current) clearTimeout(kitchenSyncTimerRef.current);
    };
  }, [activeBaseId, data, isBaseSwitching, isReady]);

  useEffect(() => {
    if (!isReady) return undefined;
    const nextSnapshot = snapshot(staff);
    if (lastStaffSnapshotRef.current === nextSnapshot) return undefined;

    if (staffSyncTimerRef.current) clearTimeout(staffSyncTimerRef.current);
    let cancelled = false;
    staffSyncTimerRef.current = setTimeout(async () => {
      try {
        await saveStaff(staff);
        if (cancelled) return;
        lastStaffSnapshotRef.current = nextSnapshot;
        setCloudError("");
      } catch (error) {
        if (cancelled) return;
        setCloudError(formatCloudError("Cloud sync", error));
      }
    }, STAFF_SYNC_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      if (staffSyncTimerRef.current) clearTimeout(staffSyncTimerRef.current);
    };
  }, [staff, isReady]);

  useEffect(() => {
    return () => {
      if (kitchenSyncTimerRef.current) clearTimeout(kitchenSyncTimerRef.current);
      if (staffSyncTimerRef.current) clearTimeout(staffSyncTimerRef.current);
    };
  }, []);

  const login = useCallback(
    async (incomingUser) => {
      if (!incomingUser?.id || !incomingUser?.role || !incomingUser?.baseId) return;
      if (incomingUser.role === "nagad" && incomingUser.isVerifiedNagad === false) return;

      setIsBaseSwitching(true);
      try {
        const selectedBase = bases.find((base) => base.id === incomingUser.baseId);
        const kitchenForBase = await loadKitchen(incomingUser.baseId);
        setActiveBaseId(incomingUser.baseId);
        setData(kitchenForBase);
        lastKitchenBaseIdRef.current = incomingUser.baseId;
        lastKitchenSnapshotRef.current = snapshot(kitchenForBase);
        setUser({
          ...incomingUser,
          baseName: incomingUser.baseName ?? selectedBase?.name ?? incomingUser.baseId,
        });
        setCloudError("");
      } catch (error) {
        setCloudError(formatCloudError("Base load", error));
      } finally {
        setIsBaseSwitching(false);
      }
    },
    [bases]
  );

  const logout = useCallback(() => setUser(null), []);

  const addFeedback = useCallback((rating) => {
    setData((current) => ({ ...current, feedback: [...(current.feedback || []), rating] }));
  }, []);

  const upgradePinHash = useCallback(
    async (memberId, plainPin) => {
      if (!memberId || !/^\d{4}$/.test(String(plainPin || ""))) return;
      const nextHash = await hashPin(String(plainPin));
      const nextStaff = staff.map((member) => (member.id === memberId ? { ...member, pinHash: nextHash } : member));
      const changed = nextStaff.some((member, index) => member.pinHash !== staff[index]?.pinHash);
      if (!changed) return;
      lastStaffSnapshotRef.current = snapshot(nextStaff);
      setStaff(nextStaff);
      try {
        await saveStaff(nextStaff);
        setCloudError("");
      } catch (error) {
        setCloudError(formatCloudError("PIN upgrade sync", error));
      }
    },
    [staff]
  );

  const addBase = useCallback(
    async (incomingBase) => {
      const cleanName = String(incomingBase?.name || "").trim();
      if (!cleanName) throw new Error("missing-base-name");

      const preparedBase = {
        id: slugifyBaseId(incomingBase?.id || cleanName),
        name: cleanName,
        battalion: String(incomingBase?.battalion || "").trim(),
        brigade: String(incomingBase?.brigade || "").trim(),
        division: String(incomingBase?.division || "").trim(),
        command: String(incomingBase?.command || "").trim(),
      };

      const existing = bases.find((base) => base.id === preparedBase.id);
      const createdBase = existing ? { ...existing, ...preparedBase } : preparedBase;
      const nextBases = existing ? bases.map((base) => (base.id === preparedBase.id ? createdBase : base)) : [...bases, createdBase];

      setBases(nextBases);
      setActiveBaseId(createdBase.id);
      try {
        await saveBases(nextBases);
        if (!existing) {
          const freshKitchen = makeKitchen();
          await saveKitchen(freshKitchen, createdBase.id);
          setData(freshKitchen);
          lastKitchenBaseIdRef.current = createdBase.id;
          lastKitchenSnapshotRef.current = snapshot(freshKitchen);
        }
        setCloudError("");
      } catch (error) {
        setCloudError(formatCloudError("Base save", error));
        throw error;
      }

      return createdBase;
    },
    [bases]
  );

  const createBaseWithNagad = useCallback(
    async ({ base, sergeant }) => {
      const baseName = String(base?.name || "").trim();
      const sergeantName = String(sergeant?.name || "").trim();
      const sergeantId = String(sergeant?.hogerId || "").trim();
      const pin = String(sergeant?.pin || "").trim();

      if (!baseName) throw new Error("missing-base-name");
      if (!sergeantName) throw new Error("missing-sergeant-name");
      if (!sergeantId) throw new Error("missing-sergeant-id");
      if (!/^\d{4}$/.test(pin)) throw new Error("invalid-pin");
      if (bases.some((baseItem) => String(baseItem?.name || "").trim().toLowerCase() === baseName.toLowerCase())) {
        throw new Error("base-name-exists");
      }

      const createdBase = await addBase({
        name: baseName,
        battalion: String(base?.battalion || "").trim(),
        brigade: String(base?.brigade || "").trim(),
        division: String(base?.division || "").trim(),
        command: String(base?.command || "").trim(),
      });

      const baseNagadExists = staff.some(
        (member) => member?.role === "nagad" && member?.active && member?.baseId === createdBase.id
      );
      if (baseNagadExists) throw new Error("base-nagad-exists");

      const createdAt = new Date().toISOString();
      const member = {
        id: `s${Date.now()}`,
        name: sergeantName,
        role: "nagad",
        pinHash: await hashPin(pin),
        avatar: AVATARS[staff.length % AVATARS.length] ?? "🎖️",
        color: STAFF_COLORS[staff.length % STAFF_COLORS.length] ?? "#f28d61",
        active: true,
        baseId: createdBase.id,
        baseName: createdBase.name,
        isAppManager: false,
        hogerId: sergeantId,
        isVerifiedNagad: true,
        canCreateBase: true,
        verifiedBy: "Self setup",
        verifiedAt: createdAt,
        categoryIds: DEFAULT_TEAM_CATEGORIES.map((category) => category.id),
        createdAt,
      };

      const nextBasesForStaff = bases.some((baseItem) => baseItem.id === createdBase.id)
        ? bases
        : [...bases, createdBase];
      const nextStaff = attachStaffBases([...staff, member], nextBasesForStaff);
      lastStaffSnapshotRef.current = snapshot(nextStaff);
      setStaff(nextStaff);
      try {
        await saveStaff(nextStaff);
        setCloudError("");
      } catch (error) {
        setCloudError(formatCloudError("Staff save", error));
        throw error;
      }

      return member;
    },
    [addBase, bases, staff]
  );

  const cloudBanner = cloudError ? (
    <div
      style={{
        position: "fixed",
        top: "calc(env(safe-area-inset-top, 0px) + 8px)",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        background: warmTheme.backgrounds.alert,
        color: "#ffd4be",
        border: `1px solid ${warmTheme.colors.danger}`,
        borderRadius: 12,
        padding: "9px 13px",
        fontSize: "0.75rem",
        direction: "ltr",
        boxShadow: warmTheme.shadows.soft,
      }}
    >
      {cloudError}
    </div>
  ) : null;

  const renderScreenLoader = (message = "Loading...") => (
    <div
      className="app-shell warm-elevated"
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        direction: "rtl",
        fontFamily: warmTheme.fontFamily,
        background: warmTheme.backgrounds.app,
        color: warmTheme.colors.text,
      }}
    >
      {message}
    </div>
  );

  if (!isReady || isBaseSwitching) {
    return renderScreenLoader("Loading base data...");
  }

  if (!user) {
    return (
      <Suspense fallback={renderScreenLoader()}>
        {cloudBanner}
        <LoginScreen
          onLogin={login}
          staff={staff}
          bases={bases}
          initialBaseId={activeBaseId}
          onCreateBaseWithNagad={createBaseWithNagad}
          onUpgradePinHash={upgradePinHash}
          onResetStaff={() => {
            const fallbackStaff = attachStaffBases(clone(DEFAULT_STAFF), bases);
            lastStaffSnapshotRef.current = snapshot(fallbackStaff);
            setStaff(fallbackStaff);
            void saveStaff(fallbackStaff);
          }}
        />
      </Suspense>
    );
  }

  if (user.role === "soldier") {
    return (
      <Suspense fallback={renderScreenLoader()}>
        {cloudBanner}
        <SoldierView data={data} user={user} onLogout={logout} onRate={addFeedback} />
      </Suspense>
    );
  }

  if (user.role === "cook" && !isAppManagerUser(user)) {
    return (
      <Suspense fallback={renderScreenLoader()}>
        {cloudBanner}
        <CookView data={data} user={user} staff={staff} setData={setData} onLogout={logout} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={renderScreenLoader()}>
      {cloudBanner}
      <AdminDashboard
        data={data}
        user={user}
        staff={staff}
        bases={bases}
        setData={setData}
        setStaff={setStaff}
        onAddBase={addBase}
        onLogout={logout}
      />
    </Suspense>
  );
}
