#!/bin/bash

# Manual deployment script for AWS Amplify without GitHub integration

set -e

echo "🚀 Starting manual deployment to AWS Amplify"
echo "============================================"

APP_ID="d1zhu9p814ue0j"
BRANCH_NAME="main"
AWS_REGION="us-east-1"

# Build the application
echo "📦 Building the application..."
npm run build

# Create deployment archive
echo "📁 Creating deployment archive..."
zip -r deploy.zip .next package.json package-lock.json public -q

# Upload to S3 (create a temporary bucket for deployment)
BUCKET_NAME="hermes-amplify-deploy-$(date +%s)"
echo "☁️ Creating S3 bucket: $BUCKET_NAME"
aws s3 mb s3://$BUCKET_NAME --region $AWS_REGION

echo "📤 Uploading deployment archive to S3..."
aws s3 cp deploy.zip s3://$BUCKET_NAME/deploy.zip --region $AWS_REGION

# Get the S3 URL
S3_URL="s3://$BUCKET_NAME/deploy.zip"

# Create a branch if it doesn't exist
echo "🌳 Creating/updating branch..."
aws amplify get-branch \
  --app-id "$APP_ID" \
  --branch-name "$BRANCH_NAME" \
  --region $AWS_REGION 2>/dev/null || \
aws amplify create-branch \
  --app-id "$APP_ID" \
  --branch-name "$BRANCH_NAME" \
  --framework "Next.js - SSR" \
  --stage "PRODUCTION" \
  --enable-auto-build \
  --region $AWS_REGION

# Start a deployment job
echo "🚀 Starting deployment job..."
JOB_ID=$(aws amplify start-deployment \
  --app-id "$APP_ID" \
  --branch-name "$BRANCH_NAME" \
  --source-url "$S3_URL" \
  --region $AWS_REGION \
  --query 'jobSummary.jobId' \
  --output text)

echo "✅ Deployment started with Job ID: $JOB_ID"

# Monitor deployment
echo "📊 Monitoring deployment..."
while true; do
    STATUS=$(aws amplify get-job \
        --app-id "$APP_ID" \
        --branch-name "$BRANCH_NAME" \
        --job-id "$JOB_ID" \
        --region $AWS_REGION \
        --query 'job.summary.status' \
        --output text 2>/dev/null || echo "PENDING")

    case $STATUS in
        "SUCCEED")
            echo "✅ Deployment successful!"
            break
            ;;
        "FAILED")
            echo "❌ Deployment failed!"
            # Cleanup S3 bucket
            aws s3 rm s3://$BUCKET_NAME --recursive
            aws s3 rb s3://$BUCKET_NAME
            rm deploy.zip
            exit 1
            ;;
        *)
            echo "⏳ Status: $STATUS"
            sleep 10
            ;;
    esac
done

# Cleanup
echo "🧹 Cleaning up..."
aws s3 rm s3://$BUCKET_NAME --recursive
aws s3 rb s3://$BUCKET_NAME
rm deploy.zip

# Get the app URL
echo ""
echo "============================================"
echo "✅ Deployment Complete!"
echo "🌐 App URL: https://$BRANCH_NAME.d1zhu9p814ue0j.amplifyapp.com"
echo "📊 Console: https://us-east-1.console.aws.amazon.com/amplify/apps/d1zhu9p814ue0j"
echo "============================================"