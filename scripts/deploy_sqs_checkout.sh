#!/bin/bash
# ══════════════════════════════════════════════════════════
# ScholarKit — Phase 2: SQS Order Decoupling
# ══════════════════════════════════════════════════════════

set -e

REGION="us-east-1"
QUEUE_NAME="ScholarKit-OrderQueue"
ROLE_NAME="ScholarKit-SQSWorkerRole"
FUNCTION_NAME="sk-order-worker"
TABLE_NAME="ScholarKit"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "🚀 Creating SQS Queue: $QUEUE_NAME..."
QUEUE_URL=$(aws sqs create-queue --queue-name "$QUEUE_NAME" --query 'QueueUrl' --output text)
QUEUE_ARN=$(aws sqs get-queue-attributes --queue-url "$QUEUE_URL" --attribute-names QueueArn --query 'Attributes.QueueArn' --output text)
echo "   ✓ Queue ARN: $QUEUE_ARN"

echo "🔐 Creating IAM Role: $ROLE_NAME..."
# Trust policy for Lambda
cat <<EOF > /tmp/trust-policy.json
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

aws iam create-role --role-name "$ROLE_NAME" --assume-role-policy-document file:///tmp/trust-policy.json || echo "   (Role already exists)"

# Permissions policy
cat <<EOF > /tmp/permissions-policy.json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes"
      ],
      "Resource": "$QUEUE_ARN"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:BatchWriteItem",
        "dynamodb:TransactWriteItems"
      ],
      "Resource": [
        "arn:aws:dynamodb:$REGION:$ACCOUNT_ID:table/$TABLE_NAME",
        "arn:aws:dynamodb:$REGION:$ACCOUNT_ID:table/$TABLE_NAME/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
EOF

aws iam put-role-policy --role-name "$ROLE_NAME" --policy-name "ScholarKit-SQSWorkerPolicy" --policy-document file:///tmp/permissions-policy.json

echo "📦 Deploying SQS Worker Lambda: $FUNCTION_NAME..."
# We assume the code is already built and zipped as sk-order-worker.zip
# But we need to make sure the build script includes it.

# For now, we will create the function if it doesn't exist
ROLE_ARN="arn:aws:iam::$ACCOUNT_ID:role/$ROLE_NAME"

# Wait a few seconds for role propagation
sleep 5

aws lambda create-function \
  --function-name "$FUNCTION_NAME" \
  --runtime nodejs24.x \
  --role "$ROLE_ARN" \
  --handler "index.handler" \
  --zip-file "fileb://../aws/deploy/sk-order-worker.zip" \
  --timeout 30 \
  --environment "Variables={SQS_QUEUE_URL=$QUEUE_URL,TABLE_NAME=$TABLE_NAME,SNS_TOPIC_ARN=arn:aws:sns:$REGION:$ACCOUNT_ID:ScholarKit-OrderReceipts}" \
  || aws lambda update-function-configuration --function-name "$FUNCTION_NAME" --role "$ROLE_ARN"

echo "🔗 Attaching SQS to Lambda..."
aws lambda create-event-source-mapping \
  --function-name "$FUNCTION_NAME" \
  --event-source-arn "$QUEUE_ARN" \
  --batch-size 10 \
  || echo "   (Event source mapping already exists)"

echo ""
echo "=========================================================="
echo "✅ SQS Order Infrastructure Deployed!"
echo "=========================================================="
echo "Queue URL: $QUEUE_URL"
echo "Worker:    $FUNCTION_NAME"
echo "=========================================================="
