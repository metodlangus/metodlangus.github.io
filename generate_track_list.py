import requests
import re
from bs4 import BeautifulSoup
from pathlib import Path
import gpxpy

BLOG_URL = "https://metodlangus.github.io"
FEED_URL = f"{BLOG_URL}/data/all-posts.json"
GPX_FOLDER = Path("GPX_tracks")
OUTPUT_FILE = Path("list_of_tracks.txt")


def extract_gpx_and_cover():
    posts = {}
    print("Fetching feed...")
    data = requests.get(FEED_URL).json()
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
        post_url = next(
            (l["href"] for l in entry["link"] if l["rel"] == "alternate"),
            ""
        )

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
