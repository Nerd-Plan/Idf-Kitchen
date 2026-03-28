
export const nowISO = () => new Date().toISOString();
export const agoISO = h => new Date(Date.now() - h * 3_600_000).toISOString();
export const round1 = n => Math.round(n * 10) / 10;
let _uid = 500; export const uid = () => String(++_uid);
export const fmtTime = iso => iso ? new Date(iso).toLocaleTimeString("he-IL",{hour:"2-digit",minute:"2-digit"}) : "";
export const fmtDate = iso => iso ? new Date(iso).toLocaleDateString("he-IL") : "";
export function elapsedStr(iso) {
  if (!iso) return "";
  const d = Date.now() - new Date(iso).getTime();
  const h = Math.floor(d/3_600_000), m = Math.floor((d%3_600_000)/60_000);
  return h > 0 ? `${h}ש׳ ${m}ד׳` : `${m}ד׳`;
}
export function freshColor(iso) {
  if (!iso) return "#22c55e";
  const h = (Date.now() - new Date(iso).getTime()) / 3_600_000;
  return h < 2 ? "#22c55e" : h < 4 ? "#f59e0b" : "#ef4444";
}
export function stockColor(qty, min) {
  const r = qty / (min * 2);
  return r > 0.75 ? "#22c55e" : r > 0.4 ? "#f59e0b" : "#ef4444";
}
import { canEditKitchen as canEditKitchenByRole } from "./permissions.js";
export const canEditKitchen = canEditKitchenByRole;
