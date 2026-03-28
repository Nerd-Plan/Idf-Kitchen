import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Flame, Plus, X } from "lucide-react";
import IE from "../../Utilites/inlineEdit";
import AdminPageShell from "../Admin/AdminPageShellScreen";
import AuditBadge from "../../Utilites/auditBadge";
import { canEditKitchen, nowISO, uid } from "../../Utils/helpers";
import { createKitchenAuditEntry } from "../../Utils/workflow";

export default function HotFoodPage({
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
  const cabinets = data.locations?.cabinets || [];
  const [openCabinets, setOpenCabinets] = useState({});

  useEffect(() => {
    setOpenCabinets((current) => {
      const next = {};
      cabinets.forEach((cabinet) => {
        next[cabinet] = current[cabinet] ?? true;
      });
      return next;
    });
  }, [cabinets]);

  const updateData = (fn) => {
    if (!isAdmin) return;
    setData((current) => ({ ...current, ...fn(current) }));
  };

  const updateDish = (id, patch, action = "עדכון מנה") => {
    if (!isAdmin) return;
    setData((current) => {
      const dish = current.hotFood.find((entry) => entry.id === id);
      return {
        ...current,
        hotFood: current.hotFood.map((entry) =>
          entry.id === id
            ? { ...entry, ...patch, lastEditBy: user.id, lastEditAt: nowISO() }
            : entry
        ),
        auditLog: [
          ...(current.auditLog || []).slice(-99),
          createKitchenAuditEntry(user, action, dish?.name || "מנה חמה"),
        ],
      };
    });
  };

  const markPreserved = (dish) => {
    updateDish(
      dish.id,
      { lastCheckedAt: nowISO() },
      "בדיקת שימור"
    );
  };

  const replaceDish = (dish) => {
    updateDish(
      dish.id,
      { cookedAt: nowISO() },
      "החלפת מנה"
    );
  };

  const deleteDish = (id) => {
    if (!isAdmin) return;
    updateData((current) => ({ hotFood: current.hotFood.filter((entry) => entry.id !== id) }));
  };

  const addDish = (cabinet) => {
    if (!isAdmin) return;
    updateData((current) => ({
      hotFood: [
        ...current.hotFood,
        {
          id: uid(),
          name: "מנה חדשה",
          desc: "תיאור",
          cabinet,
          cookedAt: nowISO(),
          emoji: "🍽️",
          allergens: [],
          ingredients: [{ name: "מרכיב", gpp: 100 }],
          lastEditBy: user.id,
          lastEditAt: nowISO(),
        },
      ],
    }));
  };

  const addCabinet = () => {
    if (!isAdmin) return;
    updateData((current) => ({
      locations: {
        ...current.locations,
        cabinets: [...(current.locations?.cabinets || []), `ארון חימום ${(current.locations?.cabinets || []).length + 1}`],
      },
    }));
  };

  const deleteCabinet = (name) => {
    if (!isAdmin) return;
    updateData((current) => ({
      locations: {
        ...current.locations,
        cabinets: (current.locations?.cabinets || []).filter((cabinet) => cabinet !== name),
      },
      hotFood: current.hotFood.filter((dish) => dish.cabinet !== name),
    }));
  };

  const renameCabinet = (oldName, nextName) => {
    if (!isAdmin) return;
    updateData((current) => ({
      locations: {
        ...current.locations,
        cabinets: (current.locations?.cabinets || []).map((cabinet) =>
          cabinet === oldName ? nextName : cabinet
        ),
      },
      hotFood: current.hotFood.map((dish) =>
        dish.cabinet === oldName ? { ...dish, cabinet: nextName } : dish
      ),
    }));
  };

  const toggleCabinet = (cabinet) => {
    setOpenCabinets((current) => ({
      ...current,
      [cabinet]: !(current[cabinet] ?? true),
    }));
  };

  return (
    <AdminPageShell
      title="בישולים ומנות חמות"
      icon={Flame}
      accent="#ef4444"
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
      {isAdmin && editMode ? (
        <div style={{ display: "flex", gap: 7, marginBottom: 11, flexWrap: "wrap" }}>
          <button
            onClick={addCabinet}
            className="button-secondary"
            style={{ color: "#ef4444", borderColor: "#ef444455" }}
          >
            <Plus size={11} /> הוסף ארון חימום
          </button>
        </div>
      ) : null}

      <div className="responsive-grid responsive-grid--three" style={{ gap: 11 }}>
        {cabinets.map((cabinet) => {
          const cabinetDishes = data.hotFood.filter((dish) => dish.cabinet === cabinet);
          const isCabinetOpen = openCabinets[cabinet] ?? true;

          return (
            <div
              key={cabinet}
              style={{
                background: "linear-gradient(135deg,#1e293b,#172032)",
                border: "1px solid #334155",
                borderTop: "3px solid #ef4444",
                borderRadius: 11,
                padding: 13,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: isCabinetOpen ? 11 : 0,
                  borderBottom: "2px solid #ef444433",
                  paddingBottom: 7,
                }}
              >
                <Flame size={12} color="#ef4444" />
                <IE
                  value={cabinet}
                  canEdit={editMode && isAdmin}
                  onSave={(value) => renameCabinet(cabinet, value)}
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    color: "#f1f5f9",
                    flex: 1,
                  }}
                />
                <span
                  className="pill-chip pill-chip--compact"
                  style={{
                    color: "#fecaca",
                    borderColor: "#ef444455",
                    background: "#ef44441a",
                  }}
                >
                  {cabinetDishes.length} מנות
                </span>
                <button
                  onClick={() => toggleCabinet(cabinet)}
                  className="button-secondary"
                  style={{ minHeight: 30, padding: "0 10px", color: "#f1f5f9" }}
                  aria-label={isCabinetOpen ? `סגור את ${cabinet}` : `פתח את ${cabinet}`}
                >
                  {isCabinetOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {isCabinetOpen ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {isAdmin ? (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        onClick={() => addDish(cabinet)}
                        className="button-secondary"
                        style={{ minHeight: 36, padding: "0 12px", color: "#ef4444", borderColor: "#ef444455" }}
                      >
                        <Plus size={12} /> הוסף מנה
                      </button>
                      {editMode ? (
                        <button
                          onClick={() => deleteCabinet(cabinet)}
                          className="button-secondary"
                          style={{ minHeight: 36, padding: "0 12px", color: "#fecaca", borderColor: "#ef444477", background: "#ef44441a" }}
                        >
                          <X size={12} /> מחק ארון חימום
                        </button>
                      ) : null}
                    </div>
                  ) : null}

                  {cabinetDishes.map((dish) => (
                    <div
                      key={dish.id}
                      style={{
                        background: "#0f172a",
                        borderRadius: 8,
                        padding: 9,
                        border: "1px solid #ef444433",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          width: 3,
                          height: "100%",
                          background: "#ef4444",
                        }}
                      />

                      <div
                        style={{
                          display: "flex",
                          gap: 5,
                          alignItems: "flex-start",
                          marginBottom: 8,
                        }}
                      >
                        <IE
                          value={dish.emoji}
                          canEdit={isAdmin}
                          onSave={(value) => updateDish(dish.id, { emoji: value }, "עדכון אייקון מנה")}
                          style={{
                            fontSize: "0.9rem",
                            display: "block",
                            width: 20,
                            textAlign: "center",
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <IE
                            value={dish.name}
                            canEdit={isAdmin}
                            onSave={(value) => updateDish(dish.id, { name: value }, "שינוי שם מנה")}
                            style={{
                              fontSize: "0.8rem",
                              fontWeight: 700,
                              color: "#f1f5f9",
                              display: "block",
                            }}
                          />
                          <IE
                            value={dish.desc}
                            canEdit={isAdmin}
                            onSave={(value) => updateDish(dish.id, { desc: value }, "שינוי תיאור מנה")}
                            style={{
                              fontSize: "0.62rem",
                              color: "#64748b",
                              display: "block",
                              marginTop: 1,
                            }}
                          />
                          <select
                            value={dish.cabinet}
                            onChange={(event) =>
                              updateDish(dish.id, { cabinet: event.target.value }, "העברת מנה")
                            }
                            disabled={!isAdmin}
                            style={{
                              marginTop: 2,
                              background: "#1e293b",
                              border: "none",
                              borderRadius: 3,
                              color: "#f97316",
                              fontSize: "0.6rem",
                              padding: "1px 3px",
                              cursor: isAdmin ? "pointer" : "not-allowed",
                              direction: "rtl",
                              opacity: isAdmin ? 1 : 0.6,
                            }}
                          >
                            {cabinets.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>

                      </div>

                      <div className="responsive-grid responsive-grid--three" style={{ gap: 6, marginBottom: 8 }}>
                        <button
                          onClick={() => markPreserved(dish)}
                          disabled={!isAdmin}
                          className="button-secondary"
                          style={{ minHeight: 34, opacity: isAdmin ? 1 : 0.5 }}
                        >
                          שימור
                        </button>
                        <button
                          onClick={() => replaceDish(dish)}
                          disabled={!isAdmin}
                          className="button-secondary"
                          style={{
                            minHeight: 34,
                            color: "#ef4444",
                            borderColor: "#ef444455",
                            opacity: isAdmin ? 1 : 0.5,
                          }}
                        >
                          החלפה
                        </button>
                        {isAdmin ? (
                          <button
                            onClick={() => deleteDish(dish.id)}
                            className="button-secondary"
                            style={{
                              minHeight: 34,
                              color: "#fecaca",
                              borderColor: "#ef444477",
                              background: "#ef44441a",
                            }}
                          >
                            <X size={12} /> מחק מנה
                          </button>
                        ) : null}
                      </div>

                      <AuditBadge userId={dish.lastEditBy} at={dish.lastEditAt} staff={staff} />
                    </div>
                  ))}

                  {cabinetDishes.length === 0 ? (
                    <p style={{ padding: 8, textAlign: "center", color: "#334155", fontSize: "0.68rem" }}>
                      {isAdmin ? "ריק - השתמש בכפתור 'הוסף מנה'" : "ריק"}
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
