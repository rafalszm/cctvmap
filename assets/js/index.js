const cameras = JSON.parse(document.getElementById('cameras-data').textContent);
let map;
let layerControl;
let baseLayers;
let overlays;
const markers={};
let modalMap;
let dragMarker;
let rotateHandle;
let rotateLine;
const camModal=new bootstrap.Modal(document.getElementById('camModal'));
const delModal=new bootstrap.Modal(document.getElementById('delModal'));
let delId='';

function slugify(text){
  return text.toString().normalize('NFD').replace(/[^\w\s-]/g,'').replace(/[\u0300-\u036f]/g,'')
    .trim().toLowerCase().replace(/\s+/g,'-').replace(/-+/g,'-');
}

function getCookieVal(name){
  const m=document.cookie.match('(^|;)\\s*'+name+'=([^;]+)');
  return m?decodeURIComponent(m.pop()):'';
}

function createIcon(type, dir){
  type=(type||'').toLowerCase();
  let html;
  if(type==='ptz'){
    html='<div class="ptz-icon"></div>';
  }else if(type==='nvr'){
    html='<div class="nvr-icon"></div>';
  }else if(type==='radio'){
    html='<div class="radio-icon"></div>';
  }else{
    html=`<div class="bullet-icon" style="transform:rotate(${dir||0}deg)"></div>`;
  }
  return L.divIcon({className:'',html,iconSize:[20,20],iconAnchor:[10,10]});
}

function initMap(){
  baseLayers={
    'Jasny':L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; OpenStreetMap contributors'}),
    'Ciemny':L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{maxZoom:18,attribution:'&copy; OpenStreetMap contributors'}),
    'Satelita':L.tileLayer.wms('https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS/StandardResolution',{layers:'Raster',format:'image/jpeg',transparent:false,version:'1.1.1',attribution:'&copy; <a href="https://mapy.geoportal.gov.pl">Geoportal.gov.pl - GUGiK</a>'})
  };
  overlays={
    'Adresy Ulice':L.tileLayer.wms('https://mapy.geoportal.gov.pl/wss/ext/KrajowaIntegracjaNumeracjiAdresowej?',{layers:'prg-adresy,prg-ulice,prg-place',format:'image/png',transparent:true,version:'1.1.1',attribution:'&copy; <a href="https://mapy.geoportal.gov.pl">Geoportal.gov.pl - GUGiK</a>'}),
    'Lidar':L.tileLayer.wms('https://mapy.geoportal.gov.pl/wss/service/PZGIK/NMT/GRID1/WMS/ShadedRelief?',{layers:'Raster',format:'image/jpeg',transparent:false,version:'1.1.1',opacity:0.4,attribution:'&copy; <a href="https://mapy.geoportal.gov.pl">Geoportal.gov.pl - GUGiK</a>'}),
    'Ewidencja Gruntów':L.tileLayer.wms('https://integracja.gugik.gov.pl/cgi-bin/KrajowaIntegracjaEwidencjiGruntow?',{layers:'powiaty,powiaty_obreby,zsin,obreby,dzialki,geoportal,numery_dzialek,budynki',format:'image/png',transparent:true,version:'1.3.0',attribution:'&copy; <a href="https://integracja.gugik.gov.pl">GUGiK</a>'})
  };
  const saved=getCookieVal('baseLayer');
  const start=baseLayers[saved]||baseLayers['Jasny'];
  map=L.map('map',{layers:[start]});
  layerControl=L.control.layers(baseLayers,overlays).addTo(map);
  map.on('baselayerchange',e=>{document.cookie='baseLayer='+encodeURIComponent(e.name)+';path=/';});
  const bounds=cameras.map(c=>[c.lat,c.lng]);
  if(bounds.length){map.fitBounds(bounds);}else{map.setView([0,0],1);}
  cameras.forEach(cam=>addMarker(cam));
}

function addMarker(cam){
  const icon=createIcon(cam.type, cam.direction);
  const marker=L.marker([cam.lat,cam.lng],{icon}).addTo(map);
  marker.bindPopup(popupHtml(cam));
  marker.on('popupopen',e=>{addEvents(e.popup.getElement());highlightRow(cam.id);});
  marker.on('popupclose',clearHighlight);
  markers[cam.id]=marker;
}


function popupHtml(cam){
  return `<div style="max-width:500px;">
    <h6 class="mb-2">${cam.name}</h6>
    <img id="snap_${cam.id}" data-src="${cam.snapshot}" src="${cam.snapshot}" alt="${cam.name} snapshot" class="img-fluid rounded mb-2">
    <div class="d-flex justify-content-between mb-2">
      <button class="btn btn-sm btn-outline-secondary refresh" data-id="${cam.id}"><i class="fa-solid fa-arrows-rotate"></i></button>
      <a href="${cam.panel}" target="_blank" class="btn btn-sm btn-outline-primary">Panel</a>
    </div>
    <div class="mb-1">IP: <span id="ip_${cam.id}" class="me-1">${cam.ip}</span>
      <button class="btn btn-sm btn-link copy-btn p-0" data-target="ip_${cam.id}"><i class="fa-solid fa-copy"></i></button>
    </div>
    <div class="mb-1">User: <span id="user_${cam.id}" class="me-1">${cam.username}</span>
      <button class="btn btn-sm btn-link copy-btn p-0" data-target="user_${cam.id}"><i class="fa-solid fa-copy"></i></button>
    </div>
    <div class="mb-2">Pass: <span id="pass_${cam.id}" data-value="${cam.password}" class="me-1">••••</span>
      <button class="btn btn-sm btn-link copy-btn p-0" data-target="pass_${cam.id}"><i class="fa-solid fa-copy"></i></button>
      <button class="btn btn-sm btn-link show-btn p-0" data-target="pass_${cam.id}"><i class="fa-solid fa-eye"></i></button>
    </div>
  </div>`;
}

function addEvents(container){
  container.querySelectorAll('.copy-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const t=document.getElementById(btn.dataset.target);
      const val=t.dataset.value||t.textContent;
      navigator.clipboard.writeText(val);
    });
  });
  container.querySelectorAll('.show-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const t=document.getElementById(btn.dataset.target);
      const eye=btn.querySelector('i');
      if(t.textContent==='••••'){t.textContent=t.dataset.value;eye.classList.replace('fa-eye','fa-eye-slash');}
      else{t.textContent='••••';eye.classList.replace('fa-eye-slash','fa-eye');}
    });
  });
  container.querySelectorAll('.refresh').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const img=document.getElementById('snap_'+btn.dataset.id);
      img.src=img.dataset.src+(img.dataset.src.includes('?')?'&':'?')+'t='+Date.now();
    });
  });
  applyPopupTheme(container);
}

function applyPopupTheme(container){
  const dark=document.documentElement.getAttribute('data-bs-theme')==='dark';
  container.classList.toggle('bg-dark',dark);
  container.classList.toggle('text-white',dark);
}

function refreshOpenPopupTheme(){
  map.eachLayer(l=>{
    if(l instanceof L.Popup && l.isOpen()){
      const el=l.getElement();
      if(el) applyPopupTheme(el);
    }
  });
}

window.onThemeChange=function(){
  refreshOpenPopupTheme();
};

function openAdd(){
  fillForm({});
  document.getElementById('camModalLabel').textContent='Add Camera';
  camModal.show();
  setupModalMap();
}

function openEdit(id){
  const cam=cameras.find(c=>c.id===id);
  if(!cam) return;
  fillForm(cam);
  document.getElementById('camModalLabel').textContent='Edit Camera';
  camModal.show();
  setupModalMap(cam);
}

function confirmDelete(id){
  delId=id;
  delModal.show();
}

function setupModalMap(cam){
  if(!modalMap){
    const bl={
      'Jasny':L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; OpenStreetMap contributors'}),
      'Ciemny':L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{maxZoom:18,attribution:'&copy; OpenStreetMap contributors'}),
      'Satelita':L.tileLayer.wms('https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS/StandardResolution',{layers:'Raster',format:'image/jpeg',transparent:false,version:'1.1.1',attribution:'&copy; <a href="https://mapy.geoportal.gov.pl">Geoportal.gov.pl - GUGiK</a>'})
    };
    const ov={
      'Adresy Ulice':L.tileLayer.wms('https://mapy.geoportal.gov.pl/wss/ext/KrajowaIntegracjaNumeracjiAdresowej?',{layers:'prg-adresy,prg-ulice,prg-place',format:'image/png',transparent:true,version:'1.1.1',attribution:'&copy; <a href="https://mapy.geoportal.gov.pl">Geoportal.gov.pl - GUGiK</a>'}),
      'Lidar':L.tileLayer.wms('https://mapy.geoportal.gov.pl/wss/service/PZGIK/NMT/GRID1/WMS/ShadedRelief?',{layers:'Raster',format:'image/jpeg',transparent:false,version:'1.1.1',opacity:0.4,attribution:'&copy; <a href="https://mapy.geoportal.gov.pl">Geoportal.gov.pl - GUGiK</a>'}),
      'Ewidencja Gruntów':L.tileLayer.wms('https://integracja.gugik.gov.pl/cgi-bin/KrajowaIntegracjaEwidencjiGruntow?',{layers:'powiaty,powiaty_obreby,zsin,obreby,dzialki,geoportal,numery_dzialek,budynki',format:'image/png',transparent:true,version:'1.3.0',attribution:'&copy; <a href="https://integracja.gugik.gov.pl">GUGiK</a>'})
    };
    modalMap=L.map('editMap',{layers:[bl['Jasny']]});
    L.control.layers(bl,ov).addTo(modalMap);
    dragMarker=L.marker([0,0],{draggable:true}).addTo(modalMap);
    dragMarker.on('dragend',()=>{
      const p=dragMarker.getLatLng();
      document.getElementById('cam-lat').value=p.lat.toFixed(6);
      document.getElementById('cam-lng').value=p.lng.toFixed(6);
      placeRotateHandle();
    });
    rotateHandle=L.marker([0,0],{draggable:true,icon:L.divIcon({className:'rotate-handle',iconSize:[12,12],iconAnchor:[6,6]})}).addTo(modalMap);
    rotateHandle.on('drag',updateDirFromHandle);
    rotateHandle.on('dragend',updateDirFromHandle);
    rotateLine=L.polyline([],{color:'#0d6efd',weight:1}).addTo(modalMap);
  }
  const lat=cam?.lat||0;
  const lng=cam?.lng||0;
  modalMap.setView([lat,lng], cam?16:2);
  dragMarker.setLatLng([lat,lng]);
  document.getElementById('cam-lat').value=lat;
  document.getElementById('cam-lng').value=lng;
  document.getElementById('cam-dir').value=cam?.direction||0;
  document.getElementById('cam-type').value=cam?.type||'';
  updateMarkerIcon();
  placeRotateHandle();
  setTimeout(()=>modalMap.invalidateSize(),200);
}

function fillForm(cam){
  document.getElementById('cam-id').value=cam.id||'';
  document.getElementById('cam-name').value=cam.name||'';
  document.getElementById('cam-ip').value=cam.ip||'';
  document.getElementById('cam-user').value=cam.username||'';
  document.getElementById('cam-pass').value=cam.password||'';
  document.getElementById('cam-man').value=cam.manufacturer||'';
  document.getElementById('cam-type').value=cam.type||'';
  document.getElementById('cam-mac').value=cam.mac||'';
  document.getElementById('cam-dir').value=cam.direction||0;
}

function updateMarkerIcon(){
  const type=document.getElementById('cam-type').value;
  const dir=parseInt(document.getElementById('cam-dir').value)||0;
  dragMarker.setIcon(createIcon(type,dir));
}

function placeRotateHandle(){
  if(!rotateHandle) return;
  const dir=parseInt(document.getElementById('cam-dir').value)||0;
  const center=dragMarker.getLatLng();
  const pt=modalMap.project(center);
  const r=40;
  const rad=dir*Math.PI/180;
  const hp=L.point(pt.x + r*Math.sin(rad), pt.y - r*Math.cos(rad));
  const latlng=modalMap.unproject(hp);
  rotateHandle.setLatLng(latlng);
  rotateLine.setLatLngs([center, latlng]);
}

function updateDirFromHandle(){
  const center=dragMarker.getLatLng();
  const cpt=modalMap.project(center);
  const ppt=modalMap.project(rotateHandle.getLatLng());
  const dx=ppt.x-cpt.x;
  const dy=cpt.y-ppt.y;
  let ang=Math.atan2(dx,dy)*180/Math.PI;
  if(ang<0) ang+=360;
  document.getElementById('cam-dir').value=Math.round(ang);
  updateMarkerIcon();
  placeRotateHandle();
}

function saveCam(e){
  e.preventDefault();
  const cam={
    name:document.getElementById('cam-name').value,
    ip:document.getElementById('cam-ip').value,
    username:document.getElementById('cam-user').value,
    password:document.getElementById('cam-pass').value,
    manufacturer:document.getElementById('cam-man').value,
    type:document.getElementById('cam-type').value,
    mac:document.getElementById('cam-mac').value,
    direction:parseInt(document.getElementById('cam-dir').value)||0,
    lat:parseFloat(document.getElementById('cam-lat').value),
    lng:parseFloat(document.getElementById('cam-lng').value)
  };
  const existingId=document.getElementById('cam-id').value;
  cam.id=slugify(cam.name);
  cam.snapshot='snapshot.php?id='+encodeURIComponent(cam.id);
  cam.panel='http://'+cam.ip;
  fetch('camera_api.php',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({action:existingId?'update':'add',camera:JSON.stringify(cam),id:existingId})})
    .then(()=>{
      if(existingId){
        const idx=cameras.findIndex(c=>c.id===existingId);
        if(idx>=0){
          markers[existingId].remove();
          delete markers[existingId];
          cameras[idx]=cam;
        }
      }else{
        cameras.push(cam);
      }
      camModal.hide();
      addMarker(cam);
      renderTable();
    });
}

function deleteCam(){
  fetch('camera_api.php',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({action:'delete',id:delId})})
    .then(()=>{
      const idx=cameras.findIndex(c=>c.id===delId);
      if(idx>=0){
        markers[delId].remove();
        cameras.splice(idx,1);
      }
      delModal.hide();
      renderTable();
    });
}

function openPopup(id){
  const m=markers[id];
  if(m){
    m.openPopup();
    map.panTo(m.getLatLng());
  }
}

function highlightRow(id){
  document.querySelectorAll('#camTable tbody tr').forEach(tr=>{
    tr.classList.toggle('table-info', tr.dataset.id===id);
  });
}

function clearHighlight(){
  document.querySelectorAll('#camTable tbody tr.table-info').forEach(tr=>tr.classList.remove('table-info'));
}

function renderTable(){
  const tbody=document.querySelector('#camTable tbody');
  tbody.innerHTML='';
  cameras.forEach(cam=>{
    const tr=document.createElement('tr');
    tr.dataset.id=cam.id;
    tr.innerHTML=`<td>${cam.name}</td><td>${cam.ip}</td><td>${cam.manufacturer||''}</td><td>
      <button class="btn btn-sm btn-outline-primary open-btn" data-id="${cam.id}">Show</button>
      <button class="btn btn-sm btn-outline-secondary edit-btn" data-id="${cam.id}">Edit</button>
      <button class="btn btn-sm btn-outline-danger del-btn" data-id="${cam.id}">Delete</button>
    </td>`;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('.open-btn').forEach(btn=>{
    btn.addEventListener('click',()=>openPopup(btn.dataset.id));
  });
  tbody.querySelectorAll('.edit-btn').forEach(btn=>btn.addEventListener('click',()=>openEdit(btn.dataset.id)));
  tbody.querySelectorAll('.del-btn').forEach(btn=>btn.addEventListener('click',()=>confirmDelete(btn.dataset.id)));
}

let sortState={key:'',asc:true};
function sortTable(key){
  if(sortState.key===key){
    sortState.asc=!sortState.asc;
  }else{
    sortState={key,asc:true};
  }
  cameras.sort((a,b)=>{
    const res=String(a[key]).localeCompare(String(b[key]));
    return sortState.asc?res:-res;
  });
  updateSortIndicators();
  renderTable();
}

function updateSortIndicators(){
  document.querySelectorAll('#camTable th.sortable').forEach(th=>{
    th.classList.remove('asc','desc');
    if(th.dataset.key===sortState.key){
      th.classList.add(sortState.asc?'asc':'desc');
    }
  });
}

document.addEventListener('DOMContentLoaded',()=>{
  initMap();
  document.querySelectorAll('#camTable th.sortable').forEach(th=>{
    th.addEventListener('click',()=>sortTable(th.dataset.key));
  });
  document.getElementById('add-btn').addEventListener('click',openAdd);
  document.getElementById('camForm').addEventListener('submit',saveCam);
  document.getElementById('delConfirm').addEventListener('click',deleteCam);
  document.getElementById('cam-type').addEventListener('change',()=>{updateMarkerIcon();placeRotateHandle();});
  document.getElementById('cam-dir').addEventListener('input',placeRotateHandle);
  updateSortIndicators();
  renderTable();
});
