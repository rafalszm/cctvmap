<?php
session_start();
if (!isset($_SESSION['user'])) {
    header('Location: login.php');
    exit;
}
require_once 'camera_utils.php';
$cams = json_decode(file_get_contents('cameras.json'), true) ?? [];
foreach ($cams as &$cam) {
    $cam['id'] = slugify($cam['name']);
    $cam['snapshot'] = 'snapshot.php?id=' . rawurlencode($cam['id']);
    $cam['panel'] = panel_url($cam);
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>CCTV Map</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.2/css/all.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css" />
<style>
#map{height:80vh;}
.bullet-icon{width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:14px solid red;}
</style>
</head>
<body>
<nav class="navbar navbar-light bg-light px-3">
  <span class="navbar-brand">CCTV Map</span>
  <div class="ms-auto d-flex gap-2">
    <button id="theme-toggle" class="btn btn-outline-secondary"><i id="theme-icon" class="fa-solid fa-moon"></i></button>
    <a class="btn btn-outline-danger" href="logout.php">Logout</a>
  </div>
</nav>
<div id="map"></div>
<script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
const cameras = <?php echo json_encode($cams, JSON_HEX_TAG|JSON_UNESCAPED_SLASHES); ?>;
function getCookie(name){const m=document.cookie.match('(^|;)\\s*'+name+'=([^;]+)');return m?m.pop():'';}
function setTheme(t){document.documentElement.setAttribute('data-bs-theme',t);document.cookie='theme='+t+';path=/';}
document.addEventListener('DOMContentLoaded',()=>{
  const saved=getCookie('theme')||'light';
  setTheme(saved);
  const icon=document.getElementById('theme-icon');
  icon.classList.toggle('fa-sun',saved==='dark');
  icon.classList.toggle('fa-moon',saved!=='dark');
  document.getElementById('theme-toggle').addEventListener('click',()=>{
    const cur=document.documentElement.getAttribute('data-bs-theme');
    const next=cur==='dark'?'light':'dark';
    setTheme(next);
    icon.classList.toggle('fa-sun');
    icon.classList.toggle('fa-moon');
  });
});
const map=L.map('map').setView([cameras[0]?.lat||0,cameras[0]?.lng||0],13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'Map data © OpenStreetMap contributors'}).addTo(map);
function popupHtml(cam){
  return `<div style="max-width:550px;">
    <h6 class="mb-2">${cam.name}</h6>
    <img id="snap_${cam.id}" data-src="${cam.snapshot}" src="${cam.snapshot}" class="img-fluid mb-2">
    <button class="btn btn-sm btn-outline-secondary refresh mb-2" data-id="${cam.id}"><i class="fa-solid fa-arrows-rotate"></i></button>
    <div class="mb-1">IP: <span id="ip_${cam.id}" class="me-1">${cam.ip}</span>
      <button class="btn btn-sm btn-link copy-btn p-0" data-target="ip_${cam.id}"><i class="fa-solid fa-copy"></i></button>
    </div>
    <div class="mb-1">User: <span id="user_${cam.id}" class="me-1">${cam.username}</span>
      <button class="btn btn-sm btn-link copy-btn p-0" data-target="user_${cam.id}"><i class="fa-solid fa-copy"></i></button>
    </div>
    <div class="mb-1">Pass: <span id="pass_${cam.id}" data-value="${cam.password}" class="me-1">••••</span>
      <button class="btn btn-sm btn-link copy-btn p-0" data-target="pass_${cam.id}"><i class="fa-solid fa-copy"></i></button>
      <button class="btn btn-sm btn-link show-btn p-0" data-target="pass_${cam.id}"><i class="fa-solid fa-eye"></i></button>
    </div>
    <a href="${cam.panel}" target="_blank" class="btn btn-sm btn-primary">Panel</a>
  </div>`;
}
function addEvents(container){
  container.querySelectorAll('.copy-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const t=document.getElementById(btn.dataset.target);
      const val=t.dataset.value||t.textContent;navigator.clipboard.writeText(val);
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
}

cameras.forEach(cam=>{
  let marker;
  if((cam.type||'').toLowerCase()==='ptz'){
    marker=L.circleMarker([cam.lat,cam.lng],{radius:8,color:'#0d6efd',fillColor:'#0d6efd',fillOpacity:1}).addTo(map);
  }else{
    const icon=L.divIcon({className:'',html:`<div class="bullet-icon" style="transform:rotate(${cam.direction||0}deg)"></div>`,iconSize:[20,20],iconAnchor:[10,10]});
    marker=L.marker([cam.lat,cam.lng],{icon}).addTo(map);
  }
  marker.bindPopup(popupHtml(cam));
  marker.on('popupopen',e=>addEvents(e.popup.getElement()));
});
</script>
</body>
</html>
