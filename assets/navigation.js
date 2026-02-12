
document.addEventListener("DOMContentLoaded", function() {
  // Insert labels HTML into placeholder
  document.getElementById("navigation-placeholder").innerHTML = `<aside class='sidebar-labels'><h2>Navigacija</h2>
<div class='first-items'><h3>Kategorija:</h3><ul class='label-list'>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/alpinizem/'>Alpinizem</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/ferata/'>Ferata</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/gornistvo/'>Gorništvo</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/gorski-tek/'>Gorski tek</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/ostalo/'>Ostalo</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/plezanje/'>Plezanje</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/pohodnistvo/'>Pohodništvo</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/potepanja/'>Potepanja</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/sprehod/'>Sprehod</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/tek/'>Tek</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/turno-smucanje/'>Turno smučanje</a></li>
</ul>
<div class='remaining-items hidden' style='height:auto;'>
<h3>Država:</h3><ul class='label-list'>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/avstrija/'>Avstrija</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/hrvaska/'>Hrvaška</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/italija/'>Italija</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/madzarska/'>Madžarska</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/maroko/'>Maroko</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/sardinija/'>Sardinija</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/slovaska/'>Slovaška</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/slovenija/'>Slovenija</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/svica/'>Švica</a></li>
</ul>
<h3>Gorstvo:</h3><ul class='label-list'>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/beneske-predalpe/'>Beneške Predalpe</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/atlas/'>Atlas</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/biokovo/'>Biokovo</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/dinarsko-gorstvo/'>Dinarsko gorstvo</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/dolomiti/'>Dolomiti</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/julijske-alpe/'>Julijske Alpe</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/kamnisko-savinjske-alpe/'>Kamniško-Savinjske Alpe</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/karavanke/'>Karavanke</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/karnijske-alpe/'>Karnijske Alpe</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/kriske-alpe/'>Kriške Alpe</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/labotniske-alpe/'>Labotniške Alpe</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/matra/'>Mátra</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/nizke-tatre/'>Nizke Tatre</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/nizke-ture/'>Nizke Ture</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/peninske-alpe/'>Peninske Alpe</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/slovaski-raj/'>Slovaški raj</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/tavolara/'>Tavolara</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/tribec/'>Tribeč</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/velebit/'>Velebit</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/visoke-tatre/'>Visoke Tatre</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/visoke-ture/'>Visoke Ture</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/ziljske-alpe/'>Ziljske Alpe</a></li>
</ul>
<h3>Časovno:</h3><ul class='label-list'>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/celodnevni/'>Celodnevni</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/daljsa-potepanja/'>Daljša potepanja</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/dvodnevni/'>Dvodnevni</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/kratki/'>Kratki</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/poldnevni/'>Poldnevni</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/vikend-potepanja/'>Vikend potepanja</a></li>
</ul>
<h3>Ostalo:</h3><ul class='label-list'>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/brezpotje/'>Brezpotje</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/greben/'>Greben</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/jama/'>Jama</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/jezero/'>Jezero</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/kanjon/'>Kanjon</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/mesto/'>Mesto</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/moji-najljubsi/'>Moji najljubši</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/otok/'>Otok</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/polotok/'>Polotok</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/puscava/'>Puščava</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/slap/'>Slap</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/soteska/'>Soteska</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/grad/'>Grad</a></li>
</ul>
</div>

        <span class='show-more pill-button'>Pokaži več</span>
        <span class='show-less pill-button hidden'>Pokaži manj</span>
        
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
