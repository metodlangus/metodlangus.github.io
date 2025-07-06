import requests
from pathlib import Path
from bs4 import BeautifulSoup
from slugify import slugify  # from python-slugify

# Constants
FEED_URL = "https://gorski-uzitki.blogspot.com/feeds/posts/default?alt=json"
OUTPUT_DIR = Path(r"C:\Spletna_stran_Github\metodlangus.github.io\posts")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def extract_cover_paragraphs_and_gallery(html_content):
    soup = BeautifulSoup(html_content, "html.parser")

    # Extract first image as cover
    img_tag = soup.find("img")
    cover_img_html = str(img_tag) if img_tag else ""

    # Extract all <p> tags
    paragraphs = soup.find_all("p")
    content_html = "\n".join(str(p) for p in paragraphs)

    # Extract gallery images with data-skip="1"
    gallery_imgs = soup.find_all("img", attrs={"data-skip": "1"})
    gallery_html = ""
    if gallery_imgs:
        gallery_html += '<div class="image-gallery">\n'
        for img in gallery_imgs:
            src = img.get("src", "")
            # Replace /s1600/ or /s1200/ with /s400/
            reduced_src = src.replace("/s1600/", "/s400/").replace("/s1200/", "/s400/")
            gallery_html += f'  <img src="{reduced_src}" alt="" style="max-width:100%;margin:5px;" />\n'
        gallery_html += '</div>'

    return cover_img_html, content_html, gallery_html

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

        cover_img, content_html, gallery_html = extract_cover_paragraphs_and_gallery(content)

        # Create safe filename
        slug = slugify(title)
        if not slug:
            slug = f"post-{index}"
        filename = OUTPUT_DIR / f"{slug}.html"

        # Write to file
        with open(filename, "w", encoding="utf-8") as f:
            f.write(f"<!-- {title} -->\n")
            if cover_img:
                f.write(cover_img + "\n\n")
            f.write(content_html + "\n\n")
            if gallery_html:
                f.write("<h3>Galerija</h3>\n")
                f.write(gallery_html)

        print(f"Saved: {filename}")

if __name__ == "__main__":
    fetch_and_save_posts()
