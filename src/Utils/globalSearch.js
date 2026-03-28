function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function tokenize(value) {
  return normalizeText(value)
    .split(/\s+/)
    .filter(Boolean);
}

function createSearchText(parts) {
  return normalizeText(parts.filter(Boolean).join(" "));
}

function roleLabel(role) {
  if (role === "nagad") return "נגד מטבח";
  if (role === "admin") return "מנהל מטבח";
  if (role === "soldier") return "חייל";
  return "טבח";
}

function typeLabel(type) {
  if (type === "staff") return "צוות";
  if (type === "task") return "משימה";
  if (type === "bulletin") return "הודעה";
  return "מלאי";
}

function pageLabel(page) {
  if (page === "inventory") return "מלאי";
  if (page === "staff") return "צוות";
  if (page === "morningTasks") return "פתיחת בוקר";
  if (page === "prep") return "הכנות";
  if (page === "salads") return "סלטים";
  if (page === "hot") return "בישולים";
  return "מסך ראשי";
}

function createEntry({
  id,
  type,
  page,
  title,
  subtitle,
  keywords = [],
  status = "",
  weight = 0,
}) {
  return {
    id,
    type,
    typeLabel: typeLabel(type),
    page,
    pageLabel: pageLabel(page),
    title: String(title ?? "").trim(),
    subtitle: String(subtitle ?? "").trim(),
    status: String(status ?? "").trim(),
    weight,
    searchText: createSearchText([title, subtitle, status, ...keywords]),
  };
}

function addInventoryEntries(entries, data) {
  const categories = Array.isArray(data?.inventoryCategories) ? data.inventoryCategories : [];
  const categoriesByKey = new Map(categories.map((category) => [category.key, category]));
  const inventory = data?.inventory && typeof data.inventory === "object" ? data.inventory : {};

  Object.entries(inventory).forEach(([categoryKey, items]) => {
    const category = categoriesByKey.get(categoryKey);
    const label = category?.label ?? (categoryKey === "cooling" ? data?.locations?.coolingName || "קירור" : categoryKey);

    (Array.isArray(items) ? items : []).forEach((item) => {
      const isLowStock = Number(item?.qty ?? 0) < Number(item?.min ?? 0);
      entries.push(
        createEntry({
          id: `inventory-${categoryKey}-${item?.id ?? item?.name ?? entries.length}`,
          type: "inventory",
          page: "inventory",
          title: item?.name || "פריט מלאי",
          subtitle: `${label} • ${item?.qty ?? 0} ${item?.unit ?? ""}`.trim(),
          status: isLowStock ? "מלאי נמוך" : "מלאי תקין",
          keywords: [categoryKey, item?.unit, item?.min, data?.locations?.coolingName],
          weight: isLowStock ? 14 : 8,
        })
      );
    });
  });
}

function addStaffEntries(entries, staff, data) {
  const categories = Array.isArray(data?.teamCategories) ? data.teamCategories : [];
  const categoryNames = new Map(categories.map((category) => [category.id, category.label]));

  (Array.isArray(staff) ? staff : []).forEach((member) => {
    const isActive = member?.active !== false;
    const labels = (Array.isArray(member?.categoryIds) ? member.categoryIds : [])
      .map((id) => categoryNames.get(id))
      .filter(Boolean);

    entries.push(
      createEntry({
        id: `staff-${member?.id ?? entries.length}`,
        type: "staff",
        page: "staff",
        title: member?.name || "איש צוות",
        subtitle: `${roleLabel(member?.role)} • ${member?.baseName || member?.baseId || "ללא בסיס"}${labels.length ? ` • ${labels.join(", ")}` : ""}`,
        status: isActive ? "פעיל" : "לא פעיל",
        keywords: [member?.role, member?.hogerId, member?.baseName, member?.baseId, ...labels],
        weight: isActive ? 9 : 5,
      })
    );
  });
}

function addTaskEntries(entries, data) {
  const dailyTasks = Array.isArray(data?.tasks) ? data.tasks : [];
  dailyTasks.forEach((task) => {
    const isDone = Boolean(task?.doneBy);
    entries.push(
      createEntry({
        id: `daily-task-${task?.id ?? entries.length}`,
        type: "task",
        page: "home",
        title: task?.text || "משימה יומית",
        subtitle: "לוח משימות יומי",
        status: isDone ? `בוצע על ידי ${task?.doneByName || "איש צוות"}` : "ממתין לביצוע",
        keywords: [task?.date, task?.doneByName],
        weight: isDone ? 6 : 13,
      })
    );
  });

  const morningTasks = Array.isArray(data?.morningTasks) ? data.morningTasks : [];
  morningTasks.forEach((task) => {
    entries.push(
      createEntry({
        id: `morning-task-${task?.id ?? entries.length}`,
        type: "task",
        page: "morningTasks",
        title: task?.text || "משימת פתיחת בוקר",
        subtitle: "פתיחת בוקר",
        status: task?.done ? "בוצע" : "ממתין לביצוע",
        weight: task?.done ? 6 : 12,
      })
    );
  });

  const prepTasks = Array.isArray(data?.prepTasks) ? data.prepTasks : [];
  prepTasks.forEach((task) => {
    entries.push(
      createEntry({
        id: `prep-task-${task?.id ?? entries.length}`,
        type: "task",
        page: "prep",
        title: task?.text || "הכנה למטבח",
        subtitle: task?.qty ? `הכנות • ${task.qty}` : "הכנות",
        status: task?.isDone ? "בוצע" : "ממתין לביצוע",
        weight: task?.isDone ? 6 : 12,
      })
    );
  });
}

function bulletinWeight(priority, archived) {
  if (archived) return 3;
  if (priority === "critical") return 16;
  if (priority === "important") return 13;
  return 10;
}

function addBulletinEntries(entries, data) {
  const bulletins = Array.isArray(data?.bulletins) ? data.bulletins : [];
  bulletins.forEach((bulletin) => {
    entries.push(
      createEntry({
        id: `bulletin-${bulletin?.id ?? entries.length}`,
        type: "bulletin",
        page: "home",
        title: bulletin?.text || "הודעה",
        subtitle: bulletin?.postedByName ? `לוח מודעות • ${bulletin.postedByName}` : "לוח מודעות",
        status: bulletin?.archived ? "ארכיון" : "פעיל",
        keywords: [bulletin?.priority, bulletin?.postedAt],
        weight: bulletinWeight(bulletin?.priority, bulletin?.archived),
      })
    );
  });
}

export function buildGlobalSearchIndex({ data, staff }) {
  const entries = [];
  addInventoryEntries(entries, data);
  addStaffEntries(entries, staff, data);
  addTaskEntries(entries, data);
  addBulletinEntries(entries, data);
  return entries;
}

function scoreEntry(entry, query, tokens) {
  let score = entry.weight;
  const normalizedTitle = normalizeText(entry.title);

  if (!tokens.length) return score;

  if (normalizedTitle === query) score += 28;
  if (normalizedTitle.startsWith(query)) score += 12;
  if (entry.searchText.includes(query)) score += 8;

  for (const token of tokens) {
    if (!entry.searchText.includes(token)) return -1;
    score += normalizedTitle.includes(token) ? 8 : 4;
  }

  return score;
}

export function searchGlobalIndex(index, query, limit = 18) {
  const normalizedQuery = normalizeText(query);
  const tokens = tokenize(normalizedQuery);

  return (Array.isArray(index) ? index : [])
    .map((entry) => ({ ...entry, score: scoreEntry(entry, normalizedQuery, tokens) }))
    .filter((entry) => entry.score >= 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.title.localeCompare(right.title, "he");
    })
    .slice(0, limit);
}
