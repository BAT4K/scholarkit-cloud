#!/bin/bash

# ══════════════════════════════════════════════════════════
# ScholarKit — Phase 4: Global Edge Delivery
# ─────────────────────────────────────────────────────────
# This script deploys Amazon CloudFront for the S3 Frontend.
# Features: HTTPS, SPA Routing Fallback, OAC Security.
# ══════════════════════════════════════════════════════════

set -e

# Configuration
BUCKET_NAME="scholarkit-frontend"
REGION="us-east-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
TIMESTAMP=$(date +%s)

echo "🚀 Phase 4: Starting CloudFront Deployment..."

# 1. Create Origin Access Control (OAC)
echo "🛡️  Creating Origin Access Control..."
OAC_JSON=$(aws cloudfront create-origin-access-control \
  --origin-access-control-config "Name=ScholarKit-OAC-$TIMESTAMP,Description=OAC for S3,SigningProtocol=sigv4,SigningBehavior=always,OriginAccessControlOriginType=s3")

OAC_ID=$(echo $OAC_JSON | jq -r '.OriginAccessControl.Id')
echo "✅ OAC Created: $OAC_ID"

# 2. Create CloudFront Distribution
echo "🌐 Creating CloudFront Distribution (this may take a few minutes)..."

DIST_CONFIG=$(cat <<EOF
{
  "CallerReference": "scholarkit-web-$TIMESTAMP",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3Origin",
        "DomainName": "$BUCKET_NAME.s3.$REGION.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        },
        "OriginAccessControlId": "$OAC_ID"
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3Origin",
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    },
    "ViewerProtocolPolicy": "redirect-to-https",
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000
  },
  "DefaultRootObject": "index.html",
  "CustomErrorResponses": {
    "Quantity": 2,
    "Items": [
      {
        "ErrorCode": 403,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 10
      },
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 10
      }
    ]
  },
  "Comment": "ScholarKit Phase 4 - Global Edge Delivery",
  "Enabled": true
}
EOF
)

DIST_JSON=$(aws cloudfront create-distribution --distribution-config "$DIST_CONFIG")
DIST_ID=$(echo $DIST_JSON | jq -r '.Distribution.Id')
DIST_DOMAIN=$(echo $DIST_JSON | jq -r '.Distribution.DomainName')
DIST_ARN=$(echo $DIST_JSON | jq -r '.Distribution.ARN')

echo "✅ Distribution Created: $DIST_ID"
echo "🌐 Domain Name: $DIST_DOMAIN"

# 3. Update S3 Bucket Policy (OAC Security)
echo "🔒 Locking down S3 bucket to CloudFront only..."

BUCKET_POLICY=$(cat <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCloudFrontServicePrincipal",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudfront.amazonaws.com"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*",
            "Condition": {
                "StringEquals": {
                    "AWS:SourceArn": "$DIST_ARN"
                }
            }
        }
    ]
}
EOF
)

aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy "$BUCKET_POLICY"
aws s3api put-public-access-block --bucket $BUCKET_NAME --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

echo "✅ S3 Bucket Policy updated and public access blocked."

echo "----------------------------------------------------"
echo "🎉 DEPLOYMENT COMPLETE!"
echo "📍 Domain: https://$DIST_DOMAIN"
echo "----------------------------------------------------"
echo "Note: It may take 10-15 minutes for the distribution to reach 'Deployed' status."
