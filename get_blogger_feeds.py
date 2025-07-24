from collections import defaultdict
from dateutil import parser
from slugify import slugify
import pytz
import requests
import json
import time
from pathlib import Path

# === CONFIG ===
BLOG_URL = "https://gorski-uzitki.blogspot.com"
FEED_URL = f"{BLOG_URL}/feeds/posts/default?alt=json"
MAX_RESULTS = 25
DATA_DIR = Path("data")
POSTS_DIR = DATA_DIR / "posts"
BASE_SITE_URL = "https://metodlangus.github.io"
# ==============

def fetch_all_posts():
    all_entries = []
    start_index = 1
    first_feed_meta = None

    while True:
        url = f"{FEED_URL}&start-index={start_index}&max-results={MAX_RESULTS}"
        print(f"Fetching: {url}")
        res = requests.get(url)

        if res.status_code != 200:
            print(f"❌ Failed: {res.status_code}")
            break

        data = res.json()

        if not first_feed_meta:
            first_feed_meta = {k: v for k, v in data.get("feed", {}).items() if k != "entry"}

        entries = data.get("feed", {}).get("entry", [])
        if not entries:
            break

        all_entries.extend(entries)
        start_index += MAX_RESULTS
        time.sleep(1)  # avoid rate limits

    return all_entries, first_feed_meta

def extract_post_id(post_id_url):
    return post_id_url.split("-")[-1] if "-" in post_id_url else post_id_url.split("/")[-1]


def main():
    posts, feed_meta = fetch_all_posts()

    # Create directories
    POSTS_DIR.mkdir(parents=True, exist_ok=True)

    # Base structure for feed (like Blogger)
    blogger_feed = {
        "version": "1.0",
        "encoding": "UTF-8",
        "feed": {
            **feed_meta,
            "entry": []  # Will contain full content now
        }
    }

    local_tz = pytz.timezone("Europe/Ljubljana")
    slug_counts = defaultdict(lambda: defaultdict(int))

    for i, post in enumerate(posts):
        post_id = extract_post_id(post["id"]["$t"])
        title = post["title"]["$t"]
        published = post.get("published", {}).get("$t", "")
        updated = post.get("updated", {}).get("$t", "")
        content = post.get("content", {}).get("$t", "")
        labels = [cat["term"] for cat in post.get("category", [])]
        author_name = post.get("author", [{}])[0].get("name", {}).get("$t", "")
        original_link = next((l["href"] for l in post.get("link", []) if l["rel"] == "alternate"), "")

        # Get year/month from published date
        try:
            parsed_date = parser.isoparse(published).astimezone(local_tz)
            pub_year = str(parsed_date.year)
            pub_month = f"{parsed_date.month:02d}"
        except Exception as e:
            print(f"Date parse error at index {i}: {e}")
            pub_year, pub_month = "unknown", "unknown"

        # Generate slug
        base_slug = slugify(title) or f"post-{i}"
        slug_count = slug_counts[pub_year][(pub_month, base_slug)]
        unique_slug = base_slug if slug_count == 0 else f"{base_slug}-{slug_count}"
        slug_counts[pub_year][(pub_month, base_slug)] += 1

        # Extract year/month from original link
        if original_link:
            parts = original_link.rstrip("/").split("/")
            if len(parts) >= 5:
                link_year, link_month = parts[-3], parts[-2]

                # Compare and warn if mismatch
                if link_year != pub_year or link_month != pub_month:
                    print(f"⚠️ Warning: Date mismatch for post '{title}'")
                    print(f"  Published: {pub_year}-{pub_month}, Link: {link_year}-{link_month}")

                updated_original_link = f"{BASE_SITE_URL}/posts/{link_year}/{link_month}/{unique_slug}.html"
            else:
                updated_original_link = f"{BASE_SITE_URL}/{unique_slug}.html"
        else:
            updated_original_link = f"{BASE_SITE_URL}/{unique_slug}.html"



        local_link = f"posts/{post_id}.json"
        media_thumbnail = post.get("media$thumbnail", None)

        # Save full post as separate file
        full_post_entry = {
            "version": "1.0",
            "encoding": "UTF-8",
            "entry": {
                "id": post["id"],
                "title": post["title"],
                "author": {
                    "name": {"$t": author_name},
                },
                "published": {"$t": published},
                "updated": {"$t": updated},
                "category": [{"term": lbl} for lbl in labels],
                "content": {"$t": content},
                "link": [
                    {
                        "rel": "alternate",
                        "type": "text/html",
                        "href": updated_original_link
                    },
                    {
                        "rel": "self",
                        "type": "application/json",
                        "href": local_link
                    }
                ]
            }
        }

        if media_thumbnail:
            full_post_entry["entry"]["media$thumbnail"] = media_thumbnail

        with open(POSTS_DIR / f"{post_id}.json", "w", encoding="utf-8") as pf:
            json.dump(full_post_entry, pf, ensure_ascii=False, indent=2)

        # Add full content directly to feed summary (not just a pointer)
        summary_entry = {
            "id": post["id"],
            "title": post["title"],
            "author": {
                "name": {"$t": author_name},
            },
            "published": {"$t": published},
            "updated": {"$t": updated},
            "category": [{"term": lbl} for lbl in labels],
            "content": {"$t": content},
            "link": [
                {
                    "rel": "alternate",
                    "type": "text/html",
                    "href": updated_original_link
                },
                {
                    "rel": "self",
                    "type": "application/json",
                    "href": local_link
                }
            ]
        }

        if media_thumbnail:
            summary_entry["media$thumbnail"] = media_thumbnail

        blogger_feed["feed"]["entry"].append(summary_entry)

    # Save all-posts.json (with full content now)
    with open(DATA_DIR / "all-posts.json", "w", encoding="utf-8") as sf:
        json.dump(blogger_feed, sf, ensure_ascii=False, indent=2)

    print(f"✅ Saved {len(posts)} posts.")
    print(f"📁 Summary: {DATA_DIR / 'all-posts.json'}")
    print(f"📁 Individual: {POSTS_DIR}/[id].json")

if __name__ == "__main__":
    main()
