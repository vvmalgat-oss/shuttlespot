import urllib.request, urllib.parse, json, time

KEY = "AIzaSyBIStEGU6ASiYX99wWGRUvnwDKRf9tTNvA"
KEY_SVC = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwZGN5enB3bWV0aW5oYWNwZW52Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjc4MTI2MiwiZXhwIjoyMDg4MzU3MjYyfQ.KxS0Uu92y4nWkZvh5QsHlBT_ttY9LzfZwamQXwDhgXg"
BASE = "https://apdcyzpwmetinhacpenv.supabase.co/rest/v1/venues"

venues = [
    ("SA Badminton Arena","Enfield","SA","34-36 Ragless Ave, Enfield SA 5085",-34.8683822,138.6025739,18,"$32/court","https://sa-ba.yepbooking.com.au/",16,22),
    ("The ARC Campbelltown","Campbelltown","SA","531 Lower North East Rd, Campbelltown SA 5074",-34.8846676,138.6576538,4,"$26/court","https://www.arccampbelltown.com.au/55/activities/badminton",6,21),
    ("The Lights Sports Centre","Lightsview","SA","244-270 East Parkway, Lightsview SA 5085",-34.8627357,138.6197814,None,None,"https://www.thelights.com.au/",9,21),
    ("Ingle Farm Recreation Centre","Ingle Farm","SA","3/58 Beovich Rd, Ingle Farm SA 5098",-34.8319444,138.6491667,None,"$22.70/court","https://inglefarmrc.com.au/badminton/",9,22),
    ("UniSA Sport Mawson Lakes","Mawson Lakes","SA","Mawson Lakes Blvd, Mawson Lakes SA 5095",-34.810314,138.6218792,4,"$10/court","https://sport.unisa.edu.au/",8,21),
    ("Marion Leisure and Fitness Centre","Morphettville","SA","Cnr Oaklands Rd, Morphettville SA 5043",-34.9952111,138.5456255,None,"$10/court","https://www.ymca.org.au/",7,21),
    ("Parafield Gardens Recreation Centre","Parafield Gardens","SA","Cnr Kings and Martins Rds, Parafield Gardens SA 5107",-34.7745087,138.6169763,None,"$22/court","https://www.cityofplayford.sa.gov.au/",9,21),
    ("Adelaide Hills Recreation Centre","Mount Barker","SA","2 Howard Lane, Mount Barker SA 5251",-35.0746136,138.8623595,None,"$19/court","https://www.adelaidehillsrc.com.au/play/badminton",9,21),
    ("Erindale Leisure Centre","Wanniassa","ACT","115 McBryde Crescent, Wanniassa ACT 2903",-35.4030524,149.0956029,6,None,"https://erindaleleisurecentre.com.au/",5,21),
    ("UCFitX University of Canberra","Bruce","ACT","Building 29, University Dr South, Bruce ACT 2617",-35.238352,149.0886567,8,None,"https://ucx.canberra.edu.au/",6,21),
    ("ANU Sport Indoor Halls","Acton","ACT","North Road, Acton ACT 2601",-35.2760925,149.1209717,4,None,"https://anu-sport.com.au/facilities/indoor-halls-courts",6,22),
    ("Perth Badminton Arena Redcliffe","Redcliffe","WA","2/309 Great Eastern Hwy, Redcliffe WA 6104",-31.9377795,115.9344875,22,None,"https://www.perthbadmintonarena.com/",9,22),
    ("Perth Badminton Arena Canning Vale","Canning Vale","WA","16B Modal Crescent, Canning Vale WA 6155",-32.0609303,115.9291915,6,None,"https://www.perthbadmintonarena.com/",9,22),
    ("Nick Kidd Badminton Arena","Balcatta","WA","4-6 Halley Rd, Balcatta WA 6021",-31.8619829,115.8229518,6,None,"https://www.nkbarena.com/",12,22),
    ("Apex Badminton Centre","Booragoon","WA","17 Aldous Place, Booragoon WA 6154",-32.038522,115.8250973,7,None,"https://apexbadminton.yepbooking.com.au/",9,23),
    ("Playpoint Ballajura","Malaga","WA","40 Oxleigh Drive, Malaga WA 6090",-31.8469053,115.8864954,8,"$20/court","https://playpoint.com.au/",0,24),
    ("Lords Recreation Centre","Subiaco","WA","5 Wembley Court, Subiaco WA 6008",-31.9463509,115.8163707,4,None,"https://www.lords.com.au/",6,22),
    ("AH Sport Churchlands","Churchlands","WA","6 Lucca St, Churchlands WA 6018",-31.9167985,115.7887333,8,None,"https://ahsport.net/",7,22),
    ("Cannington Leisureplex","Cannington","WA","Cnr Wharf and Sevenoaks Sts, Cannington WA 6107",-32.0105171,115.9406356,2,"$22/court","https://www.canning.wa.gov.au/recreation-and-community/leisureplexes/",6,21),
    ("Sams Badminton Arena Nundah","Nundah","QLD","137 Bage St, Nundah QLD 4012",-27.4081592,153.0570373,6,None,"https://www.samsbadminton.com.au/",8,23),
    ("Smashminton","Acacia Ridge","QLD","2/26 Achievement Crescent, Acacia Ridge QLD 4110",-27.5817871,153.011856,5,None,"https://www.smashminton.com.au/",13,22),
    ("Cornubia Park Sports Centre","Shailer Park","QLD","146 Bryants Rd, Shailer Park QLD 4128",-27.6652227,153.1876811,None,"$33/hr","https://cornubiaparksportscentre.com/",6,22),
    ("PCYC Inala","Inala","QLD","37 Swallow St, Inala QLD 4077",-27.6015082,152.9776425,4,None,"https://www.pcyc.org.au/",9,21),
    ("Morayfield Sport and Events Centre","Morayfield","QLD","298 Morayfield Rd, Morayfield QLD 4506",-27.116956,152.9495756,None,None,"https://www.moretonbay.qld.gov.au/MSEC",6,22),
    ("A1 Badminton Centre","Campbelltown","NSW","11 Mount Erin Rd, Campbelltown NSW 2560",-34.0596733,150.8039305,10,None,"https://a1badminton.com.au/",9,21),
    ("Badminton Masters","Wetherill Park","NSW","21 Ormsby Place, Wetherill Park NSW 2164",-33.8449687,150.8873095,8,"$15-$23/court","https://badmintonmasters.yepbooking.com.au/",6,23),
    ("Energy Badminton Centre","Springvale","VIC","2/4 Brough St, Springvale VIC 3171",-37.9417976,145.1698437,18,None,"https://www.energysports.com.au/",9,23),
    ("Pro Fit Badminton","Clayton South","VIC","86-102 Whiteside Rd, Clayton South VIC 3169",-37.939321,145.1245257,9,"$19-$28/court","https://pfbadminton.com.au/",10,23),
    ("Sports Point Altona North","Altona North","VIC","64-66 McArthurs Rd, Altona North VIC 3025",-37.8347357,144.8383803,9,"$13-$22/court","https://www.sportspoint.com.au/",17,23),
    ("Mornington Peninsula Badminton","Frankston South","VIC","55 Towerhill Rd, Frankston South VIC 3199",-38.1611388,145.1272907,None,None,"https://www.mpba.com.au/",9,21),
]

def get_details(name, suburb, state, lat, lng):
    query = f"{name} {suburb} {state} Australia"
    url = f"https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input={urllib.parse.quote(query)}&inputtype=textquery&fields=place_id,photos,rating,user_ratings_total&locationbias=point:{lat},{lng}&key={KEY}"
    with urllib.request.urlopen(url) as r:
        data = json.loads(r.read())
    c = data.get("candidates", [{}])[0]
    photo_url = None
    if c.get("photos"):
        ref = c["photos"][0]["photo_reference"]
        photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference={ref}&key={KEY}"
    return c.get("place_id"), c.get("rating"), c.get("user_ratings_total"), photo_url

headers = {
    "apikey": KEY_SVC,
    "Authorization": f"Bearer {KEY_SVC}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

inserted = 0
skipped = 0
for v in venues:
    name, suburb, state, addr, lat, lng, courts, price, booking_url, open_h, close_h = v
    pid, rating, reviews, photo = get_details(name, suburb, state, lat, lng)
    payload = {
        "name": name, "suburb": suburb, "city": suburb, "address": addr,
        "state": state, "lat": lat, "lng": lng, "booking_url": booking_url,
        "open_hour": open_h, "close_hour": close_h,
    }
    if courts is not None:
        payload["courts"] = courts
    if price is not None:
        payload["price"] = price
    if photo:
        payload["photo_url"] = photo
    if rating is not None:
        payload["google_rating"] = rating
    if reviews is not None:
        payload["google_review_count"] = reviews
    if pid:
        payload["place_id"] = pid
    data_bytes = json.dumps(payload).encode()
    req = urllib.request.Request(BASE, data=data_bytes, method="POST")
    for k, v2 in headers.items():
        req.add_header(k, v2)
    try:
        with urllib.request.urlopen(req) as r:
            inserted += 1
            print(f"  OK  {name}")
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if "duplicate" in body.lower() or "unique" in body.lower() or "23505" in body:
            skipped += 1
            print(f"  DUP {name}")
        else:
            print(f"  ERR {name}: {body[:120]}")
    time.sleep(0.15)

print(f"\nDone: {inserted} inserted, {skipped} skipped/duplicate")
