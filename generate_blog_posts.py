import requests
from pathlib import Path
from bs4 import BeautifulSoup
from slugify import slugify

# Constants
FEED_URL = "https://gorski-uzitki.blogspot.com/feeds/posts/default?alt=json"
OUTPUT_DIR = Path(r"C:\Spletna_stran_Github\metodlangus.github.io\posts")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def extract_cover_paragraphs_and_gallery(html_content):
    soup = BeautifulSoup(html_content, "html.parser")

    img_tag = soup.find("img")
    cover_img_html = str(img_tag) if img_tag else ""

    paragraphs = soup.find_all("p")
    content_html = "\n".join(str(p) for p in paragraphs)

    gallery_imgs = soup.find_all("img", attrs={"data-skip": "1"})
    gallery_html = ""
    modal_slides = ""

    if gallery_imgs:
        gallery_html += '<div class="image-gallery">\n'
        for idx, img in enumerate(gallery_imgs):
            src = img.get("src", "")
            reduced_src = src.replace("/s1600/", "/s400/").replace("/s1200/", "/s400/")
            gallery_html += f'<img src="{reduced_src}" class="gallery-thumb" onclick="openModal();currentSlide({idx + 1})" />\n'
            modal_slides += f'<div class="mySlides"><img src="{reduced_src}" style="width:100%"></div>\n'
        gallery_html += '</div>'

    slideshow_js = f"""
<!-- Slideshow Modal -->
<div id="myModal" class="modal">
  <span class="close cursor" onclick="closeModal()">&times;</span>
  <div class="modal-content">
    {modal_slides}
    <a class="prev" onclick="plusSlides(-1)">&#10094;</a>
    <a class="next" onclick="plusSlides(1)">&#10095;</a>
  </div>
</div>

<style>
.image-gallery {{ display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }}
.gallery-thumb {{ max-width: 200px; border-radius: 5px; cursor: pointer; }}
.modal {{ display: none; position: fixed; z-index: 1000; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); }}
.modal-content {{ margin: auto; max-width: 90%; }}
.mySlides {{ display: none; }}
.mySlides img {{ display: block; margin: auto; max-height: 90vh; }}
.prev, .next {{
  cursor: pointer; position: absolute; top: 50%; transform: translateY(-50%);
  font-size: 24px; color: white; background: rgba(0,0,0,0.5); padding: 16px;
  border-radius: 50%;
}}
.prev {{ left: 10px; }}
.next {{ right: 10px; }}
.close {{ position: absolute; top: 10px; right: 25px; font-size: 35px; color: white; cursor: pointer; }}
</style>

<script>
let slideIndex = 1;
function openModal() {{
  document.getElementById("myModal").style.display = "block";
  showSlides(slideIndex);
}}
function closeModal() {{
  document.getElementById("myModal").style.display = "none";
}}
function plusSlides(n) {{
  showSlides(slideIndex += n);
}}
function currentSlide(n) {{
  showSlides(slideIndex = n);
}}
function showSlides(n) {{
  let slides = document.getElementsByClassName("mySlides");
  if (!slides.length) return;
  if (n > slides.length) slideIndex = 1;
  if (n < 1) slideIndex = slides.length;
  for (let slide of slides) slide.style.display = "none";
  slides[slideIndex - 1].style.display = "block";
}}
document.addEventListener('keydown', e => {{ if (e.key === "Escape") closeModal(); }});
</script>
""" if gallery_imgs else ""

    return cover_img_html, content_html, gallery_html + slideshow_js

def extract_gpx_url(content):
    soup = BeautifulSoup(content, "html.parser")
    for script in soup.find_all("script"):
        if script.string and "gpxURL0" in script.string:
            lines = script.string.splitlines()
            for line in lines:
                if "gpxURL0" in line:
                    return line.split("=")[-1].strip(" ;'\"")
    return None

def fetch_and_save_posts():
    print("Fetching feed...")
    response = requests.get(FEED_URL)
    response.raise_for_status()

    data = response.json()
    entries = data.get("feed", {}).get("entry", [])
    print(f"Found {len(entries)} entries.")

    for index, entry in enumerate(entries):
        title = entry.get("title", {}).get("$t", f"untitled-{index}")
        content = entry.get("content", {}).get("$t", "")
        gpx_url = extract_gpx_url(content)

        cover_img, content_html, gallery_html = extract_cover_paragraphs_and_gallery(content)
        slug = slugify(title) or f"post-{index}"
        filename = OUTPUT_DIR / f"{slug}.html"

        with open(filename, "w", encoding="utf-8") as f:
            f.write(f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{title}</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    #map {{ height: 500px; margin-top: 30px; }}
  </style>
</head>
<body>

<h2>{title}</h2>
{cover_img}
{content_html}
{gallery_html}
<div id="map"></div>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://cdn.jsdelivr.net/gh/mapbox/togeojson@master/togeojson.js"></script>
<script src="https://unpkg.com/leaflet-polylinedecorator@1.7.0/dist/leaflet.polylineDecorator.min.js"></script>

<script>
var gpxURL = "{gpx_url or ''}";
var map = L.map('map').setView([46.357380, 14.292459], 14);
L.tileLayer('https://{{s}}.tile.opentopomap.org/{{z}}/{{x}}/{{y}}.png', {{
  attribution: '&copy; <a href="http://www.opentopomap.org">OpenTopoMap</a>'
}}).addTo(map);

fetch(gpxURL)
  .then(res => res.text())
  .then(gpx => {{
    const parser = new DOMParser();
    const xml = parser.parseFromString(gpx, "text/xml");
    const geojson = toGeoJSON.gpx(xml);
    const track = L.geoJSON(geojson, {{
      style: {{ color: "orange", weight: 3 }}
    }}).addTo(map);
    map.fitBounds(track.getBounds());

    L.polylineDecorator(track, {{
      patterns: [{{
        offset: 0,
        repeat: 10,
        symbol: L.Symbol.arrowHead({{
          pixelSize: 8,
          pathOptions: {{ fillOpacity: 1, weight: 0, color: "orange" }}
        }})
      }}]
    }}).addTo(map);
  }})
  .catch(err => console.error("Error loading GPX:", err));
</script>

</body>
</html>""")
        print(f"Saved: {filename}")

if __name__ == "__main__":
    fetch_and_save_posts()
