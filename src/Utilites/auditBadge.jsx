import React from "react";
import { fmtTime } from "../Utils/helpers";

export default function AuditBadge({ userId, at, staff }) {
  if (!userId) return null;
  const u = staff.find(s => s.id === userId);
  if (!u) return null;
  return (
    <span title={`עודכן ע״י ${u.name} ב-${fmtTime(at)}`} style={{
      fontSize:"0.57rem", color:u.color, background:`${u.color}18`,
      border:`1px solid ${u.color}33`, borderRadius:10,
      padding:"1px 5px", display:"inline-flex", alignItems:"center", gap:2, flexShrink:0,
    }}>
      {u.avatar} {u.name.split(" ").pop()} {fmtTime(at)}
    </span>
  );
}
