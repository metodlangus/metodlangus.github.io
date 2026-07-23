/**
 * MyLightboxModule — a self-contained, drop-in lightbox for any page.
 *
 * Include this script once on a page and initialize it from your central
 * DOMContentLoaded block with:
 *
 *   MyLightboxModule.init(window.MySiteConfig?.lightbox || {});
 *
 * CONFIG example:
 *
 * window.MySiteConfig = {
 *     lightbox: {
 *         useLightbox: true,
 *         selector: 'img',
 *         container: null,
 *         exclude: '[data-no-lightbox], .no-lightbox',
 *         preloadConcurrency: 6,
 *         perfSlowMs: 200,
 *         perfVerySlowMs: 500
 *     }
 * };
 *
 * USAGE:
 *   Mark each image you want in the lightbox with data-lightbox attribute
 *   — either on the <img> itself or on a wrapping <a>:
 *
 *       <a href="full.jpg" data-lightbox="Gallery" data-title="...">
 *           <img src="thumb.jpg" alt="...">
 *       </a>
 *
 * PROGRAMMATIC API:
 *   MyLightboxModule.init(config)
 *   MyLightboxModule.open(list, startIndex)
 *   MyLightboxModule.close()
 *   MyLightboxModule.getConfig()
 *   MyLightboxModule.isEnabled()
 */

const MyLightboxModule = (() => {
    'use strict';

    const defaultExclude = '[data-no-lightbox], .no-lightbox, .my-lightbox-backdrop';

    const defaultOpts = {
        useLightbox: true,

        selector: 'img',
        exclude: defaultExclude,
        container: null,

        preloadConcurrency: 6,
        perfSlowMs: 200,
        perfVerySlowMs: 500
    };

    let opts = { ...defaultOpts };

    // Current lightbox image list + cursor.
    let images = [];
    let lbIndex = null;

    // Monotonic token bumped on every show()/close() so a stale async load
    // cannot write into the current one.
    let showSeq = 0;

    // DOM refs.
    let backdrop, wrapper, box, imgEl, overlay, prevBtn, nextBtn,
        footer, counter, preloadAllBtn, closeBtn, captionEl;

    // Preload cache: src -> {width, height}
    const dimCache = new Map();
    const inflight = new Map();

    let delegationAttached = false;
    let initHasRun = false;

    // Buffer-health indicator
    let avgImageLoadTime = 0.25;     // seconds (EMA)
    let pendingRequests = 0;

    let perfState = "neutral";       // neutral | yellow | orange | red

    function ensure() {
        if (backdrop) return;

        backdrop = document.createElement('div');
        backdrop.className = 'my-lightbox-backdrop';

        wrapper = document.createElement('div');
        wrapper.className = 'my-lightbox-wrapper';

        box = document.createElement('div');
        box.className = 'my-lightbox-box';

        imgEl = document.createElement('img');
        imgEl.alt = '';
        box.appendChild(imgEl);

        // Clickable overlay zones: prev / neutral / next
        overlay = document.createElement('div');
        overlay.className = 'my-lightbox-overlay';

        const opPrev = document.createElement('div');
        opPrev.className = 'op-prev';
        opPrev.addEventListener('click', prevImage);

        const opMid = document.createElement('div');
        opMid.className = 'op-mid';

        const opNext = document.createElement('div');
        opNext.className = 'op-next';
        opNext.addEventListener('click', nextImage);

        overlay.appendChild(opPrev);
        overlay.appendChild(opMid);
        overlay.appendChild(opNext);
        box.appendChild(overlay);

        // Prev button
        prevBtn = document.createElement('button');
        prevBtn.type = 'button';
        prevBtn.className = 'my-lightbox-nav prev';
        prevBtn.setAttribute('aria-label', 'Prejšnja');
        prevBtn.innerHTML =
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" ' +
            'stroke-linecap="round" stroke-linejoin="round">' +
            '<polyline points="15 18 9 12 15 6"/>' +
            '</svg>';
        prevBtn.addEventListener('click', prevImage);

        // Next button
        nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.className = 'my-lightbox-nav next';
        nextBtn.setAttribute('aria-label', 'Naprej');
        nextBtn.innerHTML =
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" ' +
            'stroke-linecap="round" stroke-linejoin="round">' +
            '<polyline points="9 18 15 12 9 6"/>' +
            '</svg>';
        nextBtn.addEventListener('click', nextImage);

        box.appendChild(prevBtn);
        box.appendChild(nextBtn);

        // Footer: counter + preload all button
        footer = document.createElement('div');
        footer.className = 'my-lightbox-footer';

        counter = document.createElement('div');
        counter.className = 'my-lightbox-counter';

        preloadAllBtn = document.createElement('button');
        preloadAllBtn.type = 'button';
        preloadAllBtn.className = 'my-lightbox-preloadall';
        preloadAllBtn.textContent = 'Prednaloži slike';
        preloadAllBtn.addEventListener('click', preloadAllImages);

        footer.appendChild(counter);
        footer.appendChild(preloadAllBtn);

        // Close button
        closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'my-lightbox-close';
        closeBtn.setAttribute('aria-label', 'Zapri');
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', close);

        // Caption
        captionEl = document.createElement('div');
        captionEl.className = 'my-lightbox-caption';
        box.appendChild(captionEl);

        wrapper.appendChild(box);
        wrapper.appendChild(footer);

        backdrop.appendChild(wrapper);
        backdrop.appendChild(closeBtn);

        document.body.appendChild(backdrop);

        // Clicking backdrop itself closes lightbox
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) close();
        });

        document.addEventListener('keydown', (e) => {
            if (lbIndex === null) return;

            if (e.key === 'Escape') {
                close();
            } else if (e.key === 'ArrowRight') {
                nextImage();
            } else if (e.key === 'ArrowLeft') {
                prevImage();
            }
        });

        // Re-fit box on resize
        window.addEventListener('resize', () => {
            if (lbIndex === null) return;

            const entry = images[lbIndex];
            if (!entry) return;

            const dim = dimCache.get(entry.src);
            if (dim) fitBox(dim.width, dim.height);
        });
    }

    function fitBox(naturalWidth, naturalHeight) {
        if (!naturalWidth || !naturalHeight) return;

        let footerSpace = 0;

        if (footer) {
            const footerStyle = window.getComputedStyle(footer);
            footerSpace = footer.offsetHeight + parseFloat(footerStyle.marginTop || 0);
        }

        const maxW = window.innerWidth * 0.97;
        const maxH = Math.max(50, (window.innerHeight * 0.97) - footerSpace);

        const ratio = naturalWidth / naturalHeight;

        let w = maxH * ratio;
        let h = maxH;

        if (w > maxW) {
            w = maxW;
            h = maxW / ratio;
        }

        box.style.width = `${Math.round(w)}px`;
        box.style.height = `${Math.round(h)}px`;
    }

    function updateCounter() {
        if (!counter || lbIndex === null) return;
        counter.textContent = `${lbIndex + 1} od ${images.length}`;
    }

    function updatePerfState() {

        const estimatedWait = pendingRequests * avgImageLoadTime;

        let newState;

        if (estimatedWait < 0.3)
            newState = "neutral";
        else if (estimatedWait < 1)
            newState = "yellow";
        else if (estimatedWait < 2)
            newState = "orange";
        else
            newState = "red";

        // Apply immediately — same as showConnectionError's direct switch.
        if (newState !== perfState) {
            perfState = newState;
            updatePerfButton();
        }

        // Auto-recover to neutral 2s after the last activity, mirroring
        // showConnectionError's connectionErrorTimeout auto-hide behavior.
        clearTimeout(updatePerfState.recoveryTimer);
        updatePerfState.recoveryTimer = setTimeout(() => {
            if (perfState !== "neutral") {
                perfState = "neutral";
                updatePerfButton();
            }
        }, 2000);
    }

    function updatePerfButton() {

        if (!preloadAllBtn)
            return;

        preloadAllBtn.classList.remove(
            "buffer-neutral",
            "buffer-yellow",
            "buffer-orange",
            "buffer-red"
        );

        preloadAllBtn.classList.add("buffer-" + perfState);

        switch (perfState) {

            case "neutral":
                preloadAllBtn.textContent = "Prednaloži slike";
                break;

            case "yellow":
                preloadAllBtn.textContent = "Prednaloži slike";
                break;

            case "orange":
                preloadAllBtn.textContent = "Prednaloži slike";
                break;

            case "red":
                preloadAllBtn.textContent = "Prednaloži slike";
                break;
        }
    }

    function preload(src) {
        pendingRequests++;
        updatePerfState();

        const requestStart = performance.now();

        if (!src) {
            pendingRequests = Math.max(0, pendingRequests - 1);
            updatePerfState();
            return Promise.resolve(null);
        }

        const cached = dimCache.get(src);

        if (cached) {
            pendingRequests = Math.max(0, pendingRequests - 1);
            updatePerfState();
            return Promise.resolve(cached);
        }

        const infl = inflight.get(src);
            if (infl) {
                pendingRequests = Math.max(0, pendingRequests - 1);
                updatePerfState();
                return infl;
            }

        const p = new Promise(resolve => {
            const im = new Image();

            im.onload = () => {
                const d = {
                    width: im.naturalWidth,
                    height: im.naturalHeight
                };

                dimCache.set(src, d);
                inflight.delete(src);

                pendingRequests = Math.max(0, pendingRequests - 1);

                const loadTime =
                    (performance.now() - requestStart) / 1000;

                avgImageLoadTime =
                    avgImageLoadTime * 0.85 +
                    loadTime * 0.15;

                updatePerfState();

                resolve(d);
            };

            im.onerror = () => {
                inflight.delete(src);

                pendingRequests = Math.max(0, pendingRequests - 1);
                updatePerfState();

                resolve(null);
            };

            im.src = src;
        });

        inflight.set(src, p);
        return p;
    }

    async function preloadAllImages() {
        if (!images.length || !preloadAllBtn) return;

        preloadAllBtn.disabled = true;
        preloadAllBtn.style.color = "yellow";

        const total = images.length;
        let done = 0;

        preloadAllBtn.textContent = `Prednalagam 0/${total}`;

        const CONCURRENCY = opts.preloadConcurrency || 6;
        let cursor = 0;

        async function worker() {
            while (cursor < total) {
                const i = cursor++;
                await preload(images[i] && images[i].src);

                done++;
                preloadAllBtn.textContent = `Prednalagam ${done}/${total}`;
            }
        }

        await Promise.all(Array.from({ length: CONCURRENCY }, worker));

        preloadAllBtn.textContent = "Prednaloženo ✔";
        preloadAllBtn.style.color = "limegreen";
        preloadAllBtn.disabled = false;
    }

    async function show(idx, isInitial) {
        const entry = images[idx];

        if (!entry) return;

        lbIndex = idx;
        const seq = ++showSeq;

        let dim = dimCache.get(entry.src);
        if (!dim) dim = await preload(entry.src);

        if (seq !== showSeq || lbIndex !== idx) return;

        if (dim && dim.width && dim.height) {
            fitBox(dim.width, dim.height);
        }

        await new Promise(resolve => {
            imgEl.onload = resolve;
            imgEl.onerror = resolve;
            imgEl.src = entry.src;
        });
        imgEl.alt = entry.alt || '';

        updateCounter();

        if (captionEl) {
            captionEl.textContent = entry.alt || '';
        }

        if (isInitial) {
            box.style.visibility = '';
        }

        const total = images.length;

        if (total > 1) {
            preload(images[(idx + 1) % total].src);
            preload(images[(idx - 1 + total) % total].src);
        }
    }

    function setChromeVisibility() {
        const single = images.length <= 1;

        prevBtn.style.display = single ? 'none' : '';
        nextBtn.style.display = single ? 'none' : '';
        overlay.style.display = single ? 'none' : '';
        preloadAllBtn.style.display = single ? 'none' : '';
    }

    function open(list, startIndex) {
        if (!opts.useLightbox) return;
        if (!list) return;

        let arr;

        if (Array.isArray(list)) {
            arr = list;
        } else if (list && typeof list[Symbol.iterator] === 'function') {
            arr = Array.from(list);
        } else if (list && list.tagName === 'IMG') {
            arr = [list];
        } else {
            return;
        }

        images = arr.map(normalize).filter(it => it && it.src);

        if (!images.length) return;

        const idx = Math.max(0, Math.min(startIndex || 0, images.length - 1));

        ensure();
        setChromeVisibility();

        box.style.visibility = 'hidden';
        backdrop.classList.add('open');
        document.body.classList.add('my-lightbox-open');

        show(idx, true);
    }

    function close() {
        if (lbIndex === null) return;

        lbIndex = null;
        showSeq++;

        if (backdrop) backdrop.classList.remove('open');

        document.body.classList.remove('my-lightbox-open');

        if (box) {
            box.style.width = '';
            box.style.height = '';
        }
    }

    async function nextImage() {
        if (lbIndex === null) return;

        await show((lbIndex + 1) % images.length, false);

    }

    async function prevImage() {
        if (lbIndex === null) return;

        await show((lbIndex - 1 + images.length) % images.length, false);
    }

    /* --------------------- image discovery / auto-binding --------------------- */

    function isImageUrl(url) {
        return /\.(jpe?g|png|gif|webp|bmp|svg|avif|ico)(\?|#|$)/i.test(url || '');
    }

    function isExcluded(im) {
        return !!im.closest(opts.exclude);
    }

    function candidateSrc(im) {
        const anchor = im.closest('a');

        if (anchor && anchor.href && isImageUrl(anchor.href)) {
            return anchor.href;
        }

        return im.getAttribute('data-lightbox-src')
            || im.getAttribute('data-full')
            || im.getAttribute('data-original')
            || im.getAttribute('data-src')
            || im.currentSrc
            || im.src;
    }

    function resolveImage(im) {
        const anchor = im.closest('a');
        const alt = altOf(im, anchor);

        return {
            src: candidateSrc(im),
            alt,
            _el: im
        };
    }

    function altOf(im, anchor) {
        // 1. Explicit caption on <img>
        const dataCaption = im.getAttribute('data-caption');

        if (dataCaption && dataCaption.trim()) {
            return dataCaption.trim();
        }

        // 2. Caption on <a>
        if (anchor) {
            const title = anchor.getAttribute('data-title');

            if (title && title.trim()) {
                return title.trim();
            }
        }

        // 3. Blogger-style table caption
        const captionCell = im.closest('table.tr-caption-container')
            ?.querySelector('td.tr-caption');

        if (captionCell && captionCell.textContent.trim()) {
            return captionCell.textContent.trim();
        }

        // 4. Do not use alt text
        return '';
    }

    function groupOf(im) {
        if (isExcluded(im)) return null;
        if (!candidateSrc(im)) return null;

        const owner = im.hasAttribute('data-lightbox')
            ? im
            : im.closest('[data-lightbox]');

        if (!owner) return null;

        return owner.getAttribute('data-lightbox') || '__nogroup__';
    }

    function collectImages(group) {
        const root = opts.container
            ? document.querySelector(opts.container)
            : document;

        if (!root) return [];

        const imgs = Array.from(root.querySelectorAll(opts.selector));
        const out = [];

        for (const im of imgs) {
            const g = groupOf(im);

            if (g !== group) continue;

            const resolved = resolveImage(im);
            out.push(resolved);
        }

        return out;
    }

    function onClick(e) {
        if (!opts.useLightbox) return;
        if (lbIndex !== null) return;

        let clickedImg = null;

        if (e.target.tagName === 'IMG') {
            clickedImg = e.target;
        } else if (e.target.tagName === 'PICTURE') {
            clickedImg = e.target.querySelector('img');
        } else {
            clickedImg = e.target.closest('picture')?.querySelector('img');
        }

        if (!clickedImg || !clickedImg.matches(opts.selector)) return;

        const group = groupOf(clickedImg);
        if (group === null) return;

        const list = collectImages(group);
        const idx = list.findIndex(it => it._el === clickedImg);

        if (idx === -1) return;

        const anchor = clickedImg.closest('a');

        if (anchor) {
            e.preventDefault();
        }

        open(list, idx);
    }

    function attachDelegation() {
        if (delegationAttached) return;

        delegationAttached = true;
        document.addEventListener('click', onClick);
    }

    function detachDelegation() {
        if (!delegationAttached) return;

        delegationAttached = false;
        document.removeEventListener('click', onClick);
    }

    function normalize(it) {
        if (!it) return null;

        if (typeof it === 'string') {
            return {
                src: it,
                alt: ''
            };
        }

        if (it.tagName === 'IMG') {
            const r = resolveImage(it);

            return {
                src: r.src,
                alt: r.alt
            };
        }

        if (it.src) {
            return {
                src: it.src,
                alt: it.alt || it.caption || it.title || ''
            };
        }

        return null;
    }

    function buildExcludeSelector(configExclude) {
        if (!configExclude || configExclude === defaultExclude) {
            return defaultExclude;
        }

        return `${defaultExclude}, ${configExclude}`;
    }

    function init(config) {
        initHasRun = true;

        opts = {
            ...defaultOpts,
            ...(config || {})
        };

        opts.exclude = buildExcludeSelector(opts.exclude);

        if (opts.useLightbox === false) {
            close();
            detachDelegation();

            console.log("MyLightboxModule disabled by config.");

            return false;
        }

        attachDelegation();

        console.log("MyLightboxModule initialized:", opts);

        return true;
    }

    function getConfig() {
        return { ...opts };
    }

    function isEnabled() {
        return opts.useLightbox !== false && delegationAttached;
    }

    return {
        init,
        open,
        close,
        getConfig,
        isEnabled
    };
})();

window.MyLightboxModule = MyLightboxModule;