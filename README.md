# SwissTransfer Direct Link Extractor

A fast, lightweight web application and REST API to extract direct, tokenized S3 download URLs from SwissTransfer share links (`https://www.swisstransfer.com/dl/...`).

Designed for simple UI usage, programmatic integrations, and instant deployment to [Fly.io](https://fly.io).

## Features

- **Modern Glassmorphism UI**: Clean dark-mode interface with single-click copy buttons and direct download access.
- **REST API Endpoints**: Exposes `POST /api/resolve` and `GET /api/resolve?url=...` for integration into external scripts and tools.
- **Password Support**: Extracts direct links from password-protected transfers when a password is provided.
- **Deployable on Fly.io**: Includes `Dockerfile` and `fly.toml` for zero-configuration container deployment.

---

## Local Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run in development mode
npm run dev
# or for production:
npm start
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

---

## REST API Documentation

### `POST /api/resolve`

**Request Body:**
```json
{
  "url": "https://www.swisstransfer.com/dl/01a006f3-ea73-72ac-832d-f16590dd6833",
  "password": "optional-password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transferId": "01a006f3-ea73-72ac-832d-f16590dd6833",
    "sender": "user@example.com",
    "totalSize": 6985,
    "createdAt": 1786823043,
    "expiresAt": 1789416000,
    "files": [
      {
        "id": "01a006f3-ea76-7135-93fd-1aa2e3f2c5e4",
        "fileName": "transfer-demo.zip",
        "size": 6985,
        "mimeType": "application/x-zip-compressed",
        "url": "https://...swisstransfer1.infomaniak.cloud/...?"
      }
    ]
  }
}
```

---

## Deploying to Fly.io

1. **Install Fly CLI** (if not installed):
   ```bash
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   ```

2. **Launch & Deploy**:
   ```bash
   fly launch --now
   ```
   Or deploy updates:
   ```bash
   fly deploy
   ```

## License

MIT
