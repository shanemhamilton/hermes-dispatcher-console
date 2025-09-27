# Hermes Dispatcher Console

Operational control center for the Hermes ride-sharing platform.

## Features

- Multi-tenant authentication with AWS Cognito
- Real-time trip management and tracking
- Driver assignment and availability management
- Live dashboard with WebSocket updates
- Analytics and reporting
- Audit trail for compliance

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Deployment

This app is configured for AWS Amplify deployment. See `amplify.yml` for build configuration.

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- AWS Amplify
- Zustand
- WebSocket