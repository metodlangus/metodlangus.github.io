let randomizeImages = true; // default ON
let slideshowIndex = 0;
const slideshowTitles = [];
const numberOfSlideshows = [];
const slideshows = [];
const slideshowContainer = [];

const defaultImgSrc = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiU8RYSJ0I45O63GlKYXw5-U_r7GwP48_st9F1LG7_Z3STuILVQxMO4qLgzP_wxg0v_77s-YwidwwZQIDS1K6SUmY-W3QMwcIyEvt28cLalvCVQu4qWTQIm-B_FvgEmCCe6ydGld4fQgMMd2xNdqMMFtuHgeVXB4gRPco3XP90OOKHpf6HyZ6AeEZqNJQo/s1600/IMG20241101141924.jpg";

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

/* --------------------- SLIDESHOW CREATION --------------------- */
generateSlideshowContainers(defaultImgSrc);

function generateSlideshowContainers(defaultImgSrc) {
    while (typeof window[`slideshowTitle${slideshowIndex}`] !== 'undefined') {
        const SlideshowTitle = window[`slideshowTitle${slideshowIndex}`];
        const coverPhoto = window[`CoverPhoto${slideshowIndex}`] || defaultImgSrc;
        slideshowTitles.push(SlideshowTitle);
        insertSlideshowContainer(SlideshowTitle, coverPhoto, slideshowIndex);
        slideshowIndex++;
    }
    initializeSlideshows(numberOfSlideshows, defaultImgSrc);
}

function insertSlideshowContainer(slideshowTitle, coverPhoto, index) {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.id = `slideShow-${index}`;
    wrapperDiv.className = 'my-slideshow-wrapper';
    wrapperDiv.innerHTML = `
        <h2 class="gallery-title">${slideshowTitle}</h2>
        <div class="gallery-container" id="slideshowContainer-${index}">
            <div class="gallery-item cover-photo">
                <img alt="Cover Photo" src="${coverPhoto}" id="coverPhotoElement-${index}" />
                <div class="photo-overlay"><span class="photo-title">${slideshowTitle}</span></div>
            </div>
        </div>`;

    const scriptTags = document.getElementsByTagName('script');
    for (let script of scriptTags) {
        if (script.innerText.includes(`var slideshowTitle${index}`)) {
            script.parentNode.insertBefore(wrapperDiv, script.nextSibling);
            numberOfSlideshows.push(index);
            break;
        }
    }
}

function initializeSlideshows(numberOfSlideshows) {
    numberOfSlideshows.forEach(index => {
        slideshows[index] = { imageBuffer: [], shuffledImages: [] };
        slideshowContainer.push(document.getElementById(`slideshowContainer-${index}`));
    });
}

/* --------------------- FETCHING DATA --------------------- */
function fetchData(index) {
    let feedUrl;
    const title = slideshowTitles[index];

    if (title === "All pictures") feedUrl = `${WindowBaseUrl}/data/all-posts.json`;
    else if (title === "Make post slideshow" || title === "Make trip slideshow")
        feedUrl = `${WindowBaseUrl}/data/posts/${postId}.json`;
    else feedUrl = `${WindowBaseUrl}/data/posts/${encodeURIComponent(title)}.json`;

    fetch(feedUrl)
        .then(res => res.json())
        .then(async data => {
            let entries = data.entry || data.feed?.entry;
            if (entries && !Array.isArray(entries)) entries = [entries];

            if (title === "All pictures") {
                if (!entries?.length) {
                    document.getElementById('imagesLoadedCount').textContent = slideshows[index].imageBuffer.length;
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

                entries.forEach(entry => processEntry(index, entry));
                const imgCount = slideshows[index].imageBuffer.length;

                if (!imgCount) {
                    document.getElementById(`slideShow-${index}`).innerHTML =
                        `<p style="text-align:center; font-size:18px; padding:20px;">Ni slik za izbrane filtre</p>`;
                    return;
                }
                document.getElementById('imagesLoadedCount').textContent = imgCount;
                slideshows[index].shuffledImages = shuffleArray(slideshows[index].imageBuffer.slice(), index);
                buildSlides(index);
                return;
            }

            for (const entry of entries) processEntry(index, entry);
            document.getElementById('imagesLoadedCount').textContent = slideshows[index].imageBuffer.length;
            slideshows[index].shuffledImages = shuffleArray(slideshows[index].imageBuffer.slice(), index);
            buildSlides(index);
        })
        .catch(err => {
            console.error('Error fetching data:', err);
            const wrapper = document.getElementById(`slideShow-${index}`);
            if (wrapper) wrapper.style.display = 'none';
        });
}

/* --------------------- BUILD GALLERY VIEW --------------------- */
function buildSlides(index) { initializeSlides(index); }

function initializeSlides(index) {
    const galleryContainer = document.getElementById(`slideshowContainer-${index}`);
    if (!galleryContainer) return;
    galleryContainer.innerHTML = '';

    slideshows[index].shuffledImages.forEach(img => {
        if (!img?.src) return;
        const itemDiv = document.createElement('div');
        itemDiv.className = 'gallery-item';
        itemDiv.innerHTML = `
            <img src="${img.src}" alt="${img.caption || 'Image'}" />
            <div class="photo-overlay"><span class="photo-title">${img.caption || ''}</span></div>`;
        galleryContainer.appendChild(itemDiv);
    });
}

/* --------------------- UTILS --------------------- */
function shuffleArray(array, index) {
    const randomizeImages = localStorage.getItem('randomizeImages') === 'true';
    if (slideshowTitles[index] === "All pictures" && randomizeImages) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    return array;
}

function processEntry(index, entry) {
    const htmlDoc = new DOMParser().parseFromString(entry.content.$t, 'text/html');
    const images = htmlDoc.getElementsByTagName('img');
    const captions = getCaptions(htmlDoc);
    const postTitle = entry.title.$t;
    const containerSize = Math.max(slideshowContainer[index].offsetWidth, slideshowContainer[index].offsetHeight);
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
            slideshows[index].imageBuffer.push({ src: imgSrc, caption: captions[i] || '', title: postTitle });
        }
    }
}

function getCaptions(htmlDoc) {
    const images = htmlDoc.getElementsByTagName('img');
    const captions = Array.from({ length: images.length }, () => '');
    const captionEls = htmlDoc.getElementsByClassName('tr-caption');
    Array.from(captionEls).forEach((c, i) => captions[i] = c.textContent.trim());
    return captions;
}

/* --------------------- FILTERS / TOGGLES --------------------- */
function initializePersistentToggle(buttonId, storageKey) {
    const button = document.getElementById(buttonId);
    if (!button) return;
    let state = localStorage.getItem(storageKey);
    state = (state === null) ? true : (state === 'true');
    button.textContent = state ? 'DA' : 'NE';
    button.addEventListener('click', () => {
        state = !state;
        localStorage.setItem(storageKey, state);
        button.textContent = state ? 'DA' : 'NE';
        setTimeout(() => location.reload(), 2000);
    });
}

function toggleRandomize() {
    randomizeImages = !randomizeImages;
    document.getElementById('toggleRandomButton').innerText = randomizeImages ? 'DA' : 'NE';
}

function initializePersistentDateRange(startId, endId, storageKeyStart, storageKeyEnd) {
    const start = document.getElementById(startId);
    const end = document.getElementById(endId);
    if (!start || !end) return;

    start.value = localStorage.getItem(storageKeyStart) || '';
    end.value = localStorage.getItem(storageKeyEnd) || '';

    [start, end].forEach(input => {
        input.addEventListener('change', () => {
            localStorage.setItem(storageKeyStart, start.value);
            localStorage.setItem(storageKeyEnd, end.value);
            setTimeout(() => location.reload(), 2000);
        });
    });
}

function initializePersistentLabelFilter() {
    const checkboxes = document.querySelectorAll('.label-filter-checkbox');
    if (!checkboxes.length) return;
    const saved = JSON.parse(localStorage.getItem('selectedLabels') || '{}');

    checkboxes.forEach(cb => {
        const prefix = cb.dataset.prefix;
        if (saved[prefix]?.includes(cb.value)) cb.checked = true;
        cb.addEventListener('change', () => {
            const selected = {};
            checkboxes.forEach(c => {
                if (c.checked) {
                    const p = c.dataset.prefix;
                    (selected[p] ||= []).push(c.value);
                }
            });
            localStorage.setItem('selectedLabels', JSON.stringify(selected));
            setTimeout(() => location.reload(), 2000);
        });
    });
}

function toggleSection(id, btn) {
    const el = document.getElementById(id);
    const icon = btn.querySelector('.arrow-icon');
    const isHidden = el.style.display === "none";
    el.style.display = isHidden ? "block" : "none";
    icon.textContent = isHidden ? "▼" : "▶";
    localStorage.setItem("collapse_" + id, isHidden ? "open" : "closed");
}

function restoreCollapseState() {
    document.querySelectorAll(".collapse-btn").forEach(btn => {
        const id = btn.getAttribute("onclick").match(/'(.*?)'/)[1];
        const state = localStorage.getItem("collapse_" + id);
        const el = document.getElementById(id);
        const icon = btn.querySelector(".arrow-icon");
        if (state === "open") {
            el.style.display = "block"; icon.textContent = "▼";
        } else {
            el.style.display = "none"; icon.textContent = "▶";
        }
    });
}

function setupClearFiltersButton() {
    const btn = document.getElementById('clear-filters-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
        document.querySelectorAll('.label-filter-checkbox').forEach(cb => cb.checked = false);
        ['selectedLabels', 'startDateRange', 'endDateRange'].forEach(k => localStorage.removeItem(k));
        setTimeout(() => location.reload(), 500);
    });
}

/* --------------------- SLIDER --------------------- */
function initializePersistentSlider(sliderId, valueDisplayId, storageKey) {
    const slider = document.getElementById(sliderId);
    const valueDisplay = document.getElementById(valueDisplayId);
    if (!slider || !valueDisplay) return;

    const titles = { "3": "Največ slik", "2": "Več slik", "1": "Malo slik", "0": "Najboljše" };
    const saved = localStorage.getItem(storageKey);
    const val = saved ?? initPhotos;
    slider.value = val;
    valueDisplay.textContent = titles[val] || val;

    slider.addEventListener('input', () => {
        localStorage.setItem(storageKey, slider.value);
        valueDisplay.textContent = titles[slider.value] || slider.value;
        setTimeout(() => location.reload(), 2000);
    });
}

/* --------------------- ONLOAD --------------------- */
window.addEventListener('load', () => numberOfSlideshows.forEach(fetchData));
document.addEventListener('DOMContentLoaded', () => {
    initializePersistentSlider('photosSliderElement', 'photosValueElement', 'photosSliderValue');
    initializePersistentToggle('toggleRandomButton', 'randomizeImages');
    initializePersistentDateRange('startDateInput', 'endDateInput', 'startDateRange', 'endDateRange');
    restoreCollapseState();
    initializePersistentLabelFilter();
    setupClearFiltersButton();
});
