#!/bin/bash
set -e

# Load environment variables
source .env.deploy

BUILD_DIR="../dist"
LOG_FILE="deployment.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Get version from package.json
VERSION=$(cd .. && node -p "require('./package.json').version" 2>/dev/null || echo 'unknown')

# Prompt for deployment comment
echo "Enter deployment comment (or press Enter for default):"
read -r DEPLOY_COMMENT

# Set default if empty
if [ -z "$DEPLOY_COMMENT" ]; then
    DEPLOY_COMMENT="Routine deployment"
fi

# Function to log with timestamp
log() {
    echo "[$TIMESTAMP] $1" | tee -a $LOG_FILE
}

log "Starting deployment of version $VERSION..."
log "Comment: $DEPLOY_COMMENT"
log "Git commit: $(cd .. && git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"

echo "Building application..."
# Run npm from parent directory
(cd .. && npm run build)
log "Build completed successfully"

echo "Uploading to S3..."
aws s3 sync ./$BUILD_DIR s3://$S3_BUCKET_NAME --delete
log "S3 sync completed"

echo "Setting content types..."
aws s3 sync ./$BUILD_DIR s3://$S3_BUCKET_NAME \
  --exclude "*" --include "*.html" \
  --content-type "text/html" --cache-control "no-cache"

aws s3 sync ./$BUILD_DIR s3://$S3_BUCKET_NAME \
  --exclude "*" --include "*.js" \
  --content-type "application/javascript" --cache-control "max-age=31536000"

aws s3 sync ./$BUILD_DIR s3://$S3_BUCKET_NAME \
  --exclude "*" --include "*.css" \
  --content-type "text/css" --cache-control "max-age=31536000"

log "Content types set successfully"

if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
  echo "Invalidating CloudFront cache..."
  INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)
  log "CloudFront invalidation created: $INVALIDATION_ID"
fi

# Create detailed log entry
cat >> $LOG_FILE << EOF

=====================================
Deployment Summary: $TIMESTAMP
Version: $VERSION
Comment: $DEPLOY_COMMENT
Git Commit: $(cd .. && git rev-parse HEAD 2>/dev/null || echo 'unknown')
Branch: $(cd .. && git branch --show-current 2>/dev/null || echo 'unknown')
Build Size: $(du -sh $BUILD_DIR 2>/dev/null | cut -f1 || echo 'unknown')
S3 Bucket: $S3_BUCKET_NAME
CloudFront URL: $CLOUDFRONT_URL
Invalidation ID: ${INVALIDATION_ID:-'N/A'}
Status: SUCCESS
=====================================

EOF

echo "Deployment complete!"
echo "S3 URL: $S3_WEBSITE_URL"
echo "CloudFront URL: $CLOUDFRONT_URL"
if [ -n "$INVALIDATION_ID" ]; then
  echo "Invalidation ID: $INVALIDATION_ID"
fi

log "Deployment completed successfully"
echo "Deployment logged to: deployment/$LOG_FILE"