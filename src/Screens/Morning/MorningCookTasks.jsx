import React, { useState, useRef } from "react";
import { ListChecks, Check, Plus, X } from "lucide-react";
import AdminPageShell from "../Admin/AdminPageShellScreen";
import { canEditKitchen } from "../../Utils/helpers";
export default function MorningCookTasks({ data, setData, onBack, onLogout, user, saved, isNagad, onOpenSearch, onExportStatus }) {
  const tasks    = data.morningTasks || [];
  const canEdit = isNagad || canEditKitchen(user);
  const [newText, setNewText] = useState("");
  const inputRef = useRef(null);
 
  const toggleTask = (id) => {
    setData(d => ({
      ...d,
      morningTasks: d.morningTasks.map(t => t.id === id ? { ...t, done:!t.done } : t)
    }));
  };
 
  const addTask = () => {
    const text = newText.trim();
    if (!text) return;
    setData(d => ({
      ...d,
      morningTasks: [...(d.morningTasks||[]), { id:"mt"+Date.now(), text, done:false }]
    }));
    setNewText("");
    inputRef.current?.focus();
  };
 
  const removeTask = (id) => {
    setData(d => ({ ...d, morningTasks:d.morningTasks.filter(t => t.id !== id) }));
  };
 
  const doneCount  = tasks.filter(t => t.done).length;
  const totalCount = tasks.length;
  const pct        = totalCount ? Math.round((doneCount/totalCount)*100) : 0;
 
  return (
    <AdminPageShell title="משימות פתיחת בוקר" icon={ListChecks} accent="#f97316"
      onBack={onBack} onLogout={onLogout} user={user} saved={saved} isAdmin={canEdit}
      onOpenSearch={onOpenSearch} onExportStatus={onExportStatus}>
      {/* Progress */}
      <div style={{ background:"#1e293b", borderRadius:10, padding:"11px 14px", marginBottom:14,
        display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
            <span style={{ fontSize:"0.74rem", color:"#f97316", fontWeight:700 }}>התקדמות</span>
            <span style={{ fontSize:"0.74rem", color:"#94a3b8", fontFamily:"monospace" }}>{doneCount}/{totalCount}</span>
          </div>
          <div style={{ height:7, background:"#0f172a", borderRadius:4 }}>
            <div style={{ height:"100%", borderRadius:4, transition:"width 0.3s",
              background:`linear-gradient(90deg,#f97316,#fbbf24)`, width:`${pct}%` }}/>
          </div>
        </div>
        <div style={{ fontSize:"1.4rem", fontWeight:900, color: pct===100?"#22c55e":"#f97316",
          fontFamily:"monospace", minWidth:42, textAlign:"center" }}>{pct}%</div>
      </div>
 
      {/* Task list */}
      <div style={{ display:"flex", flexDirection:"column", gap:7, marginBottom:14 }}>
        {tasks.map(task => (
          <div key={task.id} style={{ background: task.done ? "#0a1f0a" : "#1e293b",
            border:`1px solid ${task.done?"#22c55e33":"#334155"}`,
            borderRadius:9, padding:"10px 14px",
            display:"flex", alignItems:"center", gap:11 }}>
            {/* Checkbox */}
            <button onClick={() => toggleTask(task.id)}
              style={{ width:24, height:24, borderRadius:7, flexShrink:0, cursor:"pointer",
                background: task.done ? "#22c55e" : "transparent",
                border:`2px solid ${task.done?"#22c55e":"#475569"}`,
                display:"flex", alignItems:"center", justifyContent:"center" }}>
              {task.done && <Check size={13} color="#0f172a"/>}
            </button>
            {/* Task text */}
            <span style={{ flex:1, fontSize:"0.84rem",
              color: task.done ? "#4ade80" : "#f1f5f9",
              textDecoration: task.done ? "line-through" : "none",
              opacity: task.done ? 0.7 : 1 }}>
              {task.text}
            </span>
            {/* Remove (nagad only) */}
            {canEdit && (
              <button onClick={() => removeTask(task.id)}
                style={{ background:"none", border:"none", cursor:"pointer", padding:0, flexShrink:0 }}>
                <X size={12} color="#ef444455"/>
              </button>
            )}
          </div>
        ))}
        {tasks.length === 0 && (
          <p style={{ color:"#334155", fontSize:"0.8rem", textAlign:"center", padding:20 }}>אין משימות — הוסף למטה</p>
        )}
      </div>
 
      {/* Add task form (nagad only) */}
      {canEdit && (
        <div style={{ display:"flex", gap:8 }}>
          <input
            ref={inputRef}
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") addTask(); }}
            placeholder="הוסף משימה חדשה..."
            style={{ flex:1, background:"#1e293b", border:"1px solid #f9731655",
              borderRadius:8, color:"#f1f5f9", padding:"9px 12px", fontSize:"0.82rem",
              direction:"rtl", outline:"none" }}
          />
          <button onClick={addTask}
            style={{ background:"linear-gradient(135deg,#f97316,#ea580c)", border:"none",
              borderRadius:8, padding:"9px 16px", cursor:"pointer", color:"#fff",
              fontSize:"0.8rem", fontWeight:700, display:"flex", alignItems:"center", gap:4 }}>
            <Plus size={13}/> הוסף
          </button>
        </div>
      )}
      {!canEdit && (
        <p style={{ color:"#334155", fontSize:"0.68rem", textAlign:"center", marginTop:4 }}>
          רק נגד המטבח יכול להוסיף/להסיר משימות
        </p>
      )}
    </AdminPageShell>
  );
}
