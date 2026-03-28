import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import {
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
} from "lucide-react";
import BulletinBoard from "./bulletinBoardScreen";
import AppBrand from "../../Components/AppBrand";
import GlobalSearchDialog from "../../Components/GlobalSearchDialog";
import { canEditKitchen } from "../../Utils/helpers";
import { buildGlobalSearchIndex } from "../../Utils/globalSearch";
import { openStatusReportPrint } from "../../Utils/statusReport";
import { warmTheme, withAlpha } from "../../Utils/uiTheme";
import { canUserAccessPage, getVisibleSectionKeysForUser } from "../../Utils/workflow";
import { getDemoInitialPage } from "../../Utils/demoMode";

const InventoryPage = lazy(() => import("./InventoryPageScreen"));
const SaladsPage = lazy(() => import("./SaladsPageScreen"));
const HotFoodPage = lazy(() => import("./HotFoodPageScreen"));
const MorningCookTasks = lazy(() => import("../Morning/MorningCookTasks"));
const PrepPageScreen = lazy(() => import("./PrepPageScreen"));

export default function CookView({ data, user, staff, setData, onLogout }) {
  const [page, setPage] = useState(() =>
    getDemoInitialPage(["home", "inventory", "salads", "hot", "morningTasks", "prep"], "home")
  );
  const [saved, setSaved] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isBoardOpen, setIsBoardOpen] = useState(false);
  const canEdit = canEditKitchen(user);
  const visibleSectionKeys = useMemo(() => getVisibleSectionKeysForUser(user, data), [user, data]);
  const visibleSectionSet = useMemo(() => new Set(visibleSectionKeys), [visibleSectionKeys]);
  const quickActions = [];
  const searchIndex = useMemo(() => {
    const allowedPages = new Set(["home", ...visibleSectionKeys]);
    return buildGlobalSearchIndex({ data, staff }).filter((entry) => allowedPages.has(entry.page));
  }, [data, staff, visibleSectionKeys]);

  useEffect(() => {
    const showId = setTimeout(() => setSaved(true), 0);
    const timeoutId = setTimeout(() => setSaved(false), 700);
    return () => {
      clearTimeout(showId);
      clearTimeout(timeoutId);
    };
  }, [data]);

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
    if (!canUserAccessPage(user, data, page)) {
      setPage("home");
    }
  }, [data, page, user]);

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

  const navigateToPage = (nextPage) => {
    if (!canUserAccessPage(user, data, nextPage)) return;
    setPage(nextPage);
  };

  const handleExportStatus = () => {
    const opened = openStatusReportPrint({ data, staff, user });
    if (!opened && typeof window !== "undefined") {
      window.alert("לא ניתן לפתוח את חלון ההדפסה. ודא שחלונות קופצים מאופשרים.");
    }
  };

  const sharedProps = {
    data,
    user,
    staff,
    setData,
    editMode: canEdit,
    onToggleEdit: null,
    onReset: null,
    onBack: () => setPage("home"),
    onLogout,
    saved,
    isNagad: canEdit,
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
          טוען מסך...
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
        const nextPage = ["inventory", "salads", "hot", "morningTasks", "prep", "home"].includes(result.page) ? result.page : "home";
        navigateToPage(nextPage);
      }}
    />
  ) : null;

  const renderPageWithOverlay = (content) => (
    <>
      {renderLazyPage(content)}
      {searchDialog}
    </>
  );

  if (page === "inventory") return renderPageWithOverlay(<InventoryPage {...sharedProps} />);
  if (page === "salads") return renderPageWithOverlay(<SaladsPage {...sharedProps} />);
  if (page === "hot") return renderPageWithOverlay(<HotFoodPage {...sharedProps} />);
  if (page === "morningTasks") return renderPageWithOverlay(<MorningCookTasks {...sharedProps} />);
  if (page === "prep") return renderPageWithOverlay(<PrepPageScreen {...sharedProps} isAdmin={canEdit} />);

  const inventoryItems = Object.values(data.inventory || {}).flat();
  const lowStock = inventoryItems.filter((item) => item.qty < item.min).length;
  const tasks = data.morningTasks || [];
  const pendingTasks = tasks.filter((task) => !task.done).length;
  const prepTasks = data.prepTasks || [];
  const pendingPrepTasks = prepTasks.filter((task) => !task.isDone).length;
  const lowSalads = (data.salads || []).filter((salad) => salad.level < 30).length;
  const activeBulletins = (data.bulletins || []).filter((bulletin) => !bulletin.archived).length;
  const pendingBoardTasks = (data.tasks || []).filter((task) => task.date === new Date().toISOString().slice(0, 10) && !task.doneBy).length;

  const sections = [
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
      label: "בישולים",
      icon: Flame,
      accent: "#f48f63",
      stat: { text: `${(data.hotFood || []).length} מנות פעילות`, warn: false },
    },
    {
      key: "morningTasks",
      label: "ניקוי ומשימות",
      icon: ListChecks,
      accent: "#5ec2b0",
      stat: pendingTasks > 0 ? { text: `${pendingTasks} משימות פתוחות`, warn: true } : { text: tasks.length ? "הכול הושלם" : "אין משימות", warn: false },
    },
    {
      key: "prep",
      label: "הכנות",
      icon: ClipboardList,
      accent: "#d8d07b",
      stat: pendingPrepTasks > 0 ? { text: `${pendingPrepTasks} הכנות פתוחות`, warn: true } : { text: prepTasks.length ? "כל ההכנות בוצעו" : "אין הכנות", warn: false },
    },
  ];

  const visibleSections = sections.filter((section) => visibleSectionSet.has(section.key));
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
          borderBottom: `2px solid ${withAlpha(warmTheme.colors.accent, "88")}`,
          padding: "calc(env(safe-area-inset-top, 0px) + 8px) 0 8px",
        }}
      >
        <div className="topbar-inner">
          <div className="toolbar-row">
            <AppBrand compact subtitle="ממשק טבח" textAlign="right" />
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
                הדפסה / PDF
              </span>
            </button>
            <span className="pill-chip pill-chip--compact" style={{ color: user.color, background: withAlpha(user.color, "1f"), borderColor: withAlpha(user.color, "77") }}>
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
            {quickActions.length ? (
              <>
                <div className="section-heading">
                  <div>
                    <h2 className="section-heading__title">פעולות מהירות</h2>
                  </div>
                </div>

                <div className="tile-grid tile-grid--dense">
                  {quickActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => navigateToPage(action.page)}
                      className="warm-card-enter option-card"
                      style={{ background: warmTheme.backgrounds.cardTint(action.accent), borderColor: withAlpha(action.accent, "88") }}
                    >
                      <div style={{ position: "absolute", top: 0, right: 0, width: 4, height: "100%", background: action.accent }} />
                      <div
                        className="icon-badge"
                        style={{
                          background: `linear-gradient(135deg,${action.accent},${withAlpha(action.accent, "cc")})`,
                          boxShadow: `0 0 18px ${withAlpha(action.accent, "44")}`,
                        }}
                      >
                        <span style={{ fontSize: "1.1rem" }}>{action.icon}</span>
                      </div>
                      <div className="option-card__body">
                        <div className="option-card__title" style={{ color: action.accent }}>
                          {action.label}
                        </div>
                        <div className="option-card__text">{action.subtitle}</div>
                      </div>
                      <span style={{ color: withAlpha(action.accent, "aa"), fontSize: "1.2rem" }}>←</span>
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            <div className="section-heading">
              <div>
                <h2 className="section-heading__title">מסכי עבודה</h2>
              </div>
            </div>

            <div className="tile-grid">
              {visibleSections.length ? (
                visibleSections.map((section) => (
                  <button
                    key={section.key}
                    onClick={() => navigateToPage(section.key)}
                    className="warm-card-enter option-card"
                    style={{ background: warmTheme.backgrounds.cardTint(section.accent), borderColor: withAlpha(section.accent, "99") }}
                  >
                    <div style={{ position: "absolute", top: 0, right: 0, width: 4, height: "100%", background: section.accent }} />
                    <div
                      className="icon-badge"
                      style={{
                        background: `linear-gradient(135deg,${section.accent},${withAlpha(section.accent, "cc")})`,
                        boxShadow: `0 0 18px ${withAlpha(section.accent, "55")}`,
                      }}
                    >
                      <section.icon size={24} color="#2a170d" />
                    </div>
                    <div className="option-card__body">
                      <div className="option-card__title" style={{ color: section.accent }}>
                        {section.label}
                      </div>
                      <div
                        className="pill-chip pill-chip--compact"
                        style={{
                          width: "fit-content",
                          color: section.stat.warn ? "#ffd4be" : "#d9f0c8",
                          background: section.stat.warn ? withAlpha(warmTheme.colors.danger, "26") : withAlpha(warmTheme.colors.success, "26"),
                          borderColor: section.stat.warn ? withAlpha(warmTheme.colors.danger, "88") : withAlpha(warmTheme.colors.success, "88"),
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: section.stat.warn ? warmTheme.colors.danger : warmTheme.colors.success,
                            flexShrink: 0,
                          }}
                        />
                        {section.stat.text}
                      </div>
                    </div>
                    <span style={{ color: withAlpha(section.accent, "aa"), fontSize: "1.2rem" }}>←</span>
                  </button>
                ))
              ) : (
                <div className="surface-card surface-card--soft content-panel" style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: "0.88rem", fontWeight: 800, color: warmTheme.colors.text }}>אין קטגוריות עבודה משויכות לטבח הזה</div>
                  <div style={{ fontSize: "0.72rem", color: warmTheme.colors.muted, marginTop: 4 }}>
                    אחרי שיוך קטגוריות בניהול הצוות, יופיעו כאן רק המסכים הרלוונטיים לו.
                  </div>
                </div>
              )}
            </div>

            {quickActions.length ? (
              <div
                className="surface-card surface-card--soft content-panel"
                style={{
                  position: "sticky",
                  bottom: 12,
                  zIndex: 3,
                  borderColor: withAlpha(warmTheme.colors.accent, "55"),
                  backdropFilter: "blur(8px)",
                }}
              >
                <div style={{ fontSize: "0.72rem", color: warmTheme.colors.muted, marginBottom: 8 }}>פעולות מהירות לטלפון</div>
                <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
                  {quickActions.map((action) => (
                    <button
                      key={`dock-${action.id}`}
                      onClick={() => navigateToPage(action.page)}
                      style={{
                        minWidth: 140,
                        borderRadius: 12,
                        border: `1px solid ${withAlpha(action.accent, "77")}`,
                        background: warmTheme.backgrounds.cardTint(action.accent),
                        color: action.accent,
                        padding: "10px 12px",
                        cursor: "pointer",
                        textAlign: "right",
                      }}
                    >
                      <div style={{ fontSize: "0.9rem", fontWeight: 800 }}>
                        {action.icon} {action.label}
                      </div>
                      <div style={{ fontSize: "0.66rem", color: warmTheme.colors.muted, marginTop: 4 }}>{action.subtitle}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <aside className="dashboard-note">
            <BulletinBoard data={data} user={user} variant="side" onUpdate={(fn) => setData((current) => ({ ...current, ...fn(current) }))} />
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
          <BulletinBoard data={data} user={user} variant="drawer" onClose={() => setIsBoardOpen(false)} onUpdate={(fn) => setData((current) => ({ ...current, ...fn(current) }))} />
        </div>
      </div>
      {searchDialog}
    </div>
  );
}
