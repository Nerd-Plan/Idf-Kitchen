const EASY_COUNT = 1000;
const MEDIUM_COUNT = 1000;
const HARD_COUNT = 1000;

const NAMES = [
  "יואב",
  "נועה",
  "דניאל",
  "מאיה",
  "עידו",
  "רותם",
  "איתי",
  "ליה",
  "רון",
  "נוגה",
];

const ITEMS = ["תפוחים", "עוגיות", "מחברות", "כוסות", "קלפים", "גולות", "כדורים", "עטים"];

const EASY_WORD_RIDDLES = [
  { q: "מה נשבר בלי שנוגעים בו?", a: "שקט" },
  { q: "מה עולה למעלה אבל אף פעם לא יורד?", a: "הגיל" },
  { q: "מה תמיד לפניך אבל אי אפשר לראות?", a: "המחר" },
  { q: "מה נהיה רטוב בזמן שהוא מייבש?", a: "מגבת" },
  { q: "מה מלא חורים ועדיין מחזיק מים?", a: "ספוג" },
  { q: "מה יש לו טבעת אבל אין לו אצבע?", a: "טלפון" },
  { q: "מה מתחיל ב-פ ונגמר ב-ה ובתוכו יש המון אותיות?", a: "פתיחה" },
  { q: "מה אפשר לתפוס אבל אי אפשר לזרוק?", a: "הצטננות" },
];

function createRng(seed) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 48271) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function randInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function seedFrom(difficulty, index) {
  let hash = 2166136261;
  const text = `${difficulty}-${index}`;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function formatTime(totalMinutes) {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

function factorial(n) {
  let out = 1;
  for (let i = 2; i <= n; i += 1) out *= i;
  return out;
}

function combinations(n, k) {
  const kk = Math.min(k, n - k);
  let num = 1;
  let den = 1;
  for (let i = 1; i <= kk; i += 1) {
    num *= n - (kk - i);
    den *= i;
  }
  return Math.round(num / den);
}

function toPrettyNumber(value) {
  const fixed = Number(value).toFixed(2);
  return fixed.endsWith(".00") ? fixed.slice(0, -3) : fixed;
}

function makeEasyRiddle(index) {
  const rng = createRng(seedFrom("easy", index));
  const type = index % 6;

  if (type === 0) {
    const name = NAMES[randInt(rng, 0, NAMES.length - 1)];
    const item = ITEMS[randInt(rng, 0, ITEMS.length - 1)];
    const start = randInt(rng, 8, 40);
    const add = randInt(rng, 3, 15);
    const remove = randInt(rng, 2, Math.max(2, start + add - 1));
    const answer = start + add - remove;
    return {
      id: `easy-${index}`,
      difficulty: "easy",
      question: `ל${name} היו ${start} ${item}. הוא קיבל עוד ${add} ואז נתן ${remove}. כמה נשארו?`,
      answer: String(answer),
      hint: "חיבור ואז חיסור.",
    };
  }

  if (type === 1) {
    const hour = randInt(rng, 0, 23);
    const minute = [0, 10, 20, 30, 40, 50][randInt(rng, 0, 5)];
    const plus = randInt(rng, 15, 210);
    const answer = formatTime(hour * 60 + minute + plus);
    return {
      id: `easy-${index}`,
      difficulty: "easy",
      question: `השעה כעת ${pad2(hour)}:${pad2(minute)}. מה תהיה השעה בעוד ${plus} דקות?`,
      answer,
      hint: "ממירים דקות לשעות.",
    };
  }

  if (type === 2) {
    const avg = randInt(rng, 15, 65);
    const a = randInt(rng, 5, 90);
    const b = randInt(rng, 5, 90);
    const c = avg * 3 - a - b;
    const validC = c < 1 ? c + 30 : c;
    const answer = (a + b + validC) / 3;
    return {
      id: `easy-${index}`,
      difficulty: "easy",
      question: `מה הממוצע של המספרים ${a}, ${b}, ${validC}?`,
      answer: String(answer),
      hint: "מחברים הכל ומחלקים ב-3.",
    };
  }

  if (type === 3) {
    const w = randInt(rng, 3, 18);
    const h = randInt(rng, 3, 18);
    const perimeter = 2 * (w + h);
    return {
      id: `easy-${index}`,
      difficulty: "easy",
      question: `למלבן יש אורך ${w} ורוחב ${h}. מה ההיקף שלו?`,
      answer: String(perimeter),
      hint: "2 כפול סכום האורך והרוחב.",
    };
  }

  if (type === 4) {
    const start = randInt(rng, 2, 30);
    const diff = randInt(rng, 2, 12);
    const t2 = start + diff;
    const t3 = t2 + diff;
    const t4 = t3 + diff;
    const next = t4 + diff;
    return {
      id: `easy-${index}`,
      difficulty: "easy",
      question: `מה המספר הבא בסדרה: ${start}, ${t2}, ${t3}, ${t4}, ?`,
      answer: String(next),
      hint: "ההפרש קבוע.",
    };
  }

  const wordRiddle = EASY_WORD_RIDDLES[index % EASY_WORD_RIDDLES.length];
  return {
    id: `easy-${index}`,
    difficulty: "easy",
    question: wordRiddle.q,
    answer: wordRiddle.a,
    hint: "חשבו על משהו יומיומי.",
  };
}

function makeMediumRiddle(index) {
  const rng = createRng(seedFrom("medium", index));
  const type = index % 6;

  if (type === 0) {
    const a = randInt(rng, 2, 15);
    const d = randInt(rng, 2, 8);
    const inc = randInt(rng, 1, 4);
    const t1 = a;
    const t2 = a + d;
    const t3 = t2 + d + inc;
    const t4 = t3 + d + 2 * inc;
    const next = t4 + d + 3 * inc;
    return {
      id: `medium-${index}`,
      difficulty: "medium",
      question: `מה האיבר הבא בסדרה: ${t1}, ${t2}, ${t3}, ${t4}, ?`,
      answer: String(next),
      hint: "גם ההפרש בין האיברים משתנה בקצב קבוע.",
    };
  }

  if (type === 1) {
    const childNow = randInt(rng, 8, 20);
    const years = randInt(rng, 4, 12);
    const extra = randInt(rng, 0, 10);
    const parentAfter = (childNow + years) * 2 + extra;
    const parentNow = parentAfter - years;
    return {
      id: `medium-${index}`,
      difficulty: "medium",
      question: `ילד בן ${childNow}. בעוד ${years} שנים, גיל ההורה יהיה פי 2 מגיל הילד ועוד ${extra}. בן כמה ההורה היום?`,
      answer: String(parentNow),
      hint: "קודם מוצאים גיל הורה בעתיד ואז חוזרים אחורה.",
    };
  }

  if (type === 2) {
    const price = randInt(rng, 120, 900);
    const d1 = randInt(rng, 10, 35);
    const d2 = randInt(rng, 5, 25);
    const afterFirst = price * (1 - d1 / 100);
    const final = afterFirst * (1 - d2 / 100);
    return {
      id: `medium-${index}`,
      difficulty: "medium",
      question: `מחיר מוצר הוא ${price} ש"ח. הייתה הנחה של ${d1}% ואז הנחה נוספת של ${d2}%. מה המחיר הסופי?`,
      answer: `${toPrettyNumber(final)} ש"ח`,
      hint: "הנחה שנייה מחושבת על המחיר אחרי ההנחה הראשונה.",
    };
  }

  if (type === 3) {
    const distance = randInt(rng, 90, 480);
    const speed = randInt(rng, 45, 120);
    const time = distance / speed;
    return {
      id: `medium-${index}`,
      difficulty: "medium",
      question: `רכב נוסע מרחק של ${distance} ק"מ במהירות קבועה של ${speed} קמ"ש. כמה זמן תימשך הנסיעה?`,
      answer: `${toPrettyNumber(time)} שעות`,
      hint: "זמן = מרחק / מהירות.",
    };
  }

  if (type === 4) {
    const total = randInt(rng, 40, 180);
    const red = randInt(rng, 10, total - 20);
    const blue = randInt(rng, 10, total - red - 5);
    const green = total - red - blue;
    const asked = ["אדום", "כחול", "ירוק"][randInt(rng, 0, 2)];
    const answer = asked === "אדום" ? red : asked === "כחול" ? blue : green;
    return {
      id: `medium-${index}`,
      difficulty: "medium",
      question: `בקופסה יש ${total} כדורים: ${red} אדומים, ${blue} כחולים והשאר ירוקים. כמה כדורים ${asked} יש?`,
      answer: String(answer),
      hint: "מחשבים מהו 'השאר' לפי סך הכל.",
    };
  }

  const x = randInt(rng, 3, 14);
  const y = randInt(rng, 4, 16);
  const z = 3 * x + 2 * y;
  return {
    id: `medium-${index}`,
    difficulty: "medium",
    question: `אם x=${x} ו-y=${y}, מה הערך של 3x + 2y?`,
    answer: String(z),
    hint: "מציבים ערכים ומחשבים.",
  };
}

function pickCoprimePair(rng) {
  const numbers = [7, 8, 9, 11, 13, 15, 16, 17];
  let a = numbers[randInt(rng, 0, numbers.length - 1)];
  let b = numbers[randInt(rng, 0, numbers.length - 1)];
  while (a === b || gcd(a, b) !== 1) {
    a = numbers[randInt(rng, 0, numbers.length - 1)];
    b = numbers[randInt(rng, 0, numbers.length - 1)];
  }
  return [a, b];
}

function makeHardRiddle(index) {
  const rng = createRng(seedFrom("hard", index));
  const type = index % 6;

  if (type === 0) {
    const [a, b] = pickCoprimePair(rng);
    const mod = lcm(a, b);
    const x = randInt(rng, 1, mod);
    const r1 = x % a;
    const r2 = x % b;
    return {
      id: `hard-${index}`,
      difficulty: "hard",
      question: `מצא את x החיובי הקטן ביותר כך ש-x ≡ ${r1} (mod ${a}) וגם x ≡ ${r2} (mod ${b}).`,
      answer: String(x),
      hint: "מחפשים מספר שמתאים לשתי שאריות יחד.",
    };
  }

  if (type === 1) {
    const n = randInt(rng, 9, 16);
    const k = randInt(rng, 3, Math.min(7, n - 2));
    return {
      id: `hard-${index}`,
      difficulty: "hard",
      question: `בכמה דרכים אפשר לבחור ${k} אנשים מתוך ${n} אנשים?`,
      answer: String(combinations(n, k)),
      hint: "נוסחת צירופים C(n,k).",
    };
  }

  if (type === 2) {
    const a = randInt(rng, 2, 4);
    const b = randInt(rng, 2, 4);
    const c = randInt(rng, 2, 4);
    const n = a + b + c;
    const arrangements = factorial(n) / (factorial(a) * factorial(b) * factorial(c));
    return {
      id: `hard-${index}`,
      difficulty: "hard",
      question: `כמה סידורים שונים יש למילה עם ${a} אותיות זהות מסוג א', ${b} אותיות זהות מסוג ב' ו-${c} אותיות זהות מסוג ג'?`,
      answer: String(arrangements),
      hint: "סידורים עם חזרות: n!/(a!b!c!).",
    };
  }

  if (type === 3) {
    const tens = randInt(rng, 2, 9);
    const ones = randInt(rng, 0, tens - 1);
    const sum = tens + ones;
    const diff = tens - ones;
    const number = tens * 10 + ones;
    return {
      id: `hard-${index}`,
      difficulty: "hard",
      question: `אני מספר דו-ספרתי. סכום הספרות שלי הוא ${sum} וההפרש (עשרות פחות יחידות) הוא ${diff}. מה המספר?`,
      answer: String(number),
      hint: "פותרים מערכת של שתי משוואות.",
    };
  }

  if (type === 4) {
    const colors = randInt(rng, 3, 6);
    const answer = colors + 1;
    return {
      id: `hard-${index}`,
      difficulty: "hard",
      question: `במגירה יש גרביים ב-${colors} צבעים שונים. מה המספר המינימלי שצריך לשלוף בעיניים עצומות כדי להבטיח זוג באותו צבע?`,
      answer: String(answer),
      hint: "עקרון שובך היונים.",
    };
  }

  const base = randInt(rng, 2, 12);
  const power = randInt(rng, 4, 11);
  const mod = [7, 9, 11, 13][randInt(rng, 0, 3)];
  let result = 1;
  for (let i = 0; i < power; i += 1) {
    result = (result * base) % mod;
  }
  return {
    id: `hard-${index}`,
    difficulty: "hard",
    question: `מה השארית של ${base}^${power} בחלוקה ל-${mod}?`,
    answer: String(result),
    hint: "אפשר לחשב מודולו בכל כפל.",
  };
}

function buildRiddleBank() {
  const easy = Array.from({ length: EASY_COUNT }, (_, i) => makeEasyRiddle(i + 1));
  const medium = Array.from({ length: MEDIUM_COUNT }, (_, i) => makeMediumRiddle(i + 1));
  const hard = Array.from({ length: HARD_COUNT }, (_, i) => makeHardRiddle(i + 1));
  return [...easy, ...medium, ...hard];
}

export const RIDDLE_BANK = Object.freeze(buildRiddleBank());
export const RIDDLE_BANK_SIZE = RIDDLE_BANK.length;

const BY_DIFFICULTY = {
  easy: RIDDLE_BANK.filter((riddle) => riddle.difficulty === "easy"),
  medium: RIDDLE_BANK.filter((riddle) => riddle.difficulty === "medium"),
  hard: RIDDLE_BANK.filter((riddle) => riddle.difficulty === "hard"),
};

const DIFFICULTY_CYCLE = ["easy", "medium", "hard"];

export const DIFFICULTY_META = {
  easy: { label: "קל", color: "#8ac76b" },
  medium: { label: "בינוני", color: "#f2c078" },
  hard: { label: "קשה מאוד", color: "#f48f63" },
};

export function getLocalDateKey(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${year}-${month}-${day}`;
}

function dayNumberFromKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map((value) => Number.parseInt(value, 10));
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}

function positiveMod(value, size) {
  return ((value % size) + size) % size;
}

export function getDailyRiddle(date = new Date()) {
  const dateKey = typeof date === "string" ? date : getLocalDateKey(date);
  const dayNumber = dayNumberFromKey(dateKey);
  const difficultyIndex = positiveMod(dayNumber, DIFFICULTY_CYCLE.length);
  const difficulty = DIFFICULTY_CYCLE[difficultyIndex];
  const pool = BY_DIFFICULTY[difficulty];
  const rotation = Math.floor(dayNumber / DIFFICULTY_CYCLE.length);
  const index = positiveMod(rotation, pool.length);
  return pool[index];
}
