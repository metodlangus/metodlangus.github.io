const FitTextModule = (() => {

    // Internal configuration (no external input)
    const containerSelector = '.quarter-404-page';
    const overlaySelector = '.message-overlay-404-page';
    const elementSelectors = 'h1, p, a';

    const maxFontSizes = {
        h1: 500,
        p: 500,
        a: 50
    };

    let container, overlay, elements;

    // Fit text to its parent container
    function fitTextToParent(element, parent) {
        let fontSize = 10;
        element.style.fontSize = fontSize + 'px';

        const parentWidth = parent.clientWidth;
        const parentHeight = parent.clientHeight;

        const tag = element.tagName.toLowerCase();
        const maxLimit = maxFontSizes[tag] || 500;

        // Increase font size until overflow or max limit
        while (
            element.scrollWidth < parentWidth &&
            element.scrollHeight < parentHeight &&
            fontSize < maxLimit
        ) {
            fontSize++;
            element.style.fontSize = fontSize + 'px';
        }

        // Step back once
        fontSize--;

        // Make it twice smaller (original behavior)
        fontSize = Math.floor(fontSize / 2);

        // Apply max limit
        if (fontSize > maxLimit) fontSize = maxLimit;

        // Enforce minimum for paragraphs
        if (tag === 'p' && fontSize < 12) fontSize = 12;

        element.style.fontSize = fontSize + 'px';
    }

    // Resize all elements
    function resizeAll() {
        if (!container || !elements.length) return;
        elements.forEach(el => fitTextToParent(el, container));
    }

    // Main logic
    function main() {
        container = document.querySelector(containerSelector);
        if (!container) return;

        overlay = container.querySelector(overlaySelector);
        if (!overlay) return;

        elements = overlay.querySelectorAll(elementSelectors);
        if (!elements.length) return;

        resizeAll();
        window.addEventListener('resize', resizeAll);
    }

    // Auto-init when DOM is ready
    document.addEventListener('DOMContentLoaded', main);

    // Optional public API (kept for consistency)
    return {
        init: main
    };

})();

window.FitTextModule = FitTextModule;
