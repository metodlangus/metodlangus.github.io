const FilterSlideshowModule=(()=>{let config={initPhotos:1,isRelive:false};let initPhotos,isRelive,reloadTimeout;function initializePersistentToggle(buttonId,storageKey){const button=document.getElementById(buttonId);if(!button){console.warn(`Button not found for ID: ${buttonId}`);return;}
let randomizeImages=localStorage.getItem(storageKey);randomizeImages=(randomizeImages===null)?true:(randomizeImages==='true');button.textContent=randomizeImages?'DA':'NE';button.addEventListener('click',()=>{randomizeImages=!randomizeImages;localStorage.setItem(storageKey,randomizeImages);button.textContent=randomizeImages?'DA':'NE';clearTimeout(reloadTimeout);reloadTimeout=setTimeout(()=>location.reload(),2000);});}
function initializePersistentDateRange(startId,endId,storageKeyStart,storageKeyEnd){const startInput=document.getElementById(startId);const endInput=document.getElementById(endId);if(!startInput||!endInput){console.warn(`Date range inputs not found`);return;}
const savedStart=localStorage.getItem(storageKeyStart);const savedEnd=localStorage.getItem(storageKeyEnd);if(savedStart)startInput.value=savedStart;if(savedEnd)endInput.value=savedEnd;[startInput,endInput].forEach(input=>{input.addEventListener('change',()=>{localStorage.setItem(storageKeyStart,startInput.value);localStorage.setItem(storageKeyEnd,endInput.value);clearTimeout(reloadTimeout);reloadTimeout=setTimeout(()=>location.reload(),2000);});});}
function initializePersistentLabelFilter(){const checkboxes=document.querySelectorAll('.label-filter-checkbox');if(!checkboxes.length)return;const savedLabels=JSON.parse(localStorage.getItem('selectedLabels')||'{}');checkboxes.forEach(cb=>{const prefix=cb.dataset.prefix;if(savedLabels[prefix]&&savedLabels[prefix].includes(cb.value)){cb.checked=true;}
cb.addEventListener('change',()=>{const selected={};checkboxes.forEach(c=>{if(c.checked){const p=c.dataset.prefix;if(!selected[p])selected[p]=[];selected[p].push(c.value);}});localStorage.setItem('selectedLabels',JSON.stringify(selected));clearTimeout(reloadTimeout);reloadTimeout=setTimeout(()=>location.reload(),2000);});});}
function toggleSection(id,btn){const el=document.getElementById(id);const icon=btn.querySelector('.arrow-icon');const isHidden=el.style.display==="none";el.style.display=isHidden?"block":"none";icon.textContent=isHidden?"▼":"▶";localStorage.setItem("collapse_"+id,isHidden?"open":"closed");}
function restoreCollapseState(){document.querySelectorAll(".collapse-btn").forEach(btn=>{const match=btn.getAttribute("onclick")?.match(/'(.*?)'/);if(!match)return;const sectionId=match[1];const savedState=localStorage.getItem("collapse_"+sectionId);const sectionEl=document.getElementById(sectionId);const icon=btn.querySelector(".arrow-icon");if(!sectionEl||!icon)return;if(savedState==="open"){sectionEl.style.display="block";icon.textContent="▼";}else{sectionEl.style.display="none";icon.textContent="▶";}});}
function setupClearFiltersButton(){const btn=document.getElementById('clear-filters-btn');if(!btn)return;btn.addEventListener('click',()=>{document.querySelectorAll('.label-filter-checkbox').forEach(cb=>cb.checked=false);localStorage.removeItem('selectedLabels');localStorage.removeItem('startDateRange');localStorage.removeItem('endDateRange');console.log('[filters cleared]');setTimeout(()=>location.reload(),500);});}
function initializePersistentSlider(sliderId,valueDisplayId,storageKey){const slider=document.getElementById(sliderId);const valueDisplay=document.getElementById(valueDisplayId);if(!slider||!valueDisplay){console.warn(`Slider or value display not found for IDs: ${sliderId}, ${valueDisplayId}`);return;}
const specialTitle=isRelive?{"1":"Vse","-1":"Naslovne"}:{"3":"Največ slik","2":"Več slik","1":"Malo slik","0":"Najboljše"};const savedValue=localStorage.getItem(storageKey);const value=savedValue!==null?savedValue:initPhotos;slider.value=value;valueDisplay.textContent=specialTitle[value]||value;slider.addEventListener('input',()=>{const v=slider.value;valueDisplay.textContent=specialTitle[v]||v;localStorage.setItem(storageKey,v);clearTimeout(reloadTimeout);reloadTimeout=setTimeout(()=>location.reload(),2000);});}
function init(userConfig={}){config={...config,...userConfig};initPhotos=config.initPhotos;isRelive=config.isRelive;initializePersistentSlider('photosSliderElement','photosValueElement','photosSliderValue');initializePersistentToggle('toggleRandomButton','randomizeImages');initializePersistentDateRange('startDateInput','endDateInput','startDateRange','endDateRange');restoreCollapseState();initializePersistentLabelFilter();setupClearFiltersButton();}
return{init,toggleSection,initializePersistentLabelFilter,restoreCollapseState,reloadTimeout};})();window.FilterSlideshowModule=FilterSlideshowModule;window.toggleSection=FilterSlideshowModule.toggleSection;const BloggerLabelFilter=(()=>{const prefixTitles={1:"Kategorija",2:"Država",3:"Gorstvo",4:"Časovno",5:"Ostalo",99:"Ostalo"};function extractPrefix(label){const m=label.match(/^(\d+)/);return m?parseInt(m[1],10):99;}
function cleanLabel(label){return label.replace(/^\d+\.\s*/,'');}
function render(groups){const mount=document.getElementById('labelFilterMount');if(!mount)return;let html=`
      <section class='label-filter-section' style='display:flex;flex-direction:column;margin-left:5px;margin-top:15px;'>
        <b>Prikaz slik iz objav z izbranimi oznakami:</b>
    `;Object.keys(groups).sort((a,b)=>a-b).forEach(prefix=>{const labels=groups[prefix].sort((a,b)=>a.localeCompare(b));const title=prefixTitles[prefix]||"Ostalo";const sectionId=`section_${prefix}`;html+=`
        <div style="margin-bottom: 10px;">
          <button type="button" class="collapse-btn"
            onclick="FilterSlideshowModule.toggleSection('${sectionId}', this)"
            style="background:none;border:none;cursor:pointer;font-weight:bold;display:flex;align-items:center;gap:5px;">
            <span class="arrow-icon">▶</span> ${title}
          </button>

          <div id="${sectionId}" style="display:none; margin-top: 5px;">
            <ul class='label-filter-list'>
      `;labels.forEach(raw=>{const clean=cleanLabel(raw);html+=`
          <li>
            <label>
              <input type='checkbox'
                     class='label-filter-checkbox'
                     data-prefix='${prefix}'
                     value='${clean}'> ${clean}
            </label>
          </li>
        `;});html+=`
            </ul>
          </div>
        </div>
      `;});html+=`
      <div style="margin-top: 10px;">
        <button type="button" id="clear-filters-btn"
          style="background:#eee; border:1px solid #ccc; padding:5px 10px; cursor:pointer; border-radius:4px;">
          🗑️ Počisti filtre
        </button>
      </div>
    </section>
    `;mount.innerHTML=html;}
function loadLabels(){const feedUrl='/feeds/posts/default?alt=json&max-results=0';fetch(feedUrl).then(r=>r.json()).then(data=>{const categories=data.feed.category||[];const labels=categories.map(c=>c.term);const groups={};labels.forEach(label=>{const p=extractPrefix(label);if(!groups[p])groups[p]=[];groups[p].push(label);});render(groups);if(window.FilterSlideshowModule?.initializePersistentLabelFilter){FilterSlideshowModule.initializePersistentLabelFilter();}
if(window.FilterSlideshowModule?.restoreCollapseState){FilterSlideshowModule.restoreCollapseState();}
const clearBtn=document.getElementById('clear-filters-btn');if(clearBtn){clearBtn.addEventListener('click',()=>{document.querySelectorAll('.label-filter-checkbox').forEach(cb=>cb.checked=false);localStorage.removeItem('selectedLabels');localStorage.removeItem('startDateRange');localStorage.removeItem('endDateRange');console.log('[filters cleared]');clearTimeout(window.FilterSlideshowModule?.reloadTimeout);window.FilterSlideshowModule.reloadTimeout=setTimeout(()=>location.reload(),2000);});}}).catch(err=>console.error('Label feed error:',err));}
return{init:loadLabels};})();window.BloggerLabelFilter=BloggerLabelFilter;