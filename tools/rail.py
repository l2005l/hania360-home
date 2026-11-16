# Daily rail timetable for Hania (the AI assistant): from the Ministry of Transport's open GTFS (all public transport),
# keep only Israel Railways, for the next 30 days, in one small JSON:
#   {"at": "...", "stations": {"id": "name"}, "days": {"YYYY-MM-DD": [trip index, ...]}, "trips": [[[station id, minutes], ...], ...]}
# minutes = minutes after midnight of the service day (may pass 1440 after midnight). Run by .github/workflows/rail.yml.
import csv, io, json, sys, zipfile, datetime
z = zipfile.ZipFile(sys.argv[1]); out = sys.argv[2]
def rows(name):
    with z.open(name) as f:
        yield from csv.DictReader(io.TextIOWrapper(f, encoding="utf-8-sig"))
agencies = {r["agency_id"]: r["agency_name"] for r in rows("agency.txt")}
rail = {a for a, n in agencies.items() if "רכבת ישראל" in n or "Israel Railways" in n}
print("rail agencies", rail, file=sys.stderr)
routes = {r["route_id"] for r in rows("routes.txt") if r["agency_id"] in rail}
trips = {r["trip_id"]: r["service_id"] for r in rows("trips.txt") if r["route_id"] in routes}
print("routes", len(routes), "trips", len(trips), file=sys.stderr)
stops_used, st = set(), {}
for r in rows("stop_times.txt"):
    t = r["trip_id"]
    if t not in trips: continue
    h, m, _ = (r["departure_time"] or r["arrival_time"]).split(":")
    st.setdefault(t, []).append((int(r["stop_sequence"]), r["stop_id"], int(h) * 60 + int(m)))
    stops_used.add(r["stop_id"])
names = {r["stop_id"]: r["stop_name"] for r in rows("stops.txt") if r["stop_id"] in stops_used}
today = datetime.date.today()
days = [today + datetime.timedelta(days=i) for i in range(30)]
wk = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
active = {d: set() for d in days}
services = set(trips.values())
if "calendar.txt" in z.namelist():
    for r in rows("calendar.txt"):
        if r["service_id"] not in services: continue
        a, b = datetime.datetime.strptime(r["start_date"], "%Y%m%d").date(), datetime.datetime.strptime(r["end_date"], "%Y%m%d").date()
        for d in days:
            if a <= d <= b and r[wk[d.weekday()]] == "1": active[d].add(r["service_id"])
if "calendar_dates.txt" in z.namelist():
    for r in rows("calendar_dates.txt"):
        if r["service_id"] not in services: continue
        d = datetime.datetime.strptime(r["date"], "%Y%m%d").date()
        if d in active: (active[d].add if r["exception_type"] == "1" else active[d].discard)(r["service_id"])
order, index = [], {}
by_day = {}
for d in days:
    lst = []
    for t, sv in trips.items():
        if sv not in active[d] or t not in st: continue
        key = tuple((s, m) for _, s, m in sorted(st[t]))
        if key not in index: index[key] = len(order); order.append([[s, m] for s, m in key])
        lst.append(index[key])
    by_day[d.isoformat()] = sorted(set(lst))
json.dump({"at": datetime.datetime.utcnow().isoformat() + "Z", "stations": names, "days": by_day, "trips": order}, open(out, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print("stations", len(names), "unique trips", len(order), "per day", {k: len(v) for k, v in by_day.items()}, file=sys.stderr)
