// מועדון הערב – הגדרות המשחקים: תמחור, בדיקת קלט, פרומפטים ובדיקת תוצאות ה־AI.
// המחיר נקבע תמיד כאן בשרת, אף פעם לא לפי מה שהדפדפן שולח.

const str = (v, max) => String(v ?? '').trim().slice(0, max);
const int = (v, lo, hi) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n >= lo && n <= hi ? n : null;
};

export class InputError extends Error {}

/** בודק ומנקה את ההגדרות שהמארח שלח. זורק InputError עם הודעה בעברית. */
export function cleanConfig(game, c = {}) {
  if (game === 'murder') {
    const topic = str(c.topic, 120);
    if (!topic) throw new InputError('כתבו נושא לערב.');
    const mode = c.mode === 'teams' ? 'teams' : 'small';
    if (mode === 'small') {
      const names = (Array.isArray(c.names) ? c.names : String(c.names || '').split('\n'))
        .map((s) => str(s, 30)).filter(Boolean);
      if (names.length < 4 || names.length > 8) throw new InputError('בערב חברים צריך בין 4 ל־8 משתתפים.');
      return { topic, mode, names, live: false };
    }
    const people = int(c.people, 9, 100);
    const teams = int(c.teams, 3, 10);
    if (people == null) throw new InputError('בגיבוש צריך בין 9 ל־100 משתתפים.');
    if (teams == null) throw new InputError('בחרו בין 3 ל־10 קבוצות.');
    if (people / teams < 2) throw new InputError('צריך לפחות 2 אנשים בכל קבוצה.');
    return { topic, mode, people, teams, live: !!c.live };
  }
  if (game === 'trivia') {
    const topic = str(c.topic, 120);
    if (!topic) throw new InputError('כתבו נושא לחידון.');
    const teams = int(c.teams, 2, 20);
    if (teams == null) throw new InputError('בחרו בין 2 ל־20 קבוצות.');
    const count = [8, 10, 15].includes(Number(c.count)) ? Number(c.count) : 10;
    const level = ['קלה', 'בינונית', 'קשה'].includes(c.level) ? c.level : 'בינונית';
    return { topic, teams, count, level, live: !!c.live };
  }
  if (game === 'song') {
    const name = str(c.name, 30);
    if (!name) throw new InputError('כתבו את שם החוגג/ת.');
    const styles = ['פופ שמח', 'ראפ', 'בלדה מרגשת', 'מזרחית קצבית', 'שיר ילדים'];
    return {
      name, age: str(c.age, 10), hobbies: str(c.hobbies, 200), jokes: str(c.jokes, 600),
      style: styles.includes(c.style) ? c.style : 'פופ שמח',
    };
  }
  if (game === 'escape') {
    const topic = str(c.topic, 120);
    if (!topic) throw new InputError('כתבו עולם למשחק.');
    const audience = ['ילדים 8–12', 'נוער', 'מבוגרים'].includes(c.audience) ? c.audience : 'מבוגרים';
    const mode = c.mode === 'teams' ? 'teams' : 'small';
    if (mode === 'small') return { topic, audience, mode, live: false };
    const people = int(c.people, 9, 100);
    const teams = int(c.teams, 2, 20);
    if (people == null || teams == null) throw new InputError('בגיבוש: 9 עד 100 משתתפים ו־2 עד 20 קבוצות.');
    return { topic, audience, mode, people, teams, live: !!c.live };
  }
  throw new InputError('משחק לא מוכר.');
}

export function priceOf(game, c) {
  if (game === 'murder') {
    if (c.mode === 'small') return { price: 49, tier: 'חברים, עד 8 משתתפים' };
    if (c.people <= 30) return { price: 290, tier: 'גיבוש, עד 30 משתתפים' };
    if (c.people <= 60) return { price: 490, tier: 'גיבוש, עד 60 משתתפים' };
    return { price: 690, tier: 'גיבוש, עד 100 משתתפים' };
  }
  if (game === 'trivia') return c.teams <= 6 ? { price: 39, tier: 'ערב פרטי, עד 6 קבוצות' } : { price: 149, tier: 'אירוע, עד 20 קבוצות' };
  if (game === 'song') return { price: 39, tier: 'שיר אחד, כולל 2 גרסאות נוספות' };
  if (game === 'escape') {
    if (c.mode === 'small') return { price: 69, tier: 'משפחה וחברים, עד 8' };
    if (c.people <= 40) return { price: 249, tier: 'גיבוש, עד 40 משתתפים' };
    return { price: 490, tier: 'גיבוש, עד 100 משתתפים' };
  }
  throw new InputError('משחק לא מוכר.');
}

/** כמה דמויות/קבוצות יש במשחק רצח */
export const murderUnits = (c) => (c.mode === 'small' ? c.names.length : c.teams);

/** הפרומפט לכל משחק. הפלט: { prompt, json: true/false } */
export function promptFor(game, c) {
  if (game === 'murder') {
    const n = murderUnits(c), teams = c.mode === 'teams';
    return { json: true, prompt: `צור משחק תעלומת רצח לערב חברתי, בעברית בלבד.
נושא ותפאורה: ${c.topic}
מספר הדמויות החשודות: בדיוק ${n}.${teams ? ` כל דמות תשוחק על ידי קבוצה של כ־${Math.round(c.people / n)} אנשים בערב גיבוש של חברה, לכן שמור על תוכן נקי ומתאים לעבודה.` : ''}
דרישות:
- דמות אחת בדיוק היא הרוצח (killer: true). לכל שאר הדמויות יש סוד שנותן להן מניע אפשרי, כדי שכולן ייראו חשודות.
- הרמזים הוגנים ומובילים בהדרגה לרוצח: סבב 1 כללי, סבב 2 מצמצם, סבב 3 מכריע.
- שמות בדויים בלבד, בלי אנשים אמיתיים. בלי אלימות גרפית.
- secret ו־goal כתובים בגוף שני, פונים לשחקן.
- task היא משימה קצרה ומשעשעת לביצוע מול כולם (עד 60 שניות).
החזר JSON בלבד במבנה:
{"title":"","setting":"","intro":"2-3 משפטים","chars":[{"name":"","role":"","look":"","secret":"","goal":"","task":"","killer":false}],"rounds":[["רמז","רמז"],["רמז","רמז"],["רמז","רמז"]],"solution":"2-3 משפטים שמסבירים מי ואיך, ומקשרים לרמזים"}` };
  }
  if (game === 'trivia') {
    return { json: true, prompt: `כתוב ${c.count} שאלות טריוויה אמריקאיות בעברית על הנושא: ${c.topic}. רמת קושי: ${c.level}.
כל שאלה עם 4 תשובות, אחת נכונה. ודא שהעובדות מדויקות ושאין עמימות. גוון את מיקום התשובה הנכונה. תוכן נקי שמתאים גם לאירוע חברה.
החזר JSON בלבד: [{"q":"","options":["","","",""],"answer":0,"fact":"עובדה מעניינת קצרה"}] כאשר answer הוא אינדקס התשובה הנכונה (0-3).` };
  }
  if (game === 'song') {
    return { json: false, prompt: `כתוב שיר יום הולדת מקורי לגמרי בעברית, בסגנון ${c.style}.
החוגג/ת: ${c.name}, גיל ${c.age || 'לא צוין'}.
אוהב/ת: ${c.hobbies || 'לא צוין'}.
בדיחות פנימיות והרגלים:
${c.jokes || 'אין'}
השתמש בבדיחות בצורה חמה ומצחיקה, בלי להעליב. מבנה: שם השיר בשורה הראשונה, אחר כך בית 1, פזמון, בית 2, פזמון. חרוזים טבעיים, שורות קצרות שקל לשיר. אל תצטט שירים קיימים. החזר רק את השיר, בלי הסברים.` };
  }
  if (game === 'escape') {
    return { json: true, prompt: `צור משחק חדר בריחה טקסטואלי בעברית. עולם: ${c.topic}. קהל: ${c.audience}.
5 חידות שנפתרות בראש או על דף, בלי צורך בחפצים. רמת קושי עולה. כל תשובה היא מילה אחת או מספר בלבד, חד־משמעית. החידות חייבות להיות פתירות והוגנות, ובדוק שהתשובה באמת נכונה.
alts הם כתיבים חלופיים מקובלים לאותה תשובה. hint הוא רמז שמקרב בלי לגלות.
החזר JSON בלבד: {"title":"","intro":"2 משפטים","puzzles":[{"title":"","riddle":"","hint":"","answer":"","alts":[]}],"outro":"משפט סיום"}` };
  }
  throw new InputError('משחק לא מוכר.');
}

const s = (v, max = 600) => String(v ?? '').slice(0, max);

/** בודק ומנרמל את מה שה־AI החזיר. מחזיר null אם המבנה לא תקין. */
export function validate(game, c, out) {
  if (game === 'song') {
    const text = s(out, 4000).trim();
    return text.length > 40 ? { text } : null;
  }
  if (game === 'murder') {
    const n = murderUnits(c);
    if (!out || !Array.isArray(out.chars) || out.chars.length < n || !Array.isArray(out.rounds) || out.rounds.length < 3) return null;
    const chars = out.chars.slice(0, n).map((x) => ({
      name: s(x?.name, 60), role: s(x?.role, 80), look: s(x?.look, 120), secret: s(x?.secret), goal: s(x?.goal, 300),
      task: s(x?.task, 300), killer: x?.killer === true,
    }));
    if (chars.filter((x) => x.killer).length !== 1 || chars.some((x) => !x.name || !x.secret)) return null;
    const rounds = out.rounds.slice(0, 3).map((r) => (Array.isArray(r) ? r : [r]).slice(0, 4).map((t) => s(t, 400)).filter(Boolean));
    if (rounds.some((r) => !r.length)) return null;
    return { title: s(out.title, 120), setting: s(out.setting, 120), intro: s(out.intro, 800), chars, rounds, solution: s(out.solution, 1200) };
  }
  if (game === 'trivia') {
    const qs = (Array.isArray(out) ? out : []).filter((x) => x && x.q && Array.isArray(x.options) && x.options.length === 4 && Number.isInteger(x.answer) && x.answer >= 0 && x.answer < 4)
      .slice(0, 15).map((x) => ({ q: s(x.q, 300), options: x.options.map((o) => s(o, 120)), answer: x.answer, fact: s(x.fact, 300) }));
    return qs.length >= 3 ? qs : null;
  }
  if (game === 'escape') {
    const ps = (out && Array.isArray(out.puzzles) ? out.puzzles : []).filter((p) => p && p.riddle && p.answer != null)
      .slice(0, 8).map((p) => ({ title: s(p.title, 120), riddle: s(p.riddle, 800), hint: s(p.hint, 400), answer: s(p.answer, 60), alts: (Array.isArray(p.alts) ? p.alts : []).slice(0, 6).map((a) => s(a, 60)) }));
    if (ps.length < 3) return null;
    return { title: s(out.title, 120), intro: s(out.intro, 600), puzzles: ps, outro: s(out.outro, 400) };
  }
  return null;
}

/** מחלץ ערך JSON מתשובת טקסט (כולל בלוק קוד או משפט לפני/אחרי). */
export function extractJSON(text) {
  const t = String(text || '').trim();
  try { return JSON.parse(t); } catch {}
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) { try { return JSON.parse(fence[1]); } catch {} }
  const a = t.search(/[[{]/), b = Math.max(t.lastIndexOf('}'), t.lastIndexOf(']'));
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch {} }
  return null;
}

/** כרטיסייה ומנוי עסקים */
export const PASSES = {
  punch: { price: 199, tier: 'כרטיסייה: 5 משחקים פרטיים', count: 5, days: 365 },
  sub: { price: 249, tier: 'מנוי עסקים לחודש: טריוויה וחדר בריחה ללא הגבלה', days: 30 },
};
/** כרטיסייה מכסה כל משחק במסלול הפרטי (עד 69 ₪) */
export const punchCovers = (game, cfg) => priceOf(game, cfg).price <= 69;
/** מנוי עסקים מכסה טריוויה וחדר בריחה בכל גודל */
export const subCovers = (game) => game === 'trivia' || game === 'escape';
