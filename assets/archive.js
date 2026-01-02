
document.addEventListener("DOMContentLoaded", function() {
  // Insert archive HTML into placeholder
  document.getElementById("archive-placeholder").innerHTML = `<aside class="sidebar-archive">
  <h2>Arhiv</h2>
  <details open>
    <summary><a href="https://metodlangus.github.io/posts/2025/">2025</a>&nbsp;<span class="post-count" dir="ltr">(72)</span></summary>
    <details class="month-group">
      <summary><a href="https://metodlangus.github.io/posts/2025/12/">december 2025</a>&nbsp;<span class="post-count" dir="ltr">(3)</span></summary>
      <ul>
        <li><a href="https://metodlangus.github.io/posts/2025/12/spik-2473-m/">Špik (2473 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/12/potoska-gora-1283-m/">Potoška gora (1283 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/12/mittagskogel-kepa-2145-m/">Mittagskogel / Kepa (2145 m)</a></li>
      </ul>
    </details>
    <details class="month-group">
      <summary><a href="https://metodlangus.github.io/posts/2025/11/">november 2025</a>&nbsp;<span class="post-count" dir="ltr">(6)</span></summary>
      <ul>
        <li><a href="https://metodlangus.github.io/posts/2025/11/sentanski-vrh-1635-m-cez-crni-vrh-1257-m/">Šentanski vrh (1635 m) čez Črni vrh (1257 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/11/goli-vrh-1787-m-mala-baba-2018-m/">Goli vrh (1787 m), Mala Baba (2018 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/11/jerebikovec-1593-m/">Jerebikovec (1593 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/11/ojstra-1577-m-topica-1649-m-zitrajska-gora-1064-m/">Ojstra (1577 m), Topica (1649 m), Žitrajska gora (1064 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/11/mali-grintovec-1813-m-srednji-vrh-1853-m/">Mali Grintovec (1813 m), Srednji vrh (1853 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/11/monte-cit-1415-m-monte-torre-1742-m/">Monte Cit (1415 m), Monte Torre (1742 m)</a></li>
      </ul>
    </details>
    <details class="month-group">
      <summary><a href="https://metodlangus.github.io/posts/2025/10/">oktober 2025</a>&nbsp;<span class="post-count" dir="ltr">(4)</span></summary>
      <ul>
        <li><a href="https://metodlangus.github.io/posts/2025/10/greben-polovnika/">Greben Polovnika</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/10/vosca-1737-m-kamnati-vrh-1656-m/">Vošca (1737 m), Kamnati vrh (1656 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/10/sentanski-vrh-1635-m/">Šentanski vrh (1635 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/10/lokovnikov-grintovec-1809-m-hajnzev-praprotnik-1727-m/">Lokovnikov Grintovec (1809 m), Hajnžev Praprotnik (1727 m)</a></li>
      </ul>
    </details>
    <details class="month-group">
      <summary><a href="https://metodlangus.github.io/posts/2025/09/">september 2025</a>&nbsp;<span class="post-count" dir="ltr">(3)</span></summary>
      <ul>
        <li><a href="https://metodlangus.github.io/posts/2025/09/maroko-9-25-9-2025/">Maroko (9. – 25. 9. 2025)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/09/jebel-toubkal-4167-m/">Jebel Toubkal (4167 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/09/dolkova-spica-2591-m-skrlatica-2740-m-kriz-2410-m/">Dolkova špica (2591 m), Škrlatica (2740 m), Križ (2410 m)</a></li>
      </ul>
    </details>
    <details class="month-group">
      <summary><a href="https://metodlangus.github.io/posts/2025/08/">avgust 2025</a>&nbsp;<span class="post-count" dir="ltr">(5)</span></summary>
      <ul>
        <li><a href="https://metodlangus.github.io/posts/2025/08/ponza-piccola-mala-ponca-1921-m/">Ponza Piccola / Mala Ponca (1921 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/08/okrog-triglava-2864-m/">Okrog Triglava (2864 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/08/crna-prst-1844-m-rodica-1963-m/">Črna prst (1844 m), Rodica (1963 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/08/luknja-pec-2249-m-rjavina-2532-m/">Luknja peč (2249 m), Rjavina (2532 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/08/vrtaca-2180-m-cez-malo-glavo/">Vrtača (2180 m) čez Malo glavo</a></li>
      </ul>
    </details>
    <details class="month-group">
      <summary><a href="https://metodlangus.github.io/posts/2025/07/">julij 2025</a>&nbsp;<span class="post-count" dir="ltr">(5)</span></summary>
      <ul>
        <li><a href="https://metodlangus.github.io/posts/2025/07/medvedjek-1000-m/">Medvedjek (1000 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/07/poldnik-kopa-picco-di-mezzodi-2063-m-monte-bucher-grande-skala-2133-m/">Poldnik (Kopa) / Picco di Mezzodi (2063 m), Monte Bucher grande / Skala (2133 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/07/brana-2253-m-cez-sijo/">Brana (2253 m) čez Šijo</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/07/motschiwa-1822-m-kosmatitza-kosmatica-1659-m/">Motschiwa (1822 m), Kosmatitza / Kosmatica (1659 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/07/po-hribckih-nad-dolino-drage/">Po hribčkih nad dolino Drage</a></li>
      </ul>
    </details>
    <details class="month-group">
      <summary><a href="https://metodlangus.github.io/posts/2025/06/">junij 2025</a>&nbsp;<span class="post-count" dir="ltr">(10)</span></summary>
      <ul>
        <li><a href="https://metodlangus.github.io/posts/2025/06/greben-lonzakopfl-2317-m-vorder-geisslkopf-2974-m/">Greben Lonzaköpfl (2317 m) – Vorder Geißlkopf (2974 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/06/hohe-leier-2774-m/">Hohe Leier (2774 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/06/vikend-v-radstadtskih-turah-21-22-6-2025/">Vikend v Radstadtskih Turah (21. – 22. 6. 2025)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/06/mosermandl-2608-m/">Mosermandl (2608 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/06/kleine-guglspitze-2570-m-in-speiereck-2411-m-ter-se-vsaj-15-vrhov/">Kleine Guglspitze (2570 m) in Speiereck (2411 m) ter še vsaj 15 vrhov</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/06/cez-krisko-goro-na-storzic-2132-m/">Čez Kriško goro na Storžič (2132 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/06/brezpotni-ravnik-1477-m-ter-brda-2009-m-iz-krme/">Brezpotni Ravnik (1477 m) ter Brda (2009 m) iz Krme</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/06/cez-kofce-na-stari-ljubelj/">Čez Kofce na stari Ljubelj</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/06/za-vikend-v-karnijce-31-5-1-6-2025/">Za vikend v Karnijce (31. 5. – 1. 6. 2025)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/06/creta-di-timau-2217-m/">Creta di Timau (2217 m)</a></li>
      </ul>
    </details>
    <details class="month-group">
      <summary><a href="https://metodlangus.github.io/posts/2025/05/">maj 2025</a>&nbsp;<span class="post-count" dir="ltr">(13)</span></summary>
      <ul>
        <li><a href="https://metodlangus.github.io/posts/2025/05/mestece-timau/">Mestece Timau</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/05/cuestalta-hoher-trieb-2198-m/">Cuestalta / Hoher Trieb (2198 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/05/rutarski-vrsic-1699-m-vanezev-rob-1891-m/">Rutarski vršič (1699 m), Vanežev rob (1891 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/05/veliki-vrh-kriz-1742-m-slap-cedca/">Veliki vrh (Križ) (1742 m), slap Čedca</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/05/skozi-kraljestvo-muflonov/">Skozi kraljestvo muflonov</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/05/greben-begunjscice-2060-m-cez-potocnikovo-planino/">Greben Begunjščice (2060 m) čez Potočnikovo planino</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/05/visoki-kurjek-barenkogel-1973-m-lepa-plevelnica-1959-m/">Visoki Kurjek / Bärenkogel (1973 m), Lepa Plevelnica (1959 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/05/potepanje-po-hrvaski-26-4-4-5-2025/">Potepanje po Hrvaški (26. 4. – 4. 5. 2025)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/05/klek-1181-m/">Klek (1181 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/05/split/">Split</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/05/ferata-perunika/">Ferata Perunika</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/05/kimet-1536-m/">Kimet (1536 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/05/jama-krjava-vosac-1421-m/">Jama Krjava, Vošac (1421 m)</a></li>
      </ul>
    </details>
    <details class="month-group">
      <summary><a href="https://metodlangus.github.io/posts/2025/04/">april 2025</a>&nbsp;<span class="post-count" dir="ltr">(9)</span></summary>
      <ul>
        <li><a href="https://metodlangus.github.io/posts/2025/04/veliki-sibenik-1467-m-sveti-jure-1762-m/">Veliki Šibenik (1467 m), Sveti Jure (1762 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/04/omis-ferata-fortica/">Omiš (ferata Fortica)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/04/greben-kozjak/">Greben Kozjak</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/04/sibenik/">Šibenik</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/04/kanjon-krupe/">Kanjon Krupe</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/04/veliki-bat-1381-m-bili-kuk-1171-m/">Veliki Bat (1381 m), Bili kuk (1171 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/04/klekovac-898-m/">Klekovac (898 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/04/kriska-gora-1472-m-vrh-vrata-1591-m/">Kriška gora (1472 m), Vrh Vrata (1591 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/04/sentanski-vrh-1635-m-dobrca-1634-m/">Šentanski vrh (1635 m), Dobrča (1634 m)</a></li>
      </ul>
    </details>
    <details class="month-group">
      <summary><a href="https://metodlangus.github.io/posts/2025/03/">marec 2025</a>&nbsp;<span class="post-count" dir="ltr">(4)</span></summary>
      <ul>
        <li><a href="https://metodlangus.github.io/posts/2025/03/schilchernock-2270-m-gaipahohe-2192-m/">Schilchernock (2270 m), Gaipahöhe (2192 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/03/mrezce-1965-m/">Mrežce (1965 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/03/mozic-1602-m-slatnik-1599-m-lajnar-1549-m/">Možic (1602 m), Slatnik (1599 m), Lajnar (1549 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/03/veliki-draski-vrh-2240-m-draski-rob-1981-m/">Veliki Draški vrh (2240 m), Draški rob (1981 m)</a></li>
      </ul>
    </details>
    <details class="month-group">
      <summary><a href="https://metodlangus.github.io/posts/2025/02/">februar 2025</a>&nbsp;<span class="post-count" dir="ltr">(6)</span></summary>
      <ul>
        <li><a href="https://metodlangus.github.io/posts/2025/02/turno-smucanje-po-kaninu/">Turno smučanje po Kaninu</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/02/kriska-gora-1472-m/">Kriška gora (1472 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/02/breska-planina/">Breška planina</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/02/sentanski-vrh-1635-m-dobrca-1634-m/">Šentanski vrh (1635 m), Dobrča (1634 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/02/turno-smucanje-po-kaninu-1/">Turno smučanje po Kaninu</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/02/turno-smucanje-po-kaninu-2/">Turno smučanje po Kaninu</a></li>
      </ul>
    </details>
    <details class="month-group">
      <summary><a href="https://metodlangus.github.io/posts/2025/01/">januar 2025</a>&nbsp;<span class="post-count" dir="ltr">(4)</span></summary>
      <ul>
        <li><a href="https://metodlangus.github.io/posts/2025/01/vosca-1737-m-zajcnik-1746-m-trupejevo-poldne-1931-m/">Vošca (1737 m), Zajčnik (1746 m), Trupejevo poldne (1931 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/01/pticji-vrh-1551-m-korenjscica-1764-m/">Ptičji vrh (1551 m), Korenjščica (1764 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/01/lepenatka-1425-m-veliki-rogatec-1557-m/">Lepenatka (1425 m), Veliki Rogatec (1557 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2025/01/zimska-pravljica-na-kriski-gori/">Zimska pravljica na Kriški gori</a></li>
      </ul>
    </details>
  </details>
  <details open>
    <summary><a href="https://metodlangus.github.io/posts/2024/">2024</a>&nbsp;<span class="post-count" dir="ltr">(60)</span></summary>
    <details class="month-group">
      <summary><a href="https://metodlangus.github.io/posts/2024/11/">november 2024</a>&nbsp;<span class="post-count" dir="ltr">(7)</span></summary>
      <ul>
        <li><a href="https://metodlangus.github.io/posts/2024/11/srednji-vrh-1796-m-vrtaca-wertatscha-2180-m/">Srednji vrh (1796 m), Vrtača / Wertatscha (2180 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/11/potepanje-po-dolomitih-28-10-4-11-2024/">Potepanje po Dolomitih (28. 10. – 4. 11. 2024)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/11/piccolo-cir-2520-m-gran-cir-2592-m/">Piccolo Cir (2520 m), Gran Cir (2592 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/11/bruneck-brunico/">Bruneck - Brunico</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/11/mesola-2727-m-mesolina-2642-m/">Mesola (2727 m), Mesolina (2642 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/11/roda-di-vael-rotwand-2806-m/">Roda di Vaèl - Rotwand (2806 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/11/cima-costabella-2762-m-cima-dell-uomo-3010-m/">Cima Costabella (2762 m), Cima dell&#x27;Uomo (3010 m)</a></li>
      </ul>
    </details>
    <details class="month-group">
      <summary><a href="https://metodlangus.github.io/posts/2024/10/">oktober 2024</a>&nbsp;<span class="post-count" dir="ltr">(4)</span></summary>
      <ul>
        <li><a href="https://metodlangus.github.io/posts/2024/10/cima-d-auta-orientale-2645-m/">Cima d&#x27;Auta Orientale (2645 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/10/cima-di-val-di-roda-2791-m/">Cima di Val di Roda (2791 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/10/monte-grappa-1776-m/">Monte Grappa (1776 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/10/nlb-28-ljubljanski-maraton-21-km/">NLB 28. Ljubljanski maraton (21 km)</a></li>
      </ul>
    </details>
    <details class="month-group">
      <summary><a href="https://metodlangus.github.io/posts/2024/09/">september 2024</a>&nbsp;<span class="post-count" dir="ltr">(19)</span></summary>
      <ul>
        <li><a href="https://metodlangus.github.io/posts/2024/09/slovaska-madzarska-31-8-12-9-2024/">Slovaška, Madžarska  (31. 8. – 12. 9. 2024)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/09/budapest-budimpesta/">Budapest - Budimpešta</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/09/kekesteto-1014-m-najvisji-vrh-madzarske/">Kékestető (1014 m) - najvišji vrh Madžarske</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/09/mesto-eger/">Mesto Eger</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/09/bukki-nemzeti-park-madzarski-narodni-park/">Bükki Nemzeti Park - madžarski narodni park</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/09/kosice/">Košice</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/09/narodni-park-slovensky-kras/">Národní park Slovenský kras</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/09/narodny-park-muranska-planina-sedlo-zbojska/">Národný park Muránska planina - Sedlo Zbojská</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/09/narodny-park-muranska-planina-grad-muran/">Národný park Muránska planina - Grad Muráň</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/09/slovensky-raj-soteska-zejmarska-roklina/">Slovenský raj - soteska Zejmarská roklina</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/09/slovensky-raj-soteski-piecky-in-velky-sokol/">Slovenský raj - soteski Piecky in Veľký Sokol</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/09/slovensky-raj-slovaski-np-stevilnih-kanjonov-in-sotesk/">Slovenský raj - Slovaški NP številnih kanjonov in sotesk</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/09/rysy-2499-m-najvisji-vrh-poljske-koprovsky-stit-2367-m/">Rysy (2499 m) - najvišji vrh Poljske, Kôprovský štít (2367 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/09/gerlachovsky-stit-2654-m-najvisji-vrh-slovaske-vychodna-vysoka-2429-m/">Gerlachovský štít (2654 m) - najvišji vrh Slovaške, Východná Vysoká (2429 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/09/jezero-strbske-pleso/">Jezero Štrbské Pleso</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/09/krivan-2494-m-simbol-slovaske-narodne-zavesti/">Kriváň (2494 m) - simbol slovaške narodne zavesti</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/09/nizke-tatre-derese-2004-m-chopok-2024-m-dumbier-2043-m/">Nizke Tatre - Dereše (2004 m), Chopok (2024 m), Ďumbier (2043 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/09/jama-harmanecka-jaskyna/">Jama Harmanecká jaskyňa</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/09/park-skalka/">Park Skalka</a></li>
      </ul>
    </details>
    <details class="month-group">
      <summary><a href="https://metodlangus.github.io/posts/2024/08/">avgust 2024</a>&nbsp;<span class="post-count" dir="ltr">(5)</span></summary>
      <ul>
        <li><a href="https://metodlangus.github.io/posts/2024/08/kremnica/">Kremnica</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/08/razgledni-stolp-haj-gupna-442-m/">Razgledni stolp Háj, Gupňa (442 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/08/zobor-587-m/">Zobor (587 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/08/monte-nabois-piccolo-1695-m-in-monte-nabois-grande-2301-m/">Monte Nabois piccolo (1695 m) in Monte Nabois grande (2301 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/08/po-grebenu-od-visoke-ponce-2274-m-do-mangarta-2679-m/">Po grebenu od Visoke Ponce (2274 m) do Mangarta (2679 m)</a></li>
      </ul>
    </details>
    <details class="month-group">
      <summary><a href="https://metodlangus.github.io/posts/2024/07/">julij 2024</a>&nbsp;<span class="post-count" dir="ltr">(9)</span></summary>
      <ul>
        <li><a href="https://metodlangus.github.io/posts/2024/07/potepanje-po-karnijcih-25-28-7-2024/">Potepanje po Karnijcih (25. – 28. 7. 2024)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/07/cimon-del-cavallo-2251-m/">Cimon del Cavallo (2251 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/07/ferrata-rino-costacurta-al-teverone/">Ferrata Rino Costacurta al Teverone</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/07/schiara-2565-m-pelf-2502-m/">Schiara (2565 m), Pelf (2502 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/07/monte-pramaggiore-2478-m/">Monte Pramaggiore (2478 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/07/precenje-mojstrovk-in-sit/">Prečenje Mojstrovk in Šit</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/07/vikend-v-ksa-6-4-7-2024/">Vikend v KSA (6. – 4. 7. 2024)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/07/strelovec-1763-m-kroficka-2083-m/">Strelovec (1763 m), Krofička (2083 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/07/matkova-kopa-1957-m-krnicka-gora-2064-m/">Matkova Kopa (1957 m), Krnička gora (2064 m)</a></li>
      </ul>
    </details>
    <details class="month-group">
      <summary><a href="https://metodlangus.github.io/posts/2024/06/">junij 2024</a>&nbsp;<span class="post-count" dir="ltr">(8)</span></summary>
      <ul>
        <li><a href="https://metodlangus.github.io/posts/2024/06/dolina-rezije-29-30-6-2024/">Dolina Rezije (29. – 30. 6. 2024)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/06/baba-grande-velika-baba-2161-m/">Baba grande / Velika Baba (2161 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/06/monte-sart-2324-m/">Monte Sart (2324 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/06/precenje-kumlehov/">Prečenje Kumlehov</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/06/mokrica-1853-m-iz-kurje-doline/">Mokrica (1853 m) iz Kurje doline</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/06/dobrca-1634-m-begunjscica-2060-m-vrtaca-2180-m-ljubelj/">Dobrča (1634 m) - Begunjščica (2060 m) - Vrtača (2180 m) - Ljubelj</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/06/bivak-stebrasta-skala-in-naprej-na-mezaklo/">Bivak Stebrasta skala in naprej na Mežaklo</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/06/kriska-gora-1472-m-tolsti-vrh-1715-m/">Kriška gora (1472 m), Tolsti vrh (1715 m)</a></li>
      </ul>
    </details>
    <details class="month-group">
      <summary><a href="https://metodlangus.github.io/posts/2024/05/">maj 2024</a>&nbsp;<span class="post-count" dir="ltr">(1)</span></summary>
      <ul>
        <li><a href="https://metodlangus.github.io/posts/2024/05/brezpotje-cez-akle-1380-m-in-starca-1426-m/">Brezpotje čez Akle (1380 m) in Starca (1426 m)</a></li>
      </ul>
    </details>
    <details class="month-group">
      <summary><a href="https://metodlangus.github.io/posts/2024/04/">april 2024</a>&nbsp;<span class="post-count" dir="ltr">(5)</span></summary>
      <ul>
        <li><a href="https://metodlangus.github.io/posts/2024/04/vrh-ljubeljscice-1705-m/">Vrh Ljubeljščice (1705 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/04/vrh-ljubeljscice-1705-m-1/">Vrh Ljubeljščice (1705 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/04/sentanski-vrh-1635-m-dobrca-1634-m/">Šentanski vrh (1635 m), Dobrča (1634 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/04/hribcki-nad-vasico-chiusaforte-z-najvisjim-monte-plananizza-1555-m/">Hribčki nad vasico Chiusaforte, z najvišjim Monte Plananizza (1555 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/04/od-alpe-piccola-1304-m-do-monte-acuto-1781-m/">Od Alpe Piccola (1304 m) do Monte Acuto (1781 m)</a></li>
      </ul>
    </details>
    <details class="month-group">
      <summary><a href="https://metodlangus.github.io/posts/2024/03/">marec 2024</a>&nbsp;<span class="post-count" dir="ltr">(2)</span></summary>
      <ul>
        <li><a href="https://metodlangus.github.io/posts/2024/03/pot-sedmih-slapov/">Pot sedmih slapov</a></li>
        <li><a href="https://metodlangus.github.io/posts/2024/03/mrezce-1965-m-okroglez-1965-m/">Mrežce (1965 m), Okroglež (1965 m)</a></li>
      </ul>
    </details>
  </details>
  <details open>
    <summary><a href="https://metodlangus.github.io/posts/2023/">2023</a>&nbsp;<span class="post-count" dir="ltr">(32)</span></summary>
    <details class="month-group">
      <summary><a href="https://metodlangus.github.io/posts/2023/12/">december 2023</a>&nbsp;<span class="post-count" dir="ltr">(2)</span></summary>
      <ul>
        <li><a href="https://metodlangus.github.io/posts/2023/12/prevala-2067-m-iz-sella-nevea/">Prevala (2067 m) iz Sella Nevea</a></li>
        <li><a href="https://metodlangus.github.io/posts/2023/12/dobrca-1634-m-cez-travnike/">Dobrča (1634 m) čez travnike</a></li>
      </ul>
    </details>
    <details class="month-group">
      <summary><a href="https://metodlangus.github.io/posts/2023/10/">oktober 2023</a>&nbsp;<span class="post-count" dir="ltr">(3)</span></summary>
      <ul>
        <li><a href="https://metodlangus.github.io/posts/2023/10/podaljsan-vikend-v-dolomitih-28-9-2-10-2023/">Podaljšan vikend v Dolomitih (28. 9. – 2. 10. 2023)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2023/10/piz-boe-3152-m/">Piz Boè (3152 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2023/10/cima-presanella-3556-m/">Cima Presanella (3556 m)</a></li>
      </ul>
    </details>
    <details class="month-group">
      <summary><a href="https://metodlangus.github.io/posts/2023/09/">september 2023</a>&nbsp;<span class="post-count" dir="ltr">(3)</span></summary>
      <ul>
        <li><a href="https://metodlangus.github.io/posts/2023/09/sentiero-alpinistico-claudio-costanzi/">Sentiero Alpinistico Claudio Costanzi</a></li>
        <li><a href="https://metodlangus.github.io/posts/2023/09/giro-del-brenta/">Giro del Brenta</a></li>
        <li><a href="https://metodlangus.github.io/posts/2023/09/crete-di-gleris-monte-chiavals-2098-m/">Crete di Gleris, Monte Chiavals (2098 m)</a></li>
      </ul>
    </details>
    <details class="month-group">
      <summary><a href="https://metodlangus.github.io/posts/2023/08/">avgust 2023</a>&nbsp;<span class="post-count" dir="ltr">(9)</span></summary>
      <ul>
        <li><a href="https://metodlangus.github.io/posts/2023/08/podaljsan-vikend-v-dolomitih-18-21-8-2024/">Podaljšan vikend v Dolomitih  (18. – 21. 8. 2024)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2023/08/antelao-3264-m-kralj-dolomitov/">Antelao (3264 m) - kralj Dolomitov</a></li>
        <li><a href="https://metodlangus.github.io/posts/2023/08/monte-civetta-3220-m/">Monte Civetta (3220 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2023/08/monte-pelmo-3168-m/">Monte Pelmo (3168 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2023/08/za-marijin-praznik-na-veliki-oltar-2621-m/">Za Marijin praznik na Veliki Oltar (2621 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2023/08/misticna-kepa-2145-m/">Mistična Kepa (2145 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2023/08/za-vikend-v-julijce-12-13-8-2023/">Za vikend v Julijce (12. – 13. 8. 2023)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2023/08/planika-triglav-2864-m-savica/">Planika - Triglav (2864 m) - Savica</a></li>
        <li><a href="https://metodlangus.github.io/posts/2023/08/savica-spicje-kanjavceve-police-planika/">Savica - Špičje - Kanjavčeve police - Planika</a></li>
      </ul>
    </details>
    <details class="month-group">
      <summary><a href="https://metodlangus.github.io/posts/2023/07/">julij 2023</a>&nbsp;<span class="post-count" dir="ltr">(1)</span></summary>
      <ul>
        <li><a href="https://metodlangus.github.io/posts/2023/07/izpitna-tura-smer-ogrin-omersa-v-ojstrici-2350-m/">Izpitna tura smer Ogrin-Omersa v Ojstrici (2350 m)</a></li>
      </ul>
    </details>
    <details class="month-group">
      <summary><a href="https://metodlangus.github.io/posts/2023/05/">maj 2023</a>&nbsp;<span class="post-count" dir="ltr">(4)</span></summary>
      <ul>
        <li><a href="https://metodlangus.github.io/posts/2023/05/sardinija-25-4-2-5-2023/">Sardinija  (25. 4. – 2. 5. 2023)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2023/05/olbia/">Olbia</a></li>
        <li><a href="https://metodlangus.github.io/posts/2023/05/ferrata-di-giorre/">Ferrata di Giorré</a></li>
        <li><a href="https://metodlangus.github.io/posts/2023/05/ferrata-della-regina/">Ferrata della Regina</a></li>
      </ul>
    </details>
    <details class="month-group">
      <summary><a href="https://metodlangus.github.io/posts/2023/04/">april 2023</a>&nbsp;<span class="post-count" dir="ltr">(8)</span></summary>
      <ul>
        <li><a href="https://metodlangus.github.io/posts/2023/04/cagliari-sella-del-diavolo/">Cagliari, Sella del Diavolo</a></li>
        <li><a href="https://metodlangus.github.io/posts/2023/04/pedra-longa/">Pedra Longa</a></li>
        <li><a href="https://metodlangus.github.io/posts/2023/04/gola-su-gorropu/">Gola su Gorropu</a></li>
        <li><a href="https://metodlangus.github.io/posts/2023/04/ferrata-di-badde-pentumas/">Ferrata di Badde Pentumas</a></li>
        <li><a href="https://metodlangus.github.io/posts/2023/04/ferrata-degli-angeli-tavolara/">Ferrata degli Angeli (Tavolara)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2023/04/livorno-olbia/">Livorno – Olbia</a></li>
        <li><a href="https://metodlangus.github.io/posts/2023/04/pisa/">Pisa</a></li>
        <li><a href="https://metodlangus.github.io/posts/2023/04/ferata-rocca-di-badolo/">Ferata Rocca di Badolo</a></li>
      </ul>
    </details>
    <details class="month-group">
      <summary><a href="https://metodlangus.github.io/posts/2023/03/">marec 2023</a>&nbsp;<span class="post-count" dir="ltr">(2)</span></summary>
      <ul>
        <li><a href="https://metodlangus.github.io/posts/2023/03/vrtaski-vrh-1898-m-vrtasko-sleme-2077-m/">Vrtaški vrh (1898 m), Vrtaško Sleme (2077 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2023/03/prvi-turni-smuk/">Prvi turni smuk</a></li>
      </ul>
    </details>
  </details>
  <details open>
    <summary><a href="https://metodlangus.github.io/posts/2022/">2022</a>&nbsp;<span class="post-count" dir="ltr">(4)</span></summary>
    <details class="month-group">
      <summary><a href="https://metodlangus.github.io/posts/2022/06/">junij 2022</a>&nbsp;<span class="post-count" dir="ltr">(4)</span></summary>
      <ul>
        <li><a href="https://metodlangus.github.io/posts/2022/06/ledeniska-tura-saas-fee-svica-24-28-6-2022/">Ledeniška tura Saas-Fee (Švica) (24. – 28. 6. 2022)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2022/06/nadelhorn-4327-m/">Nadelhorn (4327 m)</a></li>
        <li><a href="https://metodlangus.github.io/posts/2022/06/saas-fee/">Saas-Fee</a></li>
        <li><a href="https://metodlangus.github.io/posts/2022/06/allalinhorn-4027-m/">Allalinhorn (4027 m)</a></li>
      </ul>
    </details>
  </details>
</aside>`;

  // Add state remembering for all <details>
  document.querySelectorAll("#archive-placeholder details").forEach(function(det, idx) {
    var key = "archive-state-" + idx;

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
