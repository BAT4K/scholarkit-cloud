// ══════════════════════════════════════════════════════════
// Shared DynamoDB Document Client
// Used by all Lambda functions. In the Lambda runtime,
// AWS SDK v3 is pre-installed — no need to bundle it.
// ══════════════════════════════════════════════════════════

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

// Lambda automatically sets AWS_REGION from the function config
const client = new DynamoDBClient({});

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,   // Silently drops undefined attrs
    convertClassInstanceToMap: true,
  },
});

module.exports = { docClient };
