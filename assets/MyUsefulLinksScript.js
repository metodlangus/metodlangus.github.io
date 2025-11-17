const usefulLinks = [
    {
        "title": "Hribi",
        "url": "https://www.hribi.net/",
        "description": "Vse potrebne informacije o izletih v gore. Portal, namenjen ljubiteljem gora in planin. Opisi izletov, slike, spletne kamere, zemljevidi, gps sledi...",
        "favicon": "https://www.hribi.net/slike/logo.ico"
    },
    {
        "title": "Na lepše – Matej Trobec",
        "url": "https://trobec.blogspot.com/",
        "description": "Gorniški blog",
        "favicon": "https://trobec.blogspot.com/favicon.ico"
    },
    {
        "title": "Utrinki iz gorniškega dnevnika – Teja Oman",
        "url": "http://www.tejaoman.info/utrinki.htm",
        "description": "Stran namenjena ljubiteljem gorništva, turnega smučanja in gorskega kolesarjenja.",
        "favicon": "http://www.tejaoman.info/favicon.ico"
    },
    {
        "title": "Marijana & Marko – Marko Kern, Marijana Cuderman",
        "url": "https://www2.arnes.si/~mcuder/",
        "description": "Gore - Gorništvo - Brezpotja - Turno smučanje - Gorsko kolesarjenje: gorniški dnevnik, potepanja po brezpotjih, smučarske ture, zimski vzponi, grebenska prečenja, slovenski dvatisočaki, pristopi na vrhove, lažji alpinistični vzponi, gorsko kolesarstvo, turnosmučarski vodniček, alpinistični smuki, planinski vodnik ...",
        "favicon": "https://www2.arnes.si/~mcuder/mmicon.ico"
    },
    {
        "title": "Fotografov dnevnik – Tadej Maligoj",
        "url": "https://fotografovdnevnik.maligoj.si/",
        "description": "Fotografov dnevnik – … IN DRUGE KOZLOVSKE ZGODBE",
        "favicon": ""
    },
    {
        "title": "PrimožGrahelj's blog – Primož Grahelj",
        "url": "https://primozgraheljsblog.blogspot.com/",
        "description": "GORNIŠTVO, HRIBOLAZENJE IN DRUGE ZANIMIVE DOGODIVŠČINE",
        "favicon": "https://primozgraheljsblog.blogspot.com/favicon.ico"
    },
    {
        "title": "Primož Blaha – Tam zgoraj…je lepo",
        "url": "https://primozblaha.blog/",
        "description": "Tam zgoraj...je lepo",
        "favicon": "https://primozblaha.blog/favicon.ico"
    },
    {
        "title": "Mattia Furlan",
        "url": "https://mattia-furlan.github.io/mont/escursioni/introduzione/",
        "description": "To spletno stran odpiram, da bi strukturiral nekatere svoje pohode – ne vseh, ampak le tiste, ki se mi zdijo najbolj zanimivi. Rad bi jih vključil vse, kot opomnik na številne lepe dni, preživete v gorah, vendar za takšno nalogo nimam časa ...",
        "favicon": "https://mattia-furlan.github.io/mont/icon300.png"
    },
    {
        "title": "Hannes Gfrerer",
        "url": "https://hannes.gfrerer.name/",
        "description": "Gorniški blog",
        "favicon": "https://hannes.gfrerer.name/wp-content/uploads/2021/01/cropped-mountainicon-1-32x32.png"
    },
    {
        "title": "Home - philippsteiner.eu – Philipp Steiner",
        "url": "https://philippsteiner.eu/",
        "description": "Gorniški blog",
        "favicon": "https://philippsteiner.eu/wp-content/uploads/2018/02/favicon.ico"
    },
    {
        "title": "Modrina neba",
        "url": "https://modrinaneba.blogspot.com/",
        "description": "Od tod in tam...",
        "favicon": "https://modrinaneba.blogspot.com/favicon.ico"
    },
    {
        "title": "maPZS",
        "url": "https://mapzs.pzs.si/home/trails",
        "description": "Zemljevid slovenskih planinskih poti.",
        "favicon": "https://mapzs.pzs.si/assets/icons/favicon-32x32.png"
    },
    {
        "title": "Stanje poti [Planinska zveza Slovenije]",
        "url": "https://stanje-poti.pzs.si/",
        "description": "Zemljevid zaprtih planinskih poti.",
        "favicon": ""
    },
    {
        "title": "Evropske kolesarske in pohodniške karte za prenos na pametne telefone Android",
        "url": "https://www.openandromaps.org/en/downloads/europe",
        "description": "Kolesarske in pohodniške karte za Android zdaj pokrivajo Evropo, ZDA, nekatere dele Kanade, Južno Ameriko, Oceanijo, dele Azije, Nepal, Tibet in Afriko.",
        "favicon": "https://www.openandromaps.org/wp-content/images/favicon_32_4bit.ico"
    },
    {
        "title": "Windy: zemljevid vetra in vremenska napoved",
        "url": "https://www.windy.com/",
        "description": "Vremenski radar ter napoved vetra in valov za kajtarje, deskarje, jadralne padalce, pilote, jadralce in vse ostale. Svetovni animirani vremenski zemljevid z enostavnimi sloji in natančno napovedjo za posamezne točke. METAR, TAF in NOTAM-i za katero koli letališče na svetu. Kode SYNOP vremenskih postaj in boj. Napovedni modeli ECMWF, GFS, NAM in NEMS.",
        "favicon": "https://www.windy.com/img/favicon.png"
    },
    // {
    //     "title": "Zemljevid pokritosti viewfinderpanoramas.org",
    //     "url": "https://viewfinderpanoramas.org/Coverage%20map%20viewfinderpanoramas_org3.htm",
    //     "description": "",
    //     "favicon": ""
    // }
];


const container = document.getElementById('useful-links-container');
let html = '<ul class="useful-links">';

usefulLinks.forEach((link, index) => {
    html += `<li style="margin-bottom:15px; position:relative;">
                <img src="${link.favicon}" alt="" style="width:16px;height:16px;vertical-align:middle;margin-right:5px;">
                <a href="${link.url}" target="_blank">${link.title}</a>

                ${link.url === "https://mattia-furlan.github.io/mont/escursioni/introduzione/" ? `
                    <button class="open-map-btn" onclick="openMapOverlay()">🗺️ Zemljevid</button>
                ` : ``}

                <br>
                <small>${link.description}</small>
              </li>`;
});

html += '</ul>';
container.innerHTML = html;

function openMapOverlay() {
    const overlay = document.getElementById('mapOverlay');
    const frame = document.getElementById('mapOverlayFrame');
    frame.src = "../mattia-adventures-map.html";  // Path to map page
    overlay.style.display = "block";
}

function closeMapOverlay() {
    document.getElementById('mapOverlay').style.display = "none";
    document.getElementById('mapOverlayFrame').src = "";
}