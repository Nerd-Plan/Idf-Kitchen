import { ChefHat } from "lucide-react";
import { APP_LOGO_ALT, APP_LOGO_SRC, APP_NAME, APP_SHORT_NAME, APP_SUBTITLE } from "../Utils/branding";
import { warmTheme } from "../Utils/uiTheme";

export default function AppBrand({
  compact = false,
  subtitle,
  showSubtitle = true,
  textAlign = "center",
  iconSize,
  title,
}) {
  const size = iconSize ?? (compact ? 34 : 64);
  const titleText = title ?? (compact ? APP_SHORT_NAME : APP_NAME);
  const subtitleText = subtitle ?? APP_SUBTITLE;

  return (
    <div style={{ textAlign }}>
      <div
        style={{
          width: size,
          height: size,
          background: warmTheme.backgrounds.cardSoft,
          border: `1px solid ${warmTheme.colors.lineSoft}`,
          borderRadius: compact ? 10 : 18,
          margin: compact ? "0 0 0 0" : "0 auto 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: warmTheme.shadows.glow,
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {APP_LOGO_SRC ? (
          <img src={APP_LOGO_SRC} alt={APP_LOGO_ALT} style={{ width: "100%", height: "100%", objectFit: "contain", padding: compact ? 2 : 4 }} />
        ) : (
          <ChefHat size={compact ? 18 : 30} color="#ffe0bf" />
        )}
      </div>
      <div style={{ fontSize: compact ? "0.82rem" : "1.35rem", fontWeight: 900, color: warmTheme.colors.accent, lineHeight: 1.15 }}>
        {titleText}
      </div>
      {showSubtitle ? (
        <div style={{ color: warmTheme.colors.muted, fontSize: compact ? "0.6rem" : "0.8rem", marginTop: 2 }}>{subtitleText}</div>
      ) : null}
    </div>
  );
}
