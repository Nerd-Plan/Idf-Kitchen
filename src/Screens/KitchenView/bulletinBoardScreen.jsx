import React, { useState } from "react";
import { Archive, Check, History, ListChecks, Megaphone, Pin, Plus, X } from "lucide-react";
import { canEditKitchen, fmtDate, fmtTime, nowISO } from "../../Utils/helpers";
import { PRIORITY_CFG } from "../../Utils/constans";

export default function BulletinBoard({ data, user, onUpdate, variant = "default", onClose = null }) {
  const canEdit = canEditKitchen(user);
  const isDrawer = variant === "drawer";
  const isSideNote = variant === "side" || isDrawer;
  const [draft, setDraft] = useState("");
  const [pri, setPri] = useState("normal");
  const [taskDraft, setTaskDraft] = useState("");
  const [showTaskInput, setShowTaskInput] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const today = nowISO().slice(0, 10);
  const active = (data.bulletins || []).filter((b) => !b.archived);
  const archived = (data.bulletins || []).filter((b) => b.archived);
  const todayTasks = (data.tasks || []).filter((t) => t.date === today);
  const completedTasks = todayTasks.filter((t) => t.doneBy).length;
  const pending = todayTasks.filter((t) => !t.doneBy).length;
  const critical = active.filter((b) => b.priority === "critical").length;

  const post = () => {
    if (!draft.trim()) return;
    onUpdate((d) => ({
      ...d,
      bulletins: [
        {
          id: `b${Date.now()}`,
          text: draft.trim(),
          priority: pri,
          postedAt: nowISO(),
          postedByName: user.name,
          archived: false,
        },
        ...(d.bulletins || []),
      ],
    }));
    setDraft("");
    setPri("normal");
  };

  const archiveBulletin = (id) =>
    onUpdate((d) => ({
      ...d,
      bulletins: (d.bulletins || []).map((b) => (b.id === id ? { ...b, archived: true } : b)),
    }));

  const deleteBulletin = (id) =>
    onUpdate((d) => ({
      ...d,
      bulletins: (d.bulletins || []).filter((b) => b.id !== id),
    }));

  const addTask = () => {
    if (!taskDraft.trim()) return;
    onUpdate((d) => ({
      ...d,
      tasks: [
        ...(d.tasks || []),
        {
          id: `t${Date.now()}`,
          text: taskDraft.trim(),
          createdAt: nowISO(),
          doneBy: null,
          doneByName: null,
          doneAt: null,
          date: today,
        },
      ],
    }));
    setTaskDraft("");
    setShowTaskInput(false);
  };

  const doneTask = (id) =>
    onUpdate((d) => ({
      ...d,
      tasks: (d.tasks || []).map((t) =>
        t.id === id ? { ...t, doneBy: user.id, doneByName: user.name, doneAt: nowISO() } : t
      ),
    }));

  const undoneTask = (id) => {
    if (!canEdit) return;
    onUpdate((d) => ({
      ...d,
      tasks: (d.tasks || []).map((t) =>
        t.id === id ? { ...t, doneBy: null, doneByName: null, doneAt: null } : t
      ),
    }));
  };

  const deleteTask = (id) =>
    onUpdate((d) => ({
      ...d,
      tasks: (d.tasks || []).filter((t) => t.id !== id),
    }));

  const wrapperStyle = isSideNote
    ? {
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 24,
        padding: 14,
        background:
          "linear-gradient(180deg, rgba(74,44,26,0.96) 0%, rgba(42,24,13,0.97) 100%)",
        border: "1px solid rgba(201, 140, 80, 0.46)",
        boxShadow: "0 20px 36px rgba(0,0,0,0.24)",
        overflow: "hidden",
      }
    : {
        margin: "10px 16px 0",
      };

  const bodyShellStyle = isSideNote
    ? {
        display: "flex",
        flexDirection: "column",
        gap: 10,
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        paddingInlineEnd: 2,
      }
    : {
        background: "linear-gradient(160deg,#1a0a2e,#0f0a1e)",
        border: "1px solid #7c3aed55",
        borderTop: "none",
        borderRadius: "0 0 12px 12px",
        padding: "14px 16px 16px",
        marginBottom: 8,
      };

  const noteSectionStyle = {
    background: isSideNote ? "rgba(27, 16, 9, 0.62)" : "#0f0a1f",
    borderRadius: isSideNote ? 18 : 10,
    padding: isSideNote ? 12 : 12,
    border: isSideNote ? "1px solid rgba(201, 140, 80, 0.2)" : "1px solid #7c3aed44",
    boxShadow: isSideNote ? "inset 0 1px 0 rgba(255,255,255,0.03)" : "none",
  };

  return (
    <div style={wrapperStyle}>
      {isDrawer && onClose ? (
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 3,
            width: 34,
            height: 34,
            borderRadius: 12,
            border: "1px solid rgba(201, 140, 80, 0.42)",
            background: "rgba(27, 16, 9, 0.8)",
            color: "#fff4e8",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <X size={14} />
        </button>
      ) : null}

      {isSideNote ? (
        <div
          style={{
            position: "absolute",
            top: 18,
            left: 18,
            width: 56,
            height: 8,
            borderRadius: 999,
            background: "linear-gradient(90deg,#f2c078,#ffb24d)",
            opacity: 0.7,
          }}
        />
      ) : null}

      <button
        onClick={() => setCollapsed((c) => !c)}
        style={
          isSideNote
            ? {
                width: "100%",
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: 0,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#f1f5f9",
                textAlign: "right",
                marginBottom: collapsed ? 0 : 12,
              }
            : {
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "11px 16px",
                background: "linear-gradient(90deg,#1a0a2e,#1e1035)",
                borderRadius: collapsed ? 12 : "12px 12px 0 0",
                border: "1px solid #7c3aed66",
                borderBottom: collapsed ? "1px solid #7c3aed66" : "none",
                cursor: "pointer",
                color: "#f1f5f9",
                textAlign: "right",
              }
        }
      >
        <div
          style={
            isSideNote
              ? {
                  width: 44,
                  height: 44,
                  background: "linear-gradient(135deg,#f2c078,#ffb24d)",
                  borderRadius: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  color: "#2a170d",
                  boxShadow: "0 14px 24px rgba(255, 178, 77, 0.18)",
                }
              : {
                  width: 30,
                  height: 30,
                  background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }
          }
        >
          <Megaphone size={isSideNote ? 18 : 14} color={isSideNote ? "#2a170d" : "#fff"} />
        </div>
        <div style={{ flex: 1, textAlign: "right", minWidth: 0 }}>
          <div
            style={{
              fontSize: isSideNote ? "0.58rem" : "0.9rem",
              fontWeight: isSideNote ? 800 : 800,
              color: isSideNote ? "#d9bca4" : "#c4b5fd",
              letterSpacing: isSideNote ? "0.18em" : "normal",
              textTransform: isSideNote ? "uppercase" : "none",
            }}
          >
            {isSideNote ? "SIDE NOTE" : "לוח מודעות מטבח"}
          </div>
          <div
            style={{
              fontSize: isSideNote ? "1rem" : "0.62rem",
              fontWeight: isSideNote ? 900 : 400,
              color: isSideNote ? "#fff4e8" : "#6d28d9",
              marginTop: isSideNote ? 2 : 0,
            }}
          >
            {isSideNote ? "לוח עדכונים ומשימות" : `${active.length} הודעות`}
            {isSideNote ? null : pending > 0 && <span style={{ color: "#f97316", marginRight: 6 }}>• {pending} משימות ממתינות</span>}
            {isSideNote ? null : critical > 0 && <span style={{ color: "#ef4444", marginRight: 6 }}>• דחוף!</span>}
          </div>
          {isSideNote ? (
            <div style={{ fontSize: "0.7rem", color: "#d9bca4", marginTop: 4 }}>
              {active.length} עדכונים • {pending} משימות פתוחות
              {critical > 0 ? ` • ${critical} דחופות` : ""}
            </div>
          ) : null}
        </div>
        {critical > 0 && (
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#ef4444",
              boxShadow: "0 0 6px #ef4444",
              flexShrink: 0,
            }}
          />
        )}
        <span style={{ color: isSideNote ? "#d9bca4" : "#6d28d9", fontSize: "0.8rem" }}>{collapsed ? "▼" : "▲"}</span>
      </button>

      {!collapsed && (
        <div style={bodyShellStyle}>
          {canEdit && (
            <div style={noteSectionStyle}>
              <p
                style={{
                  color: isSideNote ? "#ffcf8b" : "#a78bfa",
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  margin: "0 0 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Pin size={10} /> פרסום הודעה
              </p>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={isSideNote ? 3 : 2}
                placeholder="הכנס הודעה לצוות המטבח..."
                style={{
                  width: "100%",
                  background: isSideNote ? "rgba(33,18,8,0.94)" : "#1e1035",
                  border: `1px solid ${isSideNote ? "rgba(201,140,80,0.42)" : "#7c3aed66"}`,
                  borderRadius: 12,
                  color: "#f1f5f9",
                  padding: "10px 12px",
                  fontSize: "0.85rem",
                  direction: "rtl",
                  resize: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
              <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                <div className="responsive-grid responsive-grid--three" style={{ gap: 6 }}>
                  {Object.entries(PRIORITY_CFG).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setPri(key)}
                      style={{
                        padding: "7px 4px",
                        background: pri === key ? cfg.bg : "rgba(255,255,255,0.03)",
                        border: `1px solid ${pri === key ? cfg.color : "rgba(143,90,55,0.42)"}`,
                        borderRadius: 10,
                        color: pri === key ? cfg.color : "#d9bca4",
                        fontSize: "0.66rem",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      {cfg.icon} {cfg.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={post}
                  style={{
                    background: isSideNote ? "linear-gradient(135deg,#ffb24d,#ff8b3d)" : "linear-gradient(135deg,#7c3aed,#6d28d9)",
                    border: "none",
                    borderRadius: 12,
                    color: isSideNote ? "#2a170d" : "#fff",
                    padding: "10px 14px",
                    cursor: "pointer",
                    fontWeight: 900,
                    fontSize: "0.82rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Megaphone size={12} /> פרסם
                </button>
              </div>
            </div>
          )}

          <div style={noteSectionStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: "0.84rem", fontWeight: 900, color: "#fff4e8" }}>עדכונים פעילים</div>
                <div style={{ fontSize: "0.66rem", color: "#d9bca4" }}>{active.length ? `${active.length} פתקים פתוחים` : "אין עדכונים כרגע"}</div>
              </div>
              <span
                style={{
                  minWidth: 32,
                  textAlign: "center",
                  padding: "4px 8px",
                  borderRadius: 999,
                  fontSize: "0.66rem",
                  fontWeight: 900,
                  color: "#ffcf8b",
                  border: "1px solid rgba(201,140,80,0.4)",
                  background: "rgba(255,178,77,0.08)",
                }}
              >
                {active.length}
              </span>
            </div>

            {active.length === 0 ? (
              <p style={{ textAlign: "center", color: "#8a6f59", fontSize: "0.76rem", padding: "8px 0 2px", margin: 0 }}>
                אין הודעות פעילות
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {active.map((b) => {
                  const cfg = PRIORITY_CFG[b.priority] || PRIORITY_CFG.normal;
                  return (
                    <div
                      key={b.id}
                      style={{
                        background: cfg.bg,
                        border: `1px solid ${cfg.border}`,
                        borderRight: `4px solid ${cfg.color}`,
                        borderRadius: 14,
                        padding: "10px 12px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <span style={{ fontSize: "1rem", flexShrink: 0 }}>{cfg.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: "0 0 5px", fontSize: "0.81rem", fontWeight: 800, color: cfg.color, lineHeight: 1.5 }}>{b.text}</p>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                            <span style={{ fontSize: "0.58rem", color: "#7f6d62" }}>
                              {b.postedByName} • {fmtDate(b.postedAt)} {fmtTime(b.postedAt)}
                            </span>
                            <span
                              style={{
                                background: `${cfg.color}18`,
                                border: `1px solid ${cfg.color}33`,
                                borderRadius: 999,
                                padding: "2px 7px",
                                fontSize: "0.56rem",
                                color: cfg.color,
                                fontWeight: 800,
                              }}
                            >
                              {cfg.label}
                            </span>
                          </div>
                        </div>
                        {canEdit ? (
                          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                            <button
                              onClick={() => archiveBulletin(b.id)}
                              title="ארכיון"
                              style={{
                                background: "rgba(33,18,8,0.55)",
                                border: "1px solid rgba(143,90,55,0.4)",
                                borderRadius: 7,
                                color: "#d9bca4",
                                width: 26,
                                height: 26,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Archive size={10} />
                            </button>
                            <button
                              onClick={() => deleteBulletin(b.id)}
                              title="מחק"
                              style={{
                                background: "rgba(79,20,15,0.55)",
                                border: "1px solid rgba(249,115,85,0.34)",
                                borderRadius: 7,
                                color: "#f97355",
                                width: 26,
                                height: 26,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ ...noteSectionStyle, borderColor: "rgba(138, 199, 107, 0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <ListChecks size={14} color="#8ac76b" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.84rem", fontWeight: 900, color: "#fff4e8" }}>משימות יומיות</div>
                <div style={{ fontSize: "0.66rem", color: "#d9bca4" }}>
                  {completedTasks}/{todayTasks.length} בוצעו
                </div>
              </div>
              {canEdit ? (
                <button
                  onClick={() => setShowTaskInput((value) => !value)}
                  style={{
                    background: showTaskInput ? "rgba(255,255,255,0.06)" : "rgba(138,199,107,0.12)",
                    border: `1px solid ${showTaskInput ? "rgba(143,90,55,0.4)" : "rgba(138,199,107,0.34)"}`,
                    borderRadius: 999,
                    color: showTaskInput ? "#d9bca4" : "#8ac76b",
                    padding: "5px 10px",
                    cursor: "pointer",
                    fontSize: "0.66rem",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Plus size={10} /> משימה
                </button>
              ) : null}
            </div>

            {showTaskInput && canEdit ? (
              <div style={{ display: "grid", gap: 7, marginBottom: 10 }}>
                <input
                  value={taskDraft}
                  onChange={(e) => setTaskDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addTask();
                    if (e.key === "Escape") setShowTaskInput(false);
                  }}
                  placeholder="תיאור המשימה..."
                  autoFocus
                  style={{
                    width: "100%",
                    background: "rgba(33,18,8,0.94)",
                    border: "1px solid rgba(138,199,107,0.3)",
                    borderRadius: 12,
                    color: "#f1f5f9",
                    padding: "9px 11px",
                    fontSize: "0.82rem",
                    direction: "rtl",
                    fontFamily: "inherit",
                  }}
                />
                <button
                  onClick={addTask}
                  style={{
                    background: "linear-gradient(135deg,#8ac76b,#5faa4f)",
                    border: "none",
                    borderRadius: 12,
                    color: "#18210f",
                    padding: "9px 12px",
                    cursor: "pointer",
                    fontWeight: 900,
                    fontSize: "0.78rem",
                  }}
                >
                  הוסף משימה
                </button>
              </div>
            ) : null}

            {todayTasks.length === 0 ? (
              <p style={{ textAlign: "center", color: "#8a6f59", fontSize: "0.76rem", padding: "6px 0 2px", margin: 0 }}>
                אין משימות להיום
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {todayTasks.map((task) => {
                  const done = Boolean(task.doneBy);
                  return (
                    <div
                      key={task.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 10px",
                        borderRadius: 12,
                        background: done ? "rgba(38, 72, 36, 0.34)" : "rgba(33,18,8,0.55)",
                        border: `1px solid ${done ? "rgba(138,199,107,0.34)" : "rgba(143,90,55,0.3)"}`,
                      }}
                    >
                      <button
                        onClick={() => (done ? undoneTask(task.id) : doneTask(task.id))}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 7,
                          border: `2px solid ${done ? "#8ac76b" : "#8a6f59"}`,
                          background: done ? "#8ac76b" : "transparent",
                          cursor: "pointer",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {done ? <Check size={13} color="#18210f" /> : null}
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span
                          style={{
                            fontSize: "0.78rem",
                            color: done ? "#b9e5a7" : "#fff4e8",
                            textDecoration: done ? "line-through" : "none",
                            fontWeight: done ? 500 : 700,
                          }}
                        >
                          {task.text}
                        </span>
                        {done && task.doneByName ? (
                          <div style={{ fontSize: "0.58rem", color: "#8ac76b", marginTop: 2 }}>
                            בוצע ע"י {task.doneByName} • {fmtTime(task.doneAt)}
                          </div>
                        ) : null}
                      </div>
                      {canEdit ? (
                        <button
                          onClick={() => deleteTask(task.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}
                        >
                          <X size={11} color="#b78f77" />
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {archived.length > 0 ? (
            <div style={{ ...noteSectionStyle, paddingTop: 10, paddingBottom: 10 }}>
              <button
                onClick={() => setShowHistory((value) => !value)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#d9bca4",
                  cursor: "pointer",
                  fontSize: "0.72rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: 0,
                }}
              >
                <History size={11} /> {showHistory ? "הסתר היסטוריה" : `היסטוריית הודעות (${archived.length})`}
              </button>
              {showHistory ? (
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                  {archived.map((b) => {
                    const cfg = PRIORITY_CFG[b.priority] || PRIORITY_CFG.normal;
                    return (
                      <div
                        key={b.id}
                        style={{
                          background: "rgba(20, 12, 7, 0.6)",
                          borderRadius: 12,
                          padding: "8px 10px",
                          border: "1px solid rgba(143,90,55,0.24)",
                          opacity: 0.78,
                          display: "flex",
                          gap: 8,
                          alignItems: "flex-start",
                        }}
                      >
                        <span style={{ fontSize: "0.9rem" }}>{cfg.icon}</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: "0 0 3px", fontSize: "0.74rem", color: "#d9bca4", lineHeight: 1.4 }}>{b.text}</p>
                          <span style={{ fontSize: "0.58rem", color: "#8a6f59" }}>
                            {b.postedByName} • {fmtDate(b.postedAt)} {fmtTime(b.postedAt)}
                          </span>
                        </div>
                        {canEdit ? (
                          <button
                            onClick={() => deleteBulletin(b.id)}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                          >
                            <X size={10} color="#8a6f59" />
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
