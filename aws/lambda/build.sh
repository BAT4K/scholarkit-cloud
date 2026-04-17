#!/bin/bash
# ══════════════════════════════════════════════════════════
# ScholarKit — Lambda Deployment Packager
# Creates deployment ZIPs for each Lambda function.
#
# Usage:
#   chmod +x lambda/build.sh
#   cd aws && ./lambda/build.sh
#
# Output:  deploy/sk-auth.zip, deploy/sk-products.zip
# ══════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
AWS_DIR="$SCRIPT_DIR/.."
BUILD_DIR="$AWS_DIR/.build"
DEPLOY_DIR="$AWS_DIR/deploy"

echo "╔══════════════════════════════════════════════╗"
echo "║   ScholarKit — Lambda Build & Package        ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Clean previous builds
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR" "$DEPLOY_DIR"

# Functions to package
FUNCTIONS=("auth" "products" "cart" "orders" "admin" "reviews")

for func in "${FUNCTIONS[@]}"; do
  echo "📦 Packaging: sk-$func"

  FUNC_BUILD="$BUILD_DIR/$func"
  mkdir -p "$FUNC_BUILD/shared"

  # ── 1. Copy handler, rewriting import paths for deployment ──
  #    Development: require('../shared/...')
  #    Deployed:    require('./shared/...')
  sed "s|'../shared/|'./shared/|g" "$SCRIPT_DIR/$func/index.js" > "$FUNC_BUILD/index.js"

  # ── 2. Copy shared utilities ──
  cp "$SCRIPT_DIR/shared/dynamo.js"   "$FUNC_BUILD/shared/"
  cp "$SCRIPT_DIR/shared/auth.js"     "$FUNC_BUILD/shared/"
  cp "$SCRIPT_DIR/shared/response.js" "$FUNC_BUILD/shared/"

  # Resolve tableConfig: copy the actual file, not the re-export wrapper
  cp "$AWS_DIR/dynamodb/table-config.js" "$FUNC_BUILD/shared/tableConfig.js"

  # ── 3. Copy runtime dependencies (exclude AWS SDK — it's in Lambda runtime) ──
  if [ -d "$AWS_DIR/node_modules" ]; then
    cp -r "$AWS_DIR/node_modules" "$FUNC_BUILD/"
    rm -rf "$FUNC_BUILD/node_modules/@aws-sdk" \
           "$FUNC_BUILD/node_modules/@smithy" 2>/dev/null || true

    # For reviews function, bundle @aws-sdk/client-comprehend (may not be in runtime)
    if [ "$func" = "reviews" ] && [ -d "$AWS_DIR/node_modules/@aws-sdk/client-comprehend" ]; then
      mkdir -p "$FUNC_BUILD/node_modules/@aws-sdk"
      cp -r "$AWS_DIR/node_modules/@aws-sdk/client-comprehend" "$FUNC_BUILD/node_modules/@aws-sdk/"
      # Copy required @smithy transitive dependencies
      if [ -d "$AWS_DIR/node_modules/@smithy" ]; then
        cp -r "$AWS_DIR/node_modules/@smithy" "$FUNC_BUILD/node_modules/"
      fi
      # Copy required @aws-sdk internal dependencies
      for dep in middleware-host-header middleware-user-agent middleware-retry middleware-serde \
                 middleware-signing middleware-content-length middleware-endpoint config-resolver \
                 node-config-provider hash-node url-parser middleware-stack util-user-agent-node \
                 region-config-resolver protocol-http types util-endpoints credential-provider-node \
                 node-http-handler smithy-client util-stream core client-sso-oidc client-sts \
                 credential-provider-ini credential-provider-process credential-provider-sso \
                 credential-provider-web-identity credential-provider-env token-providers; do
        if [ -d "$AWS_DIR/node_modules/@aws-sdk/$dep" ]; then
          cp -r "$AWS_DIR/node_modules/@aws-sdk/$dep" "$FUNC_BUILD/node_modules/@aws-sdk/"
        fi
      done
    fi
  fi

  # ── 4. Create deployment ZIP ──
  (cd "$FUNC_BUILD" && zip -qr "$DEPLOY_DIR/sk-$func.zip" .)

  SIZE=$(du -h "$DEPLOY_DIR/sk-$func.zip" | cut -f1)
  echo "   ✓ deploy/sk-$func.zip ($SIZE)"
done

echo ""
echo "═══════════════════════════════════════════════"
echo "🎉 Build complete! ZIPs ready in: aws/deploy/"
echo "═══════════════════════════════════════════════"
echo ""
echo "Upload to AWS Lambda (CLI):"
echo ""
for func in "${FUNCTIONS[@]}"; do
  echo "  aws lambda update-function-code \\"
  echo "    --function-name sk-$func \\"
  echo "    --zip-file fileb://deploy/sk-$func.zip"
  echo ""
done
echo "Or upload via the AWS Console → Lambda → Upload .zip"
