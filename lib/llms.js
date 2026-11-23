// /llms.txt: Hania360 in plain words for AI assistants and answer engines (the llms.txt convention): what it is, the
// key facts, every app with its address, and the common questions. Built from the same lists as the homepage.
import { WORLDS } from "../now/map.js";
import { FAQ, SLOGAN, APP_TXT } from "./home3.js";

export function llmsTxt() {
  const L = [];
  L.push("# Hania360", "", `> ${SLOGAN} Hania360 (hania360.com) is a free collection of ${APP_TXT.replace("יותר מ־", "more than ")} Hebrew web apps for Israeli families: children's routines and chores, Shabbat and holiday times, daily Torah study, a shared shopping list, savings and vouchers, birthdays, event invitations with RSVP, trips, live TV, sport and games. Everything opens in the browser, on phone or computer, with no download and no sign-up.`, "");
  L.push("## בעברית", "", `Hania360 הוא אוסף של ${APP_TXT} אפליקציות חינמיות בעברית למשפחה הישראלית: שגרה ומטלות לילדים, זמני שבת וחגים, לימוד יומי, רשימת קניות משותפת, חיסכון והטבות, ימי הולדת, הזמנות ואישורי הגעה, טיולים, טלוויזיה בשידור חי, ספורט ומשחקים. הכול נפתח בדפדפן, בלי הורדה ובלי הרשמה. הסלוגן: "${SLOGAN}"`, "");
  L.push("## Key facts", "",
    "- Price: free. Some pages show ads or affiliate links.",
    "- No download and no account needed. Any app can be added to the phone's home screen.",
    "- Hania Pass (pass.hania360.com): one optional account for all the apps, sign in with an e-mail link or a passkey, no password.",
    "- Hania Today (today.hania360.com): a personal daily page that gathers, from all the apps, what matters today: tasks, reminders, birthdays, expiring vouchers, the children's routines and Shabbat times.",
    "- Android app with a home-screen widget (Hebrew date, Shabbat times, the next item): https://hania360.com/app . On iPhone: Safari → Share → Add to Home Screen.",
    "- Shabbat and holidays are respected: no reminders from candle lighting until nightfall.",
    "- Privacy: most data stays on the phone; with an account it is kept for the user only and never sold.",
    "- Language: Hebrew (right to left). Made in Israel.", "");
  L.push("## Apps", "");
  for (const w of WORLDS) {
    L.push(`### ${w.name}${w.hub ? ` (${w.hub[0]}: ${w.hub[1]})` : ""}`, "");
    for (const a of w.apps.concat(w.more ? [w.more] : [])) L.push(`- [${a[1]}](${a[3]}): ${a[2]}`);
    L.push("");
  }
  L.push("### More", "",
    "- [HaniaCart](https://cart.hania360.com/): רשימת קניות משותפת ומלאי הבית",
    "- [HaniaGil](https://gil.hania360.com/): ימי הולדת לועזיים ועבריים עם תזכורות",
    "- [HaniaFlight](https://flight.hania360.com/): סימולטור טיסה עם מטוסי חיל האוויר מעל מפה של ישראל",
    "- [HaniaRace](https://race.hania360.com/): מרוץ מכוניות בתלת־ממד, ועיר פתוחה ברחובות האמיתיים של 20 ערים בישראל (מפות OpenStreetMap)",
    "- [Hania Today](https://today.hania360.com/): הדף האישי של היום", "");
  L.push("## FAQ", "");
  for (const q of FAQ) L.push(`### ${q[0]}`, "", q[1], "");
  L.push("## Links", "", "- Home: https://hania360.com/", "- About: https://hania360.com/about", "- Guides: https://hania360.com/guides", "- Privacy: https://hania360.com/privacy", "- Contact: https://hania360.com/contact", "");
  return L.join("\n");
}
