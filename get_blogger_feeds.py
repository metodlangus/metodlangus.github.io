import requests
import json
import time
import os
from pathlib import Path

# === CONFIG ===
BLOG_URL = "https://gorski-uzitki.blogspot.com"
FEED_URL = f"{BLOG_URL}/feeds/posts/default?alt=json"
MAX_RESULTS = 250
DATA_DIR = Path("data")
POSTS_DIR = DATA_DIR / "posts"
# ==============

def fetch_all_posts():
    all_entries = []
    start_index = 1

    while True:
        url = f"{FEED_URL}&start-index={start_index}&max-results={MAX_RESULTS}"
        print(f"Fetching: {url}")
        res = requests.get(url)

        if res.status_code != 200:
            print(f"❌ Failed: {res.status_code}")
            break

        data = res.json()
        entries = data.get("feed", {}).get("entry", [])
        if not entries:
            break

        all_entries.extend(entries)
        start_index += MAX_RESULTS
        time.sleep(1)  # avoid rate limits

    return all_entries

def extract_post_id(post_id_url):
    # Fallback if hyphen not present
    return post_id_url.split("-")[-1] if "-" in post_id_url else post_id_url.split("/")[-1]

def main():
    posts = fetch_all_posts()

    # Create directories
    POSTS_DIR.mkdir(parents=True, exist_ok=True)

    # For summary file
    summary = []

    for post in posts:
        post_id = extract_post_id(post["id"]["$t"])
        title = post["title"]["$t"]
        published = post.get("published", {}).get("$t", "")
        updated = post.get("updated", {}).get("$t", "")
        content = post.get("content", {}).get("$t", "")
        labels = [cat["term"] for cat in post.get("category", [])]

        # Save individual post
        post_data = {
            "id": post_id,
            "title": title,
            "published": published,
            "updated": updated,
            "labels": labels,
            "content": content,
            "link": f"posts/{post_id}.json"  # Local relative path
        }

        with open(POSTS_DIR / f"{post_id}.json", "w", encoding="utf-8") as pf:
            json.dump(post_data, pf, ensure_ascii=False, indent=2)

        # Add to summary
        summary.append({
            "id": post_id,
            "title": title,
            "published": published,
            "labels": labels,
            "link": f"posts/{post_id}.json"  # Local link for use in your site
        })

    # Save all-posts.json
    with open(DATA_DIR / "all-posts.json", "w", encoding="utf-8") as sf:
        json.dump(summary, sf, ensure_ascii=False, indent=2)

    print(f"✅ Saved {len(posts)} posts.")
    print(f"📁 Summary: {DATA_DIR / 'all-posts.json'}")
    print(f"📁 Individual: {POSTS_DIR}/[id].json")

if __name__ == "__main__":
    main()
