import requests
import re
from bs4 import BeautifulSoup
from pathlib import Path
import gpxpy
import os
import json
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

GPX_FOLDER = Path(BASE_DIR) / "my_GPX_tracks"
OUTPUT_FILE = Path(BASE_DIR) / "list_of_relive_tracks.txt"
LOCAL_FEED_FILE = Path(BASE_DIR) / "data" / "all-relive-posts.json"

def extract_gpx_and_cover():
    posts = {}
    print("Fetching feed...")

    with open(LOCAL_FEED_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    entries = data["feed"]["entry"]
    print(f"Loaded {len(entries)} posts.")

    for entry in entries:
        content = entry["content"]["$t"]

        # Find all GPX JS variable assignments
        gpx_matches = re.findall(r"var gpxURL\d+\s*=\s*['\"]([^'\"]+\.gpx)['\"]", content)
        if not gpx_matches:
            continue

        # First <img> tag in post as cover photo
        soup = BeautifulSoup(content, "html.parser")
        img_tag = soup.find("img")
        cover_photo = img_tag["src"] if img_tag else ""

        # Post URL
        post_url = next((l["href"] for l in entry["link"] if l["rel"] == "alternate"), "")
        post_url = post_url[:-10] if post_url.endswith("/index.html") else post_url

        # Title
        title = entry["title"]["$t"]

        for gpx_url in gpx_matches:
            filename = Path(gpx_url).name
            posts[filename] = {
                "postUrl": post_url,
                "coverPhoto": cover_photo,
                "title": title,
                "gpxUrl": gpx_url
            }

    print(f"Found {len(posts)} GPX tracks.")
    return posts


def extract_start_coordinates(gpx_file):
    try:
        with open(gpx_file, "r", encoding="utf-8") as f:
            gpx = gpxpy.parse(f)
            if gpx.tracks:
                track = gpx.tracks[0]
                segment = track.segments[0]
                start = segment.points[0]
                return start.latitude, start.longitude
    except Exception as e:
        print(f"Error parsing {gpx_file}: {e}")
    return None, None

def extract_distance_and_elevation_gain(gpx_file):
    """
    Extract distance and elevation gain from GPX description.

    Returns:
        distance_km, elevation_gain_m

    Example extracted values:
        Distance: 9.1 km
        Elevation gain: 1156 m
    """
    try:
        with open(gpx_file, "r", encoding="utf-8") as f:
            gpx_text = f.read()

        # Prefer track description, fallback also works if data is only in waypoint desc
        desc_matches = re.findall(
            r"<desc><!\[CDATA\[(.*?)\]\]></desc>",
            gpx_text,
            flags=re.DOTALL | re.IGNORECASE
        )

        for desc in desc_matches:
            # Remove HTML tags but keep text spacing readable
            soup = BeautifulSoup(desc, "html.parser")
            desc_text = soup.get_text(" ", strip=True)

            distance_match = re.search(
                r"Distance:\s*([\d.,]+)\s*km",
                desc_text,
                flags=re.IGNORECASE
            )

            elevation_gain_match = re.search(
                r"Elevation gain:\s*([\d.,]+)\s*m",
                desc_text,
                flags=re.IGNORECASE
            )

            distance_km = distance_match.group(1).replace(",", ".") if distance_match else ""
            elevation_gain_m = elevation_gain_match.group(1).replace(",", ".") if elevation_gain_match else ""

            if distance_km or elevation_gain_m:
                return distance_km, elevation_gain_m

    except Exception as e:
        print(f"Error extracting distance/elevation from {gpx_file}: {e}")

    return "", ""


def gpx_sort_key(path: Path):
    """
    Sort GPX files by timestamp encoded in filename:
    2024-06-02 064627.gpx

    Falls back to filename ordering if parsing fails.
    """
    try:
        return (
            0,
            datetime.strptime(path.stem, "%Y-%m-%d %H%M%S"),
            path.name,
        )
    except ValueError:
        return (1, path.name)


def generate_tracks_list():
    posts = extract_gpx_and_cover()
    skipped = 0
    written = 0

    with OUTPUT_FILE.open("w", encoding="utf-8") as out:
        for gpx_file in GPX_FOLDER.glob("*.gpx"):
            filename = gpx_file.name

            # Skip if no matching post or no cover image
            if filename not in posts or not posts[filename]["coverPhoto"]:
                print(f"Skipping (no post or no cover image): {filename}")
                skipped += 1
                continue

            lat, lng = extract_start_coordinates(gpx_file)
            lat = lat or 0.0
            lng = lng or 0.0

            distance_km, elevation_gain_m = extract_distance_and_elevation_gain(gpx_file)

            if filename in posts:
                entry = posts[filename]
                cover = entry["coverPhoto"]
                post_link = entry["postUrl"]
            else:
                cover = ""
                post_link = ""

            # Format:
            # latitude;longitude;filename;coverPhoto;postLink;distanceKm;elevationGainM
            out.write(
                f"{lat};{lng};{filename};{cover};{post_link};{distance_km};{elevation_gain_m}\n"
            )


if __name__ == "__main__":
    generate_tracks_list()
    print(f"Tracks saved to {OUTPUT_FILE}")