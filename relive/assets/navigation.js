
document.addEventListener("DOMContentLoaded", function() {
  // Insert labels HTML into placeholder
  document.getElementById("navigation-placeholder").innerHTML = `<aside class='sidebar-labels'><h2>Navigacija</h2>
<div class='first-items'><h3>Kategorija:</h3><ul class='label-list'>
<li><a class='label-name' href='https://metodlangus.github.io/relive/search/labels/gornistvo/'>Gorništvo</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/relive/search/labels/kolesarjenje/'>Kolesarjenje</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/relive/search/labels/ostalo/'>Ostalo</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/relive/search/labels/smucanje/'>Smučanje</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/relive/search/labels/sprehod/'>Sprehod</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/relive/search/labels/tek-na-smuceh/'>Tek na smučeh</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/relive/search/labels/turno-smucanje/'>Turno smučanje</a></li>
</ul>
</div>
</aside>`;

  // Add state remembering for all <details>
  document.querySelectorAll("#navigation-placeholder details").forEach(function(det, idx) {
    var key = "navigation-state-" + idx;

    // Restore state from sessionStorage
    if (sessionStorage.getItem(key) === "open") {
      det.setAttribute("open", "");
    } else if (sessionStorage.getItem(key) === "closed") {
      det.removeAttribute("open");
    }

    // Save state when toggled
    det.addEventListener("toggle", function() {
      sessionStorage.setItem(key, det.open ? "open" : "closed");
    });
  });
});
