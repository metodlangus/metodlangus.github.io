import re
import requests
from pathlib import Path
from slugify import slugify
from collections import defaultdict
from datetime import datetime
from zoneinfo import ZoneInfo  # Python 3.9+
from dateutil import parser  # pip install python-dateutil
from bs4 import BeautifulSoup
from collections import defaultdict
from urllib.parse import urlparse
import os
import json


# Constants
BASE_FEED_URL = "https://gorski-uzitki.blogspot.com/feeds/posts/default"
OUTPUT_DIR = Path.cwd() # Current path
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

BASE_SITE_URL = "https://metodlangus.github.io"


def get_relative_path(levels_up):
    return '../' * levels_up

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

def fix_images_for_lightbox(html_content):
    """
    Modify image links in HTML content for lightbox compatibility.
    """
    soup = BeautifulSoup(html_content, "html.parser")

    for a_tag in soup.find_all("a"):
        img = a_tag.find("img")
        if not img:
            continue

        # Replace size in href
        href = a_tag.get("href", "")
        new_href = href.replace("/s1200/", "/s600/").replace("/s1600/", "/s1000/")
        a_tag["href"] = new_href

        # Add lightbox attributes
        a_tag["data-lightbox"] = "Gallery"
        title_attr = img.get("alt") or img.get("title") or ""
        if title_attr:
            a_tag["data-title"] = title_attr

        # Replace size in img src
        src = img.get("src", "")
        new_src = src.replace("/s1200/", "/s600/").replace("/s1600/", "/s1000/")
        img["src"] = new_src
    return soup.prettify()

def build_archive_sidebar_html(entries, levels_up):
    """
    Generate complete archive sidebar HTML from Blogger entries.
    """
    relative_path = get_relative_path(levels_up)
    archive_dict = generate_unique_slugs(entries, return_type="archive")

    archive_html = """<aside class="sidebar-archive">
  <h3>Arhiv</h3>
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
                archive_html += f"""        <li><a href="{relative_path}posts/{y}/{m}/{slug}.html">{safe_title}</a></li>
"""

            archive_html += """      </ul>
    </details>
"""

        archive_html += "  </details>\n"

    archive_html += "</aside>"
    return archive_html


def generate_labels_sidebar_html(levels_up, feed_url):
    """Fetches labels from a Blogger feed and returns structured sidebar HTML."""

    relative_path = get_relative_path(levels_up)

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
    label_html_parts = ["<aside class='sidebar-labels'><h3><b>Navigacija</b></h3>"]

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
                f"<li><a class='label-name' href='{relative_path}search/labels/{slug}.html'>{clean_label}</a></li>"
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

def generate_sidebar_html(archive_html, labels_html, levels_up):
    relative_path = get_relative_path(levels_up)
    return f"""
    <button class="menu-toggle" onclick="toggleSidebar()">☰</button>
    <div class="sidebar-container">
      <div class="sidebar" id="sidebar">
        <div class="archive">
          {archive_html}
        </div>
        <div class="labels">
          {labels_html}
        </div>
        <div class="pages">
          <aside class='sidebar-pages'><h3>Strani</h3>
            <li><a href="{relative_path}predvajalnik-nakljucnih-fotografij.html">Predvajalnik naključnih fotografij</a></li>
            <li><a href="{relative_path}seznam-vrhov.html">Seznam vrhov</a></li>
            <li><a href="{relative_path}zemljevid-spominov.html">Zemljevid spominov</a></li>
          </aside>
        </div>
        <h2 class="title">Nastavitve</h2>
        <h3 class="title">Objave in predvajalniki slik</h3>
        <div style="display: flex; flex-direction: column; margin-left: 5px; margin-top: 5px; margin-bottom: 10px;">
            <label for='photosSliderElement'>Obseg prikazanih slik: <span id='photosValueElement'></span></label>
            <input id='photosSliderElement' max='3' min='0' step='1' type='range' value='initPhotos' style="width: 160px;"/>
        </div>
        <div id='map-settings'>
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
        </div>
      </div>
    </div>"""

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
          <a href="../../{prev_year}/{prev_month}/{prev_slug}.html">&larr; {prev_title}</a>
        </div>
        """

    if next_slug:
        nav_html += f"""
        <div class="next-link" style="text-align: right; max-width: 45%;">
          <div class="pager-title">Naslednja objava</div>
          <a href="../../{next_year}/{next_month}/{next_slug}.html">{next_title} &rarr;</a>
        </div>
        """

    nav_html += """
      </div>
    </div>
    """

    return nav_html

def generate_labels_html(entry, title, slug, year, month, formatted_date, post_id, label_posts_raw,
                         slugify, remove_first_prefix, remove_all_prefixes,
                         levels_up):
    labels_raw = []
    labels_html = "<div class='post-labels'><em>No labels</em></div>"
    relative_path = get_relative_path(levels_up)

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
                label_url = f"{relative_path}/search/labels/{slugify(slug_part)}.html"
                label_text = remove_all_prefixes(label_raw)
                label_links.append(f"<a class='my-labels' href='{label_url}'>{label_text}</a>")
            labels_html = "<div class='post-labels'>" + " ".join(label_links) + "</div>"

    return labels_html

# Helper to remove just the first prefix
def remove_first_prefix(label):
    return re.sub(r"^\d+\.\s*", "", label)

# Helper to remove all numeric prefixes
def remove_all_prefixes(label):
    return re.sub(r"^(?:\d+\.\s*)+", "", label)


def fetch_and_save_all_posts(entries):
    # Archive and labels sidebar
    levels_up = 3
    archive_sidebar_html = build_archive_sidebar_html(entries, levels_up)
    labels_sidebar_html = generate_labels_sidebar_html(levels_up, feed_url=BASE_FEED_URL)
    sidebar_html = generate_sidebar_html(archive_sidebar_html, labels_sidebar_html, levels_up)

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

        # Fix images
        content_html = fix_images_for_lightbox(content_html)

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
                                                            slugify, remove_first_prefix, remove_all_prefixes, levels_up)

        post_dir = OUTPUT_DIR / "posts" / year / month
        post_dir.mkdir(parents=True, exist_ok=True)
        filename = post_dir / f"{slug}.html"

        with open(filename, "w", encoding="utf-8") as f:
            f.write(f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
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

  <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;700&family=Open+Sans&display=swap" rel="stylesheet">
  
  <link href='https://metodlangus.github.io/plugins/leaflet/1.7.1/leaflet.min.css' rel='stylesheet'>
  <link href='https://metodlangus.github.io/plugins/@raruto/leaflet-elevation/dist/leaflet-elevation.min.css' rel='stylesheet'>
  <link href='https://metodlangus.github.io/plugins/leaflet-fullscreen/v1.0.1/leaflet.fullscreen.css' rel='stylesheet'>
  <link href='https://metodlangus.github.io/scripts/leaflet-download-gpx-button.css' rel='stylesheet'>
  <link href='https://metodlangus.github.io/plugins/lightbox2/2.11.1/css/lightbox.min.css' rel='stylesheet'>
  <link href='https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css' rel='stylesheet'>
  <link href='https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css' rel='stylesheet'>
  <link href='https://cdn.jsdelivr.net/npm/leaflet-control-geocoder@3.1.0/dist/Control.Geocoder.min.css' rel='stylesheet'>

  <link rel="stylesheet" href="../../../assets/Main.css">
  <link rel="stylesheet" href="../../../assets/MyMapScript.css">
  <link rel="stylesheet" href="../../../assets/MySlideshowScript.css">
  <link rel="stylesheet" href="../../../assets/MyPostContainerScript.css">
</head>
<body>
  <div class="main-layout">
    {sidebar_html}
    <div class="content-wrapper">
      <input type="text" id="searchBox" placeholder="Išči objave..." />
      <div id="searchResults"></div>
      <h2>{title}</h2>
      {metadata_html}
      {content_html}
      {labels_html}
      {nav_html}
    </div>
  </div>

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

  <script src="../../../assets/MyMapScript.js" defer></script>
  <script src="../../../assets/MySlideshowScript.js" defer></script>
  <script src="../../../assets/MyPostContainerScript.js" defer></script>
  <script src="../../../assets/Main.js" defer></script>

</body>
</html>""")

        print(f"Saved: {filename}")

    return label_posts_raw


def generate_label_pages(entries, label_posts_raw):
    labels_dir = OUTPUT_DIR / "search/labels"
    labels_dir.mkdir(parents=True, exist_ok=True)

    # Generate the full archive sidebar from all entries
    levels_up = 2
    archive_sidebar_html = build_archive_sidebar_html(entries, levels_up)
    labels_sidebar_html = generate_labels_sidebar_html(levels_up, feed_url=BASE_FEED_URL)
    sidebar_html = generate_sidebar_html(archive_sidebar_html, labels_sidebar_html, levels_up)

    for label, posts in label_posts_raw.items():
        # Remove only the first numeric prefix from label for slug
        label_slug = slugify(remove_first_prefix(label))
        # Clean label text by removing numeric prefixes etc.
        label_clean = re.sub(r"^(?:\d+\.\s*)+", "", label)

        filename = labels_dir / f"{label_slug}.html"

        # Sort posts by date descending (newest first)
        posts_sorted = sorted(posts, key=lambda x: x['date'], reverse=True)

        post_scripts_html = ""
        for i, post in enumerate(posts_sorted):
            post_id = str(post.get('postId', '')).strip()
            if post_id:
                post_scripts_html += f""" 
    <script>
      var postTitle{i} = "{post_id}";
      var displayMode{i} = "alwaysVisible";
    </script>\n"""
            else:
                print(f"Warning: Post at index {i} missing 'postId'")

        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Prikaz objav z oznako: {label_clean}</title>

  <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;700&family=Open+Sans&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="../../assets/Main.css">
  <link rel="stylesheet" href="../../assets/MyMapScript.css">
  <link rel="stylesheet" href="../../assets/MySlideshowScript.css">
  <link rel="stylesheet" href="../../assets/MyPostContainerScript.css">
</head>
<body>
  <div class="main-layout">
    {sidebar_html}
    <div class="content-wrapper">
      <input type="text" id="searchBox" placeholder="Išči objave..." />
      <div id="searchResults"></div>
      <h1>Prikaz objav z oznako: {label_clean}</h1>
      <div class="blog-posts hfeed container">
        {post_scripts_html}
      </div>
    </div>
  </div>

  <script src="../../assets/MyMapScript.js" defer></script>
  <script src="../../assets/MySlideshowScript.js" defer></script>
  <script src="../../assets/MyPostContainerScript.js" defer></script>
  <script src="../../assets/Main.js" defer></script>

  <p><a href="../../">Back to home</a></p>

</body>
</html>"""

        with open(filename, "w", encoding="utf-8") as f:
            f.write(html_content)

        print(f"Generated label page: {filename}")


def generate_predvajalnik_page():
    output_path = OUTPUT_DIR / "predvajalnik-nakljucnih-fotografij.html"

    # Generate the full archive sidebar from all entries
    levels_up = 0
    archive_sidebar_html = build_archive_sidebar_html(entries, levels_up)
    labels_sidebar_html = generate_labels_sidebar_html(levels_up, feed_url=BASE_FEED_URL)
    sidebar_html = generate_sidebar_html(archive_sidebar_html, labels_sidebar_html, levels_up)

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Predvajalnik naključnih fotografij</title>

  <script>
    var postTitle = 'Predvajalnik naključnih fotografij';
    var postId = '8898311262758762797';
    var author = 'Metod';
  </script>

 <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;700&family=Open+Sans&display=swap" rel="stylesheet">

 <link rel="stylesheet" href="assets/Main.css">
  <link rel="stylesheet" href="assets/MyMapScript.css">
  <link rel="stylesheet" href="assets/MySlideshowScript.css">
  <link rel="stylesheet" href="assets/MyPostContainerScript.css">
</head>
<body>
  <div class="main-layout">
    {sidebar_html}
    <div class="content-wrapper">
      <input type="text" id="searchBox" placeholder="Išči objave..." />
      <div id="searchResults"></div>
      <h1>Predvajalnik naključnih fotografij</h1>
      <script> 
        var slideshowTitle0 = 'All pictures';
        var CoverPhoto0 = '';
      </script>
    </div>
  </div>

  <script src="assets/MyMapScript.js" defer></script>
  <script src="assets/MySlideshowScript.js" defer></script>
  <script src="assets/MyPostContainerScript.js" defer></script>
  <script src="assets/Main.js" defer></script>
</body>
</html>"""

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Generated random slideshow page: {output_path}")


def generate_peak_list_page():
    output_path = OUTPUT_DIR / "seznam-vrhov.html"

    # Generate the full archive sidebar from all entries
    levels_up = 0
    archive_sidebar_html = build_archive_sidebar_html(entries, levels_up)
    labels_sidebar_html = generate_labels_sidebar_html(levels_up, feed_url=BASE_FEED_URL)
    sidebar_html = generate_sidebar_html(archive_sidebar_html, labels_sidebar_html, levels_up)

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Seznam vrhov</title>

  <script>
    var postTitle = 'Seznam vrhov';
    var postId = '1';
    var author = 'Metod';
  </script>

  <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;700&family=Open+Sans&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="assets/Main.css">
  <link rel="stylesheet" href="assets/MyMapScript.css">
  <link rel="stylesheet" href="assets/MySlideshowScript.css">
  <link rel="stylesheet" href="assets/MyPostContainerScript.css">
  <link rel="stylesheet" href="assets/MyPeakListScript.css">
</head>
<body>
  <div class="main-layout">
    {sidebar_html}
    <div class="content-wrapper">
      <input type="text" id="searchBox" placeholder="Išči objave..." />
      <div id="searchResults"></div>
      <h1>Seznam vrhov</h1>
      <div id='loadingMessage'>Nalaganje ...</div>
      <div id='mountainContainer'/>
    </div>
  </div>

  <script src="assets/MyMapScript.js" defer></script>
  <script src="assets/MySlideshowScript.js" defer></script>
  <script src="assets/MyPostContainerScript.js" defer></script>
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
    levels_up = 0
    archive_sidebar_html = build_archive_sidebar_html(entries, levels_up)
    labels_sidebar_html = generate_labels_sidebar_html(levels_up, feed_url=BASE_FEED_URL)
    sidebar_html = generate_sidebar_html(archive_sidebar_html, labels_sidebar_html, levels_up)

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Zemljevid spominov</title>

  <script>
    var postTitle = 'Zemljevid spominov';
    var postId = '2';
    var author = 'Metod';
  </script>

 <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;700&family=Open+Sans&display=swap" rel="stylesheet">

  <link href='https://metodlangus.github.io/plugins/leaflet/1.7.1/leaflet.min.css' rel='stylesheet'>
  <link href='https://metodlangus.github.io/plugins/@raruto/leaflet-elevation/dist/leaflet-elevation.min.css' rel='stylesheet'>
  <link href='https://metodlangus.github.io/plugins/leaflet-fullscreen/v1.0.1/leaflet.fullscreen.css' rel='stylesheet'>
  <link href='https://metodlangus.github.io/scripts/leaflet-download-gpx-button.css' rel='stylesheet'>
  <link href='https://metodlangus.github.io/plugins/lightbox2/2.11.1/css/lightbox.min.css' rel='stylesheet'>
  <link href='https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css' rel='stylesheet'>
  <link href='https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css' rel='stylesheet'>
  <link href='https://cdn.jsdelivr.net/npm/leaflet-control-geocoder@3.1.0/dist/Control.Geocoder.min.css' rel='stylesheet'>

 <link rel="stylesheet" href="assets/Main.css">
  <link rel="stylesheet" href="assets/MyMapScript.css">
  <link rel="stylesheet" href="assets/MySlideshowScript.css">
  <link rel="stylesheet" href="assets/MyPostContainerScript.css">
  <link rel="stylesheet" href="assets/MyMemoryMapScript.css">
</head>
<body>
  <div class="main-layout">
    {sidebar_html}
    <div class="content-wrapper">
      <input type="text" id="searchBox" placeholder="Išči objave..." />
      <div id="searchResults"></div>
      <h1>Zemljevid spominov</h1>
        <div id='map'></div>
    </div>
  </div>

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

  <script src="assets/MyMapScript.js" defer></script>
  <script src="assets/MySlideshowScript.js" defer></script>
  <script src="assets/MyPostContainerScript.js" defer></script>
  <script src="assets/Main.js" defer></script>
  <script src="assets/MyMemoryMapScript.js" defer></script>

</body>
</html>"""

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Generated memory map page: {output_path}")


if __name__ == "__main__":
    entries = fetch_all_entries()
    label_posts_raw = fetch_and_save_all_posts(entries)  # This function should return { label: [ {postId, date, html}, ... ] }
    generate_label_pages(entries, label_posts_raw)
    generate_predvajalnik_page()
    generate_peak_list_page()
    generate_big_map_page()