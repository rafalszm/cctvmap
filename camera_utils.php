<?php
function snapshot_url(array $cam): ?string {
    $ip = $cam['ip'];
    $user = $cam['username'] ?? '';
    $pass = $cam['password'] ?? '';
    $manufacturer = strtolower($cam['manufacturer'] ?? '');
    switch ($manufacturer) {
        case 'hikvision':
            // Hikvision uses the ISAPI endpoint with HTTP basic auth
            return "http://{$user}:{$pass}@{$ip}/ISAPI/Streaming/channels/101/picture?snapshot=now";
        case 'dahua':
            // Dahua allows credentials via query parameters
            return "http://{$ip}/cgi-bin/snapshot.cgi?channel=1&user={$user}&password={$pass}";
        case 'bcs':
            // Many BCS devices implement Hikvision's ISAPI
            return "http://{$user}:{$pass}@{$ip}/ISAPI/Streaming/channels/1/picture";
        default:
            return null;
    }
}

function panel_url(array $cam): string {
    return "http://" . $cam['ip'];
}
