import { useMemo, useState } from "react";
import { ArrowLeft, Lock, MapPin, RotateCcw } from "lucide-react";
import AppBrand from "../../Components/AppBrand";
import { isLegacyPinHash, verifyPin } from "../../Utils/hash";
import { APP_NAME } from "../../Utils/branding";
import { warmTheme, withAlpha } from "../../Utils/uiTheme";

export default function LoginScreen({
  onLogin,
  staff,
  bases,
  initialBaseId,
  onResetStaff,
  onCreateBaseWithNagad,
  onUpgradePinHash,
}) {
  const [step, setStep] = useState("base");
  const [selId, setSelId] = useState("");
  const [baseId, setBaseId] = useState(initialBaseId || "");
  const [pinInput, setPinInput] = useState("");
  const [pinErr, setPinErr] = useState("");

  const [newBaseName, setNewBaseName] = useState("");
  const [newBattalion, setNewBattalion] = useState("");
  const [newBrigade, setNewBrigade] = useState("");
  const [newDivision, setNewDivision] = useState("");
  const [newCommand, setNewCommand] = useState("");
  const [newNagadName, setNewNagadName] = useState("");
  const [newNagadId, setNewNagadId] = useState("");
  const [newNagadPin, setNewNagadPin] = useState("");
  const [newNagadPin2, setNewNagadPin2] = useState("");
  const [createErr, setCreateErr] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const baseOptions = useMemo(() => (Array.isArray(bases) ? bases : []), [bases]);
  const selectedBase = baseOptions.find((base) => base.id === baseId) ?? baseOptions[0];

  const staffInBase = useMemo(
    () =>
      Array.isArray(staff)
        ? staff.filter((member) => member?.active && member?.baseId === selectedBase?.id)
        : [],
    [selectedBase?.id, staff]
  );

  const activeCooks = useMemo(
    () =>
      staffInBase.filter((member) => {
        if (member?.role !== "nagad") return true;
        return member?.isVerifiedNagad !== false;
      }),
    [staffInBase]
  );

  const pendingNagadCount = useMemo(
    () => staffInBase.filter((member) => member?.role === "nagad" && member?.isVerifiedNagad === false).length,
    [staffInBase]
  );

  const selectedUser = activeCooks.find((user) => user.id === selId);

  const roleText = (member) => {
    if (member?.role === "nagad") return "נגד מטבח";
    if (member?.role === "admin") return "מנהל מטבח";
    return "טבח";
  };

  const stepIndex = (() => {
    if (step === "base" || step === "createBase") return 0;
    if (step === "home") return 1;
    return 2;
  })();

  const stepDots = [0, 1, 2];
  const stepViewKey = step === "cook" ? (selectedUser ? `cook-user-${selectedUser.id}` : "cook-list") : step;
  const screenMeta = {
    base: {
      title: "בחירת בסיס",
      subtitle: "",
    },
    home: {
      title: "סוג הכניסה",
      subtitle: "",
    },
    soldier: {
      title: "כניסת חייל",
      subtitle: "",
    },
    cook: {
      title: "כניסת צוות",
      subtitle: "",
    },
    createBase: {
      title: "יצירת בסיס חדש",
      subtitle: "",
    },
  };

  const resetLoginState = () => {
    setSelId("");
    setPinInput("");
    setPinErr("");
  };

  const resetCreateState = () => {
    setNewBaseName("");
    setNewBattalion("");
    setNewBrigade("");
    setNewDivision("");
    setNewCommand("");
    setNewNagadName("");
    setNewNagadId("");
    setNewNagadPin("");
    setNewNagadPin2("");
    setCreateErr("");
  };

  const baseLoginPayload = (payload) => {
    if (!selectedBase?.id) return null;
    return {
      ...payload,
      baseId: selectedBase.id,
      baseName: selectedBase.name,
    };
  };

  const continueToRoles = () => {
    if (!selectedBase?.id) return;
    resetLoginState();
    setStep("home");
  };

  const backToBaseSelection = () => {
    setStep("base");
    resetLoginState();
  };

  const goHome = () => {
    resetLoginState();
    setStep("home");
  };

  const goCreateBase = () => {
    resetCreateState();
    setStep("createBase");
  };

  const goCook = () => {
    resetLoginState();
    setStep("cook");
  };

  const handlePin = async () => {
    if (!selectedBase?.id) return setPinErr("יש לבחור בסיס");
    if (!selectedUser) return;
    if (selectedUser.role === "nagad" && selectedUser.isVerifiedNagad === false) {
      setPinErr("נגד המטבח ממתין לאימות של מנהל האפליקציה");
      return;
    }
    if (await verifyPin(pinInput, selectedUser.pinHash)) {
      if (isLegacyPinHash(selectedUser.pinHash) && typeof onUpgradePinHash === "function") {
        await onUpgradePinHash(selectedUser.id, pinInput);
      }
      const payload = baseLoginPayload({ ...selectedUser });
      if (payload) void onLogin(payload);
    } else {
      setPinErr("קוד שגוי, נסו שוב");
      setPinInput("");
      setTimeout(() => setPinErr(""), 2500);
    }
  };

  const soldierLogin = () => {
    if (!selectedBase?.id) return;
    const payload = baseLoginPayload({
      id: "guest",
      name: "חייל אורח",
      role: "soldier",
      avatar: "🪖",
      color: "#8ac76b",
    });
    if (payload) void onLogin(payload);
  };

  const mapCreateError = (error) => {
    const message = error?.message || "";
    if (message.includes("missing-base-name")) return "יש להזין שם בסיס";
    if (message.includes("missing-sergeant-name")) return "יש להזין שם נגד מטבח";
    if (message.includes("missing-sergeant-id")) return "יש להזין מספר מזהה לנגד";
    if (message.includes("invalid-pin")) return "PIN חייב להיות 4 ספרות";
    if (message.includes("base-name-exists")) return "שם בסיס כבר קיים במערכת";
    if (message.includes("base-nagad-exists")) return "לבסיס הזה כבר קיים נגד מטבח";
    return "שמירה נכשלה, נסו שוב";
  };

  const submitCreateBase = async () => {
    const name = newBaseName.trim();
    const nagadName = newNagadName.trim();
    const nagadId = newNagadId.trim();
    const pin = newNagadPin.trim();
    const pin2 = newNagadPin2.trim();

    if (!name) return setCreateErr("יש להזין שם בסיס");
    if (!nagadName) return setCreateErr("יש להזין שם נגד מטבח");
    if (!nagadId) return setCreateErr("יש להזין מספר מזהה לנגד");
    if (!/^\d{4}$/.test(pin)) return setCreateErr("PIN חייב להיות 4 ספרות");
    if (pin !== pin2) return setCreateErr("קודי PIN לא תואמים");
    if (typeof onCreateBaseWithNagad !== "function") {
      return setCreateErr("יצירת בסיס אינה זמינה כרגע");
    }

    setCreateErr("");
    setIsCreating(true);
    try {
      const newUser = await onCreateBaseWithNagad({
        base: {
          name,
          battalion: newBattalion.trim(),
          brigade: newBrigade.trim(),
          division: newDivision.trim(),
          command: newCommand.trim(),
        },
        sergeant: {
          name: nagadName,
          hogerId: nagadId,
          pin,
        },
      });

      if (newUser) {
        void onLogin({
          ...newUser,
          baseId: newUser.baseId,
          baseName: newUser.baseName || name,
        });
      }
    } catch (error) {
      setCreateErr(mapCreateError(error));
    } finally {
      setIsCreating(false);
    }
  };

  const cardBaseStyle = {
    background: warmTheme.backgrounds.cardTint(warmTheme.colors.accent),
    borderColor: withAlpha(warmTheme.colors.accent, "55"),
  };

  return (
    <div
      className="app-shell warm-elevated motion-stage motion-stage--app"
      style={{
        minHeight: "100vh",
        background: warmTheme.backgrounds.app,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        direction: "rtl",
        fontFamily: warmTheme.fontFamily,
        padding: 20,
        color: warmTheme.colors.text,
      }}
    >
      <div style={{ width: "100%", maxWidth: 760 }}>
        <div className="surface-card login-card">
          <div key={stepViewKey} className="motion-stage motion-stage--panel">
            <div className="warm-hero-enter" style={{ marginBottom: 18 }}>
            <div className="section-heading">
              <div>
                <AppBrand title={APP_NAME} subtitle="כניסה ובקרת רשת מטבח" />
              </div>
              <div className="step-dots" aria-hidden="true" style={{ alignSelf: "flex-start" }}>
                {stepDots.map((dot) => (
                  <span key={dot} className={`step-dot${stepIndex === dot ? " step-dot--active" : ""}`} />
                ))}
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <h1 className="section-heading__title" style={{ margin: 0 }}>
                {screenMeta[step].title}
              </h1>
              {screenMeta[step].subtitle ? <p className="section-heading__subtitle">{screenMeta[step].subtitle}</p> : null}
            </div>

            {selectedBase?.name ? (
              <div style={{ marginTop: 14 }}>
                <span className="pill-chip" style={{ color: warmTheme.colors.info, background: withAlpha(warmTheme.colors.info, "16"), borderColor: withAlpha(warmTheme.colors.info, "55") }}>
                  <MapPin size={12} />
                  {selectedBase.name}
                </span>
              </div>
            ) : null}
          </div>

          {step === "base" ? (
            <div className="app-stack warm-card-enter">
              <div className="surface-card surface-card--soft content-panel">
                <label className="field-stack">
                  <span className="field-label" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <MapPin size={13} />
                    בחירת בסיס / מטבח
                  </span>
                  <select
                    value={selectedBase?.id ?? ""}
                    onChange={(event) => {
                      setBaseId(event.target.value);
                      resetLoginState();
                    }}
                    className="input-surface"
                    style={{ direction: "rtl" }}
                  >
                    {baseOptions.length ? (
                      baseOptions.map((base) => (
                        <option key={base.id} value={base.id}>
                          {base.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        אין בסיסים פעילים כרגע. ניתן ליצור בסיס חדש כנגד מטבח.
                      </option>
                    )}
                  </select>
                </label>
              </div>

              <div className="action-row">
                <button onClick={continueToRoles} disabled={!selectedBase?.id} className="button-primary">
                  המשך
                </button>
                <button onClick={goCreateBase} className="button-ghost">
                  יצירת בסיס חדש + נגד מטבח
                </button>
              </div>
            </div>
          ) : null}

          {step === "home" ? (
            <div className="app-stack">
              <div className="surface-card surface-card--soft content-panel" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <span className="pill-chip" style={{ color: warmTheme.colors.info, background: withAlpha(warmTheme.colors.info, "16"), borderColor: withAlpha(warmTheme.colors.info, "66") }}>
                  <MapPin size={12} />
                  {selectedBase?.name}
                </span>
              </div>

              <button
                onClick={() => setStep("soldier")}
                className="warm-card-enter option-card"
                style={{ background: "linear-gradient(135deg,#364f1f,#283a16)", borderColor: "#729c58" }}
              >
                <div className="icon-badge" style={{ background: "linear-gradient(135deg,#8ac76b,#5f8f42)", color: "#223013", fontSize: "1.4rem" }}>
                  🪖
                </div>
                <div className="option-card__body">
                  <div className="option-card__title" style={{ color: "#d6edbf" }}>
                    כניסת חייל
                  </div>
                </div>
                <span style={{ color: "#b3d499", fontSize: "1.2rem" }}>←</span>
              </button>

              <button
                onClick={goCook}
                className="warm-card-enter option-card"
                style={{ background: "linear-gradient(135deg,#51301d,#362012)", borderColor: withAlpha(warmTheme.colors.accent, "99") }}
              >
                <div className="icon-badge" style={{ background: "linear-gradient(135deg,#ffb24d,#ff8b3d)" }}>
                  <Lock size={22} color="#3a1f11" />
                </div>
                <div className="option-card__body">
                  <div className="option-card__title" style={{ color: warmTheme.colors.accent }}>
                    כניסת צוות / נגד מטבח
                  </div>
                </div>
                <span style={{ color: withAlpha(warmTheme.colors.accent, "aa"), fontSize: "1.2rem" }}>←</span>
              </button>

              <div className="action-row">
                <button onClick={goCreateBase} className="button-ghost">
                  יצירת בסיס חדש כנגד מטבח
                </button>
                <button onClick={backToBaseSelection} className="button-secondary" style={{ color: warmTheme.colors.muted }}>
                  החלפת בסיס
                </button>
              </div>
            </div>
          ) : null}

          {step === "soldier" ? (
            <div className="app-stack">
              <button onClick={goHome} style={{ background: "none", border: "none", color: warmTheme.colors.muted, cursor: "pointer", fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: 4, padding: 0, width: "fit-content" }}>
                <ArrowLeft size={13} />
                חזרה
              </button>
              <button onClick={soldierLogin} disabled={!selectedBase?.id} className="button-primary" style={{ width: "100%", background: selectedBase?.id ? "linear-gradient(135deg,#8ac76b,#5f8f42)" : warmTheme.colors.panel, color: selectedBase?.id ? "#223013" : warmTheme.colors.muted }}>
                כניסה למטבח הבסיס
              </button>
            </div>
          ) : null}

          {step === "cook" ? (
            <div className="app-stack">
              <button onClick={goHome} style={{ background: "none", border: "none", color: warmTheme.colors.muted, cursor: "pointer", fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: 4, padding: 0, width: "fit-content" }}>
                <ArrowLeft size={13} />
                חזרה
              </button>

              {activeCooks.length === 0 ? (
                <div className="inline-alert" style={{ flexDirection: "column", alignItems: "stretch" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>לא נמצאו אנשי צוות פעילים לבסיס הזה.</div>
                  {pendingNagadCount > 0 ? (
                    <div style={{ fontSize: "0.76rem", color: warmTheme.colors.info }}>
                      {pendingNagadCount} נגדים ממתינים לאימות מנהל אפליקציה
                    </div>
                  ) : null}
                  <div className="action-row" style={{ width: "100%" }}>
                    <button onClick={goCreateBase} className="button-ghost">
                      יצירת בסיס חדש
                    </button>
                    <button
                      onClick={onResetStaff}
                      className="button-secondary"
                      style={{
                        color: "#ffd4be",
                        borderColor: withAlpha(warmTheme.colors.danger, "88"),
                        background: withAlpha(warmTheme.colors.danger, "26"),
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <RotateCcw size={13} />
                        איפוס צוות ברירת מחדל
                      </span>
                    </button>
                  </div>
                </div>
              ) : !selectedUser ? (
                <div className="app-stack">
                  <p className="section-note" style={{ textAlign: "center", fontSize: "0.84rem" }}>
                    בחרו את הפרופיל שלכם:
                  </p>
                  {activeCooks.map((cook) => (
                    <button
                      key={cook.id}
                      onClick={() => {
                        setSelId(cook.id);
                        setPinErr("");
                      }}
                      className="option-card"
                      style={{ ...cardBaseStyle, borderColor: withAlpha(cook.color, "55") }}
                    >
                      <span style={{ fontSize: "1.5rem" }}>{cook.avatar}</span>
                      <div className="option-card__body">
                        <div className="option-card__title" style={{ color: cook.color }}>
                          {cook.name}
                        </div>
                        <p className="option-card__text">
                          {roleText(cook)}
                          {cook.isAppManager ? " • מנהל אפליקציה" : ""}
                        </p>
                      </div>
                      <span style={{ color: warmTheme.colors.muted, fontSize: "1.2rem" }}>←</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="surface-card surface-card--soft content-panel app-stack">
                  <button
                    onClick={() => {
                      setSelId("");
                      setPinErr("");
                    }}
                    style={{ background: "none", border: "none", color: warmTheme.colors.muted, cursor: "pointer", fontSize: "0.78rem", display: "inline-flex", alignItems: "center", gap: 4, padding: 0, width: "fit-content" }}
                  >
                    <ArrowLeft size={13} />
                    בחירת פרופיל אחר
                  </button>

                  <div style={{ textAlign: "center" }}>
                    <span style={{ fontSize: "2rem" }}>{selectedUser.avatar}</span>
                    <p style={{ color: selectedUser.color, fontWeight: 700, fontSize: "1rem", margin: "7px 0 2px" }}>{selectedUser.name}</p>
                    <p style={{ color: warmTheme.colors.muted, fontSize: "0.7rem", margin: "0 0 4px" }}>
                      {roleText(selectedUser)}
                      {selectedUser.isAppManager ? " • מנהל אפליקציה" : ""}
                    </p>
                  </div>

                  <div style={{ maxWidth: 280, width: "100%", margin: "0 auto" }} className="field-stack">
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={pinInput}
                      autoFocus
                      onChange={(event) => {
                        if (/^\d*$/.test(event.target.value)) setPinInput(event.target.value);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && pinInput.length === 4) handlePin();
                      }}
                      placeholder="• • • •"
                      className="input-surface"
                      style={{
                        borderColor: pinErr ? warmTheme.colors.danger : withAlpha(selectedUser.color, "88"),
                        color: selectedUser.color,
                        fontSize: "1.5rem",
                        textAlign: "center",
                        letterSpacing: "0.4em",
                      }}
                    />
                    {pinErr ? <p style={{ color: warmTheme.colors.danger, fontSize: "0.75rem", textAlign: "center", margin: 0 }}>{pinErr}</p> : null}
                    <button
                      onClick={handlePin}
                      disabled={pinInput.length !== 4}
                      className="button-primary"
                      style={{
                        width: "100%",
                        background: pinInput.length === 4 ? `linear-gradient(135deg,${selectedUser.color},${withAlpha(selectedUser.color, "cc")})` : warmTheme.colors.panel,
                        color: pinInput.length === 4 ? "#2a170d" : warmTheme.colors.muted,
                      }}
                    >
                      כניסה
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}

            {step === "createBase" ? (
              <div className="app-stack">
              <button onClick={baseOptions.length ? backToBaseSelection : () => setStep("base")} style={{ background: "none", border: "none", color: warmTheme.colors.muted, cursor: "pointer", fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: 4, padding: 0, width: "fit-content" }}>
                <ArrowLeft size={13} />
                חזרה
              </button>

              <div className="surface-card surface-card--soft content-panel app-stack">
                <div style={{ color: warmTheme.colors.accent, fontWeight: 800, fontSize: "0.96rem" }}>
                  יצירת בסיס מטבח + משתמש נגד מטבח
                </div>

                <div className="form-grid">
                  <label className="field-stack">
                    <span className="field-label">שם בסיס *</span>
                    <input value={newBaseName} onChange={(event) => setNewBaseName(event.target.value)} placeholder="שם בסיס" className="input-surface" />
                  </label>
                  <label className="field-stack">
                    <span className="field-label">גדוד</span>
                    <input value={newBattalion} onChange={(event) => setNewBattalion(event.target.value)} placeholder="אופציונלי" className="input-surface" />
                  </label>
                  <label className="field-stack">
                    <span className="field-label">חטיבה</span>
                    <input value={newBrigade} onChange={(event) => setNewBrigade(event.target.value)} placeholder="אופציונלי" className="input-surface" />
                  </label>
                  <label className="field-stack">
                    <span className="field-label">אוגדה</span>
                    <input value={newDivision} onChange={(event) => setNewDivision(event.target.value)} placeholder="אופציונלי" className="input-surface" />
                  </label>
                </div>

                <label className="field-stack">
                  <span className="field-label">פיקוד</span>
                  <input value={newCommand} onChange={(event) => setNewCommand(event.target.value)} placeholder="אופציונלי" className="input-surface" />
                </label>

                <div style={{ color: warmTheme.colors.info, fontSize: "0.8rem", fontWeight: 700 }}>פרטי נגד מטבח</div>

                <div className="form-grid">
                  <label className="field-stack">
                    <span className="field-label">שם מלא *</span>
                    <input value={newNagadName} onChange={(event) => setNewNagadName(event.target.value)} placeholder="שם מלא" className="input-surface" />
                  </label>
                  <label className="field-stack">
                    <span className="field-label">מספר מזהה *</span>
                    <input value={newNagadId} onChange={(event) => setNewNagadId(event.target.value)} placeholder="מספר מזהה" className="input-surface" />
                  </label>
                  <label className="field-stack">
                    <span className="field-label">PIN (4 ספרות)</span>
                    <input
                      value={newNagadPin}
                      onChange={(event) => setNewNagadPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="PIN"
                      type="password"
                      inputMode="numeric"
                      className="input-surface"
                    />
                  </label>
                  <label className="field-stack">
                    <span className="field-label">אימות PIN</span>
                    <input
                      value={newNagadPin2}
                      onChange={(event) => setNewNagadPin2(event.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="PIN חוזר"
                      type="password"
                      inputMode="numeric"
                      className="input-surface"
                    />
                  </label>
                </div>

                {createErr ? <div style={{ fontSize: "0.78rem", color: warmTheme.colors.danger }}>{createErr}</div> : null}

                <button onClick={() => void submitCreateBase()} disabled={isCreating} className="button-primary" style={{ width: "100%" }}>
                  {isCreating ? "שומר..." : "יצירת בסיס וכניסה כנגד מטבח"}
                </button>
              </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
