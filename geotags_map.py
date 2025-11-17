"""
geo_builder.py

Generates/updates mont-nav-keywords-geo.js with precomputed data for fast client loading.

Structure produced:
var keywords_geo = {
  "postName": {
      "date": "YYYY-MM-DD HH:MM:SS" or "Date unknown",
      "timestamp": 1234567890,
      "centroid": [lat, lon] or null,
      "locations": [ {"name": "..", "lat": .., "lon": ..}, ... ]
  },
  ...
};

Behavior:
- Only missing groups are geocoded and appended live (thread-safe)
- If a post page contains a photo filename like `resized_photos/24_10_05__13_44_10.JPG` the date is parsed
- If parsing fails, `date` becomes "Date unknown" and timestamp 0
- After all new entries appended, the script removes the trailing comma before the final closing `};` to keep JS neat
"""

import re
import json
import time
import requests
import os
from datetime import datetime
from geopy.geocoders import Nominatim
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
from math import radians, cos, sin, asin, sqrt

# === Config ===
INPUT_URL = "https://mattia-furlan.github.io/mont/mont-nav-keywords-map.js"
OUTPUT_FILE = "mont-nav-keywords-geo.js"
MAX_THREADS = 2
GEOCODER_SLEEP = 1.0  # seconds between geocoder attempts to be polite
OUTLIER_KM = 100.0    # filter points farther than this from centroid

geolocator = Nominatim(user_agent="geo_builder_precompute")

# === Helpers ===

def haversine_km(lat1, lon1, lat2, lon2):
    # Haversine formula
    R = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    return R * c


def parse_date_from_filename(fname):
    # Expecting examples: 24_10_05__13_44_10.JPG or 24_1_2__3_4_5.JPG
    m = re.search(r"(\d{2})_(\d{1,2})_(\d{1,2})__([\d_]+)\.JPG", fname, re.IGNORECASE)
    if not m:
        return None
    yy, mm, dd, timepart = m.groups()
    parts = [int(x) for x in timepart.split('_') if x.isdigit()]
    if len(parts) < 3:
        # pad
        parts = (parts + [0,0,0])[:3]
    hh, mi, ss = parts[:3]
    year = 2000 + int(yy)
    try:
        dt = datetime(year, int(mm), int(dd), int(hh), int(mi), int(ss))
        return dt
    except Exception:
        return None


def fetch_post_date(post_name):
    url = f"https://mattia-furlan.github.io/mont/escursioni/{post_name}/index.html"
    try:
        r = requests.get(url, timeout=15)
        r.raise_for_status()
        html = r.text
        # search for resized_photos/<filename>.JPG
        m = re.search(r"resized_photos/(\d{2}_\d{1,2}_\d{1,2}__[\d_]+\.JPG)", html, re.IGNORECASE)
        if m:
            dt = parse_date_from_filename(m.group(1))
            if dt:
                return dt
        return None
    except Exception:
        return None


def js_object_load(filepath):
    """Extract JS object and return as Python dict. Returns {} on failure."""
    if not os.path.exists(filepath):
        return {}
    with open(filepath, 'r', encoding='utf-8') as f:
        txt = f.read()
    m = re.search(r"var\s+keywords_geo\s*=\s*(\{.*?\})\s*;", txt, re.DOTALL)
    if not m:
        print("⚠ No keywords_geo object found in file")
        return {}
    obj = m.group(1)
    # remove trailing commas before closing brace
    obj = re.sub(r",\s*\n\s*}\s*$", "\n}", obj, flags=re.DOTALL)
    obj = re.sub(r",\s*}", "}", obj)
    try:
        return json.loads(obj)
    except json.JSONDecodeError:
        # Try a more aggressive cleanup: remove trailing commas anywhere before }
        cleaned = re.sub(r",\s*([}\]])", r"\1", obj)
        try:
            return json.loads(cleaned)
        except Exception:
            print("❌ Could not parse existing JS as JSON")
            return {}


def ensure_output_file(filepath):
    if not os.path.exists(filepath):
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write('var keywords_geo = {\n};')

# === Main logic ===

def main():
    print("🔁 Downloading keywords map...")
    r = requests.get(INPUT_URL, timeout=20)
    r.raise_for_status()
    txt = r.text

    groups = re.findall(r"keywords_map\['(.*?)'\]\s*=\s*\[(.*?)\];", txt, re.DOTALL)
    print(f"Found {len(groups)} groups in source")

    existing = js_object_load(OUTPUT_FILE)
    print(f"Loaded {len(existing)} existing groups")

    missing = [(pid, raw) for pid, raw in groups if pid not in existing]
    print(f"Missing groups: {len(missing)}")

    ensure_output_file(OUTPUT_FILE)

    # Prepare file for appending: strip final '};' so we can append inside
    with open(OUTPUT_FILE, 'r+', encoding='utf-8') as f:
        content = f.read().rstrip()
        if content.endswith('};'):
            content = content[:-2].rstrip()
        f.seek(0)
        f.truncate()
        f.write(content)
        if not content.endswith('{'):
            f.write('\n')

    lock = Lock()

    def geocode_with_priority(place):
        queries = [
            f"{place}, Friuli Venezia Giulia, Italy",
            f"{place}, Italy",
            f"{place}, Slovenia",
            f"{place}, Austria",
            f"{place}, Europe",
            f"{place}"
        ]
        for q in queries:
            try:
                loc = geolocator.geocode(q, exactly_one=True, timeout=10)
                if loc:
                    return loc.latitude, loc.longitude
            except Exception as e:
                # be quiet but continue
                pass
            time.sleep(GEOCODER_SLEEP)
        return None, None

    def process_group(pid, raw):
        places = [p.strip(" '\"\n") for p in raw.split(',') if p.strip()]
        locations = []
        for p in places:
            lat, lon = geocode_with_priority(p)
            locations.append({"name": p, "lat": lat, "lon": lon})
            if lat is not None:
                print(f"✓ {p:25} → {lat:.6f}, {lon:.6f}")
            else:
                print(f"⚠ Not found: {p}")

        # compute centroid of valid points
        valid = [ (l['lat'], l['lon']) for l in locations if l['lat'] is not None and l['lon'] is not None ]
        centroid = None
        if valid:
            avg_lat = sum(v[0] for v in valid) / len(valid)
            avg_lon = sum(v[1] for v in valid) / len(valid)
            # filter outliers
            filtered = [v for v in valid if haversine_km(avg_lat, avg_lon, v[0], v[1]) <= OUTLIER_KM]
            if filtered:
                avg_lat = sum(v[0] for v in filtered) / len(filtered)
                avg_lon = sum(v[1] for v in filtered) / len(filtered)
                centroid = [round(avg_lat, 6), round(avg_lon, 6)]
            else:
                centroid = [round(avg_lat,6), round(avg_lon,6)]

        # fetch post date
        dt = fetch_post_date(pid)
        if dt:
            date_text = dt.strftime("%Y-%m-%d %H:%M:%S")
            ts = int(dt.timestamp())
        else:
            date_text = "Date unknown"
            ts = 0

        entry_obj = {
            "date": date_text,
            "timestamp": ts,
            "centroid": centroid,
            "locations": locations
        }

        entry_json = json.dumps(entry_obj, ensure_ascii=False)
        entry_line = f'    "{pid}": {entry_json},\n'

        with lock:
            with open(OUTPUT_FILE, 'a', encoding='utf-8') as f:
                f.write(entry_line)

        return pid

    with ThreadPoolExecutor(max_workers=MAX_THREADS) as ex:
        futures = [ex.submit(process_group, pid, raw) for pid, raw in missing]
        for fut in as_completed(futures):
            pid = fut.result()
            print(f"✔ Written: {pid}")

    # After all appended, close object and remove last trailing comma
    with open(OUTPUT_FILE, 'a+', encoding='utf-8') as f:
        f.write('};')

    # Remove trailing comma before closing brace if present
    with open(OUTPUT_FILE, 'r+', encoding='utf-8') as f:
        content = f.read()
        content = re.sub(r",\s*\n\s*\};", "\n};", content)
        f.seek(0)
        f.truncate()
        f.write(content)

    print('\n✅ Done. File updated:', OUTPUT_FILE)

if __name__ == '__main__':
    main()