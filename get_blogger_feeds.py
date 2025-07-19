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

    for post in posts:
        post_id = extract_post_id(post["id"]["$t"])
        title = post["title"]["$t"]
        published = post.get("published", {}).get("$t", "")
        updated = post.get("updated", {}).get("$t", "")
        content = post.get("content", {}).get("$t", "")
        labels = [cat["term"] for cat in post.get("category", [])]
        original_link = next((l["href"] for l in post.get("link", []) if l["rel"] == "alternate"), "")

        local_link = f"posts/{post_id}.json"
        media_thumbnail = post.get("media$thumbnail", None)

        # Save full post as separate file
        full_post_entry = {
            "version": "1.0",
            "encoding": "UTF-8",
            "entry": {
                "id": post["id"],
                "title": post["title"],
                "published": {"$t": published},
                "updated": {"$t": updated},
                "category": [{"term": lbl} for lbl in labels],
                "content": {"$t": content},
                "link": [
                    {
                        "rel": "alternate",
                        "type": "text/html",
                        "href": original_link
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
            "published": {"$t": published},
            "updated": {"$t": updated},
            "category": [{"term": lbl} for lbl in labels],
            "content": {"$t": content},
            "link": [
                {
                    "rel": "alternate",
                    "type": "text/html",
                    "href": original_link
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
