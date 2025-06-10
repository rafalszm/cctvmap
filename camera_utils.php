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
            // Dahua accepts credentials in the URL like user:pass@host
            return "http://{$user}:{$pass}@{$ip}/cgi-bin/snapshot.cgi?channel=1";
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
