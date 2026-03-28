import { DEFAULT_TEAM_CATEGORIES } from "./defaultdata.js";
import { nowISO } from "./helpers.js";

export const CATEGORY_PAGE_OPTIONS = [
  { value: "inventory", label: "מלאי" },
  { value: "salads", label: "סלטים" },
  { value: "hot", label: "בישולים" },
  { value: "morningTasks", label: "משימות בוקר" },
  { value: "prep", label: "הכנות" },
  { value: "home", label: "מסך הבית" },
];

const DEFAULT_BY_ID = new Map(DEFAULT_TEAM_CATEGORIES.map((category) => [category.id, category]));

function isPrivilegedUser(user) {
  return Boolean(user?.isAppManager || user?.role === "admin" || user?.role === "nagad");
}

function dedupe(list) {
  return [...new Set((Array.isArray(list) ? list : []).filter(Boolean).map((value) => String(value)))];
}

export function normalizeCategoryId(value) {
  const text = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return text || `category-${Date.now()}`;
}

export function getTeamCategories(data) {
  const incoming = Array.isArray(data?.teamCategories) ? data.teamCategories : [];
  if (!incoming.length) {
    return DEFAULT_TEAM_CATEGORIES.map((category) => ({ ...category }));
  }

  return incoming
    .filter((category) => category?.id && category?.label)
    .map((category, index) => {
      const fallback = DEFAULT_BY_ID.get(String(category.id)) ?? DEFAULT_TEAM_CATEGORIES[index % DEFAULT_TEAM_CATEGORIES.length];
      return {
        id: String(category.id),
        label: String(category.label),
        accent: category.accent ?? fallback?.accent ?? "#f2c078",
        page: category.page ?? fallback?.page ?? "home",
        icon: category.icon ?? fallback?.icon ?? "📌",
        description: category.description ?? fallback?.description ?? "",
      };
    });
}

export function getCategoryMap(categoriesOrData) {
  const categories = Array.isArray(categoriesOrData) ? categoriesOrData : getTeamCategories(categoriesOrData);
  return new Map(categories.map((category) => [category.id, category]));
}

export function getMemberCategoryIds(member, categoriesOrData) {
  const categoryMap = getCategoryMap(categoriesOrData);
  const incoming = dedupe(member?.categoryIds);
  const valid = incoming.filter((id) => categoryMap.has(id));
  return valid.length ? valid : incoming;
}

export function getMemberCategories(member, categoriesOrData) {
  const categories = Array.isArray(categoriesOrData) ? categoriesOrData : getTeamCategories(categoriesOrData);
  const wantedIds = new Set(getMemberCategoryIds(member, categories));
  return categories.filter((category) => wantedIds.has(category.id));
}

export function getVisibleCategoriesForUser(user, data) {
  const categories = getTeamCategories(data);
  if (!user) return [];
  if (isPrivilegedUser(user)) return categories;

  const wantedIds = new Set(getMemberCategoryIds(user, categories));
  if (!wantedIds.size) return [];
  return categories.filter((category) => wantedIds.has(category.id));
}

export function getVisibleSectionKeysForUser(user, data) {
  const categories = getVisibleCategoriesForUser(user, data);
  return dedupe(categories.map((category) => category.page));
}

export function createKitchenAuditEntry(user, action, detail) {
  return {
    id: `a${Date.now()}`,
    userId: user?.id ?? "",
    userName: user?.name ?? "",
    action,
    detail,
    at: nowISO(),
  };
}

export function hasFullInventoryAccess(user, data) {
  if (isPrivilegedUser(user)) return true;
  const visibleCategories = getVisibleCategoriesForUser(user, data);
  if (!visibleCategories.length) return false;

  const visibleIds = new Set(visibleCategories.map((category) => category.id));
  return visibleIds.has("inventory") || visibleIds.has("supply");
}

export function getVisibleInventoryKeysForUser(user, data) {
  const inventoryCategoryKeys = Array.isArray(data?.inventoryCategories)
    ? data.inventoryCategories.map((category) => category.key)
    : [];

  if (hasFullInventoryAccess(user, data)) {
    return dedupe([...inventoryCategoryKeys, "cooling"]);
  }

  const visibleCategories = getVisibleCategoriesForUser(user, data);
  if (!visibleCategories.length) return [];

  const visibleIds = new Set(visibleCategories.map((category) => category.id));
  const keys = inventoryCategoryKeys.filter((key) => visibleIds.has(key));

  if (visibleIds.has("dairy")) keys.push("dairy");
  if (visibleIds.has("cooling")) keys.push("cooling");

  return dedupe(keys);
}

export function canUserAccessPage(user, data, page) {
  if (page === "home") return true;
  return getVisibleSectionKeysForUser(user, data).includes(page);
}

export function buildQuickActions({ data, user }) {
  const categories = getVisibleCategoriesForUser(user, data);
  const defaultByPage = {
    salads: { label: "פתח סלטים", subtitle: "מילוי, החלפה ומעקב מפלס" },
    hot: { label: "פתח בישולים", subtitle: "מנות חמות, טמפרטורה ושימור" },
    inventory: { label: "פתח מלאי", subtitle: "חוסרים, אספקה ועדכון כמויות" },
    morningTasks: { label: "פתח משימות", subtitle: "ניקוי, פתיחה ובקרה" },
    prep: { label: "פתח הכנות", subtitle: "חיתוך, שקילה והשלמות" },
    home: { label: "מסך הבית", subtitle: "חזרה לתחומי האחריות שלך" },
  };

  return categories.slice(0, 4).map((category) => {
    const fallback = defaultByPage[category.page] ?? defaultByPage.home;
    return {
      id: `quick-${category.id}`,
      page: category.page,
      label: fallback.label,
      subtitle: fallback.subtitle,
      accent: category.accent,
      icon: category.icon,
    };
  });
}

export function buildTeamCoverage(staff, data) {
  const categories = getTeamCategories(data);
  const activeStaff = (Array.isArray(staff) ? staff : []).filter((member) => member?.active !== false);

  return categories.map((category) => {
    const members = activeStaff.filter((member) => getMemberCategoryIds(member, categories).includes(category.id));
    return {
      ...category,
      members,
      count: members.length,
      names: members.map((member) => member.name),
    };
  });
}
