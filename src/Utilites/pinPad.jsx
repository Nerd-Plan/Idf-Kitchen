import React, { useState } from "react";

export default function PinPad({ color = "#fbbf24", onComplete, error }) {
  const [pinInput, setPinInput] = useState("");

  const handlePin = () => {
    if (pinInput.length !== 4) return;
    onComplete?.(pinInput);
    setPinInput("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <input
        type="password"
        inputMode="numeric"
        maxLength={4}
        value={pinInput}
        autoFocus
        onChange={(e) => {
          if (/^\d*$/.test(e.target.value)) setPinInput(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && pinInput.length === 4) handlePin();
        }}
      />
      <button
        type="button"
        onClick={handlePin}
        disabled={pinInput.length !== 4}
        style={{
          background: color,
          border: "none",
          borderRadius: 6,
          padding: "8px 12px",
          cursor: pinInput.length === 4 ? "pointer" : "not-allowed",
          opacity: pinInput.length === 4 ? 1 : 0.65,
          fontWeight: 700,
        }}
      >
        אישור
      </button>
      {error ? <span style={{ color: "#ef4444", fontSize: "0.8rem" }}>{error}</span> : null}
    </div>
  );
}
