# Hermes Dispatcher Console

The operational control center for the Hermes ride-sharing platform, providing real-time fleet management, trip orchestration, and multi-tenant support.

## Features

- 🔐 **Multi-Tenant Authentication** - AWS Cognito integration with role-based access control
- 🚗 **Trip Management** - Create, monitor, and manage trips in real-time
- 👥 **Driver Management** - Driver roster, assignment, and performance tracking
- 📊 **Live Dashboard** - Real-time metrics and operational insights
- 🗺️ **Map Integration** - Visual trip and driver tracking with Mapbox
- 📱 **WebSocket Updates** - Real-time status synchronization
- 📈 **Analytics** - KPI dashboards and reporting
- 🔍 **Audit Trail** - Complete action logging and compliance

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **State Management**: Zustand
- **Authentication**: AWS Cognito via Amplify
- **Real-time**: WebSocket connections
- **Maps**: Mapbox GL JS
- **Deployment**: AWS Amplify

## Prerequisites

- Node.js 18+ and npm
- AWS Account with appropriate permissions
- AWS CLI configured (`aws configure`)
- GitHub repository (for Amplify CI/CD)

## Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/hermes-dispatch.git
   cd hermes-dispatch/dispatcher-console
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your AWS and API credentials.

4. **Run development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## Deployment to AWS Amplify

### Option 1: Automated Deployment Script

1. **Configure AWS credentials**:
   ```bash
   aws configure
   ```

2. **Deploy to environment**:
   ```bash
   # Development
   npm run deploy:dev

   # Staging
   npm run deploy:staging

   # Production
   npm run deploy:prod
   ```

### Option 2: AWS Console Deployment

1. **Navigate to AWS Amplify Console**:
   - Go to [AWS Amplify](https://console.aws.amazon.com/amplify)
   - Click "New app" → "Host web app"

2. **Connect repository**:
   - Choose GitHub as your repository provider
   - Authorize AWS Amplify
   - Select `hermes-dispatch` repository
   - Select branch (`main` for production)

3. **Configure build settings**:
   - App name: `hermes-dispatcher-console`
   - Build and test settings will auto-detect from `amplify.yml`
   - Set app root to: `hermes-dispatch/dispatcher-console`

4. **Configure environment variables**:
   ```
   NEXT_PUBLIC_API_GATEWAY_URL=<your-api-gateway-url>
   NEXT_PUBLIC_WEBSOCKET_URL=<your-websocket-url>
   NEXT_PUBLIC_COGNITO_USER_POOL_ID=<your-user-pool-id>
   NEXT_PUBLIC_COGNITO_CLIENT_ID=<your-client-id>
   NEXT_PUBLIC_COGNITO_REGION=us-east-1
   NEXT_PUBLIC_MAPBOX_TOKEN=<your-mapbox-token>
   ```

5. **Deploy**:
   - Click "Save and deploy"
   - Monitor deployment progress in Amplify Console

### Option 3: CDK Deployment

1. **Install CDK dependencies**:
   ```bash
   cd ../../infrastructure
   npm install
   ```

2. **Deploy Amplify stack**:
   ```bash
   npx cdk deploy AmplifyHostingStack \
     --parameters githubOwner=your-org \
     --parameters githubRepo=hermes-dispatch \
     --parameters githubToken=<your-github-token> \
     --parameters environment=production
   ```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_GATEWAY_URL` | REST API endpoint | ✅ |
| `NEXT_PUBLIC_WEBSOCKET_URL` | WebSocket endpoint | ✅ |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | Cognito User Pool ID | ✅ |
| `NEXT_PUBLIC_COGNITO_CLIENT_ID` | Cognito App Client ID | ✅ |
| `NEXT_PUBLIC_COGNITO_REGION` | AWS Region for Cognito | ✅ |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox access token | ⚠️ Optional |
| `NEXT_PUBLIC_ENVIRONMENT` | Environment (dev/staging/production) | ✅ |

## Project Structure

```
dispatcher-console/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/        # React components
│   │   ├── auth/         # Authentication components
│   │   ├── dashboard/    # Dashboard components
│   │   ├── drivers/      # Driver management
│   │   ├── trips/        # Trip management
│   │   └── ui/          # Reusable UI components
│   ├── lib/              # Utilities and contexts
│   ├── services/         # API and WebSocket services
│   ├── store/            # Zustand state management
│   ├── types/            # TypeScript definitions
│   └── utils/            # Helper functions
├── public/               # Static assets
├── amplify.yml          # Amplify build configuration
└── package.json         # Project dependencies
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript compiler check
- `npm run deploy` - Deploy to AWS Amplify
- `npm run deploy:dev` - Deploy to development environment
- `npm run deploy:staging` - Deploy to staging environment
- `npm run deploy:prod` - Deploy to production environment

## Security Considerations

- All API calls require authentication via JWT tokens
- Multi-tenant isolation enforced at API level
- Role-based access control for sensitive operations
- Audit logging for compliance
- HTTPS enforced for all connections
- WebSocket connections use WSS protocol

## Performance Optimizations

- Server-side rendering with Next.js
- Code splitting and lazy loading
- Optimistic UI updates
- WebSocket connection pooling
- Efficient state management with Zustand
- Memoization of expensive computations

## Monitoring

The application includes:
- Real-time error tracking
- Performance monitoring
- User activity tracking
- API call instrumentation
- WebSocket connection health checks

## Troubleshooting

### Build Failures
- Ensure Node.js version is 18+
- Clear cache: `rm -rf .next node_modules`
- Reinstall dependencies: `npm ci`

### Authentication Issues
- Verify Cognito User Pool configuration
- Check CORS settings on API Gateway
- Ensure correct AWS region

### WebSocket Connection Issues
- Verify WebSocket URL includes `wss://` protocol
- Check API Gateway WebSocket configuration
- Review CloudWatch logs for connection errors

## Support

For issues or questions:
- Create an issue in the GitHub repository
- Contact the platform team
- Review CloudWatch logs in AWS Console

## License

Proprietary - Hermes Platform