# Pairing with an OpenClaw Gateway

ClawWork connects to OpenClaw through a Gateway server. This guide walks you through adding a gateway and authenticating your device.

## Prerequisites

- An OpenClaw Gateway instance running and accessible on your network
- ClawWork desktop app installed, or the PWA open in a browser
- The gateway URL (default for local: `ws://127.0.0.1:18789`)

```bash
openclaw gateway start
```

## Adding a Gateway

1. Open ClawWork and go to **Settings** (gear icon in the sidebar)
2. Scroll to the **Gateways** section
3. Click **Add Gateway**
4. Enter a name (e.g. "Local Gateway") and the WebSocket URL
5. Choose an authentication method: **Token**, **Password**, or **Pairing Code**

## Auth: Token

Use a pre-shared API token. Best for automated setups or when an admin has given you a token.

1. Select the **Token** tab in the gateway form
2. Paste the API token provided by your gateway admin
3. Click **Test Connection** to verify
4. Save the gateway configuration

## Auth: Password

Authenticate with a password configured on the gateway.

1. Select the **Password** tab in the gateway form
2. Enter the gateway password
3. Click **Test Connection** to verify
4. Save the gateway configuration

## Auth: Pairing Code

The pairing code flow is the recommended way for first-time device setup. The gateway generates a setup code (a Base64 string) that you can paste or scan as a QR code.

1. Select the **Pairing Code** tab in the gateway form
2. Get the setup code from your gateway admin or the gateway's web UI
3. Paste the setup code — ClawWork will auto-extract the URL and pairing token
4. Click **Start Pairing** to initiate the device pairing request
5. Wait for the gateway admin to approve your device
6. Once approved, ClawWork receives a device token and connects automatically

> The pairing code is one-time use. After your device is approved, ClawWork stores a device token locally and uses it for future connections. If you reset your device identity, you will need to pair again.

## Verifying the Connection

1. After saving, the gateway should show a green **Connected** status in Settings
2. Go back to the main view — you should see the gateway's agents available when creating a new task
3. If the connection fails, check that the gateway URL is reachable and the credentials are correct
