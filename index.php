<?php
session_start();
if (!isset($_SESSION['user'])) {
    header('Location: login.php');
    exit;
}
require_once 'camera_utils.php';
$cfg = include 'config.php';
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
    <button id="add-btn" class="btn btn-outline-success">Add Camera</button>
    <button id="import-btn" class="btn btn-outline-primary">Import CSV</button>
    <button id="theme-toggle" class="btn btn-outline-secondary"><i id="theme-icon" class="fa-solid fa-moon"></i></button>
    <a class="btn btn-outline-danger" href="logout.php">Logout</a>
  </div>
</nav>
<div id="map"></div>
<div id="tableContainer" class="container-fluid mt-3">
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

<!-- Camera modal -->
<div class="modal fade" id="camModal" tabindex="-1">
  <div class="modal-dialog modal-xl modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="camModalLabel">Edit Camera</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <form id="camForm">
          <input type="hidden" id="cam-id">
          <div class="row">
            <div class="col-md-6">
              <div class="mb-3"><label class="form-label">Name</label><input id="cam-name" class="form-control" required></div>
              <div class="mb-3"><label class="form-label">IP</label><input id="cam-ip" class="form-control" required></div>
              <div class="mb-3"><label class="form-label">Username</label><input id="cam-user" class="form-control"></div>
              <div class="mb-3"><label class="form-label">Password</label><input id="cam-pass" class="form-control" type="password"></div>
              <div class="mb-3"><label class="form-label">Manufacturer</label>
                <select id="cam-man" class="form-select">
                  <option value=""></option>
                  <?php foreach ($cfg['manufacturers'] as $m): ?>
                  <option value="<?php echo htmlspecialchars($m); ?>"><?php echo htmlspecialchars($m); ?></option>
                  <?php endforeach; ?>
                </select>
              </div>
              <div class="mb-3"><label class="form-label">Type</label>
                <select id="cam-type" class="form-select">
                  <option value=""></option>
                  <?php foreach ($cfg['types'] as $t): ?>
                  <option value="<?php echo htmlspecialchars($t); ?>"><?php echo htmlspecialchars($t); ?></option>
                  <?php endforeach; ?>
                </select>
              </div>
              <div class="mb-3"><label class="form-label">MAC</label><input id="cam-mac" class="form-control"></div>
              <div class="mb-3"><label class="form-label">Direction</label><input id="cam-dir" type="number" class="form-control" value="0"></div>
            </div>
            <div class="col-md-6">
              <div class="mb-3"><img id="editPreview" class="img-fluid rounded w-100" alt="Preview"></div>
              <div id="editMap" style="height:300px" class="mb-3"></div>
              <div class="mb-3"><label class="form-label">Latitude</label><input id="cam-lat" class="form-control" required></div>
              <div class="mb-3"><label class="form-label">Longitude</label><input id="cam-lng" class="form-control" required></div>
            </div>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="submit" form="camForm" class="btn btn-primary">Save</button>
      </div>
    </div>
  </div>
</div>

<!-- Delete confirm modal -->
<div class="modal fade" id="delModal" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Delete camera?</h5>
      </div>
      <div class="modal-body">Are you sure?</div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">No</button>
        <button type="button" id="delConfirm" class="btn btn-danger">Yes</button>
      </div>
    </div>
  </div>
</div>

<!-- Import modal -->
<div class="modal fade" id="importModal" tabindex="-1">
  <div class="modal-dialog modal-lg modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Import CSV</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <div class="mb-3">
          <input type="file" id="csvFile" accept=".csv" class="form-control">
        </div>
        <div id="mapping" class="row g-2 d-none">
          <div class="col-6 col-md-4"><label class="form-label">Name</label><select data-field="name" class="form-select"></select></div>
          <div class="col-6 col-md-4"><label class="form-label">IP</label><select data-field="ip" class="form-select"></select></div>
          <div class="col-6 col-md-4"><label class="form-label">Username</label><select data-field="username" class="form-select"></select></div>
          <div class="col-6 col-md-4"><label class="form-label">Password</label><select data-field="password" class="form-select"></select></div>
          <div class="col-6 col-md-4"><label class="form-label">Manufacturer</label><select data-field="manufacturer" class="form-select"></select></div>
          <div class="col-6 col-md-4"><label class="form-label">Type</label><select data-field="type" class="form-select"></select></div>
          <div class="col-6 col-md-4"><label class="form-label">MAC</label><select data-field="mac" class="form-select"></select></div>
          <div class="col-6 col-md-4"><label class="form-label">Direction</label><select data-field="direction" class="form-select"></select></div>
          <div class="col-6 col-md-4"><label class="form-label">Latitude</label><select data-field="lat" class="form-select"></select></div>
          <div class="col-6 col-md-4"><label class="form-label">Longitude</label><select data-field="lng" class="form-select"></select></div>
        </div>
        <div id="previewSection" class="mt-3 d-none">
          <table class="table table-sm">
            <thead><tr><th>Name</th><th>IP</th><th>Manufacturer</th><th>Type</th></tr></thead>
            <tbody id="previewBody"></tbody>
          </table>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="button" id="previewImport" class="btn btn-info">Preview</button>
        <button type="button" id="confirmImport" class="btn btn-primary d-none">Save</button>
      </div>
    </div>
  </div>
</div>
<script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/papaparse@5.3.2/papaparse.min.js"></script>
<script id="cameras-data" type="application/json">
<?php echo json_encode($cams, JSON_HEX_TAG|JSON_UNESCAPED_SLASHES); ?>
</script>
<script src="assets/js/theme.js"></script>
<script src="assets/js/index.js"></script>
</body>
</html>
