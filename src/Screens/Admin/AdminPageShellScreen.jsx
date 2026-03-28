import React from "react";
import { LogOut, Printer, RotateCcw, Save, Search, Settings, ShieldAlert } from "lucide-react";
import AppBrand from "../../Components/AppBrand";
import { warmTheme, withAlpha } from "../../Utils/uiTheme";

export default function AdminPageShell({
  title,
  icon: Icon,
  accent = "#f2c078",
  onBack,
  onLogout,
  user,
  saved,
  editMode,
  onToggleEdit,
  onReset,
  isAdmin,
  onOpenSearch,
  onExportStatus,
  children,
}) {
  const HeaderIcon = Icon;
  const roleColor = { nagad: "#f28d61", admin: "#f2c078", cook: "#98c776" };
  const activeRoleColor = roleColor[user.role] || warmTheme.colors.muted;

  return (
    <div
      className="app-shell warm-elevated motion-stage motion-stage--app"
      style={{
        minHeight: "100vh",
        background: warmTheme.backgrounds.app,
        direction: "rtl",
        fontFamily: warmTheme.fontFamily,
        color: warmTheme.colors.text,
      }}
    >
      <div
        className="topbar-shell"
        style={{
          background: editMode ? warmTheme.backgrounds.topbarEdit : warmTheme.backgrounds.topbar,
          borderBottom: `2px solid ${editMode ? withAlpha(warmTheme.colors.accent, "aa") : withAlpha(warmTheme.colors.lineSoft, "aa")}`,
          padding: "calc(env(safe-area-inset-top, 0px) + 8px) 0 8px",
        }}
      >
        <div className="topbar-inner">
          <div className="toolbar-row">
            <button
              onClick={onBack}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: accent,
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: "0.9rem",
                fontWeight: 800,
                padding: 0,
              }}
            >
              <HeaderIcon size={18} /> {title}
            </button>
            {saved ? (
              <span
                style={{
                  fontSize: "0.68rem",
                  color: warmTheme.colors.success,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Save size={10} /> נשמר
              </span>
            ) : null}
          </div>

          <div className="toolbar-row" style={{ justifyContent: "flex-end" }}>
            <AppBrand compact showSubtitle={false} textAlign="right" iconSize={30} />
            <span
              className="pill-chip pill-chip--compact"
              style={{
                color: activeRoleColor,
                background: withAlpha(activeRoleColor, "26"),
                borderColor: withAlpha(activeRoleColor, "88"),
              }}
            >
              {user.avatar} {user.name}
            </span>
            {isAdmin && onToggleEdit ? (
              <button
                onClick={onToggleEdit}
                className={editMode ? "button-primary" : "button-secondary"}
                style={{
                  minHeight: 34,
                  padding: "0 12px",
                  fontSize: "0.74rem",
                  color: editMode ? "#2a170d" : warmTheme.colors.muted,
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Settings size={11} />
                  {editMode ? "סיום" : "עריכה"}
                </span>
              </button>
            ) : null}
            {onOpenSearch ? (
              <button onClick={onOpenSearch} className="button-secondary" style={{ minHeight: 34, padding: "0 12px", fontSize: "0.74rem", color: warmTheme.colors.text }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Search size={11} />
                  חיפוש
                </span>
              </button>
            ) : null}
            {onExportStatus ? (
              <button onClick={onExportStatus} className="button-secondary" style={{ minHeight: 34, padding: "0 12px", fontSize: "0.74rem", color: warmTheme.colors.text }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Printer size={11} />
                  הדפסה / PDF
                </span>
              </button>
            ) : null}
            <button
              onClick={onLogout}
              className="button-secondary"
              style={{ minHeight: 34, padding: "0 12px", fontSize: "0.74rem", color: warmTheme.colors.muted }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <LogOut size={11} />
                יציאה
              </span>
            </button>
          </div>
        </div>
      </div>

      {editMode ? (
        <div style={{ background: "linear-gradient(90deg,#7d370e,#4f220b)", borderBottom: `1px solid ${warmTheme.colors.accent}`, padding: "8px 0" }}>
          <div
            className="app-frame"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
              fontSize: "0.71rem",
              color: "#ffd8b4",
              fontWeight: 700,
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <ShieldAlert size={11} />
              מצב עריכה פעיל
            </span>
            <span style={{ opacity: 0.85 }}>נשמר אוטומטית</span>
            {onReset ? (
              <button
                onClick={onReset}
                className="button-secondary"
                style={{
                  minHeight: 32,
                  padding: "0 11px",
                  fontSize: "0.68rem",
                  color: "#ffd4be",
                  borderColor: withAlpha(warmTheme.colors.danger, "88"),
                  background: withAlpha(warmTheme.colors.danger, "26"),
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <RotateCcw size={10} />
                  איפוס
                </span>
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="app-frame dashboard-layout">
        <div className="hero-panel warm-hero-enter" style={{ background: warmTheme.backgrounds.cardTint(accent) }}>
          <div className="hero-grid content-panel--spacious">
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div
                style={{
                  width: 54,
                  height: 54,
                  background: `linear-gradient(135deg,${accent},${withAlpha(accent, "cc")})`,
                  borderRadius: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 0 20px ${withAlpha(accent, "55")}`,
                  flexShrink: 0,
                }}
              >
                <HeaderIcon size={24} color="#2a170d" />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "1.3rem", fontWeight: 900, color: accent }}>{title}</div>
                <div className="action-row" style={{ marginTop: 14 }}>
                  <span
                    className="pill-chip"
                    style={{
                      color: activeRoleColor,
                      background: withAlpha(activeRoleColor, "1f"),
                      borderColor: withAlpha(activeRoleColor, "66"),
                    }}
                  >
                    {user.avatar} {user.name}
                  </span>
                  <span
                    className="pill-chip"
                    style={{ color: accent, background: withAlpha(accent, "18"), borderColor: withAlpha(accent, "66") }}
                  >
                    {editMode ? "עריכה פעילה" : "תצוגה"}
                  </span>
                </div>
              </div>
            </div>

            <div className="surface-card surface-card--soft content-panel">
              <div className="summary-panel">
                <div>
                  <div className="action-row">
                    <button onClick={onBack} className="button-secondary" style={{ color: warmTheme.colors.text }}>
                      בית
                    </button>
                    <button onClick={onLogout} className="button-secondary" style={{ color: warmTheme.colors.muted }}>
                      יציאה
                    </button>
                  </div>
                </div>

                <div style={{ borderTop: `1px solid ${withAlpha(accent, "44")}`, paddingTop: 12 }}>
                  <div className="summary-list__item">
                    <span className="summary-list__label">מסך פעיל</span>
                    <span className="summary-list__value" style={{ color: accent }}>
                      {title}
                    </span>
                  </div>
                  <div className="summary-list__item" style={{ marginTop: 8 }}>
                    <span className="summary-list__label">סטטוס</span>
                    <span className="summary-list__value" style={{ color: saved ? warmTheme.colors.success : warmTheme.colors.info }}>
                      {saved ? "עודכן ונשמר" : "מוכן לעבודה"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="motion-stage motion-stage--panel" style={{ paddingTop: 14 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
