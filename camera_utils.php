<?php
function snapshot_url(array $cam): ?string {
    $ip = $cam['ip'];
    $user = rawurlencode($cam['username'] ?? '');
    $pass = rawurlencode($cam['password'] ?? '');
    $manufacturer = strtolower($cam['manufacturer'] ?? '');
    switch ($manufacturer) {
        case 'hikvision':
            // Hikvision snapshot endpoint
            return "http://{$user}:{$pass}@{$ip}/ISAPI/Streaming/Channels/101/picture";
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
