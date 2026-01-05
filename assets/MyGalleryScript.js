let randomizeImages = true; // default ON

const gallery = { imageBuffer: [], shuffledImages: [] };
const galleryContainer = document.getElementById('galleryContainer');

/* --------------------- LRU CACHE --------------------- */
class LRUCacheBySize {
    constructor(maxSize) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.currentSize = 0;
    }
    set(key, value, size) {
        if (typeof size !== "number" || isNaN(size)) return;
        if (this.cache.has(key)) {
            this.currentSize -= this.cache.get(key).size;
            this.cache.delete(key);
        }
        while (this.currentSize + size > this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            this.currentSize -= this.cache.get(oldestKey).size;
            this.cache.delete(oldestKey);
        }
        this.cache.set(key, { value, size });
        this.currentSize += size;
    }
    get(key) {
        if (!this.cache.has(key)) return null;
        const item = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, item);
        return item.value;
    }
    has(key) { return this.cache.has(key); }
    delete(key) {
        if (this.cache.has(key)) {
            this.currentSize -= this.cache.get(key).size;
            this.cache.delete(key);
        }
    }
    clear() {
        this.cache.clear();
        this.currentSize = 0;
    }
}
const imageCache = new LRUCacheBySize(50 * 1024 * 1024);


/* --------------------- FETCHING DATA --------------------- */
function fetchData() {
    const feedUrl = `${WindowBaseUrl}/data/all-posts.json`;

    fetch(feedUrl)
        .then(res => res.json())
        .then(async data => {
            let entries = data.entry || data.feed?.entry;
            if (entries && !Array.isArray(entries)) entries = [entries];

            if (!entries?.length) {
                document.getElementById('imagesLoadedCount').textContent = gallery.imageBuffer.length;
                return;
            }

            const startDate = localStorage.getItem('startDateRange');
            const endDate = localStorage.getItem('endDateRange');
            const selectedLabels = JSON.parse(localStorage.getItem('selectedLabels') || '{}');

            entries = entries.filter(entry => {
                const entryDate = new Date(entry.published?.$t || entry.published);
                if (startDate && entryDate < new Date(startDate)) return false;
                if (endDate && entryDate > new Date(endDate)) return false;
                if (Object.keys(selectedLabels).length) {
                    const entryLabels = (entry.category || []).map(cat => cat.term.replace(/^\d+\.\s*/, ''));
                    for (const group in selectedLabels) {
                        if (!selectedLabels[group].some(label => entryLabels.includes(label))) return false;
                    }
                }
                return true;
            });

            entries.forEach(entry => processEntry(entry));
            const imgCount = gallery.imageBuffer.length;
            document.getElementById('imagesLoadedCount').textContent = imgCount;

            if (!imgCount) {
                if (galleryContainer)
                    galleryContainer.innerHTML =
                        `<p style="text-align:center; font-size:18px; padding:20px;">Ni slik za izbrane filtre</p>`;
                return;
            }

            gallery.shuffledImages = shuffleArray(gallery.imageBuffer.slice());
            initLazyGallery(); // start lazy loading
        })
        .catch(err => {
            console.error('Error fetching data:', err);
            if (galleryContainer) galleryContainer.style.display = 'none';
        });
}

/* --------------------- LAZY GALLERY --------------------- */
let lazyIndex = 0;
const batchSize = 12;
let loadingInProgress = false;
let allLoaded = false;

function initLazyGallery() {
    if (!galleryContainer) return;

    galleryContainer.innerHTML = '';
    lazyIndex = 0;
    loadingInProgress = false;
    allLoaded = false;

    // Load first batch immediately
    loadNextBatch();

    // Attach scroll listener
    window.removeEventListener('scroll', onScrollLoad);
    window.addEventListener('scroll', onScrollLoad, { passive: true });
}

function onScrollLoad() {
    if (loadingInProgress || allLoaded) return;

    const scrollPosition = window.innerHeight + window.scrollY;
    const bottomThreshold = document.documentElement.scrollHeight - 800;

    if (scrollPosition >= bottomThreshold) {
        loadNextBatch();
    }
}

async function loadNextBatch() {
    if (loadingInProgress) return;
    if (lazyIndex >= gallery.shuffledImages.length) {
        allLoaded = true;
        window.removeEventListener('scroll', onScrollLoad);
        return;
    }

    loadingInProgress = true;

    const nextBatch = gallery.shuffledImages.slice(lazyIndex, lazyIndex + batchSize);
    lazyIndex += batchSize;

    await buildGalleryBatch(nextBatch);

    loadingInProgress = false;

    // Safety: if user is already near bottom after loading, continue
    requestAnimationFrame(() => {
        onScrollLoad();
    });
}


/* --------------------- BUILD GALLERY BATCH (with placeholders) --------------------- */
async function buildGalleryBatch(imagesBatch) {
    const gap = 8;
    const containerWidth = galleryContainer.clientWidth || window.innerWidth - 40;
    const imagesPerRowEstimate = Math.max(2, Math.floor(containerWidth / 300));

    let idx = 0;
    while (idx < imagesBatch.length) {
        const batch = imagesBatch.slice(idx, idx + imagesPerRowEstimate);
        idx += imagesPerRowEstimate;

        // --- Estimate row height upfront for placeholders ---
        const estRowHeight = (containerWidth - gap * (batch.length - 1)) / (batch.length * 1.5); // average 1.5 ratio

        // --- Create placeholder row immediately ---
        const placeholderRow = document.createElement('div');
        placeholderRow.className = 'row placeholder-row';
        placeholderRow.style.display = 'flex';
        placeholderRow.style.justifyContent = 'center';
        placeholderRow.style.alignItems = 'center';
        placeholderRow.style.width = '100%';
        placeholderRow.style.height = '80px';

        const ph = document.createElement('div');
        ph.className = 'gallery-item placeholder';
        ph.style.fontSize = '22px';
        ph.style.fontWeight = '700';
        ph.style.color = 'rgba(0, 0, 0, 0.5)';
        ph.style.textAlign = 'center';
        ph.style.width = '100%';
        ph.textContent = 'Nalaganje več slik...';

        placeholderRow.appendChild(ph);
        galleryContainer.appendChild(placeholderRow);

        // --- Load actual images for this batch ---
        const loadedBatch = await Promise.all(batch.map(imgData =>
            new Promise(resolve => {
                const cachedSrc = imageCache.get(imgData.src) || imgData.src;
                const img = new Image();
                img.src = cachedSrc;
                img.onload = () => {
                    if (!imageCache.has(imgData.src)) imageCache.set(imgData.src, imgData.src, estimateImageSize(imgData.src));
                    resolve({ ...imgData, ratio: img.width / img.height });
                };
                img.onerror = () => resolve(null);
            })
        ));

        const validImages = loadedBatch.filter(Boolean);
        if (!validImages.length) {
            placeholderRow.remove();
            continue;
        }

        // --- Replace placeholder with real row ---
        const rowRatioSum = validImages.reduce((sum, img) => sum + img.ratio, 0);
        const rowHeight = (containerWidth - gap * (validImages.length - 1)) / rowRatioSum;

        const rowDiv = document.createElement('div');
        rowDiv.className = 'row';
        rowDiv.style.display = 'flex';
        rowDiv.style.gap = gap + 'px';
        rowDiv.style.opacity = '0';
        rowDiv.style.transition = 'opacity 0.5s ease';

        validImages.forEach((item, i) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'gallery-item';
            itemDiv.style.width = item.ratio * rowHeight + 'px';
            itemDiv.style.height = rowHeight + 'px';
            itemDiv.style.position = 'relative';
            itemDiv.style.overflow = 'hidden';
            itemDiv.style.opacity = '0';                  // start invisible
            itemDiv.style.transition = 'opacity 0.5s ease';
            itemDiv.style.transitionDelay = `${i * 0.05}s`; // staggered fade-in


            // Create <a> wrapper for lightbox
            const linkEl = document.createElement('a');
            linkEl.href = imageCache.get(item.src) || item.src; // full-size image
            linkEl.setAttribute('data-lightbox', 'Gallery');
            linkEl.setAttribute('data-title', item.caption || '');

            const imgEl = document.createElement('img');
            imgEl.src = imageCache.get(item.src) || item.src;

            // --- ALT TAG LOGIC ---
            let altText = '';
            const tag = (item.tag || '').toLowerCase();
            const hasCaption = !!item.caption;

            if (["cover", "peak", "best", "1", "2"].some(k => tag.includes(k))) {
                altText = hasCaption ? `${item.title} – ${item.caption}` : item.title;
            } else if (tag.includes("3")) {
                altText = "";
            } else {
                altText = hasCaption ? item.caption : item.title || "";
            }

            imgEl.alt = altText;
            // --- END ALT LOGIC ---

            imgEl.loading = 'lazy';
            imgEl.style.width = '100%';
            imgEl.style.height = '100%';
            imgEl.style.objectFit = 'cover';

            const captionDiv = document.createElement('div');
            captionDiv.className = 'caption';
            captionDiv.textContent = item.caption || '';

            linkEl.appendChild(imgEl);       // image inside <a>
            itemDiv.appendChild(linkEl);     // wrap <a> inside gallery item
            itemDiv.appendChild(captionDiv); // optional caption overlay
            rowDiv.appendChild(itemDiv);

            // fade in each image
            requestAnimationFrame(() => {
                itemDiv.style.opacity = '1';
            });
        });

        // Smooth replace: swap placeholders → real row
        placeholderRow.replaceWith(rowDiv);

        // fade in the whole row smoothly
        requestAnimationFrame(() => (rowDiv.style.opacity = '1'));
    }
}

/* --------------------- UTILS --------------------- */
function shuffleArray(array) {
    const randomize = localStorage.getItem('randomizeImages') !== null
        ? localStorage.getItem('randomizeImages') === 'true'
        : randomizeImages; // fallback to default global
    if (randomize) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    return array;
}

function processEntry(entry) {
    const htmlDoc = new DOMParser().parseFromString(entry.content.$t, 'text/html');
    const images = htmlDoc.getElementsByTagName('img');
    const captions = getCaptions(htmlDoc);
    const postTitle = entry.title.$t;
    const containerSize = Math.max(galleryContainer.offsetWidth, galleryContainer.offsetHeight);
    const PhotosRange = localStorage.getItem('photosSliderValue') || initPhotos;

    for (let i = 1; i < images.length; i++) {
        let dataSkip = images[i].getAttribute('data-skip') || "3";
        dataSkip = dataSkip.replace(/best/g, "0").replace(/cover/g, "-1").replace(/peak/g, "-2");
        const dataSkipValues = dataSkip.split(";");

        const isWithinRange = dataSkipValues.some(val => {
            const n = parseFloat(val);
            return !isNaN(n) && n !== -2 && n <= PhotosRange;
        });

        if (isWithinRange) {
            const imgSrc = images[i].src.replace(/\/s\d+(-rw)?\/|\/w\d+-h\d+\//, `/s${containerSize}-rw/`);
            gallery.imageBuffer.push({
                src: imgSrc,
                caption: captions[i] || '',
                title: postTitle,
                tag: (images[i].getAttribute('data-skip') || '').toLowerCase() // 👈 save original data-skip tag
            });
        }
    }
}

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

// Simple size estimation for cache (in bytes)
function estimateImageSize(url) {
    return 500 * 1024; // 500 KB estimate
}

/* --------------------- ONLOAD --------------------- */
window.addEventListener('load', fetchData);
document.addEventListener('DOMContentLoaded', () => {
    initializePersistentSlider('photosSliderElement', 'photosValueElement', 'photosSliderValue');
    initializePersistentToggle('toggleRandomButton', 'randomizeImages');
    initializePersistentDateRange('startDateInput', 'endDateInput', 'startDateRange', 'endDateRange');
    restoreCollapseState();
    initializePersistentLabelFilter();
    setupClearFiltersButton();
});
