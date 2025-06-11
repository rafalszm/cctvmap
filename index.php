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
<link rel="stylesheet" href="assets/css/styles.css">
</head>
<body>
<nav class="navbar navbar-light px-3">
  <span class="navbar-brand">CCTV Map</span>
  <div class="ms-auto d-flex gap-2">
    <button id="theme-toggle" class="btn btn-outline-secondary"><i id="theme-icon" class="fa-solid fa-moon"></i></button>
    <a class="btn btn-outline-danger" href="logout.php">Logout</a>
  </div>
</nav>
<div id="map"></div>
<div class="container-fluid mt-3">
  <table id="camTable" class="table table-striped table-sm">
    <thead>
      <tr>
        <th scope="col" data-key="name" class="sortable">Name</th>
        <th scope="col" data-key="ip" class="sortable">IP</th>
        <th scope="col" data-key="manufacturer" class="sortable">Manufacturer</th>
        <th scope="col">Actions</th>
      </tr>
    </thead>
    <tbody></tbody>
  </table>
</div>
<script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js"></script>
<script id="cameras-data" type="application/json">
<?php echo json_encode($cams, JSON_HEX_TAG|JSON_UNESCAPED_SLASHES); ?>
</script>
<script src="assets/js/theme.js"></script>
<script src="assets/js/index.js"></script>
</body>
</html>
