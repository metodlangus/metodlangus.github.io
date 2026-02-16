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

    // Links page
    runIfDefined(window.UsefulLinksModule, () => {
        UsefulLinksModule.init({
              containerId: 'useful-links-container',
              mapOverlayId: 'mapOverlay',
              mapFrameId: 'mapOverlayFrame',
              mapPageUrl: 'https://metodlangus.github.io/mattia-adventures-map.html',
              mapTriggerUrl: 'https://mattia-furlan.github.io/mont/escursioni/introduzione/'
          });
    });

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