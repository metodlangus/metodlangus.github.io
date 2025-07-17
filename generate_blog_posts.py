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

# Constants
BASE_FEED_URL = "https://gorski-uzitki.blogspot.com/feeds/posts/default"
MAX_RESULTS = 25
OUTPUT_DIR = Path(r"C:\Spletna_stran_Github\metodlangus.github.io\posts")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

BASE_SITE_URL = "https://metodlangus.github.io/posts"


def fetch_all_entries():
    print("Fetching all paginated posts...")
    all_entries = []
    start_index = 1

    while True:
        url = f"{BASE_FEED_URL}?start-index={start_index}&max-results={MAX_RESULTS}&alt=json"
        print(f"Fetching: {url}")
        response = requests.get(url)
        response.raise_for_status()

        data = response.json()
        entries = data.get("feed", {}).get("entry", [])

        if not entries:
            break

        all_entries.extend(entries)
        start_index += MAX_RESULTS

    print(f"Total entries fetched: {len(all_entries)}")
    return all_entries

def fix_images_for_lightbox(html_content):
    # Parse your HTML content
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
    return str(soup)

def fetch_and_save_all_posts():
    entries = fetch_all_entries()
    slugs = [slugify(entry.get("title", {}).get("$t", f"untitled-{i}")) or f"post-{i}" for i, entry in enumerate(entries)]

    archive_dict = defaultdict(lambda: defaultdict(list))
    label_posts = defaultdict(list)  # Collect posts by label here
    label_posts_raw = defaultdict(list)  # Collect posts by label here

    local_tz = ZoneInfo("Europe/Ljubljana")  # UTC+2 (with daylight saving support)

    for i, entry in enumerate(entries):
        title = entry.get("title", {}).get("$t", f"untitled-{i}")
        published = entry.get("published", {}).get("$t", "")
        try:
            # Parse with timezone from string
            parsed_date = parser.isoparse(published)
            # Convert to your local time zone
            local_date = parsed_date.astimezone(local_tz)
            year = str(local_date.year)
            month = f"{local_date.month:02d}"
        except Exception as e:
            print(f"Date parse error at index {i}: {e}")
            year, month = "unknown", "unknown"

        archive_dict[year][month].append((slugs[i], title, i))


    for index, entry in enumerate(entries):
        title = entry.get("title", {}).get("$t", f"untitled-{index}")
        content_html = entry.get("content", {}).get("$t", "")
        slug = slugs[index]

        fullId = entry.get("id", {}).get("$t", "")
        postId = fullId.split("post-")[-1] if "post-" in fullId else ""

        #  Get the author name
        author = ""
        if "author" in entry and isinstance(entry["author"], list) and entry["author"]:
            author = entry["author"][0].get("name", {}).get("$t", "")

        # Parse published date
        published = entry.get("published", {}).get("$t", "")
        try:
            # Fix the timezone format from -07:00 to -0700 for strptime
            if published[-3] == ":":
                published = published[:-3] + published[-2:]

            parsed_date = datetime.strptime(published, "%Y-%m-%dT%H:%M:%S.%f%z")
            formatted_date = parsed_date.isoformat()
            year = str(parsed_date.year)
            month = f"{parsed_date.month:02d}"
        except Exception:
            formatted_date, year, month = published, "unknown", "unknown"

        # Fix images
        content_html = fix_images_for_lightbox(content_html)

        # Extract first image for og:image
        soup = BeautifulSoup(content_html, "html.parser")
        first_img_tag = soup.find("img")
        og_image = first_img_tag["src"] if first_img_tag else "https://metodlangus.github.io/assets/default-og.jpg"

        # Construct og:url
        og_url = f"{BASE_SITE_URL}/{year}/{month}/{slug}.html"
        metadata_html = f"<div class='post-date' data-date='{formatted_date}'></div>"

        # Previous and next posts with correct date paths
        if index < len(entries) - 1:
            prev_entry = entries[index + 1]
            prev_title = prev_entry.get("title", {}).get("$t", "")
            prev_slug = slugs[index + 1]

            prev_published = prev_entry.get("published", {}).get("$t", "")
            try:
                prev_parsed_date = parser.isoparse(prev_published).astimezone(local_tz)
                prev_year = str(prev_parsed_date.year)
                prev_month = f"{prev_parsed_date.month:02d}"
            except Exception:
                prev_year, prev_month = year, month
        else:
            prev_slug = prev_title = prev_year = prev_month = ""

        if index > 0:
            next_entry = entries[index - 1]
            next_title = next_entry.get("title", {}).get("$t", "")
            next_slug = slugs[index - 1]

            next_published = next_entry.get("published", {}).get("$t", "")
            try:
                next_parsed_date = parser.isoparse(next_published).astimezone(local_tz)
                next_year = str(next_parsed_date.year)
                next_month = f"{next_parsed_date.month:02d}"
            except Exception:
                next_year, next_month = year, month
        else:
            next_slug = next_title = next_year = next_month = ""

        # Navigation HTML
        nav_html = """
        <div class=\"nav-links-wrapper\" style=\"margin-top: 2em;\">
          <div class=\"nav-links\" style=\"display: flex; justify-content: space-between; flex-wrap: wrap;\">
        """
        if prev_slug:
            nav_html += f"""
            <div class=\"prev-link\" style=\"text-align: left; max-width: 45%;\">
              <div class=\"pager-title\">Prejšnja objava</div>
              <a href=\"../../{prev_year}/{prev_month}/{prev_slug}.html\">&larr; {prev_title}</a>
            </div>
            """
        if next_slug:
            nav_html += f"""
            <div class=\"next-link\" style=\"text-align: right; max-width: 45%;\">
              <div class=\"pager-title\">Naslednja objava</div>
              <a href=\"../../{next_year}/{next_month}/{next_slug}.html\">{next_title} &rarr;</a>
            </div>
            """
        nav_html += """
          </div>
        </div>
        """

        # Extract labels/categories
        labels = []
        labels_raw = []
        if "category" in entry and isinstance(entry["category"], list):
            for cat in entry["category"]:
                label_raw = cat.get("term", "")
                # Keep original label with prefix
                labels_raw.append(label_raw)
                label_posts_raw[label_raw].append({
                    "title": title,
                    "slug": slug,
                    "year": year,
                    "month": month,
                    "date": formatted_date,
                    "postId": postId
                })
                label_clean = re.sub(r"^(?:\d+\.\s*)+", "", label_raw)
                labels.append(label_clean)
                # Collect post info for label page generation
                label_posts[label_clean].append({
                    "title": title,
                    "slug": slug,
                    "year": year,
                    "month": month,
                    "date": formatted_date,
                    "postId": postId
                })

        # Build labels HTML linking to static label pages
        if labels:
            label_links = []
            for label_clean in labels:
                label_url = f"../../../search/labels/{slugify(label_clean)}.html"
                label_links.append(f"<a class='my-labels' href='{label_url}'>{label_clean}</a>")
            labels_html = "<div class='post-labels'>" + " ".join(label_links) + "</div>"
        else:
            labels_html = "<div class='post-labels'><em>No labels</em></div>"

        # Archive sidebar HTML
        archive_html_parts = ["<aside class='sidebar-archive'><h3>Arhiv</h3>"]

        for y in sorted(archive_dict.keys(), reverse=True):
            # Count all posts in the year
            year_count = sum(len(archive_dict[y][m]) for m in archive_dict[y])
            archive_html_parts.append(f"<details open><summary>{y} ({year_count})</summary>")

            for m in sorted(archive_dict[y].keys(), reverse=True):
                posts = archive_dict[y][m]
                try:
                    month_name = datetime.strptime(m, '%m').strftime('%B')
                except ValueError:
                    month_name = m
                month_label = f"{month_name} {y} ({len(posts)})"
                archive_html_parts.append(f"<details class='month-group'><summary>{month_label}</summary><ul>")

                for s, t, idx in posts:
                    active = " class='active-post'" if idx == index else ""
                    archive_html_parts.append(
                        f"<li{active}><a href='../../{y}/{m}/{s}.html'>{t}</a></li>"
                    )

                archive_html_parts.append("</ul></details>")

            archive_html_parts.append("</details>")

        archive_html_parts.append("</aside>")
        archive_sidebar_html = "\n".join(archive_html_parts)


        # Organize labels by prefix
        label_groups = defaultdict(list)

        for label in label_posts_raw:
            prefix_match = re.match(r'^(\d+)', label)
            prefix = int(prefix_match.group(1)) if prefix_match else 99  # 99 = Uncategorized/Other
            label_groups[prefix].append(label)

        # Sort groups by prefix
        sorted_prefixes = sorted(label_groups.keys())

        label_html_parts = ["<aside class='sidebar-labels'><h3><b>Navigacija</b></h3>"]

        # Mapping of prefixes to section titles
        prefix_titles = {
            1: "Kategorija",
            2: "Država",
            3: "Gorstvo",
            4: "Časovno",
            5: "Ostalo"
        }

        # Generate HTML blocks
        for idx, prefix in enumerate(sorted_prefixes):
            group_labels = sorted(label_groups[prefix], key=lambda l: l.lower())
            title_label = prefix_titles.get(prefix, "Ostalo")
            
            if idx == 0:
                label_html_parts.append(f"<div class='first-items'><h3>{title_label}:</h3><ul class='label-list'>")
            else:
                if idx == 1:
                    label_html_parts.append("<div class='remaining-items hidden' style='height:auto;'>")
                label_html_parts.append(f"<h3>{title_label}:</h3><ul class='label-list'>")

            for label in group_labels:
                clean_label = re.sub(r'^\d+\.\s*', '', label)
                slug_label = slugify(clean_label)
                label_html_parts.append(
                    f"<li><a class='label-name' href='../../../search/labels/{slug_label}.html'>{clean_label}</a></li>"
                )

            label_html_parts.append("</ul>")

        # Close remaining-items div if it was added
        if len(sorted_prefixes) > 1:
            label_html_parts.append("</div>")  # End of .remaining-items

            label_html_parts.append("""
            <span class='show-more pill-button'>Pokaži več</span>
            <span class='show-less pill-button hidden'>Pokaži manj</span>
            """)

        label_html_parts.append("</aside>")
        labels_sidebar_html = "\n".join(label_html_parts)



        post_dir = OUTPUT_DIR / year / month
        post_dir.mkdir(parents=True, exist_ok=True)
        filename = post_dir / f"{slug}.html"

        with open(filename, "w", encoding="utf-8") as f:
            f.write(f"""<!DOCTYPE html>
<html lang=\"en\">
<head>
  <meta charset=\"UTF-8\">
  <title>{title}</title>

  <!-- OpenGraph meta tags -->
  <meta property=\"og:title\" content=\"{title}\">
  <meta property=\"og:type\" content=\"article\">
  <meta property=\"og:image\" content=\"{og_image}\">
  <meta property=\"og:url\" content=\"{og_url}\">
  <meta property=\"og:description\" content=\"{title}\">

  <script>
    var postTitle = {title!r};
    var postId = {postId!r};
    var author = {author!r};
  </script>

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
  <div class=\"main-layout\" style=\"display: flex; gap: 2em;\">
    <div class="sidebar">
      <div class="archive">
        {archive_sidebar_html}
      </div>
      <div class="labels">
        {labels_sidebar_html}
      </div>
      <h3>Strani</h3>
      <ul class="strani-list">
        <li><a href="predvajalnik-nakljucnih-fotografij.html">Predvajalnik naključnih fotografij</a></li>
      </ul>
    </div>

    <div class=\"content-wrapper\" style=\"flex: 1;\">
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



def remove_first_prefix(label):
    return re.sub(r"^\d+\.\s*", "", label)

def generate_label_pages(label_posts_raw):
    labels_dir = OUTPUT_DIR.parent / "search/labels"
    labels_dir.mkdir(parents=True, exist_ok=True)

    for label, posts in label_posts_raw.items():
        # Remove only the first numeric prefix from label for slug
        label_slug = slugify(remove_first_prefix(label))
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

  <link rel="stylesheet" href="../../assets/Main.css">
  <link rel="stylesheet" href="../../assets/MyMapScript.css">
  <link rel="stylesheet" href="../../assets/MySlideshowScript.css">
  <link rel="stylesheet" href="../../assets/MyPostContainerScript.css">

</head>
<body>
  <h1>Prikaz objav z oznako: {label_clean}</h1>

  <div class="blog-posts hfeed container">
    {post_scripts_html}
  </div>

  <script src="../../assets/MyMapScript.js" defer></script>
  <script src="../../assets/MySlideshowScript.js" defer></script>
  <script src="../../assets/MyPostContainerScript.js" defer></script>
  <script src="../../assets/Main.js" defer></script>

  <p><a href="../search/labels">Back to home</a></p>

</body>
</html>"""

        with open(filename, "w", encoding="utf-8") as f:
            f.write(html_content)

        print(f"Generated label page: {filename}")


def generate_predvajalnik_page():
    output_path = OUTPUT_DIR.parent / "predvajalnik-nakljucnih-fotografij.html"
    html_content = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Predvajalnik naključnih fotografij</title>

  <script>
    var postTitle = {title!r};
    var postId = {postId!r};
    var author = {author!r};
  </script>

  <link rel="stylesheet" href="../../assets/Main.css">
  <link rel="stylesheet" href="../../assets/MyMapScript.css">
  <link rel="stylesheet" href="../../assets/MySlideshowScript.css">
  <link rel="stylesheet" href="../../assets/MyPostContainerScript.css">

</head>
<body>
  <script> 
    <!-- Insert image slideshow via title -->
    var slideshowTitle0 = 'All pictures';
    var CoverPhoto0 = '';
  </script>

  <script src="../../assets/MyMapScript.js" defer></script>
  <script src="../../assets/MySlideshowScript.js" defer></script>
  <script src="../../assets/MyPostContainerScript.js" defer></script>
  <script src="../../assets/Main.js" defer></script>

</body>
</html>"""
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Generated predvajalnik page: {output_path}")


if __name__ == "__main__":
    label_posts_raw = fetch_and_save_all_posts()  # This function should return { label: [ {postId, date, html}, ... ] }
    generate_label_pages(label_posts_raw)
    generate_predvajalnik_page()