const cameras = JSON.parse(document.getElementById('cameras-data').textContent);
let map;
let lightTiles;
let darkTiles;
const markers={};
let modalMap;
let dragMarker;
const camModal=new bootstrap.Modal(document.getElementById('camModal'));
const delModal=new bootstrap.Modal(document.getElementById('delModal'));
let delId='';

function slugify(text){
  return text.toString().normalize('NFD').replace(/[^\w\s-]/g,'').replace(/[\u0300-\u036f]/g,'')
    .trim().toLowerCase().replace(/\s+/g,'-').replace(/-+/g,'-');
}

function initMap(){
  map=L.map('map');
  lightTiles=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution:'Map data © OpenStreetMap contributors'
  });
  darkTiles=L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{
    attribution:'Map data © OpenStreetMap contributors'
  });
  setTiles(document.documentElement.getAttribute('data-bs-theme')||'light');
  const bounds=cameras.map(c=>[c.lat,c.lng]);
  if(bounds.length){map.fitBounds(bounds);}else{map.setView([0,0],1);}
  cameras.forEach(cam=>addMarker(cam));
}

function addMarker(cam){
  let marker;
  if((cam.type||'').toLowerCase()==='ptz'){
    marker=L.circleMarker([cam.lat,cam.lng],{radius:8,color:'#0d6efd',fillColor:'#0d6efd',fillOpacity:1}).addTo(map);
  }else{
    const icon=L.divIcon({className:'',html:`<div class="bullet-icon" style="transform:rotate(${cam.direction||0}deg)"></div>`,iconSize:[20,20],iconAnchor:[10,10]});
    marker=L.marker([cam.lat,cam.lng],{icon}).addTo(map);
  }
  marker.bindPopup(popupHtml(cam));
  marker.on('popupopen',e=>addEvents(e.popup.getElement()));
  markers[cam.id]=marker;
}

function setTiles(t){
  if(t==='dark'){map.removeLayer(lightTiles);darkTiles.addTo(map);}else{map.removeLayer(darkTiles);lightTiles.addTo(map);}
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

window.onThemeChange=function(t){
  setTiles(t);
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
    modalMap=L.map('editMap');
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'Map data © OpenStreetMap contributors'}).addTo(modalMap);
    dragMarker=L.marker([0,0],{draggable:true}).addTo(modalMap);
    dragMarker.on('dragend',()=>{
      const p=dragMarker.getLatLng();
      document.getElementById('cam-lat').value=p.lat.toFixed(6);
      document.getElementById('cam-lng').value=p.lng.toFixed(6);
    });
  }
  const lat=cam?.lat||0;
  const lng=cam?.lng||0;
  modalMap.setView([lat,lng], cam?16:2);
  dragMarker.setLatLng([lat,lng]);
  document.getElementById('cam-lat').value=lat;
  document.getElementById('cam-lng').value=lng;
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
  fetch('camera_api.php',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({action:existingId?'update':'add',camera:JSON.stringify(cam)})})
    .then(()=>{
      if(existingId){
        const idx=cameras.findIndex(c=>c.id===existingId);
        if(idx>=0){
          markers[existingId].remove();
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

function renderTable(){
  const tbody=document.querySelector('#camTable tbody');
  tbody.innerHTML='';
  cameras.forEach(cam=>{
    const tr=document.createElement('tr');
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
  updateSortIndicators();
  renderTable();
});
