import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Plus, Refrigerator, Salad, X } from "lucide-react";
import IE from "../../Utilites/inlineEdit";
import AdminPageShell from "../Admin/AdminPageShellScreen";
import AuditBadge from "../../Utilites/auditBadge";
import { canEditKitchen, nowISO, uid } from "../../Utils/helpers";
import { COLORS } from "../../Utils/constans";
import { createKitchenAuditEntry } from "../../Utils/workflow";

export default function SaladsPage({
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
  const fridges = data.locations?.fridges || [];
  const [openFridges, setOpenFridges] = useState({});

  useEffect(() => {
    setOpenFridges((current) => {
      const next = {};
      fridges.forEach((fridge) => {
        next[fridge] = current[fridge] ?? true;
      });
      return next;
    });
  }, [fridges]);

  const updateData = (fn) => {
    if (!isAdmin) return;
    setData((current) => ({ ...current, ...fn(current) }));
  };

  const updateSalad = (id, patch, action = "עדכון סלט") => {
    if (!isAdmin) return;
    setData((current) => {
      const salad = current.salads.find((entry) => entry.id === id);
      return {
        ...current,
        salads: current.salads.map((entry) =>
          entry.id === id
            ? { ...entry, ...patch, lastEditBy: user.id, lastEditAt: nowISO() }
            : entry
        ),
        auditLog: [
          ...(current.auditLog || []).slice(-99),
          createKitchenAuditEntry(user, action, `${salad?.name || "סלט"} • ${patch.level ?? salad?.level ?? 0}%`),
        ],
      };
    });
  };

  const quickFillSalad = (salad) => {
    updateSalad(salad.id, { level: Math.min(100, Number(salad.level ?? 0) + 25) }, "מילוי סלט");
  };

  const replaceSalad = (salad) => {
    updateSalad(salad.id, { level: 100, lastRefreshed: nowISO() }, "החלפת סלט");
  };

  const emptySalad = (salad) => {
    updateSalad(salad.id, { level: 0 }, "סלט נגמר");
  };

  const deleteSalad = (id) => {
    if (!isAdmin) return;
    updateData((current) => ({ salads: current.salads.filter((salad) => salad.id !== id) }));
  };

  const addSalad = (location) => {
    if (!isAdmin) return;
    updateData((current) => ({
      salads: [
        ...current.salads,
        {
          id: uid(),
          name: "סלט חדש",
          location,
          level: 100,
          lastRefreshed: nowISO(),
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          lastEditBy: user.id,
          lastEditAt: nowISO(),
        },
      ],
    }));
  };

  const addFridge = () => {
    if (!isAdmin) return;
    updateData((current) => ({
      locations: {
        ...current.locations,
        fridges: [...current.locations.fridges, `מקרר ${current.locations.fridges.length + 1}`],
      },
    }));
  };

  const deleteFridge = (name) => {
    if (!isAdmin) return;
    updateData((current) => ({
      locations: { ...current.locations, fridges: current.locations.fridges.filter((fridge) => fridge !== name) },
      salads: current.salads.filter((salad) => salad.location !== name),
    }));
  };

  const renameFridge = (oldName, nextName) => {
    if (!isAdmin) return;
    updateData((current) => ({
      locations: { ...current.locations, fridges: current.locations.fridges.map((fridge) => (fridge === oldName ? nextName : fridge)) },
      salads: current.salads.map((salad) => (salad.location === oldName ? { ...salad, location: nextName } : salad)),
    }));
  };

  const toggleFridge = (fridge) => {
    setOpenFridges((current) => ({ ...current, [fridge]: !(current[fridge] ?? true) }));
  };

  return (
    <AdminPageShell
      title="סלטים"
      icon={Salad}
      accent="#22c55e"
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
        {isAdmin ? (
          <>
            {editMode ? (
              <button onClick={addFridge} className="button-secondary" style={{ color: "#22c55e", borderColor: "#22c55e55" }}>
                <Plus size={11} /> הוסף מקרר
              </button>
            ) : null}
            <button onClick={() => addSalad(fridges[0] || "מקרר 1")} className="button-secondary" style={{ color: "#fbbf24", borderColor: "#fbbf2455" }}>
              <Plus size={11} /> סלט חדש
            </button>
          </>
        ) : null}
      </div>

      <div className="responsive-grid responsive-grid--two" style={{ gap: 11, marginBottom: 11 }}>
        {fridges.map((fridge) => {
          const fridgeSalads = data.salads.filter((salad) => salad.location === fridge);
          const isFridgeOpen = openFridges[fridge] ?? true;

          return (
            <div
              key={fridge}
              style={{
                background: "linear-gradient(135deg,#1e293b,#172032)",
                border: "1px solid #334155",
                borderRadius: 11,
                padding: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: isFridgeOpen ? 11 : 0, borderBottom: "2px solid #22c55e44", paddingBottom: 7 }}>
                <Refrigerator size={12} color="#22c55e" />
                <IE value={fridge} canEdit={editMode && isAdmin} onSave={(value) => renameFridge(fridge, value)} style={{ fontSize: "0.86rem", fontWeight: 700, color: "#f1f5f9", flex: 1 }} />
                <span className="pill-chip pill-chip--compact" style={{ color: "#d9f0c8", borderColor: "#22c55e55", background: "#22c55e1a" }}>
                  {fridgeSalads.length} סלטים
                </span>
                <button onClick={() => toggleFridge(fridge)} className="button-secondary" style={{ minHeight: 30, padding: "0 10px", color: "#f1f5f9" }}>
                  {isFridgeOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {isFridgeOpen ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {isAdmin ? (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button onClick={() => addSalad(fridge)} className="button-secondary" style={{ minHeight: 36, padding: "0 12px", color: "#22c55e", borderColor: "#22c55e55" }}>
                        <Plus size={12} /> הוסף סלט למקרר
                      </button>
                      {editMode ? (
                        <button onClick={() => deleteFridge(fridge)} className="button-secondary" style={{ minHeight: 36, padding: "0 12px", color: "#fecaca", borderColor: "#ef444477", background: "#ef44441a" }}>
                          <X size={12} /> מחק מקרר
                        </button>
                      ) : null}
                    </div>
                  ) : null}

                  {fridgeSalads.map((salad) => (
                    <div key={salad.id} style={{ background: "#0f172a", borderRadius: 8, padding: 10, border: "1px solid #1e293b" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div style={{ flex: 1 }}>
                          <IE value={salad.name} canEdit={isAdmin} onSave={(value) => updateSalad(salad.id, { name: value }, "שינוי שם סלט")} style={{ fontSize: "0.81rem", fontWeight: 700, color: "#f1f5f9", display: "block", marginBottom: 2 }} />
                          <select
                            value={salad.location}
                            onChange={(event) => updateSalad(salad.id, { location: event.target.value }, "העברת סלט")}
                            disabled={!isAdmin}
                            style={{ background: "#1e293b", border: "none", borderRadius: 3, color: "#64748b", fontSize: "0.6rem", padding: "1px 3px", cursor: isAdmin ? "pointer" : "not-allowed", direction: "rtl", opacity: isAdmin ? 1 : 0.6 }}
                          >
                            {fridges.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div style={{ fontSize: "0.92rem", fontWeight: 900, fontFamily: "monospace", color: salad.level > 50 ? "#22c55e" : salad.level > 25 ? "#f59e0b" : "#ef4444", flexShrink: 0 }}>
                          {salad.level}%
                        </div>
                      </div>

                      <div
                        style={{
                          position: "relative",
                          height: 7,
                          background: "#1e293b",
                          borderRadius: 4,
                          marginBottom: 8,
                          cursor: isAdmin ? "pointer" : "default",
                          overflow: "hidden",
                        }}
                        onClick={(event) => {
                          if (!isAdmin) return;
                          const rect = event.currentTarget.getBoundingClientRect();
                          const nextLevel = Math.max(0, Math.min(100,100- Math.round(((event.clientX - rect.left) / rect.width) * 100)));
                          updateSalad(salad.id, { level: nextLevel }, "עדכון מפלס סלט");
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            bottom: 0,
                            height: "100%",
                            borderRadius: 4,
                            transition: "width 0.2s",
                            background: `linear-gradient(90deg,${salad.level < 30 ? "#ef4444" : salad.level < 60 ? "#f59e0b" : "#22c55e"},${salad.color})`,
                            width: `${salad.level}%`,
                          }}
                        />
                      </div>

                      <div className="responsive-grid responsive-grid--two" style={{ gap: 6, marginBottom: 8 }}>
                        <button onClick={() => quickFillSalad(salad)} disabled={!isAdmin} className="button-secondary" style={{ minHeight: 34, opacity: isAdmin ? 1 : 0.5 }}>
                          מילוי
                        </button>
                        <button onClick={() => replaceSalad(salad)} disabled={!isAdmin} className="button-secondary" style={{ minHeight: 34, color: "#f59e0b", borderColor: "#f59e0b55", opacity: isAdmin ? 1 : 0.5 }}>
                          החלפה
                        </button>
                        <button onClick={() => emptySalad(salad)} disabled={!isAdmin} className="button-secondary" style={{ minHeight: 34, color: "#ef4444", borderColor: "#ef444455", opacity: isAdmin ? 1 : 0.5 }}>
                          נגמר
                        </button>
                        {isAdmin ? (
                          <button onClick={() => deleteSalad(salad.id)} className="button-secondary" style={{ minHeight: 34, color: "#fecaca", borderColor: "#ef444477", background: "#ef44441a" }}>
                            <X size={12} /> מחק סלט
                          </button>
                        ) : null}
                      </div>

                      <AuditBadge userId={salad.lastEditBy} at={salad.lastEditAt} staff={staff} />
                    </div>
                  ))}

                  {fridgeSalads.length === 0 ? (
                    <p style={{ padding: 10, textAlign: "center", color: "#334155", fontSize: "0.7rem" }}>
                      {isAdmin ? "אין סלטים במקרר. השתמש בכפתור 'הוסף סלט למקרר'" : "אין סלטים להצגה"}
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
