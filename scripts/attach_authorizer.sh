#!/bin/bash
set -e

API_ID="dgikeobbx6"
ACCOUNT_ID="439475769950"
USER_POOL_ID="us-east-1_D1Wy8CHhT"
REGION="us-east-1"

echo "Creating Cognito Authorizer..."
AUTHORIZER_ID=$(aws apigateway create-authorizer \
  --rest-api-id $API_ID \
  --name "CognitoAuthorizer" \
  --type COGNITO_USER_POOLS \
  --provider-arns "arn:aws:cognito-idp:$REGION:$ACCOUNT_ID:userpool/$USER_POOL_ID" \
  --identity-source "method.request.header.Authorization" \
  --query 'id' \
  --output text)

echo "Authorizer created with ID: $AUTHORIZER_ID"

# Map of Resource ID -> HTTP Method to protect
declare -A SECURE_ROUTES=(
  ["hwzq76"]="ANY" # /orders
  ["od7ftq"]="ANY" # /orders/{proxy+}
  ["2wagi1"]="ANY" # /cart
  ["4fmgnd"]="ANY" # /cart/{proxy+}
  ["aw3vso"]="ANY" # /admin/{proxy+}
  ["1kkpkq"]="POST" # /admin/generate-upload-url
  ["1uluk9"]="ANY" # /reviews
  ["ymse70"]="ANY" # /reviews/{proxy+}
)

for RESOURCE_ID in "${!SECURE_ROUTES[@]}"; do
  METHOD=${SECURE_ROUTES[$RESOURCE_ID]}
  echo "Securing Resource $RESOURCE_ID ($METHOD)..."
  aws apigateway update-method \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method $METHOD \
    --patch-operations \
      "op=replace,path=/authorizationType,value=COGNITO_USER_POOLS" \
      "op=replace,path=/authorizerId,value=$AUTHORIZER_ID"
done

echo "Deploying API to prod stage..."
aws apigateway create-deployment --rest-api-id $API_ID --stage-name prod

echo "API Gateway Cognito Integration Complete!"
