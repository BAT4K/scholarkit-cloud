#!/bin/bash
# ══════════════════════════════════════════════════════════
# Automated Deployment Script for S3 Presigned URL Lambda
# ══════════════════════════════════════════════════════════

set -e

# ==========================================================
# 1. Configuration Variables
# ==========================================================
# Fill these in with your actual AWS values before running!
BUCKET_NAME="scholarkit-images-bat4k"
REGION="us-east-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ROLE_NAME="ScholarKit-S3UploadLambdaRole"
FUNCTION_NAME="ScholarKit-GenerateUploadUrl"

echo "Deploying to AWS Region: $REGION"
echo "Target S3 Bucket: $BUCKET_NAME"
echo ""

# ==========================================================
# 2. S3 CORS Configuration
# ==========================================================
echo "⚙️  Configuring S3 CORS..."
cat <<EOF > cors.json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["PUT", "POST", "GET"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": ["ETag"]
    }
  ]
}
EOF

aws s3api put-bucket-cors \
  --bucket "$BUCKET_NAME" \
  --cors-configuration file://cors.json \
  --region "$REGION"

rm cors.json
echo "✅ S3 CORS configuration applied successfully."
echo ""

# ==========================================================
# 3. Create IAM Execution Role
# ==========================================================
echo "🔐 Setting up IAM Role: $ROLE_NAME..."

cat <<EOF > trust-policy.json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "lambda.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Try to create the role. If it exists, ignore the error.
aws iam create-role \
  --role-name "$ROLE_NAME" \
  --assume-role-policy-document file://trust-policy.json 2>/dev/null || echo "Role already exists, proceeding..."

# Attach Basic Execution Role for CloudWatch Logs
aws iam attach-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"

# Create inline policy for S3 PutObject permission specific to the bucket
cat <<EOF > s3-put-policy.json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:PutObjectAcl"],
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name "S3PutObjectPolicy" \
  --policy-document file://s3-put-policy.json

rm trust-policy.json s3-put-policy.json
echo "✅ IAM Role configured."
echo "Waiting 10 seconds for IAM propagation..."
sleep 10
echo ""

# ==========================================================
# 4. Package the Lambda Function
# ==========================================================
echo "📦 Packaging Lambda function..."
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
AWS_DIR="$SCRIPT_DIR/../aws"
BUILD_DIR="$AWS_DIR/.build/uploadImage"

# Clean and recreate build directory
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/shared"

# Copy handler and replace relative path to shared folder so it works natively in Lambda root
sed "s|'../shared/|'./shared/|g" "$AWS_DIR/lambda/admin/generateUploadUrl.js" > "$BUILD_DIR/index.js"

# Copy shared resources
cp "$AWS_DIR/lambda/shared/auth.js" "$BUILD_DIR/shared/"
cp "$AWS_DIR/lambda/shared/response.js" "$BUILD_DIR/shared/"

# Install dependencies (AWS SDK)
cd "$BUILD_DIR"
npm init -y > /dev/null
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner jsonwebtoken > /dev/null

# Zip it up
ZIP_FILE="$AWS_DIR/deploy/upload-deployment.zip"
mkdir -p "$AWS_DIR/deploy"
rm -f "$ZIP_FILE"
zip -qr "$ZIP_FILE" .

echo "✅ Lambda packaged at $ZIP_FILE"
echo ""

# ==========================================================
# 5. Deploy the Lambda Function
# ==========================================================
echo "🚀 Deploying Lambda function: $FUNCTION_NAME..."
ROLE_ARN="arn:aws:iam::$ACCOUNT_ID:role/$ROLE_NAME"

# Check if function exists
if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" > /dev/null 2>&1; then
    echo "Updating existing function..."
    aws lambda update-function-code \
      --function-name "$FUNCTION_NAME" \
      --zip-file fileb://"$ZIP_FILE" \
      --region "$REGION" | grep LastModified
    
    # Update environment variables if needed
    aws lambda update-function-configuration \
      --function-name "$FUNCTION_NAME" \
      --environment "Variables={S3_BUCKET_NAME=$BUCKET_NAME}" \
      --region "$REGION" > /dev/null
else
    echo "Creating new function..."
    aws lambda create-function \
      --function-name "$FUNCTION_NAME" \
      --runtime nodejs18.x \
      --role "$ROLE_ARN" \
      --handler "index.handler" \
      --zip-file fileb://"$ZIP_FILE" \
      --environment "Variables={S3_BUCKET_NAME=$BUCKET_NAME}" \
      --region "$REGION" | grep FunctionArn
fi

echo ""
echo "🎉 Deployment Script Finished!"
echo "Function $FUNCTION_NAME is ready in AWS."
