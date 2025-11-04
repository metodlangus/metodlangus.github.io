let randomizeImages = true; // default ON
let slideshowIndex = 0;
var slideshowTitles = [];
var numberOfSlideshows = [];

// Default cover photo
const defaultImgSrc = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiU8RYSJ0I45O63GlKYXw5-U_r7GwP48_st9F1LG7_Z3STuILVQxMO4qLgzP_wxg0v_77s-YwidwwZQIDS1K6SUmY-W3QMwcIyEvt28cLalvCVQu4qWTQIm-B_FvgEmCCe6ydGld4fQgMMd2xNdqMMFtuHgeVXB4gRPco3XP90OOKHpf6HyZ6AeEZqNJQo/s1600/IMG20241101141924.jpg";

// Array to hold all slideshows data
let slideshows = [];

// DOM Element Arrays
const slideshowContainer = [];

/**
 * @brief   A Least Recently Used (LRU) cache implementation with size-based eviction.
 *
 * @details This class manages a cache that automatically evicts the least recently used 
 *          items when the total size exceeds the defined `maxSize`. Items are stored 
 *          with their respective sizes, allowing the cache to efficiently manage memory 
 *          usage. Common operations include adding, retrieving, and deleting items while 
 *          maintaining a strict size limit.
 *
 * @class   LRUCacheBySize
 *
 * @param   {number} maxSize The maximum allowed size of the cache in bytes.
 *
 * @methods 
 * - `set(key, value, size)` Adds a key-value pair to the cache. Evicts the least recently 
 *   used items if the cache exceeds the maximum size.
 * - `get(key)` Retrieves a value by its key. Marks the accessed item as recently used.
 * - `has(key)` Checks if a key exists in the cache.
 * - `delete(key)` Removes a key-value pair from the cache and adjusts the size.
 * - `clear()` Clears all items from the cache and resets the size.
 *
 * @example
 * const cache = new LRUCacheBySize(1024 * 1024); // 1MB max size
 * cache.set('image1', img1, 400000); // Add an image with a size of 400KB
 * const image = cache.get('image1'); // Retrieve the cached image
 *
 * @note    The size of each item must be explicitly provided during insertion. The cache 
 *          uses a `Map` to store items and their metadata, ensuring O(1) access and update times.
 */
    class LRUCacheBySize {
    constructor(maxSize) {
        this.cache = new Map(); // Store cached items
        this.maxSize = maxSize; // Max size in bytes
        this.currentSize = 0;   // Current total size in bytes
    }

    // Set a key-value pair in the cache
    set(key, value, size) {
    if (typeof size !== "number" || isNaN(size)) {
        console.warn(`Skipping cache entry for ${key} — invalid size.`);
        return; // Don't add items with undefined or invalid size
    }

    if (this.cache.has(key)) {
        this.currentSize -= this.cache.get(key).size;
        this.cache.delete(key);
    }

    while (this.currentSize + size > this.maxSize) {
        const oldestKey = this.cache.keys().next().value;
        const oldestItem = this.cache.get(oldestKey);
        this.currentSize -= oldestItem.size;
        this.cache.delete(oldestKey);
    }

    this.cache.set(key, { value, size });
    this.currentSize += size;
}

    // Get a value by its key
    get(key) {
        if (!this.cache.has(key)) return null;

        const item = this.cache.get(key);

        // Move accessed item to the end to mark it as recently used
        this.cache.delete(key);
        this.cache.set(key, item);

        return item.value;
    }

    // Check if a key exists
    has(key) {
        return this.cache.has(key);
    }

    // Delete a key-value pair
    delete(key) {
        if (this.cache.has(key)) {
            const item = this.cache.get(key);
            this.currentSize -= item.size;
            this.cache.delete(key);
        }
    }

    // Clear the cache
    clear() {
        this.cache.clear();
        this.currentSize = 0;
    }
}

const imageCache = new LRUCacheBySize(50 * 1024 * 1024); // Cache size limit: 50MB

// Call the function to generate the slideshow containers
generateSlideshowContainers(defaultImgSrc);


/**
 * @brief   Generates slideshow containers dynamically based on available titles and cover photos.
 *
 * @details This function iterates through the available slideshow titles, retrieves the corresponding cover photo
 *          for each slideshow, and inserts the slideshow container into the DOM. If no valid cover photo is found,
 *          a default image source is used. The function also minimizes image source sizes and logs all slideshow titles.
 *
 * @param   defaultImgSrc    The default image source to be used if no valid cover photo is found.
 *
 * @return  None.
 */
function generateSlideshowContainers(defaultImgSrc) {
    // Generate slideshow containers by iterating through available titles and assigning cover photos, using a default if necessary.
    while (typeof window[`slideshowTitle${slideshowIndex}`] !== 'undefined') {
        // Access the variable
        const SlideshowTitle = window[`slideshowTitle${slideshowIndex}`];
        let coverPhoto = window[`CoverPhoto${slideshowIndex}`];
        
        // Check if the cover photo is valid, if not set it to a default source
        if (!coverPhoto || coverPhoto.trim() === "") {
            coverPhoto = defaultImgSrc;  // Set the image source to the predefined URL
        }

        // Collect titles
        slideshowTitles.push(SlideshowTitle);

        // Insert the slideshow container
        insertSlideshowContainer(SlideshowTitle, coverPhoto, slideshowIndex); 
        
        // Move to the next slideshow index
        slideshowIndex++;
    }

    // Log the titles of the slideshows that will be created
    console.log('All slideshows:', slideshowTitles);

    // Call the function to initialize slideshows
    initializeSlideshows(numberOfSlideshows, defaultImgSrc);
}




/**
 * @brief   Dynamically inserts a slideshow container into the DOM.
 *
 * @details This function creates and inserts a complete slideshow container structure, which includes the slideshow
 *          image display, navigation controls, progress bar, and settings for quality and speed adjustments.
 *          The slideshow is inserted after the corresponding script tag in the DOM. It uses the provided slideshow
 *          title and cover photo for initialization, and dynamically generates a unique set of HTML elements for each
 *          slideshow instance, identified by an index.
 *
 * @param   slideshowTitle  The title for the slideshow that is displayed on the cover photo.
 * @param   coverPhoto      The URL of the image displayed as the cover photo for the slideshow.
 * @param   index           The unique index to identify each slideshow instance and dynamically generate its elements.
 *
 * @return  None.
 */
function insertSlideshowContainer(slideshowTitle, coverPhoto, index) {
    console.log(`Inserting slideshow container for index ${index}: Title=${slideshowTitle}, Cover Photo=${coverPhoto}`);
    
    // Create wrapper div
    var wrapperDiv = document.createElement('div');
    wrapperDiv.id = `slideShow-${index}`;
    wrapperDiv.className = 'my-slideshow-wrapper';

    // Inner HTML: gallery view instead of slideshow
    wrapperDiv.innerHTML = `
        <h2 class="gallery-title">${slideshowTitle}</h2>
        <div class="gallery-container" id="slideshowContainer-${index}">
            <!-- Cover photo displayed first -->
            <div class="gallery-item cover-photo">
                <img alt="Cover Photo" src="${coverPhoto}" id="coverPhotoElement-${index}" />
                <div class="photo-overlay">
                    <span class="photo-title">${slideshowTitle}</span>
                </div>
            </div>
        </div>
    `;

    // Insert wrapper after the target script tag
    var scriptTags = document.getElementsByTagName('script');
    var targetScriptTag;
    for (var i = 0; i < scriptTags.length; i++) {
        if (scriptTags[i].innerText.includes('var slideshowTitle' + index)) {
            targetScriptTag = scriptTags[i];
            numberOfSlideshows.push(index);
            break;
        }
    }

    if (targetScriptTag) {
        targetScriptTag.parentNode.insertBefore(wrapperDiv, targetScriptTag.nextSibling);
    }
}


/**
 * @brief   Initializes the slideshow data and DOM elements for all slideshows.
 *
 * @details This function initializes the slideshow data, populates the slideshow arrays with default values,
 *          and collects DOM elements related to the slideshow. The function is called for each slideshow
 *          in the `numberOfSlideshows` array.
 *
 * @param   numberOfSlideshows  Array that contains the indices of the slideshows to be initialized.
 * @param   defaultImgSrc       The default image source to be used for missing cover photos.
 *
 * @return  None.
 */
function initializeSlideshows(numberOfSlideshows, defaultImgSrc) {
    // Create the slideshows with default values for elements in the array
    numberOfSlideshows.forEach(index => {
        slideshows[index] = {
            imageBuffer: [],
            shuffledImages: [],
        };
    });

    // Populate the DOM element arrays
    numberOfSlideshows.forEach(index => {
        slideshowContainer.push(document.getElementById(`slideshowContainer-${index}`));
    });
}

/*######### Onload functions  #########*/

/**
 * @brief   Fetches and processes data for a slideshow.
 *
 * @details Constructs a blog feed URL based on the slideshow title or post ID 
 *          and retrieves image data using a fetch request. The function handles 
 *          special cases like "All pictures" (recursive loading) and processes 
 *          entries to populate the slideshow's image buffer. Updates the UI with 
 *          built slides or logs errors in case of failures.
 *
 * @param   index Index of the slideshow to fetch data for.
 */
function fetchData(index) {
    var feedUrl;
    
    // Determine the feed URL based on the slideshow title
    if (slideshowTitles[index] === "All pictures") {
        feedUrl = `${WindowBaseUrl}/data/all-posts.json`;
    } else if (slideshowTitles[index] === "Make post slideshow" || slideshowTitles[index] === "Make trip slideshow") {
        feedUrl = `${WindowBaseUrl}/data/posts/${postId}.json`; // Get by postID
    } else {
        feedUrl = `${WindowBaseUrl}/data/posts/${encodeURIComponent(slideshowTitles[index])}.json`;
    }
    // console.log("feedUrl:",feedUrl)

    // Fetch the data from the constructed feed URL
    fetch(feedUrl)
        .then(response => response.json())
        .then(async (data) => {
            // The entries are in data.entry, if retrieving data by postId
            let entries = data.entry;

            if (slideshowTitles[index] !== "Make post slideshow" && slideshowTitles[index] !== "Make trip slideshow") {
                entries = data.feed.entry;
            }

            // If there's just one entry, wrap it into an array to handle it uniformly
            if (entries && !Array.isArray(entries)) {
                entries = [entries]; // Convert single entry into an array
            }

            // Process "All pictures" scenario
            if (slideshowTitles[index] === "All pictures") {


                if (!entries || entries.length === 0) {
                    console.log('No new entries, using existing imageBuffer:', slideshows[index].imageBuffer.length);
                    document.getElementById('imagesLoadedCount').textContent = slideshows[index].imageBuffer.length;
                } else {
                    // Date and labels filter
                    const startDate = localStorage.getItem('startDateRange'),
                          endDate = localStorage.getItem('endDateRange'),
                          selectedLabels = JSON.parse(localStorage.getItem('selectedLabels') || '{}'); // object grouped by prefix

                    // Log currently applied filters
                    console.log("Applied Filters:", {
                        startDate: startDate || 'none',
                        endDate: endDate || 'none',
                        selectedLabels: selectedLabels
                    });

                    if (startDate || endDate || Object.keys(selectedLabels).length > 0) {
                        entries = entries.filter(entry => {
                            const entryDate = new Date(entry.published?.$t || entry.published);

                            // Date filter
                            if (startDate && entryDate < new Date(startDate)) return false;
                            if (endDate && entryDate > new Date(endDate)) return false;

                            // Label filter (group-based AND logic)
                            if (Object.keys(selectedLabels).length > 0) {
                                const entryLabels = (entry.category || []).map(cat => cat.term.replace(/^\d+\.\s*/, ''));

                                for (const group in selectedLabels) {
                                    const groupLabels = selectedLabels[group];
                                    if (!groupLabels.some(label => entryLabels.includes(label))) {
                                        return false;
                                    }
                                }
                            }

                            return true;
                        });
                    }

                    // Procesiraj filtrirane vnose
                    for (let entry of entries) {
                        processEntry(index, entry);
                    }
                }

                const imgCount = slideshows[index].imageBuffer.length;

                if (imgCount === 0) {
                    // ✅ Ni slik po filtrih → prikaži sporočilo
                    const container = document.getElementById(`slideShow-${index}`);
                    container.innerHTML = `<p style="text-align:center; font-size:18px; padding:20px;">Ni slik za izbrane filtre</p>`;
                    console.warn('No images to display for selected filters');
                    return;
                }

                // Če slike obstajajo → zgradi slideshow
                console.log('Fetched', imgCount, 'images for All pictures');
                document.getElementById('imagesLoadedCount').textContent = imgCount;

                slideshows[index].shuffledImages = shuffleArray(slideshows[index].imageBuffer.slice(), index);
                buildSlides(index);
                return;
            }


            // Process each entry
            for (let entry of entries) {
                if (slideshowTitles[index] !== "Make trip slideshow") {
                    // Process the main entry if it's not "Make trip slideshow"
                    processEntry(index, entry);
                } else if (slideshowTitles[index] === "Make trip slideshow") {
                    if (entry.content && entry.content.$t) {
                        const content = entry.content.$t; // HTML content of the entry
                        const parser = new DOMParser();
                        const htmlDoc = parser.parseFromString(content, 'text/html');
                        const postTitle = entry.title?.$t || "Untitled Post"; // Ensure a valid post title
                        const captions = getCaptions(htmlDoc);

                        // Parse <img> elements
                        const images = [...htmlDoc.querySelectorAll('img')]
                        .slice(1) // Exclude the first <img> element
                        .map((img, idx) => ({
                            type: 'img',
                            src: img.getAttribute('src'),
                            caption: captions[idx + 1] || '', // Shift index to match remaining images
                            position: htmlDoc.body.innerHTML.indexOf(img.outerHTML), // Get the position of the <img> in the content
                            dataSkip: img.getAttribute('data-skip') || "3" // Default value if missing
                        }));

                        // Get saved slider value
                        const PhotosRange = localStorage.getItem('photosSliderValue') || initPhotos; // Default value if not set

                        // Filter images based on `data-skip`, but keep SVGs
                        const filteredImages = images.filter(image => {
                            const src = image.src || "";
                            
                            // Always keep SVG-created images
                            if (src.startsWith("data:image/svg+xml")) {
                                return true;
                            }

                            let dataSkip = image.dataSkip.toLowerCase();

                            // Replace text-based `data-skip` values with numeric equivalents
                            dataSkip = dataSkip.replace(/best/g, "0").replace(/cover/g, "-1").replace(/peak/g, "-2");

                            // Split into array
                            const dataSkipValues = dataSkip.split(";");

                            return dataSkipValues.some(value => {
                                if (!isNaN(value)) {
                                    const numericValue = parseFloat(value);

                                    // Exclude if the only tag is `-2` (peak)
                                    if (numericValue === -2) {
                                        return false;
                                    }

                                    return numericValue <= PhotosRange;
                                }
                                return false;
                            });
                        });

                        // Parse <script> elements containing post IDs
                        const scriptMatches = content.match(/<script>[\s\S]*?var\s+postID\d+\s*=\s*'([^']+)';[\s\S]*?<\/script>/g);
                        const scripts = scriptMatches
                            ? scriptMatches.map(script => {
                                    const match = script.match(/var\s+postID\d+\s*=\s*'([^']+)'/);
                                    return match
                                        ? {
                                            type: 'script',
                                            postId: match[1],
                                            scriptContent: script,
                                            position: htmlDoc.body.innerHTML.indexOf(script) // Get the position of the <script> in the content
                                        }
                                        : null;
                                }).filter(Boolean)
                            : [];

                        // Combine filtered images and scripts into a single array
                        const mixElements = [...filteredImages, ...scripts];

                        // Ensure the combined array is sorted by their position in the original content
                        mixElements.sort((a, b) => a.position - b.position);

                        // Log the sorted array, just for debug
                        // console.log(`Mixed elements:`, mixElements);

                        // Process each element based on its type
                        for (const element of mixElements) {
                            if (element.type === 'img') {
                                slideshows[index].imageBuffer.push({
                                    src: element.src,
                                    caption: element.caption,
                                    title: postTitle, // Ensure the correct title is passed
                                });
                            } else if (element.type === 'script') {
                                const additionalPostId = element.postId;
                                const additionalPostUrl = `${WindowBaseUrl}/data/posts/${additionalPostId}.json`;
                                

                                try {
                                    const additionalPostResponse = await fetch(additionalPostUrl);

                                    if (!additionalPostResponse.ok) {
                                        console.error(`Failed to fetch additional post with ID ${additionalPostId}: HTTP ${additionalPostResponse.status}`);
                                        continue;
                                    }

                                    const additionalPostData = await additionalPostResponse.json();
                                    let additionalEntries = additionalPostData.entry;

                                    if (additionalEntries && !Array.isArray(additionalEntries)) {
                                        additionalEntries = [additionalEntries];
                                    }

                                    // Ensure correct title extraction from additional post
                                    const additionalPostTitle = additionalPostData.entry?.title?.$t || `Post ID: ${additionalPostId}`;

                                    // Process each additional entry
                                    additionalEntries.forEach(additionalEntry => {
                                        processEntry(index, additionalEntry);
                                        // console.log(`Adding images from additional entry with post ID: ${additionalPostId}`);
                                        console.log(`Adding images from additional entry with title: ${additionalPostTitle}`);
                                    });
                                } catch (err) {
                                    console.error(`Error fetching additional post with ID ${additionalPostId}:`, err);
                                }
                            }
                        }
                    } else {
                        console.warn(`Entry content is missing or undefined for index: ${index}`);
                    }
                }
            }

            // Handle non-"All pictures" cases
            if (slideshowTitles[index] !== "All pictures") {
                if (slideshowTitles[index] === "Make post slideshow" || slideshowTitles[index] === "Make trip slideshow") {
                    console.log('Fetched', slideshows[index].imageBuffer.length, 'images for title:', postId);
                    document.getElementById('imagesLoadedCount').textContent = slideshows[index].imageBuffer.length;
                } else {
                    console.log('Fetched', slideshows[index].imageBuffer.length, 'images for title:', slideshowTitles[index]);
                    document.getElementById('imagesLoadedCount').textContent = slideshows[index].imageBuffer.length;
                }

                slideshows[index].shuffledImages = shuffleArray(slideshows[index].imageBuffer.slice(), index);
                buildSlides(index);
            }


        })
        .catch(error => {
            console.error('Error fetching data:', error);
            console.error('Error: Possible typo in the post title. Please check for any mistakes.');

            // In case of an error, hide the current slideshow container
            const wrapperDiv = document.getElementById(`slideShow-${index}`);
            if (wrapperDiv) {
                wrapperDiv.style.display = 'none'; // Hide the slideshow div
            }
        });
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


/**
 * @brief   Shuffles an array of images or modifies the array based on slideshow type.
 *
 * @details This function shuffles an array of images using the Fisher-Yates algorithm if the slideshow is of type "All pictures". 
 *          For other slideshow types, it sets the first element of the array to a predefined image (`endImage`) and removes the 
 *          cover photo from the first index.
 *
 * @param   array  The array to be shuffled or modified.
 * @param   index  The index of the slideshow, used to determine the slideshow type.
 *
 * @return  Returns the shuffled or modified array.
 */
function shuffleArray(array, index) {
    const randomizeImages = localStorage.getItem('randomizeImages') === 'true';

    if (slideshowTitles[index] === "All pictures") {
        if (randomizeImages) {
            // Fisher–Yates shuffle
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        } else {
            // Reverse so oldest comes first
            // array.reverse();
        }
    }
    return array;
}


function buildSlides(index) {

    // Initialize all slides
    initializeSlides(index);
}


/**
 * @brief   Initializes slides by preloading images and setting their content.
 *
 * @details Iterates through the slide containers of the specified slideshow index, 
 *          preloads images, and updates image sources, captions, and related content 
 *          based on the shuffled image data.
 *
 * @param   index Index of the slideshow whose slides are to be initialized.
 */
function initializeSlides(index) {
    const galleryContainer = document.getElementById(`slideshowContainer-${index}`);
    if (!galleryContainer) return;

    // Clear any previous slides
    galleryContainer.innerHTML = '';

    // Add all images from shuffledImages array
    slideshows[index].shuffledImages.forEach((imageObj, i) => {
        if (imageObj && imageObj.src) {
  

            // Create gallery item div
            const itemDiv = document.createElement('div');
            itemDiv.className = 'gallery-item';
            itemDiv.innerHTML = `
                <img src="${imageObj.src}" alt="${imageObj.caption || 'Image'}" />
                <div class="photo-overlay">
                    <span class="photo-title">${imageObj.caption || ''}</span>
                </div>
            `;

            galleryContainer.appendChild(itemDiv);
        }
    });
}


/**
 * @brief   Processes a blog entry and extracts images and captions for the slideshow.
 *
 * @details This function parses the content of a blog entry, extracts image sources and captions, and stores them 
 *          in the `imageBuffer`. It also adjusts the image sizes based on the dimensions of the slideshow container.
 *          Images with a `data-skip` attribute greater than the current photo slider value are skipped. The images are 
 *          resized according to the larger dimension of the container (width or height) and added to the slideshow buffer 
 *          along with the associated caption and post title.
 *
 * @param   index   The index of the slideshow to process.
 * @param   entry   The blog entry object containing content and metadata.
 */
function processEntry(index, entry) {
    const content = entry.content.$t;
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(content, 'text/html');
    const images = htmlDoc.getElementsByTagName('img');
    const postTitle = entry.title.$t;
    const captions = getCaptions(htmlDoc);

    // Get the width and height of the slideshow container in pixels
    const containerWidth = slideshowContainer[index].offsetWidth; // Detects the width in pixels
    const containerHeight = slideshowContainer[index].offsetHeight; // Detects the height in pixels

    // Assign the bigger value to determine size
    const containerSize = Math.max(containerWidth, containerHeight); // Determine the larger value

    // Loop through the images and process their `data-skip` attribute
    for (let i = 1; i < images.length; i++) { // Start with 1 - do not include cover photo
        // Check if the image has a data-skip attribute with a value greater than value saved in initPhotos
        const PhotosRange = localStorage.getItem('photosSliderValue') || initPhotos; // Default value if not set
        // Extract the `data-skip` attribute content
        let dataSkip = images[i].getAttribute('data-skip');

        // Assign a default value to `data-skip` if undefined or "NA"
        if (dataSkip === "NA" || dataSkip === null || dataSkip === undefined) {
            dataSkip = "3"; // Assign a default value
        }

        // Replace "best" with "0" in the `data-skip` values
        dataSkip = dataSkip.replace(/best/g, "0");

        // Replace "cover" with "-1" in the `data-skip` values
        dataSkip = dataSkip.replace(/cover/g, "-1");

        // Replace "peak" with "-2" in the `data-skip` values
        dataSkip = dataSkip.replace(/peak/g, "-2");

        // Split `data-skip` values by semicolon
        const dataSkipValues = dataSkip.split(";");

        // Check if any value in `data-skip` matches or is within the PhotosRange
        const isWithinRange = dataSkipValues.some(value => {
            if (!isNaN(value)) {
                const numericValue = parseFloat(value); // Parse each value to a number

                // Exclude -2 (peaks) only if it is the ONLY value in dataSkipValues
                if (numericValue === -2) {
                    return false;
                }

                // For other ranges, check if the value is within the range
                return numericValue <= PhotosRange;
            }
            return false; // Non-numeric values are ignored
        });

        // Perform the desired action based on the range check
        if (isWithinRange) {
            // Replace image size with WebP-enabled format using -rw
            let imgSrc = images[i].getAttribute('src')
                .replace(/\/s\d+(-rw)?\/|\/w\d+-h\d+\//, `/s${containerSize}-rw/`);
            
            const caption = captions[i] || '';
            slideshows[index].imageBuffer.push({ src: imgSrc, caption, title: postTitle });
        }
    }        
}


/**
     * @brief   Extracts captions for images from the HTML document.
     *
     * @details This function processes an HTML document, finds all images, and attempts to associate captions with 
     *          each image. Captions are stored in elements with the class `tr-caption`, and the function matches each
     *          caption to the corresponding image based on their order in the document. If no caption is found for an 
     *          image, an empty string is assigned. The function returns an array of captions corresponding to the images.
     *
     * @param   htmlDoc   The HTML document object to extract captions from.
     *
     * @return  An array of captions, where each element corresponds to a caption for an image.
     */
function getCaptions(htmlDoc) {
    const images = htmlDoc.getElementsByTagName('img');
    const captionElements = htmlDoc.getElementsByClassName('tr-caption');
    const captions = [];
    let captionIndex = 0;

    for (let i = 0; i < images.length; i++) {
        let caption = '';
        while (captionIndex < captionElements.length) {
            const currentCaptionElement = captionElements[captionIndex];
            const nextImageElement = images[i + 1];
            if (!nextImageElement || currentCaptionElement.compareDocumentPosition(nextImageElement) & Node.DOCUMENT_POSITION_FOLLOWING) {
                caption = currentCaptionElement.textContent.trim();
                captionIndex++;
                break;
            }
            break;
        }
        captions.push(caption);
    }
    return captions;
}


/*######### Event listeners functions  #########*/

// Onload event
window.addEventListener('load', function () {
    numberOfSlideshows.forEach(index => {
        fetchData(index);
    });
});


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
