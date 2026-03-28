import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, LogOut, MapPin, Menu, Star, X } from "lucide-react";
import AppBrand from "../../Components/AppBrand";
import { nowISO } from "../../Utils/helpers";
import { warmTheme, withAlpha } from "../../Utils/uiTheme";

const MEAL_SECTIONS = [
  { key: "breakfast", label: "ארוחת בוקר", icon: "🌅", color: "#f2c078" },
  { key: "lunch", label: "ארוחת צהריים", icon: "☀️", color: "#98c776" },
  { key: "dinner", label: "ארוחת ערב", icon: "🌙", color: "#dfb587" },
];

export default function SoldierView({ data, user, onLogout, onRate }) {
  const [expandedDishId, setExpandedDishId] = useState(null);
  const [showRateForMeal, setShowRateForMeal] = useState(null);
  const [rated, setRated] = useState({});
  const [hover, setHover] = useState({});
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openMeals, setOpenMeals] = useState({ breakfast: true, lunch: true, dinner: true });

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isMenuOpen || typeof document === "undefined") return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen]);

  const submit = (mealKey) => {
    const stars = rated[mealKey];
    if (!stars) return;
    onRate({ meal: mealKey, stars, comment, time: nowISO() });
    setSent((current) => ({ ...current, [mealKey]: true }));
    setShowRateForMeal(null);
    setComment("");
  };

  const toggleMeal = (mealKey) => {
    setOpenMeals((current) => ({ ...current, [mealKey]: !(current[mealKey] ?? true) }));
  };

  const jumpToMeal = (mealKey) => {
    if (typeof document === "undefined") return;
    setOpenMeals((current) => ({ ...current, [mealKey]: true }));
    document.getElementById(`soldier-meal-${mealKey}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setIsMenuOpen(false);
  };

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
          background: warmTheme.backgrounds.topbar,
          borderBottom: `1px solid ${withAlpha(warmTheme.colors.lineSoft, "aa")}`,
          padding: "calc(env(safe-area-inset-top, 0px) + 8px) 0 8px",
        }}
      >
        <div className="topbar-inner">
          <div className="toolbar-row">
            <AppBrand compact subtitle="מסך חייל" textAlign="right" />
          </div>

          <div className="toolbar-row" style={{ justifyContent: "flex-end" }}>
            <span className="pill-chip pill-chip--compact" style={{ color: "#cce7b6", background: withAlpha(warmTheme.colors.success, "14"), borderColor: withAlpha(warmTheme.colors.success, "44") }}>
              {user.avatar} {user.name}
            </span>
            {user.baseName ? (
              <span className="pill-chip pill-chip--compact" style={{ color: warmTheme.colors.info, background: withAlpha(warmTheme.colors.info, "1f"), borderColor: withAlpha(warmTheme.colors.info, "66") }}>
                <MapPin size={10} />
                {user.baseName}
              </span>
            ) : null}
            <button onClick={onLogout} className="button-secondary" style={{ minHeight: 34, padding: "0 12px", fontSize: "0.74rem", color: warmTheme.colors.muted }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <LogOut size={11} />
                יציאה
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="app-frame dashboard-layout">
        <div className="dashboard-stack">
          <div className="hero-panel warm-hero-enter" style={{ background: warmTheme.backgrounds.hero }}>
            <div className="hero-grid content-panel--spacious">
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
                  <div style={{ width: 58, height: 58, borderRadius: 18, display: "grid", placeItems: "center", background: "linear-gradient(135deg,#8ac76b,#5f8f42)", color: "#223013", fontSize: "1.8rem", fontWeight: 900 }}>
                    🪖
                  </div>
                  <div>
                    <div style={{ fontSize: "1.35rem", fontWeight: 900, color: warmTheme.colors.accent }}>תפריט יומי</div>
                    <div style={{ fontSize: "0.78rem", color: warmTheme.colors.muted, marginTop: 3 }}>
                      {new Date().toLocaleDateString("he-IL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    </div>
                  </div>
                </div>

                <div className="action-row" style={{ marginTop: 16 }}>
                  <span className="pill-chip" style={{ color: warmTheme.colors.success, background: withAlpha(warmTheme.colors.success, "16"), borderColor: withAlpha(warmTheme.colors.success, "55") }}>
                    המטבח פתוח
                  </span>
                  {user.baseName ? (
                    <span className="pill-chip" style={{ color: warmTheme.colors.info, background: withAlpha(warmTheme.colors.info, "16"), borderColor: withAlpha(warmTheme.colors.info, "55") }}>
                      {user.baseName}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="surface-card surface-card--soft content-panel">
                <div className="summary-panel">
                  <div style={{ fontSize: "0.8rem", fontWeight: 800, color: warmTheme.colors.accent }}>ארוחות היום</div>
                  <div className="summary-list">
                    <div className="summary-list__item">
                      <span className="summary-list__label">בוקר</span>
                      <span className="summary-list__value">{(data.dailyMenu?.breakfast || []).length} פריטים</span>
                    </div>
                    <div className="summary-list__item">
                      <span className="summary-list__label">צהריים</span>
                      <span className="summary-list__value">{(data.dailyMenu?.lunch || []).length} פריטים</span>
                    </div>
                    <div className="summary-list__item">
                      <span className="summary-list__label">ערב</span>
                      <span className="summary-list__value">{(data.dailyMenu?.dinner || []).length} פריטים</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {MEAL_SECTIONS.map(({ key, label, icon, color }) => {
            const ratings = (data.feedback || []).filter((entry) => entry.meal === key);
            const average = ratings.length ? (ratings.reduce((sum, entry) => sum + entry.stars, 0) / ratings.length).toFixed(1) : null;
            const isMealOpen = openMeals[key] ?? true;

            return (
              <div id={`soldier-meal-${key}`} key={key} className="surface-card surface-card--soft content-panel warm-card-enter">
                <div className="section-heading" style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{ fontSize: "1.4rem" }}>{icon}</span>
                    <div>
                      <div style={{ fontSize: "1rem", fontWeight: 900, color }}>{label}</div>
                      {average ? <div className="section-note">⭐ {average} ({ratings.length})</div> : null}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {!sent[key] ? (
                      <button
                        onClick={() => setShowRateForMeal(showRateForMeal === key ? null : key)}
                        className="button-secondary"
                        style={{ minHeight: 34, padding: "0 12px", color, borderColor: withAlpha(color, "77"), background: withAlpha(color, "2b") }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <Star size={10} />
                          דרג
                        </span>
                      </button>
                    ) : (
                      <span className="pill-chip pill-chip--compact" style={{ color: warmTheme.colors.success, background: withAlpha(warmTheme.colors.success, "18"), borderColor: withAlpha(warmTheme.colors.success, "66") }}>
                        תודה!
                      </span>
                    )}

                    <button onClick={() => toggleMeal(key)} className="button-secondary" style={{ minHeight: 34, padding: "0 12px", color: warmTheme.colors.text }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        {isMealOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {isMealOpen ? "סגור" : "פתח"}
                      </span>
                    </button>
                  </div>
                </div>

                {isMealOpen ? (
                  <>
                    <div className="tile-grid tile-grid--dense" style={{ marginBottom: key === "lunch" ? 10 : 0 }}>
                      {(data.dailyMenu?.[key] || []).map((item, index) => (
                        <div key={index} className="surface-card content-panel" style={{ borderColor: withAlpha(color, "55"), minHeight: 110 }}>
                          <div style={{ fontSize: "0.9rem", fontWeight: 700, color: warmTheme.colors.textStrong, marginBottom: 4 }}>{item.name}</div>
                          <div style={{ fontSize: "0.74rem", color: warmTheme.colors.muted, lineHeight: 1.55 }}>{item.desc}</div>
                        </div>
                      ))}
                    </div>

                    {key === "lunch"
                      ? (data.hotFood || []).map((dish) => {
                          const isDishOpen = expandedDishId === dish.id;
                          return (
                            <div key={dish.id} className="surface-card" style={{ marginTop: 8, overflow: "hidden" }}>
                              <button
                                onClick={() => setExpandedDishId(isDishOpen ? null : dish.id)}
                                style={{
                                  width: "100%",
                                  padding: "12px 14px",
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  direction: "rtl",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                  color: warmTheme.colors.text,
                                }}
                              >
                                <span style={{ fontSize: "1.2rem" }}>{dish.emoji}</span>
                                <div style={{ flex: 1, textAlign: "right" }}>
                                  <div style={{ fontSize: "0.88rem", fontWeight: 700, color: warmTheme.colors.textStrong }}>{dish.name}</div>
                                  <div style={{ fontSize: "0.7rem", color: warmTheme.colors.muted }}>{dish.desc}</div>
                                </div>
                                <span style={{ color: warmTheme.colors.muted, fontSize: "0.86rem" }}>{isDishOpen ? "▲" : "▼"}</span>
                              </button>

                              {isDishOpen ? (
                                <div style={{ padding: "0 14px 14px", borderTop: `1px solid ${withAlpha(warmTheme.colors.line, "55")}` }}>
                                  {(dish.allergens || []).filter(Boolean).length > 0 ? (
                                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                                      <span className="section-note">אלרגנים:</span>
                                      {dish.allergens
                                        .filter(Boolean)
                                        .map((allergen, idx) => (
                                          <span key={idx} className="pill-chip pill-chip--compact" style={{ color: warmTheme.colors.info, background: withAlpha(warmTheme.colors.info, "18"), borderColor: withAlpha(warmTheme.colors.info, "55") }}>
                                            {allergen}
                                          </span>
                                        ))}
                                    </div>
                                  ) : null}

                                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                                    {(dish.ingredients || []).map((ingredient, idx) => (
                                      <span key={idx} className="pill-chip pill-chip--compact">
                                        {ingredient.name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          );
                        })
                      : null}

                    {showRateForMeal === key && !sent[key] ? (
                      <div className="surface-card content-panel" style={{ marginTop: 12, borderColor: withAlpha(color, "88") }}>
                        <p style={{ fontSize: "0.84rem", fontWeight: 700, color: warmTheme.colors.textStrong, margin: "0 0 10px" }}>איך הייתה {label}?</p>
                        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 10 }}>
                          {[1, 2, 3, 4, 5].map((stars) => (
                            <button
                              key={stars}
                              onMouseEnter={() => setHover((current) => ({ ...current, [key]: stars }))}
                              onMouseLeave={() => setHover((current) => ({ ...current, [key]: 0 }))}
                              onClick={() => setRated((current) => ({ ...current, [key]: stars }))}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "1.6rem",
                                transform: (hover[key] || rated[key]) >= stars ? "scale(1.15)" : "scale(1)",
                              }}
                            >
                              {(hover[key] || rated[key]) >= stars ? "⭐" : "☆"}
                            </button>
                          ))}
                        </div>

                        {rated[key] ? (
                          <div className="field-stack">
                            <input
                              value={comment}
                              onChange={(event) => setComment(event.target.value)}
                              placeholder="הערה (אופציונלי)..."
                              className="input-surface"
                              style={{ direction: "rtl" }}
                            />
                            <button onClick={() => submit(key)} className="button-primary" style={{ width: "100%", background: "linear-gradient(135deg,#8ac76b,#5f8f42)", color: "#223013" }}>
                              שלח דירוג
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <button
        className="dashboard-mobile-note-toggle"
        onClick={() => setIsMenuOpen(true)}
        aria-label="פתח תפריט ארוחות"
        style={{ opacity: isMenuOpen ? 0 : 1, pointerEvents: isMenuOpen ? "none" : "auto" }}
      >
        <Menu size={18} />
        <span className="dashboard-mobile-note-toggle__label">תפריט</span>
      </button>

      <div className={`dashboard-sidebar-backdrop ${isMenuOpen ? "dashboard-sidebar-backdrop--open" : ""}`} onClick={() => setIsMenuOpen(false)} />
      <div className={`dashboard-sidebar-drawer ${isMenuOpen ? "dashboard-sidebar-drawer--open" : ""}`}>
        <div className="dashboard-sidebar-drawer__panel">
          <div className="surface-card surface-card--soft content-panel" style={{ height: "100%", overflowY: "auto", position: "relative" }}>
            <button className="dashboard-sidebar-drawer__close" onClick={() => setIsMenuOpen(false)} aria-label="סגור תפריט">
              <X size={16} />
            </button>
            <div style={{ fontSize: "1rem", fontWeight: 900, color: warmTheme.colors.accent, marginBottom: 6 }}>תפריט חייל</div>
            <div style={{ fontSize: "0.74rem", color: warmTheme.colors.muted, marginBottom: 14 }}>בחר ארוחה כדי לקפוץ ישר אליה.</div>

            <div className="app-stack">
              {MEAL_SECTIONS.map((section) => (
                <button
                  key={`nav-${section.key}`}
                  onClick={() => jumpToMeal(section.key)}
                  className="option-card"
                  style={{
                    background: warmTheme.backgrounds.cardTint(section.color),
                    borderColor: withAlpha(section.color, "88"),
                  }}
                >
                  <div
                    className="icon-badge"
                    style={{
                      background: `linear-gradient(135deg,${section.color},${withAlpha(section.color, "cc")})`,
                      color: "#2a170d",
                      fontSize: "1.2rem",
                    }}
                  >
                    {section.icon}
                  </div>
                  <div className="option-card__body">
                    <div className="option-card__title" style={{ color: section.color }}>
                      {section.label}
                    </div>
                    <div className="option-card__text">פתח את אזור הארוחה על המסך</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
