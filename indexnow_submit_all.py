import json
import requests
from pathlib import Path

# ---------------------------------------
# CONFIG — EDIT THESE VALUES
# ---------------------------------------

BASE_URL = "https://metodlangus.github.io"
SITE_DIR = Path("C:\Spletna_stran_Github\metodlangus.github.io")     # Change to your output folder
INDEXNOW_KEY = "96686b98e4974b89a7268c29fa7756a8"
KEY_LOCATION = f"{BASE_URL}/{INDEXNOW_KEY}.txt"

# ---------------------------------------
# Collect all HTML URLs
# ---------------------------------------

def collect_html_urls():
    urls = []
    for file in SITE_DIR.rglob("*.html"):
        relative = file.relative_to(SITE_DIR).as_posix()
        full_url = f"{BASE_URL}/{relative}"
        urls.append(full_url)
    return urls


# ---------------------------------------
# Submit URL list to IndexNow
# ---------------------------------------

def submit_to_indexnow(url_list):
    payload = {
        "host": BASE_URL.replace("https://", ""),
        "key": INDEXNOW_KEY,
        "keyLocation": KEY_LOCATION,
        "urlList": url_list
    }

    response = requests.post(
        "https://www.bing.com/indexnow",
        headers={"Content-Type": "application/json"},
        data=json.dumps(payload)
    )

    print("\n--- IndexNow Response ---")
    print("STATUS:", response.status_code)
    print("BODY:", response.text)


# ---------------------------------------
# MAIN
# ---------------------------------------

if __name__ == "__main__":
    urls = collect_html_urls()

    print(f"Found {len(urls)} pages to submit:")
    for u in urls:
        print(" -", u)

    submit_to_indexnow(urls)
