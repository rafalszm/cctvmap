<?php
function slugify(string $text): string {
    if (function_exists('iconv')) {
        $text = iconv('UTF-8', 'ASCII//TRANSLIT', $text);
    }
    $text = strtolower($text);
    $text = preg_replace('/[^a-z0-9]+/', '-', $text);
    $text = trim($text, '-');
    return $text ?: 'cam';
}

function snapshot_url(array $cam): ?string {
    $ip = $cam['ip'];
    $manufacturer = strtolower($cam['manufacturer'] ?? '');
    switch ($manufacturer) {
        case 'hikvision':
            return "http://{$ip}/ISAPI/Streaming/Channels/101/picture";
        case 'dahua':
            return "http://{$ip}/cgi-bin/snapshot.cgi?channel=1";
        case 'bcs':
            return "http://{$ip}/ISAPI/Streaming/channels/1/picture";
        default:
            return null;
    }
}

function panel_url(array $cam): string {
    return "http://" . $cam['ip'];
}
?>
