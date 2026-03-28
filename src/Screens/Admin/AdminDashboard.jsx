import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart2,
  ClipboardList,
  Flame,
  ListChecks,
  LogOut,
  MapPin,
  Megaphone,
  Package,
  Printer,
  Salad,
  Save,
  Search,
  Users,
} from "lucide-react";
import { makeKitchen } from "../../Utils/defaultdata";
import AdminPageShell from "./AdminPageShellScreen";
import BulletinBoard from "../KitchenView/bulletinBoardScreen";
import AppBrand from "../../Components/AppBrand";
import GlobalSearchDialog from "../../Components/GlobalSearchDialog";
import { buildGlobalSearchIndex } from "../../Utils/globalSearch";
import { openStatusReportPrint } from "../../Utils/statusReport";
import { warmTheme, withAlpha } from "../../Utils/uiTheme";
import { canAccessStaffArea, canEditKitchen, isAppManager as isAppManagerUser, isVerifiedNagad } from "../../Utils/permissions";
import { buildTeamCoverage, getTeamCategories } from "../../Utils/workflow";

const InventoryPage = lazy(() => import("../KitchenView/InventoryPageScreen"));
const SaladsPage = lazy(() => import("../KitchenView/SaladsPageScreen"));
const HotFoodPage = lazy(() => import("../KitchenView/HotFoodPageScreen"));
const FeedbackPage = lazy(() => import("../KitchenView/FeedbackPageScreen"));
const MorningCookList = lazy(() => import("../Morning/MorningCookList"));
const MorningCookTasks = lazy(() => import("../Morning/MorningCookTasks"));
const PrepPageScreen = lazy(() => import("../KitchenView/PrepPageScreen"));
const StaffPage = lazy(() => import("../Staff/staffScreen"));

export default function AdminDashboard({ data, user, staff, bases, setData, setStaff, onAddBase, onLogout }) {
  const isNagad = isVerifiedNagad(user);
  const isAppManager = isAppManagerUser(user);
  const canKitchenEdit = canEditKitchen(user);
  const canAccessStaff = canAccessStaffArea(user);
  const [page, setPage] = useState("home");
  const [editMode, setEditMode] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isBoardOpen, setIsBoardOpen] = useState(false);
  const searchIndex = useMemo(() => buildGlobalSearchIndex({ data, staff }), [data, staff]);
  const teamCategories = useMemo(() => getTeamCategories(data), [data]);
  const teamCoverage = useMemo(() => buildTeamCoverage(staff, data), [staff, data]);

  useEffect(() => {
    const showId = setTimeout(() => setSaved(true), 0);
    const timeoutId = setTimeout(() => setSaved(false), 700);
    return () => {
      clearTimeout(showId);
      clearTimeout(timeoutId);
    };
  }, [data, staff]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsBoardOpen(false);
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (page !== "home") {
      setIsBoardOpen(false);
    }
  }, [page]);

  useEffect(() => {
    if (!isBoardOpen || typeof document === "undefined") return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isBoardOpen]);

  const lowSalads = (data.salads || []).filter((salad) => salad.level < 30).length;
  const lowStock = Object.values(data.inventory || {}).flat().filter((item) => item.qty < item.min).length;
  const morningTasks = data.morningTasks || [];
  const pendingMorningTasks = morningTasks.filter((task) => !task.done).length;
  const prepTasks = data.prepTasks || [];
  const pendingPrepTasks = prepTasks.filter((task) => !task.isDone).length;
  const inventoryItems = Object.values(data.inventory || {}).flat();
  const activeStaff = (staff || []).filter((member) => member.active).length;
  const activeBulletins = (data.bulletins || []).filter((bulletin) => !bulletin.archived).length;
  const pendingBoardTasks = (data.tasks || []).filter((task) => task.date === new Date().toISOString().slice(0, 10) && !task.doneBy).length;
  const uncoveredCategories = teamCoverage.filter((category) => category.count === 0).length;
  const attentionItems = [
    lowStock > 0 ? `${lowStock} פריטי מלאי נמוכים` : null,
    lowSalads > 0 ? `${lowSalads} סלטים דורשים מילוי` : null,
    pendingMorningTasks > 0 ? `${pendingMorningTasks} משימות בוקר פתוחות` : null,
    pendingPrepTasks > 0 ? `${pendingPrepTasks} הכנות ממתינות` : null,
  ].filter(Boolean);

  const handleExportStatus = () => {
    const opened = openStatusReportPrint({ data, staff, user });
    if (!opened && typeof window !== "undefined") {
      window.alert("לא ניתן לפתוח את חלון ההדפסה. ודא שחלונות קופצים מאופשרים.");
    }
  };

  const pageProps = {
    data,
    user,
    staff,
    setData,
    editMode: canKitchenEdit ? editMode : false,
    onToggleEdit: canKitchenEdit ? () => setEditMode((value) => !value) : null,
    onReset: isNagad
      ? () => {
          setData(makeKitchen());
          setEditMode(false);
        }
      : null,
    onBack: () => setPage("home"),
    onLogout,
    saved,
    onOpenSearch: () => setIsSearchOpen(true),
    onExportStatus: handleExportStatus,
  };

  const renderLazyPage = (content) => (
    <Suspense
      fallback={
        <div
          className="app-shell warm-elevated"
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            direction: "rtl",
            fontFamily: warmTheme.fontFamily,
            background: warmTheme.backgrounds.app,
            color: warmTheme.colors.text,
          }}
        >
          ???? ???...
        </div>
      }
    >
      {content}
    </Suspense>
  );

  const searchDialog = isSearchOpen ? (
    <GlobalSearchDialog
      open={isSearchOpen}
      index={searchIndex}
      onClose={() => setIsSearchOpen(false)}
      onSelect={(result) => {
        setIsSearchOpen(false);
        if (result.page === "staff" && !canAccessStaff) return;
        if (result.page) setPage(result.page);
      }}
    />
  ) : null;

  const renderPageWithOverlay = (content) => (
    <>
      {renderLazyPage(content)}
      {searchDialog}
    </>
  );

  if (page === "inventory") return renderPageWithOverlay(<InventoryPage {...pageProps} />);
  if (page === "salads") return renderPageWithOverlay(<SaladsPage {...pageProps} />);
  if (page === "hot") return renderPageWithOverlay(<HotFoodPage {...pageProps} />);
  if (page === "feedback") return renderPageWithOverlay(<FeedbackPage {...pageProps} />);
  if (page === "morningCooks") return renderPageWithOverlay(<MorningCookList {...pageProps} isNagad={canKitchenEdit} />);
  if (page === "morningTasks") return renderPageWithOverlay(<MorningCookTasks {...pageProps} isNagad={canKitchenEdit} />);
  if (page === "prep") return renderPageWithOverlay(<PrepPageScreen {...pageProps} isAdmin={canKitchenEdit} />);
  if (page === "staff" && canAccessStaff) {
    return renderPageWithOverlay(
      <AdminPageShell title="ניהול צוות" icon={Users} accent="#f28d61" onBack={() => setPage("home")} onLogout={onLogout} user={user} saved={saved} isAdmin={canAccessStaff}>
        <StaffPage
          staff={staff}
          bases={bases}
          scopeBaseId={isAppManager ? null : user.baseId}
          scopeBaseName={isAppManager ? "כלל הבסיסים" : user.baseName}
          currentUser={user}
          onUpdateStaff={setStaff}
          onAddBase={onAddBase}
          auditLog={data.auditLog}
          kitchenCategories={teamCategories}
          onUpdateCategories={(nextCategories) => setData((state) => ({ ...state, teamCategories: nextCategories }))}
        />
      </AdminPageShell>
    );
  }

  const roleColor = isNagad ? "#f28d61" : isAppManager ? "#f3b267" : "#f2c078";
  const dashboardRole = isNagad ? "נגד מטבח" : isAppManager ? "מנהל אפליקציה" : "שף";

  const pages = [
    {
      key: "inventory",
      label: "מלאי",
      icon: Package,
      accent: "#f2c078",
      stat: lowStock > 0 ? { text: `${lowStock} פריטים נמוכים`, warn: true } : { text: `${inventoryItems.length} פריטים`, warn: false },
    },
    {
      key: "salads",
      label: "סלטים",
      icon: Salad,
      accent: "#98c776",
      stat: lowSalads > 0 ? { text: `${lowSalads} דורשים מילוי`, warn: true } : { text: `${(data.salads || []).length} סלטים`, warn: false },
    },
    {
      key: "hot",
      label: "מנות חמות",
      icon: Flame,
      accent: "#f48f63",
      stat: { text: `${(data.hotFood || []).length} מנות`, warn: false },
    },
    {
      key: "morningCooks",
      label: "טבחי פתיחת בוקר",
      icon: Users,
      accent: "#d7bf87",
      stat: { text: `${(data.morningCooks || []).length} מוקצים היום`, warn: false },
    },
    {
      key: "morningTasks",
      label: "משימות פתיחת בוקר",
      icon: ListChecks,
      accent: "#f3b267",
      stat: pendingMorningTasks > 0 ? { text: `${pendingMorningTasks} ממתינות`, warn: true } : { text: "הכול הושלם", warn: false },
    },
    {
      key: "feedback",
      label: "דירוגי סועדים",
      icon: BarChart2,
      accent: "#dfb587",
      stat: { text: `${(data.feedback || []).length} דירוגים`, warn: false },
    },
    {
      key: "prep",
      label: "הכנות למטבח",
      icon: ClipboardList,
      accent: "#d8d07b",
      stat: pendingPrepTasks > 0 ? { text: `${pendingPrepTasks} הכנות ממתינות`, warn: true } : { text: prepTasks.length ? "כל ההכנות בוצעו" : "אין הכנות", warn: false },
    },
    ...(canAccessStaff
      ? [
          {
            key: "staff",
            label: "ניהול צוות",
            icon: Users,
            accent: "#f28d61",
            stat: { text: `${activeStaff} טבחים פעילים`, warn: false },
          },
        ]
      : []),
  ];

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
          borderBottom: `2px solid ${withAlpha(roleColor, "99")}`,
          padding: "calc(env(safe-area-inset-top, 0px) + 8px) 0 8px",
        }}
      >
        <div className="topbar-inner">
          <div className="toolbar-row">
            <AppBrand compact subtitle={`לוח בקרה — ${dashboardRole}`} textAlign="right" />
          </div>

          <div className="toolbar-row" style={{ justifyContent: "flex-end" }}>
            {saved ? (
              <span style={{ fontSize: "0.68rem", color: warmTheme.colors.success, display: "flex", alignItems: "center", gap: 4 }}>
                <Save size={10} />
                נשמר
              </span>
            ) : null}
            <button onClick={() => setIsSearchOpen(true)} className="button-secondary" style={{ minHeight: 34, padding: "0 12px", fontSize: "0.74rem", color: warmTheme.colors.text }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Search size={11} />
                חיפוש
              </span>
            </button>
            <button onClick={handleExportStatus} className="button-secondary" style={{ minHeight: 34, padding: "0 12px", fontSize: "0.74rem", color: warmTheme.colors.text }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Printer size={11} />
                  ????? / PDF
              </span>
            </button>
            <span className="pill-chip pill-chip--compact" style={{ color: roleColor, background: withAlpha(roleColor, "26"), borderColor: withAlpha(roleColor, "88") }}>
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
        <div className="dashboard-shell">
          <div className="dashboard-main">
            <div className="hero-panel warm-hero-enter" style={{ background: warmTheme.backgrounds.hero }}>
              <div className="hero-grid content-panel--spacious">
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
                    <div style={{ width: 58, height: 58, borderRadius: 18, display: "grid", placeItems: "center", background: `linear-gradient(135deg,${roleColor},${withAlpha(roleColor, "cc")})`, color: "#2a170d", fontSize: "1.8rem", fontWeight: 900 }}>
                      {user.avatar}
                    </div>
                    <div>
                      <div style={{ fontSize: "1.4rem", fontWeight: 900, color: roleColor }}>שלום, {user.name.split(" ").pop()}</div>
                      <div style={{ fontSize: "0.78rem", color: warmTheme.colors.muted, marginTop: 3 }}>
                        {dashboardRole} · {new Date().toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" })}
                      </div>
                    </div>
                  </div>

                  <div className="action-row" style={{ marginTop: 16 }}>
                    <span className="pill-chip" style={{ color: roleColor, background: withAlpha(roleColor, "1f"), borderColor: withAlpha(roleColor, "66") }}>
                      {dashboardRole}
                    </span>
                    <span className="pill-chip" style={{ color: warmTheme.colors.accent, background: withAlpha(warmTheme.colors.accent, "16"), borderColor: withAlpha(warmTheme.colors.accent, "66") }}>
                      {attentionItems.length ? `${attentionItems.length} עדכונים פתוחים` : "הכול בשליטה"}
                    </span>
                    {canKitchenEdit ? (
                      <span className="pill-chip" style={{ color: warmTheme.colors.success, background: withAlpha(warmTheme.colors.success, "16"), borderColor: withAlpha(warmTheme.colors.success, "66") }}>
                        הרשאות עריכה פעילות
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="surface-card surface-card--soft content-panel">
                  <div className="summary-panel">
                    <div className="summary-list">
                      <div className="summary-list__item">
                        <span className="summary-list__label">התראות פעילות</span>
                        <span className="summary-list__value" style={{ color: attentionItems.length ? warmTheme.colors.danger : warmTheme.colors.success }}>
                          {attentionItems.length ? attentionItems.length : "אין"}
                        </span>
                      </div>
                      <div className="summary-list__item">
                        <span className="summary-list__label">צוות פעיל</span>
                        <span className="summary-list__value">{activeStaff}</span>
                      </div>
                      <div className="summary-list__item">
                        <span className="summary-list__label">דירוגים שנאספו</span>
                        <span className="summary-list__value">{(data.feedback || []).length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="surface-card surface-card--soft content-panel">
              <div className="section-heading" style={{ marginBottom: 10 }}>
                <div>
                  <h2 className="section-heading__title">כיסוי קטגוריות</h2>
                  <div className="section-heading__subtitle">
                    {uncoveredCategories ? `${uncoveredCategories} תחומים בלי אחראי` : "כל התחומים מאוישים"}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {teamCoverage.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setPage(category.page === "home" ? "staff" : category.page)}
                    className="pill-chip"
                    style={{
                      color: category.count ? category.accent : "#ffd4be",
                      background: category.count ? `${category.accent}18` : withAlpha(warmTheme.colors.danger, "18"),
                      borderColor: category.count ? `${category.accent}66` : withAlpha(warmTheme.colors.danger, "66"),
                      cursor: "pointer",
                    }}
                  >
                    <span>{category.icon}</span>
                    <span>{category.label}</span>
                    <span>{category.count ? `${category.count} אחראים` : "לא שויך"}</span>
                  </button>
                ))}
              </div>
            </div>

            {attentionItems.length ? (
              <div className="inline-alert">
                <AlertTriangle size={16} color={warmTheme.colors.danger} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 800, marginBottom: 2 }}>עדכונים חשובים</div>
                  <div style={{ fontSize: "0.76rem" }}>{attentionItems.join(" • ")}</div>
                </div>
              </div>
            ) : null}

            <div className="section-heading">
              <div>
                <h2 className="section-heading__title">מסכי עבודה</h2>
              </div>
            </div>

            <div className="tile-grid">
              {pages.map((pageCard) => (
                <button
                  key={pageCard.key}
                  onClick={() => setPage(pageCard.key)}
                  className="warm-card-enter option-card"
                  style={{ background: warmTheme.backgrounds.cardTint(pageCard.accent), borderColor: withAlpha(pageCard.accent, "99") }}
                >
                  <div style={{ position: "absolute", top: 0, right: 0, width: 4, height: "100%", background: pageCard.accent }} />
                  <div
                    className="icon-badge"
                    style={{
                      background: `linear-gradient(135deg,${pageCard.accent},${withAlpha(pageCard.accent, "cc")})`,
                      boxShadow: `0 0 18px ${withAlpha(pageCard.accent, "55")}`,
                    }}
                  >
                    <pageCard.icon size={24} color="#2a170d" />
                  </div>
                  <div className="option-card__body">
                    <div className="option-card__title" style={{ color: pageCard.accent }}>
                      {pageCard.label}
                    </div>
                    <div
                      className="pill-chip pill-chip--compact"
                      style={{
                        width: "fit-content",
                        color: pageCard.stat.warn ? "#ffd4be" : "#d9f0c8",
                        background: pageCard.stat.warn ? withAlpha(warmTheme.colors.danger, "26") : withAlpha(warmTheme.colors.success, "26"),
                        borderColor: pageCard.stat.warn ? withAlpha(warmTheme.colors.danger, "88") : withAlpha(warmTheme.colors.success, "88"),
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: pageCard.stat.warn ? warmTheme.colors.danger : warmTheme.colors.success,
                          flexShrink: 0,
                        }}
                      />
                      {pageCard.stat.text}
                    </div>
                  </div>
                  <span style={{ color: withAlpha(pageCard.accent, "aa"), fontSize: "1.2rem" }}>←</span>
                </button>
              ))}
            </div>
          </div>

          <aside className="dashboard-note">
            <BulletinBoard data={data} user={user} variant="side" onUpdate={(fn) => setData((state) => ({ ...state, ...fn(state) }))} />
          </aside>
        </div>
      </div>
      <button
        className="dashboard-mobile-note-toggle"
        onClick={() => setIsBoardOpen(true)}
        aria-label="פתח לוח מודעות"
        style={{ opacity: isBoardOpen ? 0 : 1, pointerEvents: isBoardOpen ? "none" : "auto" }}
      >
        <Megaphone size={18} />
        <span className="dashboard-mobile-note-toggle__label">לוח</span>
        <span className="dashboard-mobile-note-toggle__meta">{activeBulletins}/{pendingBoardTasks}</span>
      </button>
      <div className={`dashboard-sidebar-backdrop ${isBoardOpen ? "dashboard-sidebar-backdrop--open" : ""}`} onClick={() => setIsBoardOpen(false)} />
      <div className={`dashboard-sidebar-drawer ${isBoardOpen ? "dashboard-sidebar-drawer--open" : ""}`}>
        <div className="dashboard-sidebar-drawer__panel">
          <BulletinBoard data={data} user={user} variant="drawer" onClose={() => setIsBoardOpen(false)} onUpdate={(fn) => setData((state) => ({ ...state, ...fn(state) }))} />
        </div>
      </div>
      {searchDialog}
    </div>
  );
}
