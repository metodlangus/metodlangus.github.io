import requests
import re
from bs4 import BeautifulSoup
from pathlib import Path
import gpxpy
import os
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

GPX_FOLDER = Path(BASE_DIR) / "GPX_tracks"
OUTPUT_FILE = Path(BASE_DIR) / "list_of_tracks.txt"
LOCAL_FEED_FILE = Path(BASE_DIR) / "data" / "all-posts.json"


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
        gpx_matches = re.findall(r"var gpxURL\d+\s*=\s*['\"`](.+?\.gpx)['\"`]", content)
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


def generate_tracks_list():
    posts = extract_gpx_and_cover()
    with OUTPUT_FILE.open("w", encoding="utf-8") as out:
        for gpx_file in GPX_FOLDER.glob("*.gpx"):
            filename = gpx_file.name
            lat, lng = extract_start_coordinates(gpx_file)
            lat = lat or 0.0
            lng = lng or 0.0

            if filename in posts:
                entry = posts[filename]
                cover = entry["coverPhoto"]
                post_link = entry["postUrl"]
            else:
                cover = ""
                post_link = ""

            # Write single-line format: latitude;longitude;filename;coverPhoto;postLink
            out.write(f"{lat};{lng};{filename};{cover};{post_link}\n")


if __name__ == "__main__":
    generate_tracks_list()
    print(f"Tracks saved to {OUTPUT_FILE}")
