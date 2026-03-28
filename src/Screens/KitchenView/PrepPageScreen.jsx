import { useState, useRef } from "react";
import { ClipboardList, Check, Plus, X, RotateCcw, Package, AlertTriangle } from "lucide-react";
import AdminPageShell from "../Admin/AdminPageShellScreen";

export default function PrepPageScreen({ data, setData, onBack, onLogout, user, saved, isAdmin, onOpenSearch, onExportStatus }) {
  const ACCENT      = "#84cc16";          // lime-green — distinct from every other page
  const ACCENT_DARK = "#3f6212";          // dark tint for done-row background
  const tasks       = data.prepTasks || [];
  const doneCount   = tasks.filter(t => t.isDone).length;
  const totalCount  = tasks.length;
  const pct         = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
 
  const [newName,    setNewName]   = useState("");
  const [newQty,     setNewQty]    = useState("");
  const [formError,  setFormError] = useState("");
  const nameRef = useRef(null);
 
  // ── Mutations ──────────────────────────────────────────────────────────────
  const toggleDone = (id) => {
    setData(d => ({
      ...d,
      prepTasks: d.prepTasks.map(t => t.id === id ? { ...t, isDone: !t.isDone } : t)
    }));
  };
 
  const addTask = () => {
    const name = newName.trim();
    const qty  = newQty.trim();
    if (!name) { setFormError("נא להזין שם הכנה"); return; }
    setFormError("");
    setData(d => ({
      ...d,
      prepTasks: [
        ...(d.prepTasks || []),
        { id: "pt" + Date.now(), text: name, qty: qty || "—", isDone: false }
      ]
    }));
    setNewName("");
    setNewQty("");
    nameRef.current?.focus();
  };
 
  const deleteTask = (id) => {
    setData(d => ({ ...d, prepTasks: d.prepTasks.filter(t => t.id !== id) }));
  };
 
  const resetAll = () => {
    setData(d => ({ ...d, prepTasks: d.prepTasks.map(t => ({ ...t, isDone: false })) }));
  };
 
  return (
    <AdminPageShell
      title="הכנות למטבח"
      icon={ClipboardList}
      accent={ACCENT}
      onBack={onBack}
      onLogout={onLogout}
      user={user}
      saved={saved}
      isAdmin={isAdmin}
      onOpenSearch={onOpenSearch}
      onExportStatus={onExportStatus}
    >
 
      {/* ── PROGRESS BAR ──────────────────────────────────────────────────── */}
      <div style={{ background:"#1e293b", borderRadius:12, padding:"13px 16px",
        marginBottom:16, border:"1px solid #334155" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <ClipboardList size={13} color={ACCENT}/>
            <span style={{ fontSize:"0.74rem", fontWeight:700, color:ACCENT }}>התקדמות הכנות</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:"0.74rem", color:"#94a3b8", fontFamily:"monospace" }}>
              {doneCount}/{totalCount}
            </span>
            <span style={{ fontSize:"1.25rem", fontWeight:900, fontFamily:"monospace",
              color: pct === 100 ? "#22c55e" : pct >= 50 ? ACCENT : "#f97316" }}>
              {pct}%
            </span>
          </div>
        </div>
        {/* Track */}
        <div style={{ height:10, background:"#0f172a", borderRadius:5, overflow:"hidden" }}>
          <div style={{ height:"100%", borderRadius:5, transition:"width 0.4s ease",
            background: pct === 100
              ? "linear-gradient(90deg,#22c55e,#16a34a)"
              : `linear-gradient(90deg,${ACCENT},#a3e635)`,
            width:`${pct}%` }}/>
        </div>
        {/* Milestone labels */}
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
          {[0, 25, 50, 75, 100].map(m => (
            <span key={m} style={{ fontSize:"0.52rem", color: pct >= m ? ACCENT : "#334155",
              fontWeight: pct >= m ? 700 : 400 }}>{m}%</span>
          ))}
        </div>
        {/* Reset button — admin only, only shown when at least one task is done */}
        {isAdmin && doneCount > 0 && (
          <button onClick={resetAll}
            style={{ marginTop:10, background:"#0f172a", border:`1px solid ${ACCENT}44`,
              borderRadius:7, padding:"5px 12px", cursor:"pointer", color:"#94a3b8",
              fontSize:"0.7rem", display:"flex", alignItems:"center", gap:4 }}>
            <RotateCcw size={10} color="#94a3b8"/> אפס את כל הסימונים
          </button>
        )}
      </div>
 
      {/* ── TASK LIST ─────────────────────────────────────────────────────── */}
      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
        {tasks.map((task, idx) => (
          <div key={task.id}
            style={{ background: task.isDone ? `${ACCENT_DARK}55` : "#1e293b",
              border:`1px solid ${task.isDone ? ACCENT+"44" : "#334155"}`,
              borderRadius:10, padding:"11px 14px",
              display:"flex", alignItems:"center", gap:12,
              transition:"background 0.2s, border-color 0.2s" }}>
 
            {/* Index badge */}
            <div style={{ width:22, height:22, borderRadius:6, flexShrink:0,
              background: task.isDone ? ACCENT+"22" : "#0f172a",
              border:`1px solid ${task.isDone ? ACCENT+"55" : "#334155"}`,
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:"0.6rem", fontWeight:700, fontFamily:"monospace",
                color: task.isDone ? ACCENT : "#475569" }}>
                {idx + 1}
              </span>
            </div>
 
            {/* Checkbox */}
            <button onClick={() => toggleDone(task.id)}
              style={{ width:24, height:24, borderRadius:7, flexShrink:0, cursor:"pointer",
                background: task.isDone ? ACCENT : "transparent",
                border:`2px solid ${task.isDone ? ACCENT : "#475569"}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                transition:"all 0.15s" }}>
              {task.isDone && <Check size={13} color="#0f172a"/>}
            </button>
 
            {/* Text + qty */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:"0.86rem", fontWeight:600,
                color: task.isDone ? "#4ade80" : "#f1f5f9",
                textDecoration: task.isDone ? "line-through" : "none",
                opacity: task.isDone ? 0.75 : 1,
                whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                {task.text}
              </div>
              {task.qty && task.qty !== "—" && (
                <div style={{ fontSize:"0.67rem", color: task.isDone ? ACCENT+"99" : "#64748b",
                  marginTop:2, display:"flex", alignItems:"center", gap:3 }}>
                  <Package size={9} color={task.isDone ? ACCENT+"99" : "#475569"}/>
                  {task.qty}
                </div>
              )}
            </div>
 
            {/* Delete button — admin only */}
            {isAdmin && (
              <button onClick={() => deleteTask(task.id)}
                style={{ background:"none", border:"none", cursor:"pointer",
                  padding:4, flexShrink:0, borderRadius:5,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  opacity: task.isDone ? 0.4 : 0.6 }}>
                <X size={13} color="#ef4444"/>
              </button>
            )}
          </div>
        ))}
 
        {tasks.length === 0 && (
          <div style={{ background:"#1e293b", border:"1px solid #334155", borderRadius:10,
            padding:"28px 20px", textAlign:"center" }}>
            <ClipboardList size={28} color="#334155" style={{ margin:"0 auto 10px", display:"block" }}/>
            <p style={{ color:"#475569", fontSize:"0.82rem", margin:0 }}>
              {isAdmin ? "אין הכנות — הוסף למטה" : "אין הכנות לתצוגה"}
            </p>
          </div>
        )}
      </div>
 
      {/* ── ADD TASK FORM — admin only ──────────────────────────────────── */}
      {isAdmin ? (
        <div style={{ background:"#0f172a", border:`1px solid ${ACCENT}33`,
          borderRadius:12, padding:"14px 16px" }}>
          <div style={{ fontSize:"0.74rem", fontWeight:700, color:ACCENT,
            marginBottom:11, display:"flex", alignItems:"center", gap:5 }}>
            <Plus size={12} color={ACCENT}/> הוספת הכנה חדשה
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {/* Task name input */}
            <input
              ref={nameRef}
              value={newName}
              onChange={e => { setNewName(e.target.value); setFormError(""); }}
              onKeyDown={e => { if (e.key === "Enter") addTask(); }}
              placeholder="שם ההכנה..."
              style={{ flex:"2 1 160px", background:"#1e293b",
                border:`1px solid ${formError ? "#ef4444" : ACCENT+"44"}`,
                borderRadius:8, color:"#f1f5f9", padding:"9px 12px",
                fontSize:"0.82rem", direction:"rtl", outline:"none",
                minWidth:0 }}
            />
            {/* Quantity input */}
            <input
              value={newQty}
              onChange={e => setNewQty(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") addTask(); }}
              placeholder="כמות (לא חובה)..."
              style={{ flex:"1 1 110px", background:"#1e293b",
                border:`1px solid ${ACCENT}33`,
                borderRadius:8, color:"#f1f5f9", padding:"9px 12px",
                fontSize:"0.82rem", direction:"rtl", outline:"none",
                minWidth:0 }}
            />
            {/* Add button */}
            <button onClick={addTask}
              style={{ background:`linear-gradient(135deg,${ACCENT},#65a30d)`,
                border:"none", borderRadius:8, padding:"9px 18px",
                cursor:"pointer", color:"#0f172a", fontSize:"0.82rem",
                fontWeight:800, display:"flex", alignItems:"center", gap:5,
                flexShrink:0, whiteSpace:"nowrap" }}>
              <Plus size={13}/> הוסף
            </button>
          </div>
          {formError && (
            <p style={{ color:"#ef4444", fontSize:"0.72rem", margin:"7px 0 0",
              display:"flex", alignItems:"center", gap:4 }}>
              <AlertTriangle size={10} color="#ef4444"/> {formError}
            </p>
          )}
        </div>
      ) : (
        <p style={{ color:"#334155", fontSize:"0.68rem", textAlign:"center", marginTop:4 }}>
          רק נגד מטבח יכול להוסיף/למחוק הכנות
        </p>
      )}
    </AdminPageShell>
  );
}
