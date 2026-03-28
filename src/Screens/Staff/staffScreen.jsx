import React, { useMemo, useState } from "react";
import { hashPin } from "../../Utils/hash";
import { AVATARS, COLORS, STAFF_COLORS } from "../../Utils/constans";
import { fmtDate, fmtTime, nowISO } from "../../Utils/helpers";
import {
  canCreateBase as canCreateBaseByRole,
  canAssignMembersAcrossBases,
  canManageAppRoles,
  canManageStaffMembers,
  canResetMemberPin,
  canToggleMemberAccess,
  canVerifySergeant,
} from "../../Utils/permissions";
import {
  buildTeamCoverage,
  CATEGORY_PAGE_OPTIONS,
  getMemberCategoryIds,
  getTeamCategories,
  normalizeCategoryId,
} from "../../Utils/workflow";

function roleLabel(role) {
  if (role === "nagad") return "נגד מטבח";
  if (role === "admin") return "מנהל מטבח";
  return "טבח";
}

function accentForIndex(index) {
  return COLORS[index % COLORS.length] ?? "#f2c078";
}

export default function StaffPage({
  staff,
  bases,
  scopeBaseId,
  scopeBaseName,
  onUpdateStaff,
  onAddBase,
  auditLog,
  currentUser,
  kitchenCategories,
  onUpdateCategories,
}) {
  const canManageApp = canManageAppRoles(currentUser);
  const canAddMembers = canManageStaffMembers(currentUser);
  const canCreateBaseSergeant = canManageApp;
  const canAddBase = canCreateBaseByRole(currentUser);
  const canToggleAccess = canToggleMemberAccess(currentUser);
  const canChangePins = canResetMemberPin(currentUser);
  const canVerifyNagad = canVerifySergeant(currentUser);
  const canManageCategories = canAddMembers && typeof onUpdateCategories === "function";

  const [msg, setMsg] = useState("");

  const [newBaseName, setNewBaseName] = useState("");
  const [newBattalion, setNewBattalion] = useState("");
  const [newBrigade, setNewBrigade] = useState("");
  const [newDivision, setNewDivision] = useState("");
  const [newCommand, setNewCommand] = useState("");
  const [isSavingBase, setIsSavingBase] = useState(false);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryPage, setNewCategoryPage] = useState("inventory");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");

  const baseOptions = Array.isArray(bases) ? bases : [];
  const categories = useMemo(() => getTeamCategories({ teamCategories: kitchenCategories }), [kitchenCategories]);
  const [newBaseId, setNewBaseId] = useState(() => baseOptions[0]?.id || "");
  const canAssignBase = !scopeBaseId && canAssignMembersAcrossBases(currentUser);
  const selectedBase =
    (canAssignBase
      ? baseOptions.find((base) => base.id === newBaseId)
      : baseOptions.find((base) => base.id === scopeBaseId)) ??
    baseOptions[0] ??
    null;

  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState(canManageApp ? "nagad" : "cook");
  const [newPin, setNewPin] = useState("");
  const [newPin2, setNewPin2] = useState("");
  const [newHogerId, setNewHogerId] = useState("");
  const [newCategoryIds, setNewCategoryIds] = useState([]);

  const [resetPins, setResetPins] = useState({});
  const [seenHoger, setSeenHoger] = useState({});

  const staffList = useMemo(() => (Array.isArray(staff) ? staff : []), [staff]);
  const staffInScope = useMemo(
    () => staffList.filter((member) => (!scopeBaseId ? true : member?.baseId === scopeBaseId)),
    [scopeBaseId, staffList]
  );

  const managerCount = useMemo(() => staffList.filter((member) => member?.isAppManager).length, [staffList]);
  const categoryCoverage = useMemo(() => buildTeamCoverage(staffList, { teamCategories: categories }), [staffList, categories]);

  const staffIdSet = useMemo(() => new Set(staffInScope.map((member) => member.id)), [staffInScope]);
  const auditInScope = useMemo(
    () => (Array.isArray(auditLog) ? auditLog.filter((entry) => staffIdSet.has(entry.userId)) : []),
    [auditLog, staffIdSet]
  );

  const notify = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 3000);
  };

  const updateCategories = (nextCategories) => {
    if (typeof onUpdateCategories !== "function") return;
    onUpdateCategories(nextCategories);
  };

  const toggleSelectedCategory = (categoryId) => {
    setNewCategoryIds((current) =>
      current.includes(categoryId) ? current.filter((id) => id !== categoryId) : [...current, categoryId]
    );
  };

  const updateMember = (id, patch) => {
    onUpdateStaff(staffList.map((member) => (member.id === id ? { ...member, ...patch } : member)));
  };

  const toggleMemberCategory = (memberId, categoryId) => {
    if (!canAddMembers) return notify("אין הרשאה לשיוך קטגוריות");
    const member = staffList.find((entry) => entry.id === memberId);
    if (!member) return;
    const categoryIds = getMemberCategoryIds(member, categories);
    const nextIds = categoryIds.includes(categoryId)
      ? categoryIds.filter((id) => id !== categoryId)
      : [...categoryIds, categoryId];
    updateMember(memberId, { categoryIds: nextIds });
  };

  const updateCategory = (categoryId, patch) => {
    updateCategories(categories.map((category) => (category.id === categoryId ? { ...category, ...patch } : category)));
  };

  const removeCategory = (categoryId) => {
    if (!canManageCategories) return notify("אין הרשאה להסרת קטגוריות");
    updateCategories(categories.filter((category) => category.id !== categoryId));
    onUpdateStaff(
      staffList.map((member) => ({
        ...member,
        categoryIds: getMemberCategoryIds(member, categories).filter((id) => id !== categoryId),
      }))
    );
    notify("Category removed");
  };

  const addCategory = () => {
    if (!canManageCategories) return notify("אין הרשאה לניהול קטגוריות");
    const label = newCategoryName.trim();
    if (!label) return notify("יש להזין שם לקטגוריה");

    const id = normalizeCategoryId(label);
    if (categories.some((category) => category.id === id || category.label.trim() === label)) {
      return notify("Category already exists");
    }

    updateCategories([
      ...categories,
      {
        id,
        label,
        page: newCategoryPage,
        icon: "📌",
        description: newCategoryDescription.trim(),
        accent: accentForIndex(categories.length),
      },
    ]);
    setNewCategoryName("");
    setNewCategoryPage("inventory");
    setNewCategoryDescription("");
    notify("הקטגוריה נוספה");
  };

  const addBase = async () => {
    if (!canAddBase) return notify("אין הרשאה ליצירת בסיס");
    if (!newBaseName.trim()) return notify("יש להזין שם בסיס");
    if (typeof onAddBase !== "function") return notify("Base creation is unavailable");

    setIsSavingBase(true);
    try {
      const created = await onAddBase(
        {
          name: newBaseName.trim(),
          battalion: newBattalion.trim(),
          brigade: newBrigade.trim(),
          division: newDivision.trim(),
          command: newCommand.trim(),
        },
        currentUser
      );
      setNewBaseName("");
      setNewBattalion("");
      setNewBrigade("");
      setNewDivision("");
      setNewCommand("");
      if (created?.id) setNewBaseId(created.id);
      notify(`הבסיס ${created?.name ?? ""} נוסף`.trim());
    } catch (error) {
      const code = error?.code ? ` (${error.code})` : "";
      notify(`הוספת הבסיס נכשלה${code}`);
    } finally {
      setIsSavingBase(false);
    }
  };

  const addMember = async (forcedRole = null) => {
    if (!canAddMembers) return notify("אין הרשאה להוספת אנשי צוות");
    const roleToCreate = forcedRole ?? newRole;
    if (!canAddMembers) return notify("אין הרשאה להוספת אנשי צוות");
    if (!newName.trim()) return notify("יש להזין שם");
    if (!selectedBase?.id) return notify("יש לבחור בסיס");
    if (!/^\d{4}$/.test(newPin)) return notify("הקוד חייב להיות 4 ספרות");
    if (newPin !== newPin2) return notify("הקודים אינם תואמים");
    if (roleToCreate === "admin" && !canManageApp) return notify("רק מנהל אפליקציה יכול ליצור מנהל מטבח");
    if (roleToCreate === "nagad" && !canManageApp) return notify("רק מנהל אפליקציה יכול ליצור נגד מטבח");
    if (roleToCreate === "nagad" && !newHogerId.trim()) return notify("יש להזין מספר מזהה לנגד מטבח");

    const fallbackCategoryIds =
      roleToCreate === "nagad" || roleToCreate === "admin"
        ? categories.map((category) => category.id)
        : newCategoryIds.length
          ? newCategoryIds
          : categories[0]
            ? [categories[0].id]
            : [];

    const member = {
      id: `s${Date.now()}`,
      name: newName.trim(),
      role: roleToCreate,
      pinHash: await hashPin(newPin),
      avatar: AVATARS[staffList.length % AVATARS.length],
      color: STAFF_COLORS[staffList.length % STAFF_COLORS.length],
      active: true,
      baseId: selectedBase.id,
      baseName: selectedBase.name,
      isAppManager: false,
      hogerId: roleToCreate === "nagad" ? newHogerId.trim() : "",
      isVerifiedNagad: roleToCreate === "nagad" ? false : true,
      canCreateBase: false,
      verifiedBy: "",
      verifiedAt: null,
      categoryIds: fallbackCategoryIds,
      createdAt: nowISO(),
    };

    onUpdateStaff([...staffList, member]);
    setNewName("");
    setNewRole(canManageApp ? "nagad" : "cook");
    setNewPin("");
    setNewPin2("");
    setNewHogerId("");
    setNewCategoryIds([]);
    notify(
      roleToCreate === "nagad"
        ? `${member.name} נוצר כנגד מטבח ממתין לאישור מנהל אפליקציה`
        : `${member.name} נוסף`
    );
  };

  const toggleAccess = (memberId) => {
    if (!canToggleAccess) return notify("אין הרשאה לשנות גישת משתמש");
    const member = staffList.find((entry) => entry.id === memberId);
    if (!member) return;
    updateMember(memberId, { active: !member.active });
  };

  const resetPin = async (memberId) => {
    if (!canChangePins) return notify("אין הרשאה לאיפוס קוד");
    const pair = resetPins[memberId] || { a: "", b: "" };
    if (!/^\d{4}$/.test(pair.a) || !/^\d{4}$/.test(pair.b)) return notify("הקוד חייב להיות 4 ספרות");
    if (pair.a !== pair.b) return notify("הקודים אינם תואמים");
    updateMember(memberId, { pinHash: await hashPin(pair.a) });
    setResetPins((prev) => ({ ...prev, [memberId]: { a: "", b: "" } }));
    notify("הקוד עודכן");
  };

  const toggleManager = (memberId) => {
    if (!canManageApp) return notify("רק מנהל אפליקציה יכול לשנות מנהלים");
    const member = staffList.find((entry) => entry.id === memberId);
    if (!member) return;
    if (member.isAppManager && managerCount <= 1) return notify("חייב להישאר לפחות מנהל אפליקציה אחד");
    updateMember(memberId, { isAppManager: !member.isAppManager });
  };

  const verifyNagad = (memberId) => {
    if (!canVerifyNagad) return notify("רק מנהל אפליקציה יכול לאמת נגדי מטבח");
    const member = staffList.find((entry) => entry.id === memberId);
    if (!member || member.role !== "nagad") return;
    if (!member.hogerId?.trim()) return notify("יש להזין מספר מזהה");
    if (!seenHoger[memberId]) return notify("יש לאשר קודם שבוצעה בדיקת תעודה");
    updateMember(memberId, {
      isVerifiedNagad: true,
      canCreateBase: true,
      verifiedBy: currentUser?.name ?? "מנהל אפליקציה",
      verifiedAt: nowISO(),
      categoryIds: categories.map((category) => category.id),
    });
  };

  const revokeNagad = (memberId) => {
    if (!canVerifyNagad) return notify("רק מנהל אפליקציה יכול לבטל אימות");
    const member = staffList.find((entry) => entry.id === memberId);
    if (!member || member.role !== "nagad") return;
    updateMember(memberId, { isVerifiedNagad: false, canCreateBase: false, verifiedBy: "", verifiedAt: null });
  };

  return (
    <div style={{ padding: 16 }}>
      {msg ? <div style={{ marginBottom: 10, color: "#fca5a5" }}>{msg}</div> : null}
      <div style={{ marginBottom: 12, color: "#94a3b8" }}>תצוגה: {scopeBaseName || "כל הבסיסים"}</div>

      {canManageCategories ? (
        <div style={{ marginBottom: 14, border: "1px solid #334155", padding: 10, borderRadius: 8 }}>
          <div style={{ marginBottom: 8, color: "#fbbf24", fontWeight: 700 }}>קטגוריות אחריות</div>
          <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
            {categoryCoverage.map((category) => (
              <div
                key={category.id}
                style={{
                  border: `1px solid ${category.accent}55`,
                  borderRadius: 8,
                  padding: 10,
                  background: `${category.accent}12`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                  <span style={{ fontSize: "1rem" }}>{category.icon}</span>
                  <input
                    value={category.label}
                    onChange={(event) => updateCategory(category.id, { label: event.target.value })}
                    style={{ flex: 1, minWidth: 120 }}
                  />
                  <select value={category.page} onChange={(event) => updateCategory(category.id, { page: event.target.value })}>
                    {CATEGORY_PAGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button onClick={() => removeCategory(category.id)} style={{ color: "#fca5a5" }}>
                    הסר
                  </button>
                </div>
                <input
                  value={category.description || ""}
                  onChange={(event) => updateCategory(category.id, { description: event.target.value })}
                  placeholder="תיאור קצר"
                  style={{ width: "100%", marginBottom: 6 }}
                />
                <div style={{ fontSize: 12, color: "#94a3b8" }}>
                  {category.count ? `${category.count} משויכים: ${category.names.join(", ")}` : "עדיין אין משויכים"}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <input value={newCategoryName} onChange={(event) => setNewCategoryName(event.target.value)} placeholder="שם קטגוריה חדשה" />
            <select value={newCategoryPage} onChange={(event) => setNewCategoryPage(event.target.value)}>
              {CATEGORY_PAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              value={newCategoryDescription}
              onChange={(event) => setNewCategoryDescription(event.target.value)}
              placeholder="על מה הקטגוריה הזאת אחראית?"
            />
            <button onClick={addCategory}>הוסף קטגוריה</button>
          </div>
        </div>
      ) : null}

      {canAddBase ? (
        <div style={{ marginBottom: 14, border: "1px solid #334155", padding: 10, borderRadius: 8 }}>
          <div style={{ marginBottom: 8, color: "#f43f5e" }}>הוספת בסיס</div>
          <input value={newBaseName} onChange={(event) => setNewBaseName(event.target.value)} placeholder="שם בסיס" style={{ width: "100%", marginBottom: 6 }} />
          <input value={newBattalion} onChange={(event) => setNewBattalion(event.target.value)} placeholder="גדוד" style={{ width: "100%", marginBottom: 6 }} />
          <input value={newBrigade} onChange={(event) => setNewBrigade(event.target.value)} placeholder="חטיבה" style={{ width: "100%", marginBottom: 6 }} />
          <input value={newDivision} onChange={(event) => setNewDivision(event.target.value)} placeholder="אוגדה" style={{ width: "100%", marginBottom: 6 }} />
          <input value={newCommand} onChange={(event) => setNewCommand(event.target.value)} placeholder="פיקוד" style={{ width: "100%", marginBottom: 8 }} />
          <button onClick={() => void addBase()} disabled={isSavingBase}>
            {isSavingBase ? "שומר..." : "צור בסיס"}
          </button>
        </div>
      ) : null}

      {canAddMembers ? (
        <div style={{ marginBottom: 14, border: "1px solid #334155", padding: 10, borderRadius: 8 }}>
          <div style={{ marginBottom: 8, color: "#f43f5e" }}>הוספת איש צוות</div>
          {canCreateBaseSergeant ? (
            <div style={{ marginBottom: 8, fontSize: 12, color: "#38bdf8" }}>
              השתמשו ב-<strong>יצירת נגד מטבח</strong> כדי ליצור נגד ממתין לבסיס הנבחר.
            </div>
          ) : null}
          <input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="שם" style={{ width: "100%", marginBottom: 6 }} />
          <select value={newRole} onChange={(event) => setNewRole(event.target.value)} style={{ width: "100%", marginBottom: 6 }}>
            <option value="cook">טבח</option>
            <option value="admin">מנהל מטבח</option>
            <option value="nagad">נגד מטבח</option>
          </select>
          {canAssignBase ? (
            <select value={newBaseId} onChange={(event) => setNewBaseId(event.target.value)} style={{ width: "100%", marginBottom: 6 }}>
              {baseOptions.map((base) => (
                <option key={base.id} value={base.id}>
                  {base.name}
                </option>
              ))}
            </select>
          ) : null}
          {newRole === "nagad" ? (
            <input value={newHogerId} onChange={(event) => setNewHogerId(event.target.value)} placeholder="מספר מזהה" style={{ width: "100%", marginBottom: 6 }} />
          ) : null}
          <input value={newPin} onChange={(event) => setNewPin(event.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="קוד בן 4 ספרות" style={{ width: "100%", marginBottom: 6 }} />
          <input value={newPin2} onChange={(event) => setNewPin2(event.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="אימות קוד" style={{ width: "100%", marginBottom: 8 }} />

          {categories.length ? (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: "#cbd5e1", marginBottom: 6 }}>שיוך קטגוריות אחריות</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {categories.map((category) => {
                  const selected = newCategoryIds.includes(category.id);
                  return (
                    <button
                      key={category.id}
                      onClick={() => toggleSelectedCategory(category.id)}
                      style={{
                        borderRadius: 999,
                        border: `1px solid ${category.accent}${selected ? "aa" : "44"}`,
                        background: selected ? `${category.accent}33` : "#0f172a",
                        color: selected ? category.accent : "#cbd5e1",
                        padding: "4px 10px",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      {category.icon} {category.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button onClick={() => void addMember()}>הוסף</button>
            {canCreateBaseSergeant ? (
              <button
                onClick={() => {
                  setNewRole("nagad");
                  void addMember("nagad");
                }}
                style={{
                  background: "#0c2a45",
                  border: "1px solid #38bdf855",
                  color: "#38bdf8",
                  borderRadius: 6,
                  padding: "6px 10px",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                יצירת נגד מטבח
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div style={{ marginBottom: 10, color: "#f1f5f9" }}>אנשי צוות</div>
      {staffInScope.map((member) => {
        const pinPair = resetPins[member.id] || { a: "", b: "" };
        const memberCategoryIds = getMemberCategoryIds(member, categories);
        return (
          <div key={member.id} style={{ border: "1px solid #334155", borderRadius: 8, padding: 10, marginBottom: 8 }}>
            <div style={{ fontWeight: 700, color: member.color }}>{member.name}</div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>
              {roleLabel(member.role)} | בסיס: {member.baseName || member.baseId || "-"} | פעיל: {member.active ? "כן" : "לא"}
            </div>
            {member.role === "nagad" ? (
              <div style={{ fontSize: 12, color: "#fda4af" }}>
                מאומת: {member.isVerifiedNagad !== false ? "כן" : "לא"} | יכול ליצור בסיס: {member.canCreateBase !== false ? "כן" : "לא"} | מזהה: {member.hogerId || "חסר"}
              </div>
            ) : null}
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>נוסף בתאריך: {fmtDate(member.createdAt)}</div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {categories.map((category) => {
                const selected = memberCategoryIds.includes(category.id);
                return (
                  <button
                    key={category.id}
                    onClick={() => toggleMemberCategory(member.id, category.id)}
                    disabled={!canAddMembers}
                    style={{
                      borderRadius: 999,
                      border: `1px solid ${category.accent}${selected ? "aa" : "44"}`,
                      background: selected ? `${category.accent}33` : "#0f172a",
                      color: selected ? category.accent : "#cbd5e1",
                      padding: "4px 10px",
                      fontSize: 12,
                      cursor: canAddMembers ? "pointer" : "not-allowed",
                      opacity: canAddMembers ? 1 : 0.6,
                    }}
                  >
                    {category.icon} {category.label}
                  </button>
                );
              })}
            </div>

            {canAssignBase ? (
              <select
                value={member.baseId || ""}
                onChange={(event) =>
                  updateMember(member.id, {
                    baseId: event.target.value,
                    baseName: baseOptions.find((base) => base.id === event.target.value)?.name || event.target.value,
                  })
                }
              >
                {baseOptions.map((base) => (
                  <option key={base.id} value={base.id}>
                    {base.name}
                  </option>
                ))}
              </select>
            ) : null}

            <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {canToggleAccess ? <button onClick={() => toggleAccess(member.id)}>{member.active ? "בטל גישה" : "החזר גישה"}</button> : null}
              {canManageApp ? <button onClick={() => toggleManager(member.id)}>{member.isAppManager ? "הסר מנהל" : "הפוך למנהל"}</button> : null}
            </div>

            {canChangePins ? (
              <div style={{ marginTop: 8 }}>
                <input
                  value={pinPair.a}
                  onChange={(event) => setResetPins((prev) => ({ ...prev, [member.id]: { ...pinPair, a: event.target.value.replace(/\D/g, "").slice(0, 4) } }))}
                  placeholder="קוד חדש"
                  style={{ width: 100, marginInlineEnd: 6 }}
                />
                <input
                  value={pinPair.b}
                  onChange={(event) => setResetPins((prev) => ({ ...prev, [member.id]: { ...pinPair, b: event.target.value.replace(/\D/g, "").slice(0, 4) } }))}
                  placeholder="אימות"
                  style={{ width: 100, marginInlineEnd: 6 }}
                />
                <button onClick={() => void resetPin(member.id)}>שמור קוד</button>
              </div>
            ) : null}

            {canVerifyNagad && member.role === "nagad" && member.isVerifiedNagad === false ? (
              <div style={{ marginTop: 8 }}>
                <label>
                  <input
                    type="checkbox"
                    checked={Boolean(seenHoger[member.id])}
                    onChange={(event) => setSeenHoger((prev) => ({ ...prev, [member.id]: event.target.checked }))}
                  />{" "}
                  בוצעה בדיקת תעודה
                </label>
                <button onClick={() => verifyNagad(member.id)} disabled={!seenHoger[member.id]} style={{ marginInlineStart: 6 }}>
                  אמת נגד
                </button>
              </div>
            ) : null}

            {canVerifyNagad && member.role === "nagad" && member.isVerifiedNagad !== false ? (
              <div style={{ marginTop: 8 }}>
                <button onClick={() => revokeNagad(member.id)}>בטל אימות</button>
              </div>
            ) : null}
          </div>
        );
      })}

      <div style={{ marginTop: 16, color: "#f1f5f9" }}>יומן פעילות</div>
      {auditInScope.length === 0 ? (
        <div style={{ color: "#64748b" }}>אין פעילות</div>
      ) : (
        [...auditInScope]
          .reverse()
          .slice(0, 15)
          .map((entry, index) => (
            <div key={`${entry.userId}-${index}`} style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
              {entry.userName} | {entry.action} | {entry.detail} | {fmtTime(entry.at)}
            </div>
          ))
      )}
    </div>
  );
}
