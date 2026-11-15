// HaniaRace data: the vehicles and the tracks.
// Vehicles: 3D models from Kenney's Car Kit (CC0, kenney.nl). Each type has its own numbers, close to real cars of
// that kind: top speed (km/h), 0 to 100 (seconds), mass (kg), tyre grip, and how it copes off the road.
var CARS = [
  { id: "race", n: "פורמולה", cls: "מרוץ", top: 300, acc: 2.6, m: 720, grip: 1.25, df: 1.4, off: 0.35, star: 18 },
  { id: "race-future", n: "אב־טיפוס חשמלי", cls: "מרוץ", top: 320, acc: 2.2, m: 900, grip: 1.2, df: 1.2, off: 0.4, star: 30 },
  { id: "sedan-sports", n: "קופה ספורט", cls: "ספורט", top: 270, acc: 3.9, m: 1450, grip: 1.06, df: 0.4, off: 0.5, star: 6 },
  { id: "hatchback-sports", n: "האצ׳בק חם", cls: "ספורט", top: 245, acc: 5.8, m: 1250, grip: 1.02, df: 0.2, off: 0.55, star: 0 },
  { id: "suv-luxury", n: "שטח יוקרתי", cls: "שטח", top: 250, acc: 4.6, m: 2200, grip: 0.95, df: 0.1, off: 0.85, star: 12 },
  { id: "police", n: "ניידת", cls: "חירום", top: 240, acc: 6.2, m: 1700, grip: 0.97, df: 0.1, off: 0.6, star: 3, siren: 1 },
  { id: "sedan", n: "סדאן משפחתית", cls: "כביש", top: 200, acc: 9.5, m: 1400, grip: 0.9, df: 0, off: 0.5, star: 0 },
  { id: "taxi", n: "מונית", cls: "כביש", top: 195, acc: 10.5, m: 1450, grip: 0.9, df: 0, off: 0.5, star: 0 },
  { id: "suv", n: "ג׳יפ שטח", cls: "שטח", top: 185, acc: 9.8, m: 1900, grip: 0.88, df: 0, off: 0.95, star: 0 },
  { id: "truck", n: "טנדר", cls: "שטח", top: 180, acc: 10.5, m: 2100, grip: 0.86, df: 0, off: 0.9, star: 2 },
  { id: "van", n: "מסחרית", cls: "עבודה", top: 170, acc: 12.5, m: 2000, grip: 0.83, df: 0, off: 0.55, star: 0 },
  { id: "truck-flat", n: "טנדר משטח", cls: "עבודה", top: 175, acc: 11.5, m: 2200, grip: 0.84, df: 0, off: 0.85, star: 4 },
  { id: "ambulance", n: "אמבולנס", cls: "חירום", top: 165, acc: 12, m: 3500, grip: 0.82, df: 0, off: 0.6, star: 5, siren: 1 },
  { id: "delivery", n: "משאית חלוקה", cls: "עבודה", top: 140, acc: 16, m: 5500, grip: 0.78, df: 0, off: 0.6, star: 8 },
  { id: "firetruck", n: "כבאית", cls: "חירום", top: 130, acc: 18, m: 12000, grip: 0.75, df: 0, off: 0.7, star: 10, siren: 1 },
  { id: "garbage-truck", n: "משאית זבל", cls: "עבודה", top: 115, acc: 22, m: 16000, grip: 0.72, df: 0, off: 0.65, star: 14 },
  { id: "tractor", n: "טרקטור", cls: "שטח", top: 55, acc: 9, m: 3000, grip: 0.85, df: 0, off: 1, star: 1 },
];
var CAR_BY = {}; CARS.forEach(function (c) { CAR_BY[c.id] = c; });

// Tracks: a closed loop r(θ) = R·(1 + Σ a·sin(kθ + φ)), stretched on x, so it never crosses itself.
// The theme decides the ground, sky, scenery and grip.
var TRACKS = [
  { id: "circuit", n: "מעגל המרוצים", d: "מסלול מרוצים קלאסי: עקומות מהירות, שוליים אדומים־לבנים וטריבונות", R: 300, sx: 1.45, w: 14, laps: 3,
    h: [[0.22, 3, 0.3], [0.12, 5, 1.7], [0.08, 2, 4.0]], theme: "circuit" },
  { id: "coast", n: "כביש החוף", d: "שקיעה לאורך הים, דקלים וחול", R: 380, sx: 1.8, w: 13, laps: 3,
    h: [[0.18, 2, 1.0], [0.14, 4, 0.2], [0.06, 7, 2.2]], theme: "coast" },
  { id: "desert", n: "מכתש רמון", d: "מדבר, סלעים וצוקים כתומים. עקומות חדות", R: 330, sx: 1.3, w: 13, laps: 3,
    h: [[0.25, 3, 2.4], [0.15, 6, 0.9], [0.07, 4, 3.1]], theme: "desert" },
  { id: "city", n: "תל אביב בלילה", d: "רחובות מוארים בין מגדלים, ניאון ופנסים", R: 300, sx: 1.6, w: 15, laps: 3,
    h: [[0.16, 4, 0.0], [0.12, 2, 2.0], [0.1, 6, 1.1]], theme: "city" },
  { id: "snow", n: "חרמון בשלג", d: "שלג, אורנים ופחות אחיזה. זהירות בעקומות!", R: 280, sx: 1.35, w: 13, laps: 3,
    h: [[0.2, 3, 1.4], [0.16, 5, 0.4], [0.05, 8, 2.6]], theme: "snow" },
];
var THEMES = {
  circuit: { sky: ["#5EA8F0", "#CFE7FF"], fog: "#CFE3F5", ground: "#5E9E3A", ground2: "#4E8A30", road: "#3A3D44", sun: 1.25, amb: 0.75, grip: 1, night: 0, scen: ["tree", "stand", "tires"] },
  coast: { sky: ["#F49A5B", "#FFD6A0"], fog: "#F5C99A", ground: "#E3C98F", ground2: "#D7BA7A", road: "#45474E", sun: 1.0, amb: 0.8, grip: 1, night: 0, sea: 1, scen: ["palm", "palm", "rock"], warm: 1 },
  desert: { sky: ["#7DB7E8", "#F1DDBB"], fog: "#EAD3AE", ground: "#D2954F", ground2: "#C1803E", road: "#4A4038", sun: 1.35, amb: 0.7, grip: 0.97, night: 0, scen: ["rock", "rock", "bush", "mesa"] },
  city: { sky: ["#05081A", "#1B2350"], fog: "#141A38", ground: "#2A2C33", ground2: "#25272D", road: "#2E3036", sun: 0.25, amb: 0.42, grip: 1, night: 1, scen: ["tower", "tower", "lamp"] },
  snow: { sky: ["#9FB6CC", "#E6EEF5"], fog: "#DCE6EF", ground: "#F2F6FA", ground2: "#E2EAF2", road: "#4B5057", sun: 0.95, amb: 0.95, grip: 0.8, night: 0, scen: ["pine", "pine", "rock"], snow: 1 },
};
var DIFF = { 1: ["קל", 0.84], 2: ["רגיל", 0.92], 3: ["קשה", 0.985] };
