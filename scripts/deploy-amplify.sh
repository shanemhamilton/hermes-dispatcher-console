#!/bin/bash

# Hermes Dispatcher Console - AWS Amplify Deployment Script

set -e

echo "🚀 Starting Hermes Dispatcher Console Deployment to AWS Amplify"
echo "=================================================="

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI is not configured. Please configure AWS credentials first."
    exit 1
fi

# Get AWS account ID and region
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=${AWS_REGION:-us-east-1}
APP_NAME="hermes-dispatcher-console"
BRANCH_NAME=${BRANCH_NAME:-main}
ENVIRONMENT=${ENVIRONMENT:-production}

echo "📋 Deployment Configuration:"
echo "  - AWS Account: $AWS_ACCOUNT_ID"
echo "  - Region: $AWS_REGION"
echo "  - App Name: $APP_NAME"
echo "  - Branch: $BRANCH_NAME"
echo "  - Environment: $ENVIRONMENT"
echo ""

# Create Amplify App if it doesn't exist
echo "📱 Creating/Updating Amplify App..."
APP_ID=$(aws amplify list-apps --region $AWS_REGION --query "apps[?name=='$APP_NAME'].appId" --output text 2>/dev/null || echo "")

if [ -z "$APP_ID" ]; then
    echo "Creating new Amplify app..."
    APP_ID=$(aws amplify create-app \
        --name "$APP_NAME" \
        --description "Hermes Dispatcher Console - Operational Control Center" \
        --repository "https://github.com/your-org/hermes-dispatch" \
        --platform "WEB" \
        --enable-branch-auto-build \
        --enable-branch-auto-deletion \
        --region $AWS_REGION \
        --query 'app.appId' \
        --output text)
    echo "✅ Created Amplify app with ID: $APP_ID"
else
    echo "✅ Found existing Amplify app with ID: $APP_ID"
fi

# Set environment variables
echo "🔐 Setting environment variables..."
aws amplify update-app \
    --app-id "$APP_ID" \
    --environment-variables \
        "NEXT_PUBLIC_ENVIRONMENT=$ENVIRONMENT" \
        "AMPLIFY_DIFF_DEPLOY=false" \
        "AMPLIFY_MONOREPO_APP_ROOT=hermes-dispatch/dispatcher-console" \
        "_CUSTOM_IMAGE=amplify:al2023" \
    --build-spec "$(cat amplify.yml)" \
    --region $AWS_REGION > /dev/null

echo "✅ Environment variables set"

# Create or update branch
echo "🌳 Setting up branch: $BRANCH_NAME..."
BRANCH_EXISTS=$(aws amplify get-branch --app-id "$APP_ID" --branch-name "$BRANCH_NAME" --region $AWS_REGION 2>/dev/null || echo "")

if [ -z "$BRANCH_EXISTS" ]; then
    echo "Creating new branch..."
    aws amplify create-branch \
        --app-id "$APP_ID" \
        --branch-name "$BRANCH_NAME" \
        --enable-auto-build \
        --framework "Next.js - SSR" \
        --stage "$ENVIRONMENT" \
        --region $AWS_REGION > /dev/null
    echo "✅ Created branch: $BRANCH_NAME"
else
    echo "✅ Branch already exists: $BRANCH_NAME"
fi

# Start deployment
echo "🚀 Starting deployment..."
JOB_ID=$(aws amplify start-deployment \
    --app-id "$APP_ID" \
    --branch-name "$BRANCH_NAME" \
    --region $AWS_REGION \
    --query 'jobSummary.jobId' \
    --output text)

echo "✅ Deployment started with Job ID: $JOB_ID"

# Monitor deployment
echo "📊 Monitoring deployment progress..."
while true; do
    STATUS=$(aws amplify get-job \
        --app-id "$APP_ID" \
        --branch-name "$BRANCH_NAME" \
        --job-id "$JOB_ID" \
        --region $AWS_REGION \
        --query 'job.summary.status' \
        --output text)

    case $STATUS in
        "SUCCEED")
            echo "✅ Deployment successful!"
            break
            ;;
        "FAILED")
            echo "❌ Deployment failed!"
            exit 1
            ;;
        "RUNNING"|"PENDING")
            echo "⏳ Deployment in progress... (Status: $STATUS)"
            sleep 10
            ;;
        *)
            echo "⚠️ Unknown status: $STATUS"
            sleep 10
            ;;
    esac
done

# Get the app URL
APP_URL=$(aws amplify get-app \
    --app-id "$APP_ID" \
    --region $AWS_REGION \
    --query 'app.defaultDomain' \
    --output text)

echo ""
echo "=================================================="
echo "✅ Deployment Complete!"
echo "🌐 App URL: https://$BRANCH_NAME.$APP_URL"
echo "📊 Amplify Console: https://$AWS_REGION.console.aws.amazon.com/amplify/apps/$APP_ID"
echo "=================================================="