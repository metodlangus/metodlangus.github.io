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
        auth.onAuthStateChanged(user => {
        
            const overlay = document.getElementById("authOverlay");
            if (!overlay) return;
            if (user) {
              console.log("User signed in:", user.displayName || user.email);
              overlay.style.display = "none";
            } else {
              console.log("User not signed in");
              overlay.style.display = "flex";
            }

            // Destroy previous map safely
            if (MyMemoryMapModule.getMap()) {
                MyMemoryMapModule.destroy();
            }

            // Re-initialize the module with current signin status
            MyMemoryMapModule.init({
                mapId: 'map',
                baseUrl: WindowBaseUrl,
                initPhotosValue: initMapPhotos,
                isRelive: isRelive,
                enableRelive: true,
                isSignedIn: !!user
            });
        });

        document.getElementById('applyFilters')?.click();
    });

    // Map
    runIfDefined(window.MyMapModule, () => {
        let mapInitialized = false;

        auth.onAuthStateChanged(user => {
            if (!mapInitialized) {
                mapInitialized = true;
                MyMapModule.init({
                    usePostTitle: false,
                    trackColour: 'orange',
                    isRelive: isRelive,
                    isSignedIn: !!user
                });
                console.log("MyMapModule initialized. User signed in:", !!user);
            }
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
        // Decide trackPhotoListUrl based on isRelive
        const trackPhotoListUrl = isRelive
          ? "https://metodlangus.github.io/extracted_relive_photos_with_gps_data.txt"
          : "https://metodlangus.github.io/extracted_photos_with_gps_data.txt";

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
            isRelive: isRelive,
            isSignedIn: false, // initial (will update later)
            trackPlayer: true, // enable track player features
            trackPhotoListUrl: trackPhotoListUrl,
            trackPlayDuration: 90,  // seconds for full track at speed 1×
            trackGroupDist: 250,    // metres — max track-distance to keep photos in one group
            trackPhotoWindowBeforeMinutes: 60, // minutes before track start
            trackPhotoWindowAfterMinutes: 60,  // minutes after track end
        });

        // React to auth changes
        auth.onAuthStateChanged(user => {
            const isSignedIn = !!user;
            window.isSignedIn = isSignedIn;

            window.updateTrackButtonsAuth?.(isSignedIn);
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
    
    // Popular posts
    runIfDefined(window.PopularPostsModule, () => {
        PopularPostsModule.init({
              WindowBaseUrl: WindowBaseUrl,
              maxPosts: 3
          });
    });

    // Attach auth overlay listeners (works for both static and dynamic overlays)
    function attachAuthOverlayListeners(container) {
        // Google login
        container.querySelector('#googleLoginBtn')?.addEventListener('click', async () => {
            try { await signInWithGoogle(); }
            catch (err) { console.error("Google login failed:", err); }
        });

        // Github login
        container.querySelector('#githubLoginBtn')?.addEventListener('click', async () => {
            try { await signInWithGithub(); }
            catch (err) { console.error("Github login failed:", err); }
        });

    }
    window.attachAuthOverlayListeners = attachAuthOverlayListeners;

    // For static overlay in HTML (MemoryMap page)
    const staticOverlay = document.getElementById('authOverlay');
    if (staticOverlay) attachAuthOverlayListeners(staticOverlay);

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
        window.gtag = gtag;

        gtag('js', new Date());

        // Auth-aware GA4 init
        if (typeof firebase !== 'undefined') {
            firebase.auth().onAuthStateChanged(user => {
                gtag('config', 'G-NMX36M4NT6', {
                    anonymize_ip: true,
                    user_id: user ? user.uid : null  // Firebase UID, never email
                });

                // Optional: also set as a user property for easier segmentation
                if (user) {
                    gtag('set', 'user_properties', {
                        signed_in: 'true'
                    });
                }
            });
        } else {
            // Fallback if Firebase not on this page
            gtag('config', 'G-NMX36M4NT6', { anonymize_ip: true });
        }
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


/* --------------------------------------------------
   FIREBASE AUTH (classic script version)
-------------------------------------------------- */

// Only initialize Firebase if the SDK is loaded on this page
if (typeof firebase !== 'undefined') {

    const firebaseConfig = {
      apiKey: "AIzaSyBmXpwWj65ZbTVqaHMJXyEeSjzsp5TuzZI",
      authDomain: "gorski-uzitki-auth.firebaseapp.com",
      projectId: "gorski-uzitki-auth",
      storageBucket: "gorski-uzitki-auth.firebasestorage.app",
      messagingSenderId: "893128496936",
      appId: "1:893128496936:web:1cbe8ee4521bd0a9c0a21d",
      measurementId: "G-HCKFX55W6D"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);

    // Auth objects
    const auth = firebase.auth();
    const googleProvider = new firebase.auth.GoogleAuthProvider();
    const githubProvider = new firebase.auth.GithubAuthProvider();

    // expose globally
    window.auth = auth;
    window.googleProvider = googleProvider;
    window.githubProvider = githubProvider;


    // -------- AUTH HELPERS --------
    function checkSignIn() {
      return new Promise(resolve => {
        auth.onAuthStateChanged(user => {
          resolve(!!user);
        });
      });
    }

    async function signIn(provider, name) {
      try {
        // If user already logged in → just link provider
        if (auth.currentUser) {
          const result = await auth.currentUser.linkWithPopup(provider);
          console.log(`${name} successfully linked to account`);
          alert(`${name} prijava je bila uspešno dodana vašemu računu.`);
          return result;
        }
        // Normal login
        const result = await auth.signInWithPopup(provider);
        console.log(`${name} login success:`, result.user);
        return result.user;

      } catch (err) {
        console.warn(`${name} login failed:`, err.code, err.message);

        const messages = {
          "auth/user-disabled":
            "Vaš račun je bil onemogočen s strani administratorja. Prosim, kontaktirajte za več informacij.",
          "auth/account-exists-with-different-credential":
            null, // handled separately below
          "auth/popup-closed-by-user":
            "Prijavno okno je bilo zaprto. Poskusite znova.",
          "auth/popup-blocked":
            "Brskalnik je blokiral prijavno okno. Prosimo, dovolite pojavna okna za to stran.",
          "auth/cancelled-popup-request":
            null, // silent — user just opened another popup
          "auth/network-request-failed":
            "Napaka omrežja. Preverite internetno povezavo in poskusite znova.",
          "auth/too-many-requests":
            "Preveč poskusov prijave. Počakajte nekaj minut in poskusite znova.",
          "auth/user-not-found":
            "Račun s temi podatki ne obstaja.",
          "auth/invalid-credential":
            "Neveljavni podatki za prijavo. Prosimo, poskusite znova.",
        };

        if (err.code === "auth/account-exists-with-different-credential") {
          const email = err.customData?.email;
          try {
            const methods = await auth.fetchSignInMethodsForEmail(email);
            const providerMap = {
              "google.com": "Google",
              "github.com": "GitHub",
              "password": "e-pošto"
            };
            const providerName = providerMap[methods?.[0]] || "drugim ponudnikom";
            alert(`Račun z emailom ${email} že obstaja. Prosimo, prijavite se z ${providerName}.`);
          } catch (e) {
            console.error("Provider detection failed:", e);
            alert("Ta e-poštni naslov je že povezan z drugim računom. Poskusite se prijaviti drugače.");
          }
          return;
        }

        const userMessage = messages[err.code];
        if (userMessage) {
          alert(userMessage);
        } else {
          // Fallback for any unhandled Firebase error
          alert(`Prijava ni uspela (${err.code}). Prosimo, poskusite znova ali kontaktirajte podporo.`);
        }
      }
    }

    function signInWithGoogle() {
      return signIn(googleProvider, "Google");
    }

    function signInWithGithub() {
      return signIn(githubProvider, "GitHub");
    }

    // Expose to window
    window.checkSignIn = checkSignIn;
    window.signInWithGoogle = signInWithGoogle;
    window.signInWithGithub = signInWithGithub;
    window.onAuthStateChanged = auth.onAuthStateChanged.bind(auth);
}

// Shifting for Google Translate banner (to prevent it from covering the header)
(function() {
  const SHIFT_CLASS = 'translate-shift';

  const menuBtn = document.querySelector('.menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const searchBtn = document.getElementById('searchToggle');
  const searchBox = document.getElementById('searchContainer');

  function getBannerHeight() {
    const banner = document.querySelector('iframe.goog-te-banner-frame');
    return banner ? (banner.offsetHeight || 50) : 50;
  }

  function isTranslated() {
    return document.documentElement.classList.contains('translated-ltr')
  }

  function updateLayout() {
    if (isTranslated()) {
      const height = getBannerHeight();

      document.body.style.setProperty('--translate-bar-height', `${height}px`);

      menuBtn?.classList.add(SHIFT_CLASS);
      sidebar?.classList.add(SHIFT_CLASS);
      searchBtn?.classList.add(SHIFT_CLASS);
      searchBox?.classList.add(SHIFT_CLASS);

    } else {
      document.body.style.removeProperty('--translate-bar-height');

      menuBtn?.classList.remove(SHIFT_CLASS);
      sidebar?.classList.remove(SHIFT_CLASS);
      searchBtn?.classList.remove(SHIFT_CLASS);
      searchBox?.classList.remove(SHIFT_CLASS);
    }
  }

  // Watch for class changes on <html>
  const observer = new MutationObserver(updateLayout);

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  });

  // Run once on load (in case already translated)
  window.addEventListener('load', updateLayout);
})();