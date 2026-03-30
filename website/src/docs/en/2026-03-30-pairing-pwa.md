---
title: Using ClawWork PWA (Mobile)
description: Install ClawWork PWA on Android and iOS via browser, pair with QR code
date: 2026-03-30
---

# Using ClawWork PWA (Mobile)

ClawWork is most powerful on desktop. For mobile, we provide a unified PWA that you can install directly from the browser on Android and iOS.

## Installation

1. Open [cpwa.pages.dev](https://cpwa.pages.dev) in your mobile browser
2. Use the browser's **Add to Home Screen** option to install
3. Once installed, it launches like a native app from your home screen

## Offline First

ClawWork PWA is a purely offline app. After the initial load, it does not connect to any external services other than the OpenClaw gateway.

The app is hosted on Cloudflare Pages and auto-builds from the code repository. When a new version is released, you need to manually tap update in the mobile **Settings** — the app only contacts the cloud when you tap update.

## Pairing

First-time use requires pairing with the desktop app via QR code:

1. In ClawWork Desktop, find the **Pair with Mobile** feature
2. Select the gateway to connect, and the desktop app will generate a QR code
3. Scan the QR code with your phone
4. Confirm authorization in OpenClaw, and pairing is complete

If you select **Sync Device** when generating the QR code, messages will stay in sync between your phone and desktop.

## Currently Supported Features

- Multiple parallel sessions
- View task execution progress
- Approval notifications

Contributions are welcome.
