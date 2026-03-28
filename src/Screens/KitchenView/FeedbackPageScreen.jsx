import React from "react";
import { BarChart2 } from "lucide-react";
import AdminPageShell from "../Admin/AdminPageShellScreen";
import { fmtTime } from "../../Utils/helpers";
export default function FeedbackPage({ data, onBack, onLogout, user, saved, onOpenSearch, onExportStatus }) {
  return (
    <AdminPageShell title="דירוגי סועדים" icon={BarChart2} accent="#818cf8"
      onBack={onBack} onLogout={onLogout} user={user} saved={saved} isAdmin={false}
      onOpenSearch={onOpenSearch} onExportStatus={onExportStatus}>
      {(!data.feedback||!data.feedback.length) && (
        <p style={{ color:"#334155", fontSize:"0.79rem", textAlign:"center", padding:20 }}>אין דירוגים עדיין</p>
      )}
      <div className="responsive-grid responsive-grid--three" style={{ gap:11, marginBottom:14 }}>
        {[{key:"breakfast",label:"בוקר",icon:"🌅"},{key:"lunch",label:"צהריים",icon:"☀️"},{key:"dinner",label:"ערב",icon:"🌙"}].map(m => {
          const rs   = (data.feedback||[]).filter(f=>f.meal===m.key);
          const avg  = rs.length ? (rs.reduce((a,r)=>a+r.stars,0)/rs.length).toFixed(1) : "—";
          const dist = [1,2,3,4,5].map(s => rs.filter(r=>r.stars===s).length);
          return (
            <div key={m.key} style={{ background:"#1e293b", borderRadius:11, padding:13, border:"1px solid #334155" }}>
              <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:7 }}>
                <span style={{ fontSize:"1rem" }}>{m.icon}</span>
                <span style={{ fontSize:"0.8rem", fontWeight:700, color:"#f1f5f9" }}>{m.label}</span>
              </div>
              <div style={{ fontSize:"1.7rem", fontWeight:900, color:"#fbbf24", marginBottom:1 }}>{avg}</div>
              <div style={{ fontSize:"0.63rem", color:"#64748b", marginBottom:7 }}>{rs.length} דירוגים</div>
              <div style={{ display:"flex", gap:2, alignItems:"flex-end", height:32 }}>
                {dist.map((c,i) => {
                  const mx = Math.max(...dist,1);
                  return (
                    <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:1 }}>
                      <div style={{ width:"100%", background:"#fbbf24", borderRadius:2,
                        height:Math.max(3,(c/mx)*28)+"px", opacity:c===0?0.12:1 }}/>
                      <span style={{ fontSize:"0.48rem", color:"#475569" }}>{i+1}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
        {[...(data.feedback||[])].reverse().slice(0,12).map((f,i) => (
          <div key={i} style={{ background:"#0f172a", borderRadius:7, padding:"7px 10px",
            display:"flex", gap:8, alignItems:"center", border:"1px solid #1e293b" }}>
            <div style={{ fontSize:"0.84rem" }}>{"⭐".repeat(f.stars)}</div>
            <div style={{ flex:1 }}>
              {f.comment && <div style={{ fontSize:"0.71rem", color:"#94a3b8" }}>{f.comment}</div>}
              <div style={{ fontSize:"0.59rem", color:"#334155" }}>
                {f.meal==="breakfast"?"בוקר":f.meal==="lunch"?"צהריים":"ערב"} • {fmtTime(f.time)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminPageShell>
  );
}
