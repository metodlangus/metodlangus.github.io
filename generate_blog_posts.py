import re
import requests
from pathlib import Path
from slugify import slugify
from collections import defaultdict
from datetime import datetime, timezone
from babel.dates import format_datetime
from xml.etree.ElementTree import Element, SubElement, ElementTree
from zoneinfo import ZoneInfo  # Python 3.9+
from dateutil import parser  # pip install python-dateutil
from bs4 import BeautifulSoup, NavigableString
from collections import defaultdict
from urllib.parse import urlparse, urlunparse, urljoin
import os
import json
import subprocess
import hashlib
import time
import sys
import winsound

##### Commit message: #####
# Update blog posts

GITHUB_USER_NAME = "metodlangus"
GITHUB_REPO_NAME = "metodlangus.github.io"
LOCAL_HOST_URL = f"http://127.0.0.1:5501"
LOCAL_REPO_PATH  = os.path.dirname(os.path.abspath(__file__))

# Nastavitve - Change this one line when switching local <-> GitHub Pages
BASE_SITE_URL = f"https://{GITHUB_REPO_NAME}"
# BASE_SITE_URL = f"{LOCAL_HOST_URL}/{GITHUB_REPO_NAME}"

BLOG_AUTHOR = "Metod Langus"
BLOG_TITLE = "Gorski užitki"
SITE_VERIFICATION = "4bTHS88XDAVpieH98J47AZPNSkKkTj0yHn97H5On5SU"

# Constants
entries_per_page = 12 # Set pagination on home and label pages
NO_IMAGE = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEih6RhkrzOOLNxaVeJR-PiYl4gL_LCvnt8_mQJMJ1QLqVoKAovrkocbpwT5Pf7Zc7jLFnKH2F4MdWZR7Fqq4ZDd1T5FqVB4Wn6uxoP1_JcGEprf-tt_7HqeHhLjKnaFHs3xrkitzcqQNmNaiVT-MrgmJgxjARcUDGpEVYdpif-J2gJF72h_xB9qnLkKfUH4/s1600/no-image-icon.jpg"
DEFAULT_OG_IMAGE = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiU8RYSJ0I45O63GlKYXw5-U_r7GwP48_st9F1LG7_Z3STuILVQxMO4qLgzP_wxg0v_77s-YwidwwZQIDS1K6SUmY-W3QMwcIyEvt28cLalvCVQu4qWTQIm-B_FvgEmCCe6ydGld4fQgMMd2xNdqMMFtuHgeVXB4gRPco3XP90OOKHpf6HyZ6AeEZqNJQo/s1600/IMG20241101141924.jpg"
SLIDESHOW_COVER_IMAGE = DEFAULT_OG_IMAGE
SLIDESHOW_COVER_UPPER_TEXT = "Cima dell'Uomo (3010 m)"
SLIDESHOW_COVER_TEXT = "FOTO: Matej"

BLOG_TITLE_SVG = """<svg class='logo-svg' height='67' version='1.0' viewBox='0 0 1350 168' width='540' xmlns='http://www.w3.org/2000/svg'>
          <g fill='#666'>
            <path d='m945 4-14 6h-13c-10-6-10-6-22-5-12 0-12 0-16 3l-5 3c-2 0-5 4-5 6s4 7 14 16l13 16-9 1c-7 0-8 0-11 3s-10 6-12 6c-1 0-2 4-2 9s-1 7-2 5l-2-8c0-7-2-12-5-14l-22-1c-17 0-20 0-23 2l-3 2-4 2-4 2-4-4-5-5-23 1h-23l-3 3c-2 2-4 5-6 5-2 2-2 2-3 16l-1 18a253 253 0 0 0 1 32c0 5 3 14 6 17l1 3c0 2 6 8 12 12 3 3 5 3 16 4h12l21-2 26 1c25 0 29 0 32-4 2-3 4-2 6 1 3 3 12 5 17 3h29a494 494 0 0 1 51-1l6-1 8-2 4-2 2 2 8 4h18c12 0 19-1 21-2l8-3c6-2 7-4 7-18l1-26V95h7l8-1 1 17c1 14 1 18 4 24 2 6 3 9 8 13 5 5 9 6 23 10a164 164 0 0 0 52-2c3-2 3-2 7 1 3 2 4 2 22 2 20-1 30-2 34-4 2-1 3-1 7 1 6 3 6 3 24 3l21-1c3-1 18-2 20 0 2 1 39 2 40 0l8-2c3-1 7-3 8-5l3-2V56l-3-2c-3-3-3-4-1-8l1-18c-1-21 1-20-24-20-19 0-19 0-23 3l-6 3-4 3c-2 3-2 4-2 17l1 16 5 2c5 0 5 2 0 4s-7 2-7 1l-5-4c-4-3-5-3-15-3-16 0-28 2-34 4l-7 3c-3 2-5 1-5-4l2-17V22l-3-4-4-4h-39l-3 3-4 3-4 2c-3 2-4 3-5 9l-1 11v8c0 5-2 5-6 3l-12-3-10-1-1-14c0-14-1-17-8-19-8-3-40-1-40 2l-4 2c-4 0-10 5-10 7v13l-1 12-4 2c-8 4-10 4-14 0-3-3-4-6-2-8l2-16V14l-3-3-3-3h-38l-4 3-5 3-4 2c-2 2-3 12-2 26v8l4 1c6 2 7 3 2 5-6 3-7 4-8 9v44l1 5c0 4 0 4-3 4l-3-1-13-1c-10-1-12-2-12-3 0-2 2-4 7-8l12-10 5-5 1-15-1-18c-2-4-5-5-18-6l-14-1c-3-1-3-4 0-4 4-2 25-26 27-32 2-5 0-9-5-10h-18zm12 8 2 2-14 16-7 8h-26l-11-11-11-13 3-2c5-1 13 1 21 5l10 4 11-4c12-6 18-7 22-5zm74 4 1 12c0 15 1 14-16 14l-14-2c-3-1-4-7-4-15 0-7 0-8 2-9h31zm297 1 1 12c0 10 0 11-2 12-3 2-27 0-29-1l-2-8c-3-17-2-17 17-17l15 2zm-217 7c2 1 2 3 2 17 0 18-1 17 14 17 13 0 13 0 13 13l-1 12c0 2-10 3-18 1s-8-1-8 14c0 19 2 21 18 23 10 0 11 0 12 2 1 4 2 22 1 24-1 1-4 2-18 2l-22-1c-8-2-23-16-25-23l-2-20c-2-24 0-22-11-22h-8l-1-10c0-13 0-13 11-13l7-1 2-15c0-16 1-20 4-20 6-2 27-1 30 0zm93-1v19c-2 25-1 45 0 47 3 2 5 1 8-4a88 88 0 0 1 6-10c6-8 11-15 13-15l19-2c19 0 19 0 14 8a81 81 0 0 1-4 7l-3 5-3 4-5 8-4 8 5 9 9 16a99 99 0 0 0 10 17l2 2c2 2 1 6-1 6l-20 1c-21 0-20 1-26-12-5-10-12-21-14-22h-3c-2 1-2 4-2 17 0 14 0 15-2 16h-34v-17c-1-21 1-104 1-107 1-2 1-2 17-2l17 1zM786 59l2 30c1 28 1 28 3 31 6 7 15 7 20 1 3-3 3-4 4-15 0-9-1-27-3-40-1-7 0-7 20-7l17 1 1 3a664 664 0 0 1 1 86l-17 1c-18 0-19 0-19-6 0-3 0-3-3-3-2 0-4 1-7 4-7 8-25 9-37 3-8-4-18-18-20-29a460 460 0 0 1 1-60h37zm167 1 11 2c1 1 2 24 1 26l-6 5a536 536 0 0 0-27 23c-3 2-4 5-1 6l20 2 19 2 1 11c0 8 0 10-2 12l-42 1-44-2c-2-1-2-1-2-12 0-13 0-12 13-24 16-13 25-22 25-24l-2-2c-2-1-4-2-8-1h-27l-1-12c0-8 0-11 2-12 1-2 5-2 30-2l40 1zm81 2a654 654 0 0 1-1 84c-2 2-31 2-34 0l-2-1v-40l1-42c1-2 2-2 18-2l18 1zm297 4v80c-1 2-2 2-18 2l-17-1a963 963 0 0 1 1-85l18-1h16v5zm-55 6 1 16v22c1 4 0 23-1 23-2 0-7-8-11-16l-7-12-3-6 16-27c4-5 6-5 6 0zm-126 19c-1 3-1 5 1 9v14c0 2 0 2-2 2l-4-1-6-1c-9 0-16-1-17-3l-1-8c0-5 0-6 2-7h4l5-1 5-1c3 0 10-4 11-6s1-2 2-1v4zm-287-1c0 4 2 5 15 5 9 0 14 1 14 2s-11 12-21 20c-4 4-7 7-7 9l-2 2c-2 0-2-3-2-19l1-20c1-1 2 0 2 1zM637 11l-5 3c-5 0-7 9-6 23s1 14 5 14c6 1 6 3 1 5-5 3-6 3-8 0-6-5-7-6-19-6-21 0-30 2-40 7-3 2-5 1-5-1V20c-2-5-5-6-26-6-18 0-19 0-21 2l-7 5c-8 4-8 4-8 33a782 782 0 0 0 0 40v10c1 5-2 5-6 1l-9-8c-4-3-5-5-4-6l5-1c10 0 14-13 6-23-3-3-11-10-16-12-10-5-14-5-32-5-17 0-17 0-23 3l-15 7-17 7-1-5-1-7c-2-7-25-7-38 0-5 2-5 2-8 0-5-5-7-5-26-5-17 0-17 0-20 2-1 2-4 4-7 5-6 2-6 4-7 16l-1 13c0 2-3-1-4-5l-1-5-3-6c-2-6-6-10-12-13l-6-3-5-1-6-1c-6-2-45-3-47-1l-4 2c-6 1-20 11-28 19s-10 9-10 5l-2-5-3-3 3-4c2-4 2-5 1-10-1-7-5-12-12-19a50 50 0 0 0-32-18l-26-1c-17 0-18 0-25 2l-10 4-10 5-12 6-6 7-4 5-6 13-1 3a321 321 0 0 0 1 59l2 6 2 6c0 2 12 16 15 17l5 3a141 141 0 0 0 40 8c11 0 35-4 39-6 2-1 8-4 11-4 5-2 16-10 21-16 9-12 7-11 10-6l2 6 6 8c6 8 11 11 25 15a175 175 0 0 0 41 1l10-2 7-2 3-1 17-9c4-4 9-12 11-16l2-4c2 0 2 4 2 19l1 9c2 6 4 6 26 6a167 167 0 0 0 28-2l7-3 2-2v-25c0-28-1-26 15-27l14-1c6-3 8-2 9 1l6 9 6 7c0 1-6 7-10 9-3 1-5 3-5 6 0 4 3 11 7 14 4 4 15 11 16 11l5 2 14 2 13 1a119 119 0 0 0 38-8l3-2 8-7 10-6c5-4 6-3 6 7 0 7 0 8 3 11l3 3h19c20-1 31-2 33-4 2-1 8 0 11 3 2 1 37 1 50-1h11c4 2 39 3 43 0l4-1 5-2c8-3 7-2 8-52 0-45-1-48-5-50v-6c1-2 2-7 2-18V14l-3-3-3-3h-39l-3 3zm39 6 1 12c0 11 0 11-2 12-3 1-27 0-29-1-1-1-2-4-2-10-1-11 0-14 2-14 2-1 29 0 30 1zM552 55v34c2 2 5 1 7-3l2-4a1412 1412 0 0 0 17-22l20-2h16v2l-4 9-8 13-6 9-3 6 6 13 7 11c0 1 3 7 9 15 5 9 6 11 3 12a201 201 0 0 1-40 0l-6-9c-5-11-13-24-15-25l-3 1-2 17-1 16h-32c-2 0-2-1-3-7l3-118 16-1h17v33zM97 25l11 2c11 2 13 3 25 15 8 7 10 11 10 16v4h-43l-4-5-10-5c-7 0-12 1-16 5-5 4-5 7-4 31 0 22 1 24 7 30 3 2 4 3 11 3 8 0 13-2 16-7 5-7 4-13-3-13-6 0-7-1-7-12-1-13-3-13 23-12h25l5 2c2 1 2 34 0 39-2 8-12 19-20 23l-21 8c-8 2-20 3-27 2-14-2-18-3-24-7l-7-4c-1 0-12-10-13-13-4-8-8-27-7-35V73c1-22 7-35 22-41l7-3 3-1 4-1 6-2h31zm130 33c13 1 20 2 26 6 4 2 10 7 10 10l2 5 2 6 1 3c3 3 4 22 2 30-1 5-5 14-8 18-3 3-12 9-19 11-4 2-8 2-15 2l-12 1h-5l-6-1-17-5c-4-3-10-10-15-19-3-6-3-7-3-12a229 229 0 0 1 8-36c1-4 4-9 6-11 2-3 13-8 16-8h26zm96 0c8 1 10 2 10 7 0 6 6 6 11 2 6-6 14-8 23-9l10 1v28c-1 2-2 2-14 2-15 0-21 2-25 7l-3 3v23l1 25c-1 2-2 2-18 2l-18-1c-2-1-2-2-2-22a1560 1560 0 0 0 2-68h23zm139 1 4 1c4 1 13 7 17 12l3 6v3l-17 1c-16 0-16 0-20-3s-7-3-11 0c-7 5-1 13 12 15 12 1 18 3 25 8 10 7 16 13 17 17 1 6-1 9-7 13-7 6-8 6-19 12-8 4-10 4-20 5-7 1-11 1-16-1l-11-2c-9-2-18-7-22-13-3-6-2-7 6-7l15-1c8-1 8-1 15 2 8 3 11 3 15 0 3-2 4-4 1-8-2-3-6-5-16-7-12-3-14-3-20-6l-10-7c-5-5-5-5-5-11v-7l8-8c12-10 18-15 25-15 7-1 30 0 31 1zm217 18c1 19 0 67-1 68-2 2-31 2-34 1l-1-43c-1-36 0-41 1-42l18-1h16l1 16zM80 67l3 5-8 4c-2-1-3-7-1-10 1-3 4-2 6 1zm544 1 1 54c-1 9-1 9-3 9l-8-11c-1-5-4-9-8-15l-4-7 6-9 14-22 2 1z'/>
            <path d='m213 82-3 4c-1 5-2 20-1 28 1 7 1 9 3 11 5 3 10 3 15-1 3-3 3-5 3-8l1-10c2-7 0-18-4-22-3-4-9-5-14-2z'/>
          </g>
        </svg>"""

OUTPUT_DIR = Path.cwd() # Current path
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
SITEMAP_FILE = "sitemap.xml"
LASTMOD_DB = Path(".build/lastmod.json")
BASE_FEED_PATH = f"{LOCAL_REPO_PATH }/data/all-posts.json"
REMOTE_DB_URL = f"{BASE_SITE_URL}/.build/lastmod.json"

# Indexnow settings
INDEXNOW_ENDPOINT = "https://www.bing.com/indexnow"
KEY = "96686b98e4974b89a7268c29fa7756a8"
KEY_LOCATION = f"{BASE_SITE_URL}/{KEY}.txt"

def load_lastmod_db():
    if LASTMOD_DB.exists():
        with open(LASTMOD_DB, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def save_lastmod_db(db):
    LASTMOD_DB.parent.mkdir(parents=True, exist_ok=True)
    with open(LASTMOD_DB, "w", encoding="utf-8") as f:
        json.dump(db, f, indent=2, ensure_ascii=False)  

def compute_md5(file_path: Path) -> str:
    h = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()

def override_domain(url, base_site_url):
    """
    Overrides the domain and base path from base_site_url,
    preserving the path, query, and fragment from the original URL.
    """
    parsed_original = urlparse(url)
    parsed_base = urlparse(base_site_url)

    # Combine base path and original path safely
    base_path = parsed_base.path.rstrip('/')
    original_path = parsed_original.path.lstrip('/')
    combined_path = f"{base_path}/{original_path}" if base_path else f"/{original_path}"

    return urlunparse((
        parsed_base.scheme,
        parsed_base.netloc,
        combined_path,
        parsed_original.params,
        parsed_original.query,
        parsed_original.fragment
    ))

def parse_entry_date(entry, index=None):
    published = entry.get("published", {}).get("$t", "")
    local_tz = ZoneInfo("Europe/Ljubljana")

    try:
        parsed_date = parser.isoparse(published).astimezone(local_tz)
        formatted_date = parsed_date.isoformat()
        year = str(parsed_date.year)
        month = f"{parsed_date.month:02d}"
    except Exception as e:
        if index is not None:
            print(f"Date parse error at index {index}: {e}")
        formatted_date, year, month = published, "unknown", "unknown"

    return formatted_date, year, month

def generate_unique_slugs(entries, return_type="slugs"):
    slugs = []
    archive_dict = defaultdict(lambda: defaultdict(list))

    for i, entry in enumerate(entries):
        # Get href from links
        links = entry.get("link", [])
        href = next(
            (l.get("href") for l in links if l.get("rel") == "alternate" and l.get("type") == "text/html"),
            None
        )

        if href:
            path_parts = urlparse(href).path.strip("/").split("/")
            # Expecting structure: ['posts', 'year', 'month', 'post_name', 'index.html']
            if len(path_parts) >= 5 and path_parts[-1] == "index.html":
                year = path_parts[1]
                month = path_parts[2]
                unique_slug = path_parts[3]  # Folder name
            else:
                year, month = "unknown", "unknown"
                unique_slug = f"post-{i}"
        else:
            year, month = "unknown", "unknown"
            unique_slug = f"post-{i}"

        title = entry.get("title", {}).get("$t", f"untitled-{i}")
        archive_dict[year][month].append((unique_slug, title))
        slugs.append(unique_slug)

    return archive_dict if return_type == "archive" else slugs

def fetch_all_entries():
    print("Fetching all paginated posts...")
    all_entries = []

    url = BASE_FEED_PATH
    print(f"Fetching: {url}")
    
    # Load JSON directly from local file
    with open(url, "r", encoding="utf-8") as f:
        data = json.load(f)

    entries = data.get("feed", {}).get("entry", [])
    all_entries.extend(entries)

    print(f"Total entries fetched: {len(all_entries)}")
    return all_entries

def fix_images_for_lightbox(html_content, post_title):
    """
    Modify image links in HTML content for lightbox compatibility.
    Keeps first image high resolution (/s1600/), others at /s1000/.
    Uses WebP, adds alt tags, <picture> elements, and loading attributes.
    Adds 'cover-photo' class to the first image.
    """
    soup = BeautifulSoup(html_content, "html.parser")
    image_index = 0  # Track image count for loading priority

    for a_tag in soup.find_all("a"):
        img = a_tag.find("img")
        if not img:
            continue

        # Step 1: Determine <img> alt text
        data_skip = img.get("data-skip", "").lower()
        skip_keywords = [k.strip() for k in data_skip.split(";") if k.strip()]
        alt_text = ""

        # Find possible caption
        table = img.find_parent("table", class_="tr-caption-container")
        caption_td = None
        if table:
            caption_td = table.find("td", class_="tr-caption")

        caption_text = caption_td.get_text(strip=True) if caption_td and caption_td.get_text(strip=True) else ""

        # Step 1A: Assign alt text based on rules
        if image_index == 0:
            # First image (cover photo)
            alt_text = f"{BLOG_TITLE} | {BLOG_AUTHOR} \u2013 {post_title}"
        elif any(k in skip_keywords for k in ["peak", "best", "1", "2"]):
            # Tagged as peak/best/1/2
            if caption_text:
                alt_text = f"{post_title} \u2013 {caption_text}"
            else:
                alt_text = post_title
        elif "3" in skip_keywords:
            # Tag 3 → empty alt
            alt_text = ""
        else:
            alt_text = ""

        img["alt"] = alt_text

        # Step 2: Determine correct resolution
        src = img.get("src", "")
        href = a_tag.get("href", "")

        if image_index == 0:
            # First image high resolution
            new_src = re.sub(r"/s\d+/", "/s1200/", src)
            new_href = re.sub(r"/s\d+/", "/s1600/", href)
        else:
            # Other images downgraded to resolution
            new_src = re.sub(r"/s\d+/", "/s600/", src)
            new_href = re.sub(r"/s\d+/", "/s1000/", href)

        # Add -rw (WebP) if missing
        new_src = re.sub(r"(/s\d+)(/)", r"\1-rw\2", new_src)
        new_href = re.sub(r"(/s\d+)(/)", r"\1-rw\2", new_href)
        img["src"] = new_src
        a_tag["href"] = new_href

        # Step 3: Add lightbox attribute
        a_tag["data-lightbox"] = "Gallery"

        # Step 4: Loading and priority
        if image_index == 0:
            img["loading"] = "eager"
            img["fetchpriority"] = "high"
            img["class"] = img.get("class", []) + ["cover-photo"]
        else:
            img["loading"] = "lazy"
            img["fetchpriority"] = "low"

        image_index += 1

        # Step 5: Wrap in <picture> with WebP only (no JPEG fallback)
        picture = soup.new_tag("picture")
        source = soup.new_tag("source", srcset=new_src, type="image/webp")
        picture.append(source)

        img.extract()
        picture.append(img)

        a_tag.clear()
        a_tag.append(picture)

    return soup.prettify()

def remove_leading_hidden_blocks(html: str) -> str:
    patterns = [
        # hidden summary div
        r'^\s*<div\s+style="display:\s*none;">\s*<summary>.*?</summary>\s*</div>\s*',

        # more anchor span
        r'^\s*<span>\s*<a\s+name="more">\s*</a>\s*</span>\s*',

        # hidden cover photo div
        r'^\s*<div\s+style="display:\s*none;">\s*<!--.*?-->\s*</div>\s*',

        # lightbox instructions span
        r'^\s*<span>\s*<!--.*?Lightbox.*?-->\s*</span>\s*',
    ]

    for pattern in patterns:
        html = re.sub(pattern, "", html, flags=re.DOTALL | re.IGNORECASE)

    return html

def render_post_html(entry, index, entries_per_page, slugify_func, post_id):

    published_raw = entry.get("published", {}).get("$t", "1970-01-01T00:00:00Z")
    published_dt = datetime.strptime(published_raw, "%Y-%m-%dT%H:%M:%S.%f%z")

    # Format published date in Slovenian (Unicode-safe)
    published = format_datetime(published_dt, "EEEE, d. MMMM y", locale="sl")

    title = entry.get("title", {}).get("$t", f"untitled-{index}")
    thumbnail = entry.get("media$thumbnail", {}).get("url", NO_IMAGE)
    link_list = entry.get("link", [])
    raw_link = next((l["href"] for l in link_list if l.get("rel") == "alternate"), "#")
    parsed = urlparse(raw_link)
    path = parsed.path[:-10] if parsed.path.endswith("/index.html") else parsed.path
    alternate_link = override_domain(urlunparse(parsed._replace(path=path)), BASE_SITE_URL)
    categories = entry.get("category", [])

    label_one = next((c["term"].replace("1. ", "") for c in categories if c["term"].startswith("1. ")), "")
    label_six = next((c["term"].replace("6. ", "") for c in categories if c["term"].startswith("6. ")), "")

    label_one_link = f"{BASE_SITE_URL}/search/labels/{slugify_func(label_one)}/" if label_one else ""
    label_six_link = f"{BASE_SITE_URL}/search/labels/{slugify_func(label_six)}/" if label_six else ""

    page_number = 1 if entries_per_page == 0 else (index // entries_per_page + 1)
    hidden_class = "" if page_number == 1 else " visually-hidden"

    # --- Extract summary / description for alt text ---
    content_html = entry.get("content", {}).get("$t", "")
    soup = BeautifulSoup(content_html, "html.parser")

    # Normalize whitespace in text nodes (prevents newlines in extracted text)
    for text_node in soup.find_all(string=True):
        if isinstance(text_node, NavigableString):
            if text_node.parent.name in ("script", "style", "pre", "code"):
                continue
            cleaned = " ".join(text_node.split())
            if cleaned:
                text_node.replace_with(cleaned)

    def normalize(text):
        return ' '.join(text.split()).strip().lower()

    unwanted = [
        normalize("Summary, only on the post-container view."),
        normalize("Kaj češ lepšega, kot biti v naravi.")
    ]

    # Try extracting a <summary> or <meta name="description">
    summary_tag = soup.find("summary")
    if summary_tag and normalize(summary_tag.get_text()) not in unwanted:
        description = " ".join(summary_tag.get_text().split())
    else:
        meta_tag = soup.find("meta", attrs={"name": "description"})
        if meta_tag and normalize(meta_tag.get("content", "")) not in unwanted:
            description = " ".join(meta_tag.get("content", "").split())
        else:
            description = title

    # Fallback alt text content
    alt_text = description

    # --- Render HTML ---
    return f"""
          <div class="photo-entry{hidden_class}" data-page="{page_number}">
            <article class="my-post-outer-container">
              <div class="post">
                {'<div class="my-tag-container"><a href="' + label_six_link + '" class="my-labels label-six">' + label_six + '</a></div>' if label_six else ""}
                <a href="{alternate_link}" class="my-post-link" aria-label="{title}">
                  <div class="my-title-container">
                    {'<a href="' + label_one_link + '" class="my-labels">' + label_one + '</a>' if label_one else ""}
                    <h2 class="my-title">{title}</h2>
                  </div>
                </a>
                <div class="my-meta-data">
                  <div class="author-date">Dne {published}</div>
                </div>
                <div class="my-thumbnail" id="post-snippet-{post_id}">
                  <div class="my-snippet-thumbnail">
                    {'<img src="' + thumbnail.replace('/s72-c', '/s600-rw') + '" alt="' + alt_text + '">' if thumbnail else ""}
                  </div>
                </div>
                <a href="{alternate_link}" aria-label="{title}"></a>
              </div>
            </article>
          </div>"""

def replace_mypost_scripts_with_rendered_posts(content_html, entries, entries_per_page, slugify_func, render_func):
    """
    Replace <script> blocks containing one var postTitleX and optional var displayModeX
    with rendered post HTML from entries.

    Each <script> has one declaration like:
      var postTitle0 = '1234567890';
      var displayMode0 = 'alwaysVisible';

    If displayMode is not 'alwaysVisible', wraps content in a hidden div.

    Returns prettified updated HTML.
    """

    soup = BeautifulSoup(content_html, 'html.parser')

    # Build lookup of post_id -> (index, entry)
    post_id_to_entry = {}
    for idx, entry in enumerate(entries):
        full_id = entry.get("id", {}).get("$t", "")
        match = re.search(r'post-(\d+)$', full_id)
        if match:
            post_id = match.group(1)
            post_id_to_entry[post_id] = (idx, entry)

    for script in soup.find_all("script"):
        if not script.string:
            continue

        content = script.string

        # Match one postTitleX and one displayModeX in this script block
        m_title = re.search(r"var\s+postTitle(\d+)\s*=\s*['\"](\d+)['\"]\s*;", content)
        if not m_title:
            continue

        idx = m_title.group(1)
        post_id = m_title.group(2)

        # Find displayMode for the same index, default if missing
        m_mode = re.search(rf"var\s+displayMode{idx}\s*=\s*['\"]([^'\"]+)['\"]\s*;", content)
        display_mode = m_mode.group(1) if m_mode else "default"

        if post_id not in post_id_to_entry:
            continue

        post_index, post_entry = post_id_to_entry[post_id]

        rendered_html = render_func(
            post_entry,
            post_index,
            entries_per_page,
            slugify_func,
            post_id
        )

        if display_mode != "alwaysVisible":
            rendered_html = f'<div class="my-post-container" style="display:none;">{rendered_html}</div>'

        # Insert rendered HTML after script and remove the script tag
        script.insert_after(BeautifulSoup(rendered_html, "html.parser"))
        script.decompose()

    return soup.prettify()

def build_archive_sidebar_html(entries):
    """
    Generate complete archive sidebar HTML from Blogger entries.
    Clicking a year/month navigates to the correct archive page,
    arrow still expands/collapses the section.
    Numbers are displayed with a space before parentheses.
    """
    archive_dict = generate_unique_slugs(entries, return_type="archive")

    archive_html = """<aside class="sidebar-archive">
  <h2>Arhiv</h2>
"""

    for y in sorted(archive_dict.keys(), reverse=True):
        year_posts = archive_dict[y]
        year_count = sum(len(posts) for posts in year_posts.values())
        # Year link with space before parentheses
        archive_html += f"""  <details open>
    <summary><a href="{BASE_SITE_URL}/posts/{y}/">{y}</a>&nbsp;<span class="post-count" dir="ltr">({year_count})</span></summary>
"""

        for m in sorted(year_posts.keys(), reverse=True):
            posts = year_posts[m]
            try:
                # Format month name in Slovenian
                dummy_date = datetime.strptime(m, '%m')
                month_name = format_datetime(dummy_date, "LLLL", locale="sl")
            except ValueError:
                month_name = m
            month_label = f"{month_name} {y}"

            # Month link with space before parentheses
            archive_html += f"""    <details class="month-group">
      <summary><a href="{BASE_SITE_URL}/posts/{y}/{m}/">{month_label}</a>&nbsp;<span class="post-count" dir="ltr">({len(posts)})</span></summary>
      <ul>
"""

            for slug, title in posts:
                safe_title = (
                    title.replace("&", "&amp;")
                         .replace("<", "&lt;")
                         .replace(">", "&gt;")
                         .replace('"', "&quot;")
                         .replace("'", "&#x27;")
                )
                archive_html += f"""        <li><a href="{BASE_SITE_URL}/posts/{y}/{m}/{slug}/">{safe_title}</a></li>
"""

            archive_html += """      </ul>
    </details>
"""

        archive_html += "  </details>\n"

    archive_html += "</aside>"
    return archive_html

def save_archive_as_js(archive_html, output_path="assets/archive.js"):
    # Escape backticks so JS template literal doesn’t break
    safe_html = archive_html.replace("`", "\\`")

    js_code = f"""
document.addEventListener("DOMContentLoaded", function() {{
  // Insert archive HTML into placeholder
  document.getElementById("archive-placeholder").innerHTML = `{safe_html}`;

  // Add state remembering for all <details>
  document.querySelectorAll("#archive-placeholder details").forEach(function(det, idx) {{
    var key = "archive-state-" + idx;

    // Restore state from sessionStorage
    if (sessionStorage.getItem(key) === "open") {{
      det.setAttribute("open", "");
    }} else if (sessionStorage.getItem(key) === "closed") {{
      det.removeAttribute("open");
    }}

    // Save state when toggled
    det.addEventListener("toggle", function() {{
      sessionStorage.setItem(key, det.open ? "open" : "closed");
    }});
  }});
}});
"""
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(js_code)

def save_navigation_as_js(labels_html, output_path="assets/navigation.js"):
    # Escape backticks so JS template literal doesn’t break
    safe_html = labels_html.replace("`", "\\`")

    js_code = f"""
document.addEventListener("DOMContentLoaded", function() {{
  // Insert labels HTML into placeholder
  document.getElementById("navigation-placeholder").innerHTML = `{safe_html}`;

  // Add state remembering for all <details>
  document.querySelectorAll("#navigation-placeholder details").forEach(function(det, idx) {{
    var key = "navigation-state-" + idx;

    // Restore state from sessionStorage
    if (sessionStorage.getItem(key) === "open") {{
      det.setAttribute("open", "");
    }} else if (sessionStorage.getItem(key) === "closed") {{
      det.removeAttribute("open");
    }}

    // Save state when toggled
    det.addEventListener("toggle", function() {{
      sessionStorage.setItem(key, det.open ? "open" : "closed");
    }});
  }});
}});
"""
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(js_code)

def generate_labels_sidebar_html(feed_path):
    """Loads labels from a local Blogger JSON feed file and returns structured sidebar HTML."""

    # Load local JSON feed
    with open(feed_path, "r", encoding="utf-8") as f:
        feed_data = json.load(f)

    # Extract label terms
    labels_raw = [cat["term"] for cat in feed_data["feed"].get("category", [])]

    # Section titles by prefix number
    prefix_titles = {
        1: "Kategorija",
        2: "Država",
        3: "Gorstvo",
        4: "Časovno",
        5: "Ostalo",
        # 6 intentionally excluded from display
    }

    # Group labels by prefix
    label_groups = defaultdict(list)
    for label in labels_raw:
        match = re.match(r'^(\d+)', label)
        prefix = int(match.group(1)) if match else 99
        label_groups[prefix].append(label)

    # Sort prefixes and skip section 6
    sorted_prefixes = [p for p in sorted(label_groups.keys()) if p != 6]

    # HTML build
    label_html_parts = ["<aside class='sidebar-labels'><h2>Navigacija</h2>"]

    for idx, prefix in enumerate(sorted_prefixes):
        labels = sorted(label_groups[prefix], key=lambda l: l.lower())
        section_title = prefix_titles.get(prefix, "Ostalo")

        if idx == 0:
            label_html_parts.append(f"<div class='first-items'><h3>{section_title}:</h3><ul class='label-list'>")
        elif idx == 1:
            label_html_parts.append("<div class='remaining-items hidden' style='height:auto;'>")
            label_html_parts.append(f"<h3>{section_title}:</h3><ul class='label-list'>")
        else:
            label_html_parts.append(f"<h3>{section_title}:</h3><ul class='label-list'>")

        for raw_label in labels:
            clean_label = re.sub(r'^\d+\.\s*', '', raw_label)
            slug = slugify(clean_label)
            label_html_parts.append(
                f"<li><a class='label-name' href='{BASE_SITE_URL}/search/labels/{slug}/'>{clean_label}</a></li>"
            )

        label_html_parts.append("</ul>")

    # Closing tags
    if sorted_prefixes:
        label_html_parts.append("</div>")

    if len(sorted_prefixes) > 1:
        label_html_parts.append("""
        <span class='show-more pill-button'>Pokaži več</span>
        <span class='show-less pill-button hidden'>Pokaži manj</span>
        """)

    label_html_parts.append("</aside>")

    return "\n".join(label_html_parts)

def render_sidebar_settings(picture_settings=True, map_settings=True, current_page=""):
    sections = []

    # Always include the main heading once
    heading = "<h2>Nastavitve</h2>"

    if picture_settings:
        label_filter_html = generate_label_filter_section(feed_path=BASE_FEED_PATH)

        # Base section
        section_html = f"""
        <h3 class="title">Objave in predvajalniki slik</h3>
        <div style="display: inline-block; border-style: double; margin-left: 5px; padding: 5px;">
            <b>Število slik:</b> <span id="imagesLoadedCount">0</span>
        </div>
        <div style="display: flex; flex-direction: column; margin-left: 5px; margin-top: 15px; margin-bottom: 10px;">
            <label for='photosSliderElement'>
                <b>Obseg prikazanih slik:</b> <span id='photosValueElement'></span>
            </label>
            <input id='photosSliderElement' max='3' min='0' step='1' type='range' value='initPhotos' style="width: 160px;"/>
        </div>
        """

        # Add the conditional section if the page matches
        if current_page in ("slideshow_page", "gallery_page"):
            section_html += f"""
        <div style="display: flex; align-items: center; gap: 5px; margin-left: 5px;">
            <span><b>Naključno prikazovanje:</b></span>
            <button id="toggleRandomButton" style="padding: 5px;">DA</button>
        </div>
        <div style="margin-top: 10px; margin-left: 5px;">
            <div><b>Slike iz objav:</b></div>
            <div style="margin-top: 5px; margin-left: 20px;">
                <b>med:</b> <input type="date" id="startDateInput">
            </div>
            <div style="margin-top: 5px; margin-left: 20px;">
                <b>in:</b> <input type="date" id="endDateInput">
            </div>
        </div>
        {label_filter_html}
        """

        sections.append(section_html)

    if map_settings:
        sections.append("""          <div id='map-settings'>
            <h3 class='title'>Zemljevid spominov</h3>
            <!-- Slider Section -->
            <div style='display: flex; flex-direction: column; margin-left: 5px; margin-top: 5px; margin-bottom: 10px;'>
                <label for='photosMapSliderElement'>Obseg prikazanih slik: <span id='photosMapValueElement'/></label>
                <input id='photosMapSliderElement' max='3' min='-2' step='1' style='width: 160px;' type='range' value='initMapPhotos'/>
            </div>

            <!-- Date and Time Filters -->
            <div class='form-group'>
                <label for='dayFilterStart'>Od dne:</label>
                <input class='input-field' id='dayFilterStart' type='date'/>
            </div>
            <div class='form-group'>
                <label for='timeFilterStart'>od ure:</label>
                <input class='input-field' id='timeFilterStart' type='time'/>
            </div>
            <div class='form-group'>
                <label for='dayFilterEnd'>Do dne:</label>
                <input class='input-field' id='dayFilterEnd' type='date'/>
            </div>
            <div class='form-group'>
                <label for='timeFilterEnd'>do ure:</label>
                <input class='input-field' id='timeFilterEnd' type='time'/>
            </div>

            <!-- Daily Time Filters -->
            <div class='form-group'>
                <label for='dailyTimeFilterStart'>Med:</label>
                <input class='input-field' id='dailyTimeFilterStart' type='time' value='00:00'/>
            </div>
            <div class='form-group'>
                <label for='dailyTimeFilterEnd'>in:</label>
                <input class='input-field' id='dailyTimeFilterEnd' type='time' value='23:59'/>
            </div>

            <!-- Apply Filters Button -->
            <div class='form-group' style='display: flex; justify-content: center;'>
                <button class='pill-button' id='applyFilters'>Uporabi filtre</button>
            </div>
          </div>""")

    if not sections:
        return ""

    settings_html = "\n".join([heading] + sections)
    return f"""
    <div class="settings">
      {settings_html}
    </div>
    """
def generate_label_filter_section(feed_path):
    """
    Loads labels from a local Blogger JSON feed file and returns HTML for
    a selectable label filter section with collapsible checkboxes (play button style)
    and a Clear Filters button.
    """

    # Load local JSON feed
    with open(feed_path, "r", encoding="utf-8") as f:
        feed_data = json.load(f)

    labels_raw = [cat["term"] for cat in feed_data["feed"].get("category", [])]

    prefix_titles = {
        1: "Kategorija",
        2: "Država",
        3: "Gorstvo",
        4: "Časovno",
        5: "Ostalo",
    }

    label_groups = defaultdict(list)
    for label in labels_raw:
        match = re.match(r'^(\d+)', label)
        prefix = int(match.group(1)) if match else 99
        label_groups[prefix].append(label)

    sorted_prefixes = [p for p in sorted(label_groups.keys()) if p != 6]

    html_parts = [
        "<section class='label-filter-section' style='display: flex; flex-direction: column; margin-left: 5px; margin-top: 15px;'>"
    ]
    html_parts.append("<b>Prikaz slik iz objav z izbranimi oznakami:</b>")

    for prefix in sorted_prefixes:
        labels = sorted(label_groups[prefix], key=lambda l: l.lower())
        section_title = prefix_titles.get(prefix, "Ostalo")
        section_id = f"section_{prefix}"

        # Collapsible section with ▶ icon initially
        html_parts.append(f"""
        <div style="margin-bottom: 10px;">
            <button type="button" class="collapse-btn" 
                onclick="toggleSection('{section_id}', this)" 
                style="background:none;border:none;cursor:pointer;font-weight:bold;display:flex;align-items:center;gap:5px;">
                <span class="arrow-icon">▶</span> {section_title}
            </button>
            <div id="{section_id}" style="display:none; margin-top: 5px;">
                <ul class='label-filter-list'>
        """)

        for raw_label in labels:
            clean_label = re.sub(r'^\d+\.\s*', '', raw_label)
            html_parts.append(
                f"<li>"
                f"<label>"
                f"<input type='checkbox' class='label-filter-checkbox' data-prefix='{prefix}' value='{clean_label}'> {clean_label}"
                f"</label>"
                f"</li>"
            )

        html_parts.append("</ul></div></div>")

    # Add Clear Filters button
    html_parts.append("""
    <div style="margin-top: 10px;">
        <button type="button" id="clear-filters-btn" 
            style="background:#eee; border:1px solid #ccc; padding:5px 10px; cursor:pointer; border-radius:4px;">
            🗑️ Počisti filtre
        </button>
    </div>
    """)

    html_parts.append("</section>")

    return "\n".join(html_parts)



def generate_sidebar_html(picture_settings, map_settings, current_page):
    # Render settings section (includes conditional logic for photo player page)
    settings_html = render_sidebar_settings(picture_settings, map_settings, current_page)

    # Include labels and archive only if current page is posts or labels
    posts_sections = ""
    if current_page in ["posts", "labels", "home"]:
        posts_sections = f"""
        <div class="labels" id="navigation-placeholder">
          <script src="{BASE_SITE_URL}/assets/navigation.js"></script>
        </div>
        <div class="archive" id="archive-placeholder">
          <script src="{BASE_SITE_URL}/assets/archive.js"></script>
        </div>
        """

    # Include random image only on home page
    random_photo_sections = ""
    if current_page in ["home"]:
        random_photo_sections = f"""
        <div class="random-photo">
          <h2 class="title">Naključna fotografija</h2>
          <a href="{BASE_SITE_URL}/predvajalnik-fotografij/">
          <div class="slideshow-container">
            <!-- First image (initial) -->
            <div class="mySlides slide1" style="opacity: 1;">
              <div class="uppertext">{SLIDESHOW_COVER_UPPER_TEXT}</div>
              <img src={SLIDESHOW_COVER_IMAGE} alt="Initial Image" />
              <div class="text">{SLIDESHOW_COVER_TEXT}</div>
            </div>
            <div class="mySlides slide2">
              <div class="uppertext"></div>
              <img src="" alt="" />
              <div class="text"></div>
            </div>
          </div>
        </a>
      </div>"""

    # Full sidebar HTML
    return f"""
    <div class="sidebar-container">
      <div class="sidebar" id="sidebar">
        {random_photo_sections}
        <div class="pages">
          <aside class='sidebar-pages'>
            <h2>Strani</h2>
            <ul>
              <li><a href="{BASE_SITE_URL}">Dnevnik</a></li>
              <li><a href="{BASE_SITE_URL}/predvajalnik-fotografij/">Predvajalnik naključnih fotografij</a></li>
              <li><a href="{BASE_SITE_URL}/galerija-fotografij/">Galerija fotografij</a></li>
              <li><a href="{BASE_SITE_URL}/seznam-vrhov/">Seznam vrhov</a></li>
              <li><a href="{BASE_SITE_URL}/zemljevid-spominov/">Zemljevid spominov</a></li>
              <li><a href="{BASE_SITE_URL}/uporabne-povezave/">Uporabne povezave</a></li>
            </ul>
          </aside>
        </div>
        {settings_html}
        {posts_sections}
      </div>
    </div>
    """
def generate_header_html():
    return f"""
    <a class='logo-svg' href="{BASE_SITE_URL}" aria-label="Gorski užitki – domov">
      {BLOG_TITLE_SVG}
    </a>
    <div class="header-left">
      <button class="menu-toggle" onclick="toggleSidebar()">☰</button>
    </div>

    <div class="header-right">
      <button id="searchToggle" class="search-toggle" aria-label="Search">
        <svg xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="24" height="24"
            fill="none" stroke="#000" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </button>
      <div id="searchContainer" class="search-container">
        <input type="text" id="searchBox" placeholder="Išči objave...">

        <!-- Close button inside the search container -->
        <button id="searchClose" class="search-close" aria-label="Close search">
          ×
        </button>
      </div>
    </div>"""

def generate_footer_html():
    return f"""
  <footer class="site-footer" style="position: relative;">
    <!-- Tracker overlay -->
    <div class="tracker" style="position: absolute; top: 5px; right: 5px; z-index: 10;"></div>

    <p>
      Zagotavlja
      <a href="https://www.blogger.com" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="72 72 496 496" width="16" height="16" fill="currentColor" style="vertical-align: text-top; margin-right: -1px;">
          <!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc. -->
            <path fill="#f3891d" d="M258.4 260C263.2 255.1 264.6 254.9 294.8 254.9C322 254.9 322.9 255 326.9 257C332.7 259.9 335.2 264 335.2 270.6C335.2 276.5 332.8 280.6 327.6 284C324.8 285.8 323.1 285.9 296.5 286.1C280.1 286.2 267 285.9 265 285.3C254.7 282.4 250.9 267.6 258.4 260zM319.8 354.5C265.9 354.5 264 354.7 259.6 358.6C256.1 361.7 253.9 368 254.5 372.5C255.2 377.2 259.3 382.6 263.7 384.5C265.9 385.5 277.8 386.2 320 385.7L367.9 385.1L377.1 383.6C386.1 378.5 387.6 366.2 380.2 359.2C374.9 354.5 375.2 354.5 319.8 354.5zM543.2 484.6C539.7 513 520.2 535 492.1 542.1C484.9 543.9 482.4 544 319.2 543.9C161.4 543.9 153.3 543.8 147.2 542.1C138.8 539.9 131.6 536.6 124.9 532.1C119.3 528.3 111 520.3 107.9 515.7C104.1 510.1 99.7 500.4 97.9 493.7C96.1 487 96 484.3 96 320.3C96 157.2 96 153.7 97.8 146.6C104.1 121.9 123.7 103 149 97.4C156.3 95.8 481.1 95.5 489 97.1C510.2 101.4 526.9 114.2 536.6 133.5C544.3 148.8 543.6 132 543.9 314.1C544.1 429.9 543.9 478.6 543.2 484.6zM457.8 299.4C456.7 294.4 453.6 289.8 450.1 287.9C449 287.3 442.1 286.6 434.6 286.2C422.2 285.6 420.8 285.4 416.8 283.1C410.6 279.5 408.9 275.5 408.8 264.8C408.8 244.4 400.3 225.4 383.5 208.3C371.5 196.1 358.2 187.8 342.9 183.2C339.3 182.1 331.1 181.7 303.7 181.4C260.8 180.9 251.2 181.8 236.6 187.6C209.6 198.3 190.3 221 183.2 250C181.9 255.4 181.6 264.2 181.3 314.3C180.9 377.1 181.3 386.4 185.3 398.8C195 429.5 222.4 452.2 249.9 457.2C259.1 458.9 372.1 459.3 383.6 457.7C403.7 455 419.5 446.9 434.3 431.8C445 420.9 451.7 409 456.1 393.3C459.3 382.4 459 304.9 457.8 299.4z"/>
        </svg>
        Blogger<span style="color: #626262;">,</span>
      </a>
      poganja 
      <a href="https://github.com" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="72 72 496 496" width="16" height="16" fill="currentColor" style="vertical-align: text-top; margin-right: -1px;">
          <!--!Font Awesome Free v7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free -->
          <path fill="#f3891d" d="M237.9 461.4C237.9 463.4 235.6 465 232.7 465C229.4 465.3 227.1 463.7 227.1 461.4C227.1 459.4 229.4 457.8 232.3 457.8C235.3 457.5 237.9 459.1 237.9 461.4zM206.8 456.9C206.1 458.9 208.1 461.2 211.1 461.8C213.7 462.8 216.7 461.8 217.3 459.8C217.9 457.8 216 455.5 213 454.6C210.4 453.9 207.5 454.9 206.8 456.9zM251 455.2C248.1 455.9 246.1 457.8 246.4 460.1C246.7 462.1 249.3 463.4 252.3 462.7C255.2 462 257.2 460.1 256.9 458.1C256.6 456.2 253.9 454.9 251 455.2zM316.8 72C178.1 72 72 177.3 72 316C72 426.9 141.8 521.8 241.5 555.2C254.3 557.5 258.8 549.6 258.8 543.1C258.8 536.9 258.5 502.7 258.5 481.7C258.5 481.7 188.5 496.7 173.8 451.9C173.8 451.9 162.4 422.8 146 415.3C146 415.3 123.1 399.6 147.6 399.9C147.6 399.9 172.5 401.9 186.2 425.7C208.1 464.3 244.8 453.2 259.1 446.6C261.4 430.6 267.9 419.5 275.1 412.9C219.2 406.7 162.8 398.6 162.8 302.4C162.8 274.9 170.4 261.1 186.4 243.5C183.8 237 175.3 210.2 189 175.6C209.9 169.1 258 202.6 258 202.6C278 197 299.5 194.1 320.8 194.1C342.1 194.1 363.6 197 383.6 202.6C383.6 202.6 431.7 169 452.6 175.6C466.3 210.3 457.8 237 455.2 243.5C471.2 261.2 481 275 481 302.4C481 398.9 422.1 406.6 366.2 412.9C375.4 420.8 383.2 435.8 383.2 459.3C383.2 493 382.9 534.7 382.9 542.9C382.9 549.4 387.5 557.3 400.2 555C500.2 521.8 568 426.9 568 316C568 177.3 455.5 72 316.8 72zM169.2 416.9C167.9 417.9 168.2 420.2 169.9 422.1C171.5 423.7 173.8 424.4 175.1 423.1C176.4 422.1 176.1 419.8 174.4 417.9C172.8 416.3 170.5 415.6 169.2 416.9zM158.4 408.8C157.7 410.1 158.7 411.7 160.7 412.7C162.3 413.7 164.3 413.4 165 412C165.7 410.7 164.7 409.1 162.7 408.1C160.7 407.5 159.1 407.8 158.4 408.8zM190.8 444.4C189.2 445.7 189.8 448.7 192.1 450.6C194.4 452.9 197.3 453.2 198.6 451.6C199.9 450.3 199.3 447.3 197.3 445.4C195.1 443.1 192.1 442.8 190.8 444.4zM179.4 429.7C177.8 430.7 177.8 433.3 179.4 435.6C181 437.9 183.7 438.9 185 437.9C186.6 436.6 186.6 434 185 431.7C183.6 429.4 181 428.4 179.4 429.7z"/>
        </svg>
        GitHub
      </a>
    </p>
    <p>© 2026 Metod Langus. Vse pravice pridržane.</p>
  </footer>"""

def generate_back_to_top_html():
    return """<button id="backToTop" title="Na vrh">↑</button>"""

def generate_searchbox_html():
    return f"""
    <div id="searchResults"></div>"""

def generate_post_navigation_html(entries, slugs, index, local_tz, year, month):
    """
    Generates HTML for previous and next post navigation based on the current post index.

    Args:
        entries (list): List of feed entry dicts.
        slugs (list): List of slug strings.
        index (int): Index of the current post.
        local_tz (tzinfo): Local timezone to convert dates.
        year (str): Fallback year (usually current post's year).
        month (str): Fallback month (usually current post's month).

    Returns:
        str: HTML navigation block.
    """

    # --- Previous post ---
    if index < len(entries) - 1:
        prev_entry = entries[index + 1]
        prev_title = prev_entry.get("title", {}).get("$t", "")
        prev_slug = slugs[index + 1]
        _, prev_year, prev_month = parse_entry_date(prev_entry, index=index + 1)
    else:
        prev_slug = prev_title = prev_year = prev_month = ""

    # --- Next post ---
    if index > 0:
        next_entry = entries[index - 1]
        next_title = next_entry.get("title", {}).get("$t", "")
        next_slug = slugs[index - 1]
        _, next_year, next_month = parse_entry_date(next_entry, index=index - 1)
    else:
        next_slug = next_title = next_year = next_month = ""

    # --- HTML navigation block ---
    nav_html = """
    <div class="nav-links-wrapper">
      <div class="nav-links">
    """

    if prev_slug:
        nav_html += f"""
        <div class="prev-link">
          <div class="pager-title">Prejšnja objava</div>
          <a href="{BASE_SITE_URL}/posts/{prev_year}/{prev_month}/{prev_slug}/">&larr; {prev_title}</a>
        </div>
        """

    if next_slug:
        nav_html += f"""
        <div class="next-link">
          <div class="pager-title">Naslednja objava</div>
          <a href="{BASE_SITE_URL}/posts/{next_year}/{next_month}/{next_slug}/">{next_title} &rarr;</a>
        </div>
        """

    nav_html += """
      </div>
    </div>
    """

    return nav_html

def generate_labels_html(entry, title, slug, year, month, formatted_date, post_id, label_posts_raw,
                         slugify, remove_first_prefix, remove_all_prefixes):
    labels_raw = []
    labels_html = "<div class='post-labels'><em>No labels</em></div>"

    if "category" in entry and isinstance(entry["category"], list):
        for cat in entry["category"]:
            label_raw = cat.get("term", "")
            labels_raw.append(label_raw)

            # Store raw-labeled post
            label_posts_raw[label_raw].append({
                "title": title,
                "slug": slug,
                "year": year,
                "month": month,
                "date": formatted_date,
                "postId": post_id
            })

        if labels_raw:
            label_links = []
            for label_raw in labels_raw:
                slug_part = remove_first_prefix(label_raw)
                label_url = f"{BASE_SITE_URL}/search/labels/{slugify(slug_part)}/"
                label_text = remove_all_prefixes(label_raw)
                label_links.append(f"<a class='my-labels' href='{label_url}'>{label_text}</a>")
            labels_html = "<div class='post-labels'>" + " ".join(label_links) + "</div>"

    return labels_html

def generate_homepage_html(entries):
    """Generates complete HTML <article> containers with Blogger-style pagination."""
    homepage_html = ""

    for i, entry in enumerate(entries):
        full_id = entry.get("id", {}).get("$t", "")
        match = re.search(r'post-(\d+)$', full_id)
        post_id = match.group(1) if match else ""

        if not post_id:
            print(f"Warning: Post at index {i} missing valid 'postId'")
            continue

        homepage_html += render_post_html(entry, i, entries_per_page, slugify, post_id)

    return homepage_html

# Helper to remove just the first prefix
def remove_first_prefix(label):
    return re.sub(r"^\d+\.\s*", "", label)

# Helper to remove all numeric prefixes
def remove_all_prefixes(label):
    return re.sub(r"^(?:\d+\.\s*)+", "", label)

def indent_xml(elem, level=0):
    """Pretty-print XML."""
    i = "\n" + "   " * level
    if len(elem):
        if not elem.text or not elem.text.strip():
            elem.text = i + "   "
        for child in elem:
            indent_xml(child, level + 1)
            if not child.tail or not child.tail.strip():
                child.tail = i
    if level and (not elem.tail or not elem.tail.strip()):
        elem.tail = i
    return elem

def generate_url_element(loc, lastmod=None, changefreq=None, priority=None):
    """Create a <url> element for sitemap."""
    url = Element("url")
    SubElement(url, "loc").text = loc
    if changefreq:
        SubElement(url, "changefreq").text = changefreq
    if priority:
        SubElement(url, "priority").text = str(priority)
    if lastmod:
        SubElement(url, "lastmod").text = lastmod
    return url

def generate_sitemap_from_folder(folder_path: Path, exclude_dirs=None, exclude_files=None):
    """
    Generate sitemap.xml by scanning all .html files in folder_path,
    excluding directories in exclude_dirs and files in exclude_files.
    """
    if exclude_dirs is None:
        exclude_dirs = []
    if exclude_files is None:
        exclude_files = []

    lastmod_db = load_lastmod_db()
    new_lastmod_db = {}  # Collect updated entries

    urlset = Element("urlset", {"xmlns": "http://www.sitemaps.org/schemas/sitemap/0.9"})

    for html_file in folder_path.rglob("*.html"):
        relative_path = html_file.relative_to(folder_path).as_posix()

        # Skip excluded directories
        if any(f"{excl}/" in relative_path for excl in exclude_dirs):
            continue

        # Skip excluded files
        if relative_path in exclude_files:
            continue

        # Compute hash & lastmod
        md5 = compute_md5(html_file)
        key = relative_path

        if key in lastmod_db and lastmod_db[key]["md5"] == md5:
            # Unchanged → keep old lastmod
            lastmod = lastmod_db[key]["lastmod"]
        else:
            # Changed → update time
            lastmod = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

        # Persist entry so next run can compare correctly
        new_lastmod_db[key] = {
            "md5": md5,
            "lastmod": lastmod
        }

        # Build URL (remove index.html) ----------
        if relative_path.endswith("index.html"):
            clean_path = relative_path[:-len("index.html")]
            url = f"{BASE_SITE_URL}/{clean_path}".rstrip("/") + "/"
        else:
            url = f"{BASE_SITE_URL}/{relative_path}"

        # Determine priority
        parts = Path(relative_path).parts

        if parts[-1] == "index.html" and len(parts) <= 2:
            priority = 1                       # Root index or one level deep index.html
        elif "posts" in parts:
            priority = 1                       # Any posts file
        elif parts[0] == "search":
            priority = 0.8                     # search/ directory
        elif len(parts) == 1 and parts[0] != "index.html":
            priority = 0.6                     # other root HTML files
        else:
            priority = 0.5                     # fallback default

        changefreq = "monthly"

        # Convert lastmod to date-only for sitemap (YYYY-MM-DD)
        sitemap_lastmod = lastmod.split("T", 1)[0]

        urlset.append( generate_url_element(url, lastmod=sitemap_lastmod, changefreq=changefreq, priority=priority))

    # Save updated DB
    save_lastmod_db(new_lastmod_db)

    # Pretty-print & write XML
    indent_xml(urlset)
    ElementTree(urlset).write(SITEMAP_FILE, encoding="UTF-8", xml_declaration=True)
    print(f"Generated sitemap: {SITEMAP_FILE}")

def submit_changed_files_to_indexnow(folder_path: Path,
                                     exclude_dirs=None,
                                     exclude_files=None,
                                     index: bool = True):
    """
    Compare local HTML MD5 checksums with remote DB.
    Submit changed URLs to IndexNow only if index=True.
    Always update local lastmod.json.
    """
    if exclude_dirs is None:
        exclude_dirs = []
    if exclude_files is None:
        exclude_files = []

    try:
        os.sync()
    except AttributeError:
        pass
    time.sleep(0.1)

    # Load remote published DB
    try:
        r = requests.get(REMOTE_DB_URL, timeout=10)
        r.raise_for_status()
        remote_db = r.json() or {}
    except Exception:
        print("WARNING: Could not load remote lastmod DB.")
        remote_db = {}

    new_lastmod_db = {}
    changed_urls = []
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    def comparison_keys(rel_path: str):
        # index.html → check both file and folder
        if rel_path.endswith("index.html"):
            folder_key = rel_path[:-10]  # remove index.html
            if not folder_key.endswith("/"):
                folder_key += "/"
            file_key = rel_path
            url = f"{BASE_SITE_URL}/{folder_key}"
            return [file_key, folder_key], url, file_key

        # normal file
        return [rel_path], f"{BASE_SITE_URL}/{rel_path}", rel_path

    # Scan all html files
    for html_file in folder_path.rglob("*.html"):
        rel = html_file.relative_to(folder_path).as_posix()

        if any(f"{d}/" in rel for d in exclude_dirs):
            continue
        if rel in exclude_files:
            continue

        md5 = compute_md5(html_file)
        keys_to_check, url_to_submit, storage_key = comparison_keys(rel)

        # Remote record
        old_md5 = None
        old_lastmod = None
        for k in keys_to_check:
            if k in remote_db:
                old_md5 = remote_db[k].get("md5")
                old_lastmod = remote_db[k].get("lastmod")
                break

        # Compare
        if old_md5 == md5 and old_md5 is not None:
            lastmod = old_lastmod or now
        else:
            lastmod = now
            changed_urls.append(url_to_submit)

        # Save entry
        new_lastmod_db[storage_key] = {"md5": md5, "lastmod": lastmod}

    # Submit changed URLs only if index=True
    if index and changed_urls:
        payload = {
            "host": BASE_SITE_URL.replace("https://", "").replace("http://", ""),
            "key": KEY,
            "keyLocation": KEY_LOCATION,
            "urlList": changed_urls
        }
        try:
            resp = requests.post(INDEXNOW_ENDPOINT, json=payload, timeout=15)
            print(f"IndexNow: submitted {len(changed_urls)} URLs – status {resp.status_code}")
        except Exception as e:
            print("ERROR submitting to IndexNow:", e)
    else:
        print("No IndexNow submission (either index=False or no changes).")

    save_lastmod_db(new_lastmod_db)

def fetch_and_save_all_posts(entries):
    # HTML sections
    sidebar_html = generate_sidebar_html(picture_settings=True, map_settings=False, current_page="posts")
    header_html = generate_header_html()
    searchbox_html = generate_searchbox_html()
    footer_html = generate_footer_html()
    back_to_top_html = generate_back_to_top_html()

    local_tz = ZoneInfo("Europe/Ljubljana")
    label_posts_raw = defaultdict(list)

    # Generate unique slugs for all entries
    slugs = generate_unique_slugs(entries, local_tz)

    for index, entry in enumerate(entries):  # Only first 5 entries entries[:5]
        title = entry.get("title", {}).get("$t", f"untitled-{index}")
        content_html = entry.get("content", {}).get("$t", "")
        slug = slugs[index]

        full_id = entry.get("id", {}).get("$t", "")
        post_id = full_id.split("post-")[-1] if "post-" in full_id else ""
        author = entry.get("author", {}).get("name", {}).get("$t", "")

        # Parse published date
        formatted_date, year, month = parse_entry_date(entry, index)
        dt_published = datetime.fromisoformat(formatted_date)
        published_time = dt_published.replace(microsecond=0).isoformat()

        # Parse modified date
        updated_raw = entry.get("updated", {}).get("$t", formatted_date)
        dt_modified = datetime.fromisoformat(updated_raw)
        mod_date = dt_modified.replace(microsecond=0).isoformat()

        # Replace custom post containers
        content_html = replace_mypost_scripts_with_rendered_posts(
            content_html,
            entries,
            entries_per_page=0,
            slugify_func=slugify,
            render_func=render_post_html
        )

        # Fix images for lightbox
        content_html = fix_images_for_lightbox(content_html, title)

        # Extract first image for Open Graph
        soup = BeautifulSoup(content_html, "html.parser")
        first_img_tag = soup.find("img")
        og_image = first_img_tag["src"] if first_img_tag else DEFAULT_OG_IMAGE

        # Extract description
        def normalize(text): return ' '.join(text.split()).strip().lower()
        unwanted = [normalize("Summary, only on the post-container view."),
                    normalize("Kaj češ lepšega, kot biti v naravi.")]
        summary_tag = soup.find("summary")
        if summary_tag and normalize(summary_tag.get_text()) not in unwanted:
            description = " ".join(summary_tag.get_text().split())
        else:
            meta_tag = soup.find("meta", attrs={"name": "description"})
            if meta_tag and normalize(meta_tag.get("content", "")) not in unwanted:
                description = " ".join(meta_tag.get("content", "").split())
            else:
                description = title

        # Remove hidden/technical blocks before further processing
        content_html = remove_leading_hidden_blocks(content_html)

        og_url = f"{BASE_SITE_URL}/posts/{year}/{month}/{slug}/"
        metadata_html = f"<div class='post-date' data-date='{formatted_date}'></div>"

        # Navigation and labels
        nav_html = generate_post_navigation_html(entries, slugs, index, local_tz, year, month)
        labels_html = generate_labels_html(entry, title, slug, year, month, formatted_date, post_id,
                                           label_posts_raw, slugify, remove_first_prefix, remove_all_prefixes)

        # Open Graph and tags
        categories = [c.get("term", "") for c in entry.get("category", [])]

        # Function to remove numeric prefixes like '1. ', '2. ', etc.
        def strip_prefix(cat):
            return cat.split(". ", 1)[-1] if ". " in cat else cat

        # Apply the prefix removal
        categories_clean = [strip_prefix(c) for c in categories]

        # Section is first category, tags are the rest
        section = categories_clean[0] if categories_clean else ""
        tags = categories_clean[1:] if len(categories_clean) > 1 else []

        og_meta_html = f"""<meta property="og:title" content="{title}">
  <meta property="og:type" content="article">
  <meta property="og:image" content="{og_image}">
  <meta property="og:url" content="{og_url}">
  <meta property="og:description" content="{description}">
  <meta property="og:site_name" content="{BLOG_TITLE}">
  <meta property="og:locale" content="sl_SI">
  <meta property="article:published_time" content="{published_time}">
  <meta property="article:modified_time" content="{mod_date}">
  <meta property="article:author" content="{author}">
  <meta property="article:section" content="{section}">
"""
        for tag in tags:
            og_meta_html += f'  <meta property="article:tag" content="{tag}">\n'

        # Generate keywords from <div class="peak-tag">
        peak_divs = soup.find_all("div", class_="peak-tag")
        keywords_list = []
        for div in peak_divs:
            text = " ".join(div.get_text(separator=",").split())
            if text:
                # Remove extra spaces, then split by comma
                parts = [p.strip() for p in text.split(",") if p.strip()]
                keywords_list.extend(parts)
        # Append blog title and author as keywords
        keywords_list.extend([BLOG_TITLE, BLOG_AUTHOR])
        keywords = ", ".join(keywords_list) if keywords_list else f"{BLOG_TITLE}, {BLOG_AUTHOR}"

        # Schema.org JSON-LD
        schema_jsonld = f"""<script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "mainEntityOfPage": {{
      "@type": "WebPage",
      "@id": "{og_url}"
    }},
    "headline": "{title}",
    "image": ["{og_image}"],
    "author": {{
      "@type": "Person",
      "name": "{BLOG_AUTHOR}"
    }},
    "publisher": {{
      "@type": "Person",
      "name": "{BLOG_TITLE}",
      "logo": {{
        "@type": "ImageObject",
        "url": "{BASE_SITE_URL}/photos/favicon.ico"
      }}
    }},
    "datePublished": "{published_time}",
    "dateModified": "{mod_date}",
    "description": "{description}",
    "url": "{og_url}",
    "inLanguage": "sl"
  }}
  </script>"""

        # Breadcrumb JSON-LD
        breadcrumb_json_ld = f"""<script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {{
        "@type": "ListItem",
        "position": 1,
        "name": "Dnevnik",
        "item": "{BASE_SITE_URL}/"
      }},
      {{
        "@type": "ListItem",
        "position": 2,
        "name": "{section}",
        "item": "{BASE_SITE_URL}/search/labels/{slugify(section)}/"
      }},
      {{
        "@type": "ListItem",
        "position": 3,
        "name": "{title}"
      }}
    ]
  }}
  </script>"""

        # GitHub Comments (Utterances)
        comments_html = f"""
      <section id="comments">
        <h2>Komentarji</h2>
        <script src="https://utteranc.es/client.js"
          repo="{GITHUB_USER_NAME}/{GITHUB_REPO_NAME}"
          issue-term="pathname"
          theme="github-light"
          crossorigin="anonymous"
          async>
        </script>
      </section>"""

        # Create nested folder and save as index.html
        post_dir = OUTPUT_DIR / "posts" / year / month / slug
        post_dir.mkdir(parents=True, exist_ok=True)
        filename = post_dir / "index.html"

        with open(filename, "w", encoding="utf-8") as f:
            f.write(f"""<!DOCTYPE html>
<html lang="sl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="google-site-verification" content="{SITE_VERIFICATION}" />
  <meta name="description" content="{description}" />
  <meta name="keywords" content="gorske avanture, pohodništvo, gore, fotografije, narava, prosti čas, {BLOG_TITLE}, {BLOG_AUTHOR}, {keywords}" />
  <meta name="author" content="{BLOG_AUTHOR}" />
  <meta name="robots" content="max-image-preview:large">

  <title>{title} | {BLOG_TITLE}</title>
  <link rel="canonical" href="{og_url}">
  <link rel="alternate" href="{og_url}" hreflang="sl" />
  <link rel="alternate" href="{BASE_SITE_URL}" hreflang="x-default" />

  <!-- Sitemap reference -->
  <link rel="sitemap" type="application/xml" title="Sitemap" href="https://metodlangus.github.io/sitemap.xml">

  {og_meta_html}
  <script>
    var postTitle = {title!r};
    var postId = {post_id!r};
    var author = {author!r};
  </script>

  {schema_jsonld}

  {breadcrumb_json_ld}

  <!-- Favicon -->
  <link rel="icon" href="{BASE_SITE_URL}/photos/favicon.ico" type="image/x-icon">

  <!-- Fonts & CSS -->
  <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;700&family=Open+Sans&display=swap" rel="stylesheet">
  <link href='https://metodlangus.github.io/plugins/leaflet/1.7.1/leaflet.min.css' rel='stylesheet'>
  <link href='https://metodlangus.github.io/plugins/@raruto/leaflet-elevation/dist/leaflet-elevation.min.css' rel='stylesheet'>
  <link href='https://metodlangus.github.io/plugins/leaflet-fullscreen/v1.0.1/leaflet.fullscreen.css' rel='stylesheet'>
  <link href='https://metodlangus.github.io/scripts/leaflet-download-gpx-button.css' rel='stylesheet'>
  <link href='https://metodlangus.github.io/plugins/lightbox2/2.11.1/css/lightbox.min.css' rel='stylesheet'>
  <link href='https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css' rel='stylesheet'>
  <link href='https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css' rel='stylesheet'>
  <link href='https://cdn.jsdelivr.net/npm/leaflet-control-geocoder@3.1.0/dist/Control.Geocoder.min.css' rel='stylesheet'>
  <link rel="stylesheet" href="{BASE_SITE_URL}/assets/Main.css">
  <link rel="stylesheet" href="{BASE_SITE_URL}/assets/MyMapScript.css">
  <link rel="stylesheet" href="{BASE_SITE_URL}/assets/MySlideshowScript.css">
  <link rel="stylesheet" href="{BASE_SITE_URL}/assets/MyPostContainerScript.css">
</head>

<body>
  <div class="page-wrapper">
    <!-- Top Header -->
    <header class="top-header">
      {header_html}
    </header>

    <!-- Main Layout -->
    <div class="main-layout">
      {sidebar_html}
      <div class="content-wrapper">
        {searchbox_html}
        <h1>{title}</h1>
        {metadata_html}
        <p class="visually-hidden">
          {description}
        </p>
        {content_html}
        {labels_html}
        {nav_html}
        {comments_html}
      </div>
    </div>
  </div>

  <!-- Footer -->
  {back_to_top_html}
  {footer_html}

  <script src='https://metodlangus.github.io/plugins/leaflet/1.7.1/leaflet.min.js'></script>
  <script src='https://metodlangus.github.io/plugins/togeojson/0.16.0/togeojson.min.js'></script>
  <script src='https://metodlangus.github.io/plugins/leaflet-gpx/1.6.0/gpx.min.js'></script>
  <script src='https://metodlangus.github.io/plugins/@raruto/leaflet-elevation/dist/leaflet-elevation.min.js'></script>
  <script src='https://metodlangus.github.io/plugins/leaflet-fullscreen/v1.0.1/Leaflet.fullscreen.min.js'></script>
  <script src='https://metodlangus.github.io/plugins/leaflet-polylinedecorator/1.1.0/leaflet.polylineDecorator.min.js'></script>
  <script src='https://metodlangus.github.io/scripts/leaflet-download-gpx-button.js'></script>
  <script src='https://metodlangus.github.io/plugins/lightbox2/2.11.1/js/lightbox-plus-jquery.min.js'></script>
  <script src='https://metodlangus.github.io/scripts/full_img_size_button.js'></script>
  <script src='https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js'></script>
  <script src='https://cdn.jsdelivr.net/npm/leaflet-control-geocoder@3.1.0/dist/Control.Geocoder.min.js'></script>
  <script src="{BASE_SITE_URL}/assets/Main.js" defer></script>
  <script src="{BASE_SITE_URL}/assets/MyMapScript.js" defer></script>
  <script src="{BASE_SITE_URL}/assets/MySlideshowScript.js" defer></script>
</body>
</html>""")

        print(f"Saved: {filename}")

    return label_posts_raw


def generate_label_pages(entries, label_posts_raw):
    labels_dir = OUTPUT_DIR / "search/labels"
    labels_dir.mkdir(parents=True, exist_ok=True)

    sidebar_html = generate_sidebar_html(picture_settings=False, map_settings=False, current_page="labels")
    header_html = generate_header_html()
    searchbox_html = generate_searchbox_html()
    footer_html = generate_footer_html()
    back_to_top_html = generate_back_to_top_html()

    # Build lookup dictionary
    entry_lookup = {}
    for entry in entries:
        full_id = entry.get("id", {}).get("$t", "")
        match = re.search(r'post-(\d+)$', full_id)
        post_id = match.group(1) if match else ""
        if post_id:
            entry_lookup[post_id] = entry

    for label, posts in label_posts_raw.items():
        label_slug = slugify(remove_first_prefix(label))
        label_clean = re.sub(r"^(?:\d+\.\s*)+", "", label)

        # Create folder for each label page
        label_dir = labels_dir / label_slug
        label_dir.mkdir(parents=True, exist_ok=True)
        filename = label_dir / "index.html"

        # Sort posts by date descending
        posts_sorted = sorted(posts, key=lambda x: x['date'], reverse=True)

        post_scripts_html = ""
        for i, post in enumerate(posts_sorted):
            post_id = str(post.get('postId', '')).strip()
            if not post_id:
                print(f"Warning: Post at index {i} missing 'postId'")
                continue

            entry = entry_lookup.get(post_id)
            if not entry:
                print(f"Warning: Entry with postId {post_id} not found in entries")
                continue

            post_scripts_html += render_post_html(entry, i, entries_per_page, slugify, post_id)

        # --- Schema.org structured data (JSON-LD)
        schema_jsonld = f"""<script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Prikaz objav z oznako: {label_clean}",
    "url": "{BASE_SITE_URL}/search/labels/{label_slug}/",
    "description": "Prikaz objav z oznako: {label_clean} - gorske avanture in nepozabni trenutki.",
    "inLanguage": "sl",
    "isPartOf": {{
      "@type": "WebSite",
      "name": "{BLOG_TITLE}",
      "url": "{BASE_SITE_URL}/"
    }},
    "publisher": {{
      "@type": "Person",
      "name": "{BLOG_AUTHOR}",
      "url": "{BASE_SITE_URL}/"
    }}
  }}
  </script>"""

        html_content = f"""<!DOCTYPE html>
<html lang="sl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="google-site-verification" content="{SITE_VERIFICATION}" />
  <meta name="description" content="Prikaz objav z oznako: {label_clean} - gorske avanture in nepozabni trenutki." />
  <meta name="keywords" content="gorske avanture, pohodništvo, gore, fotografije, narava, prosti čas, {BLOG_TITLE}, {BLOG_AUTHOR}, {label_clean}" />
  <meta name="author" content="{BLOG_AUTHOR}" />

  <meta property="og:title" content="Prikaz objav z oznako: {label_clean}" />
  <meta property="og:description" content="Prikaz objav z oznako: {label_clean} - gorske avanture in nepozabni trenutki." />
  <meta property="og:image" content="{DEFAULT_OG_IMAGE}" />
  <meta property="og:image:alt" content="Prikaz objav z oznako: {label_clean}" />
  <meta property="og:url" content="{BASE_SITE_URL}/search/labels/{label_slug}/" />
  <meta property="og:type" content="website" />

  <title>Prikaz objav z oznako: {label_clean} | {BLOG_TITLE}</title>

  <!-- Canonical & hreflang -->
  <link rel="canonical" href="{BASE_SITE_URL}/search/labels/{label_slug}/" />
  <link rel="alternate" href="{BASE_SITE_URL}/search/labels/{label_slug}/" hreflang="sl" />
  <link rel="alternate" href="{BASE_SITE_URL}" hreflang="x-default" />

  {schema_jsonld}

  <!-- Favicon -->
  <link rel="icon" href="{BASE_SITE_URL}/photos/favicon.ico" type="image/x-icon">

  <!-- Fonts & CSS -->
  <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;700&family=Open+Sans&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{BASE_SITE_URL}/assets/Main.css">
  <link rel="stylesheet" href="{BASE_SITE_URL}/assets/MyPostContainerScript.css">
</head>

<body>
  <div class="page-wrapper">
    <!-- Top Header -->
    <header class="top-header">
      {header_html}
    </header>

    <!-- Main Layout -->
    <div class="main-layout">
      {sidebar_html}
      <div class="content-wrapper">
        {searchbox_html}
        <h1>Prikaz objav z oznako: {label_clean}</h1>
        <div class="blog-posts hfeed container">
          {post_scripts_html}
        </div>
        <div id="blog-pager" class="blog-pager"></div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  {back_to_top_html}
  {footer_html}

  <script src="{BASE_SITE_URL}/assets/Main.js" defer></script>
</body>
</html>"""

        with open(filename, "w", encoding="utf-8") as f:
            f.write(html_content)

        print(f"Generated label page: {filename}")


def generate_archive_pages(entries):
    """
    Generates yearly and monthly archive pages with posts sorted by date.
    """
    from collections import defaultdict

    # Slovene month names
    month_names_sl = {
        "01": "januar",
        "02": "februar",
        "03": "marec",
        "04": "april",
        "05": "maj",
        "06": "junij",
        "07": "julij",
        "08": "avgust",
        "09": "september",
        "10": "oktober",
        "11": "november",
        "12": "december"
    }

    # Prepare HTML snippets
    sidebar_html = generate_sidebar_html(picture_settings=False, map_settings=False, current_page="posts")
    header_html = generate_header_html()
    searchbox_html = generate_searchbox_html()
    footer_html = generate_footer_html()
    back_to_top_html = generate_back_to_top_html()

    local_tz = ZoneInfo("Europe/Ljubljana")
    # Organize posts by year and month
    archive_dict = defaultdict(lambda: defaultdict(list))

    slugs = generate_unique_slugs(entries, local_tz)

    for index, entry in enumerate(entries):
        title = entry.get("title", {}).get("$t", f"untitled-{index}")
        full_id = entry.get("id", {}).get("$t", "")
        post_id = full_id.split("post-")[-1] if "post-" in full_id else ""
        formatted_date, year, month = parse_entry_date(entry, index)
        month_str = f"{int(month):02}"  # Ensure two digits
        archive_dict[year][month_str].append({
            "entry": entry,
            "slug": slugs[index],
            "date": formatted_date,
            "post_id": post_id
        })

    # Generate yearly and monthly pages
    for year, months in archive_dict.items():
        # --- Year page ---
        year_dir = OUTPUT_DIR / "posts" / year
        year_dir.mkdir(parents=True, exist_ok=True)
        year_filename = year_dir / "index.html"

        # Flatten all posts for the year
        year_posts = []
        for month in sorted(months.keys(), reverse=True):
            for post_info in sorted(months[month], key=lambda x: x['date'], reverse=True):
                year_posts.append(post_info)

        year_posts_html = ""
        for i, post_info in enumerate(year_posts):
            year_posts_html += render_post_html(post_info["entry"], i, entries_per_page, slugify, post_info["post_id"])

        # --- Schema.org structured data (JSON-LD)
        schema_jsonld = f"""<script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Prikaz objav, dodanih na: {year}",
    "url": "{BASE_SITE_URL}/posts/{year}/",
    "description": "Prikaz objav, dodanih na: {year} - gorske avanture in nepozabni trenutki.",
    "inLanguage": "sl",
    "isPartOf": {{
      "@type": "WebSite",
      "name": "{BLOG_TITLE}",
      "url": "{BASE_SITE_URL}/"
    }},
    "publisher": {{
      "@type": "Person",
      "name": "{BLOG_AUTHOR}",
      "url": "{BASE_SITE_URL}/"
    }}
  }}
  </script>"""

        html_year = f"""<!DOCTYPE html>
<html lang="sl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="google-site-verification" content="{SITE_VERIFICATION}" />
  <meta name="description" content="Prikaz objav, dodanih na: {year} - gorske avanture in nepozabni trenutki." />
  <meta name="keywords" content="gorske avanture, pohodništvo, gore, fotografije, narava, prosti čas, {BLOG_TITLE}, {BLOG_AUTHOR}, {year}" />
  <meta name="author" content="{BLOG_AUTHOR}" />

  <meta property="og:title" content="Prikaz objav, dodanih na: {year}" />
  <meta property="og:description" content="Prikaz objav, dodanih na: {year} - gorske avanture in nepozabni trenutki." />
  <meta property="og:image" content="{DEFAULT_OG_IMAGE}" />
  <meta property="og:image:alt" content="Prikaz objav, dodanih na: {year}" />
  <meta property="og:url" content="{BASE_SITE_URL}/posts/{year}/" />
  <meta property="og:type" content="website" />

  <title>Prikaz objav, dodanih na: {year} | {BLOG_TITLE}</title>

  <!-- Canonical & hreflang -->
  <link rel="canonical" href="{BASE_SITE_URL}/posts/{year}/" />
  <link rel="alternate" href="{BASE_SITE_URL}/posts/{year}/" hreflang="sl" />
  <link rel="alternate" href="{BASE_SITE_URL}" hreflang="x-default" />

  {schema_jsonld}

  <!-- Favicon -->
  <link rel="icon" href="{BASE_SITE_URL}/photos/favicon.ico" type="image/x-icon">

  <!-- Fonts & CSS -->
  <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;700&family=Open+Sans&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{BASE_SITE_URL}/assets/Main.css">
  <link rel="stylesheet" href="{BASE_SITE_URL}/assets/MyPostContainerScript.css">
</head>
<body>
  <div class="page-wrapper">
    <!-- Top Header -->
    <header class="top-header">
      {header_html}
    </header>

    <!-- Main Layout -->
    <div class="main-layout">
      {sidebar_html}
      <div class="content-wrapper">
        {searchbox_html}
        <h1>Prikaz objav, dodanih na: {year}</h1>
        <div class="blog-posts hfeed container">
          {year_posts_html}
        </div>
        <div id="blog-pager" class="blog-pager"></div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  {back_to_top_html}
  {footer_html}

  <script src="{BASE_SITE_URL}/assets/Main.js" defer></script>
</body>
</html>"""

        with open(year_filename, "w", encoding="utf-8") as f:
            f.write(html_year)
        print(f"Generated year archive page: {year_filename}")

        # --- Month pages ---
        for month, posts in months.items():
            month_dir = year_dir / month
            month_dir.mkdir(parents=True, exist_ok=True)
            month_filename = month_dir / "index.html"

            month_name_sl = month_names_sl.get(month, month)  # Slovene month name

            month_posts_sorted = sorted(posts, key=lambda x: x['date'], reverse=True)
            month_posts_html = ""
            for i, post_info in enumerate(month_posts_sorted):
                month_posts_html += render_post_html(post_info["entry"], i, entries_per_page, slugify, post_info["post_id"])

            # --- Schema.org structured data (JSON-LD)
            schema_jsonld = f"""<script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Prikaz objav, dodanih na: {month_name_sl}, {year}",
    "url": "{BASE_SITE_URL}/posts/{year}/{month}/",
    "description": "Prikaz objav, dodanih na: {month_name_sl}, {year} - gorske avanture in nepozabni trenutki.",
    "inLanguage": "sl",
    "isPartOf": {{
      "@type": "WebSite",
      "name": "{BLOG_TITLE}",
      "url": "{BASE_SITE_URL}/"
    }},
    "publisher": {{
      "@type": "Person",
      "name": "{BLOG_AUTHOR}",
      "url": "{BASE_SITE_URL}/"
    }}
  }}
  </script>"""

            html_month = f"""<!DOCTYPE html>
<html lang="sl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="google-site-verification" content="{SITE_VERIFICATION}" />
  <meta name="description" content="Prikaz objav, dodanih na: {month_name_sl}, {year} - gorske avanture in nepozabni trenutki." />
  <meta name="keywords" content="gorske avanture, pohodništvo, gore, fotografije, narava, prosti čas, {BLOG_TITLE}, {BLOG_AUTHOR}, {month_name_sl}, {year}" />
  <meta name="author" content="{BLOG_AUTHOR}" />

  <meta property="og:title" content="Prikaz objav, dodanih na: {month_name_sl}, {year}" />
  <meta property="og:description" content="Prikaz objav, dodanih na: {month_name_sl}, {year} - gorske avanture in nepozabni trenutki." />
  <meta property="og:image" content="{DEFAULT_OG_IMAGE}" />
  <meta property="og:image:alt" content="Prikaz objav, dodanih na: {month_name_sl}, {year}" />
  <meta property="og:url" content="{BASE_SITE_URL}/posts/{year}/{month}/" />
  <meta property="og:type" content="website" />

  <title>Prikaz objav, dodanih na: {month_name_sl}, {year} | {BLOG_TITLE}</title>

  <!-- Canonical & hreflang -->
  <link rel="canonical" href="{BASE_SITE_URL}/posts/{year}/{month}/" />
  <link rel="alternate" href="{BASE_SITE_URL}/posts/{year}/{month}/" hreflang="sl" />
  <link rel="alternate" href="{BASE_SITE_URL}" hreflang="x-default" />

  {schema_jsonld}

  <!-- Favicon -->
  <link rel="icon" href="{BASE_SITE_URL}/photos/favicon.ico" type="image/x-icon">

  <!-- Fonts & CSS -->
  <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;700&family=Open+Sans&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{BASE_SITE_URL}/assets/Main.css">
  <link rel="stylesheet" href="{BASE_SITE_URL}/assets/MyPostContainerScript.css">
</head>
<body>
  <div class="page-wrapper">
    <!-- Top Header -->
    <header class="top-header">
      {header_html}
    </header>

    <!-- Main Layout -->
    <div class="main-layout">
      {sidebar_html}
      <div class="content-wrapper">
        {searchbox_html}
        <h1>Prikaz objav, dodanih na: {month_name_sl}, {year}</h1>
        <div class="blog-posts hfeed container">
          {month_posts_html}
        </div>
        <div id="blog-pager" class="blog-pager"></div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  {back_to_top_html}
  {footer_html}

  <script src="{BASE_SITE_URL}/assets/Main.js" defer></script>
</body>
</html>"""

            with open(month_filename, "w", encoding="utf-8") as f:
                f.write(html_month)
            print(f"Generated month archive page: {month_filename}")


def generate_predvajalnik_page(current_page):
    output_dir = OUTPUT_DIR / "predvajalnik-fotografij"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "index.html"

    sidebar_html = generate_sidebar_html(picture_settings=True, map_settings=False, current_page=current_page)
    header_html = generate_header_html()
    searchbox_html = generate_searchbox_html()
    footer_html = generate_footer_html()
    back_to_top_html = generate_back_to_top_html()

    # --- Schema.org structured data (JSON-LD)
    schema_jsonld = f"""<script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Predvajalnik naključnih fotografij",
    "url": "{BASE_SITE_URL}/predvajalnik-fotografij/",
    "description": "Predvajalnik naključnih fotografij gorskih avantur in nepozabnih trenutkov.",
    "inLanguage": "sl",
    "isPartOf": {{
      "@type": "WebSite",
      "name": "{BLOG_TITLE}",
      "url": "{BASE_SITE_URL}/"
    }},
    "publisher": {{
      "@type": "Person",
      "name": "{BLOG_AUTHOR}",
      "url": "{BASE_SITE_URL}/"
    }},
    "potentialAction": {{
      "@type": "SearchAction",
      "target": "{BASE_SITE_URL}/search?q={{search_term_string}}",
      "query-input": "required name=search_term_string"
    }}
  }}
  </script>"""

    html_content = f"""<!DOCTYPE html>
<html lang="sl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="google-site-verification" content="{SITE_VERIFICATION}" />
  <meta name="description" content="Predvajalnik naključnih fotografij gorskih avantur in nepozabnih trenutkov." />
  <meta name="keywords" content="gorske avanture, pohodništvo, gore, fotografije, narava, prosti čas, {BLOG_TITLE}, {BLOG_AUTHOR}, predvajalnik fotografij, naključne slike, razgledi" />
  <meta name="author" content="{BLOG_AUTHOR}" />

  <meta property="og:title" content="Predvajalnik naključnih fotografij" />
  <meta property="og:description" content="Predvajalnik naključnih fotografij gorskih avantur in nepozabnih trenutkov." />
  <meta property="og:image" content="{DEFAULT_OG_IMAGE}" />
  <meta property="og:image:alt" content="Gorski razgledi in narava v slikah" />
  <meta property="og:url" content="{BASE_SITE_URL}/predvajalnik-fotografij/" />
  <meta property="og:type" content="website" />

  <title>Predvajalnik naključnih fotografij | {BLOG_TITLE}</title>

  <!-- Canonical & hreflang -->
  <link rel="canonical" href="{BASE_SITE_URL}/predvajalnik-fotografij/" />
  <link rel="alternate" href="{BASE_SITE_URL}/predvajalnik-fotografij/" hreflang="sl" />
  <link rel="alternate" href="{BASE_SITE_URL}/" hreflang="x-default" />

  {schema_jsonld}

  <script>
    var postTitle = 'Predvajalnik naključnih fotografij';
    var author = '{BLOG_AUTHOR}';
  </script>

  <!-- Favicon -->
  <link rel="icon" href="{BASE_SITE_URL}/photos/favicon.ico" type="image/x-icon">

  <!-- Fonts & CSS -->
  <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;700&family=Open+Sans&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{BASE_SITE_URL}/assets/Main.css">
  <link rel="stylesheet" href="{BASE_SITE_URL}/assets/MySlideshowScript.css">
</head>

<body>
  <div class="page-wrapper">
    <!-- Top Header -->
    <header class="top-header">
      {header_html}
    </header>

    <!-- Main Layout -->
    <div class="main-layout">
      {sidebar_html}
      <div class="content-wrapper">
        {searchbox_html}
        <h1>Predvajalnik naključnih fotografij</h1>
        <script> 
          var slideshowTitle0 = 'All pictures';
          var CoverPhoto0 = '';
        </script>
      </div>
    </div>
  </div>

  <!-- Footer -->
  {back_to_top_html}
  {footer_html}

  <script src="{BASE_SITE_URL}/assets/Main.js" defer></script>
  <script src="{BASE_SITE_URL}/assets/MySlideshowScript.js" defer></script>
  <script src="{BASE_SITE_URL}/assets/MyFiltersScript.js" defer></script>
</body>
</html>"""

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Generated random slideshow page: {output_path}")


def generate_gallery_page(current_page):
    output_dir = OUTPUT_DIR / "galerija-fotografij"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "index.html"

    sidebar_html = generate_sidebar_html(picture_settings=True, map_settings=False, current_page=current_page)
    header_html = generate_header_html()
    searchbox_html = generate_searchbox_html()
    footer_html = generate_footer_html()
    back_to_top_html = generate_back_to_top_html()

    # --- Schema.org structured data (JSON-LD)
    schema_jsonld = f"""<script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Galerija fotografij",
    "url": "{BASE_SITE_URL}/galerija-fotografij/",
    "description": "Galerija gorskih avantur in nepozabnih trenutkov.",
    "inLanguage": "sl",
    "isPartOf": {{
      "@type": "WebSite",
      "name": "{BLOG_TITLE}",
      "url": "{BASE_SITE_URL}/"
    }},
    "publisher": {{
      "@type": "Person",
      "name": "{BLOG_AUTHOR}",
      "url": "{BASE_SITE_URL}/"
    }},
    "potentialAction": {{
      "@type": "SearchAction",
      "target": "{BASE_SITE_URL}/search?q={{search_term_string}}",
      "query-input": "required name=search_term_string"
    }}
  }}
  </script>"""

    html_content = f"""<!DOCTYPE html>
<html lang="sl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="google-site-verification" content="{SITE_VERIFICATION}" />
  <meta name="description" content="Galerija gorskih avantur in nepozabnih trenutkov." />
  <meta name="keywords" content="gorske avanture, pohodništvo, gore, fotografije, narava, prosti čas, {BLOG_TITLE}, {BLOG_AUTHOR}, galerija fotografij, spomini, razgledi" />
  <meta name="author" content="{BLOG_AUTHOR}" />

  <meta property="og:title" content="Galerija fotografij" />
  <meta property="og:description" content="Galerija gorskih avantur in nepozabnih trenutkov." />
  <meta property="og:image" content="{DEFAULT_OG_IMAGE}" />
  <meta property="og:image:alt" content="Galerija gorskih avantur" />
  <meta property="og:url" content="{BASE_SITE_URL}/galerija-fotografij/" />
  <meta property="og:type" content="website" />

  <title>Galerija spominov | {BLOG_TITLE}</title>

  <!-- Canonical & hreflang -->
  <link rel="canonical" href="{BASE_SITE_URL}/galerija-fotografij/" />
  <link rel="alternate" href="{BASE_SITE_URL}/galerija-fotografij/" hreflang="sl" />
  <link rel="alternate" href="{BASE_SITE_URL}/" hreflang="x-default" />

  {schema_jsonld}

  <script>
    var postTitle = 'Galerija fotografij';
    var author = '{BLOG_AUTHOR}';
  </script>

  <!-- Favicon -->
  <link rel="icon" href="{BASE_SITE_URL}/photos/favicon.ico" type="image/x-icon">

  <!-- Fonts & CSS -->
  <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;700&family=Open+Sans&display=swap" rel="stylesheet">
  <link href='https://metodlangus.github.io/plugins/lightbox2/2.11.1/css/lightbox.min.css' rel='stylesheet'>
  <link rel="stylesheet" href="{BASE_SITE_URL}/assets/Main.css">
  <link rel="stylesheet" href="{BASE_SITE_URL}/assets/MyGalleryScript.css">
</head>

<body>
  <div class="page-wrapper">
    <!-- Top Header -->
    <header class="top-header">
      {header_html}
    </header>

    <!-- Main Layout -->
    <div class="main-layout">
      {sidebar_html}
      <div class="content-wrapper">
        {searchbox_html}
        <h1>Galerija spominov</h1>
        <div id="gallery" class="my-gallery-wrapper">
          <div class="gallery-container" id="galleryContainer">
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  {back_to_top_html}
  {footer_html}

  <script src='https://metodlangus.github.io/plugins/lightbox2/2.11.1/js/lightbox-plus-jquery.min.js'></script>
  <script src='https://metodlangus.github.io/scripts/full_img_size_button.js'></script>
  <script src="{BASE_SITE_URL}/assets/Main.js" defer></script>
  <script src="{BASE_SITE_URL}/assets/MyFiltersScript.js" defer></script>
  <script src="{BASE_SITE_URL}/assets/MyGalleryScript.js" defer></script>
</body>
</html>"""

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Generated gallery page: {output_path}")


def generate_peak_list_page():
    output_dir = OUTPUT_DIR / "seznam-vrhov"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "index.html"

    sidebar_html = generate_sidebar_html(picture_settings=False, map_settings=False, current_page="peak-list")
    header_html = generate_header_html()
    searchbox_html = generate_searchbox_html()
    footer_html = generate_footer_html()
    back_to_top_html = generate_back_to_top_html()

    # --- Schema.org structured data (JSON-LD)
    schema_jsonld = f"""<script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Seznam vrhov",
    "url": "{BASE_SITE_URL}/seznam-vrhov/",
    "description": "Seznam obiskanih vrhov na gorskih avanturah.",
    "inLanguage": "sl",
    "isPartOf": {{
      "@type": "WebSite",
      "name": "{BLOG_TITLE}",
      "url": "{BASE_SITE_URL}/"
    }},
    "publisher": {{
      "@type": "Person",
      "name": "{BLOG_AUTHOR}",
      "url": "{BASE_SITE_URL}/"
    }},
    "potentialAction": {{
      "@type": "SearchAction",
      "target": "{BASE_SITE_URL}/search?q={{search_term_string}}",
      "query-input": "required name=search_term_string"
    }}
  }}
  </script>"""

    html_content = f"""<!DOCTYPE html>
<html lang="sl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="google-site-verification" content="{SITE_VERIFICATION}" />
  <meta name="description" content="Seznam obiskanih vrhov na gorskih avanturah." />
  <meta name="keywords" content="gorske avanture, pohodništvo, gore, fotografije, narava, prosti čas, {BLOG_TITLE}, {BLOG_AUTHOR}, hribi, gore, vrhovi, planinski vrhovi, pohodniške ture, seznam vrhov" />
  <meta name="author" content="{BLOG_AUTHOR}" />

  <meta property="og:title" content="Seznam vrhov" />
  <meta property="og:description" content="Seznam obiskanih vrhov na gorskih avanturah." />
  <meta property="og:image" content="{DEFAULT_OG_IMAGE}" />
  <meta property="og:image:alt" content="Seznam obiskanih vrhov" />
  <meta property="og:url" content="{BASE_SITE_URL}/seznam-vrhov/" />
  <meta property="og:type" content="website" />

  <title>Seznam vrhov | {BLOG_TITLE}</title>

  <!-- Canonical & hreflang -->
  <link rel="canonical" href="{BASE_SITE_URL}/seznam-vrhov/" />
  <link rel="alternate" href="{BASE_SITE_URL}/seznam-vrhov/" hreflang="sl" />
  <link rel="alternate" href="{BASE_SITE_URL}/" hreflang="x-default" />

  {schema_jsonld}

  <script>
    var postTitle = 'Seznam vrhov';
    var author = '{BLOG_AUTHOR}';
  </script>

  <!-- Favicon -->
  <link rel="icon" href="{BASE_SITE_URL}/photos/favicon.ico" type="image/x-icon">

  <!-- Fonts & CSS -->
  <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;700&family=Open+Sans&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{BASE_SITE_URL}/assets/Main.css">
  <link rel="stylesheet" href="{BASE_SITE_URL}/assets/MyPeakListScript.css">
</head>

<body>
  <div class="page-wrapper">
    <!-- Top Header -->
    <header class="top-header">
      {header_html}
    </header>

    <!-- Main Layout -->
    <div class="main-layout">
      {sidebar_html}
      <div class="content-wrapper">
        {searchbox_html}
        <h1>Seznam vrhov</h1>
        <div id='loadingMessage'>Nalaganje ...</div>
        <div id='mountainContainer'></div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  {back_to_top_html}
  {footer_html}

  <script src="{BASE_SITE_URL}/assets/Main.js" defer></script>
  <script src="{BASE_SITE_URL}/assets/MyPeakListScript.js" defer></script>
</body>
</html>"""

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Generated peak list page: {output_path}")


def generate_big_map_page():
    output_dir = OUTPUT_DIR / "zemljevid-spominov"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "index.html"

    sidebar_html = generate_sidebar_html(picture_settings=False, map_settings=True, current_page="map")
    header_html = generate_header_html()
    searchbox_html = generate_searchbox_html()
    footer_html = generate_footer_html()
    back_to_top_html = generate_back_to_top_html()

    # --- Schema.org structured data (JSON-LD)
    schema_jsonld = f"""<script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Zemljevid spominov",
    "url": "{BASE_SITE_URL}/zemljevid-spominov/",
    "description": "Gorske avanture in nepozabni trenutki na zemljevidu spominov.",
    "inLanguage": "sl",
    "isPartOf": {{
      "@type": "WebSite",
      "name": "{BLOG_TITLE}",
      "url": "{BASE_SITE_URL}/"
    }},
    "publisher": {{
      "@type": "Person",
      "name": "{BLOG_AUTHOR}",
      "url": "{BASE_SITE_URL}/"
    }},
    "potentialAction": {{
      "@type": "SearchAction",
      "target": "{BASE_SITE_URL}/search?q={{search_term_string}}",
      "query-input": "required name=search_term_string"
    }}
  }}
  </script>"""

    html_content = f"""<!DOCTYPE html>
<html lang="sl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="google-site-verification" content="{SITE_VERIFICATION}" />
  <meta name="description" content="Gorske avanture in nepozabni trenutki na zemljevidu spominov." />
  <meta name="keywords" content="gorske avanture, pohodništvo, gore, fotografije, narava, prosti čas, {BLOG_TITLE}, {BLOG_AUTHOR}, zemljevid, pohodniške poti, sledi poti, geolokacija, spomini" />
  <meta name="author" content="{BLOG_AUTHOR}" />
  <meta property="og:title" content="Zemljevid spominov" />
  <meta property="og:description" content="Zemljevid spominov, ki zajema slike ter sledi poti." />
  <meta property="og:image" content="{DEFAULT_OG_IMAGE}" />
  <meta property="og:image:alt" content="Zemljevid spominov" />
  <meta property="og:url" content="{BASE_SITE_URL}/zemljevid-spominov/" />
  <meta property="og:type" content="website" />

  <title>Zemljevid spominov | {BLOG_TITLE}</title>

  <!-- Canonical & hreflang -->
  <link rel="canonical" href="{BASE_SITE_URL}/zemljevid-spominov/" />
  <link rel="alternate" href="{BASE_SITE_URL}/zemljevid-spominov/" hreflang="sl" />
  <link rel="alternate" href="{BASE_SITE_URL}/" hreflang="x-default" />

  {schema_jsonld}

  <script>
    var postTitle = 'Zemljevid spominov';
    var author = '{BLOG_AUTHOR}';
  </script>

  <!-- Favicon -->
  <link rel="icon" href="{BASE_SITE_URL}/photos/favicon.ico" type="image/x-icon">

  <!-- Fonts & CSS -->
  <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;700&family=Open+Sans&display=swap" rel="stylesheet">
  <link href='https://metodlangus.github.io/plugins/leaflet/1.7.1/leaflet.min.css' rel='stylesheet'>
  <link href='https://metodlangus.github.io/plugins/@raruto/leaflet-elevation/dist/leaflet-elevation.min.css' rel='stylesheet'>
  <link href='https://metodlangus.github.io/plugins/leaflet-fullscreen/v1.0.1/leaflet.fullscreen.css' rel='stylesheet'>
  <link href='https://metodlangus.github.io/scripts/leaflet-download-gpx-button.css' rel='stylesheet'>
  <link href='https://metodlangus.github.io/plugins/lightbox2/2.11.1/css/lightbox.min.css' rel='stylesheet'>
  <link href='https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css' rel='stylesheet'>
  <link href='https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css' rel='stylesheet'>
  <link href='https://cdn.jsdelivr.net/npm/leaflet-control-geocoder@3.1.0/dist/Control.Geocoder.min.css' rel='stylesheet'>
  <link rel="stylesheet" href="{BASE_SITE_URL}/assets/Main.css">
  <link rel="stylesheet" href="{BASE_SITE_URL}/assets/MyMemoryMapScript.css">
</head>

<body>
  <div class="page-wrapper">
    <!-- Top Header -->
    <header class="top-header">
      {header_html}
    </header>

    <!-- Main Layout -->
    <div class="main-layout">
      {sidebar_html}
      <div class="content-wrapper">
        {searchbox_html}
        <h1>Zemljevid spominov</h1>
        <div id="map"></div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  {back_to_top_html}
  {footer_html}

  <script src='https://metodlangus.github.io/plugins/leaflet/1.7.1/leaflet.min.js'></script>
  <script src='https://metodlangus.github.io/plugins/togeojson/0.16.0/togeojson.min.js'></script>
  <script src='https://metodlangus.github.io/plugins/leaflet-gpx/1.6.0/gpx.min.js'></script>
  <script src='https://metodlangus.github.io/plugins/@raruto/leaflet-elevation/dist/leaflet-elevation.min.js'></script>
  <script src='https://metodlangus.github.io/plugins/leaflet-fullscreen/v1.0.1/Leaflet.fullscreen.min.js'></script>
  <script src='https://metodlangus.github.io/plugins/leaflet-polylinedecorator/1.1.0/leaflet.polylineDecorator.min.js'></script>
  <script src='https://metodlangus.github.io/scripts/leaflet-download-gpx-button.js'></script>
  <script src='https://metodlangus.github.io/plugins/lightbox2/2.11.1/js/lightbox-plus-jquery.min.js'></script>
  <script src='https://metodlangus.github.io/scripts/full_img_size_button.js'></script>
  <script src='https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js'></script>
  <script src='https://cdn.jsdelivr.net/npm/leaflet-control-geocoder@3.1.0/dist/Control.Geocoder.min.js'></script>
  <script src="{BASE_SITE_URL}/assets/Main.js" defer></script>
  <script src="{BASE_SITE_URL}/assets/MyMemoryMapScript.js" defer></script>
</body>
</html>"""

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Generated memory map page: {output_path}")


def generate_home_en_page(homepage_html):
    output_dir = OUTPUT_DIR / "en"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "index.html"

    sidebar_html = generate_sidebar_html(picture_settings=False, map_settings=False, current_page="home")
    header_html = generate_header_html()
    searchbox_html = generate_searchbox_html()
    footer_html = generate_footer_html()
    back_to_top_html = generate_back_to_top_html()

    # --- Schema.org structured data (JSON-LD)
    schema_jsonld = f"""<script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "{BLOG_TITLE}",
    "url": "{BASE_SITE_URL}/en/",
    "description": "Mountain adventures and unforgettable moments: Discover the beauty of the mountain world and enjoy the image slideshows that take you through the adventures.",
    "publisher": {{
      "@type": "Person",
      "name": "{BLOG_AUTHOR}",
      "url": "{BASE_SITE_URL}/en/"
    }},
    "potentialAction": {{
      "@type": "SearchAction",
      "target": "{BASE_SITE_URL}/en/search?q={{search_term_string}}",
      "query-input": "required name=search_term_string"
    }}
  }}
  </script>"""

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="google-site-verification" content="{SITE_VERIFICATION}" />

  <meta name="description" content="Mountain adventures and unforgettable moments: Discover the beauty of the mountain world and enjoy the image slideshows that take you through the adventures." />
  <meta name="keywords" content="mountain adventures, hiking, mountains, photography, nature, free time, {BLOG_TITLE}, {BLOG_AUTHOR}, mountain trails, scenic views, alpine peaks, outdoor activities, adventure travel" />
  <meta name="author" content="{BLOG_AUTHOR}" />

  <title>{BLOG_TITLE} | Mountain Adventures Through Pictures | {BLOG_AUTHOR}</title>
  <link rel="canonical" href="{BASE_SITE_URL}/en/" />

  {schema_jsonld}

  <meta property="og:title" content="{BLOG_TITLE} | Mountain Adventures Through Pictures | {BLOG_AUTHOR}" />
  <meta property="og:description" content="Mountain adventures and unforgettable moments: Discover the beauty of the mountain world and enjoy the image slideshows that take you through the adventures." />
  <meta property="og:image" content="{DEFAULT_OG_IMAGE}" />
  <meta property="og:image:alt" content="Mountain views and nature" />
  <meta property="og:url" content="{BASE_SITE_URL}/en/" />
  <meta property="og:type" content="website" />

  <link rel="alternate" href="{BASE_SITE_URL}/" hreflang="sl" />
  <link rel="alternate" href="{BASE_SITE_URL}/en/" hreflang="en" />
  <link rel="alternate" href="{BASE_SITE_URL}/" hreflang="x-default" />

  <!-- Favicon -->
  <link rel="icon" href="{BASE_SITE_URL}/photos/favicon.ico" type="image/x-icon">

  <!-- Fonts & CSS -->
  <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;700&family=Open+Sans&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{BASE_SITE_URL}/assets/Main.css">
  <link rel="stylesheet" href="{BASE_SITE_URL}/assets/MyRandomPhoto.css">
  <link rel="stylesheet" href="{BASE_SITE_URL}/assets/MyPostContainerScript.css">
</head>

<body>
  <div class="page-wrapper">
    <!-- Top Header -->
    <header class="top-header home">
      {header_html}
    </header>

    <!-- Main Layout -->
    <div class="main-layout">
      {sidebar_html}
      <div class="content-wrapper">
        {searchbox_html}
        <div class="blog-posts hfeed container home">
          {homepage_html}
        </div>
        <div id="blog-pager" class="blog-pager"></div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  {back_to_top_html}
  {footer_html}

  <script src="{BASE_SITE_URL}/assets/Main.js" defer></script>
  <script src="{BASE_SITE_URL}/assets/MyRandomPhoto.js" defer></script>
</body>
</html>"""

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Generated home EN page: {output_path}")

def generate_home_si_page(homepage_html):
    output_path = OUTPUT_DIR / "index.html"

    sidebar_html = generate_sidebar_html(picture_settings=False, map_settings=False, current_page="home")
    header_html = generate_header_html()
    searchbox_html = generate_searchbox_html()
    footer_html = generate_footer_html()
    back_to_top_html = generate_back_to_top_html()

    # --- Schema.org structured data (JSON-LD)
    schema_jsonld = f"""<script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "{BLOG_TITLE}",
    "url": "{BASE_SITE_URL}/",
    "description": "Gorske avanture in nepozabni trenutki: Lepote gorskega sveta in predvajalniki slik, ki vas popeljejo skozi dogodivščine.",
    "publisher": {{
      "@type": "Person",
      "name": "{BLOG_AUTHOR}",
      "url": "{BASE_SITE_URL}/"
    }},
    "potentialAction": {{
      "@type": "SearchAction",
      "target": "{BASE_SITE_URL}/search?q={{search_term_string}}",
      "query-input": "required name=search_term_string"
    }}
  }}
  </script>"""

    html_content = f"""<!DOCTYPE html>
<html lang="sl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="google-site-verification" content="{SITE_VERIFICATION}" />

  <meta name="description" content="Gorske avanture in nepozabni trenutki: Lepote gorskega sveta in predvajalniki slik, ki vas popeljejo skozi dogodivščine." />
  <meta name="keywords" content="gorske avanture, pustolovščine, pohodništvo, gore, fotografije, narava, prosti čas, {BLOG_TITLE}, {BLOG_AUTHOR}, gorski vrhovi, razgledi, pohodniške poti, lepote narave" />
  <meta name="author" content="{BLOG_AUTHOR}" />

  <title>{BLOG_TITLE} | Gorske pustolovščine skozi slike | {BLOG_AUTHOR}</title>
  <link rel="canonical" href="{BASE_SITE_URL}/" />

  {schema_jsonld}

  <meta property="og:title" content="{BLOG_TITLE} | Gorske pustolovščine skozi slike | {BLOG_AUTHOR}" />
  <meta property="og:description" content="Gorske avanture in nepozabni trenutki: Lepote gorskega sveta in predvajalniki slik, ki vas popeljejo skozi dogodivščine." />
  <meta property="og:image" content="{DEFAULT_OG_IMAGE}" />
  <meta property="og:image:alt" content="Gorski razgledi in narava" />
  <meta property="og:url" content="{BASE_SITE_URL}/" />
  <meta property="og:type" content="website" />

  <link rel="alternate" href="{BASE_SITE_URL}/" hreflang="sl" />
  <link rel="alternate" href="{BASE_SITE_URL}/en/" hreflang="en" />
  <link rel="alternate" href="{BASE_SITE_URL}/" hreflang="x-default" />

  <!-- Favicon -->
  <link rel="icon" href="{BASE_SITE_URL}/photos/favicon.ico" type="image/x-icon">

  <!-- Fonts & CSS -->
  <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;700&family=Open+Sans&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{BASE_SITE_URL}/assets/Main.css">
  <link rel="stylesheet" href="{BASE_SITE_URL}/assets/MyRandomPhoto.css">
  <link rel="stylesheet" href="{BASE_SITE_URL}/assets/MyPostContainerScript.css">
</head>

<body>
  <div class="page-wrapper">
    <!-- Top Header -->
    <header class="top-header home">
      {header_html}
    </header>

    <!-- Main Layout -->
    <div class="main-layout">
      {sidebar_html}
      <div class="content-wrapper">
        {searchbox_html}
        <div class="blog-posts hfeed container home">
          {homepage_html}
        </div>
        <div id="blog-pager" class="blog-pager"></div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  {back_to_top_html}
  {footer_html}

  <script src="{BASE_SITE_URL}/assets/Main.js" defer></script>
  <script src="{BASE_SITE_URL}/assets/MyRandomPhoto.js" defer></script>
</body>
</html>"""

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Generated home SI page: {output_path}")


def generate_mattia_map_page():
    output_path = OUTPUT_DIR / "mattia-adventures-map.html"

    # Generate sidebar HTML dynamically (optional)
    sidebar_html = """
    <div id="sidebar">
      <h2>Mattia Furlan adventures</h2>
      <ol id="postList"></ol>
    </div>
    """

    # Full HTML content
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Mattia Furlan adventures map</title>
<meta name="viewport" content="width=device-width, initial-scale=1">

<link href='https://metodlangus.github.io/plugins/leaflet/1.7.1/leaflet.min.css' rel='stylesheet'>
<link href='https://cdn.jsdelivr.net/npm/leaflet-control-geocoder@3.1.0/dist/Control.Geocoder.min.css' rel='stylesheet'>
<link rel="stylesheet" href="{BASE_SITE_URL}/assets/MattiaMapScript.css">

</head>
<body>

<button id="toggleSidebar">☰</button>
{sidebar_html}

<div id="map"></div>

<script src='https://metodlangus.github.io/plugins/leaflet/1.7.1/leaflet.min.js'></script>
<script src='https://cdn.jsdelivr.net/npm/leaflet-control-geocoder@3.1.0/dist/Control.Geocoder.min.js'></script>
<script src="{BASE_SITE_URL}/mont-nav-keywords-geo.js"></script>
<script src="{BASE_SITE_URL}/assets/MattiaMapScript.js"></script>

</body>
</html>
"""

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Generated Mattia adventures map page: {output_path}")


def generate_useful_links_page():
    output_dir = OUTPUT_DIR / "uporabne-povezave"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "index.html"

    # Sidebar, header, footer, etc.
    sidebar_html = generate_sidebar_html(picture_settings=False, map_settings=False, current_page="useful-links")
    header_html = generate_header_html()
    searchbox_html = generate_searchbox_html()
    footer_html = generate_footer_html()
    back_to_top_html = generate_back_to_top_html()

    # --- Schema.org structured data (JSON-LD)
    schema_jsonld = f"""<script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Uporabne povezave",
    "url": "{BASE_SITE_URL}/uporabne-povezave/",
    "description": "Seznam uporabnih povezav do drugih blogov in vsebin.",
    "inLanguage": "sl",
    "isPartOf": {{
      "@type": "WebSite",
      "name": "{BLOG_TITLE}",
      "url": "{BASE_SITE_URL}/"
    }},
    "publisher": {{
      "@type": "Person",
      "name": "{BLOG_AUTHOR}",
      "url": "{BASE_SITE_URL}/"
    }},
    "potentialAction": {{
      "@type": "SearchAction",
      "target": "{BASE_SITE_URL}/search?q={{search_term_string}}",
      "query-input": "required name=search_term_string"
    }}
  }}
  </script>"""

    # Generate HTML for the links
    links_html = """<div id="useful-links-container"></div>"""

    # Main HTML content
    html_content = f"""<!DOCTYPE html>
<html lang="sl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="google-site-verification" content="{SITE_VERIFICATION}" />
  <meta name="description" content="Seznam uporabnih povezav do drugih blogov in vsebin." />
  <meta name="keywords" content="uporabne povezave, blog, pohodništvo, gore, narava,{BLOG_TITLE}, {BLOG_AUTHOR}, izleti, planinske poti" />
  <meta name="author" content="{BLOG_AUTHOR}" />

  <meta property="og:title" content="Uporabne povezave" />
  <meta property="og:description" content="Seznam uporabnih povezav do drugih blogov in vsebin." />
  <meta property="og:image" content="{DEFAULT_OG_IMAGE}" />
  <meta property="og:image:alt" content="Uporabne povezave" />
  <meta property="og:url" content="{BASE_SITE_URL}/uporabne-povezave.html" />
  <meta property="og:type" content="website" />

  <title>Uporabne povezave | {BLOG_TITLE}</title>

  <!-- Canonical & hreflang -->
  <link rel="canonical" href="{BASE_SITE_URL}/uporabne-povezave.html" />
  <link rel="alternate" href="{BASE_SITE_URL}/uporabne-povezave.html" hreflang="sl" />
  <link rel="alternate" href="{BASE_SITE_URL}" hreflang="x-default" />

  {schema_jsonld}

  <script>
    var postTitle = 'Uporabne povezave';
    var author = '{BLOG_AUTHOR}';
  </script>

  <!-- Favicon -->
  <link rel="icon" href="{BASE_SITE_URL}/photos/favicon.ico" type="image/x-icon">

  <!-- Fonts & CSS -->
  <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;700&family=Open+Sans&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{BASE_SITE_URL}/assets/Main.css">
  <link rel="stylesheet" href="{BASE_SITE_URL}/assets/MyUsefulLinksScript.css">
</head>

<body>
  <div class="page-wrapper">
    <header class="top-header">{header_html}</header>
    <div class="main-layout">
      {sidebar_html}
      <div class="content-wrapper">
        {searchbox_html}
        <h1>Uporabne povezave</h1>
        <p>Zbirka povezav do drugih blogov in ostalih uporabnih spletnih vsebin:</p>

        {links_html}

        <div id="mapOverlay">
            <div id="mapOverlayClose" onclick="closeMapOverlay()">✖</div>
            <iframe id="mapOverlayFrame" src="" loading="lazy"></iframe>
        </div>

      </div>
    </div>
  </div>

  {back_to_top_html}
  {footer_html}

  <script src="{BASE_SITE_URL}/assets/Main.js" defer></script>
  <script src="{BASE_SITE_URL}/assets/MyUsefulLinksScript.js" defer></script>
</body>
</html>"""

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)

    print(f"Generated useful links page: {output_path}")


def generate_404_page():
    output_path = OUTPUT_DIR / "404.html"

    html_content = f"""<!DOCTYPE html>
<html lang="sl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <title>Napaka 404 – Stran ne obstaja | {BLOG_TITLE}</title>

  <meta name="description" content="Napaka 404 – Stran, ki jo iščete, ne obstaja. Morda je bila odstranjena ali premaknjena. Oglejte si vsebino na {BLOG_TITLE}.">
  <meta name="keywords" content="404, napaka 404, stran ne obstaja, napaka, blog, pohodništvo, gore, {BLOG_TITLE}, {BLOG_AUTHOR}" />
  <meta name="author" content="{BLOG_AUTHOR}">

  <!-- Canonical & hreflang -->
  <link rel="canonical" href="{BASE_SITE_URL}/404.html" />
  <link rel="alternate" href="{BASE_SITE_URL}/404.html" hreflang="sl" />
  <link rel="alternate" href="{BASE_SITE_URL}" hreflang="x-default" />

  <!-- OpenGraph -->
  <meta property="og:title" content="Napaka 404 – Stran ne obstaja">
  <meta property="og:description" content="Stran ne obstaja. Nadaljujte brskanje po blogu {BLOG_TITLE}.">
  <meta property="og:image" content="{DEFAULT_OG_IMAGE}">
  <meta property="og:image:alt" content="Napaka 404">
  <meta property="og:url" content="{BASE_SITE_URL}/404.html">
  <meta property="og:type" content="website">

  <!-- Structured Data -->
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Napaka 404 – Stran ne obstaja",
    "url": "{BASE_SITE_URL}/404.html",
    "description": "Stran ne obstaja. Nadaljujte brskanje po blogu {BLOG_TITLE}.",
    "inLanguage": "sl",
    "isPartOf": {{
      "@type": "WebSite",
      "name": "{BLOG_TITLE}",
      "url": "{BASE_SITE_URL}/"
    }},
    "publisher": {{
      "@type": "Person",
      "name": "{BLOG_AUTHOR}",
      "url": "{BASE_SITE_URL}/"
    }}
  }}
</script>

  <!-- Favicon -->
  <link rel="icon" href="{BASE_SITE_URL}/photos/favicon.ico" type="image/x-icon">

  <!-- CSS -->
  <link rel="stylesheet" href="{BASE_SITE_URL}/assets/My404PageScript.css">
</head>

<body>
  <div class="background">
    <div class="centered">
      <div class="quarter">
        <div class="message-overlay">
          <h1>404</h1>
          <p>Ups! Stran, ki jo iščete, ne obstaja. Morda je bila premaknjena ali izbrisana.</p>
          <a href="{BASE_SITE_URL}/" class="home-btn">Domov</a>
        </div>
      </div>

      <svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="1800.000000pt" height="1350.000000pt" viewBox="0 0 1800.000000 1350.000000" preserveAspectRatio="xMidYMid meet" >
          <g transform="translate(0.000000,1800.000000) scale(0.135000,-0.135000)" fill="#626262" stroke="none">
          <path d="M5725 12119 c-4 -5 -18 -14 -31 -19 -15 -6 -24 -18 -24 -30 0 -11 -7 -23 -15 -26 -11 -4 -15 -21 -15 -59 0 -57 19 -85 58 -85 11 0 24 -4 27 -10 9 -15 68 -12 106 6 71 32 84 43 87 70 4 27 3 27 -40 19 -78 -14 -120 -11 -132 7 -16 26 6 45 37 31 12 -6 40 -8 62 -4 53 8 57 33 14 77 -28 29 -40 34 -80 34 -26 0 -51 -5 -54 -11z"/>
          <path d="M9765 10529 c-27 -10 -69 -19 -91 -19 -24 0 -47 -6 -53 -14 -13 -16 -85 -23 -293 -32 -87 -3 -128 -2 -128 5 0 6 -4 11 -10 11 -5 0 -10 -18 -10 -40 0 -27 -5 -43 -15 -46 -13 -5 -15 -37 -15 -203 1 -181 2 -198 21 -220 11 -13 23 -21 26 -17 4 4 6 38 4 77 -4 100 10 132 66 159 25 12 55 19 66 16 11 -3 33 2 48 10 15 7 52 14 82 14 35 0 59 5 66 14 8 9 40 16 84 20 40 3 106 10 147 15 41 6 83 11 93 11 31 2 33 31 3 57 -15 12 -34 23 -42 23 -8 0 -14 4 -14 8 0 5 -11 14 -25 20 -21 10 -24 15 -16 31 6 10 24 24 41 31 16 7 30 16 30 21 0 4 10 11 23 15 29 8 58 34 51 45 -9 15 -86 8 -139 -12z m-126 -133 c10 -11 7 -17 -11 -30 -45 -32 -120 -11 -104 29 7 20 99 21 115 1z m-193 -52 c13 -52 -66 -84 -106 -44 -22 22 -26 56 -7 63 6 3 33 6 59 6 43 1 48 -1 54 -25z"/>
          <path d="M9135 9800 c-16 -17 -39 -33 -50 -36 -12 -3 -67 -52 -123 -110 -56 -57 -108 -104 -115 -104 -19 0 -447 -434 -447 -453 0 -8 -7 -17 -15 -21 -20 -7 -20 -64 1 -104 12 -24 14 -51 10 -118 -3 -48 -10 -92 -16 -98 -5 -5 -10 -27 -10 -47 0 -21 -4 -41 -10 -44 -5 -3 -18 -25 -28 -48 -10 -23 -26 -48 -35 -56 -10 -7 -17 -22 -17 -32 0 -10 -9 -23 -20 -29 -11 -6 -20 -15 -20 -20 0 -14 -75 -122 -100 -145 -11 -10 -20 -22 -20 -27 0 -5 -18 -31 -40 -57 -22 -26 -40 -51 -40 -54 0 -4 -12 -20 -28 -35 -15 -15 -37 -43 -49 -62 -12 -20 -33 -46 -47 -59 -14 -14 -26 -30 -26 -36 0 -7 -10 -20 -21 -31 -12 -10 -39 -41 -60 -69 -21 -27 -52 -65 -68 -84 -17 -18 -31 -38 -31 -44 0 -5 -20 -29 -45 -53 -25 -23 -45 -49 -45 -56 0 -8 -20 -34 -45 -58 -25 -24 -45 -50 -45 -57 0 -7 -12 -23 -26 -36 -14 -12 -39 -40 -55 -62 -15 -22 -44 -57 -64 -79 -19 -21 -35 -43 -35 -49 0 -6 -20 -30 -45 -54 -25 -23 -45 -49 -45 -56 0 -7 -20 -33 -45 -57 -25 -24 -45 -50 -45 -57 0 -7 -13 -25 -30 -40 -16 -14 -30 -33 -30 -41 0 -8 -20 -33 -45 -56 -25 -24 -45 -50 -45 -57 0 -8 -13 -26 -30 -39 -16 -14 -29 -32 -30 -41 0 -8 -16 -30 -35 -49 -19 -19 -35 -38 -35 -43 0 -8 -31 -47 -107 -137 -18 -20 -33 -45 -33 -54 0 -9 -7 -19 -15 -22 -8 -4 -15 -13 -15 -21 0 -20 98 66 99 87 1 9 30 45 66 80 36 35 65 70 65 76 0 7 27 41 60 76 33 34 60 68 60 73 0 6 25 35 55 65 30 30 55 59 55 65 0 6 14 24 30 40 17 16 30 34 30 41 0 7 20 32 45 56 24 24 45 48 45 55 0 7 22 36 50 65 27 29 50 57 50 62 0 5 21 33 48 62 92 104 122 141 122 152 0 6 20 30 45 54 24 24 45 48 45 54 0 7 16 29 35 50 19 22 35 42 35 46 0 4 21 32 48 62 81 94 147 176 151 188 2 6 17 24 32 39 16 16 29 34 29 42 0 7 20 33 45 57 25 24 45 48 45 54 0 9 24 37 133 160 26 29 47 58 47 65 0 18 72 87 100 96 22 7 23 6 14 -26 -13 -55 -11 -299 4 -338 7 -18 13 -58 14 -90 2 -455 0 -554 -15 -591 -10 -25 -14 -73 -12 -168 1 -96 -2 -138 -11 -150 -8 -9 -14 -27 -14 -38 0 -21 -71 -98 -120 -130 -14 -9 -38 -30 -55 -45 -47 -45 -145 -113 -200 -140 -27 -13 -53 -28 -56 -33 -4 -4 -28 -10 -55 -13 -27 -2 -58 -8 -69 -13 -11 -5 -56 -12 -100 -15 -133 -8 -144 -10 -157 -23 -6 -6 -24 -12 -38 -12 -19 0 -40 -15 -73 -51 -47 -51 -47 -52 -45 -112 4 -84 14 -85 81 -9 30 34 35 46 28 61 -19 35 11 59 86 66 63 6 306 8 591 4 64 -1 141 1 170 6 46 7 52 10 52 31 0 34 -33 48 -94 39 -28 -3 -58 -7 -66 -7 -8 -1 -24 -7 -35 -14 -40 -28 -125 -11 -125 24 0 18 128 152 146 152 5 0 25 16 44 35 19 19 42 35 51 35 9 0 19 6 22 14 7 17 54 26 66 12 5 -6 11 -22 13 -35 4 -35 22 -36 52 -4 29 31 35 87 12 118 -18 25 -5 52 42 88 36 26 37 29 34 85 -2 31 -6 81 -8 109 -5 43 -3 54 10 59 18 7 22 49 5 59 -5 4 -10 35 -11 68 -1 282 -10 451 -23 471 -11 15 -15 52 -15 144 0 88 -4 129 -14 145 -8 13 -13 43 -12 71 2 39 7 53 30 72 15 13 34 24 42 24 8 0 14 8 15 18 1 33 10 67 19 76 15 15 12 62 -5 76 -8 7 -12 17 -9 22 4 5 -3 23 -15 39 -12 16 -21 43 -21 62 0 19 -7 40 -15 47 -11 9 -15 35 -15 108 0 148 10 165 263 420 116 116 217 212 225 212 7 0 46 34 86 75 40 41 80 75 89 75 10 0 25 -9 34 -20 10 -11 22 -20 28 -20 5 0 54 -43 108 -95 53 -52 102 -95 108 -95 6 0 32 -22 59 -50 27 -27 55 -50 62 -50 8 0 29 -16 48 -35 19 -19 39 -35 46 -35 6 0 18 -7 25 -17 16 -18 115 -93 124 -93 3 0 19 -10 35 -22 21 -15 30 -30 30 -49 0 -15 4 -30 9 -33 4 -3 11 -35 13 -71 3 -36 10 -71 16 -78 7 -8 11 -339 14 -970 3 -900 4 -959 21 -968 14 -8 17 -25 17 -99 0 -51 4 -90 10 -90 5 0 10 -33 12 -72 4 -96 22 -94 26 2 1 41 7 84 12 95 5 11 11 45 12 75 3 49 6 55 26 58 33 5 141 -71 231 -163 41 -41 79 -75 85 -75 6 0 38 -27 71 -60 33 -33 65 -60 72 -60 7 0 26 -14 44 -31 17 -16 41 -34 52 -40 12 -5 35 -19 50 -31 26 -21 39 -23 142 -23 108 0 114 1 134 25 27 33 28 80 1 80 -11 0 -20 -6 -20 -14 0 -8 -7 -22 -16 -30 -21 -22 -136 -22 -154 -1 -7 8 -21 15 -31 15 -10 0 -33 13 -51 29 -18 15 -43 32 -56 35 -12 4 -30 18 -38 32 -9 13 -22 24 -29 24 -7 0 -41 27 -75 60 -34 33 -68 60 -74 60 -6 0 -41 29 -76 65 -35 36 -69 65 -75 65 -6 0 -42 31 -80 68 -39 38 -79 72 -89 76 -18 6 -19 18 -12 313 5 169 11 316 16 328 6 16 23 25 67 35 70 16 93 34 93 72 0 25 -3 28 -34 28 -18 0 -39 7 -46 15 -7 8 -21 15 -32 15 -24 0 -58 77 -59 134 -2 207 -11 335 -25 346 -21 19 -21 578 1 586 16 6 95 -66 95 -87 0 -11 55 -73 248 -278 45 -48 82 -92 82 -97 0 -5 47 -56 105 -114 58 -58 105 -111 105 -118 0 -8 47 -61 105 -118 58 -57 105 -109 105 -114 0 -6 54 -66 120 -134 66 -68 120 -127 120 -132 0 -5 65 -74 145 -154 80 -80 145 -149 145 -155 0 -6 61 -71 135 -145 74 -74 138 -144 141 -155 10 -29 246 -265 266 -265 27 0 29 15 8 43 -11 14 -20 32 -20 40 0 8 -7 17 -15 21 -8 3 -15 12 -15 21 0 9 -7 26 -15 39 -9 13 -15 28 -14 32 1 5 1 20 0 33 -1 20 -3 22 -16 11 -13 -11 -20 -9 -43 13 -16 15 -33 27 -39 27 -13 0 -413 401 -413 415 0 6 -54 64 -120 130 -66 66 -120 124 -120 130 0 6 -54 64 -120 130 -66 66 -120 126 -120 133 0 7 -40 53 -90 103 -49 49 -90 93 -90 99 0 6 -54 66 -120 134 -66 68 -120 127 -120 131 0 5 -39 51 -87 102 -209 222 -243 260 -243 272 0 6 -20 32 -45 58 -25 25 -45 51 -45 58 0 7 -7 18 -15 25 -8 7 -15 18 -15 24 0 14 -161 176 -175 176 -6 0 -40 29 -75 65 -35 36 -70 65 -76 65 -7 0 -46 34 -88 75 -42 41 -82 75 -89 75 -7 0 -35 23 -62 50 -27 28 -53 50 -59 50 -5 0 -33 21 -62 48 -113 100 -140 119 -175 126 -30 5 -39 2 -64 -24z m-585 -1227 c0 -50 -4 -65 -16 -70 -31 -12 -49 11 -52 65 -2 41 1 55 18 72 33 33 50 11 50 -67z"/>
          <path d="M8268 8870 c-27 -28 -48 -54 -48 -59 0 -4 -13 -24 -30 -42 -16 -19 -30 -39 -30 -45 0 -5 -13 -23 -30 -39 -16 -16 -30 -33 -30 -38 0 -5 -13 -26 -30 -47 -16 -21 -30 -41 -30 -44 0 -4 -13 -20 -30 -36 -16 -16 -30 -36 -30 -43 0 -8 -9 -22 -20 -32 -11 -10 -20 -22 -20 -28 0 -5 -15 -27 -32 -48 -56 -64 -78 -97 -78 -111 0 -7 -13 -24 -30 -38 -16 -14 -30 -30 -30 -37 0 -7 -13 -28 -30 -46 -16 -19 -30 -39 -30 -44 0 -6 -9 -18 -20 -28 -11 -10 -20 -23 -20 -29 0 -6 -18 -31 -40 -56 -22 -25 -40 -50 -40 -56 0 -7 -7 -14 -15 -18 -8 -3 -15 -14 -15 -24 0 -10 -16 -33 -35 -52 -19 -19 -35 -38 -35 -42 0 -11 -72 -109 -93 -127 -10 -7 -17 -22 -17 -32 0 -10 -6 -22 -12 -26 -17 -10 -88 -116 -88 -130 0 -6 -7 -13 -15 -16 -8 -4 -26 -25 -41 -49 -15 -23 -33 -49 -41 -56 -7 -7 -13 -19 -13 -26 0 -6 -13 -23 -30 -36 -16 -14 -29 -32 -30 -41 0 -9 -9 -24 -20 -34 -11 -10 -20 -23 -20 -30 0 -6 -11 -22 -25 -35 -14 -13 -25 -27 -25 -31 0 -11 -71 -114 -81 -117 -5 -2 -9 -11 -9 -21 0 -9 -13 -29 -28 -44 -16 -15 -39 -49 -52 -75 -13 -26 -30 -53 -37 -60 -14 -15 -18 -42 -5 -42 12 0 72 64 72 77 0 6 20 31 45 55 24 24 45 48 45 54 0 6 13 27 30 45 16 19 30 39 30 45 0 5 14 23 30 39 17 16 30 34 30 40 0 6 14 24 30 40 17 16 30 34 30 40 0 6 14 25 30 43 17 18 30 39 30 46 0 7 9 21 20 31 11 10 20 22 20 28 0 5 15 27 33 48 55 65 77 97 77 111 0 8 14 24 30 36 17 13 30 29 30 36 0 7 13 29 30 47 16 19 30 39 30 45 0 5 14 23 30 39 17 16 30 33 30 38 0 5 14 26 30 47 17 21 30 42 30 48 0 5 7 12 15 16 8 3 15 13 15 23 0 9 14 32 31 49 17 18 36 41 43 52 40 69 120 181 132 186 8 3 14 10 14 15 0 12 117 188 131 197 5 3 9 13 9 22 0 10 14 28 30 42 17 14 30 32 30 41 0 8 14 28 30 44 17 16 30 34 30 40 0 7 9 20 20 30 11 10 20 23 20 30 0 6 11 22 25 35 14 13 25 32 25 42 0 10 7 21 15 24 8 4 15 14 15 23 0 10 14 30 30 46 17 16 30 33 30 38 0 4 11 23 25 41 28 37 31 46 13 46 -7 0 -34 -23 -60 -50z"/>
          <path d="M4841 7257 c-16 -20 -3 -27 54 -27 28 0 55 3 58 7 15 14 -18 33 -58 33 -23 0 -48 -6 -54 -13z"/>
          <path d="M5610 7205 c-4 -5 -7 -21 -6 -35 1 -23 4 -25 56 -25 52 0 55 1 57 27 1 15 -3 31 -9 34 -17 11 -89 10 -98 -1z"/>
          <path d="M6094 7208 c-7 -11 10 -16 86 -23 111 -11 670 -16 670 -6 0 24 -73 30 -403 34 -191 2 -350 0 -353 -5z"/>
          <path d="M7656 7213 c-3 -4 -6 -21 -6 -40 0 -31 2 -33 36 -33 35 0 35 1 32 37 -3 33 -7 38 -30 40 -14 1 -29 -1 -32 -4z"/>
          <path d="M990 7200 c-8 -5 -25 -10 -38 -10 -23 0 -39 -21 -28 -39 4 -6 18 -3 35 7 28 16 31 15 74 -6 25 -12 50 -29 57 -37 17 -21 37 -19 57 5 17 19 30 20 478 20 389 1 463 3 479 15 11 8 40 15 65 15 55 0 43 20 -16 27 -83 10 -1148 13 -1163 3z"/>
          <path d="M2473 7198 c-16 -21 -23 -47 -17 -63 5 -12 29 -15 125 -15 102 0 121 2 126 16 11 28 -25 44 -99 44 -52 0 -70 4 -74 15 -7 18 -48 20 -61 3z"/>
          <path d="M2776 7175 c-17 -18 -17 -19 6 -36 19 -15 45 -19 148 -21 207 -3 228 2 186 41 -23 21 -36 24 -173 28 -134 5 -151 4 -167 -12z"/>
          <path d="M7823 7183 c-10 -3 -10 -9 0 -24 11 -18 25 -19 209 -19 187 0 198 1 198 19 0 14 -10 20 -46 25 -54 7 -343 7 -361 -1z"/>
          <path d="M11505 7173 c-15 -15 -15 -17 2 -33 24 -24 93 -36 93 -17 0 16 -37 51 -62 60 -10 3 -24 -1 -33 -10z"/>
          <path d="M707 7169 c-29 -17 -9 -29 48 -29 58 0 78 13 46 29 -25 14 -71 14 -94 0z"/>
          <path d="M3567 7173 c-4 -3 -7 -12 -7 -20 0 -10 31 -13 145 -13 138 0 145 1 145 20 0 19 -7 20 -138 20 -76 0 -142 -3 -145 -7z"/>
          <path d="M4260 7160 c0 -17 7 -20 50 -20 43 0 50 3 50 20 0 17 -7 20 -50 20 -43 0 -50 -3 -50 -20z"/>
          <path d="M4710 7160 c0 -19 7 -20 119 -20 66 0 122 4 126 9 12 20 -37 31 -139 31 -99 0 -106 -1 -106 -20z"/>
          <path d="M11176 7162 c-15 -18 -15 -20 1 -34 10 -9 28 -19 41 -22 12 -4 22 -12 22 -17 0 -17 54 -9 76 12 30 28 69 17 83 -23 14 -41 35 -30 39 20 2 31 -2 46 -17 61 -19 19 -33 21 -124 21 -88 0 -106 -3 -121 -18z"/>
          <path d="M11044 7157 c-11 -29 0 -102 16 -102 19 0 22 106 3 112 -7 3 -16 -2 -19 -10z"/>
          <path d="M10465 7141 c-3 -5 2 -17 11 -25 13 -14 50 -16 259 -16 226 0 301 8 225 25 -16 4 -32 11 -35 16 -8 12 -452 12 -460 0z"/>
          <path d="M10207 7124 c-16 -16 9 -24 73 -24 66 0 97 11 64 24 -21 8 -129 8 -137 0z"/>
          <path d="M12735 7123 c-38 -2 -79 -8 -90 -13 -11 -5 -31 -10 -45 -12 -17 -2 -25 -9 -25 -23 0 -18 8 -20 62 -23 67 -3 91 -22 78 -62 -10 -33 16 -33 46 1 26 29 27 34 14 49 -13 15 -13 19 8 38 13 12 33 22 45 22 13 0 22 6 22 15 0 9 -8 14 -22 13 -13 -1 -54 -3 -93 -5z"/>
          <path d="M750 7082 c0 -21 29 -32 86 -32 68 0 91 14 49 30 -31 12 -135 13 -135 2z"/>
          <path d="M2756 7074 c-22 -22 -36 -50 -29 -58 3 -3 28 -6 55 -6 54 0 63 17 29 58 -23 26 -34 28 -55 6z"/>
          <path d="M3327 7084 c-9 -9 3 -34 17 -34 6 0 28 -9 49 -20 38 -21 111 -27 122 -11 14 24 -166 86 -188 65z"/>
          <path d="M5345 7073 c-67 -34 -81 -68 -25 -56 25 4 34 0 57 -26 20 -22 36 -31 58 -31 31 0 65 28 65 54 0 18 -33 46 -56 46 -10 0 -28 7 -38 15 -23 17 -22 17 -61 -2z"/>
          <path d="M5924 7076 c-16 -12 -16 -15 -4 -20 65 -21 346 -34 363 -17 6 6 21 11 34 11 16 0 23 6 23 20 0 19 -7 20 -198 20 -156 0 -202 -3 -218 -14z"/>
          <path d="M3577 7073 c-4 -3 -7 -23 -7 -44 0 -34 3 -38 31 -44 36 -8 44 -2 33 22 -4 10 -9 23 -9 28 -6 37 -30 56 -48 38z"/>
          <path d="M4147 7034 c-4 -4 -7 -22 -7 -41 0 -31 2 -33 33 -33 20 0 39 8 50 20 26 31 22 50 -12 50 -16 0 -36 2 -43 5 -8 3 -17 2 -21 -1z"/>
          <path d="M4357 7034 c-16 -16 9 -24 73 -24 66 0 97 11 64 24 -21 8 -129 8 -137 0z"/>
          <path d="M4950 7025 c0 -12 16 -15 80 -15 64 0 80 3 80 15 0 12 -16 15 -80 15 -64 0 -80 -3 -80 -15z"/>
          <path d="M5802 7018 c-7 -7 -12 -23 -12 -36 0 -20 4 -23 33 -20 28 3 32 7 35 36 3 28 0 32 -20 32 -13 0 -29 -5 -36 -12z"/>
          <path d="M6452 6998 l3 -33 103 0 c105 0 128 9 80 33 -16 7 -28 17 -28 23 0 5 -36 9 -81 9 l-80 0 3 -32z"/>
          <path d="M7515 7020 c-3 -5 -21 -10 -39 -10 -58 0 -90 -61 -41 -80 26 -10 68 0 80 19 4 7 53 11 127 11 102 0 128 3 164 21 23 11 48 27 54 35 11 12 -11 14 -163 14 -106 0 -178 -4 -182 -10z"/>
          <path d="M5166 6902 c-3 -3 -1 -11 5 -19 7 -8 34 -13 75 -13 60 0 87 11 63 26 -14 8 -136 14 -143 6z"/>
          <path d="M3398 6838 c-18 -9 -41 -19 -50 -22 -10 -3 -18 -12 -18 -21 0 -12 14 -15 78 -15 66 1 81 4 107 25 36 30 27 42 -37 47 -32 2 -59 -3 -80 -14z"/>
          <path d="M12036 6802 c-7 -11 243 -262 261 -262 30 0 6 31 -111 148 -118 117 -138 132 -150 114z"/>
          <path d="M3132 6763 c-26 -10 2 -23 53 -23 54 0 79 12 49 24 -18 7 -83 7 -102 -1z"/>
          <path d="M2881 6722 c-6 -2 -7 -10 -4 -18 4 -10 23 -14 70 -14 55 0 64 2 61 17 -2 13 -15 17 -60 17 -32 1 -62 0 -67 -2z"/>
          <path d="M814 6671 c-21 -22 60 -29 412 -37 195 -4 222 -3 228 11 3 9 0 18 -7 20 -16 6 -627 11 -633 6z"/>
          <path d="M2588 6649 c-43 -22 -51 -49 -15 -49 21 0 137 56 137 66 0 12 -90 -1 -122 -17z"/>
          <path d="M10115 6631 c-9 -8 -5 -32 8 -45 21 -21 79 -46 107 -46 14 0 35 -7 46 -15 51 -38 173 9 174 68 0 13 -8 17 -40 17 -22 0 -40 -4 -40 -9 0 -5 -13 -12 -30 -16 -16 -4 -30 -11 -30 -16 0 -21 -55 -4 -67 20 -6 13 -20 29 -30 35 -18 10 -90 16 -98 7z"/>
          <path d="M1655 6582 c-2 -3 -2 -9 1 -13 7 -12 141 -11 149 1 3 6 -2 10 -12 11 -93 4 -134 4 -138 1z"/>
          <path d="M2130 6582 c-5 -2 -10 -8 -10 -13 0 -5 34 -9 76 -9 56 0 75 3 71 13 -3 11 -109 18 -137 9z"/>
          <path d="M7225 6480 c-3 -5 -14 -10 -24 -10 -30 0 -80 -51 -107 -109 -14 -31 -37 -70 -50 -88 -13 -17 -24 -36 -24 -41 0 -6 -34 -44 -75 -86 -60 -61 -81 -76 -105 -76 -16 0 -30 -4 -30 -9 0 -5 -9 -13 -20 -16 -22 -7 -28 -52 -10 -85 8 -15 15 -17 41 -10 17 5 43 17 57 26 42 28 127 117 157 164 15 25 40 61 55 80 15 19 30 52 34 73 7 35 64 107 85 107 5 0 20 11 35 25 15 14 33 25 40 25 7 0 21 9 31 20 18 20 17 20 -33 20 -28 0 -54 -4 -57 -10z"/>
          <path d="M11073 6483 c4 -3 26 -10 49 -14 91 -17 141 -29 152 -38 6 -5 34 -12 61 -15 28 -3 84 -10 125 -16 108 -13 131 -20 156 -47 30 -32 42 -23 39 29 -3 58 -2 56 -27 64 -41 14 -62 15 -218 21 -85 2 -159 9 -164 14 -6 5 -48 9 -95 9 -46 0 -81 -3 -78 -7z"/>
          <path d="M11735 6300 c3 -5 37 -10 75 -10 38 0 72 5 75 10 4 6 -23 10 -75 10 -52 0 -79 -4 -75 -10z"/>
          <path d="M11942 6278 c3 -30 6 -33 38 -33 29 0 34 3 32 20 -6 30 -22 45 -49 45 -21 0 -24 -4 -21 -32z"/>
          <path d="M8595 5545 c-109 -53 -109 -66 3 -182 94 -98 136 -157 128 -178 -4 -11 -21 -15 -66 -15 -55 0 -66 -4 -114 -40 -29 -22 -60 -40 -69 -40 -22 0 -31 -17 -37 -70 -4 -37 -9 -46 -27 -48 -24 -4 -28 6 -38 89 -3 31 -12 64 -18 73 -16 22 -109 36 -243 36 -114 0 -164 -13 -218 -55 -32 -24 -64 -18 -103 20 l-36 35 -196 0 -196 0 -48 -46 c-26 -25 -50 -58 -54 -72 -4 -15 -8 -153 -8 -307 l0 -280 38 -77 c44 -88 107 -151 171 -170 44 -13 71 -13 556 -3 231 5 319 10 330 19 29 25 50 25 97 1 27 -14 59 -25 73 -24 14 0 207 4 430 8 343 6 413 10 457 24 51 17 53 17 90 -3 34 -18 56 -20 203 -20 142 0 175 3 227 21 34 11 66 26 72 33 5 6 15 117 22 246 7 129 16 240 21 247 12 16 127 28 140 15 6 -6 14 -64 19 -129 19 -277 60 -358 207 -406 110 -36 439 -40 550 -6 36 10 45 10 68 -6 24 -15 48 -17 238 -12 135 3 225 9 249 18 33 11 44 10 85 -4 40 -15 95 -17 392 -18 527 -1 557 0 616 22 89 34 83 2 84 459 1 402 1 404 -21 434 -21 28 -22 34 -11 98 15 87 15 215 1 257 -7 19 -22 36 -36 42 -13 5 -87 9 -164 9 -127 0 -145 -2 -192 -24 -95 -44 -97 -48 -97 -197 0 -114 2 -130 18 -136 25 -9 52 -34 52 -48 0 -7 -18 -20 -40 -29 l-40 -16 -59 40 c-56 39 -61 40 -141 40 -81 0 -246 -23 -285 -40 -79 -35 -97 -39 -117 -29 -19 10 -20 17 -13 169 l7 158 -25 26 c-26 26 -27 26 -196 26 l-170 0 -60 -40 c-68 -45 -67 -43 -79 -187 -10 -112 -21 -137 -55 -124 -54 21 -137 41 -168 41 -60 0 -63 8 -70 135 -5 109 -7 117 -32 143 l-27 27 -153 0 c-124 -1 -158 -4 -184 -18 -18 -9 -40 -17 -49 -17 -9 0 -32 -11 -50 -25 l-32 -25 -4 -115 c-3 -109 -4 -116 -28 -132 -67 -49 -120 -53 -161 -13 l-31 29 11 95 c6 52 11 128 11 168 0 65 -3 77 -23 96 -22 21 -33 22 -188 22 l-164 0 -57 -37 c-31 -20 -59 -46 -62 -57 -3 -12 -6 -72 -7 -134 l-1 -114 31 -19 c37 -22 52 -51 30 -58 -8 -2 -29 -19 -47 -38 l-34 -33 3 -240 c2 -159 0 -243 -7 -250 -13 -13 -252 16 -271 32 -26 22 -11 48 70 116 138 118 128 98 128 258 0 120 -2 140 -18 156 -14 13 -53 23 -147 35 -87 12 -130 22 -134 31 -3 8 14 32 39 56 41 38 87 88 148 161 68 81 85 127 59 153 -21 21 -179 15 -238 -8 -35 -14 -74 -20 -128 -20 -58 0 -88 5 -117 20 -60 31 -202 28 -270 -5z m678 -19 c9 -7 17 -20 17 -28 0 -15 -122 -161 -170 -203 -18 -17 -39 -21 -127 -23 -66 -3 -114 0 -131 8 -28 12 -195 191 -200 214 -2 7 10 19 26 25 38 16 128 1 205 -33 32 -14 68 -26 80 -26 23 0 83 19 106 34 22 14 123 44 151 45 14 0 33 -6 43 -13z m3215 -26 c127 -12 132 -17 132 -133 0 -123 -4 -127 -128 -127 -120 0 -170 14 -178 49 -3 14 -10 36 -15 49 -5 13 -9 45 -9 73 0 63 21 83 100 98 3 0 47 -4 98 -9z m-2553 -20 c14 -15 18 -38 19 -114 1 -126 -4 -132 -122 -129 -105 2 -172 21 -189 54 -19 35 -17 159 3 187 14 21 22 22 143 22 115 0 130 -2 146 -20z m1554 -64 c11 -9 12 -54 6 -262 -7 -258 -4 -314 20 -314 7 0 31 28 51 63 55 90 135 187 159 192 101 21 138 25 220 25 86 0 95 -2 106 -21 9 -18 7 -30 -11 -68 -13 -25 -33 -59 -45 -76 -52 -72 -115 -187 -115 -211 0 -14 8 -38 19 -52 10 -15 44 -76 76 -137 32 -60 75 -133 96 -162 74 -100 53 -114 -171 -116 -133 -2 -158 0 -180 16 -13 9 -50 64 -80 122 -58 109 -104 170 -120 160 -6 -4 -10 -61 -10 -129 0 -84 -4 -128 -13 -140 -11 -16 -31 -18 -166 -18 -84 0 -156 3 -159 7 -8 8 -10 914 -3 1040 l6 90 45 6 c63 9 252 -1 269 -15z m-832 -1 c19 -13 21 -26 24 -145 3 -103 7 -133 19 -140 8 -5 51 -10 95 -10 88 -1 108 -10 125 -56 15 -37 4 -161 -17 -193 -15 -23 -19 -23 -109 -19 -88 5 -96 4 -106 -15 -12 -24 -3 -199 12 -228 17 -31 66 -49 151 -56 67 -5 83 -10 94 -27 16 -25 20 -199 5 -226 -14 -26 -124 -34 -272 -22 -112 10 -120 12 -166 45 -56 42 -151 140 -153 159 -1 7 -3 24 -4 38 -1 14 -8 57 -14 95 -6 39 -11 102 -11 140 0 98 -13 115 -89 115 -40 0 -63 5 -71 15 -7 9 -13 48 -14 96 -1 74 1 82 23 100 16 13 39 19 72 19 68 0 75 16 82 165 5 114 7 121 32 142 24 21 36 23 148 23 92 0 128 -4 144 -15z m-2911 -345 c7 -19 17 -133 23 -253 13 -242 21 -276 70 -296 65 -27 116 8 136 94 12 53 12 83 -4 250 -10 104 -16 197 -14 206 9 32 67 42 207 36 111 -5 132 -8 149 -26 19 -19 20 -34 21 -401 1 -367 0 -382 -18 -396 -15 -10 -55 -14 -162 -14 -147 0 -158 3 -166 45 -5 31 -40 29 -78 -5 -65 -58 -178 -75 -291 -43 -49 14 -72 27 -115 70 -30 30 -54 58 -54 64 0 6 -11 25 -24 42 -41 56 -46 104 -44 378 2 201 6 260 17 273 12 14 34 16 175 14 l161 -3 11 -35z m1392 31 c220 -10 213 -6 220 -155 l5 -105 -30 -28 c-16 -15 -84 -74 -151 -131 -119 -100 -142 -125 -127 -140 3 -4 48 -10 98 -13 155 -11 221 -21 240 -37 14 -12 17 -32 17 -103 0 -126 21 -119 -340 -118 -358 1 -468 8 -487 34 -8 12 -13 48 -13 100 0 113 -3 108 261 340 58 51 75 77 64 95 -4 6 -64 10 -149 10 -117 0 -146 3 -156 15 -7 9 -15 49 -18 90 -6 93 8 131 52 144 39 11 286 12 514 2z m817 -36 l25 -24 -1 -263 c-1 -145 -4 -307 -8 -360 -8 -133 -8 -133 -164 -133 -80 0 -133 5 -154 13 -29 13 -32 19 -39 69 -11 87 9 674 24 701 12 21 18 22 153 22 135 0 141 -1 164 -25z m2679 9 c3 -9 6 -183 6 -388 0 -343 -1 -374 -17 -388 -14 -13 -46 -16 -150 -16 -184 -1 -174 -13 -181 206 -4 149 10 505 23 569 6 27 20 30 181 32 112 1 133 -1 138 -15z m-490 -70 c3 -9 6 -138 6 -289 0 -351 -6 -360 -116 -169 -114 197 -113 180 -23 329 40 66 80 125 88 132 22 17 38 16 45 -3z m-1133 -166 c3 -26 9 -85 15 -165 8 -106 4 -109 -133 -88 -54 8 -104 15 -110 15 -30 0 -53 40 -53 90 0 56 24 90 62 90 52 0 139 25 160 46 25 25 57 31 59 12z m-2568 -28 c20 -16 46 -22 114 -26 116 -7 133 -11 133 -32 0 -9 -52 -69 -117 -132 -65 -64 -124 -124 -131 -134 -8 -9 -21 -16 -30 -14 -15 3 -17 24 -20 168 -1 90 0 170 2 177 7 18 19 16 49 -7z"/>
          <path d="M6385 5505 c-27 -20 -54 -44 -60 -53 -13 -24 -9 -240 6 -258 6 -8 19 -14 29 -14 10 0 20 -10 24 -22 4 -17 -1 -29 -22 -45 -34 -29 -63 -29 -88 -2 -10 11 -37 29 -58 40 -76 37 -307 16 -430 -39 -58 -26 -60 -26 -80 -6 -13 13 -16 44 -16 179 0 209 15 195 -208 195 l-163 0 -64 -37 c-35 -20 -67 -44 -71 -52 -11 -27 -23 -409 -17 -561 5 -133 4 -147 -13 -168 l-19 -23 -40 31 c-132 104 -154 145 -85 156 44 7 87 43 96 81 13 51 -67 153 -156 199 -103 53 -154 64 -297 64 l-132 0 -85 -40 c-47 -22 -109 -49 -138 -61 -29 -12 -68 -29 -86 -37 -43 -22 -64 -9 -79 51 -15 61 -18 65 -61 77 -74 20 -158 9 -259 -36 -46 -21 -74 -17 -118 14 -39 26 -45 27 -191 30 -146 3 -152 3 -180 -20 -16 -13 -48 -36 -71 -50 -40 -26 -42 -30 -47 -90 -4 -35 -7 -83 -9 -108 -2 -41 -4 -45 -27 -45 -19 0 -27 7 -34 30 -17 56 -65 154 -85 174 -66 66 -260 111 -482 111 l-116 0 -87 -44 c-84 -43 -189 -120 -250 -185 -42 -44 -69 -41 -95 12 -25 52 -26 66 -6 103 20 40 19 60 -10 121 -41 89 -172 213 -262 247 -21 8 -65 19 -98 25 -67 10 -418 8 -450 -4 -38 -14 -90 -37 -188 -85 -79 -39 -106 -59 -144 -104 -106 -126 -133 -295 -99 -621 19 -174 33 -210 115 -294 73 -76 93 -85 271 -121 153 -32 288 -27 480 17 148 33 257 100 341 207 50 65 84 75 95 29 10 -40 69 -126 116 -168 62 -56 113 -74 259 -90 140 -16 263 -9 384 21 55 14 181 71 214 98 21 16 85 107 99 139 9 21 18 28 35 25 21 -3 22 -8 28 -127 5 -106 8 -126 25 -138 15 -11 61 -14 234 -11 196 3 218 5 250 24 l35 20 5 212 c6 260 3 253 138 264 48 3 112 9 143 13 53 7 56 6 78 -21 89 -117 102 -137 99 -157 -2 -11 -26 -39 -55 -61 -46 -37 -52 -45 -52 -82 -1 -28 6 -50 23 -73 32 -43 119 -107 170 -125 199 -68 534 -36 656 63 79 65 159 112 183 109 19 -3 23 -12 30 -63 12 -86 20 -108 43 -120 30 -15 399 -3 447 15 33 13 43 12 85 -2 41 -15 103 -17 496 -16 437 0 450 1 515 22 66 23 66 23 79 72 10 37 13 137 12 399 -1 335 -8 435 -32 435 -6 0 -7 22 -3 58 3 31 8 108 11 171 l5 114 -27 24 c-26 22 -34 23 -193 23 l-166 0 -50 -35z m366 -34 c15 -19 19 -39 19 -109 0 -117 -5 -122 -124 -121 -50 0 -111 6 -135 12 -50 13 -54 21 -65 124 -6 48 -3 63 14 91 l21 34 125 -4 c118 -3 127 -4 145 -27z m-1113 -43 c9 -9 12 -88 12 -294 0 -156 4 -285 8 -288 5 -3 46 45 92 106 46 62 91 119 101 129 22 22 160 42 264 37 73 -3 80 -5 83 -25 4 -29 -34 -108 -113 -228 -35 -55 -65 -104 -65 -110 0 -16 62 -131 154 -284 47 -80 86 -148 86 -153 0 -4 -12 -15 -27 -25 -23 -15 -51 -18 -191 -18 l-164 0 -33 39 c-18 22 -51 74 -72 115 -45 90 -93 156 -104 144 -4 -4 -12 -66 -18 -137 -5 -71 -14 -133 -18 -137 -6 -6 -238 -14 -300 -10 -25 2 -36 72 -29 195 4 67 9 299 12 516 3 216 10 402 15 412 7 13 25 18 77 21 159 8 218 7 230 -5z m-3986 -29 c80 -17 117 -36 186 -96 90 -79 133 -135 139 -183 9 -69 5 -70 -203 -70 l-183 0 -33 28 c-58 50 -86 62 -135 62 -49 0 -82 -16 -115 -55 -15 -17 -17 -44 -18 -192 0 -196 10 -262 49 -305 26 -29 31 -30 102 -30 l74 1 43 46 c56 62 55 79 -7 100 -27 9 -54 22 -60 29 -6 7 -12 52 -13 100 -4 123 -15 118 254 114 193 -3 219 -5 235 -21 16 -16 18 -38 18 -190 -1 -166 -2 -174 -27 -222 -28 -54 -104 -132 -153 -158 -162 -87 -326 -118 -496 -92 -91 13 -114 21 -184 61 -88 51 -157 118 -186 179 -49 107 -71 334 -49 515 23 189 67 262 197 326 42 22 96 44 118 50 53 15 379 17 447 3z m1178 -293 c124 -27 210 -82 226 -146 4 -14 10 -29 14 -35 4 -5 18 -39 30 -75 19 -53 23 -86 24 -180 0 -104 -2 -120 -27 -173 -48 -105 -78 -134 -202 -196 -45 -22 -65 -25 -207 -29 -148 -4 -163 -3 -241 21 -87 28 -102 38 -159 109 -90 110 -107 184 -73 324 65 272 82 308 180 361 l60 32 155 1 c96 0 180 -5 220 -14z m817 -5 c19 -12 34 -31 38 -50 9 -40 19 -45 52 -26 135 78 180 95 257 95 79 0 86 -11 86 -150 0 -158 5 -153 -157 -160 -138 -7 -156 -12 -198 -62 l-27 -32 7 -206 c7 -190 6 -207 -11 -220 -14 -12 -48 -15 -160 -13 -79 1 -151 6 -163 12 -30 17 -32 60 -23 448 7 261 12 356 22 368 10 12 36 15 129 15 97 0 121 -3 148 -19z m1201 4 c54 -19 77 -32 130 -73 46 -36 85 -102 76 -126 -9 -24 -37 -28 -174 -28 -108 0 -133 3 -167 21 -55 28 -97 17 -101 -26 -3 -25 2 -34 30 -50 18 -10 67 -25 108 -32 41 -7 91 -17 110 -23 68 -22 210 -131 239 -186 14 -26 14 -65 0 -94 -18 -37 -113 -106 -221 -161 l-100 -50 -121 -1 c-124 -1 -220 16 -284 49 -15 8 -33 15 -40 15 -23 0 -113 98 -113 123 0 34 33 44 168 51 92 4 128 1 188 -14 91 -24 127 -16 122 27 -4 38 -46 59 -175 90 -109 27 -165 55 -242 121 -32 27 -35 34 -39 96 l-4 67 50 48 c72 69 130 115 182 145 43 24 53 26 190 26 102 0 158 -5 188 -15z m1916 -18 c14 -10 19 -37 26 -137 19 -252 6 -608 -22 -637 -12 -11 -46 -15 -151 -16 -117 -2 -139 0 -153 15 -16 15 -19 54 -26 330 -9 364 -5 426 32 445 35 18 270 18 294 0z m-5352 -61 c22 -27 23 -49 1 -68 -47 -40 -83 -28 -83 29 0 72 40 92 82 39z m4882 -18 c11 -43 7 -543 -5 -555 -19 -19 -53 5 -87 61 -18 29 -32 57 -32 63 0 6 -9 21 -19 35 -26 32 -71 118 -71 133 0 12 28 61 104 180 21 33 45 70 52 83 8 12 23 22 33 22 11 0 21 -9 25 -22z"/>
          <path d="M2608 4875 c-33 -31 -43 -97 -35 -237 6 -113 19 -138 72 -138 54 0 82 35 91 116 18 153 1 233 -56 267 -37 22 -40 22 -72 -8z"/>
          </g>
      </svg>

    </div>
  </div>

  <script src="{BASE_SITE_URL}/assets/My404PageScript.js" defer></script>

</body>
</html>"""

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)

    print(f"Generated 404 page: {output_path}")


COMMIT_AFTER_SECTIONS = {
    1:  "Update blog feeds",
    17: "Update blog posts",
    18: "Update list_of_tracks.txt with start coordinates",
    20: "Update photo data and skip attributes",
    21: "Update list of extracted_photos_with_gps_data.txt"
}

# List of patterns running 
PATTERNS = {
    "full_run": "r" * 21,
    "skip_geotag_photos" : "rrrrrrrrrrrrrrrrrrrrs",  # skip geotaging photos
    "just_geotag_photos" : "ssssssssssssssssssssr",  # run just geotaging photos
}

def choose_pattern():
    print("Select a pattern or manual mode:")
    for i, key in enumerate(PATTERNS.keys(), 1):
        print(f"{i}. {key} ({PATTERNS[key]})")
    print(f"{len(PATTERNS)+1}. Manual (ask for each section)")

    while True:
        choice = input("Enter number: ").strip()
        if choice.isdigit():
            choice = int(choice)
            if 1 <= choice <= len(PATTERNS):
                pattern_name = list(PATTERNS.keys())[choice-1]
                print(f"Selected pattern: {pattern_name} -> {PATTERNS[pattern_name]}")
                return iter(PATTERNS[pattern_name])
            elif choice == len(PATTERNS)+1:
                print("Manual mode selected.")
                return None
        print("Invalid choice. Try again.")

def git_has_changes():
    result = subprocess.run(
        ["git", "status", "--porcelain"],
        capture_output=True,
        text=True
    )
    return bool(result.stdout.strip())

def git_commit(default_message):
    if not git_has_changes():
        print("No changes to commit.")
        return

    print(f"\nGit changes detected.")
    print(f"Proposed commit message:\n  {default_message}")
    # Play default system beep
    winsound.Beep(1000, 500)  # Frequency 1000Hz, Duration 500ms
    choice = input("[c]ommit / [e]dit message / [s]kip? ").strip().lower()

    if choice == "s":
        print("Skipping commit.")
        return

    if choice == "e":
        default_message = input("Enter commit message: ").strip()

    subprocess.run(["git", "add", "-A"], check=True)
    subprocess.run(["git", "commit", "-m", default_message], check=True)
    print("Committed successfully.")

def run_section(
    section_no,
    section_name,
    func,
    *args,
    pattern_iter=None,
    **kwargs
):
    """
    Run / skip / quit a section.
    Commit only if section_no is in COMMIT_AFTER_SECTIONS.
    """
    # Pattern or manual choice
    if pattern_iter:
        try:
            choice = next(pattern_iter)
            print(f"\nSection {section_no}: {section_name} → pattern choice: {choice}")
        except StopIteration:
            print("Pattern exhausted → switching to manual mode.")
            choice = None

    else:
        choice = None

    if choice not in ("r", "s", "q"):
        while True:
            choice = input(
                f"\nSection {section_no}: {section_name} [r]un / [s]kip / [q]uit? "
            ).strip().lower()
            if choice in ("r", "s", "q"):
                break

    if choice == "q":
        print("Quitting...")
        sys.exit(0)

    if choice == "s":
        print(f"Skipping section {section_no}: {section_name}")
        return

    # Run section
    print(f"Running section {section_no}: {section_name}")
    func(*args, **kwargs)

    # Commit only if this section is a commit point
    if section_no in COMMIT_AFTER_SECTIONS:
        git_commit(f"{COMMIT_AFTER_SECTIONS[section_no]}")


if __name__ == "__main__":
    # 0.1 Upload new GPX file
    # 0.2 Write post in Blogger
    # 0.3 Copy post content in input_post.txt and with data-skip_attributes_to_posts.py append data-skip tags to photos
    # 0.4 Copy post back and publish it

    pattern_iter = choose_pattern()

    # Play default system beep
    winsound.Beep(1000, 500)  # Frequency 1000Hz, Duration 500ms
    input("Please make sure that phase 0 is completed (Upload GPX, write post, append data-skip tags, publish post). Press Enter to continue...")

    # 1. Create feeds
    run_section(1, "Create feeds",
        lambda: subprocess.run(["python", "get_blogger_feeds.py"], check=True),
        pattern_iter=pattern_iter)

    # 2. Fetch entries and posts
    def fetch_posts():
        global entries, label_posts_raw
        entries = fetch_all_entries()
        label_posts_raw = fetch_and_save_all_posts(entries)

    run_section(2, "Fetch entries and posts", fetch_posts, pattern_iter=pattern_iter)

    # 3. Build archive HTML
    run_section(3, "Build archive HTML",
        lambda: (generate_archive_pages(entries),
            save_archive_as_js(build_archive_sidebar_html(entries), "assets/archive.js")),
        pattern_iter=pattern_iter)

    # 4. Build labels navigation
    run_section(4, "Build labels navigation",
        lambda: save_navigation_as_js(
            generate_labels_sidebar_html(feed_path=BASE_FEED_PATH),
            "assets/navigation.js"),
        pattern_iter=pattern_iter)

    # 5-6 Generate Mattia map
    run_section(5, "Run geotags map",
        lambda: subprocess.run(["python", "geotags_map.py"], check=True),
        pattern_iter=pattern_iter)

    run_section(6, "Generate mattia map page",
        generate_mattia_map_page, pattern_iter=pattern_iter)

    # 7–15 Create blog pages
    run_section(7, "Generate label pages",
        lambda: generate_label_pages(entries, label_posts_raw),
        pattern_iter=pattern_iter)

    run_section(8, "Generate slideshow page",
        lambda: generate_predvajalnik_page(current_page="slideshow_page"),
        pattern_iter=pattern_iter)

    run_section(9, "Generate gallery page",
        lambda: generate_gallery_page(current_page="gallery_page"),
        pattern_iter=pattern_iter)

    run_section(10, "Generate peak list page",
        generate_peak_list_page, pattern_iter=pattern_iter)

    run_section(11, "Generate big map page",
        generate_big_map_page, pattern_iter=pattern_iter)

    run_section(12, "Generate useful links page",
        generate_useful_links_page, pattern_iter=pattern_iter)

    run_section(13, "Generate homepage EN",
        lambda: generate_home_en_page(generate_homepage_html(entries)),
        pattern_iter=pattern_iter)

    run_section(14, "Generate homepage SI",
        lambda: generate_home_si_page(generate_homepage_html(entries)),
        pattern_iter=pattern_iter)

    run_section(15, "Generate 404 page",
        generate_404_page, pattern_iter=pattern_iter)

    # 16 Generate sitemap
    run_section(16, "Generate sitemap",
        lambda: generate_sitemap_from_folder(
            Path(LOCAL_REPO_PATH),
            exclude_dirs=["plugins", "relive"],
            exclude_files=["mattia-adventures-map.html", "404.html"]),
        pattern_iter=pattern_iter)

    # 17. Submit changed files to IndexNow
    run_section(17, "Submit changed files to IndexNow",
        lambda: submit_changed_files_to_indexnow(
            Path(LOCAL_REPO_PATH),
            exclude_dirs=["plugins", "relive"],
            exclude_files=["mattia-adventures-map.html", "404.html"],
            index=True),
        pattern_iter=pattern_iter)

    # 18. Update list_of_tracks.txt
    run_section(18, "Update list_of_tracks.txt",
        lambda: subprocess.run(["python", "generate_track_list.py"], check=True),
        pattern_iter=pattern_iter)

    # 19. Update photos content
    run_section(19, "Update photos content",
        lambda: subprocess.run(["node", "get_photos_content.js"], check=True),
        pattern_iter=pattern_iter)

    # 20. Update data-skip attributes
    run_section(20, "Update data-skip attributes",
        lambda: subprocess.run(["python", "update_data-skip_atributes.py"], check=True),
        pattern_iter=pattern_iter)
    
    # Prompt user to connect phone before continuing
    # Play default system beep
    winsound.Beep(1000, 500)  # Frequency 1000Hz, Duration 500ms
    input("Please connect your phone and ensure ADB is enabled. Press Enter to continue...")

    # 21. Update extracted_photos_with_gps_data.txt
    run_section(21, "Update extracted_photos_with_gps_data.txt",
        lambda: subprocess.run(["python", "apped_location_to_photos.py"], check=True),
        pattern_iter=pattern_iter)