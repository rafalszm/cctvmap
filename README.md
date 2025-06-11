# CCTV Map

This repository contains a minimal example of a CCTV map running locally with PHP, Leaflet and Bootstrap.

## Files

- `cameras.json` – sample camera definitions
- `camera_utils.php` – helper functions for generating snapshot and panel URLs and a small slug helper
- `snapshot.php` – server-side proxy that fetches snapshots to avoid browser cross-origin issues
- `auth.php` – list of allowed users
- `login.php` / `logout.php` – simple authentication
- `index.php` – the map view shown after logging in

## Camera definition

Each camera entry may contain the following fields:

- `name` – human readable name of the device
- `ip` – address of the device
- `username` / `password` – credentials for the camera
- `manufacturer` – camera vendor (Hikvision, Dahua, BCS)
- `lat` / `lng` – geographic coordinates
- `direction` – orientation in degrees
- `type` – camera type (ptz, bullet, etc.)
- `mac` – optional MAC address

The camera ID used internally is derived from `name` by creating a simple slug (lowercase alphanumeric with dashes). Snapshot and panel URLs are built at runtime using the helper functions.

Snapshots are fetched server-side. The helper functions build the vendor-specific URL, and `snapshot.php` retrieves the image using HTTP authentication before serving it to the browser. Examples of the underlying camera endpoints:

- Hikvision: `http://IP/ISAPI/Streaming/Channels/101/picture`
- Dahua: `http://IP/cgi-bin/snapshot.cgi?channel=1`
- BCS (Hikvision compatible): `http://IP/ISAPI/Streaming/channels/1/picture`

## Running

1. Install PHP (only the CLI is required). On Debian/Ubuntu:
   ```sh
   sudo apt-get install php-cli php-curl
   ```
2. Start the built-in PHP server from the repository root:
   ```sh
   php -S localhost:8000
   ```
3. Open `http://localhost:8000/login.php` in your browser and log in using the sample credentials (`admin`/`admin`).

## Features

- Leaflet map showing cameras from `cameras.json`
- Manual refresh of snapshots in the camera popups
- Snapshots are served through `snapshot.php` to prevent browser cross-origin errors
- Copy-to-clipboard buttons for IP, username and password (password can be shown/hidden)
- Bootstrap theme toggle with the selected option stored in a cookie
- **CSV import modal** that lets you map columns from a file, preview the records and merge them into `cameras.json` without creating duplicates

The map will load cameras from `cameras.json` and display them with custom markers and popups including the latest snapshot and a link to the camera panel.
