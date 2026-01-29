function fitTextToParent(element, parent, maxFontSizes) {
  let fontSize = 10; // start small
  element.style.fontSize = fontSize + "px";

  const parentWidth = parent.clientWidth;
  const parentHeight = parent.clientHeight;

  const tag = element.tagName.toLowerCase();
  const maxLimit = maxFontSizes[tag] || 500; // fallback if not specified

  // Increase font size until it overflows or reaches its max limit
  while (
    element.scrollWidth < parentWidth &&
    element.scrollHeight < parentHeight &&
    fontSize < maxLimit
  ) {
    fontSize += 1;
    element.style.fontSize = fontSize + "px";
  }

  // Step back once
  fontSize -= 1;

  // Make it twice smaller (your original behavior)
  fontSize = Math.floor(fontSize / 2);

  // Apply max limit
  if (fontSize > maxLimit) fontSize = maxLimit;

  // ⬇️ NEW: enforce minimum for paragraphs
  if (tag === "p" && fontSize < 12) fontSize = 12;

  element.style.fontSize = fontSize + "px";
}

// Apply to all text elements
const quarter = document.querySelector('.quarter-404-page');
const overlay = quarter.querySelector('.message-overlay-404-page');
const elements = overlay.querySelectorAll('h1, p, a');

// Define different max font sizes per tag
const maxFontSizes = {
  h1: 500,   // max font-size for <h1>
  p: 500,    // max font-size for <p>
  a: 50      // max font-size for <a>
};

function resizeAll() {
  elements.forEach(el => fitTextToParent(el, quarter, maxFontSizes));
}

// Initial sizing
resizeAll();

// Resize on window resize
window.addEventListener('resize', resizeAll);