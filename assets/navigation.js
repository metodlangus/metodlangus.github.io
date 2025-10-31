
document.addEventListener("DOMContentLoaded", function() {
  // Insert labels HTML into placeholder
  document.getElementById("navigation-placeholder").innerHTML = `<aside class='sidebar-labels'><h2>Navigacija</h2>
<div class='first-items'><h3>Kategorija:</h3><ul class='label-list'>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/alpinizem.html'>Alpinizem</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/ferata.html'>Ferata</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/gornistvo.html'>Gorništvo</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/gorski-tek.html'>Gorski tek</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/ostalo.html'>Ostalo</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/plezanje.html'>Plezanje</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/pohodnistvo.html'>Pohodništvo</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/potepanja.html'>Potepanja</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/sprehod.html'>Sprehod</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/tek.html'>Tek</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/turno-smucanje.html'>Turno smučanje</a></li>
</ul>
<div class='remaining-items hidden' style='height:auto;'>
<h3>Država:</h3><ul class='label-list'>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/avstrija.html'>Avstrija</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/hrvaska.html'>Hrvaška</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/italija.html'>Italija</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/madzarska.html'>Madžarska</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/maroko.html'>Maroko</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/sardinija.html'>Sardinija</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/slovaska.html'>Slovaška</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/slovenija.html'>Slovenija</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/svica.html'>Švica</a></li>
</ul>
<h3>Gorstvo:</h3><ul class='label-list'>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/beneske-predalpe.html'>Beneške Predalpe</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/atlas.html'>Atlas</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/biokovo.html'>Biokovo</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/dinarsko-gorstvo.html'>Dinarsko gorstvo</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/dolomiti.html'>Dolomiti</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/julijske-alpe.html'>Julijske Alpe</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/kamnisko-savinjske-alpe.html'>Kamniško-Savinjske Alpe</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/karavanke.html'>Karavanke</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/karnijske-alpe.html'>Karnijske Alpe</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/kriske-alpe.html'>Kriške Alpe</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/matra.html'>Mátra</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/nizke-tatre.html'>Nizke Tatre</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/nizke-ture.html'>Nizke Ture</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/peninske-alpe.html'>Peninske Alpe</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/slovaski-raj.html'>Slovaški raj</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/tavolara.html'>Tavolara</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/tribec.html'>Tribeč</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/velebit.html'>Velebit</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/visoke-tatre.html'>Visoke Tatre</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/visoke-ture.html'>Visoke Ture</a></li>
</ul>
<h3>Časovno:</h3><ul class='label-list'>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/celodnevni.html'>Celodnevni</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/daljsa-potepanja.html'>Daljša potepanja</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/dvodnevni.html'>Dvodnevni</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/kratki.html'>Kratki</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/poldnevni.html'>Poldnevni</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/vikend-potepanja.html'>Vikend potepanja</a></li>
</ul>
<h3>Ostalo:</h3><ul class='label-list'>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/brezpotje.html'>Brezpotje</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/greben.html'>Greben</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/jama.html'>Jama</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/jezero.html'>Jezero</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/kanjon.html'>Kanjon</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/mesto.html'>Mesto</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/moji-najljubsi.html'>Moji najljubši</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/otok.html'>Otok</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/polotok.html'>Polotok</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/slap.html'>Slap</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/soteska.html'>Soteska</a></li>
<li><a class='label-name' href='https://metodlangus.github.io/search/labels/grad.html'>Grad</a></li>
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
