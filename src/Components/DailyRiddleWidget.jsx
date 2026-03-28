import { useEffect, useMemo, useState } from "react";
import { Brain, ChevronLeft, Lightbulb, Trophy } from "lucide-react";
import { DIFFICULTY_META, getDailyRiddle, getLocalDateKey } from "../Utils/riddleBank";
import { warmTheme, withAlpha } from "../Utils/uiTheme";

const STORAGE_KEY = "idf-daily-riddle-v1";

function readSolvedDates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.solvedDates) ? parsed.solvedDates : [];
  } catch {
    return [];
  }
}

function writeSolvedDates(solvedDates) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ solvedDates }));
  } catch {
    return;
  }
}

function subtractDay(dateKey) {
  const [year, month, day] = dateKey.split("-").map((value) => Number.parseInt(value, 10));
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - 1);
  return getLocalDateKey(date);
}

function computeStreak(todayKey, solvedDates) {
  const solved = new Set(solvedDates);
  let streak = 0;
  let cursor = todayKey;
  while (solved.has(cursor)) {
    streak += 1;
    cursor = subtractDay(cursor);
  }
  return streak;
}

function normalizeAnswer(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[״"'`]/g, "")
    .replace(/\s+/g, " ")
    .replace(/[.,!?]/g, "");
}

function compactAnswer(value) {
  return normalizeAnswer(value).replace(/[^0-9a-zא-ת:]/g, "");
}

function isCorrectAnswer(input, answer) {
  const normalizedInput = normalizeAnswer(input);
  const normalizedAnswer = normalizeAnswer(answer);

  if (!normalizedInput) return false;
  if (normalizedInput === normalizedAnswer) return true;
  if (compactAnswer(normalizedInput) === compactAnswer(normalizedAnswer)) return true;

  const numericInput = normalizedInput.match(/^-?\d+(?:\.\d+)?$/)?.[0];
  const numericAnswer = normalizedAnswer.match(/^-?\d+(?:\.\d+)?/)?.[0];
  return Boolean(numericInput && numericAnswer && numericInput === numericAnswer);
}

export default function DailyRiddleWidget() {
  const todayKey = getLocalDateKey();
  const todayRiddle = useMemo(() => getDailyRiddle(todayKey), [todayKey]);
  const [collapsed, setCollapsed] = useState(false);
  const [revealedDateKey, setRevealedDateKey] = useState(null);
  const [solvedDates, setSolvedDates] = useState(() => readSolvedDates());
  const [answerInput, setAnswerInput] = useState("");
  const [answerState, setAnswerState] = useState("idle");

  useEffect(() => {
    writeSolvedDates(solvedDates);
  }, [solvedDates]);

  useEffect(() => {
    setAnswerInput("");
    setAnswerState("idle");
  }, [todayKey]);

  const showAnswer = revealedDateKey === todayKey;
  const solvedToday = solvedDates.includes(todayKey);
  const streak = useMemo(() => computeStreak(todayKey, solvedDates), [todayKey, solvedDates]);
  const meta = DIFFICULTY_META[todayRiddle.difficulty] ?? DIFFICULTY_META.easy;

  const markSolvedToday = () => {
    if (solvedToday) return;
    setSolvedDates((current) => [...current, todayKey]);
  };

  const revealAnswer = () => {
    setRevealedDateKey(todayKey);
  };

  const submitAnswer = () => {
    if (!answerInput.trim()) return;

    if (isCorrectAnswer(answerInput, todayRiddle.answer)) {
      markSolvedToday();
      setAnswerState("correct");
      setRevealedDateKey(todayKey);
      return;
    }

    setAnswerState("wrong");
  };

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        style={{
          position: "fixed",
          top: "calc(env(safe-area-inset-top, 0px) + 88px)",
          right: 12,
          zIndex: 70,
          border: `1px solid ${withAlpha(meta.color, "aa")}`,
          background: withAlpha(meta.color, "22"),
          color: meta.color,
          borderRadius: 999,
          padding: "8px 12px",
          fontWeight: 800,
          fontSize: "0.76rem",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <Brain size={13} /> חידה
      </button>
    );
  }

  return (
    <aside
      style={{
        position: "fixed",
        top: "calc(env(safe-area-inset-top, 0px) + 78px)",
        right: 10,
        width: "min(360px, calc(100vw - 20px))",
        zIndex: 70,
        borderRadius: 14,
        border: `1px solid ${withAlpha(meta.color, "66")}`,
        background: "linear-gradient(160deg,#171f2d,#111927)",
        boxShadow: warmTheme.shadows.soft,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 12px",
          borderBottom: `1px solid ${withAlpha(meta.color, "44")}`,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Brain size={15} color={meta.color} />
        <div style={{ flex: 1 }}>
          <div style={{ color: meta.color, fontWeight: 900, fontSize: "0.83rem" }}>חידת היום</div>
          <div style={{ color: warmTheme.colors.muted, fontSize: "0.64rem" }}>{meta.label}</div>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          style={{
            border: "none",
            background: "transparent",
            color: warmTheme.colors.muted,
            cursor: "pointer",
            padding: 0,
            display: "inline-flex",
            alignItems: "center",
          }}
          aria-label="סגירה"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      <div style={{ padding: 12, direction: "rtl", color: warmTheme.colors.text }}>
        <div
          style={{
            borderRadius: 11,
            border: `1px solid ${withAlpha(meta.color, "44")}`,
            background: withAlpha(meta.color, "14"),
            padding: "10px 11px",
            lineHeight: 1.5,
            fontSize: "0.82rem",
            marginBottom: 10,
          }}
        >
          {todayRiddle.question}
        </div>

        {!showAnswer ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input
              value={answerInput}
              onChange={(event) => {
                setAnswerInput(event.target.value);
                if (answerState !== "idle") setAnswerState("idle");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") submitAnswer();
              }}
              placeholder="כתוב תשובה"
              className="input-surface"
              style={{
                minHeight: 40,
                padding: "9px 11px",
                fontSize: "0.8rem",
                direction: "rtl",
              }}
            />

            {answerState === "wrong" ? (
              <div style={{ fontSize: "0.72rem", color: warmTheme.colors.danger }}>לא נכון, נסה שוב</div>
            ) : null}

            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
              <button
                onClick={submitAnswer}
                style={{
                  border: "none",
                  borderRadius: 9,
                  cursor: "pointer",
                  fontWeight: 800,
                  fontSize: "0.8rem",
                  padding: "9px 10px",
                  background: `linear-gradient(135deg,${meta.color},${withAlpha(meta.color, "cc")})`,
                  color: "#1f140d",
                }}
              >
                בדוק
              </button>
              <button
                onClick={revealAnswer}
                className="button-secondary"
                style={{
                  minHeight: 40,
                  padding: "0 12px",
                  fontSize: "0.74rem",
                  color: warmTheme.colors.muted,
                }}
              >
                הצג
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              borderRadius: 9,
              border: `1px solid ${withAlpha(warmTheme.colors.success, "88")}`,
              background: withAlpha(warmTheme.colors.success, "22"),
              padding: "9px 10px",
              color: "#d9f0c8",
              fontWeight: 700,
              fontSize: "0.8rem",
            }}
          >
            {answerState === "correct" ? "נכון! " : ""}
            {todayRiddle.answer}
          </div>
        )}

        <div
          style={{
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: warmTheme.colors.muted,
            fontSize: "0.68rem",
          }}
        >
          <span>{solvedToday ? "נפתר היום" : "נסה לפתור"}</span>
          <span style={{ color: warmTheme.colors.info, display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Trophy size={11} /> {streak}
          </span>
        </div>
      </div>
    </aside>
  );
}
