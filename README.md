# otdr-viewer

OTDR Viewer is a desktop application which allows you to open and display information from Bellcore SOR files.

It's currently at an early state, but can display key events, traces, and other information from SOR files.

## Architecture

OTDR Viewer uses the [otdrs](https://github.com/JamesHarrison/otdrs) library to decode SOR files and extract information in a standards-compliant manner.

The application itself is a Rust based desktop app using the Tauri framework, and uses the Vue Javascript framework to do most of the work involved with displaying traces.

## Accuracy of information

OTDR data contains *numerous* vendor specific quirks about data storage and interpretation.

Currently, no management of these quirks is implemented. As such, data may not be accurate in the sense of your interpretation matching the vendor's. However, OTDR Viewer attempts to be as accurate *technically* as possible; maths is mostly done in Rust for performance and precision, and data is generally passed through without alteration other than that required by the standard.

See the `otdrs` docs for more information on SOR file parsing.

## Developing and building

If you want to hack on this, great!

Install `npm` or `yarn` and Rust (e.g. with `rustup`).

Install the Tauri CLI with `yarn add -D @tauri-apps/cli` or see the Tauri [docs](https://tauri.app/v1/guides/getting-started/setup/vite).

After this you should be able to run `yarn tauri dev` to run the app from git.

The underlying `otdrs` library does most of the SOR-related heavy lifting, so start there if you want to improve how SORs get decoded or want to make something SOR-related that isn't a desktop app.

## License

GPLv3 has been selected specifically to drive improved open source engagement with equipment manufacturers and developers of OTDR processing software in an industry that has struggled with open data exchange, proprietary (and vendor-locked) software, and poor maintenance of existing software.

otdr-viewer - a SOR file viewer
Copyright (C) 2022 James Harrison

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
