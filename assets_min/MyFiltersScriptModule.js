const FilterSlideshowModule=(()=>{let f={initPhotos:1,isRelive:!1},S,v,s;function y(e,o){const l=document.getElementById(e);if(!l){console.warn(`Button not found for ID: ${e}`);return}let t=localStorage.getItem(o);t=t===null?!0:t==="true",l.textContent=t?"DA":"NE",l.addEventListener("click",()=>{t=!t,localStorage.setItem(o,t),l.textContent=t?"DA":"NE",clearTimeout(s),s=setTimeout(()=>location.reload(),2e3)})}function u(e,o,l,t){const n=document.getElementById(e),a=document.getElementById(o);if(!n||!a){console.warn("Date range inputs not found");return}const m=localStorage.getItem(l),b=localStorage.getItem(t);m&&(n.value=m),b&&(a.value=b),[n,a].forEach(h=>{h.addEventListener("change",()=>{localStorage.setItem(l,n.value),localStorage.setItem(t,a.value),clearTimeout(s),s=setTimeout(()=>location.reload(),2e3)})})}function i(){const e=document.querySelectorAll(".label-filter-checkbox");if(!e.length)return;const o=JSON.parse(localStorage.getItem("selectedLabels")||"{}");e.forEach(l=>{const t=l.dataset.prefix;o[t]&&o[t].includes(l.value)&&(l.checked=!0),l.addEventListener("change",()=>{const n={};e.forEach(a=>{if(a.checked){const m=a.dataset.prefix;n[m]||(n[m]=[]),n[m].push(a.value)}}),localStorage.setItem("selectedLabels",JSON.stringify(n)),clearTimeout(s),s=setTimeout(()=>location.reload(),2e3)})})}function g(e,o){const l=document.getElementById(e),t=o.querySelector(".arrow-icon"),n=l.style.display==="none";l.style.display=n?"block":"none",t.textContent=n?"▼":"▶",localStorage.setItem("collapse_"+e,n?"open":"closed")}function r(){document.querySelectorAll(".collapse-btn").forEach(e=>{const o=e.getAttribute("onclick")?.match(/'(.*?)'/);if(!o)return;const l=o[1],t=localStorage.getItem("collapse_"+l),n=document.getElementById(l),a=e.querySelector(".arrow-icon");!n||!a||(t==="open"?(n.style.display="block",a.textContent="▼"):(n.style.display="none",a.textContent="▶"))})}function d(){const e=document.getElementById("clear-filters-btn");e&&e.addEventListener("click",()=>{document.querySelectorAll(".label-filter-checkbox").forEach(o=>o.checked=!1),localStorage.removeItem("selectedLabels"),localStorage.removeItem("startDateRange"),localStorage.removeItem("endDateRange"),console.log("[filters cleared]"),setTimeout(()=>location.reload(),500)})}function p(e,o,l){const t=document.getElementById(e),n=document.getElementById(o);if(!t||!n){console.warn(`Slider or value display not found for IDs: ${e}, ${o}`);return}const a=v?{1:"Vse","-1":"Naslovne"}:{3:"Največ slik",2:"Več slik",1:"Malo slik",0:"Najboljše"},m=localStorage.getItem(l),b=m!==null?m:S;t.value=b,n.textContent=a[b]||b,t.addEventListener("input",()=>{const h=t.value;n.textContent=a[h]||h,localStorage.setItem(l,h),clearTimeout(s),s=setTimeout(()=>location.reload(),2e3)})}function c(e={}){f={...f,...e},S=f.initPhotos,v=f.isRelive,p("photosSliderElement","photosValueElement","photosSliderValue"),y("toggleRandomButton","randomizeImages"),u("startDateInput","endDateInput","startDateRange","endDateRange"),r(),i(),d()}return{init:c,toggleSection:g,initializePersistentLabelFilter:i,restoreCollapseState:r,reloadTimeout:s}})();window.FilterSlideshowModule=FilterSlideshowModule,window.toggleSection=FilterSlideshowModule.toggleSection;const BloggerLabelFilter=(()=>{const f={1:"Kategorija",2:"Država",3:"Gorstvo",4:"Časovno",5:"Ostalo",99:"Ostalo"};function S(u){const i=u.match(/^(\d+)/);return i?parseInt(i[1],10):99}function v(u){return u.replace(/^\d+\.\s*/,"")}function s(u){const i=document.getElementById("labelFilterMount");if(!i)return;let g=`
      <section class='label-filter-section' style='display:flex;flex-direction:column;margin-left:5px;margin-top:15px;'>
        <b>Prikaz slik iz objav z izbranimi oznakami:</b>
    `;Object.keys(u).sort((r,d)=>r-d).forEach(r=>{const d=u[r].sort((e,o)=>e.localeCompare(o)),p=f[r]||"Ostalo",c=`section_${r}`;g+=`
        <div style="margin-bottom: 10px;">
          <button type="button" class="collapse-btn"
            onclick="FilterSlideshowModule.toggleSection('${c}', this)"
            style="background:none;border:none;cursor:pointer;font-weight:bold;display:flex;align-items:center;gap:5px;">
            <span class="arrow-icon">▶</span> ${p}
          </button>

          <div id="${c}" style="display:none; margin-top: 5px;">
            <ul class='label-filter-list'>
      `,d.forEach(e=>{const o=v(e);g+=`
          <li>
            <label>
              <input type='checkbox'
                     class='label-filter-checkbox'
                     data-prefix='${r}'
                     value='${o}'> ${o}
            </label>
          </li>
        `}),g+=`
            </ul>
          </div>
        </div>
      `}),g+=`
      <div style="margin-top: 10px;">
        <button type="button" id="clear-filters-btn"
          style="background:#eee; border:1px solid #ccc; padding:5px 10px; cursor:pointer; border-radius:4px;">
          🗑️ Počisti filtre
        </button>
      </div>
    </section>
    `,i.innerHTML=g}function y(){fetch("/feeds/posts/default?alt=json&max-results=0").then(i=>i.json()).then(i=>{const r=(i.feed.category||[]).map(c=>c.term),d={};r.forEach(c=>{const e=S(c);d[e]||(d[e]=[]),d[e].push(c)}),s(d),window.FilterSlideshowModule?.initializePersistentLabelFilter&&FilterSlideshowModule.initializePersistentLabelFilter(),window.FilterSlideshowModule?.restoreCollapseState&&FilterSlideshowModule.restoreCollapseState();const p=document.getElementById("clear-filters-btn");p&&p.addEventListener("click",()=>{document.querySelectorAll(".label-filter-checkbox").forEach(c=>c.checked=!1),localStorage.removeItem("selectedLabels"),localStorage.removeItem("startDateRange"),localStorage.removeItem("endDateRange"),console.log("[filters cleared]"),clearTimeout(window.FilterSlideshowModule?.reloadTimeout),window.FilterSlideshowModule.reloadTimeout=setTimeout(()=>location.reload(),2e3)})}).catch(i=>console.error("Label feed error:",i))}return{init:y}})();window.BloggerLabelFilter=BloggerLabelFilter;
