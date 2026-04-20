#!/bin/bash
set -e

REGION="us-east-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "☁️  Deploying Tri-Cloud Secrets (Phase 3)..."

# Create SSM Parameters for external cloud API keys
echo "Creating /scholarkit/gcp/api_key..."
aws ssm put-parameter \
  --name "/scholarkit/gcp/api_key" \
  --value "YOUR_GCP_API_KEY_HERE" \
  --type "String" \
  --overwrite

echo "Creating /scholarkit/azure/endpoint..."
aws ssm put-parameter \
  --name "/scholarkit/azure/endpoint" \
  --value "https://YOUR_RESOURCE_NAME.cognitiveservices.azure.com" \
  --type "String" \
  --overwrite

echo "Creating /scholarkit/azure/api_key..."
aws ssm put-parameter \
  --name "/scholarkit/azure/api_key" \
  --value "YOUR_AZURE_API_KEY_HERE" \
  --type "String" \
  --overwrite

echo "🔑 Creating IAM Roles for Cross-Cloud Lambdas..."

# Role for GCP Sentiment Lambda
GCP_ROLE_NAME="ScholarKit-GCPSentimentRole"
aws iam create-role \
  --role-name "$GCP_ROLE_NAME" \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Action": "sts:AssumeRole",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Effect": "Allow"
    }]
  }' || true

# Attach policies for DynamoDB, SSM, and logging
aws iam attach-role-policy --role-name "$GCP_ROLE_NAME" --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam put-role-policy \
  --role-name "$GCP_ROLE_NAME" \
  --policy-name "GCP-Lambda-Policy" \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "dynamodb:PutItem",
          "dynamodb:GetItem"
        ],
        "Resource": ["arn:aws:dynamodb:*:*:table/ScholarKit", "arn:aws:dynamodb:*:*:table/ScholarKit/index/*"]
      },
      {
        "Effect": "Allow",
        "Action": "ssm:GetParameter",
        "Resource": "arn:aws:ssm:*:*:parameter/scholarkit/gcp/api_key"
      }
    ]
  }'

# Role for Azure Image Moderation Lambda
AZURE_ROLE_NAME="ScholarKit-AzureModerationRole"
aws iam create-role \
  --role-name "$AZURE_ROLE_NAME" \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Action": "sts:AssumeRole",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Effect": "Allow"
    }]
  }' || true

aws iam attach-role-policy --role-name "$AZURE_ROLE_NAME" --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam put-role-policy \
  --role-name "$AZURE_ROLE_NAME" \
  --policy-name "Azure-Lambda-Policy" \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": "ssm:GetParameter",
        "Resource": [
          "arn:aws:ssm:*:*:parameter/scholarkit/azure/api_key",
          "arn:aws:ssm:*:*:parameter/scholarkit/azure/endpoint"
        ]
      },
      {
        "Effect": "Allow",
        "Action": [
          "s3:GetObject",
          "s3:DeleteObject"
        ],
        "Resource": "arn:aws:s3:::scholarkit-images-*/*"
      }
    ]
  }'

echo "✅ Tri-Cloud Secrets & IAM setup complete!"
