import re
import requests
from pathlib import Path
from slugify import slugify
from collections import defaultdict
from datetime import datetime, timezone
import locale
from xml.etree.ElementTree import Element, SubElement, ElementTree
from zoneinfo import ZoneInfo  # Python 3.9+
from dateutil import parser  # pip install python-dateutil
from bs4 import BeautifulSoup
from collections import defaultdict
from urllib.parse import urlparse, urlunparse, urljoin
import os
import json


# Nastavitve
BASE_SITE_URL = "https://metodlangus.github.io"
# BASE_SITE_URL = "http://127.0.0.1:5500/metodlangus.github.io"
SITEMAP_FILE = "sitemap.xml"

# Constants
BASE_FEED_URL = "https://gorski-uzitki.blogspot.com/feeds/posts/default"
OUTPUT_DIR = Path.cwd() # Current path
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

entries_per_page = 12 # Set pagination on home and label pages


def override_domain(url, base_site_url):
    """
    Overrides the domain and base path from base_site_url,
    preserving the path, query, and fragment from the original URL.
    """
    parsed_original = urlparse(url)
    
    # Ensure the path does not start with a leading slash
    relative_path = urlunparse(('', '', parsed_original.path.lstrip('/'),
                                parsed_original.params,
                                parsed_original.query,
                                parsed_original.fragment))
    
    # Safely join
    return urljoin(base_site_url.rstrip('/') + '/', relative_path)

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
        # Pridobi href iz linkov
        links = entry.get("link", [])
        href = next((l.get("href") for l in links if l.get("rel") == "alternate" and l.get("type") == "text/html"), None)

        if href:
            path_parts = urlparse(href).path.strip("/").split("/")
            # Expecting: ['posts', 'year', 'month', 'slugify-title.html']
            if len(path_parts) >= 4:
                year = path_parts[1]
                month = path_parts[2]
                unique_slug = os.path.splitext(path_parts[3])[0]
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

    url = "data/all-posts.json"
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
    Uses WebP only, adds alt tags, <picture> elements, and loading attributes.
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

        if "peak" in skip_keywords:
            table = img.find_parent("table", class_="tr-caption-container")
            if table:
                caption_td = table.find("td", class_="tr-caption")
                if caption_td and caption_td.get_text(strip=True):
                    alt_text = caption_td.get_text(strip=True)
        elif any(k in skip_keywords for k in ["best", "cover", "1"]):
            alt_text = post_title
        elif all(k in ["2", "3", "na"] for k in skip_keywords):
            alt_text = ""
        else:
            alt_text = ""

        img["alt"] = alt_text

        # Step 2: Fix image src resolution
        src = img.get("src", "")
        new_src = src.replace("/s1600/", "/s1000/").replace("/s1200/", "/s600/")
        new_src = re.sub(r"(/s\d+)(/)", r"\1-rw\2", new_src)  # Add -rw for WebP
        img["src"] = new_src

        # Step 3: Fix <a> href resolution
        href = a_tag.get("href", "")
        new_href = href.replace("/s1600/", "/s1000/").replace("/s1200/", "/s600/")
        new_href = re.sub(r"(/s\d+)(/)", r"\1-rw\2", new_href)  # Add -rw for WebP
        a_tag["href"] = new_href

        # Step 4: Add lightbox attribute
        a_tag["data-lightbox"] = "Gallery"

        # Step 5: Add loading attributes
        if image_index == 0:
            img["loading"] = "eager"
            img["fetchpriority"] = "high"
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

def render_post_html(entry, index, entries_per_page, slugify_func, post_id):
    # Set Slovenian locale
    try:
        locale.setlocale(locale.LC_TIME, 'Slovenian_Slovenia.1250')
    except locale.Error:
        locale.setlocale(locale.LC_TIME, '')  # fallback

    published_raw = entry.get("published", {}).get("$t", "1970-01-01T00:00:00Z")
    published_dt = datetime.strptime(published_raw, "%Y-%m-%dT%H:%M:%S.%f%z")
    published = published_dt.strftime("%A, %d. %B %Y")

    title = entry.get("title", {}).get("$t", f"untitled-{index}")
    thumbnail = entry.get("media$thumbnail", {}).get("url", "")
    link_list = entry.get("link", [])
    raw_link = next((l["href"] for l in link_list if l.get("rel") == "alternate"), "#")
    alternate_link = override_domain(raw_link, BASE_SITE_URL)
    categories = entry.get("category", [])

    label_one = next((c["term"].replace("1. ", "") for c in categories if c["term"].startswith("1. ")), "")
    label_six = next((c["term"].replace("6. ", "") for c in categories if c["term"].startswith("6. ")), "")

    label_one_link = f"{BASE_SITE_URL}/search/labels/{slugify_func(label_one)}.html" if label_one else ""
    label_six_link = f"{BASE_SITE_URL}/search/labels/{slugify_func(label_six)}.html" if label_six else ""

    page_number = 1 if entries_per_page == 0 else (index // entries_per_page + 1)

    style_attr = "" if entries_per_page == 0 else ' style="display:none;"'

    base_site_url = BASE_SITE_URL

    return f"""
          <div class="photo-entry" data-page="{page_number}"{style_attr}>
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
                    {'<img src="' + thumbnail.replace('/s72-c', '/s600-rw') + '" alt="Thumbnail image for post: ' + title + '">' if thumbnail else ""}
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
    """
    archive_dict = generate_unique_slugs(entries, return_type="archive")

    archive_html = """<aside class="sidebar-archive">
  <h2>Arhiv</h2>
"""

    for y in sorted(archive_dict.keys(), reverse=True):
        year_posts = archive_dict[y]
        year_count = sum(len(posts) for posts in year_posts.values())
        archive_html += f"""  <details open>
    <summary>{y} ({year_count})</summary>
"""

        for m in sorted(year_posts.keys(), reverse=True):
            posts = year_posts[m]
            try:
                month_name = datetime.strptime(m, '%m').strftime('%B')
            except ValueError:
                month_name = m
            month_label = f"{month_name} {y} ({len(posts)})"

            archive_html += f"""    <details class="month-group">
      <summary>{month_label}</summary>
      <ul>
"""

            for slug, title in posts:
                safe_title = (
                    title.replace("&", "&amp;")
                         .replace("<", "<")
                         .replace(">", ">")
                         .replace('"', "&quot;")
                         .replace("'", "&#x27;")
                )
                archive_html += f"""        <li><a href="{BASE_SITE_URL}/posts/{y}/{m}/{slug}.html">{safe_title}</a></li>
"""

            archive_html += """      </ul>
    </details>
"""

        archive_html += "  </details>\n"

    archive_html += "</aside>"
    return archive_html


def generate_labels_sidebar_html(feed_url):
    """Fetches labels from a Blogger feed and returns structured sidebar HTML."""

    response = requests.get(feed_url, params={"alt": "json"})
    feed_data = response.json()

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
                f"<li><a class='label-name' href='{BASE_SITE_URL}/search/labels/{slug}.html'>{clean_label}</a></li>"
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
        label_filter_html = generate_label_filter_section(feed_url=BASE_FEED_URL)

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
        if current_page == "slideshow":
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

def generate_label_filter_section(feed_url):
    """
    Fetches labels from the Blogger feed and returns HTML for
    a selectable label filter section with collapsible checkboxes (play button style)
    and a Clear Filters button.
    """

    response = requests.get(feed_url, params={"alt": "json"})
    feed_data = response.json()

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

def generate_sidebar_html(archive_html, labels_html, picture_settings, map_settings, current_page):
    # Render settings section (includes conditional logic for photo player page)
    settings_html = render_sidebar_settings(picture_settings, map_settings, current_page)

    # Include labels and archive only if current page is posts or labels
    posts_sections = ""
    if current_page in ["posts", "labels", "home"]:
        posts_sections = f"""
        <div class="labels">
          {labels_html}
        </div>
        <div class="archive">
          {archive_html}
        </div>
        """

    # Full sidebar HTML
    return f"""
    <div class="sidebar-container">
      <div class="sidebar" id="sidebar">
        <div class="pages">
          <aside class='sidebar-pages'><h2>Strani</h2>
            <li><a href="{BASE_SITE_URL}/gorski-uzitki.html">Dnevnik</a></li>
            <li><a href="{BASE_SITE_URL}/predvajalnik-nakljucnih-fotografij.html">Predvajalnik naključnih fotografij</a></li>
            <li><a href="{BASE_SITE_URL}/seznam-vrhov.html">Seznam vrhov</a></li>
            <li><a href="{BASE_SITE_URL}/zemljevid-spominov.html">Zemljevid spominov</a></li>
          </aside>
        </div>
        {settings_html}
        {posts_sections}
      </div>
    </div>
    """

def generate_header_html():
    return f"""
    <h1>
      <span style="position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; border: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap;">
        Gorski Užitki
      </span>
      <a class='logo-svg' href="{BASE_SITE_URL}/gorski-uzitki.html">
        <svg class='logo-svg' height='67' version='1.0' viewBox='0 0 1350 168' width='540' xmlns='http://www.w3.org/2000/svg'>
          <g fill='#666'>
            <path d='m945 4-14 6h-13c-10-6-10-6-22-5-12 0-12 0-16 3l-5 3c-2 0-5 4-5 6s4 7 14 16l13 16-9 1c-7 0-8 0-11 3s-10 6-12 6c-1 0-2 4-2 9s-1 7-2 5l-2-8c0-7-2-12-5-14l-22-1c-17 0-20 0-23 2l-3 2-4 2-4 2-4-4-5-5-23 1h-23l-3 3c-2 2-4 5-6 5-2 2-2 2-3 16l-1 18a253 253 0 0 0 1 32c0 5 3 14 6 17l1 3c0 2 6 8 12 12 3 3 5 3 16 4h12l21-2 26 1c25 0 29 0 32-4 2-3 4-2 6 1 3 3 12 5 17 3h29a494 494 0 0 1 51-1l6-1 8-2 4-2 2 2 8 4h18c12 0 19-1 21-2l8-3c6-2 7-4 7-18l1-26V95h7l8-1 1 17c1 14 1 18 4 24 2 6 3 9 8 13 5 5 9 6 23 10a164 164 0 0 0 52-2c3-2 3-2 7 1 3 2 4 2 22 2 20-1 30-2 34-4 2-1 3-1 7 1 6 3 6 3 24 3l21-1c3-1 18-2 20 0 2 1 39 2 40 0l8-2c3-1 7-3 8-5l3-2V56l-3-2c-3-3-3-4-1-8l1-18c-1-21 1-20-24-20-19 0-19 0-23 3l-6 3-4 3c-2 3-2 4-2 17l1 16 5 2c5 0 5 2 0 4s-7 2-7 1l-5-4c-4-3-5-3-15-3-16 0-28 2-34 4l-7 3c-3 2-5 1-5-4l2-17V22l-3-4-4-4h-39l-3 3-4 3-4 2c-3 2-4 3-5 9l-1 11v8c0 5-2 5-6 3l-12-3-10-1-1-14c0-14-1-17-8-19-8-3-40-1-40 2l-4 2c-4 0-10 5-10 7v13l-1 12-4 2c-8 4-10 4-14 0-3-3-4-6-2-8l2-16V14l-3-3-3-3h-38l-4 3-5 3-4 2c-2 2-3 12-2 26v8l4 1c6 2 7 3 2 5-6 3-7 4-8 9v44l1 5c0 4 0 4-3 4l-3-1-13-1c-10-1-12-2-12-3 0-2 2-4 7-8l12-10 5-5 1-15-1-18c-2-4-5-5-18-6l-14-1c-3-1-3-4 0-4 4-2 25-26 27-32 2-5 0-9-5-10h-18zm12 8 2 2-14 16-7 8h-26l-11-11-11-13 3-2c5-1 13 1 21 5l10 4 11-4c12-6 18-7 22-5zm74 4 1 12c0 15 1 14-16 14l-14-2c-3-1-4-7-4-15 0-7 0-8 2-9h31zm297 1 1 12c0 10 0 11-2 12-3 2-27 0-29-1l-2-8c-3-17-2-17 17-17l15 2zm-217 7c2 1 2 3 2 17 0 18-1 17 14 17 13 0 13 0 13 13l-1 12c0 2-10 3-18 1s-8-1-8 14c0 19 2 21 18 23 10 0 11 0 12 2 1 4 2 22 1 24-1 1-4 2-18 2l-22-1c-8-2-23-16-25-23l-2-20c-2-24 0-22-11-22h-8l-1-10c0-13 0-13 11-13l7-1 2-15c0-16 1-20 4-20 6-2 27-1 30 0zm93-1v19c-2 25-1 45 0 47 3 2 5 1 8-4a88 88 0 0 1 6-10c6-8 11-15 13-15l19-2c19 0 19 0 14 8a81 81 0 0 1-4 7l-3 5-3 4-5 8-4 8 5 9 9 16a99 99 0 0 0 10 17l2 2c2 2 1 6-1 6l-20 1c-21 0-20 1-26-12-5-10-12-21-14-22h-3c-2 1-2 4-2 17 0 14 0 15-2 16h-34v-17c-1-21 1-104 1-107 1-2 1-2 17-2l17 1zM786 59l2 30c1 28 1 28 3 31 6 7 15 7 20 1 3-3 3-4 4-15 0-9-1-27-3-40-1-7 0-7 20-7l17 1 1 3a664 664 0 0 1 1 86l-17 1c-18 0-19 0-19-6 0-3 0-3-3-3-2 0-4 1-7 4-7 8-25 9-37 3-8-4-18-18-20-29a460 460 0 0 1 1-60h37zm167 1 11 2c1 1 2 24 1 26l-6 5a536 536 0 0 0-27 23c-3 2-4 5-1 6l20 2 19 2 1 11c0 8 0 10-2 12l-42 1-44-2c-2-1-2-1-2-12 0-13 0-12 13-24 16-13 25-22 25-24l-2-2c-2-1-4-2-8-1h-27l-1-12c0-8 0-11 2-12 1-2 5-2 30-2l40 1zm81 2a654 654 0 0 1-1 84c-2 2-31 2-34 0l-2-1v-40l1-42c1-2 2-2 18-2l18 1zm297 4v80c-1 2-2 2-18 2l-17-1a963 963 0 0 1 1-85l18-1h16v5zm-55 6 1 16v22c1 4 0 23-1 23-2 0-7-8-11-16l-7-12-3-6 16-27c4-5 6-5 6 0zm-126 19c-1 3-1 5 1 9v14c0 2 0 2-2 2l-4-1-6-1c-9 0-16-1-17-3l-1-8c0-5 0-6 2-7h4l5-1 5-1c3 0 10-4 11-6s1-2 2-1v4zm-287-1c0 4 2 5 15 5 9 0 14 1 14 2s-11 12-21 20c-4 4-7 7-7 9l-2 2c-2 0-2-3-2-19l1-20c1-1 2 0 2 1zM637 11l-5 3c-5 0-7 9-6 23s1 14 5 14c6 1 6 3 1 5-5 3-6 3-8 0-6-5-7-6-19-6-21 0-30 2-40 7-3 2-5 1-5-1V20c-2-5-5-6-26-6-18 0-19 0-21 2l-7 5c-8 4-8 4-8 33a782 782 0 0 0 0 40v10c1 5-2 5-6 1l-9-8c-4-3-5-5-4-6l5-1c10 0 14-13 6-23-3-3-11-10-16-12-10-5-14-5-32-5-17 0-17 0-23 3l-15 7-17 7-1-5-1-7c-2-7-25-7-38 0-5 2-5 2-8 0-5-5-7-5-26-5-17 0-17 0-20 2-1 2-4 4-7 5-6 2-6 4-7 16l-1 13c0 2-3-1-4-5l-1-5-3-6c-2-6-6-10-12-13l-6-3-5-1-6-1c-6-2-45-3-47-1l-4 2c-6 1-20 11-28 19s-10 9-10 5l-2-5-3-3 3-4c2-4 2-5 1-10-1-7-5-12-12-19a50 50 0 0 0-32-18l-26-1c-17 0-18 0-25 2l-10 4-10 5-12 6-6 7-4 5-6 13-1 3a321 321 0 0 0 1 59l2 6 2 6c0 2 12 16 15 17l5 3a141 141 0 0 0 40 8c11 0 35-4 39-6 2-1 8-4 11-4 5-2 16-10 21-16 9-12 7-11 10-6l2 6 6 8c6 8 11 11 25 15a175 175 0 0 0 41 1l10-2 7-2 3-1 17-9c4-4 9-12 11-16l2-4c2 0 2 4 2 19l1 9c2 6 4 6 26 6a167 167 0 0 0 28-2l7-3 2-2v-25c0-28-1-26 15-27l14-1c6-3 8-2 9 1l6 9 6 7c0 1-6 7-10 9-3 1-5 3-5 6 0 4 3 11 7 14 4 4 15 11 16 11l5 2 14 2 13 1a119 119 0 0 0 38-8l3-2 8-7 10-6c5-4 6-3 6 7 0 7 0 8 3 11l3 3h19c20-1 31-2 33-4 2-1 8 0 11 3 2 1 37 1 50-1h11c4 2 39 3 43 0l4-1 5-2c8-3 7-2 8-52 0-45-1-48-5-50v-6c1-2 2-7 2-18V14l-3-3-3-3h-39l-3 3zm39 6 1 12c0 11 0 11-2 12-3 1-27 0-29-1-1-1-2-4-2-10-1-11 0-14 2-14 2-1 29 0 30 1zM552 55v34c2 2 5 1 7-3l2-4a1412 1412 0 0 0 17-22l20-2h16v2l-4 9-8 13-6 9-3 6 6 13 7 11c0 1 3 7 9 15 5 9 6 11 3 12a201 201 0 0 1-40 0l-6-9c-5-11-13-24-15-25l-3 1-2 17-1 16h-32c-2 0-2-1-3-7l3-118 16-1h17v33zM97 25l11 2c11 2 13 3 25 15 8 7 10 11 10 16v4h-43l-4-5-10-5c-7 0-12 1-16 5-5 4-5 7-4 31 0 22 1 24 7 30 3 2 4 3 11 3 8 0 13-2 16-7 5-7 4-13-3-13-6 0-7-1-7-12-1-13-3-13 23-12h25l5 2c2 1 2 34 0 39-2 8-12 19-20 23l-21 8c-8 2-20 3-27 2-14-2-18-3-24-7l-7-4c-1 0-12-10-13-13-4-8-8-27-7-35V73c1-22 7-35 22-41l7-3 3-1 4-1 6-2h31zm130 33c13 1 20 2 26 6 4 2 10 7 10 10l2 5 2 6 1 3c3 3 4 22 2 30-1 5-5 14-8 18-3 3-12 9-19 11-4 2-8 2-15 2l-12 1h-5l-6-1-17-5c-4-3-10-10-15-19-3-6-3-7-3-12a229 229 0 0 1 8-36c1-4 4-9 6-11 2-3 13-8 16-8h26zm96 0c8 1 10 2 10 7 0 6 6 6 11 2 6-6 14-8 23-9l10 1v28c-1 2-2 2-14 2-15 0-21 2-25 7l-3 3v23l1 25c-1 2-2 2-18 2l-18-1c-2-1-2-2-2-22a1560 1560 0 0 0 2-68h23zm139 1 4 1c4 1 13 7 17 12l3 6v3l-17 1c-16 0-16 0-20-3s-7-3-11 0c-7 5-1 13 12 15 12 1 18 3 25 8 10 7 16 13 17 17 1 6-1 9-7 13-7 6-8 6-19 12-8 4-10 4-20 5-7 1-11 1-16-1l-11-2c-9-2-18-7-22-13-3-6-2-7 6-7l15-1c8-1 8-1 15 2 8 3 11 3 15 0 3-2 4-4 1-8-2-3-6-5-16-7-12-3-14-3-20-6l-10-7c-5-5-5-5-5-11v-7l8-8c12-10 18-15 25-15 7-1 30 0 31 1zm217 18c1 19 0 67-1 68-2 2-31 2-34 1l-1-43c-1-36 0-41 1-42l18-1h16l1 16zM80 67l3 5-8 4c-2-1-3-7-1-10 1-3 4-2 6 1zm544 1 1 54c-1 9-1 9-3 9l-8-11c-1-5-4-9-8-15l-4-7 6-9 14-22 2 1z'/>
            <path d='m213 82-3 4c-1 5-2 20-1 28 1 7 1 9 3 11 5 3 10 3 15-1 3-3 3-5 3-8l1-10c2-7 0-18-4-22-3-4-9-5-14-2z'/>
          </g>
        </svg>
      </a>
    </h1>
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
        <button id="searchClose" aria-label="Close search" 
          style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
                background: transparent; border: none; font-size: 20px; cursor: pointer;">
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
        Poganja 
        <a href="https://github.com" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="72 72 496 496" width="16" height="16" fill="currentColor" style="vertical-align: text-top; margin-right: -1px;">
            <!--!Font Awesome Free v7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free -->
            <path fill="#f3891d" d="M237.9 461.4C237.9 463.4 235.6 465 232.7 465C229.4 465.3 227.1 463.7 227.1 461.4C227.1 459.4 229.4 457.8 232.3 457.8C235.3 457.5 237.9 459.1 237.9 461.4zM206.8 456.9C206.1 458.9 208.1 461.2 211.1 461.8C213.7 462.8 216.7 461.8 217.3 459.8C217.9 457.8 216 455.5 213 454.6C210.4 453.9 207.5 454.9 206.8 456.9zM251 455.2C248.1 455.9 246.1 457.8 246.4 460.1C246.7 462.1 249.3 463.4 252.3 462.7C255.2 462 257.2 460.1 256.9 458.1C256.6 456.2 253.9 454.9 251 455.2zM316.8 72C178.1 72 72 177.3 72 316C72 426.9 141.8 521.8 241.5 555.2C254.3 557.5 258.8 549.6 258.8 543.1C258.8 536.9 258.5 502.7 258.5 481.7C258.5 481.7 188.5 496.7 173.8 451.9C173.8 451.9 162.4 422.8 146 415.3C146 415.3 123.1 399.6 147.6 399.9C147.6 399.9 172.5 401.9 186.2 425.7C208.1 464.3 244.8 453.2 259.1 446.6C261.4 430.6 267.9 419.5 275.1 412.9C219.2 406.7 162.8 398.6 162.8 302.4C162.8 274.9 170.4 261.1 186.4 243.5C183.8 237 175.3 210.2 189 175.6C209.9 169.1 258 202.6 258 202.6C278 197 299.5 194.1 320.8 194.1C342.1 194.1 363.6 197 383.6 202.6C383.6 202.6 431.7 169 452.6 175.6C466.3 210.3 457.8 237 455.2 243.5C471.2 261.2 481 275 481 302.4C481 398.9 422.1 406.6 366.2 412.9C375.4 420.8 383.2 435.8 383.2 459.3C383.2 493 382.9 534.7 382.9 542.9C382.9 549.4 387.5 557.3 400.2 555C500.2 521.8 568 426.9 568 316C568 177.3 455.5 72 316.8 72zM169.2 416.9C167.9 417.9 168.2 420.2 169.9 422.1C171.5 423.7 173.8 424.4 175.1 423.1C176.4 422.1 176.1 419.8 174.4 417.9C172.8 416.3 170.5 415.6 169.2 416.9zM158.4 408.8C157.7 410.1 158.7 411.7 160.7 412.7C162.3 413.7 164.3 413.4 165 412C165.7 410.7 164.7 409.1 162.7 408.1C160.7 407.5 159.1 407.8 158.4 408.8zM190.8 444.4C189.2 445.7 189.8 448.7 192.1 450.6C194.4 452.9 197.3 453.2 198.6 451.6C199.9 450.3 199.3 447.3 197.3 445.4C195.1 443.1 192.1 442.8 190.8 444.4zM179.4 429.7C177.8 430.7 177.8 433.3 179.4 435.6C181 437.9 183.7 438.9 185 437.9C186.6 436.6 186.6 434 185 431.7C183.6 429.4 181 428.4 179.4 429.7z"/>
          </svg>
          GitHub
        </a>
      </p>
      <p>© 2025 Metod Langus. Vse pravice pridržane.</p>
    </footer>"""

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
    <div class="nav-links-wrapper" style="margin-top: 2em;">
      <div class="nav-links" style="display: flex; justify-content: space-between; flex-wrap: wrap;">
    """

    if prev_slug:
        nav_html += f"""
        <div class="prev-link" style="text-align: left; max-width: 45%;">
          <div class="pager-title">Prejšnja objava</div>
          <a href="{BASE_SITE_URL}/posts/{prev_year}/{prev_month}/{prev_slug}.html">&larr; {prev_title}</a>
        </div>
        """

    if next_slug:
        nav_html += f"""
        <div class="next-link" style="text-align: right; max-width: 45%;">
          <div class="pager-title">Naslednja objava</div>
          <a href="{BASE_SITE_URL}/posts/{next_year}/{next_month}/{next_slug}.html">{next_title} &rarr;</a>
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
                label_url = f"{BASE_SITE_URL}/search/labels/{slugify(slug_part)}.html"
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



def generate_url_element(loc, lastmod=None):
    """Ustvari en <url> element za sitemap brez changefreq in priority."""
    url = Element("url")
    SubElement(url, "loc").text = loc
    if lastmod:
        SubElement(url, "lastmod").text = lastmod
    return url

def generate_sitemap(entries):
    """Ustvari sitemap.xml iz Blogger vnosov in vključi domačo stran."""
    urlset = Element("urlset", {
        "xmlns": "http://www.sitemaps.org/schemas/sitemap/0.9"
    })

    # Dodaj domačo stran
    homepage_url = BASE_SITE_URL
    homepage_lastmod = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    homepage_element = generate_url_element(homepage_url, homepage_lastmod)
    urlset.append(homepage_element)

    # Dodaj ostale vnose
    for entry in entries:
        published = entry.get("published", {}).get("$t", "")
        try:
            dt = datetime.strptime(published, "%Y-%m-%dT%H:%M:%S.%fZ").replace(tzinfo=timezone.utc)
        except ValueError:
            dt = datetime.now(timezone.utc)
        lastmod = dt.strftime("%Y-%m-%dT%H:%M:%SZ")

        # Extract the actual post URL from the entry's "link" list
        post_url = None
        for link in entry.get("link", []):
            if link.get("rel") == "alternate" and link.get("type") == "text/html":
                post_url = link.get("href")
                break

        if post_url:
            url_element = generate_url_element(post_url, lastmod)
            urlset.append(url_element)

    tree = ElementTree(urlset)
    tree.write(SITEMAP_FILE, encoding="utf-8", xml_declaration=True)
    print(f"Sitemap je bil ustvarjen in shranjen kot {SITEMAP_FILE}")

def fetch_and_save_all_posts(entries):
    # Archive and labels sidebar
    archive_sidebar_html = build_archive_sidebar_html(entries)
    labels_sidebar_html = generate_labels_sidebar_html(feed_url=BASE_FEED_URL)
    sidebar_html = generate_sidebar_html(archive_sidebar_html, labels_sidebar_html, picture_settings=True, map_settings=False, current_page="posts")
    header_html = generate_header_html()
    searchbox_html = generate_searchbox_html()
    footer_html = generate_footer_html()

    local_tz = ZoneInfo("Europe/Ljubljana")

    label_posts_raw = defaultdict(list)

    # Get just the list of slugs
    slugs = generate_unique_slugs(entries, local_tz)

    for index, entry in enumerate(entries):  # Only first 5 entries entries[:5]
        title = entry.get("title", {}).get("$t", f"untitled-{index}")
        content_html = entry.get("content", {}).get("$t", "")
        slug = slugs[index]

        full_id = entry.get("id", {}).get("$t", "")
        post_id = full_id.split("post-")[-1] if "post-" in full_id else ""

        # Get the author name
        author = entry.get("author", {}).get("name", {}).get("$t", "")

        # Parse published date
        formatted_date, year, month = parse_entry_date(entry, index)

        # Insert MyPostContainer divs
        content_html = replace_mypost_scripts_with_rendered_posts(
                            content_html,
                            entries,
                            entries_per_page=0, #Always visible page
                            slugify_func=slugify,
                            render_func=render_post_html
                        )

        # Fix images
        content_html = fix_images_for_lightbox(content_html, title)

        # Extract first image for og:image
        soup = BeautifulSoup(content_html, "html.parser")
        first_img_tag = soup.find("img")
        og_image = first_img_tag["src"] if first_img_tag else "https://metodlangus.github.io/assets/default-og.jpg"

        # Construct og:url
        og_url = f"{BASE_SITE_URL}/posts/{year}/{month}/{slug}.html"
        metadata_html = f"<div class='post-date' data-date='{formatted_date}'></div>"

        # Previous and next posts with correct date paths
        nav_html = generate_post_navigation_html(entries, slugs, index, local_tz, year, month)

        # Labels
        labels_html = generate_labels_html(entry, title, slug, year, month, formatted_date, post_id, label_posts_raw,
                                                            slugify, remove_first_prefix, remove_all_prefixes)

        post_dir = OUTPUT_DIR / "posts" / year / month
        post_dir.mkdir(parents=True, exist_ok=True)
        filename = post_dir / f"{slug}.html"

        with open(filename, "w", encoding="utf-8") as f:
            f.write(f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=400, initial-scale=0.8,  maximum-scale=2.0, user-scalable=yes">
  <meta name="google-site-verification" content="4bTHS88XDAVpieH98J47AZPNSkKkTj0yHn97H5On5SU" />
  <meta name="description" content="Gorske avanture in nepozabni trenutki: Odkrijte lepote gorskega sveta in se prepustite predvajalnikom slik, ki vas popeljejo skozi dogodivščine." />
  <meta name="keywords" content="gorske avanture, pustolovščine, pohodništvo, gore, fotografije, narava, prosti čas, gorski užtiki, Metod Langus" />
  <meta name="author" content="Metod Langus" />

  <title>{title}</title>

  <!-- OpenGraph meta tags -->
  <meta property="og:title" content="{title}">
  <meta property="og:type" content="article">
  <meta property="og:image" content="{og_image}">
  <meta property="og:url" content="{og_url}">
  <meta property="og:description" content="{title}">

  <script>
    var postTitle = {title!r};
    var postId = {post_id!r};
    var author = {author!r};
  </script>

  <!-- Favicon -->
  <link rel="icon" href="{BASE_SITE_URL}/photos/favicon.ico" type="image/x-icon">

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
        <h2>{title}</h2>
        {metadata_html}
        {content_html}
        {labels_html}
        {nav_html}
      </div>
    </div>
  </div>

  <!-- Footer -->
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

    # Generate sidebar, header, footer, etc.
    archive_sidebar_html = build_archive_sidebar_html(entries)
    labels_sidebar_html = generate_labels_sidebar_html(feed_url=BASE_FEED_URL)
    sidebar_html = generate_sidebar_html(archive_sidebar_html, labels_sidebar_html, picture_settings=True, map_settings=False, current_page="labels")
    header_html = generate_header_html()
    searchbox_html = generate_searchbox_html()
    footer_html = generate_footer_html()

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
        filename = labels_dir / f"{label_slug}.html"

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

        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=400, initial-scale=0.8,  maximum-scale=2.0, user-scalable=yes">
  <meta name="google-site-verification" content="4bTHS88XDAVpieH98J47AZPNSkKkTj0yHn97H5On5SU" />
  <meta name="description" content="Gorske avanture in nepozabni trenutki: Odkrijte lepote gorskega sveta in se prepustite predvajalnikom slik, ki vas popeljejo skozi dogodivščine." />
  <meta name="keywords" content="gorske avanture, pustolovščine, pohodništvo, gore, fotografije, narava, prosti čas, gorski užtiki, Metod Langus" />
  <meta name="author" content="Metod Langus" />

  <title>Prikaz objav z oznako: {label_clean}</title>

  <!-- Favicon -->
  <link rel="icon" href="{BASE_SITE_URL}/photos/favicon.ico" type="image/x-icon">

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
  {footer_html}

  <script src="{BASE_SITE_URL}/assets/Main.js" defer></script>

</body>
</html>"""

        with open(filename, "w", encoding="utf-8") as f:
            f.write(html_content)

        print(f"Generated label page: {filename}")


def generate_predvajalnik_page(current_page):
    output_path = OUTPUT_DIR / "predvajalnik-nakljucnih-fotografij.html"

    # Generate the full archive sidebar from all entries
    archive_sidebar_html = build_archive_sidebar_html(entries)
    labels_sidebar_html = generate_labels_sidebar_html(feed_url=BASE_FEED_URL)
    sidebar_html = generate_sidebar_html(archive_sidebar_html, labels_sidebar_html, picture_settings=True, map_settings=False, current_page="slideshow")
    header_html = generate_header_html()
    searchbox_html = generate_searchbox_html()
    footer_html = generate_footer_html()

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=400, initial-scale=0.8,  maximum-scale=2.0, user-scalable=yes">
  <meta name="google-site-verification" content="4bTHS88XDAVpieH98J47AZPNSkKkTj0yHn97H5On5SU" />
  <meta name="description" content="Gorske avanture in nepozabni trenutki: Odkrijte lepote gorskega sveta in se prepustite predvajalnikom slik, ki vas popeljejo skozi dogodivščine." />
  <meta name="keywords" content="gorske avanture, pustolovščine, pohodništvo, gore, fotografije, narava, prosti čas, gorski užtiki, Metod Langus" />
  <meta name="author" content="Metod Langus" />
  <meta property="og:title" content="Predvajalnik naključnih fotografij" />
  <meta property="og:description" content="Gorske avanture in nepozabni trenutki: Odkrijte lepote gorskega sveta in se prepustite predvajalnikom slik, ki vas popeljejo skozi dogodivščine." />
  <meta property="og:image:alt" content="Gorski razgledi in narava v slikah" />
  <meta property="og:url" content="https://metodlangus.github.io/predvajalnik-nakljucnih-fotografij.html" />
  <meta property="og:type" content="website" />

  <title>Predvajalnik naključnih fotografij</title>

  <script>
    var postTitle = 'Predvajalnik naključnih fotografij';
    var postId = '8898311262758762797';
    var author = 'Metod';
  </script>

  <!-- Favicon -->
  <link rel="icon" href="{BASE_SITE_URL}/photos/favicon.ico" type="image/x-icon">

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
  {footer_html}

  <script src="assets/Main.js" defer></script>
  <script src="assets/MySlideshowScript.js" defer></script>

</body>
</html>"""

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Generated random slideshow page: {output_path}")


def generate_peak_list_page():
    output_path = OUTPUT_DIR / "seznam-vrhov.html"

    # Generate the full archive sidebar from all entries
    archive_sidebar_html = build_archive_sidebar_html(entries)
    labels_sidebar_html = generate_labels_sidebar_html(feed_url=BASE_FEED_URL)
    sidebar_html = generate_sidebar_html(archive_sidebar_html, labels_sidebar_html, picture_settings=False, map_settings=False, current_page="peak-list")
    header_html = generate_header_html()
    searchbox_html = generate_searchbox_html()
    footer_html = generate_footer_html()

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=400, initial-scale=0.8,  maximum-scale=2.0, user-scalable=yes">
  <meta name="google-site-verification" content="4bTHS88XDAVpieH98J47AZPNSkKkTj0yHn97H5On5SU" />
  <meta name="description" content="Gorske avanture in nepozabni trenutki: Odkrijte lepote gorskega sveta in se prepustite predvajalnikom slik, ki vas popeljejo skozi dogodivščine." />
  <meta name="keywords" content="gorske avanture, pustolovščine, pohodništvo, gore, fotografije, narava, prosti čas, gorski užtiki, Metod Langus" />
  <meta name="author" content="Metod Langus" />
  <meta property="og:title" content="Seznam vrhov" />
  <meta property="og:description" content="Seznam obiskanih vrhov." />
  <meta property="og:image:alt" content="Seznam obiskanih vrhov" />
  <meta property="og:url" content="https://metodlangus.github.io/seznam-vrhov.html" />
  <meta property="og:type" content="website" />

  <title>Seznam vrhov</title>

  <script>
    var postTitle = 'Seznam vrhov';
    var postId = '3182270651807797129';
    var author = 'Metod';
  </script>

  <!-- Favicon -->
  <link rel="icon" href="{BASE_SITE_URL}/photos/favicon.ico" type="image/x-icon">

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
        <div id='mountainContainer'/></div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  {footer_html}

  <script src="assets/Main.js" defer></script>
  <script src="assets/MyPeakListScript.js" defer></script>

</body>
</html>"""

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Generated peak list page: {output_path}")


def generate_big_map_page():
    output_path = OUTPUT_DIR / "zemljevid-spominov.html"

    # Generate the full archive sidebar from all entries
    archive_sidebar_html = build_archive_sidebar_html(entries)
    labels_sidebar_html = generate_labels_sidebar_html(feed_url=BASE_FEED_URL)
    sidebar_html = generate_sidebar_html(archive_sidebar_html, labels_sidebar_html, picture_settings=False, map_settings=True, current_page="map")
    header_html = generate_header_html()
    searchbox_html = generate_searchbox_html()
    footer_html = generate_footer_html()

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=400, initial-scale=0.8,  maximum-scale=2.0, user-scalable=yes">
  <meta name="google-site-verification" content="4bTHS88XDAVpieH98J47AZPNSkKkTj0yHn97H5On5SU" />
  <meta name="description" content="Gorske avanture in nepozabni trenutki: Odkrijte lepote gorskega sveta in se prepustite predvajalnikom slik, ki vas popeljejo skozi dogodivščine." />
  <meta name="keywords" content="gorske avanture, pustolovščine, pohodništvo, gore, fotografije, narava, prosti čas, gorski užtiki, Metod Langus" />
  <meta name="author" content="Metod Langus" />
  <meta property="og:title" content="Zemljevid spominov" />
  <meta property="og:description" content="Zemljevid spominov, ki zajema slike ter sledi poti." />
  <meta property="og:image:alt" content="Zemljevid spominov" />
  <meta property="og:url" content="https://metodlangus.github.io/zemljevid-spominov.html" />
  <meta property="og:type" content="website" />

  <title>Zemljevid spominov</title>

  <script>
    var postTitle = 'Zemljevid spominov';
    var author = 'Metod';
  </script>

  <!-- Favicon -->
  <link rel="icon" href="{BASE_SITE_URL}/photos/favicon.ico" type="image/x-icon">

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
          <div id='map'></div>
      </div>
    </div>
  </div>

  <!-- Footer -->
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

  <script src="assets/Main.js" defer></script>
  <script src="assets/MyMemoryMapScript.js" defer></script>

</body>
</html>"""

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Generated memory map page: {output_path}")


def generate_home_en_page(homepage_html):
    output_path = OUTPUT_DIR / "en/gorski-uzitki.html"

    # Generate the full archive sidebar from all entries
    archive_sidebar_html = build_archive_sidebar_html(entries)
    labels_sidebar_html = generate_labels_sidebar_html(feed_url=BASE_FEED_URL)
    sidebar_html = generate_sidebar_html(archive_sidebar_html, labels_sidebar_html, picture_settings=False, map_settings=False, current_page="home")
    header_html = generate_header_html()
    searchbox_html = generate_searchbox_html()
    footer_html = generate_footer_html()

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=400, initial-scale=0.8,  maximum-scale=2.0, user-scalable=yes">
    <meta name="google-site-verification" content="4bTHS88XDAVpieH98J47AZPNSkKkTj0yHn97H5On5SU" />
    <meta name="description" content="Mountain adventures and unforgettable moments: Discover the beauty of the mountain world and enjoy the image slideshows that take you through the adventures." />
    <meta name="keywords" content="mountain adventures, hiking, mountains, photography, nature, free time, gorski užitki, Metod Langus" />
    <meta name="author" content="Metod Langus" />
    <meta property="og:title" content="Gorski Užitki | Mountain Adventures Through Pictures | Metod Langus" />
    <meta property="og:description" content="Mountain adventures and unforgettable moments: Discover the beauty of the mountain world and enjoy the image slideshows that take you through the adventures." />
    <meta property="og:image" content="images/mountain-landscape-view.jpg" />
    <meta property="og:image:alt" content="Mountain views and nature" />
    <meta property="og:url" content="https://metodlangus.github.io/en/gorski-uzitki.html" />
    <meta property="og:type" content="website" />

    <title>Gorski Užitki | Mountain Adventures Through Pictures | Metod Langus</title>

    <!-- Favicon -->
    <link rel="icon" href="{BASE_SITE_URL}/photos/favicon.ico" type="image/x-icon">

    <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;700&family=Open+Sans&display=swap" rel="stylesheet">

    <link rel="stylesheet" href="{BASE_SITE_URL}/assets/Main.css">
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
  {footer_html}

  <script src="{BASE_SITE_URL}/assets/Main.js" defer></script>

</body>
</html>"""

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Generated home en page: {output_path}")

def generate_home_si_page(homepage_html):
    output_path = OUTPUT_DIR / "gorski-uzitki.html"

    # Generate the full archive sidebar from all entries
    archive_sidebar_html = build_archive_sidebar_html(entries)
    labels_sidebar_html = generate_labels_sidebar_html(feed_url=BASE_FEED_URL)
    sidebar_html = generate_sidebar_html(archive_sidebar_html, labels_sidebar_html, picture_settings=False, map_settings=False, current_page="home")
    header_html = generate_header_html()
    searchbox_html = generate_searchbox_html()
    footer_html = generate_footer_html()

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=400, initial-scale=0.8,  maximum-scale=2.0, user-scalable=yes">
    <meta name="google-site-verification" content="4bTHS88XDAVpieH98J47AZPNSkKkTj0yHn97H5On5SU" />
    <meta name="description" content="Gorske avanture in nepozabni trenutki: Odkrijte lepote gorskega sveta in se prepustite predvajalnikom slik, ki vas popeljejo skozi dogodivščine." />
    <meta name="keywords" content="gorske avanture, pustolovščine, pohodništvo, gore, fotografije, narava, prosti čas, gorski užtiki, Metod Langus" />
    <meta name="author" content="Metod Langus" />
    <meta property="og:title" content="Gorski Užitki | Gorske pustolovščine skozi slike | Metod Langus" />
    <meta property="og:description" content="Gorske avanture in nepozabni trenutki: Odkrijte lepote gorskega sveta in se prepustite predvajalnikom slik, ki vas popeljejo skozi dogodivščine." />
    <meta property="og:image" content="slike/gore-pokrajina-razgled.jpg" />
    <meta property="og:image:alt" content="Gorski razgledi in narava" />
    <meta property="og:url" content="https://metodlangus.github.io/gorski-uzitki.html" />
    <meta property="og:type" content="website" />

    <title>Gorski Užitki | Gorske pustolovščine skozi slike | Metod Langus</title>

    <!-- Favicon -->
    <link rel="icon" href="{BASE_SITE_URL}/photos/favicon.ico" type="image/x-icon">

    <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;700&family=Open+Sans&display=swap" rel="stylesheet">

    <link rel="stylesheet" href="{BASE_SITE_URL}/assets/Main.css">
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
  {footer_html}

  <script src="assets/Main.js" defer></script>

</body>
</html>"""

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Generated home si page: {output_path}")


if __name__ == "__main__":
    entries = fetch_all_entries()
    label_posts_raw = fetch_and_save_all_posts(entries)  # This function should return { label: [ {postId, date, html}, ... ] }
    generate_label_pages(entries, label_posts_raw)
    generate_predvajalnik_page(current_page="predvajalnik-nakljucnih-fotografij.html")
    generate_peak_list_page()
    generate_big_map_page()

    homepage_html = generate_homepage_html(entries)
    generate_home_en_page(homepage_html)
    generate_home_si_page(homepage_html)

    generate_sitemap(entries)