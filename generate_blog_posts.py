import requests
from pathlib import Path
from slugify import slugify

# Constants
FEED_URL = "https://gorski-uzitki.blogspot.com/feeds/posts/default?alt=json"
OUTPUT_DIR = Path(r"C:\Spletna_stran_Github\metodlangus.github.io\posts")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def fetch_and_save_raw_posts():
    print("Fetching feed...")
    response = requests.get(FEED_URL)
    response.raise_for_status()

    data = response.json()
    entries = data.get("feed", {}).get("entry", [])
    print(f"Found {len(entries)} entries.")

    slugs = [slugify(entry.get("title", {}).get("$t", f"untitled-{i}")) or f"post-{i}" for i, entry in enumerate(entries)]

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

        # Previous and next posts
        prev_slug = slugs[index - 1] if index > 0 else ""
        prev_title = entries[index - 1].get("title", {}).get("$t", "") if index > 0 else ""

        next_slug = slugs[index + 1] if index < len(entries) - 1 else ""
        next_title = entries[index + 1].get("title", {}).get("$t", "") if index < len(entries) - 1 else ""

        # Navigation HTML
        nav_html = '<div class="nav-links" style="margin-top: 2rem; text-align: center;">'
        if prev_slug:
            nav_html += f'<a href="{prev_slug}.html" style="margin-right: 2rem;">&larr; {prev_title}</a>'
        if next_slug:
            nav_html += f'<a href="{next_slug}.html">{next_title} &rarr;</a>'
        nav_html += '</div>'

        filename = OUTPUT_DIR / f"{slug}.html"

        with open(filename, "w", encoding="utf-8") as f:
            f.write(f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{title}</title>

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

  <link rel="stylesheet" href="../assets/Main.css">
  <link rel="stylesheet" href="../assets/MyMapScript.css">
  <link rel="stylesheet" href="../assets/MySlideshowScript.css">
  <link rel="stylesheet" href="../assets/MyPostContainerScript.css">
</head>
<body>
  <div class="content-wrapper">
    <h2>{title}</h2>
    {content_html}
    {nav_html}
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

  <script src="../assets/MyMapScript.js" defer></script>
  <script src="../assets/MySlideshowScript.js" defer></script>
  <script src="../assets/MyPostContainerScript.js" defer></script>
  <script src="../assets/Main.js" defer></script>

</body>
</html>""")

        print(f"Saved raw post: {filename}")

if __name__ == "__main__":
    fetch_and_save_raw_posts()
