import os
import re
import requests
from html import escape
from bs4 import BeautifulSoup

FEED_URL = "https://gorski-uzitki.blogspot.com/feeds/posts/default?alt=json"
OUTPUT_DIR = r"C:\Spletna_stran_Github\metodlangus.github.io\posts"

def fetch_feed(url):
    r = requests.get(url)
    r.raise_for_status()
    return r.json()

def extract_images_from_html(html_content):
    # Parse HTML with BeautifulSoup
    soup = BeautifulSoup(html_content, "html.parser")
    images = []
    # Find <a> tags that wrap <img> tags, extract href as full img and img src as preview
    for a in soup.find_all("a", href=True):
        img = a.find("img")
        if img and img.get("src"):
            full_url = a['href']
            preview_url = img['src']
            alt_text = img.get("alt", "")
            images.append({
                "src": full_url,
                "placeholder": preview_url,
                "alt": alt_text
            })
    return images

def generate_html(title, cover_image, content, post_link, gallery_images):
    gallery_html = ""
    for i, img in enumerate(gallery_images):
        low_res = img.get('placeholder', img['src'])
        alt = escape(img.get('alt', f'Gallery image {i+1}'))
        full = img['src']
        gallery_html += f'''
        <div class="gallery-item">
          <img
            src="{low_res}"
            data-src="{full}"
            alt="{alt}"
            loading="lazy"
            class="lazy"
            onclick="openLightbox({i})"
          />
        </div>'''

    lightbox_images_js = "[" + ",".join(f'"{img["src"]}"' for img in gallery_images) + "]"

    return f"""<!DOCTYPE html>
<html lang="sl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{escape(title)} | Gorski Užitki</title>
  <meta name="description" content="{escape(title)} - doživetje v naravi s fotografijami." />
  <style>
    body {{
      font-family: 'Segoe UI', sans-serif;
      margin: 0;
      background-color: #f9f9f9;
      color: #333;
    }}
    .cover {{
      width: 100%;
      max-height: 60vh;
      object-fit: cover;
      display: block;
    }}
    .container {{
      max-width: 900px;
      margin: auto;
      padding: 20px;
    }}
    h1 {{
      text-align: center;
      margin-top: 1em;
      font-size: 2.5em;
    }}
    .content {{
      line-height: 1.6;
      font-size: 1.1em;
      margin-top: 1em;
    }}
    .gallery {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 10px;
      margin-top: 40px;
    }}
    .gallery-item {{
      overflow: hidden;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      cursor: pointer;
      position: relative;
    }}
    .gallery-item img {{
      width: 100%;
      height: auto;
      display: block;
      filter: blur(20px);
      transition: filter 0.5s ease-out;
      background-size: cover;
      background-position: center;
    }}
    .gallery-item img.loaded {{
      filter: blur(0);
    }}

    /* Lightbox styles */
    #lightbox {{
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.9);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }}
    #lightbox img {{
      max-width: 90vw;
      max-height: 90vh;
      border-radius: 8px;
      box-shadow: 0 0 25px rgba(0,0,0,0.7);
    }}
    #lightbox .close-btn {{
      position: fixed;
      top: 20px;
      right: 30px;
      font-size: 2.5em;
      color: white;
      cursor: pointer;
      user-select: none;
      z-index: 10000;
    }}
    #lightbox .nav-btn {{
      position: fixed;
      top: 50%;
      font-size: 3em;
      color: white;
      cursor: pointer;
      user-select: none;
      z-index: 10000;
      background: rgba(0,0,0,0.3);
      border-radius: 50%;
      padding: 0 10px;
      transform: translateY(-50%);
      user-select: none;
    }}
    #lightbox .prev-btn {{
      left: 30px;
    }}
    #lightbox .next-btn {{
      right: 30px;
    }}

    .footer {{
      text-align: center;
      margin-top: 3em;
      font-size: 0.9em;
      color: #555;
    }}
    a.button {{
      display: inline-block;
      margin-top: 20px;
      padding: 10px 20px;
      background: #333;
      color: #fff;
      text-decoration: none;
      border-radius: 4px;
    }}
    a.button:hover {{
      background: #444;
    }}
  </style>
</head>
<body>
  <img src="{cover_image}" alt="{escape(title)}" class="cover" />

  <div class="container">
    <h1>{escape(title)}</h1>
    <div class="content">{content}</div>

    <div class="gallery">
      {gallery_html}
    </div>

    <div class="footer">
      <a class="button" href="{post_link}" target="_blank">Ogled izvorne objave na Bloggerju</a>
    </div>
  </div>

  <!-- Lightbox markup -->
  <div id="lightbox">
    <span class="close-btn" onclick="closeLightbox()">×</span>
    <span class="nav-btn prev-btn" onclick="prevImage()">‹</span>
    <img src="" alt="" />
    <span class="nav-btn next-btn" onclick="nextImage()">›</span>
  </div>

  <script>
    // Lazy loading with blur-up effect
    document.addEventListener("DOMContentLoaded", function() {{
      const lazyImages = document.querySelectorAll("img.lazy");

      if ("IntersectionObserver" in window) {{
        let lazyObserver = new IntersectionObserver(function(entries, observer) {{
          entries.forEach(function(entry) {{
            if (entry.isIntersecting) {{
              let img = entry.target;
              img.src = img.dataset.src;
              img.onload = () => img.classList.add("loaded");
              lazyObserver.unobserve(img);
            }}
          }});
        }});

        lazyImages.forEach(function(img) {{
          lazyObserver.observe(img);
        }});
      }} else {{
        // Fallback - load all immediately
        lazyImages.forEach(function(img) {{
          img.src = img.dataset.src;
          img.onload = () => img.classList.add("loaded");
        }});
      }}
    }});

    // Lightbox slideshow
    const images = {lightbox_images_js};
    let currentIndex = 0;

    const lightbox = document.getElementById("lightbox");
    const lightboxImg = lightbox.querySelector("img");

    function openLightbox(index) {{
      currentIndex = index;
      lightbox.style.display = "flex";
      lightboxImg.src = images[currentIndex];
    }}

    function closeLightbox() {{
      lightbox.style.display = "none";
      lightboxImg.src = "";
    }}

    function nextImage() {{
      currentIndex = (currentIndex + 1) % images.length;
      lightboxImg.src = images[currentIndex];
    }}

    function prevImage() {{
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      lightboxImg.src = images[currentIndex];
    }}

    // Close lightbox on ESC key
    document.addEventListener('keydown', function(event) {{
      if(event.key === "Escape" && lightbox.style.display === "flex") {{
        closeLightbox();
      }}
    }});
  </script>
</body>
</html>"""

def save_post_html(filename, html):
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, "w", encoding="utf-8") as f:
        f.write(html)

def slugify(text):
    # Basic slugify function for filename
    text = text.lower()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"\s+", "-", text)
    return text.strip("-")

def main():
    feed = fetch_feed(FEED_URL)
    entries = feed.get("feed", {}).get("entry", [])

    for entry in entries:
        title = entry.get("title", {}).get("$t", "Brez naslova")
        content_html = entry.get("content", {}).get("$t", "")
        post_link = next((link.get("href") for link in entry.get("link", []) if link.get("rel") == "alternate"), "#")

        images = extract_images_from_html(content_html)
        if not images:
            print(f"[{title}] - Ni slik, preskočim.")
            continue

        cover_image = images[0]['src']

        html = generate_html(title, cover_image, content_html, post_link, images)
        filename = os.path.join(OUTPUT_DIR, slugify(title) + ".html")
        save_post_html(filename, html)
        print(f"Shranjeno: {filename}")

if __name__ == "__main__":
    main()
