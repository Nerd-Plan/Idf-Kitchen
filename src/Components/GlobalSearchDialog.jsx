import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search, X } from "lucide-react";
import { searchGlobalIndex } from "../Utils/globalSearch";
import { warmTheme, withAlpha } from "../Utils/uiTheme";

export default function GlobalSearchDialog({ open, index, onClose, onSelect }) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const deferredQuery = useDeferredValue(query);
  const results = useMemo(() => searchGlobalIndex(index, deferredQuery), [index, deferredQuery]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((current) => Math.min(current + 1, Math.max(results.length - 1, 0)));
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((current) => Math.max(current - 1, 0));
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        const result = results[activeIndex];
        if (result) onSelect(result);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, onClose, onSelect, open, results]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 120,
        background: "rgba(12, 7, 4, 0.72)",
        backdropFilter: "blur(6px)",
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="surface-card surface-card--soft"
        style={{
          width: "min(760px, 100%)",
          maxHeight: "min(82vh, 760px)",
          overflow: "hidden",
          borderColor: withAlpha(warmTheme.colors.accent, "66"),
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="content-panel" style={{ borderBottom: `1px solid ${withAlpha(warmTheme.colors.lineSoft, "66")}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              className="icon-badge"
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                background: `linear-gradient(135deg,${warmTheme.colors.accent},${withAlpha(warmTheme.colors.accentStrong, "dd")})`,
              }}
            >
              <Search size={18} color="#2a170d" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "1rem", fontWeight: 900, color: warmTheme.colors.textStrong }}>חיפוש מהיר</div>
              <div style={{ fontSize: "0.72rem", color: warmTheme.colors.muted }}>
                חפש אנשי צוות, משימות, הודעות ופריטי מלאי. אפשר גם בקיצור המקלדת Ctrl/Cmd + K.
              </div>
            </div>
            <button onClick={onClose} className="button-secondary" style={{ minHeight: 38, minWidth: 38, padding: 0 }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ marginTop: 14, position: "relative" }}>
            <Search size={16} color={warmTheme.colors.muted} style={{ position: "absolute", top: 14, right: 14 }} />
            <input
              autoFocus
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
              }}
              className="input-surface"
              placeholder="חפש שם, תפקיד, משימה, הודעה או פריט מלאי"
              style={{ paddingRight: 40 }}
            />
          </div>
        </div>

        <div style={{ padding: 10, overflowY: "auto", maxHeight: "calc(min(82vh, 760px) - 140px)" }}>
          {results.length ? (
            <div style={{ display: "grid", gap: 8 }}>
              {results.map((result, indexPosition) => {
                const isActive = indexPosition === activeIndex;
                return (
                  <button
                    key={result.id}
                    onClick={() => onSelect(result)}
                    onMouseEnter={() => setActiveIndex(indexPosition)}
                    className="option-card"
                    style={{
                      padding: 12,
                      background: isActive ? warmTheme.backgrounds.cardTint(warmTheme.colors.accent) : warmTheme.backgrounds.card,
                      borderColor: isActive ? withAlpha(warmTheme.colors.accent, "88") : withAlpha(warmTheme.colors.lineSoft, "66"),
                    }}
                  >
                    <div className="option-card__body">
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                        <span className="pill-chip pill-chip--compact" style={{ color: warmTheme.colors.accent }}>
                          {result.typeLabel}
                        </span>
                        <span className="pill-chip pill-chip--compact" style={{ color: warmTheme.colors.info }}>
                          {result.pageLabel}
                        </span>
                        {result.status ? (
                          <span className="pill-chip pill-chip--compact" style={{ color: warmTheme.colors.success }}>
                            {result.status}
                          </span>
                        ) : null}
                      </div>
                      <div className="option-card__title" style={{ color: warmTheme.colors.textStrong, marginBottom: 2 }}>
                        {result.title}
                      </div>
                      {result.subtitle ? <div className="option-card__text">{result.subtitle}</div> : null}
                    </div>
                    <ArrowLeft size={18} color={withAlpha(warmTheme.colors.accent, "cc")} />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="surface-card surface-card--deep content-panel" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.92rem", fontWeight: 800, color: warmTheme.colors.textStrong }}>לא נמצאו תוצאות</div>
              <div style={{ fontSize: "0.74rem", color: warmTheme.colors.muted, marginTop: 6 }}>
                נסה מילה אחרת או חפש לפי שם פריט, הודעה, משימה או איש צוות.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
