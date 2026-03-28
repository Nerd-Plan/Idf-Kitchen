export const warmTheme = {
  fontFamily: "'Heebo','Rubik','Assistant','Noto Sans Hebrew',sans-serif",
  colors: {
    text: "#fff4e8",
    textStrong: "#fffaf5",
    muted: "#d9bca4",
    cardText: "#f5dcc4",
    line: "#6f452a",
    lineSoft: "#8f5a37",
    success: "#8ac76b",
    danger: "#f97355",
    info: "#f3b267",
    accent: "#ffb24d",
    accentStrong: "#ff8b3d",
    panel: "#2a180d",
    panelAlt: "#3b2416",
    panelDeep: "#211208",
    chip: "#4a2b16",
  },
  backgrounds: {
    app: "radial-gradient(circle at 15% 12%, #7a3c18 0%, #4f2713 22%, #2f170d 55%, #1b0e07 100%)",
    topbar: "linear-gradient(90deg,#5c2d16,#2c160b)",
    topbarEdit: "linear-gradient(90deg,#6d2f0d,#3b1b08)",
    hero: "linear-gradient(135deg,#6f3619,#3b1f11)",
    card: "linear-gradient(145deg,#3a2416,#24150c)",
    cardSoft: "linear-gradient(145deg,#4a2c1a,#2a180d)",
    cardTint: (accent) => `linear-gradient(135deg,${accent}24,${accent}0d)`,
    alert: "linear-gradient(135deg,#4f140f,#2d0e0b)",
  },
  shadows: {
    soft: "0 16px 30px rgba(0,0,0,0.25)",
    glow: "0 10px 30px rgba(255,139,61,0.25)",
  },
};

export function withAlpha(hex, alpha = "33") {
  return `${hex}${alpha}`;
}
