"""
Fetch all venues from Supabase, re-geocode each one via Google Places API,
and print any with stored coordinates > 0.3 km off, plus their fix SQL.
"""
import urllib.request, urllib.parse, json, math, time

KEY     = "AIzaSyBIStEGU6ASiYX99wWGRUvnwDKRf9tTNvA"
KEY_SVC = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwZGN5enB3bWV0aW5oYWNwZW52Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjc4MTI2MiwiZXhwIjoyMDg4MzU3MjYyfQ.KxS0Uu92y4nWkZvh5QsHlBT_ttY9LzfZwamQXwDhgXg"
BASE    = "https://apdcyzpwmetinhacpenv.supabase.co/rest/v1"

THRESHOLD_KM = 0.3   # flag venues whose pin is more than 300 m off

def haversine(lat1, lng1, lat2, lng2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1))*math.cos(math.radians(lat2))*math.sin(dlng/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

def supabase_get(table, params=""):
    url = f"{BASE}/{table}?{params}&limit=500"
    req = urllib.request.Request(url, headers={
        "apikey": KEY_SVC,
        "Authorization": f"Bearer {KEY_SVC}",
    })
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def geocode(query):
    """Return (lat, lng, formatted_address) or None via Places findplacefromtext."""
    q = urllib.parse.quote(query)
    url = (f"https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
           f"?input={q}&inputtype=textquery&fields=geometry,formatted_address&key={KEY}")
    with urllib.request.urlopen(url) as r:
        data = json.loads(r.read())
    if data.get("candidates"):
        c = data["candidates"][0]
        loc = c["geometry"]["location"]
        return loc["lat"], loc["lng"], c.get("formatted_address","")
    return None

# ── fetch all venues ───────────────────────────────────────────────────────────
print("Fetching venues from Supabase…")
venues = supabase_get("venues", "select=id,name,suburb,state,address,lat,lng&order=state,name")
print(f"Found {len(venues)} venues\n")

fixes = []

for v in venues:
    vid, name, suburb, state, address, stored_lat, stored_lng = (
        v["id"], v["name"], v.get("suburb",""), v.get("state",""),
        v.get("address",""), v.get("lat"), v.get("lng")
    )

    if stored_lat is None or stored_lng is None:
        print(f"  [NO COORDS] {name} ({state})")
        continue

    # Build search query — prefer address, fall back to name+suburb+state
    query = address if address and len(address) > 10 else f"{name} {suburb} {state} Australia"
    result = geocode(query)

    if result is None:
        # retry with just name + state
        result = geocode(f"{name} {state} Australia")

    if result is None:
        print(f"  [NOT FOUND] {name} ({state})")
        time.sleep(0.15)
        continue

    actual_lat, actual_lng, actual_addr = result
    dist = haversine(stored_lat, stored_lng, actual_lat, actual_lng)

    if dist > THRESHOLD_KM:
        print(f"  [WRONG {dist:.2f} km off] {name} ({state})")
        print(f"    stored : ({stored_lat:.6f}, {stored_lng:.6f})")
        print(f"    actual : ({actual_lat:.6f}, {actual_lng:.6f})  {actual_addr}")
        fixes.append((vid, name, actual_lat, actual_lng, actual_addr))
    else:
        print(f"  [ok {dist:.2f} km]  {name}")

    time.sleep(0.12)   # stay under Places API rate limit

# ── print SQL fix ──────────────────────────────────────────────────────────────
sql_path = "sql/venue-location-fixes.sql"
if fixes:
    print(f"\n{len(fixes)} venues need fixing. Writing SQL to {sql_path}...")
    with open(sql_path, "w", encoding="utf-8") as f:
        f.write("-- Auto-generated venue location fixes (re-geocoded via Google Places API)\n\n")
        for vid, name, lat, lng, addr in fixes:
            safe_addr = addr.replace("'", "''")
            safe_name = name.replace("'", "''")
            line = (f"UPDATE venues SET lat={lat:.7f}, lng={lng:.7f}"
                    f", address='{safe_addr}' WHERE id={vid}; -- {safe_name}\n")
            f.write(line)
    print(f"Done. Run sql/venue-location-fixes.sql in Supabase SQL Editor.")
else:
    print("\nAll venue locations look correct!")
