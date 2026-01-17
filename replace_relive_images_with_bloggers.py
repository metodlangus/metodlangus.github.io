import re
import base64
import os

HTML_FILE = "blogger_relive_images.html"
RELIVE_LIST_FILE = "list_of_relive_photos.txt"


def normalize_blogger_size(url, size="s400"):
    return re.sub(r"/(s\d+[^/]*)/", f"/{size}/", url)


def extract_blogger_links(input_file):
    blogger_map = {}

    with open(input_file, "r", encoding="utf-8") as f:
        content = f.read()

    urls = re.findall(
        r"https://blogger\.googleusercontent\.com/[^\s\"'>]+\.jpg",
        content
    )

    for url in urls:
        url = normalize_blogger_size(url, "s400")
        filename = os.path.basename(url)
        blogger_map[filename] = url

    print(f"[INFO] Blogger images found: {len(blogger_map)}")
    return blogger_map


def extract_filename_from_decoded_url(decoded_url):
    """
    Extract YYYYMMDD_HHMMSS.jpg from decoded URL
    """
    match = re.search(r"\d{8}_\d{6}\.jpg", decoded_url)
    return match.group(0) if match else None


def update_relive_list(relive_file, blogger_map):
    updated_lines = []
    replaced_links = 0
    replaced_names = 0

    with open(relive_file, "r", encoding="utf-8") as f:
        for line in f:
            original_line = line
            parts = line.strip().split()

            if not parts:
                updated_lines.append(line)
                continue

            # --- Decode first Base64 token ---
            decoded_url = None
            decoded_filename = None
            try:
                decoded_url = base64.b64decode(parts[0]).decode("utf-8")
                decoded_filename = extract_filename_from_decoded_url(decoded_url)
            except Exception:
                updated_lines.append(line)
                continue

            # --- Extract blogger filename from Link ---
            blogger_match = re.search(
                r"https://blogger\.googleusercontent\.com/[^\s]+/(\d{8}_\d{6}\.jpg)",
                line
            )

            blogger_filename = blogger_match.group(1) if blogger_match else None

            # --- Replace Base64 token ONLY if filenames match ---
            if decoded_filename and blogger_filename and decoded_filename == blogger_filename:
                line = line.replace(parts[0], decoded_filename, 1)
                replaced_names += 1

            # --- Replace Link if filename exists in blogger_map ---
            if blogger_filename and blogger_filename in blogger_map:
                line = re.sub(
                    r"Link:\s*\S+",
                    f"Link: {blogger_map[blogger_filename]}",
                    line
                )
                replaced_links += 1

            updated_lines.append(line)

    print(f"[INFO] Base64 names replaced: {replaced_names}")
    print(f"[INFO] Blogger links replaced: {replaced_links}")
    return updated_lines


def main():
    blogger_map = extract_blogger_links(HTML_FILE)
    updated_lines = update_relive_list(RELIVE_LIST_FILE, blogger_map)

    with open(RELIVE_LIST_FILE, "w", encoding="utf-8") as f:
        f.writelines(updated_lines)

    print("✔ list_of_relive_photos.txt updated successfully")
    print("✔ Blogger image size normalized to /s400/")


if __name__ == "__main__":
    main()
