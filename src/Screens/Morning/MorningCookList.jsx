import React from "react";
import { Users, Check } from "lucide-react";
import AdminPageShell from "../Admin/AdminPageShellScreen";
import { canEditKitchen } from "../../Utils/helpers";
    
export default function MorningCookList({ data, staff, setData, onBack, onLogout, user, saved, isNagad, onOpenSearch, onExportStatus }) {
  const assigned = data.morningCooks || [];
  const canEdit = isNagad || canEditKitchen(user);
  const activeCooks = (staff || []).filter(s => s.active);
 
  const toggle = (id) => {
    setData(d => ({
      ...d,
      morningCooks: assigned.includes(id)
        ? assigned.filter(x => x !== id)
        : [...assigned, id]
    }));
  };
 
  return (
    <AdminPageShell title="טבחי פתיחת בוקר" icon={Users} accent="#06b6d4"
      onBack={onBack} onLogout={onLogout} user={user} saved={saved} isAdmin={canEdit}
      onOpenSearch={onOpenSearch} onExportStatus={onExportStatus}>
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:"0.78rem", color:"#64748b", marginBottom:13 }}>
          סמן את הטבחים האחראים על פתיחת המטבח היום. השינויים נשמרים אוטומטית.
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {activeCooks.map(cook => {
            const isAssigned = assigned.includes(cook.id);
            return (
              <div key={cook.id}
                onClick={() => canEdit && toggle(cook.id)}
                style={{ background: isAssigned ? `${cook.color}18` : "#1e293b",
                  border:`1px solid ${isAssigned ? cook.color : "#334155"}`,
                  borderRadius:11, padding:"11px 14px",
                  display:"flex", alignItems:"center", gap:12,
                  cursor: canEdit ? "pointer" : "default",
                  transition:"all 0.15s" }}>
                <div style={{ width:36, height:36, background:`linear-gradient(135deg,${cook.color},${cook.color}aa)`,
                  borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem", flexShrink:0 }}>
                  {cook.avatar}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"0.88rem", fontWeight:700, color: isAssigned ? cook.color : "#94a3b8" }}>{cook.name}</div>
                  <div style={{ fontSize:"0.65rem", color:"#475569" }}>
                    {cook.role === "nagad" ? "🎖️ נגד מטבח" : cook.role === "admin" ? "👑 שף / אחראי" : "🧑‍🍳 טבח"}
                  </div>
                </div>
                <div style={{ width:22, height:22, borderRadius:6,
                  background: isAssigned ? cook.color : "transparent",
                  border:`2px solid ${isAssigned ? cook.color : "#334155"}`,
                  display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {isAssigned && <Check size={13} color="#0f172a"/>}
                </div>
              </div>
            );
          })}
          {activeCooks.length === 0 && (
            <p style={{ color:"#334155", fontSize:"0.8rem", textAlign:"center", padding:20 }}>אין טבחים פעילים במערכת</p>
          )}
        </div>
        {assigned.length > 0 && (
          <div style={{ marginTop:14, background:"#0a1f1a", border:"1px solid #06b6d433",
            borderRadius:9, padding:"10px 14px" }}>
            <div style={{ fontSize:"0.7rem", color:"#06b6d4", fontWeight:700, marginBottom:6 }}>
              🌅 פותחים בוקר היום ({assigned.length}):
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {assigned.map(id => {
                const c = activeCooks.find(x => x.id === id);
                if (!c) return null;
                return (
                  <span key={id} style={{ background:`${c.color}22`, border:`1px solid ${c.color}55`,
                    borderRadius:20, padding:"2px 10px", fontSize:"0.72rem", color:c.color, fontWeight:700 }}>
                    {c.avatar} {c.name.split(" ").pop()}
                  </span>
                );
              })}
            </div>
          </div>
        )}
        {!canEdit && (
          <p style={{ color:"#334155", fontSize:"0.68rem", textAlign:"center", marginTop:12 }}>
            רק נגד המטבח יכול לשנות את רשימה זו
          </p>
        )}
      </div>
    </AdminPageShell>
  );
}
 
