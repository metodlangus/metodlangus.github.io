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