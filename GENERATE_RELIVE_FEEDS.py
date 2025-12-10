import os
import ast
import re
import json
from datetime import datetime
from pathlib import Path
from slugify import slugify

# Paths
GITHUB_REPO_NAME = "metodlangus.github.io"
LOCAL_REPO_PATH = f"C:\\Spletna_stran_Github\\metodlangus.github.io"
source_file = r"C:\Spletna_stran_Github\Relive\relive_data.txt"

data_root = Path("data")
data_root.mkdir(exist_ok=True)

posts_root = data_root / "posts"
feed_file = data_root / "all-posts.json"
posts_root.mkdir(exist_ok=True)

def sanitize_name(name):
    """Generate URL-safe slug from activity name."""
    if not name:
        return "activity"
    slug = slugify(name)
    return slug or "activity"

def iso_format(date_str):
    """Convert ISO datetime to Blogger-style timestamp with milliseconds."""
    if not date_str:
        dt = datetime.utcnow()
    else:
        for fmt in ("%Y-%m-%dT%H:%M:%S.%f%z", "%Y-%m-%dT%H:%M:%S%z"):
            try:
                dt = datetime.strptime(date_str, fmt)
                break
            except ValueError:
                continue
        else:
            # fallback if timezone missing
            dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    ms = int(dt.microsecond / 1000)
    return dt.strftime(f"%Y-%m-%dT%H:%M:%S.{ms:03d}%z")

# Track all unique categories for combined feed
all_terms_set = []
all_terms_list = []

# Create combined FEED structure
feed = {
    "version": "1.0",
    "encoding": "UTF-8",
    "feed": {
        "xmlns": "http://www.w3.org/2005/Atom",
        "id": {"$t": "tag:blogger.com,1999:blog-activity-feed"},
        "updated": {"$t": iso_format(None)},
        "category": [],
        "title": {"type": "text", "$t": "Relive Activities"},
        "entry": []
    }
}

# -------- PROCESS ACTIVITIES --------
with open(source_file, 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if i >= 5:  # Only first 5 activities
            break

        line = line.strip()
        if not line:
            continue

        activity = ast.literal_eval(line)
        info = activity.get('activity_info', {})

        # --- BASIC INFO ---
        activity_name = info.get('name', f"activity-{i+1}")
        slug = sanitize_name(activity_name)

        start_date = info.get('start_date_local')
        dt = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
        year = dt.strftime("%Y")
        month = dt.strftime("%m")

        # Blogger-style folder
        post_folder = posts_root / year / month / slug
        post_folder.mkdir(parents=True, exist_ok=True)

        post_url = f"https://{GITHUB_REPO_NAME}/posts/{year}/{month}/{slug}/index.html"

        published = iso_format(start_date)
        updated = iso_format(start_date)

        # ---- CATEGORY WITH PREFIX "1. " ----
        raw_category = info.get('type', 'Other')
        term_with_prefix = f"1. {raw_category}"

        # Track for combined feed
        if term_with_prefix not in all_terms_set:
            all_terms_set.append(term_with_prefix)
            all_terms_list.append({"term": term_with_prefix})

        categories = [{"term": term_with_prefix}]

        # COVER PHOTO
        cover_photo_url = None
        thumbnail_url = None
        cover = info.get('cover', {})
        if cover and cover.get('type') == 'url' and 'image' in cover:
            img = cover['image']
            if 'url' in img:
                cover_photo_url = img['url']
                thumbnail_url = re.sub(r'/s\d+/', '/s72-c/', cover_photo_url)

        # IMAGES HTML
        images_html = ""
        media_list = info.get('media', [])
        for media in media_list:
            variants = media.get('variants', [])
            if not variants:
                continue
            original_url = variants[0].get('url')
            if not original_url:
                continue
            url_s1600 = re.sub(r'/s\d+/', '/s1600/', original_url)
            url_s1200 = re.sub(r'/s\d+/', '/s1200/', original_url)

            images_html += f"""<div class="separator" style="clear: both;">
  <a href="{url_s1600}" style="display: block; padding: 1em 0px; text-align: center;">
    <img data-skip="3" alt="{activity_name}" border="0" src="{url_s1200}" width="600" />
  </a>
</div>\n"""

        # SLIDESHOW SCRIPT
        if cover_photo_url:
            images_html += f"""<script>
  var slideshowTitle0 = 'Make post slideshow';
  var CoverPhoto0 = '{cover_photo_url}';
</script>\n"""

        # HEADER BLOCK
        peak_tag_html = f"""
<div class="peak-tag"> 
  <br /><b><span style="font-size: 25px;">{activity_name}</span></b><br /><br />
</div>
"""

        content_html = f"""
{peak_tag_html}
<div style="display: none;">
  <summary>{activity_name}</summary>
</div>
<span><a name='more'></a></span>
{images_html}
"""

        # -------- BUILD SINGLE JSON ENTRY --------
        entry = {
            "id": {"$t": f"tag:blogger.com,1999:blog-post-{activity.get('id')}"},
            "title": {"type": "text", "$t": activity_name},
            "author": {"name": {"$t": "Metod"}},
            "published": {"$t": published},
            "updated": {"$t": updated},
            "category": categories,
            "content": {"$t": content_html},
            "link": [
                {"rel": "alternate", "type": "text/html", "href": post_url},
                {"rel": "self", "type": "application/json", "href": f"{activity.get('id')}.json"}
            ]
        }

        if thumbnail_url:
            entry["media$thumbnail"] = {
                "xmlns$media": "http://search.yahoo.com/mrss/",
                "url": thumbnail_url,
                "height": "72",
                "width": "72"
            }

        # ADD TO COMBINED FEED
        feed["feed"]["entry"].append(entry)

        # -------- SAVE SINGLE POST JSON --------
        single_json = {
            "version": "1.0",
            "encoding": "UTF-8",
            "entry": entry
        }

        with open(posts_root / f"{activity.get('id')}.json", 'w', encoding='utf-8') as pf:
            json.dump(single_json, pf, indent=2, ensure_ascii=False)

        # Write index.html
        with open(post_folder / "index.html", 'w', encoding='utf-8') as htmlfile:
            htmlfile.write(content_html)

        print(f"Saved: {post_folder}/index.html")

# Insert all unique categories at the top of combined feed
feed["feed"]["category"] = all_terms_list

# Save combined feed
with open(feed_file, 'w', encoding='utf-8') as f:
    json.dump(feed, f, indent=2, ensure_ascii=False)

print(f"\n✅ Combined feed generated: {feed_file}")
print(f"✅ Individual feeds saved in {posts_root}/")
