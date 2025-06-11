<?php
session_start();
if (!isset($_SESSION['user'])) {
    http_response_code(403);
    exit('Forbidden');
}
require_once 'camera_utils.php';
if (isset($_GET['ip'])) {
    $cam = [
        'ip' => $_GET['ip'],
        'manufacturer' => $_GET['manufacturer'] ?? '',
        'username' => $_GET['username'] ?? '',
        'password' => $_GET['password'] ?? '',
    ];
    $url = snapshot_url($cam);
} else {
    $cams = json_decode(file_get_contents('cameras.json'), true) ?? [];
    $id = $_GET['id'] ?? '';
    $cam = null;
    foreach ($cams as $c) {
        if (slugify($c['name']) === $id) { $cam = $c; break; }
    }
    if (!$cam) {
        http_response_code(404);
        exit('Camera not found');
    }
    $url = snapshot_url($cam);
}
if (!$url) {
    http_response_code(500);
    exit('Unsupported camera');
}
if (!function_exists('curl_init')) {
    http_response_code(500);
    exit('Missing cURL extension');
}
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
if (!empty($cam['username']) || !empty($cam['password'])) {
    curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_ANY);
    curl_setopt($ch, CURLOPT_USERPWD, ($cam['username'] ?? '').':' . ($cam['password'] ?? ''));
}
$data = curl_exec($ch);
$ct = curl_getinfo($ch, CURLINFO_CONTENT_TYPE) ?: 'image/jpeg';
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
if ($data === false || $status >= 400) {
    http_response_code(502);
    exit('Failed to fetch snapshot');
}
header('Content-Type: ' . $ct);
header('Cache-Control: no-cache');
echo $data;
?>
