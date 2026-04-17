#!/usr/bin/env node
// ══════════════════════════════════════════════════════════
// ScholarKit — Create DynamoDB Table + GSI
// Run: node dynamodb/create-table.js
//
// Creates the single "ScholarKit" table with:
//   - Composite primary key (PK + SK)
//   - One overloaded GSI (GSI1PK + GSI1SK)
//   - Provisioned capacity within AWS Free Tier limits
//
// Prerequisites:
//   - AWS CLI configured (aws configure) with valid credentials
//   - Or environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
// ══════════════════════════════════════════════════════════

const {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  ResourceInUseException,
} = require('@aws-sdk/client-dynamodb');

const {
  TABLE_NAME,
  PK,
  SK,
  GSI1_NAME,
  GSI1PK,
  GSI1SK,
  AWS_REGION,
} = require('./table-config');

const client = new DynamoDBClient({ region: AWS_REGION });

async function createTable() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   ScholarKit — DynamoDB Table Creator        ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log();

  const params = {
    TableName: TABLE_NAME,

    // ── Key Schema ──────────────────────────────────────
    KeySchema: [
      { AttributeName: PK, KeyType: 'HASH' },   // Partition Key
      { AttributeName: SK, KeyType: 'RANGE' },   // Sort Key
    ],

    // ── Attribute Definitions ───────────────────────────
    // Only define attributes used in keys (PK, SK, GSI keys)
    // DynamoDB is schemaless — all other attributes are flexible
    AttributeDefinitions: [
      { AttributeName: PK, AttributeType: 'S' },
      { AttributeName: SK, AttributeType: 'S' },
      { AttributeName: GSI1PK, AttributeType: 'S' },
      { AttributeName: GSI1SK, AttributeType: 'S' },
    ],

    // ── Global Secondary Index (Overloaded) ─────────────
    GlobalSecondaryIndexes: [
      {
        IndexName: GSI1_NAME,
        KeySchema: [
          { AttributeName: GSI1PK, KeyType: 'HASH' },
          { AttributeName: GSI1SK, KeyType: 'RANGE' },
        ],
        Projection: {
          ProjectionType: 'ALL',  // Project all attributes for flexibility
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,   // Free Tier: up to 25 RCU total
          WriteCapacityUnits: 5,  // Free Tier: up to 25 WCU total
        },
      },
    ],

    // ── Provisioned Throughput (Free Tier Safe) ─────────
    // Table: 5 RCU + 5 WCU
    // GSI1:  5 RCU + 5 WCU
    // Total: 10 RCU + 10 WCU (well within 25/25 free tier)
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  };

  try {
    console.log(`⏳ Creating table "${TABLE_NAME}" in region "${AWS_REGION}"...`);
    console.log(`   Primary Key: ${PK} (HASH) + ${SK} (RANGE)`);
    console.log(`   GSI1:        ${GSI1PK} (HASH) + ${GSI1SK} (RANGE)`);
    console.log(`   Capacity:    Table 5/5  |  GSI1 5/5  |  Total 10/10 RCU/WCU`);
    console.log();

    const result = await client.send(new CreateTableCommand(params));
    console.log(`✅ Table "${TABLE_NAME}" creation initiated!`);
    console.log(`   Status: ${result.TableDescription.TableStatus}`);
    console.log(`   ARN:    ${result.TableDescription.TableArn}`);
    console.log();

    // Poll until table is ACTIVE
    console.log('⏳ Waiting for table to become ACTIVE...');
    await waitForTableActive();
    console.log();
    console.log('🎉 Table is ACTIVE and ready! Run seed-data.js next.');

  } catch (err) {
    if (err instanceof ResourceInUseException || err.name === 'ResourceInUseException') {
      console.log(`⚠️  Table "${TABLE_NAME}" already exists.`);

      // Check current status
      const desc = await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
      const status = desc.Table.TableStatus;
      console.log(`   Status: ${status}`);
      console.log(`   ARN:    ${desc.Table.TableArn}`);
      console.log(`   Items:  ${desc.Table.ItemCount}`);
      console.log();

      if (status === 'ACTIVE') {
        console.log('✅ Table is ACTIVE. You can run seed-data.js directly.');
      } else {
        console.log(`⏳ Table is ${status}. Wait for it to become ACTIVE before seeding.`);
      }
    } else {
      console.error('❌ Error creating table:', err.message);
      console.error();
      console.error('Common fixes:');
      console.error('  1. Run "aws configure" to set up credentials');
      console.error('  2. Set AWS_REGION environment variable');
      console.error('  3. Ensure your IAM user has dynamodb:CreateTable permission');
      process.exit(1);
    }
  }
}

async function waitForTableActive(maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    const desc = await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    const status = desc.Table.TableStatus;

    if (status === 'ACTIVE') {
      console.log(`   ✓ Table status: ACTIVE (after ${i + 1} checks)`);
      return;
    }

    process.stdout.write(`   … Status: ${status} (check ${i + 1}/${maxRetries})\r`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error('Table did not become ACTIVE within timeout.');
}

// Run
createTable();
