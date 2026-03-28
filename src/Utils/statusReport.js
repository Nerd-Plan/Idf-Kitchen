import { APP_NAME } from "./branding.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDateTime(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("he-IL", { dateStyle: "medium" }).format(new Date(value));
}

function averageFeedback(feedback) {
  const entries = Array.isArray(feedback) ? feedback : [];
  if (!entries.length) return "0.0";
  const total = entries.reduce((sum, item) => sum + Number(item?.stars ?? 0), 0);
  return (total / entries.length).toFixed(1);
}

export function buildStatusReportModel({ data, staff, user, generatedAt = new Date().toISOString() }) {
  const inventoryItems = Object.values(data?.inventory || {}).flat();
  const lowStockItems = inventoryItems.filter((item) => Number(item?.qty ?? 0) < Number(item?.min ?? 0));
  const activeBulletins = (data?.bulletins || []).filter((item) => !item?.archived);
  const dailyTasks = Array.isArray(data?.tasks) ? data.tasks : [];
  const openDailyTasks = dailyTasks.filter((task) => !task?.doneBy);
  const morningTasks = Array.isArray(data?.morningTasks) ? data.morningTasks : [];
  const openMorningTasks = morningTasks.filter((task) => !task?.done);
  const prepTasks = Array.isArray(data?.prepTasks) ? data.prepTasks : [];
  const openPrepTasks = prepTasks.filter((task) => !task?.isDone);
  const activeStaff = (Array.isArray(staff) ? staff : []).filter((member) => member?.active !== false);
  const feedback = Array.isArray(data?.feedback) ? data.feedback : [];
  const lowSalads = (data?.salads || []).filter((item) => Number(item?.level ?? 0) < 30);
  const agedHotFood = (data?.hotFood || []).filter((item) => {
    if (!item?.cookedAt) return false;
    return (Date.now() - new Date(item.cookedAt).getTime()) / 3_600_000 > 3;
  });

  const alerts = [
    lowStockItems.length ? `${lowStockItems.length} פריטי מלאי נמוכים` : null,
    openDailyTasks.length ? `${openDailyTasks.length} משימות יומיות פתוחות` : null,
    openMorningTasks.length ? `${openMorningTasks.length} משימות פתיחת בוקר פתוחות` : null,
    openPrepTasks.length ? `${openPrepTasks.length} הכנות ממתינות` : null,
    activeBulletins.length ? `${activeBulletins.length} הודעות פעילות` : null,
    lowSalads.length ? `${lowSalads.length} סלטים דורשים מילוי` : null,
    agedHotFood.length ? `${agedHotFood.length} מנות חמות ותיקות` : null,
  ].filter(Boolean);

  return {
    appName: APP_NAME,
    generatedAt,
    generatedAtLabel: formatDateTime(generatedAt),
    generatedBy: user?.name || "מערכת",
    baseName: user?.baseName || user?.baseId || "ללא בסיס",
    overview: [
      { label: "צוות פעיל", value: String(activeStaff.length) },
      { label: "פריטי מלאי", value: String(inventoryItems.length) },
      { label: "מלאי נמוך", value: String(lowStockItems.length) },
      { label: "הודעות פעילות", value: String(activeBulletins.length) },
      { label: "פידבק ממוצע", value: averageFeedback(feedback) },
    ],
    alerts,
    lowStockItems: lowStockItems.map((item) => ({
      name: item?.name || "פריט",
      qty: `${item?.qty ?? 0} ${item?.unit ?? ""}`.trim(),
      min: `${item?.min ?? 0} ${item?.unit ?? ""}`.trim(),
    })),
    tasks: [
      { label: "משימות יומיות", total: dailyTasks.length, open: openDailyTasks.length },
      { label: "פתיחת בוקר", total: morningTasks.length, open: openMorningTasks.length },
      { label: "הכנות", total: prepTasks.length, open: openPrepTasks.length },
    ],
    bulletins: activeBulletins.map((item) => ({
      text: item?.text || "הודעה",
      priority: item?.priority || "normal",
      by: item?.postedByName || "",
      when: formatDateTime(item?.postedAt),
    })),
    feedback: {
      count: feedback.length,
      average: averageFeedback(feedback),
    },
    staff: activeStaff.slice(0, 10).map((member) => ({
      name: member?.name || "איש צוות",
      role: member?.role || "cook",
      baseName: member?.baseName || member?.baseId || "",
    })),
    generatedDateLabel: formatDate(generatedAt),
  };
}

export function buildStatusReportHtml(input) {
  const model = buildStatusReportModel(input);

  const overviewCards = model.overview
    .map(
      (item) => `
        <div class="metric">
          <div class="metric__label">${escapeHtml(item.label)}</div>
          <div class="metric__value">${escapeHtml(item.value)}</div>
        </div>
      `
    )
    .join("");

  const alerts = model.alerts.length
    ? `<ul class="list">${model.alerts.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : `<p class="muted">אין התראות פעילות כרגע.</p>`;

  const lowStock = model.lowStockItems.length
    ? `
      <table>
        <thead>
          <tr>
            <th>פריט</th>
            <th>כמות נוכחית</th>
            <th>מינימום</th>
          </tr>
        </thead>
        <tbody>
          ${model.lowStockItems
            .map(
              (item) => `
                <tr>
                  <td>${escapeHtml(item.name)}</td>
                  <td>${escapeHtml(item.qty)}</td>
                  <td>${escapeHtml(item.min)}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    `
    : `<p class="muted">לא נמצאו פריטי מלאי נמוכים.</p>`;

  const taskRows = model.tasks
    .map(
      (task) => `
        <tr>
          <td>${escapeHtml(task.label)}</td>
          <td>${escapeHtml(String(task.total))}</td>
          <td>${escapeHtml(String(task.open))}</td>
        </tr>
      `
    )
    .join("");

  const bulletins = model.bulletins.length
    ? `<ul class="list">${model.bulletins
        .map(
          (item) => `
            <li>
              <strong>${escapeHtml(item.priority)}</strong>
              <span>${escapeHtml(item.text)}</span>
              <div class="muted small">${escapeHtml(item.by)}${item.when ? ` • ${escapeHtml(item.when)}` : ""}</div>
            </li>
          `
        )
        .join("")}</ul>`
    : `<p class="muted">אין הודעות פעילות.</p>`;

  const staff = model.staff.length
    ? `<ul class="list compact">${model.staff
        .map(
          (member) => `
            <li>
              <strong>${escapeHtml(member.name)}</strong>
              <span>${escapeHtml(member.role)}</span>
              <span class="muted">${escapeHtml(member.baseName)}</span>
            </li>
          `
        )
        .join("")}</ul>`
    : `<p class="muted">אין אנשי צוות פעילים.</p>`;

  return `<!doctype html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(model.appName)} - דוח סטטוס</title>
    <style>
      :root {
        color-scheme: light;
        --ink: #22160f;
        --muted: #6e5a4d;
        --line: #e6d6c8;
        --panel: #fffaf5;
        --accent: #ff8b3d;
        --accent-soft: #fff0e4;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: "Heebo", "Rubik", "Assistant", "Noto Sans Hebrew", sans-serif;
        color: var(--ink);
        background: #fff;
      }

      .page {
        width: min(980px, calc(100% - 40px));
        margin: 0 auto;
        padding: 32px 0 40px;
      }

      .header {
        display: flex;
        justify-content: space-between;
        gap: 24px;
        align-items: flex-start;
        margin-bottom: 20px;
      }

      .headline {
        margin: 0;
        font-size: 1.9rem;
      }

      .subline {
        margin: 8px 0 0;
        color: var(--muted);
      }

      .stamp {
        padding: 12px 14px;
        border: 1px solid var(--line);
        border-radius: 16px;
        background: var(--panel);
        min-width: 240px;
      }

      .grid {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        margin-bottom: 22px;
      }

      .metric,
      .section {
        border: 1px solid var(--line);
        border-radius: 16px;
        background: var(--panel);
      }

      .metric {
        padding: 14px;
      }

      .metric__label {
        font-size: 0.78rem;
        color: var(--muted);
      }

      .metric__value {
        font-size: 1.5rem;
        font-weight: 800;
        margin-top: 8px;
      }

      .sections {
        display: grid;
        gap: 14px;
      }

      .section {
        padding: 16px;
      }

      h2 {
        margin: 0 0 12px;
        font-size: 1rem;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th,
      td {
        padding: 10px 8px;
        border-bottom: 1px solid var(--line);
        text-align: right;
        vertical-align: top;
      }

      th {
        font-size: 0.8rem;
        color: var(--muted);
        font-weight: 700;
      }

      .list {
        margin: 0;
        padding-inline-start: 18px;
        display: grid;
        gap: 10px;
      }

      .list.compact {
        gap: 6px;
      }

      .muted {
        color: var(--muted);
      }

      .small {
        font-size: 0.8rem;
      }

      .footer {
        margin-top: 18px;
        padding-top: 12px;
        border-top: 1px solid var(--line);
        color: var(--muted);
        font-size: 0.82rem;
      }

      @media print {
        body {
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }

        .page {
          width: 100%;
          padding: 0;
        }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <header class="header">
        <div>
          <h1 class="headline">דוח סטטוס מטבח</h1>
          <p class="subline">${escapeHtml(model.baseName)} • ${escapeHtml(model.generatedDateLabel)}</p>
        </div>
        <div class="stamp">
          <div><strong>${escapeHtml(model.appName)}</strong></div>
          <div class="subline">הופק על ידי ${escapeHtml(model.generatedBy)}</div>
          <div class="subline">${escapeHtml(model.generatedAtLabel)}</div>
        </div>
      </header>

      <section class="grid">${overviewCards}</section>

      <section class="sections">
        <div class="section">
          <h2>התראות פעילות</h2>
          ${alerts}
        </div>

        <div class="section">
          <h2>מלאי נמוך</h2>
          ${lowStock}
        </div>

        <div class="section">
          <h2>סטטוס משימות</h2>
          <table>
            <thead>
              <tr>
                <th>אזור</th>
                <th>סה"כ</th>
                <th>פתוחות</th>
              </tr>
            </thead>
            <tbody>${taskRows}</tbody>
          </table>
        </div>

        <div class="section">
          <h2>הודעות פעילות</h2>
          ${bulletins}
        </div>

        <div class="section">
          <h2>צוות פעיל</h2>
          ${staff}
        </div>

        <div class="section">
          <h2>פידבק סועדים</h2>
          <p>נאספו ${escapeHtml(String(model.feedback.count))} דירוגים, ממוצע ${escapeHtml(model.feedback.average)}.</p>
        </div>
      </section>

      <footer class="footer">
        הדוח מתאים להדפסה או לשמירה כ-PDF מתוך חלון ההדפסה.
      </footer>
    </main>
    <script>
      window.addEventListener("load", () => {
        window.focus();
        window.print();
      });
    </script>
  </body>
</html>`;
}

export function openStatusReportPrint(input) {
  if (typeof window === "undefined") return false;

  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!printWindow) return false;

  printWindow.document.open();
  printWindow.document.write(buildStatusReportHtml(input));
  printWindow.document.close();
  return true;
}
