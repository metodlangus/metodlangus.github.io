import re
import json

# Regex for matching image filenames (3 formats)
image_time_regex = re.compile(
    r'(\d{8}_\d{6}\d{0,3}\.jpg)|'
    r'(IMG\d{8}\d{6}\.jpg)|'
    r'(IMG-\d{8}_\d{6}\.JPG)',
    re.IGNORECASE
)

# Match image filenames at start of line (for list_of_photos.txt)
image_line_start_regex = re.compile(
    r'(?P<filename>('
    r'\d{8}_\d{6}\d{0,3}\.jpg|'
    r'IMG\d{8}\d{6}\.jpg|'
    r'IMG-\d{8}_\d{6}\.JPG'
    r'))',
    re.IGNORECASE
)

# === 1. Load image-to-post-path mapping ===
def build_image_to_post_mapping(json_path):
    with open(json_path, encoding="utf-8") as f:
        data = json.load(f)

    mapping = {}
    for entry in data.get("feed", {}).get("entry", []):
        post_url = None
        for link in entry.get("link", []):
            if link.get("rel") == "alternate" and link.get("type") == "text/html":
                post_url = link.get("href")
                break

        if not post_url:
            continue

        post_path = "/".join(post_url.split("/")[-4:])  # e.g. 2025/06/post-title.html
        content_html = entry.get("content", {}).get("$t", "")
        matches = image_time_regex.findall(content_html)

        for match_groups in matches:
            img_name = next((mg for mg in match_groups if mg), None)
            if img_name:
                mapping[img_name] = post_path

    return mapping

# === 2. Update list_of_photos.txt in-place ===
def update_list_of_photos(txt_path, mapping):
    updated_lines = []
    with open(txt_path, encoding='utf-8') as f:
        lines = f.readlines()

    for line in lines:
        match = image_line_start_regex.match(line)
        if not match:
            updated_lines.append(line)
            continue

        filename = match.group("filename")
        if filename in mapping:
            post_path = mapping[filename]
            # Remove existing post link
            line = re.sub(r'\d{4}/\d{2}/[^ ]+\.html', '', line).strip()
            updated_line = f"{line} {post_path}\n"
            updated_lines.append(updated_line)
        else:
            print(f"[!] No post found for: {filename}")
            updated_lines.append(line)

    with open(txt_path, "w", encoding="utf-8") as f:
        f.writelines(updated_lines)
    print(f"[✓] Updated: {txt_path}")

# === 3. Update extracted_photos_with_gps_data.txt in-place ===
def update_gps_photo_file(txt_path, mapping):
    updated_lines = []
    with open(txt_path, encoding="utf-8") as f:
        lines = f.readlines()

    for line in lines:
        match = image_time_regex.search(line)
        if not match:
            updated_lines.append(line)
            continue

        filename = next((m for m in match.groups() if m), None)
        if not filename or filename not in mapping:
            print(f"[!] No post found for: {filename}")
            updated_lines.append(line)
            continue

        new_post_path = mapping[filename]
        # Replace the post path (e.g. 2022/06/saas-fee.html)
        updated_line = re.sub(r'\d{4}/\d{2}/[^,]+\.html', new_post_path, line)
        updated_lines.append(updated_line)

    with open(txt_path, "w", encoding="utf-8") as f:
        f.writelines(updated_lines)
    print(f"[✓] Updated: {txt_path}")

# === 4. Run everything ===
if __name__ == "__main__":
    json_feed_path = "data/all-posts.json"
    photo_list_path = "list_of_photos.txt"
    gps_file_path = "extracted_photos_with_gps_data.txt"

    img_to_post = build_image_to_post_mapping(json_feed_path)
    update_list_of_photos(photo_list_path, img_to_post)
    update_gps_photo_file(gps_file_path, img_to_post)

    # Optional preview
    print("\n[Preview] First 5 lines of updated list_of_photos.txt:")
    with open(photo_list_path, encoding="utf-8") as f:
        for i, line in enumerate(f):
            if i >= 5:
                break
            print(line.rstrip())
