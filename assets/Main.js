// Format date
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.post-date').forEach(function (el) {
    const date = new Date(el.dataset.date);
    if (isNaN(date.getTime())) return;
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

  const PhotosRange =
    localStorage.getItem('photosSliderValue') ||
    (typeof initPhotos !== 'undefined' ? initPhotos : 0);

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

    // Prevent Math.min(...[]) from returning Infinity
    if (!numericValues.length) return false;

    // Find the smallest number
    const minValue = Math.min(...numericValues);

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
      const row = element.closest('tr');

      if (!row) return;

      const previousRow = row.previousElementSibling;

      if (!previousRow) return;

      const link = previousRow.querySelector('a[href*="blogger.googleusercontent.com"]');

      if (link) {
        link.setAttribute('data-title', title);
      }

      const img = previousRow.querySelector('a img');

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

// For toggling label navigation bar
document.addEventListener("DOMContentLoaded", function() {
  const showMoreBtn = document.querySelector(".show-more");
  const showLessBtn = document.querySelector(".show-less");
  const remainingItems = document.querySelector(".remaining-items");

  // Restore saved state from localStorage
  const saved = localStorage.getItem('labelsExpanded');
  const expanded = saved === 'true';

  if (showMoreBtn && showLessBtn && remainingItems) {
    // Apply initial state
    if (expanded) {
      remainingItems.classList.remove('hidden');
      showMoreBtn.classList.add('hidden');
      showLessBtn.classList.remove('hidden');
    } else {
      remainingItems.classList.add('hidden');
      showMoreBtn.classList.remove('hidden');
      showLessBtn.classList.add('hidden');
    }

    showMoreBtn.addEventListener("click", function() {
      remainingItems.classList.remove("hidden");
      showMoreBtn.classList.add("hidden");
      showLessBtn.classList.remove("hidden");
      localStorage.setItem('labelsExpanded', 'true');
    });

    showLessBtn.addEventListener("click", function() {
      remainingItems.classList.add("hidden");
      showMoreBtn.classList.remove("hidden");
      showLessBtn.classList.add("hidden");
      localStorage.setItem('labelsExpanded', 'false');
    });
  }
});

/* Searchbox */
let posts = [];

if (typeof WindowBaseUrl !== 'undefined') {
  Promise.all([
    fetch(`${WindowBaseUrl}/data/all-posts.json`).then(r => r.json()),
    typeof isRelive !== 'undefined'
      ? fetch(`${WindowBaseUrl}/data/all-relive-posts.json`).then(r => r.json())
      : Promise.resolve({ feed: { entry: [] } })
  ])
    .then(([normalData, reliveData]) => {
      const normalEntries = normalData.feed?.entry || [];
      const reliveEntries = reliveData.feed?.entry || [];
      const entries = [...normalEntries, ...reliveEntries];

      posts = entries.map((entry, i) => {
        const title = entry.title?.$t || `untitled-${i}`;
        const content = entry.content?.$t || "";
        const rawLink = (entry.link || []).find(l => l.rel === "alternate" && l.type === "text/html")?.href || "#";
        const link = rawLink.replace(/\/index\.html$/, '/');
        const thumbnail = entry.media$thumbnail?.url || "";
        return { title, content, link, thumbnail };
      });
    })
    .catch(error => {
      console.error("Error loading feeds:", error);
    });
}

document.addEventListener("DOMContentLoaded", function () {
  const searchToggle = document.getElementById("searchToggle");
  const searchContainer = document.getElementById("searchContainer");
  const searchClose = document.getElementById("searchClose");
  const searchBox = document.getElementById("searchBox");
  const resultsContainer = document.getElementById("searchResults");

  // Searchbox does not exist on every page
  if (!searchToggle || !searchContainer || !searchClose || !searchBox || !resultsContainer) {
    return;
  }

  // Toggle search container visibility
  searchToggle.addEventListener("click", () => {
    const isVisible = searchContainer.classList.toggle("visible");
    if (!isVisible) {
      closeSearchOverlay();
    } else {
      searchBox.focus();
    }
  });

  // Ensure only one archive details (month/year) is open at a time.
  (function () {
    const detailSelector = 'details.month-group, details.year-group';
    const allDetails = Array.from(document.querySelectorAll(detailSelector));
    if (allDetails.length === 0) return;

    // When a details element is toggled open, close all others
    allDetails.forEach(d => {
      d.addEventListener('toggle', () => {
        if (d.open) {
          allDetails.forEach(other => {
            if (other !== d) other.open = false;
          });
        }
      });
    });

    // If user clicks an internal archive link
    allDetails.forEach(d => {
      d.querySelectorAll && d.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', function (e) {
          const parent = a.closest('details');
          if (!parent) return;

          // Close all details except the parent
          allDetails.forEach(other => {
            if (other !== parent) other.open = false;
          });

          parent.open = true;

          // If the clicked details contains nested month groups
          const monthDescendants = parent.querySelectorAll('details.month-group');

          if (monthDescendants && monthDescendants.length > 0) {
            const lastMonth = monthDescendants[monthDescendants.length - 1];

            // Close any other month-group details outside this parent
            allDetails.forEach(other => {
              if (
                other.matches &&
                other.matches('details.month-group') &&
                other !== lastMonth
              ) {
                other.open = false;
              }
            });

            lastMonth.open = true;
          }
        });
      });
    });
  })();

  // Close button inside search container clears and closes search
  searchClose.addEventListener("click", () => {
    closeSearchOverlay();
  });

  // Search input event
  searchBox.addEventListener("input", function () {
    const keyword = this.value.toLowerCase();

    resultsContainer.innerHTML = "";

    if (!keyword) {
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
  if (!sidebar) return;
  sidebar.classList.toggle("visible");
}

/* Pagination */
document.addEventListener("DOMContentLoaded", function () {
  const entries = document.querySelectorAll(".photo-entry");
  const entriesPerPage = 12;
  const totalPages = Math.ceil(entries.length / entriesPerPage);
  const pager = document.getElementById("blog-pager");
  let currentPage = 1;

  if (!pager) return;

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

    // Lazy-load deferred images on the newly visible page
    document.querySelectorAll(`.photo-entry[data-page="${page}"] img[data-src]`).forEach(img => {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });

    renderPager(page);
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

/* Button 'Na vrh' */
const btn = document.getElementById("backToTop");

if (btn) {
  window.addEventListener("scroll", () => {
    btn.style.display = window.scrollY > 400 ? "block" : "none";
  });

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* Overlay module */
document.addEventListener("DOMContentLoaded", function () {
  /* Do not run birthday overlay inside the birthday iframe itself */
  if (window.self !== window.top) {
    return;
  }

  const birthdayConfig = {
    birthday: "09-30",
    daysAfter: 30,
    testMode: false,
    rememberDismissal: true
  };


  const hostname = window.location.hostname.toLowerCase();

  const pathname = window.location.pathname.replace(/\/+$/, "");

  const isProduction =
    hostname === "matejlangus.github.io" &&
    pathname === "/map";

  const isLocal =
    hostname === "127.0.0.1" &&
    window.location.port === "5500" &&
    pathname === "/matejlangus.github.io/map";

  if (!isProduction && !isLocal) {
    return;
  }


  const allowedBirthdayOrigins = [
    "https://metodlangus.github.io"
  ];

  if (isLocal) {
    allowedBirthdayOrigins.push(
      window.location.origin
    );
  }


  function getBirthdayWindow() {
    const parts =
      birthdayConfig.birthday.split("-");

    if (parts.length !== 2) {
      return null;
    }

    const month =
      parseInt(parts[0], 10);

    const day =
      parseInt(parts[1], 10);

    if (
      !Number.isInteger(month) ||
      !Number.isInteger(day) ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31
    ) {
      return null;
    }

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    /* Birthday in the current year */
    const birthday =
      new Date(
        today.getFullYear(),
        month - 1,
        day
      );

    birthday.setHours(0, 0, 0, 0);

    /* Birthday has not happened yet this year */
    if (today < birthday) {
      return null;
    }

    /* Calculate days AFTER birthday */
    const daysAfterBirthday =
      Math.floor(
        (today - birthday) /
        86400000
      );

    if (
      daysAfterBirthday >= 0 &&
      daysAfterBirthday <= birthdayConfig.daysAfter
    ) {
      return daysAfterBirthday;
    }

    return null;
  }


  const daysSinceBirthday =
    birthdayConfig.testMode
      ? 0
      : getBirthdayWindow();

  if (
    !birthdayConfig.testMode &&
    daysSinceBirthday === null
  ) {
    return;
  }


  const birthdayPagePath =
    "/metodlangus.github.io/ostalo/objava/";

  const birthdayPageUrl =
    isProduction
      ? `https://metodlangus.github.io${birthdayPagePath}?birthday=${birthdayConfig.birthday}&days=${daysSinceBirthday}`
      : `${window.location.origin}${birthdayPagePath}?birthday=${birthdayConfig.birthday}&days=${daysSinceBirthday}`;


  const dismissalKey =
    "birthdaySurpriseDismissed";

  const today = new Date();

  const todayDismissalKey =
    birthdayConfig.birthday + "-" +
    today.getFullYear() + "-" +
    String(today.getMonth() + 1).padStart(2, "0") + "-" +
    String(today.getDate()).padStart(2, "0");

  if (
    birthdayConfig.rememberDismissal &&
    sessionStorage.getItem(
      dismissalKey
    ) === todayDismissalKey
  ) {
    return;
  }


  const overlay =
    document.createElement("div");

  overlay.id =
    "birthday-surprise-overlay";

  overlay.innerHTML = `
    <iframe
      src="${birthdayPageUrl}"
      title="Birthday surprise"
      allow="autoplay"
    ></iframe>
  `;


  const style =
    document.createElement("style");

  style.textContent = `
    #birthday-surprise-overlay {
      position:fixed;
      inset:0;
      z-index:2147483647;
      width:100vw;
      height:100vh;
      margin:0;
      padding:0;
      background:#000;
      opacity:0;
      transition:opacity .45s ease;
    }

    #birthday-surprise-overlay.birthday-visible {
      opacity:1;
    }

    #birthday-surprise-overlay iframe {
      display:block;
      width:100%;
      height:100%;
      border:0;
      margin:0;
      padding:0;
      background:transparent;
    }

    @media (prefers-reduced-motion:reduce) {
      #birthday-surprise-overlay {
        transition:none;
      }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(overlay);


  function closeBirthday() {
    if (birthdayConfig.rememberDismissal) {
      sessionStorage.setItem(
        dismissalKey,
        todayDismissalKey
      );
    }

    overlay.classList.remove(
      "birthday-visible"
    );

    setTimeout(function () {
      overlay.remove();
      style.remove();

      window.removeEventListener(
        "message",
        birthdayMessage
      );

      document.removeEventListener(
        "keydown",
        birthdayEscape
      );
    }, 500);
  }


  function birthdayMessage(event) {
    if (
      !allowedBirthdayOrigins.includes(
        event.origin
      )
    ) {
      return;
    }

    if (
      !event.data ||
      event.data.type !== "birthday-close"
    ) {
      return;
    }

    closeBirthday();
  }

  window.addEventListener(
    "message",
    birthdayMessage
  );


  function birthdayEscape(event) {
    if (event.key === "Escape") {
      closeBirthday();
    }
  }

  document.addEventListener(
    "keydown",
    birthdayEscape
  );


  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      overlay.classList.add(
        "birthday-visible"
      );
    });
  });
});

/* Random post function */
async function getRandomPost() {
  try {
    // Fetch the combined posts JSON
    const [mainRes] = await Promise.all([
      fetch('https://metodlangus.github.io/data/all-posts.json')
    ]);

    const mainData = await mainRes.json();

    const entries = [
      ...(mainData.feed?.entry || [])
    ];

    if (!entries || entries.length === 0) {
      throw new Error('No posts found');
    }

    // Extract all post URLs
    const postLinks = [];

    for (const entry of entries) {
      const links = entry.link || [];
      const postLink = links.find(
        l => l.rel === "alternate" &&
             l.type === "text/html"
      );

      if (postLink && postLink.href) {
        postLinks.push(
          postLink.href.replace(
            /\/index\.html$/,
            '/'
          )
        );
      }
    }

    if (postLinks.length === 0) {
      throw new Error('No valid post links found');
    }

    // Select random post
    const randomPost =
      postLinks[
        Math.floor(
          Math.random() * postLinks.length
        )
      ];

    // Navigate to random post
    window.location.href = randomPost;

  } catch (error) {
    console.error(
      'Error fetching posts:',
      error
    );

    // Fallback: redirect to home
    window.location.href =
      'https://metodlangus.github.io/';
  }
}