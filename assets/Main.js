// const WindowBaseUrl = window.location.origin;
const WindowBaseUrl = window.location.origin + "/metodlangus.github.io/";

const initPhotos = 1; // Determine range of photos to be shown on slideshows and in posts
const initMapPhotos = -1; // Determine range of photos to be shown on map

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

fetch("https://metodlangus.github.io/data/all-posts.json")
  .then(response => response.json())
  .then(data => {
    const entries = data.feed.entry || [];

    posts = entries.map((entry, i) => {
      const title = entry.title?.$t || `untitled-${i}`;
      const content = entry.content?.$t || "";
      const link = entry.link.find(l => l.rel === "alternate" && l.type === "text/html")?.href || "#";
      const thumbnail = entry.media$thumbnail?.url || "";

      return { title, content, link, thumbnail };
    });
  })
  .catch(error => {
    console.error("Napaka pri nalaganju Blogger feeda:", error);
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
            entry.style.display = entry.getAttribute("data-page") == page ? "block" : "none";
        });
        renderPager(page);
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
        pager.innerHTML += `<span class="displaypageNum"><a href="#" onclick="redirectpage(${page - 1}); return false" ${page === 1 ? 'style="pointer-events:none;opacity:0.5;"' : ''}>&laquo;</a></span>`;

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
        pager.innerHTML += `<span class="displaypageNum"><a href="#" onclick="redirectpage(${page + 1}); return false" ${page === totalPages ? 'style="pointer-events:none;opacity:0.5;"' : ''}>&raquo;</a></span>`;
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





/**
 * Initializes a toggle button that persists its ON/OFF state and reloads page when changed.
 * @param {string} buttonId - The ID of the toggle button element.
 * @param {string} storageKey - The key to use for storing the toggle state in localStorage.
 */
function initializePersistentToggle(buttonId, storageKey) {
    const button = document.getElementById(buttonId);
    if (!button) {
        console.warn(`Button not found for ID: ${buttonId}`);
        return;
    }

    // Load saved state or default to true (ON)
    let randomizeImages = localStorage.getItem(storageKey);
    randomizeImages = (randomizeImages === null) ? true : (randomizeImages === 'true');

    // Apply initial label
    button.textContent = randomizeImages ? 'DA' : 'NE';

    // Add click listener
    button.addEventListener('click', function () {
        // Toggle state
        randomizeImages = !randomizeImages;

        // Save to localStorage
        localStorage.setItem(storageKey, randomizeImages);

        // Update label
        button.textContent = randomizeImages ? 'DA' : 'NE';

        // Reload after short delay (same style as slider)
        clearTimeout(reloadTimeout);
        reloadTimeout = setTimeout(function () {
            location.reload();
        }, 2000);
    });
}

function toggleRandomize() {
    randomizeImages = !randomizeImages;
    document.getElementById('toggleRandomButton').innerText = randomizeImages
        ? 'DA'
        : 'NE';
}

function initializePersistentDateRange(startId, endId, storageKeyStart, storageKeyEnd) {
    const startInput = document.getElementById(startId);
    const endInput = document.getElementById(endId);

    if (!startInput || !endInput) return;

    // Load saved values
    const savedStart = localStorage.getItem(storageKeyStart);
    const savedEnd = localStorage.getItem(storageKeyEnd);

    if (savedStart) startInput.value = savedStart;
    if (savedEnd) endInput.value = savedEnd;

    // Save and reload on change
    [startInput, endInput].forEach(input => {
        input.addEventListener('change', () => {
            localStorage.setItem(storageKeyStart, startInput.value);
            localStorage.setItem(storageKeyEnd, endInput.value);
            clearTimeout(reloadTimeout);
            reloadTimeout = setTimeout(() => location.reload(), 2000);
        });
    });
}

function initializePersistentDateRange(startId, endId, storageKeyStart, storageKeyEnd) {
    const startInput = document.getElementById(startId);
    const endInput = document.getElementById(endId);

    if (!startInput || !endInput) {
        console.warn(`Date range inputs not found`);
        return;
    }

    // Load saved values
    const savedStart = localStorage.getItem(storageKeyStart);
    const savedEnd = localStorage.getItem(storageKeyEnd);

    if (savedStart) startInput.value = savedStart;
    if (savedEnd) endInput.value = savedEnd;

    // Save and reload on change
    [startInput, endInput].forEach(input => {
        input.addEventListener('change', () => {
            localStorage.setItem(storageKeyStart, startInput.value);
            localStorage.setItem(storageKeyEnd, endInput.value);
            clearTimeout(reloadTimeout);
            reloadTimeout = setTimeout(() => location.reload(), 2000);
        });
    });
}

function initializePersistentLabelFilter() {
    const checkboxes = document.querySelectorAll('.label-filter-checkbox');
    if (!checkboxes.length) return;

    // Load saved grouped labels (object like { "2": ["Slovenia"], "4": ["2023"] })
    const savedLabels = JSON.parse(localStorage.getItem('selectedLabels') || '{}');

    // Restore checked state based on savedLabels
    checkboxes.forEach(cb => {
        const prefix = cb.dataset.prefix;
        if (savedLabels[prefix] && savedLabels[prefix].includes(cb.value)) {
            cb.checked = true;
        }

        cb.addEventListener('change', () => {
            const selected = {};

            // Collect all checked labels grouped by prefix
            checkboxes.forEach(c => {
                if (c.checked) {
                    const p = c.dataset.prefix;
                    if (!selected[p]) selected[p] = [];
                    selected[p].push(c.value);
                }
            });

            // Save grouped structure to localStorage
            localStorage.setItem('selectedLabels', JSON.stringify(selected));

            // Reload after slight delay to allow multiple selections
            clearTimeout(window.reloadTimeout);
            window.reloadTimeout = setTimeout(() => location.reload(), 2000);
        });
    });
}


// Toggle collapsible label sections and remember state
function toggleSection(id, btn) {
    const el = document.getElementById(id);
    const icon = btn.querySelector('.arrow-icon');
    const isHidden = el.style.display === "none";

    el.style.display = isHidden ? "block" : "none";
    icon.textContent = isHidden ? "▼" : "▶";

    // Save state to localStorage
    localStorage.setItem("collapse_" + id, isHidden ? "open" : "closed");
}

// Restore collapsible section state on page load
function restoreCollapseState() {
    document.querySelectorAll(".collapse-btn").forEach(function(btn) {
        const sectionId = btn.getAttribute("onclick").match(/'(.*?)'/)[1];
        const savedState = localStorage.getItem("collapse_" + sectionId);
        const sectionEl = document.getElementById(sectionId);
        const icon = btn.querySelector(".arrow-icon");

        if (savedState === "open") {
            sectionEl.style.display = "block";
            icon.textContent = "▼";
        } else {
            sectionEl.style.display = "none";
            icon.textContent = "▶";
        }
    });
}

// Setup "Clear Filters" button
function setupClearFiltersButton() {
    const btn = document.getElementById('clear-filters-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
        document.querySelectorAll('.label-filter-checkbox').forEach(cb => cb.checked = false);
        localStorage.removeItem('selectedLabels');
        localStorage.removeItem('startDateRange');
        localStorage.removeItem('endDateRange');

        console.log('[filters cleared]');
        
        setTimeout(() => location.reload(), 500);
    });
}

// Variable to hold the timeout ID
let reloadTimeout;

/**
* Initializes a slider to persist its value across page navigations.
* @param {string} sliderId - The ID of the slider element.
* @param {string} valueDisplayId - The ID of the element displaying the value.
* @param {string} storageKey - The key to use for storing the value in localStorage.
*/
function initializePersistentSlider(sliderId, valueDisplayId, storageKey) {
    const slider = document.getElementById(sliderId);
    const valueDisplay = document.getElementById(valueDisplayId);

    if (!slider || !valueDisplay) {
        console.warn(`Slider or value display not found for IDs: ${sliderId}, ${valueDisplayId}`);
        return;
    }

    // Define special titles for specific values
    const specialTitle = {
        "3": "Največ slik",
        "2": "Več slik",
        "1": "Malo slik",
        "0": "Najboljše"
    };

    // Load the saved value from localStorage and apply it to the slider and display
    const savedValue = localStorage.getItem(storageKey);
    if (savedValue !== null) {
        slider.value = savedValue;
        valueDisplay.textContent = specialTitle[savedValue] || savedValue;
    } else {
        slider.value = initPhotos; // Default value
        valueDisplay.textContent = specialTitle[initPhotos] || initPhotos; // Default display value
    }

    // Update the display and save to localStorage when slider changes
    slider.addEventListener('input', function () {
        const value = slider.value;
        valueDisplay.textContent = specialTitle[value] || value;
        localStorage.setItem(storageKey, value); // Save the new value to localStorage

        // Clear the previous timeout if the slider value changes again before timeout
        clearTimeout(reloadTimeout);

        // Reload the page after 2 seconds
        reloadTimeout = setTimeout(function() {
            location.reload();
        }, 2000); // 2000 milliseconds = 2 seconds
    });
}

// Initialize the slider when the page is loaded
document.addEventListener('DOMContentLoaded', function () {
    initializePersistentSlider('photosSliderElement', 'photosValueElement', 'photosSliderValue');
    initializePersistentToggle('toggleRandomButton', 'randomizeImages');
    initializePersistentDateRange('startDateInput', 'endDateInput', 'startDateRange', 'endDateRange');
    restoreCollapseState();
    initializePersistentLabelFilter();
    setupClearFiltersButton();
});