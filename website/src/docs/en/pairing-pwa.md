# Using ClawWork PWA

ClawWork PWA is a browser-based version of ClawWork that works on any device — desktop, tablet, or phone. No install required.

## What is ClawWork PWA?

ClawWork PWA (Progressive Web App) shares the same core logic as the desktop app — stores, services, and gateway protocol. It runs entirely in the browser and connects to OpenClaw gateways over WebSocket. Data is stored in IndexedDB instead of SQLite, and device keys are managed in browser storage.

## Opening & Installing

1. Open [cpwa.pages.dev](https://cpwa.pages.dev) in any modern browser (Chrome, Safari, Edge, Firefox)
2. The app loads immediately — no install required
3. To install on mobile: tap the browser's **Add to Home Screen** option
4. To install on desktop: click the install icon in the browser address bar
5. Once installed, ClawWork PWA launches like a native app with offline support

## Connecting to a Gateway

1. Open the app and navigate to **Settings**
2. Add a gateway using the same flow as the desktop app (Token, Password, or Pairing Code)
3. Enter the gateway WebSocket URL — it must be reachable from your browser's network
4. For local gateways (`ws://127.0.0.1:18789`), you need to be on the same machine
5. For remote gateways, use the full URL (e.g. `wss://gateway.example.com:18789`)

## Pairing Code on PWA

The PWA supports the same pairing code flow as the desktop app, with one difference: you paste the setup code manually instead of scanning a QR code.

1. Get the setup code from your gateway admin
2. Paste it into the Pairing Code field — the URL and token are extracted automatically
3. Start the pairing process and wait for admin approval
4. Once approved, the device token is stored in your browser's IndexedDB

## Tips

- The PWA works offline for browsing cached data, but needs a network connection to communicate with gateways
- Browser storage (IndexedDB) is scoped to the domain — clearing browser data will reset your gateway configs and device identity
- For the best mobile experience, install the PWA to your home screen so it runs in full-screen mode
- The PWA and desktop app can connect to the same gateway simultaneously — each gets its own device identity
