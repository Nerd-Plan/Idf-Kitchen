import { DEFAULT_TEAM_CATEGORIES, DEFAULT_STAFF, makeKitchen } from "./defaultdata.js";
import { nowISO } from "./helpers.js";

const DEMO_BASE = {
  id: "base-demo",
  name: 'בסיס "יפה" לדוגמה',
  battalion: "גדוד 101",
  brigade: "חטיבה לדוגמה",
  division: "אוגדה לדוגמה",
  command: "פיקוד מרכז",
};

const DEMO_CATEGORY_IDS = DEFAULT_TEAM_CATEGORIES.map((category) => category.id);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildDemoKitchen() {
  const data = makeKitchen();
  return {
    ...data,
    teamCategories: DEFAULT_TEAM_CATEGORIES.map((category) => ({ ...category })),
    inventoryCategories: [
      { key: "vegetables", label: "ירקות טריים", accent: "#22c55e", type: "vegetable" },
      { key: "poultry", label: "עוף ועופות", accent: "#f97316", type: "protein" },
      { key: "dairy", label: "מוצרי חלב", accent: "#818cf8", type: "other" },
    ],
    inventory: {
      vegetables: [
        { id: 1, name: "עגבניות", qty: 12.5, unit: 'ק"ג', min: 5, lastEditBy: "cook-demo", lastEditAt: nowISO() },
        { id: 2, name: "מלפפונים", qty: 8, unit: 'ק"ג', min: 4, lastEditBy: "cook-demo-2", lastEditAt: nowISO() },
      ],
      poultry: [
        { id: 3, name: "חזה עוף", qty: 18, unit: 'ק"ג', min: 8, lastEditBy: "nagad-demo", lastEditAt: nowISO() },
      ],
      dairy: [
        { id: 4, name: "חלב", qty: 20, unit: "ליטר", min: 8, lastEditBy: "cook-demo", lastEditAt: nowISO() },
      ],
      cooling: [
        { id: 5, name: "פילה בקר", qty: 8, unit: 'ק"ג', min: 4, defrostDate: nowISO(), lastEditBy: "nagad-demo", lastEditAt: nowISO() },
      ],
    },
    morningCooks: ["cook-demo", "cook-demo-2"],
    morningTasks: [
      { id: "mt-demo-1", text: "בדיקת טמפרטורות פתיחה", done: true },
      { id: "mt-demo-2", text: "חיטוי עמדות עבודה", done: false },
      { id: "mt-demo-3", text: "סידור משלוחי בוקר", done: false },
    ],
    prepTasks: [
      { id: "pt-demo-1", text: "חיתוך ירקות לסלטים", qty: '8 ק"ג', isDone: false },
      { id: "pt-demo-2", text: "הפשרת בשר למנה חמה", qty: '12 ק"ג', isDone: true },
      { id: "pt-demo-3", text: "שקילת אורז לצהריים", qty: '6 ק"ג', isDone: false },
    ],
    feedback: [
      { id: "fb-demo-1", meal: "breakfast", stars: 5, comment: "טרי וטעים", time: nowISO() },
      { id: "fb-demo-2", meal: "lunch", stars: 4, comment: "מנה טובה", time: nowISO() },
      { id: "fb-demo-3", meal: "dinner", stars: 5, comment: "שירות מהיר", time: nowISO() },
    ],
  };
}

function buildDemoStaff(baseName = DEMO_BASE.name, baseId = DEMO_BASE.id) {
  const [adminTemplate, cookTemplate, assistantTemplate] = DEFAULT_STAFF;
  return [
    {
      ...clone(adminTemplate),
      id: "nagad-demo",
      name: "נגד מטבח דוגמה",
      role: "nagad",
      avatar: "🎖️",
      color: "#f28d61",
      baseId,
      baseName,
      isAppManager: false,
      isVerifiedNagad: true,
      canCreateBase: true,
      hogerId: "987654",
      categoryIds: DEMO_CATEGORY_IDS,
    },
    {
      ...clone(cookTemplate),
      id: "cook-demo",
      name: "טבח ראשי דוגמה",
      role: "cook",
      avatar: "👨‍🍳",
      color: "#98c776",
      baseId,
      baseName,
      isAppManager: false,
      isVerifiedNagad: true,
      canCreateBase: false,
      categoryIds: DEMO_CATEGORY_IDS,
    },
    {
      ...clone(assistantTemplate),
      id: "cook-demo-2",
      name: "טבח קו דוגמה",
      role: "cook",
      avatar: "🧑‍🍳",
      color: "#5ec2b0",
      baseId,
      baseName,
      isAppManager: false,
      isVerifiedNagad: true,
      canCreateBase: false,
      categoryIds: ["salads", "prep", "hot"],
    },
    {
      ...clone(adminTemplate),
      id: "app-manager-demo",
      name: "מנהל אפליקציה דוגמה",
      role: "admin",
      avatar: "🧠",
      color: "#f3b267",
      baseId,
      baseName,
      isAppManager: true,
      isVerifiedNagad: true,
      canCreateBase: false,
      categoryIds: DEMO_CATEGORY_IDS,
    },
  ];
}

export function readDemoConfig() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const role = String(params.get("demoRole") || "")
    .trim()
    .toLowerCase();

  if (!role) return null;

  return {
    role,
    page: String(params.get("demoPage") || "")
      .trim()
      .toLowerCase(),
  };
}

export function getDemoInitialPage(allowedPages, fallback = "home") {
  const aliases = {
    stock: "inventory",
    team: "staff",
  };
  const requestedPage = aliases[readDemoConfig()?.page] ?? readDemoConfig()?.page;
  if (!requestedPage) return fallback;
  return (Array.isArray(allowedPages) ? allowedPages : []).includes(requestedPage) ? requestedPage : fallback;
}

export function createDemoAppState(role = "login") {
  const bases = [clone(DEMO_BASE)];
  const data = buildDemoKitchen();
  const staff = buildDemoStaff();

  const users = {
    login: null,
    soldier: {
      id: "guest-demo",
      name: "חייל אורח",
      role: "soldier",
      avatar: "🪖",
      color: "#8ac76b",
      baseId: DEMO_BASE.id,
      baseName: DEMO_BASE.name,
    },
    cook: clone(staff.find((member) => member.id === "cook-demo")),
    nagad: clone(staff.find((member) => member.id === "nagad-demo")),
    admin: clone(staff.find((member) => member.id === "app-manager-demo")),
    appmanager: clone(staff.find((member) => member.id === "app-manager-demo")),
  };

  return {
    activeBaseId: DEMO_BASE.id,
    bases,
    data,
    staff,
    user: users[role] ?? null,
  };
}
