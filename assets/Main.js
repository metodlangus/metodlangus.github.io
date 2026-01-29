const WindowBaseUrl = window.location.origin;
// const WindowBaseUrl = window.location.origin + "/metodlangus.github.io/";

// Module-scoped variable to track if this is a Relive page
let isRelive = false;

/**
 * Get initial photo configuration based on BLOG_CONTEXT
 */
function getInitialPhotoConfig() {
    const reliveFlag = window.BLOG_CONTEXT?.isRelive === true;
    isRelive = reliveFlag; // update module-scoped variable

    return {
        initPhotos: 1, // default range of photos shown in slideshows and posts
    };
}

// Initialize photo configuration
const { initPhotos } = getInitialPhotoConfig();
const initMapPhotos = isRelive ? 0 : -2; // default map photo range depending on Relive

// Utility function to run a function if the object is defined
function runIfDefined(obj, fn) {
    if (obj && typeof fn === 'function') {
        fn();
    }
}

document.addEventListener('DOMContentLoaded', () => {

    // Memory Map
    runIfDefined(window.MyMemoryMapModule, () => {
        MyMemoryMapModule.init({
            mapId: 'map',
            baseUrl: WindowBaseUrl,
            initPhotosValue: initMapPhotos,
            isRelive: isRelive
        });

        document.getElementById('applyFilters')?.click();
    });

    // Map
    runIfDefined(window.MyMapModule, () => {
        MyMapModule.init({
            usePostTitle: false,
            trackColour: 'orange'
        });
    });

    // Peak List
    runIfDefined(window.PeakListModule, () => {
        PeakListModule.init({
            WindowBaseUrl: WindowBaseUrl,
            isRelive: isRelive
        }); 
    });

    // Slideshow
    runIfDefined(window.MySlideshowModule, () => {
        MySlideshowModule.init({
            initSpeed: 3,
            maxSpeed: 10,
            minSpeed: 1.75,
            stepSpeed: 0.25,
            initQuality: 4,
            SLIDESHOW_HIDDEN: true,
            SLIDESHOW_VISIBLE: false,
            randomizeImages: true,
            defaultImgSrc_png: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEicpyIovkBboaA3DOVcPNZQQ47-GSa5AidzIeUbL2N8iue6yM1XIxd0BL5W8e2ty7ntqz4K8ovfmT7DV1c3_NXVFWWDLeKYMpbD_C1wK1qh4Y1zGLh_tHUi5d1pHtDxxQKunZLAkL3ibt5gjhI3KQX9cHtQMn0m9liFgtLc00VQH4YHc5I6aAO-mw84w8Q/s600/end_cover_photo.png",
            defaultImgSrc: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiU8RYSJ0I45O63GlKYXw5-U_r7GwP48_st9F1LG7_Z3STuILVQxMO4qLgzP_wxg0v_77s-YwidwwZQIDS1K6SUmY-W3QMwcIyEvt28cLalvCVQu4qWTQIm-B_FvgEmCCe6ydGld4fQgMMd2xNdqMMFtuHgeVXB4gRPco3XP90OOKHpf6HyZ6AeEZqNJQo/s1600/IMG20241101141924.jpg",
            doubleClickThreshold: 300,
            WindowBaseUrl: WindowBaseUrl,
            isRelive: isRelive
        });
    });

    // Random Photo
    runIfDefined(window.MyRandomPhoto, () => {
        MyRandomPhoto.init({
            WindowBaseUrl: WindowBaseUrl,
            initPhotos: initPhotos,
            isRelive: isRelive
        });
    });

    // Post Container
    runIfDefined(window.MyPostContainerModule, () => {
        MyPostContainerModule.init({
            WindowBaseUrl: WindowBaseUrl,
            isRelive: isRelive
        });
    });

    // Gallery
    runIfDefined(window.GalleryModule, () => {
        GalleryModule.init({
            WindowBaseUrl: WindowBaseUrl,
            randomizeImages: true,
            initPhotos: initPhotos,
            isRelive: isRelive
        });
    });

    // Slideshow filters
    runIfDefined(window.FilterSlideshowModule, () => {
        FilterSlideshowModule.init({
            initPhotos: initPhotos,
            isRelive: isRelive
        });
    });

    // Fit text on 404 page
    runIfDefined(window.FitTextModule, () => {
        FitTextModule.init();
    });

});


// Format date
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.post-date').forEach(function (el) {
    const date = new Date(el.dataset.date);
    const formatted = date.toLocaleDateString('sl-SI', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    el.textContent = formatted;
  });
});



// Removes images from the post and slideshow if their `data-skip` attribute is not within the allowed range.
document.addEventListener("DOMContentLoaded", function() {
        const elements = [
            ...document.querySelectorAll('td.tr-caption'),
            ...document.querySelectorAll('.separator')
        ];

        const PhotosRange = localStorage.getItem('photosSliderValue') || initPhotos; // Default value if not set

        // Function to process the `data-skip` attribute and check the range
        function isWithinRange(dataSkip) {
            // Assign a default value to `data-skip` if undefined or "NA"
            if (dataSkip === "NA" || dataSkip === null || dataSkip === undefined) {
                dataSkip = "3"; // Assign a default value
            }

            // Replace placeholders in the `data-skip` values
            dataSkip = dataSkip
                .replace(/best/g, "0")
                .replace(/cover/g, "-1")
                .replace(/peak/g, "5"); // Remove all peaks to be displayed because of high priority

            // Split `data-skip` values by semicolon
            const dataSkipValues = dataSkip.split(";");

            // Convert values to numbers and filter out invalid ones
            const numericValues = dataSkipValues
                .map(value => parseFloat(value))
                .filter(value => !isNaN(value));

            // Find the smallest number
            const minValue = Math.min(...numericValues);

            // // Exclude if the only tag is `-2` (peak)
            // if (minValue === -2 && dataSkipValues.length === 1) {
            //     return false;
            // }

            // Check if the smallest number is greater than PhotosRange
            return minValue > PhotosRange ? 1 : 0;
        }

        // Iterate over all elements and process them
        elements.forEach(element => {
            const isCaption = element.classList.contains('tr-caption');
            const isSeparator = element.classList.contains('separator');

            if (isCaption) {
                // Process caption elements
                const title = element.textContent.trim();
                const link = element.closest('tr').previousElementSibling?.querySelector('a[href*="blogger.googleusercontent.com"]');
                if (link) {
                    link.setAttribute('data-title', title);
                }

                const img = element.closest('tr').previousElementSibling?.querySelector('a img');
                if (img && isWithinRange(img.getAttribute('data-skip'))) {
                    const table = element.closest('table');
                    if (table) table.remove();
                }
            } else if (isSeparator) {
                // Process separator elements
                const img = element.querySelector('img');
                const text = element.textContent.trim();

                if (img && isWithinRange(img.getAttribute('data-skip'))) {
                    element.remove();
                } else if (!img && !text) {
                    // Remove separator if no content and no images
                    element.remove();
      }
    }
  });
});



/* For togling label navigation bar */
document.addEventListener("DOMContentLoaded", function() {
  const showMoreBtn = document.querySelector(".show-more");
  const showLessBtn = document.querySelector(".show-less");
  const remainingItems = document.querySelector(".remaining-items");

  if (showMoreBtn && showLessBtn && remainingItems) {
    showMoreBtn.addEventListener("click", function() {
      remainingItems.classList.remove("hidden");
      showMoreBtn.classList.add("hidden");
      showLessBtn.classList.remove("hidden");
    });

    showLessBtn.addEventListener("click", function() {
      remainingItems.classList.add("hidden");
      showMoreBtn.classList.remove("hidden");
      showLessBtn.classList.add("hidden");
    });
  }
});


/* Searchbox */
let posts = [];

Promise.all([
  fetch(`${WindowBaseUrl}/data/all-posts.json`).then(r => r.json()),
  fetch(`${WindowBaseUrl}/data/all-relive-posts.json`).then(r => r.json())
])
  .then(([normalData, reliveData]) => {
    const normalEntries = normalData.feed?.entry || [];
    const reliveEntries = reliveData.feed?.entry || [];

    const entries = [...normalEntries, ...reliveEntries];

    posts = entries.map((entry, i) => {
      const title = entry.title?.$t || `untitled-${i}`;
      const content = entry.content?.$t || "";
      const link = entry.link.find(l => l.rel === "alternate" && l.type === "text/html")?.href || "#";
      const thumbnail = entry.media$thumbnail?.url || "";

      return { title, content, link, thumbnail };
    });
  })
  .catch(error => {
    console.error("Error loading feeds:", error);
  });

document.addEventListener("DOMContentLoaded", function () {
  const searchToggle = document.getElementById("searchToggle");
  const searchContainer = document.getElementById("searchContainer");
  const searchClose = document.getElementById("searchClose");
  const searchBox = document.getElementById("searchBox");
  const resultsContainer = document.getElementById("searchResults");

  // Toggle search container visibility
  searchToggle.addEventListener("click", () => {
    const isVisible = searchContainer.classList.toggle("visible");
    if (!isVisible) {
      closeSearchOverlay();
    } else {
      // Optionally focus input when opened
      searchBox.focus();
    }
  });

  // Close button inside search container clears and closes search
  searchClose.addEventListener("click", () => {
    closeSearchOverlay();
  });

  // Search input event
  searchBox.addEventListener("input", function () {
    const keyword = this.value.toLowerCase();
    resultsContainer.innerHTML = "";

    if (!keyword) {
      // If input cleared, hide results overlay
      resultsContainer.classList.add("overlay-hidden");
      resultsContainer.classList.remove("overlay-visible");
      return;
    }

    const filtered = posts.filter(post =>
      post.title.toLowerCase().includes(keyword) ||
      post.content.toLowerCase().includes(keyword)
    );

    if (filtered.length > 0) {
      let resultHTML = `
        <button class="close-button" onclick="closeSearchOverlay()">×</button>
        <h1>Prikaz objav, ki vsebujejo: ${keyword}</h1>
        <div class="search-posts-container">`;

      filtered.forEach(post => {
        resultHTML += `
          <div class="post-container">
            <a href="${post.link}" class="image-link">
              <div class="image-wrapper">
                ${post.thumbnail ? `<img src="${post.thumbnail.replace(/\/s\d+-c/, '/s300')}" alt="Thumbnail for ${post.title}" class="post-thumb">` : ""}
                <h3 class="overlay-title">${post.title}</h3>
              </div>
            </a>
          </div>`;
      });

      resultHTML += `</div>`;
      resultsContainer.innerHTML = resultHTML;

      // Show results overlay
      resultsContainer.classList.remove("overlay-hidden");
      resultsContainer.classList.add("overlay-visible");
    } else {
      // No results - hide overlay
      resultsContainer.classList.add("overlay-hidden");
      resultsContainer.classList.remove("overlay-visible");
    }
  });

  // Define closeSearchOverlay globally so button inside results can call it
  window.closeSearchOverlay = function () {
    resultsContainer.innerHTML = "";
    resultsContainer.classList.add("overlay-hidden");
    resultsContainer.classList.remove("overlay-visible");

    searchBox.value = "";
    searchContainer.classList.remove("visible");
  };
});


/* Toggle sidebar */
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("visible");
  }


/* Pagination */
document.addEventListener("DOMContentLoaded", function () {
    const entries = document.querySelectorAll(".photo-entry");
    const entriesPerPage = 12;
    const totalPages = Math.ceil(entries.length / entriesPerPage);
    const pager = document.getElementById("blog-pager");
    let currentPage = 1;

    if (!pager) {
        // console.error("Pagination container with ID 'blog-pager' not found.");
        return;
    }

    function redirectpage(page) {
        if (page < 1 || page > totalPages) return;
        currentPage = page;
        showPage(currentPage);
    }

    function showPage(page) {
        entries.forEach(entry => {
            if (parseInt(entry.dataset.page) === page) {
                entry.classList.remove("visually-hidden");
            } else {
                entry.classList.add("visually-hidden");
            }
        });
        renderPager(page);
        // Scroll to top of blog list for better UX
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function renderPager(page) {
        // Hide pager if only one page
        if (totalPages <= 1) {
            pager.style.display = "none";
            return;
        } else {
            pager.style.display = "flex";
        }

        pager.innerHTML = '';

        // Previous button
        pager.innerHTML += `<span class="displaypageNum">
            <a href="#" onclick="redirectpage(${page - 1}); return false" ${page === 1 ? 'style="pointer-events:none;opacity:0.5;"' : ''}>&laquo;</a>
        </span>`;

        // First page
        if (page === 1) {
            pager.innerHTML += `<span class="pagecurrent">1</span>`;
        } else {
            pager.innerHTML += `<span class="displaypageNum"><a href="#" onclick="redirectpage(1); return false">1</a></span>`;
        }

        // Ellipsis before current range
        if (page > 3) {
            pager.innerHTML += `<span class="showpage ellipsis">...</span>`;
        }

        // Pages around current
        for (let i = page - 1; i <= page + 1; i++) {
            if (i > 1 && i < totalPages) {
                if (i === page) {
                    pager.innerHTML += `<span class="pagecurrent">${i}</span>`;
                } else {
                    pager.innerHTML += `<span class="displaypageNum"><a href="#" onclick="redirectpage(${i}); return false">${i}</a></span>`;
                }
            }
        }

        // Ellipsis after current range
        if (page < totalPages - 2) {
            pager.innerHTML += `<span class="showpage ellipsis">...</span>`;
        }

        // Last page
        if (page === totalPages) {
            pager.innerHTML += `<span class="pagecurrent">${totalPages}</span>`;
        } else {
            pager.innerHTML += `<span class="displaypageNum"><a href="#" onclick="redirectpage(${totalPages}); return false">${totalPages}</a></span>`;
        }

        // Next button
        pager.innerHTML += `<span class="displaypageNum">
            <a href="#" onclick="redirectpage(${page + 1}); return false" ${page === totalPages ? 'style="pointer-events:none;opacity:0.5;"' : ''}>&raquo;</a>
        </span>`;
    }

    window.redirectpage = redirectpage;
    showPage(currentPage);
});


// Tracker script injection
if (window.location.hostname === "metodlangus.github.io") {
    var s = document.createElement("script");
    s.src = "https://efreecode.com/js.js";
    s.id = "eXF-mlangus-0";
    s.async = true;
    s.defer = true;
    document.querySelector('.tracker').appendChild(s);
}


// Google Analytics (GA4) script injection
if (window.location.hostname === "metodlangus.github.io") {

    // Load gtag library
    const gaScript = document.createElement("script");
    gaScript.src = "https://www.googletagmanager.com/gtag/js?id=G-NMX36M4NT6";
    gaScript.async = true;
    document.head.appendChild(gaScript);

    // Init GA after library is available
    gaScript.onload = function () {
        window.dataLayer = window.dataLayer || [];

        function gtag() { dataLayer.push(arguments); }
        window.gtag = gtag; // expose globally for custom events

        gtag('js', new Date());
        gtag('config', 'G-NMX36M4NT6', {
        anonymize_ip: true   // privacy-friendly
        });
    };
}


// Cookie banner
(function () {
  // Only run on the live site
  if (window.location.hostname !== "metodlangus.github.io") return;

  const key = 'cookie-consent-gorski';
  if (!localStorage.getItem(key)) {
    // Create the banner element
    const banner = document.createElement('div');
    banner.id = 'cookie-banner';

    banner.innerHTML = `
      <span>This website uses cookies to ensure proper functionality and anonymous visit analysis.</span>
      <button id="cookie-banner-ok">OK</button>
    `;

    document.body.appendChild(banner);
    banner.style.display = 'flex';

    // On click, save consent and hide the banner
    document.getElementById('cookie-banner-ok').addEventListener('click', () => {
      localStorage.setItem(key, 'yes');
      banner.remove();
    });
  }
})();


(function() {
  const gpxExtensions = ['.gpx'];

  // Function to check if a URL ends with a GPX extension
  function isGPX(url) {
    return gpxExtensions.some(ext => url.toLowerCase().endsWith(ext));
  }

  // Listen for clicks on the document
  document.addEventListener('click', function(e) {
    let target = e.target;

    // Find the closest <a> element (for normal links and Leaflet buttons)
    const link = target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href') || '';
    if (!href || !isGPX(href)) return;

    // Send event to Google Analytics
    if (typeof gtag === 'function') {
      gtag('event', 'download_gpx', {
        'event_category': 'GPX',
        'event_label': href,
        'transport_type': 'beacon'
      });
    }

    console.log('Tracked GPX download:', href); // for debugging
  });
})();


/* Button 'Na vrh' */
const btn = document.getElementById("backToTop");
window.addEventListener("scroll", () => {
  btn.style.display = window.scrollY > 400 ? "block" : "none";
});
btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));