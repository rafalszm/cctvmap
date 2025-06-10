<?php
session_start();
if (!isset($_SESSION['user'])) {
    header('Location: login.php');
    exit;
}
require_once 'camera_utils.php';
$cams = json_decode(file_get_contents('cameras.json'), true) ?? [];
foreach ($cams as &$cam) {
    $cam['snapshot'] = snapshot_url($cam);
    $cam['panel'] = panel_url($cam);
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>CCTV Map</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css" />
<style>#map{height:80vh;}</style>
</head>
<body>
<nav class="navbar navbar-light bg-light">
  <div class="container-fluid">
    <span class="navbar-brand">CCTV Map</span>
    <a class="btn btn-outline-danger" href="logout.php">Logout</a>
  </div>
</nav>
<div id="map"></div>
<script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
const cameras = <?php echo json_encode($cams, JSON_HEX_TAG|JSON_UNESCAPED_SLASHES); ?>;

const map = L.map('map').setView([cameras[0]?.lat || 0, cameras[0]?.lng || 0], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data © OpenStreetMap contributors'
}).addTo(map);

cameras.forEach(cam => {
  const marker = L.marker([cam.lat, cam.lng]).addTo(map);
  const popup = `
    <strong>${cam.id}</strong><br>
    <img src="${cam.snapshot}" width="200"><br>
    IP: ${cam.ip}<br>
    User: ${cam.username}<br>
    Pass: ${cam.password}<br>
    <a href="${cam.panel}" target="_blank">Panel</a>
  `;
  marker.bindPopup(popup);
});
</script>
</body>
</html>
