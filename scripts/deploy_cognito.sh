#!/bin/bash
# ══════════════════════════════════════════════════════════
# Script to create an Amazon Cognito User Pool and Client
# ══════════════════════════════════════════════════════════

set -e

POOL_NAME="ScholarKit-Users"
CLIENT_NAME="ScholarKit-FrontendClient"

echo "Creating Cognito User Pool: $POOL_NAME..."
POOL_ID=$(aws cognito-idp create-user-pool \
  --pool-name "$POOL_NAME" \
  --auto-verified-attributes email \
  --username-attributes email \
  --policies 'PasswordPolicy={MinimumLength=8,RequireUppercase=false,RequireLowercase=false,RequireNumbers=false,RequireSymbols=false}' \
  --query 'UserPool.Id' \
  --output text)

echo "User Pool created with ID: $POOL_ID"

echo "Creating User Pool Client: $CLIENT_NAME..."
CLIENT_ID=$(aws cognito-idp create-user-pool-client \
  --user-pool-id "$POOL_ID" \
  --client-name "$CLIENT_NAME" \
  --explicit-auth-flows "ALLOW_USER_PASSWORD_AUTH" "ALLOW_REFRESH_TOKEN_AUTH" \
  --no-generate-secret \
  --query 'UserPoolClient.ClientId' \
  --output text)

echo "User Pool Client created with ID: $CLIENT_ID"

echo ""
echo "=========================================================="
echo "✅ Cognito Infrastructure Deployed Successfully!"
echo "=========================================================="
echo "UserPoolId: $POOL_ID"
echo "ClientId:   $CLIENT_ID"
echo "=========================================================="
echo "Please add these values to your frontend .env.production / .env file:"
echo "VITE_COGNITO_USER_POOL_ID=$POOL_ID"
echo "VITE_COGNITO_CLIENT_ID=$CLIENT_ID"
echo "=========================================================="
