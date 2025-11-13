import re
import json
import time
import requests
import os
from geopy.geocoders import Nominatim
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock

# === Constants ===
INPUT_URL = "https://mattia-furlan.github.io/mont/mont-nav-keywords-map.js"
OUTPUT_FILE = "mont-nav-keywords-geo.js"
MAX_THREADS = 2  # Be nice to Nominatim’s servers

geolocator = Nominatim(user_agent="geo_mapper_safe_parallel")

# === Download source ===
response = requests.get(INPUT_URL)
response.raise_for_status()
text = response.text
print("✅ Download complete.")

# === Parse input JS structure ===
pattern = r"keywords_map\['(.*?)'\]\s*=\s*\[(.*?)\];"
groups = re.findall(pattern, text, re.DOTALL)
print(f"Found {len(groups)} post groups in source file.")

# === Load existing partial output if exists ===
existing_data = {}
if os.path.exists(OUTPUT_FILE):
    with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
        js_text = f.read()
        match = re.search(r"var\s+keywords_geo\s*=\s*(\{.*\});?", js_text, re.DOTALL)
        if match:
            try:
                existing_data = json.loads(match.group(1))
                print(f"✅ Loaded {len(existing_data)} existing groups from file.")
            except json.JSONDecodeError:
                print("⚠️ Could not parse JSON. Starting fresh.")

# === Determine which groups are missing ===
remaining_groups = [
    (post_id, places_raw)
    for post_id, places_raw in groups
    if post_id not in existing_data
]
print(f"🟡 {len(remaining_groups)} new groups to process (only missing ones).")

# === Priority geocoding ===
def geocode_with_priority(place):
    queries = [
        f"{place}, Friuli Venezia Giulia, Italy",
        f"{place}, Italy",
        f"{place}, Slovenia",
        f"{place}, Austria",
        f"{place}, Europe",
        f"{place}"  # fallback
    ]
    for q in queries:
        try:
            location = geolocator.geocode(q, exactly_one=True, timeout=10)
            if location:
                return location.latitude, location.longitude
        except Exception as e:
            print(f"❌ Error geocoding {q}: {e}")
        time.sleep(1)
    return None, None

# === Worker for one post ===
def process_post(post_id, places_raw):
    places = [p.strip(" '\"\n") for p in places_raw.split(",") if p.strip()]
    results = []
    for place in places:
        lat, lon = geocode_with_priority(place)
        results.append({"name": place, "lat": lat, "lon": lon})
        if lat:
            print(f"✓ {place:25} → {lat:.6f}, {lon:.6f}")
        else:
            print(f"⚠️ Not found: {place}")
    return post_id, results

# === File writing setup ===
file_lock = Lock()

# If file exists, remove closing `};` so we can append
if os.path.exists(OUTPUT_FILE):
    with open(OUTPUT_FILE, "r+", encoding="utf-8") as f:
        content = f.read().rstrip()
        if content.endswith("};"):
            f.seek(0)
            f.truncate()
            f.write(content[:-2])
else:
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write("var keywords_geo = {\n")

# === Parallel geocoding ===
with ThreadPoolExecutor(max_workers=MAX_THREADS) as executor:
    futures = [executor.submit(process_post, pid, raw) for pid, raw in remaining_groups]
    for future in as_completed(futures):
        post_id, results = future.result()
        with file_lock:
            with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
                f.write(f'    "{post_id}": {json.dumps(results, ensure_ascii=False)},\n')

# === Close file ===
with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
    f.write("};")

print(f"\n✅ Done! File updated (only new groups added): {OUTPUT_FILE}")
print(f"📊 Total groups now: {len(existing_data) + len(remaining_groups)}")
