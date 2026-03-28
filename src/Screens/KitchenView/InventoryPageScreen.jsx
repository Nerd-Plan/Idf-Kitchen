import React, { useEffect, useState } from "react";
import { Box, ChevronDown, ChevronUp, Package, Plus, Truck, X } from "lucide-react";
import IE from "../../Utilites/inlineEdit";
import AdminPageShell from "../Admin/AdminPageShellScreen";
import AuditBadge from "../../Utilites/auditBadge";
import { canEditKitchen, nowISO, round1, stockColor, uid } from "../../Utils/helpers";
import {
  createKitchenAuditEntry,
  getVisibleInventoryKeysForUser,
  hasFullInventoryAccess,
} from "../../Utils/workflow";

function suggestionForItem(item) {
  const qty = Number(item?.qty ?? 0);
  const min = Number(item?.min ?? 0);

  if (qty < min) return { text: "חסר במלאי", tone: "#ef4444" };
  if (qty < min * 1.4) return { text: "כדאי להשלים", tone: "#f59e0b" };
  return { text: "מלאי תקין", tone: "#22c55e" };
}

export default function InventoryPage({
  data,
  user,
  staff,
  setData,
  editMode,
  onToggleEdit,
  onReset,
  onBack,
  onLogout,
  saved,
  onOpenSearch,
  onExportStatus,
}) {
  const isAdmin = canEditKitchen(user);
  const categories = data.inventoryCategories || [];
  const visibleInventoryKeys = getVisibleInventoryKeysForUser(user, data);
  const visibleCategories = categories.filter((category) => visibleInventoryKeys.includes(category.key));
  const canManageAllInventory = hasFullInventoryAccess(user, data);
  const canSeeCooling = visibleInventoryKeys.includes("cooling");
  const [openSections, setOpenSections] = useState({});

  useEffect(() => {
    setOpenSections((current) => {
      const next = {};

      if (canSeeCooling) {
        next.cooling = current.cooling ?? true;
      }

      visibleCategories.forEach((category) => {
        next[category.key] = current[category.key] ?? true;
      });

      return next;
    });
  }, [canSeeCooling, visibleCategories]);

  const updateData = (fn) => {
    if (!isAdmin) return;
    setData((current) => ({ ...current, ...fn(current) }));
  };

  const updateInventory = (categoryKey, itemId, patch, action = "עדכון מלאי") => {
    if (!isAdmin) return;
    setData((current) => {
      const item = (current.inventory?.[categoryKey] || []).find((entry) => entry.id === itemId);
      return {
        ...current,
        inventory: {
          ...current.inventory,
          [categoryKey]: (current.inventory?.[categoryKey] || []).map((entry) =>
            entry.id === itemId
              ? { ...entry, ...patch, lastEditBy: user.id, lastEditAt: nowISO() }
              : entry
          ),
        },
        auditLog: [
          ...(current.auditLog || []).slice(-99),
          createKitchenAuditEntry(
            user,
            action,
            `${item?.name || "פריט"} • ${patch.qty ?? item?.qty ?? 0} ${item?.unit ?? ""}`
          ),
        ],
      };
    });
  };

  const deleteInventoryItem = (categoryKey, itemId) => {
    if (!isAdmin) return;
    updateData((current) => ({
      inventory: {
        ...current.inventory,
        [categoryKey]: (current.inventory?.[categoryKey] || []).filter((entry) => entry.id !== itemId),
      },
    }));
  };

  const addInventoryItem = (categoryKey) => {
    if (!isAdmin) return;

    const units = {
      vegetables: "ק״ג",
      dairy: "ליטר",
      eggs: "יח׳",
      poultry: "ק״ג",
      frozenMeat: "ק״ג",
      cooling: "ק״ג",
    };

    const nextItem = {
      id: uid(),
      name: "פריט חדש",
      qty: 1,
      unit: units[categoryKey] || "ק״ג",
      min: 1,
      lastEditBy: user.id,
      lastEditAt: nowISO(),
    };

    if (categoryKey === "cooling") {
      nextItem.defrostDate = nowISO();
    }

    updateData((current) => ({
      inventory: {
        ...current.inventory,
        [categoryKey]: [...(current.inventory?.[categoryKey] || []), nextItem],
      },
    }));
  };

  const markShortage = (categoryKey, item) => {
    updateInventory(categoryKey, item.id, { qty: 0 }, "דיווח חוסר");
  };

  const receiveSupply = (categoryKey, item) => {
    const nextQty = round1(Math.max(Number(item.qty ?? 0) + 3, Number(item.min ?? 0) * 2));
    updateInventory(categoryKey, item.id, { qty: nextQty }, "קליטת אספקה");
  };

  const addCoolingContainer = () => {
    if (!isAdmin) return;
    addInventoryItem("cooling");
  };

  const reportAllLowStock = () => {
    if (!isAdmin) return;
    Object.entries(data.inventory || {}).forEach(([categoryKey, items]) => {
      (Array.isArray(items) ? items : [])
        .filter((item) => Number(item.qty ?? 0) < Number(item.min ?? 0))
        .forEach((item) => markShortage(categoryKey, item));
    });
  };

  const receiveGeneralSupply = () => {
    if (!isAdmin) return;
    Object.entries(data.inventory || {}).forEach(([categoryKey, items]) => {
      (Array.isArray(items) ? items : [])
        .filter((item) => Number(item.qty ?? 0) < Number(item.min ?? 0))
        .forEach((item) => receiveSupply(categoryKey, item));
    });
  };

  const toggleSection = (key) => {
    setOpenSections((current) => ({
      ...current,
      [key]: !(current[key] ?? true),
    }));
  };

  const coolingItems = data.inventory?.cooling || [];
  const isCoolingOpen = openSections.cooling ?? true;

  return (
    <AdminPageShell
      title="מלאי ואספקה"
      icon={Package}
      accent="#818cf8"
      onBack={onBack}
      onLogout={onLogout}
      user={user}
      saved={saved}
      editMode={editMode}
      onToggleEdit={onToggleEdit}
      onReset={onReset}
      isAdmin={isAdmin}
      onOpenSearch={onOpenSearch}
      onExportStatus={onExportStatus}
    >
      <div style={{ display: "flex", gap: 7, marginBottom: 11, flexWrap: "wrap" }}>
        {isAdmin && canManageAllInventory ? (
          <>
            <button
              onClick={reportAllLowStock}
              className="button-secondary"
              style={{ color: "#ef4444", borderColor: "#ef444455" }}
            >
              <X size={11} /> דווח חסרים
            </button>
            <button
              onClick={receiveGeneralSupply}
              className="button-secondary"
              style={{ color: "#22c55e", borderColor: "#22c55e55" }}
            >
              <Truck size={11} /> קליטת אספקה
            </button>
            <button
              onClick={addCoolingContainer}
              className="button-secondary"
              style={{ color: "#a855f7", borderColor: "#a855f755" }}
            >
              <Plus size={11} /> הוסף לקירור
            </button>
          </>
        ) : null}
      </div>

      {canSeeCooling ? (
        <div
          style={{
            background: "linear-gradient(135deg,#1a0a2e,#0f1a2e)",
            border: `2px solid ${editMode ? "#fbbf24" : "#7c3aed"}`,
            borderRadius: 11,
            padding: 14,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: isCoolingOpen ? 11 : 0,
              borderBottom: "2px solid #7c3aed44",
              paddingBottom: 7,
            }}
          >
            <Box size={14} color="#a855f7" />
            <IE
              value={data.locations?.coolingName || "מיכל קירור"}
              canEdit={editMode && isAdmin}
              onSave={(value) =>
                updateData((current) => ({
                  locations: { ...current.locations, coolingName: value },
                }))
              }
              style={{ fontSize: "0.86rem", fontWeight: 700, color: "#f1f5f9", flex: 1 }}
            />
            <span
              className="pill-chip pill-chip--compact"
              style={{ color: "#e9d5ff", borderColor: "#a855f755", background: "#a855f71a" }}
            >
              {coolingItems.length} פריטים
            </span>
            <button
              onClick={() => toggleSection("cooling")}
              className="button-secondary"
              style={{ minHeight: 30, padding: "0 10px", color: "#f1f5f9" }}
              aria-label={isCoolingOpen ? "סגור קירור" : "פתח קירור"}
            >
              {isCoolingOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {isCoolingOpen ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {isAdmin ? (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    onClick={addCoolingContainer}
                    className="button-secondary"
                    style={{ minHeight: 36, padding: "0 12px", color: "#a855f7", borderColor: "#a855f755" }}
                  >
                    <Plus size={12} /> הוסף פריט לקירור
                  </button>
                </div>
              ) : null}

              <div className="responsive-grid responsive-grid--three" style={{ gap: 7 }}>
              {coolingItems.map((item) => {
                const suggestion = suggestionForItem(item);
                const step = 0.5;

                return (
                  <div
                    key={item.id}
                    style={{
                      background: "#0f0a1f",
                      borderRadius: 8,
                      padding: 8,
                      textAlign: "center",
                      border: "1px solid #7c3aed33",
                      position: "relative",
                    }}
                  >
                    <IE
                      value={item.name}
                      canEdit={isAdmin}
                      onSave={(value) => updateInventory("cooling", item.id, { name: value }, "שינוי שם פריט")}
                      style={{
                        fontSize: "0.74rem",
                        fontWeight: 700,
                        color: "#e2e8f0",
                        display: "block",
                        marginBottom: 6,
                      }}
                    />

                    <div
                      className="pill-chip pill-chip--compact"
                      style={{
                        marginBottom: 6,
                        color: suggestion.tone,
                        borderColor: `${suggestion.tone}66`,
                        background: `${suggestion.tone}18`,
                      }}
                    >
                      {suggestion.text}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 3,
                        marginBottom: 6,
                        direction: "ltr",
                      }}
                    >
                      <button
                        onClick={() =>
                          updateInventory(
                            "cooling",
                            item.id,
                            { qty: round1(Math.max(0, item.qty - step)) },
                            "הפחתת מלאי"
                          )
                        }
                        disabled={!isAdmin}
                        style={{
                          background: "#ef444422",
                          border: "1px solid #ef444444",
                          borderRadius: 3,
                          color: "#ef4444",
                          width: 17,
                          height: 17,
                          cursor: isAdmin ? "pointer" : "not-allowed",
                          fontSize: "0.78rem",
                          opacity: isAdmin ? 1 : 0.4,
                        }}
                      >
                        −
                      </button>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          color: "#a855f7",
                          fontFamily: "monospace",
                          minWidth: 44,
                          textAlign: "center",
                        }}
                      >
                        {item.qty} ק״ג
                      </span>
                      <button
                        onClick={() =>
                          updateInventory("cooling", item.id, { qty: round1(item.qty + step) }, "הגדלת מלאי")
                        }
                        disabled={!isAdmin}
                        style={{
                          background: "#22c55e22",
                          border: "1px solid #22c55e44",
                          borderRadius: 3,
                          color: "#22c55e",
                          width: 17,
                          height: 17,
                          cursor: isAdmin ? "pointer" : "not-allowed",
                          fontSize: "0.78rem",
                          opacity: isAdmin ? 1 : 0.4,
                        }}
                      >
                        +
                      </button>
                    </div>

                    <div className="responsive-grid responsive-grid--three" style={{ gap: 6, marginBottom: 5 }}>
                      <button
                        onClick={() => markShortage("cooling", item)}
                        disabled={!isAdmin}
                        className="button-secondary"
                        style={{
                          minHeight: 32,
                          color: "#ef4444",
                          borderColor: "#ef444455",
                          opacity: isAdmin ? 1 : 0.5,
                        }}
                      >
                        חוסר
                      </button>
                      <button
                        onClick={() => receiveSupply("cooling", item)}
                        disabled={!isAdmin}
                        className="button-secondary"
                        style={{
                          minHeight: 32,
                          color: "#22c55e",
                          borderColor: "#22c55e55",
                          opacity: isAdmin ? 1 : 0.5,
                        }}
                      >
                        אספקה
                      </button>
                      {isAdmin ? (
                        <button
                          onClick={() => deleteInventoryItem("cooling", item.id)}
                          className="button-secondary"
                          style={{
                            minHeight: 32,
                            color: "#fecaca",
                            borderColor: "#ef444477",
                            background: "#ef44441a",
                          }}
                        >
                          <X size={12} /> מחק פריט
                        </button>
                      ) : null}
                    </div>

                    <AuditBadge userId={item.lastEditBy} at={item.lastEditAt} staff={staff} />
                  </div>
                );
              })}

                {coolingItems.length === 0 ? (
                  <p style={{ padding: 8, textAlign: "center", color: "#6b7280", fontSize: "0.7rem" }}>
                    {isAdmin ? "אין פריטים בקירור. השתמש בכפתור 'הוסף פריט לקירור'." : "אין פריטים להצגה"}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="responsive-grid responsive-grid--two" style={{ gap: 11 }}>
        {visibleCategories.map((category) => {
          const categoryItems = data.inventory?.[category.key] || [];
          const isCategoryOpen = openSections[category.key] ?? true;

          return (
            <div
              key={category.key}
              style={{
                background: "linear-gradient(135deg,#1e293b,#172032)",
                border: "1px solid #334155",
                borderRadius: 11,
                padding: 14,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: isCategoryOpen ? 9 : 0,
                  borderBottom: `2px solid ${category.accent}`,
                  paddingBottom: 7,
                }}
              >
                <Package size={11} color={category.accent} />
                <IE
                  value={category.label}
                  canEdit={editMode && isAdmin}
                  onSave={(value) =>
                    updateData((current) => ({
                      inventoryCategories: current.inventoryCategories.map((entry) =>
                        entry.key === category.key ? { ...entry, label: value } : entry
                      ),
                    }))
                  }
                  style={{ fontSize: "0.84rem", fontWeight: 700, color: "#f1f5f9", flex: 1 }}
                />
                <span
                  className="pill-chip pill-chip--compact"
                  style={{
                    color: category.accent,
                    borderColor: `${category.accent}55`,
                    background: `${category.accent}1a`,
                  }}
                >
                  {categoryItems.length} פריטים
                </span>
                <button
                  onClick={() => toggleSection(category.key)}
                  className="button-secondary"
                  style={{ minHeight: 30, padding: "0 10px", color: "#f1f5f9" }}
                  aria-label={isCategoryOpen ? `סגור ${category.label}` : `פתח ${category.label}`}
                >
                  {isCategoryOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {isCategoryOpen ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {isAdmin ? (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        onClick={() => addInventoryItem(category.key)}
                        className="button-secondary"
                        style={{ minHeight: 36, padding: "0 12px", color: category.accent, borderColor: `${category.accent}55` }}
                      >
                        <Plus size={12} /> הוסף פריט
                      </button>
                    </div>
                  ) : null}

                  {categoryItems.map((item) => {
                    const color = stockColor(item.qty, item.min);
                    const step = item.unit === "יח׳" ? 5 : 0.5;
                    const suggestion = suggestionForItem(item);

                    return (
                      <div
                        key={item.id}
                        style={{
                          background: "#0f172a",
                          borderRadius: 6,
                          padding: "6px 8px",
                          border: `1px solid ${color}33`,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 4,
                            marginBottom: 3,
                          }}
                        >
                          <IE
                            value={item.name}
                            canEdit={isAdmin}
                            onSave={(value) => updateInventory(category.key, item.id, { name: value }, "שינוי שם פריט")}
                            style={{ fontSize: "0.73rem", color: "#cbd5e1" }}
                          />
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                              direction: "ltr",
                              flexShrink: 0,
                            }}
                          >
                            <button
                              onClick={() =>
                                updateInventory(
                                  category.key,
                                  item.id,
                                  { qty: round1(Math.max(0, item.qty - step)) },
                                  "הפחתת מלאי"
                                )
                              }
                              disabled={!isAdmin}
                              style={{
                                background: "#ef444422",
                                border: "1px solid #ef444433",
                                borderRadius: 3,
                                color: "#ef4444",
                                width: 17,
                                height: 17,
                                cursor: isAdmin ? "pointer" : "not-allowed",
                                fontSize: "0.78rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                opacity: isAdmin ? 1 : 0.4,
                              }}
                            >
                              −
                            </button>
                            <span
                              style={{
                                fontSize: "0.76rem",
                                fontWeight: 700,
                                color,
                                fontFamily: "monospace",
                                minWidth: 48,
                                textAlign: "center",
                              }}
                            >
                              {item.qty} {item.unit}
                            </span>
                            <button
                              onClick={() =>
                                updateInventory(category.key, item.id, { qty: round1(item.qty + step) }, "הגדלת מלאי")
                              }
                              disabled={!isAdmin}
                              style={{
                                background: "#22c55e22",
                                border: "1px solid #22c55e33",
                                borderRadius: 3,
                                color: "#22c55e",
                                width: 17,
                                height: 17,
                                cursor: isAdmin ? "pointer" : "not-allowed",
                                fontSize: "0.78rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                opacity: isAdmin ? 1 : 0.4,
                              }}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div
                          className="pill-chip pill-chip--compact"
                          style={{
                            marginBottom: 6,
                            color: suggestion.tone,
                            borderColor: `${suggestion.tone}66`,
                            background: `${suggestion.tone}18`,
                          }}
                        >
                          {suggestion.text}
                        </div>

                        <div className="responsive-grid responsive-grid--three" style={{ gap: 6, marginBottom: 6 }}>
                          <button
                            onClick={() => markShortage(category.key, item)}
                            disabled={!isAdmin}
                            className="button-secondary"
                            style={{
                              minHeight: 32,
                              color: "#ef4444",
                              borderColor: "#ef444455",
                              opacity: isAdmin ? 1 : 0.5,
                            }}
                          >
                            חוסר
                          </button>
                          <button
                            onClick={() => receiveSupply(category.key, item)}
                            disabled={!isAdmin}
                            className="button-secondary"
                            style={{
                              minHeight: 32,
                              color: "#22c55e",
                              borderColor: "#22c55e55",
                              opacity: isAdmin ? 1 : 0.5,
                            }}
                          >
                            אספקה
                          </button>
                          {isAdmin ? (
                            <button
                              onClick={() => deleteInventoryItem(category.key, item.id)}
                              className="button-secondary"
                              style={{
                                minHeight: 32,
                                color: "#fecaca",
                                borderColor: "#ef444477",
                                background: "#ef44441a",
                              }}
                            >
                              <X size={12} /> מחק פריט
                            </button>
                          ) : null}
                        </div>

                        <AuditBadge userId={item.lastEditBy} at={item.lastEditAt} staff={staff} />
                      </div>
                    );
                  })}

                  {categoryItems.length === 0 ? (
                    <p style={{ padding: 8, textAlign: "center", color: "#64748b", fontSize: "0.7rem" }}>
                      {isAdmin ? "אין פריטים בקטגוריה. השתמש בכפתור 'הוסף פריט'." : "אין פריטים להצגה"}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </AdminPageShell>
  );
}
