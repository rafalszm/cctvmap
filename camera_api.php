<?php
session_start();
if (!isset($_SESSION['user'])) {
    http_response_code(403);
    exit('Forbidden');
}
require_once 'camera_utils.php';
$action = $_POST['action'] ?? '';
$cams = json_decode(file_get_contents('cameras.json'), true) ?? [];
function save_cams($list){
    file_put_contents('cameras.json', json_encode($list, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE));
}
function find_index($cams, $id){
    foreach ($cams as $i => $c) {
        if (slugify($c['name']) === $id) return $i;
    }
    return -1;
}
if ($action === 'delete') {
    $id = $_POST['id'] ?? '';
    $cams = array_values(array_filter($cams, fn($c) => slugify($c['name']) !== $id));
    save_cams($cams);
    echo 'ok';
    exit;
}
if ($action === 'add' || $action === 'update') {
    $cam = json_decode($_POST['camera'] ?? '', true);
    if (!$cam) { http_response_code(400); exit('Invalid data'); }
    $cam['lat'] = floatval($cam['lat']);
    $cam['lng'] = floatval($cam['lng']);
    $cam['direction'] = intval($cam['direction'] ?? 0);
    $id = slugify($cam['name']);
    $idx = find_index($cams, $id);
    if ($idx >= 0) { $cams[$idx] = $cam; }
    else { $cams[] = $cam; }
    save_cams($cams);
    echo 'ok';
    exit;
}
http_response_code(400);
exit('Invalid action');
?>
