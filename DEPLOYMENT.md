# Hermes Dispatcher Console - AWS Amplify Deployment Guide

## ✅ Current Status

The Hermes Dispatcher Console has been successfully configured and is ready for deployment to AWS Amplify.

### Completed Setup:
- ✅ Next.js application created with all MVP features
- ✅ AWS Amplify app created (App ID: `d1zhu9p814ue0j`)
- ✅ Environment variables configured
- ✅ Build configuration prepared
- ✅ Deployment scripts ready

## 🚀 Deployment Options

### Option 1: Deploy via AWS Console (Recommended)

1. **Open AWS Amplify Console**:
   ```
   https://us-east-1.console.aws.amazon.com/amplify/apps/d1zhu9p814ue0j
   ```

2. **Connect GitHub Repository**:
   - Click "Connect repository"
   - Choose GitHub as provider
   - Authorize AWS Amplify to access your GitHub account
   - Select your repository (e.g., `hermes-dispatch`)
   - Select branch (`main` for production)

3. **Configure Build Settings**:
   - The app root path should be: `hermes-dispatch/dispatcher-console`
   - Build settings will auto-detect from `amplify.yml`

4. **Deploy**:
   - Click "Save and deploy"
   - Monitor deployment progress

### Option 2: Deploy via GitHub Push

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial dispatcher console implementation"
   ```

2. **Create GitHub Repository**:
   ```bash
   # Create a new repository on GitHub
   # Then add it as remote:
   git remote add origin https://github.com/YOUR_ORG/hermes-dispatch.git
   git push -u origin main
   ```

3. **Connect in Amplify Console**:
   - Go to: https://us-east-1.console.aws.amazon.com/amplify/apps/d1zhu9p814ue0j
   - Click "Connect repository"
   - Select your GitHub repository
   - Authorize and deploy

### Option 3: Manual Deployment (For Testing)

```bash
# Run the manual deployment script
./scripts/manual-deploy.sh
```

## 📝 Environment Variables

The following environment variables have been configured in Amplify:

| Variable | Current Value | Update Required |
|----------|--------------|-----------------|
| `NEXT_PUBLIC_API_GATEWAY_URL` | `https://api.hermes.com` | ✅ Update with actual URL |
| `NEXT_PUBLIC_WEBSOCKET_URL` | `wss://ws.hermes.com` | ✅ Update with actual URL |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | `us-east-1_example` | ✅ Update with actual ID |
| `NEXT_PUBLIC_COGNITO_CLIENT_ID` | `example-client-id` | ✅ Update with actual ID |
| `NEXT_PUBLIC_COGNITO_REGION` | `us-east-1` | ✓ Correct |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Not set | ⚠️ Optional - Add for maps |

### To Update Environment Variables:

```bash
# Update the env-vars.json file with actual values, then run:
aws amplify update-app \
  --app-id "d1zhu9p814ue0j" \
  --environment-variables file://env-vars.json \
  --region us-east-1
```

## 🔗 Important URLs

- **Amplify Console**: https://us-east-1.console.aws.amazon.com/amplify/apps/d1zhu9p814ue0j
- **Application URL** (after deployment): https://main.d1zhu9p814ue0j.amplifyapp.com
- **AWS Account**: 808326308278
- **Region**: us-east-1

## 📋 Pre-Deployment Checklist

Before deploying to production:

1. **Update Environment Variables**:
   - [ ] Get actual Cognito User Pool ID from infrastructure team
   - [ ] Get actual Cognito Client ID
   - [ ] Get API Gateway URL from deployed infrastructure
   - [ ] Get WebSocket URL from deployed infrastructure
   - [ ] (Optional) Add Mapbox token for map features

2. **Infrastructure Dependencies**:
   - [ ] Ensure AWS backend infrastructure is deployed
   - [ ] Verify Cognito User Pool is configured
   - [ ] Confirm API Gateway endpoints are accessible
   - [ ] Test WebSocket connections

3. **GitHub Repository**:
   - [ ] Create GitHub repository if not exists
   - [ ] Push code to repository
   - [ ] Set up branch protection for `main` branch

## 🛠️ Post-Deployment Steps

1. **Verify Deployment**:
   - Check application loads at the Amplify URL
   - Test authentication flow
   - Verify API connections

2. **Configure Custom Domain** (Optional):
   ```bash
   # In Amplify Console, go to Domain Management
   # Add custom domain (e.g., dispatch.hermes.com)
   ```

3. **Set Up Monitoring**:
   - Enable CloudWatch alarms
   - Configure error notifications
   - Set up performance monitoring

4. **Test Critical Flows**:
   - Login with test credentials
   - Create a test trip
   - Verify real-time updates
   - Test driver assignment

## 🚨 Troubleshooting

### Build Failures:
- Check build logs in Amplify Console
- Verify Node.js version compatibility
- Check environment variables are set correctly

### Authentication Issues:
- Verify Cognito configuration matches environment variables
- Check CORS settings on API Gateway
- Ensure Cognito app client settings allow web flow

### API Connection Issues:
- Verify API Gateway URL is correct
- Check CORS configuration
- Test API endpoints independently

## 📞 Support

For deployment assistance:
- AWS Amplify Documentation: https://docs.amplify.aws
- Amplify Support: https://github.com/aws-amplify/amplify-console/issues
- CloudWatch Logs: Check build and runtime logs in AWS Console

## Next Actions Required:

1. **Obtain actual AWS resource IDs** from your infrastructure team:
   - Cognito User Pool ID
   - Cognito Client ID
   - API Gateway URL
   - WebSocket URL

2. **Update environment variables** with actual values

3. **Connect GitHub repository** in Amplify Console

4. **Deploy the application**

The dispatcher console is fully implemented and ready for deployment once you have the actual AWS resource endpoints!