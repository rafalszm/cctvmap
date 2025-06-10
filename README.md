# CCTV Map

This repository contains a minimal example of a CCTV map running locally with PHP, Leaflet and Bootstrap.

## Files

- `cameras.json` – sample camera definitions
- `camera_utils.php` – helper functions for generating snapshot and panel URLs
- `auth.php` – list of allowed users
- `login.php` / `logout.php` – simple authentication
- `index.php` – the map view shown after logging in

## Camera definition

Each camera entry may contain the following fields:

- `id` – unique identifier
- `ip` – address of the device
- `username` / `password` – credentials for the camera
- `manufacturer` – camera vendor (Hikvision, Dahua, BCS)
- `lat` / `lng` – geographic coordinates
- `direction` – orientation in degrees
- `type` – camera type (ptz, bullet, etc.)
- `mac` – optional MAC address

Snapshot and panel URLs are derived at runtime using the helper functions.

## Running

1. Install PHP (only the CLI is required). On Debian/Ubuntu:
   ```sh
   sudo apt-get install php-cli
   ```
2. Start the built-in PHP server from the repository root:
   ```sh
   php -S localhost:8000
   ```
3. Open `http://localhost:8000/login.php` in your browser and log in using the sample credentials (`admin`/`admin`).

## Features

- Leaflet map showing cameras from `cameras.json`
- Manual refresh of snapshots in the camera popups
- Copy-to-clipboard buttons for IP, username and password (password can be shown/hidden)
- Bootstrap theme toggle with the selected option stored in a cookie

The map will load cameras from `cameras.json` and display them with custom markers and popups including the latest snapshot and a link to the camera panel.
