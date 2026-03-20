"""
GPX Pre-processor: simplify + bundle tracks into two GeoJSON files.

Reads all .gpx files from GPX_FOLDER and MY_GPX_FOLDER, applies
Ramer-Douglas-Peucker simplification (adaptive epsilon based on
track curviness), then writes:
  - /output/all_tracks.geojson       (main tracks)
  - /output/all_relive_tracks.geojson (Relive tracks)

Each GeoJSON feature carries the same metadata the JS module already
uses, so the front-end change is minimal.

Dependencies:  pip install gpxpy
"""

import os
import json
import math
import gpxpy
from pathlib import Path

BASE_DIR = Path(os.path.dirname(os.path.abspath(__file__)))

# ── paths ────────────────────────────────────────────────────────────────────
GPX_FOLDER        = BASE_DIR / "GPX_tracks"
MY_GPX_FOLDER     = BASE_DIR / "my_GPX_tracks"
TRACK_LIST_FILE   = BASE_DIR / "list_of_tracks.txt"
RELIVE_LIST_FILE  = BASE_DIR / "list_of_relive_tracks.txt"
OUTPUT_DIR        = BASE_DIR
OUTPUT_MAIN       = OUTPUT_DIR / "all_tracks.geojson"
OUTPUT_RELIVE     = OUTPUT_DIR / "all_relive_tracks.geojson"

# ── simplification tunables ───────────────────────────────────────────────────
# RDP epsilon in degrees (~111 000 m/deg).
# Straight segment: large epsilon removes many redundant points.
# Curvy segment: small epsilon keeps the shape.

# # Before (original)
# EPS_MIN   = 0.00003   # ~3 m  – used for very curvy tracks
# EPS_MAX   = 0.0003    # ~33 m – used for very straight tracks
# After (7× more aggressive)
EPS_MIN   = 0.0002    # ~22 m  – used for very curvy tracks
EPS_MAX   = 0.002     # ~220 m – used for very straight tracks

# We measure "curviness" as total angular change / track length.
# Tracks above CURVY_THRESHOLD get EPS_MIN; below get EPS_MAX; linear interpolation in between.
CURVY_THRESHOLD  = 30.0   # deg/km – empirically good for mountain hiking
STRAIGHT_THRESHOLD = 3.0  # deg/km


# ── Ramer-Douglas-Peucker ─────────────────────────────────────────────────────

def _perp_distance(point, line_start, line_end):
    """Perpendicular distance from point to line segment (in coordinate units)."""
    x0, y0 = point
    x1, y1 = line_start
    x2, y2 = line_end
    dx, dy = x2 - x1, y2 - y1
    if dx == 0 and dy == 0:
        return math.hypot(x0 - x1, y0 - y1)
    t = ((x0 - x1) * dx + (y0 - y1) * dy) / (dx * dx + dy * dy)
    t = max(0.0, min(1.0, t))
    return math.hypot(x0 - (x1 + t * dx), y0 - (y1 + t * dy))


def rdp(points, epsilon):
    """Return simplified list of (lon, lat) points using RDP."""
    if len(points) < 3:
        return points
    max_dist = 0.0
    index = 0
    end = len(points) - 1
    for i in range(1, end):
        d = _perp_distance(points[i], points[0], points[end])
        if d > max_dist:
            max_dist = d
            index = i
    if max_dist > epsilon:
        left  = rdp(points[:index + 1], epsilon)
        right = rdp(points[index:],     epsilon)
        return left[:-1] + right
    return [points[0], points[end]]


# ── curviness ────────────────────────────────────────────────────────────────

def _bearing(p1, p2):
    """Bearing in degrees from p1 to p2, both (lon, lat)."""
    d_lon = math.radians(p2[0] - p1[0])
    lat1  = math.radians(p1[1])
    lat2  = math.radians(p2[1])
    x = math.sin(d_lon) * math.cos(lat2)
    y = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(d_lon)
    return math.degrees(math.atan2(x, y)) % 360


def curviness_deg_per_km(points):
    """Total absolute bearing change (deg) divided by track length (km)."""
    if len(points) < 3:
        return 0.0
    total_angle = 0.0
    total_km    = 0.0
    for i in range(1, len(points) - 1):
        b1 = _bearing(points[i - 1], points[i])
        b2 = _bearing(points[i],     points[i + 1])
        diff = abs(b2 - b1)
        if diff > 180:
            diff = 360 - diff
        total_angle += diff
        # haversine segment length
        lon1, lat1 = math.radians(points[i-1][0]), math.radians(points[i-1][1])
        lon2, lat2 = math.radians(points[i][0]),   math.radians(points[i][1])
        a = math.sin((lat2-lat1)/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin((lon2-lon1)/2)**2
        total_km += 6371 * 2 * math.asin(math.sqrt(a))
    if total_km < 0.01:
        return 0.0
    return total_angle / total_km


def adaptive_epsilon(points):
    """Choose RDP epsilon based on how curvy the track is."""
    c = curviness_deg_per_km(points)
    # linear interpolation between thresholds
    t = (c - STRAIGHT_THRESHOLD) / max(CURVY_THRESHOLD - STRAIGHT_THRESHOLD, 1e-9)
    t = max(0.0, min(1.0, t))
    return EPS_MAX + t * (EPS_MIN - EPS_MAX)   # high curviness → small epsilon


# ── GPX loader ───────────────────────────────────────────────────────────────

def load_gpx_points(gpx_path):
    """Return list of (lon, lat) from first track/segment in the GPX file."""
    try:
        with open(gpx_path, "r", encoding="utf-8", errors="replace") as f:
            gpx = gpxpy.parse(f)
        points = []
        for track in gpx.tracks:
            for segment in track.segments:
                for pt in segment.points:
                    points.append((pt.longitude, pt.latitude))
            if points:
                break   # only first track
        return points
    except Exception as e:
        print(f"  ⚠ Could not parse {gpx_path.name}: {e}")
        return []


# ── track-list parser ─────────────────────────────────────────────────────────

def parse_track_list(list_path):
    """
    Parse list_of_tracks.txt / list_of_relive_tracks.txt.
    Format per line: lat;lng;filename;coverPhoto;postLink
    Returns dict keyed by filename.
    """
    result = {}
    if not list_path.exists():
        return result
    with open(list_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            parts = line.split(";")
            if len(parts) < 3:
                continue
            lat_str, lng_str, filename = parts[0], parts[1], parts[2]
            cover    = parts[3] if len(parts) > 3 else ""
            postlink = parts[4] if len(parts) > 4 else ""
            try:
                result[filename] = {
                    "lat":      float(lat_str),
                    "lng":      float(lng_str),
                    "filename": filename,
                    "cover":    cover.strip(),
                    "postLink": postlink.strip(),
                }
            except ValueError:
                pass
    return result


# ── GeoJSON builder ───────────────────────────────────────────────────────────

def build_geojson(gpx_folder, track_list_file, label):
    """
    Walk gpx_folder, simplify each track, assemble a GeoJSON FeatureCollection.
    Returns the collection dict.
    """
    metadata = parse_track_list(track_list_file)
    features = []
    gpx_files = sorted(gpx_folder.glob("*.gpx"))
    total = len(gpx_files)

    print(f"\n── {label}: {total} files in {gpx_folder.name} ──")

    skipped = 0
    for i, gpx_path in enumerate(gpx_files, 1):
        filename = gpx_path.name
        raw = load_gpx_points(gpx_path)
        if not raw:
            skipped += 1
            continue

        eps        = adaptive_epsilon(raw)
        simplified = rdp(raw, eps)

        # pull metadata from track-list (optional — file may not be listed)
        meta = metadata.get(filename, {})

        feature = {
            "type": "Feature",
            "properties": {
                "filename": filename,
                "lat":      meta.get("lat",      raw[0][1]),
                "lng":      meta.get("lng",      raw[0][0]),
                "cover":    meta.get("cover",    ""),
                "postLink": meta.get("postLink", ""),
                # store original point count for debugging
                "_pts_raw": len(raw),
                "_pts_sim": len(simplified),
                "_eps":     round(eps, 6),
            },
            "geometry": {
                "type":        "LineString",
                "coordinates": simplified,   # [[lon, lat], ...]
            }
        }
        features.append(feature)

        if i % 50 == 0 or i == total:
            print(f"  {i}/{total}  last: {filename}  "
                  f"pts {len(raw)}→{len(simplified)}  eps={eps:.5f}")

    collection = {
        "type":     "FeatureCollection",
        "features": features,
    }
    print(f"  Done: {len(features)} tracks, {skipped} skipped.")
    return collection


# ── main ──────────────────────────────────────────────────────────────────────

def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Main tracks
    main_geojson = build_geojson(GPX_FOLDER, TRACK_LIST_FILE, "Main tracks")
    with open(OUTPUT_MAIN, "w", encoding="utf-8") as f:
        json.dump(main_geojson, f, separators=(",", ":"))
    size_kb = OUTPUT_MAIN.stat().st_size / 1024
    print(f"\n✓ Wrote {OUTPUT_MAIN.name}  ({size_kb:.0f} KB, "
          f"{len(main_geojson['features'])} features)")

    # Relive tracks
    relive_geojson = build_geojson(MY_GPX_FOLDER, RELIVE_LIST_FILE, "Relive tracks")
    with open(OUTPUT_RELIVE, "w", encoding="utf-8") as f:
        json.dump(relive_geojson, f, separators=(",", ":"))
    size_kb = OUTPUT_RELIVE.stat().st_size / 1024
    print(f"✓ Wrote {OUTPUT_RELIVE.name}  ({size_kb:.0f} KB, "
          f"{len(relive_geojson['features'])} features)")

    # Summary stats
    for label, coll in [("Main", main_geojson), ("Relive", relive_geojson)]:
        pts_raw = sum(f["properties"]["_pts_raw"] for f in coll["features"])
        pts_sim = sum(f["properties"]["_pts_sim"] for f in coll["features"])
        if pts_raw:
            ratio = 100 * (1 - pts_sim / pts_raw)
            print(f"\n{label} reduction: {pts_raw:,} → {pts_sim:,} points  "
                  f"({ratio:.1f}% removed)")


if __name__ == "__main__":
    main()
