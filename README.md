# <img src="https://metodlangus.github.io/photos/favicon.ico" width="32" style="vertical-align: middle; margin-right: 10px;"/> Gorski Užitki - Mountain Adventures Blog

A custom-built static website for documenting mountain hiking adventures with interactive maps, photo galleries, and GPS track visualization. What started on Blogger evolved into a fully independent GitHub Pages site, rebuilt from scratch to achieve complete customization, superior performance, and features that truly enhance the storytelling of mountain journeys.

**Live Site:** [https://metodlangus.github.io/](https://metodlangus.github.io/)

<a href="https://metodlangus.github.io/predvajalnik-fotografij/" target="_blank" style="text-decoration: none;">
  <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiU8RYSJ0I45O63GlKYXw5-U_r7GwP48_st9F1LG7_Z3STuILVQxMO4qLgzP_wxg0v_77s-YwidwwZQIDS1K6SUmY-W3QMwcIyEvt28cLalvCVQu4qWTQIm-B_FvgEmCCe6ydGld4fQgMMd2xNdqMMFtuHgeVXB4gRPco3XP90OOKHpf6HyZ6AeEZqNJQo/s1600/IMG20241101141924.jpg" alt="Blog Preview - Click to visit" style="border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-width: 600px; margin: 20px auto; display: block; height: auto; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;"/>
</a>

## 🏔️ Core Features

### Interactive Maps & Tracks
- **Route Visualization** - Leaflet-powered maps displaying hiking trails with color-coded elevation changes
- **Elevation Profiles** - Detailed altitude graphs integrated directly into the map interface
- **Memory Map** - Geographic overview of all photographed locations, creating a visual journey map
- **Peak Catalog** - Interactive list and display of conquered mountain summits
- **GPX Integration** - Automatic parsing and rendering of GPX track files

### Photo Experience
- **Random Photo Slideshow** - The signature feature: a full-screen slideshow with speed control and advanced filtering by categories (labels) and time ranges, allowing focused exploration of specific adventures or periods
- **Dynamic Galleries** - Lightbox-based gallery viewing for individual posts and collections
- **Autoplay Slideshows** - Per-post slideshows for hands-free browsing of each adventure
- **Track Player** - Integrated GPS track player in per-post slideshows, displaying the hiking route alongside photos (available for single activities)
- **Popular Posts** - Algorithmically highlighted content based on engagement metrics

### Content & Navigation
- **Search System** - Full-text search across all blog posts and photo metadata
- **Label-based Filtering** - Explore posts by category, country, mountain group, duration, and more
- **Chronological Archive** - Easy browsing through years of adventures
- **Content Language** - Written in native Slovene, easily translatable to any language via modern translation tools

## 🔧 How It's Built

The site uses a **modular JavaScript architecture** with ES6 modules, avoiding global namespace pollution and enabling clean dependency management. A custom Python-based static site generator processes structured data sources (GPX files, photo metadata, track databases) into optimized HTML pages.

The frontend is pure vanilla JavaScript—no frameworks or heavy dependencies—ensuring lightning-fast load times. Third-party libraries are carefully chosen and integrated: Leaflet for mapping, Lightbox2 for galleries, and various Leaflet plugins for elevation and track features.

**Hosting:** GitHub Pages (free, static hosting with CDN)  
**Data Pipeline:** Python scripts for content generation, GPS extraction, and GPX processing  
**Architecture:** Separated concerns with distinct modules for maps, galleries, navigation, and content rendering

## 💡 What Makes It Special

This project represents a **strategic migration** from a restrictive hosted platform (Blogger) to a fully independent, high-performance static site. Rather than using off-the-shelf solutions, I designed and built every component to serve the specific needs of mountain adventure documentation.

While the Blogger version continues to run in parallel (sharing the same custom modules), the platform's rigid structure often makes it difficult to implement desired features, which drove the decision to create an independent solution. The GitHub Pages version offers complete freedom to design exactly what's needed.

The result is:
- **Fully customizable** appearance and behavior
- **Fast** performance with no database queries or server-side processing
- **Rich interactivity** that would be impossible on traditional blog platforms
- **Maintainable codebase** through modular architecture
- **Preserved legacy** - original Blogger images remain accessible while the site runs independently

## 📁 Project Structure

```
.
├── assets/              # Custom JS modules and CSS
│   ├── *Module.js      # ES6 modules for maps, galleries, navigation
│   ├── Main.css        # Core styling
│   └── SiteConfig.js   # Site-wide configuration
├── posts/              # Generated blog content (by year)
├── relive/             # Additional adventure entries
├── data/               # GeoJSON, photo metadata, track data
├── scripts/            # Utility tools and helpers
├── generate_blog_posts.py     # Static site generator
├── geotags_map.py              # GPS data extraction
├── get_blogger_feeds.py        # Content migration
└── all_tracks.geojson          # Processed track data
```

## 🎯 The Big Picture

More than just a blog, this is a **digital adventure journal** that transforms raw hiking data (GPS tracks, photos) into an engaging, searchable, and visually rich experience. Every feature serves the goal of preserving and sharing mountain memories with clarity and speed.

---

*Personal project by Metod Langus – combining software engineering with a passion for the mountains*
