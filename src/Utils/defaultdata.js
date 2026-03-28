import { agoISO, nowISO } from "./helpers.js";

export const DEFAULT_BASES = [];

export const DEFAULT_TEAM_CATEGORIES = [
  { id: "salads", label: "סלטים", accent: "#98c776", page: "salads", icon: "🥗", description: "מילוי, רענון והחלפה" },
  { id: "hot", label: "בישולים", accent: "#f48f63", page: "hot", icon: "🍲", description: "שימור, החלפה ובדיקת חום" },
  { id: "dairy", label: "חלבי", accent: "#a78bfa", page: "inventory", icon: "🥛", description: "קירור, חלב ומוצרים רגישים" },
  { id: "inventory", label: "מלאי", accent: "#f2c078", page: "inventory", icon: "📦", description: "ספירות, חוסרים ומעקב" },
  { id: "cleaning", label: "ניקוי", accent: "#5ec2b0", page: "morningTasks", icon: "🧼", description: "ניקיון, פתיחה וסגירה" },
  { id: "supply", label: "אספקה", accent: "#d7bf87", page: "inventory", icon: "🚚", description: "קליטה, חוסרים והזמנות" },
  { id: "prep", label: "הכנות", accent: "#d8d07b", page: "prep", icon: "📝", description: "חיתוך, שקילה והכנות מוקדמות" },
];

export const DEFAULT_STAFF = [
  {
    id: "s1",
    name: "רב-סמל כהן",
    role: "admin",
    pinHash: "pbkdf2$210000$Yu+xbGmfP9dbYiL4pI/tGg==$yGeAhj3aXu9CYuzmX/6mj7Qc51X7hRcTHWYSEfxGvJo=",
    avatar: "👨‍🍳",
    color: "#fbbf24",
    active: true,
    isAppManager: true,
    isVerifiedNagad: true,
    canCreateBase: false,
    hogerId: "",
    categoryIds: ["inventory", "supply", "cleaning"],
    createdAt: agoISO(168),
  },
  {
    id: "s2",
    name: "טבח ראשי לוי",
    role: "cook",
    pinHash: "pbkdf2$210000$doe93xZNqZVqcu1NWlE+HQ==$9Ue3gyplQ8t8nYIN6jw7GDQl6mlnR/JQ2iVIj0X2kZM=",
    avatar: "🧑‍🍳",
    color: "#22c55e",
    active: true,
    isAppManager: false,
    isVerifiedNagad: true,
    canCreateBase: false,
    hogerId: "",
    categoryIds: ["salads", "dairy"],
    createdAt: agoISO(120),
  },
  {
    id: "s3",
    name: "עוזר טבח מזרחי",
    role: "cook",
    pinHash: "pbkdf2$210000$5+/daAsg0bCu2lgeTjfVfQ==$qXdadj8AYV+ePOceOZ7hvAvef+/ststLzpe2DT9i+ys=",
    avatar: "👩‍🍳",
    color: "#06b6d4",
    active: true,
    isAppManager: false,
    isVerifiedNagad: true,
    canCreateBase: false,
    hogerId: "",
    categoryIds: ["hot", "prep"],
    createdAt: agoISO(48),
  },
];

export function makeKitchen() {
  return {
    diners: 100,
    ratios: { protein: 250, side: 100, salad: 150, vegetable: 120 },
    teamCategories: DEFAULT_TEAM_CATEGORIES.map((category) => ({ ...category })),
    locations: {
      fridges: ["מקרר 1", "מקרר 2"],
      cabinets: ["ארון חימום 1", "ארון חימום 2", "ארון חימום 3"],
      coolingName: "מיכל קירור - בשר טרי",
    },
    inventoryCategories: [
      { key: "vegetables", label: "ירקות טריים", accent: "#22c55e", type: "vegetable" },
      { key: "dairy", label: "מוצרי חלב", accent: "#818cf8", type: "other" },
      { key: "eggs", label: "ביצים", accent: "#fbbf24", type: "other" },
      { key: "poultry", label: "עוף ועופות", accent: "#f97316", type: "protein" },
      { key: "frozenMeat", label: "בשר קפוא", accent: "#06b6d4", type: "protein" },
    ],
    inventory: {
      vegetables: [
        { id: 1, name: "עגבניות", qty: 12.5, unit: "ק״ג", min: 5, lastEditBy: "s1", lastEditAt: agoISO(2) },
        { id: 2, name: "מלפפונים", qty: 8, unit: "ק״ג", min: 4, lastEditBy: "s2", lastEditAt: agoISO(1) },
        { id: 3, name: "גזר", qty: 9, unit: "ק״ג", min: 4, lastEditBy: null, lastEditAt: null },
      ],
      dairy: [
        { id: 4, name: "חלב", qty: 20, unit: "ליטר", min: 8, lastEditBy: null, lastEditAt: null },
        { id: 5, name: "גבינה לבנה", qty: 6.5, unit: "ק״ג", min: 3, lastEditBy: "s2", lastEditAt: agoISO(0.5) },
      ],
      eggs: [
        { id: 6, name: "ביצים L", qty: 120, unit: "יח׳", min: 40, lastEditBy: null, lastEditAt: null },
        { id: 7, name: "ביצים M", qty: 60, unit: "יח׳", min: 24, lastEditBy: null, lastEditAt: null },
      ],
      poultry: [
        { id: 8, name: "חזה עוף", qty: 18, unit: "ק״ג", min: 8, lastEditBy: "s3", lastEditAt: agoISO(3) },
        { id: 9, name: "שוקיים", qty: 12.5, unit: "ק״ג", min: 6, lastEditBy: null, lastEditAt: null },
      ],
      frozenMeat: [
        { id: 10, name: "בשר טחון", qty: 10, unit: "ק״ג", min: 5, lastEditBy: null, lastEditAt: null },
        { id: 11, name: "אנטריקוט", qty: 7.5, unit: "ק״ג", min: 3, lastEditBy: null, lastEditAt: null },
      ],
      cooling: [
        { id: 12, name: "פילה בקר", qty: 8, unit: "ק״ג", min: 4, defrostDate: agoISO(5), lastEditBy: "s1", lastEditAt: agoISO(5) },
        { id: 13, name: "צלעות עגל", qty: 6.5, unit: "ק״ג", min: 3, defrostDate: agoISO(2), lastEditBy: null, lastEditAt: null },
      ],
    },
    salads: [
      { id: 1, name: "סלט ישראלי", location: "מקרר 1", level: 75, lastRefreshed: agoISO(1.5), color: "#22c55e", lastEditBy: "s2", lastEditAt: agoISO(1.5) },
      { id: 2, name: "סלט כרוב", location: "מקרר 1", level: 45, lastRefreshed: agoISO(3), color: "#84cc16", lastEditBy: null, lastEditAt: null },
      { id: 3, name: "טחינה", location: "מקרר 2", level: 85, lastRefreshed: agoISO(0.5), color: "#e5e7eb", lastEditBy: "s2", lastEditAt: agoISO(0.5) },
    ],
    hotFood: [
      {
        id: 1,
        name: "פסטה פנה",
        desc: "עם רוטב עגבניות חריף",
        cabinet: "ארון חימום 1",
        cookedAt: agoISO(1),
        temp: 75,
        emoji: "🍝",
        allergens: ["גלוטן"],
        ingredients: [
          { name: "פסטה", gpp: 100 },
          { name: "רוטב עגבניות", gpp: 80 },
        ],
        lastEditBy: "s1",
        lastEditAt: agoISO(1),
      },
      {
        id: 2,
        name: "עוף בתנור",
        desc: "תיבול לימון ושום",
        cabinet: "ארון חימום 2",
        cookedAt: agoISO(1.25),
        temp: 72,
        emoji: "🍗",
        allergens: [],
        ingredients: [
          { name: "חזה עוף", gpp: 250 },
          { name: "שמן זית", gpp: 20 },
        ],
        lastEditBy: "s3",
        lastEditAt: agoISO(1.25),
      },
      {
        id: 3,
        name: "מרק ירקות",
        desc: "מרק בית עם ירקות עונתיים",
        cabinet: "ארון חימום 3",
        cookedAt: agoISO(0.75),
        temp: 82,
        emoji: "🍲",
        allergens: ["סלרי"],
        ingredients: [
          { name: "ירקות", gpp: 120 },
          { name: "עשבי תיבול", gpp: 5 },
        ],
        lastEditBy: null,
        lastEditAt: null,
      },
    ],
    dailyMenu: {
      breakfast: [
        { name: "ביצים מקושקשות", desc: "עם ירקות טריים" },
        { name: "סלטים טריים", desc: "ישראלי, טחינה וחומוס" },
        { name: "לחם טרי", desc: "חלה ולחם שיפון" },
      ],
      lunch: [
        { name: "פסטה פנה", desc: "ברוטב עגבניות" },
        { name: "עוף בתנור", desc: "תיבול לימון ושום" },
        { name: "אורז בסמטי", desc: "עם עשבי תיבול" },
        { name: "סלטים", desc: "מבחר סלטים יומי" },
      ],
      dinner: [
        { name: "מרק ירקות", desc: "מרק בית חם" },
        { name: "בשר טחון", desc: "ברוטב עגבניות" },
        { name: "תפוחי אדמה", desc: "צלויים עם רוזמרין" },
        { name: "סלטים טריים", desc: "מבחר סלטים" },
      ],
    },
    feedback: [],
    bulletins: [
      {
        id: "b1",
        text: "ביקורת מטבח מחר בשעה 09:00 - נא לסדר את עמדות העבודה.",
        priority: "critical",
        postedAt: agoISO(1.5),
        postedByName: "נגד המטבח",
        archived: false,
      },
      {
        id: "b2",
        text: "הגיעה אספקת ירקות טריים - יש לעדכן מלאי.",
        priority: "important",
        postedAt: agoISO(3),
        postedByName: "נגד המטבח",
        archived: false,
      },
    ],
    tasks: [
      { id: "t1", text: "ניקוי פילטרים במנדף", createdAt: agoISO(2), doneBy: null, doneByName: null, doneAt: null, date: nowISO().slice(0, 10) },
      { id: "t2", text: "ספירת מלאי במיכל קירור", createdAt: agoISO(2), doneBy: "s2", doneByName: "טבח ראשי לוי", doneAt: agoISO(0.5), date: nowISO().slice(0, 10) },
      { id: "t3", text: "בדיקת תוקף מוצרים יבשים", createdAt: agoISO(2), doneBy: null, doneByName: null, doneAt: null, date: nowISO().slice(0, 10) },
    ],
    auditLog: [
      { id: "a1", userId: "s1", userName: "רב-סמל כהן", action: "עדכון מלאי", detail: "עגבניות: 15 -> 12.5 ק״ג", at: agoISO(2) },
      { id: "a2", userId: "s2", userName: "טבח ראשי לוי", action: "רענון סלט", detail: "סלט ישראלי -> 100%", at: agoISO(1.5) },
      { id: "a3", userId: "s3", userName: "עוזר טבח מזרחי", action: "עדכון מלאי", detail: "חזה עוף: 20 -> 18 ק״ג", at: agoISO(3) },
    ],
    morningCooks: [],
    morningTasks: [],
    prepTasks: [],
  };
}
