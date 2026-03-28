import React, { useState, useRef, useEffect } from "react";
import { Edit3 } from "lucide-react";

export default function IE({ value, onSave, canEdit = true, style = {} }) {
  const [on, setOn] = useState(false);
  const [d, setD] = useState(value);
  const ref = useRef();
  useEffect(() => { if (on) ref.current?.focus(); }, [on]);
  if (!canEdit) return <span style={style}>{value}</span>;
  if (on) {
    return (
      <span style={{ display:"inline-flex", alignItems:"center", gap:3 }}>
        <input
          ref={ref} value={d} onChange={e => setD(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") { onSave(d.trim() || value); setOn(false); }
            if (e.key === "Escape") { setD(value); setOn(false); }
          }}
          onBlur={() => { onSave(d.trim() || value); setOn(false); }}
          style={{ background:"#0f172a", border:"1px solid #fbbf24", borderRadius:4, color:"#fbbf24",
            padding:"2px 6px", fontSize:"inherit", fontWeight:"inherit", direction:"rtl", minWidth:80, ...style }}
        />
      </span>
    );
  }
  return (
    <span onClick={() => { setD(value); setOn(true); }} title="לחץ לעריכה"
      style={{ ...style, cursor:"pointer", borderBottom:"1px dashed #fbbf2430",
        display:"inline-flex", alignItems:"center", gap:3 }}>
      {value}
      <Edit3 size={9} color="#fbbf24" style={{ opacity:0.3, flexShrink:0 }} />
    </span>
  );
}

