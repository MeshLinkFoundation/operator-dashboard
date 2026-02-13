# MeshLink Operator Dashboard

A centralized dashboard for monitoring and managing multiple MeshLink broker nodes. Designed to run on the operator's machine and connect to broker nodes over Tailscale.

```
Operator Dashboard (port 4000)         Broker Nodes (port 3000 each)
┌──────────────────────────┐           ┌──────────────────┐
│  React frontend          │   HTTP    │ Pi #1 (Tailscale) │
│  Express server (proxy)  │◄─────────►│ 100.64.x.x:3000  │
│  - aggregates all nodes  │           └──────────────────┘
│  - proxies broker APIs   │           ┌──────────────────┐
│  - manages nodes.json    │   HTTP    │ Pi #2 (Tailscale) │
└──────────────────────────┘◄─────────►│ 100.64.x.x:3000  │
                                       └──────────────────┘
```

## Features

- **Overview** — Aggregate stats across all nodes: total clients, revenue, active sessions, node health
- **Node Detail** — Per-node clients table, session management, analytics, and charts
- **Settings** — Add/edit/remove nodes with connection testing
- **Proxy Architecture** — All broker requests proxied server-side (no CORS issues)
- **Auto-auth** — Caches admin tokens, re-authenticates on 401
- **Graceful Degradation** — Unreachable nodes shown as offline without breaking the dashboard

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts, wouter, React Query |
| Backend | Node.js, Express, TypeScript, ESM |
| Config | `nodes.json` (no database) |

## Quick Start

```bash
npm install
npm run dev
```

Open **http://localhost:4000**. Go to **Settings** and add your first node.

## Adding Nodes

### Via the UI

Settings → Add Node → enter name, broker URL, and admin password → the dashboard tests the connection before saving.

### Via `nodes.json`

Copy the example and edit:

```bash
cp nodes.example.json nodes.json
```

```json
[
  {
    "id": "any-unique-id",
    "name": "Downtown Hub",
    "url": "http://100.64.1.10:3000",
    "adminPassword": "your-admin-password"
  }
]
```

The admin password is the one set in the broker's `server/config/meshlink-config.json` under `admin.password`.

## API

All endpoints are under `/api/dashboard/`:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/nodes` | List configured nodes (no passwords) |
| POST | `/nodes` | Add node (tests connection first) |
| PUT | `/nodes/:id` | Update node |
| DELETE | `/nodes/:id` | Remove node |
| POST | `/nodes/:id/test` | Test node connectivity |
| GET | `/overview` | Aggregated stats across all nodes |
| GET | `/nodes/:id/clients` | Proxy to broker's client list |
| GET | `/nodes/:id/analytics` | Proxy to broker's analytics |
| GET | `/nodes/:id/sessions` | Proxy to broker's sessions |
| DELETE | `/nodes/:id/clients/:ip` | Disconnect a client |
| DELETE | `/nodes/:id/sessions/:sid` | Revoke a session |

## Production Build

```bash
npm run build
npm start
```

## Project Structure

```
operator-dashboard/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── hooks/           # React Query hooks (polling)
│   │   ├── lib/             # API helpers, query client
│   │   └── pages/           # Overview, Node Detail, Settings
│   └── index.html
├── server/
│   ├── index.ts             # Express entry (port 4000)
│   ├── routes.ts            # Dashboard API routes
│   ├── proxy.ts             # Broker HTTP client + auth
│   ├── nodes.ts             # nodes.json CRUD
│   └── vite.ts              # Dev/prod serving
├── shared/
│   └── types.ts             # Shared TypeScript interfaces
├── nodes.json               # Node config (gitignored)
└── nodes.example.json       # Example config
```
