<?php
function snapshot_url(array $cam): ?string {
    $ip = $cam['ip'];
    $manufacturer = strtolower($cam['manufacturer'] ?? '');
    switch ($manufacturer) {
        case 'hikvision':
            return "http://$ip/ISAPI/Streaming/channels/101/picture?snapshot=now";
        case 'dahua':
            return "http://$ip/cgi-bin/snapshot.cgi";
        case 'bcs':
            return "http://$ip/ISAPI/Streaming/channels/1/picture";
        default:
            return null;
    }
}

function panel_url(array $cam): string {
    return "http://" . $cam['ip'];
}
