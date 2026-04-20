// ══════════════════════════════════════════════════════════
// ScholarKit — Azure AI Vision Image Moderation
// ─────────────────────────────────────────────────────────
// Phase 3: Tri-Cloud Integration (AWS + Azure)
// Triggered by S3 ObjectCreated event.
// ══════════════════════════════════════════════════════════

const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const { S3Client, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { 
  DynamoDBDocumentClient, 
  ScanCommand, 
  DeleteCommand 
} = require('@aws-sdk/lib-dynamodb');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const https = require('https');

const ssm = new SSMClient({});
const s3 = new S3Client({});
const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);
const TABLE_NAME = process.env.TABLE_NAME || 'ScholarKit';

async function getAzureConfig() {
  const [endpointParam, keyParam] = await Promise.all([
    ssm.send(new GetParameterCommand({ Name: '/scholarkit/azure/endpoint', WithDecryption: true })),
    ssm.send(new GetParameterCommand({ Name: '/scholarkit/azure/api_key', WithDecryption: true }))
  ]);
  return {
    endpoint: endpointParam.Parameter.Value,
    apiKey: keyParam.Parameter.Value
  };
}

// Helper to analyze image using Azure Vision API
function analyzeImageAzure(imageUrl, endpoint, apiKey) {
  return new Promise((resolve, reject) => {
    // Note: Azure Cognitive Services Vision API v3.2 format
    const data = JSON.stringify({ url: imageUrl });
    
    // endpoint includes https://...
    const url = new URL(`${endpoint}/vision/v3.2/analyze?visualFeatures=Adult,Tags`);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`Azure API Error: ${res.statusCode} ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

exports.handler = async (event) => {
  console.log("Received S3 event:", JSON.stringify(event, null, 2));

  try {
    const record = event.Records[0];
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    console.log(`Processing image s3://${bucket}/${key}`);

    // 1. Fetch Azure config from SSM
    const { endpoint, apiKey } = await getAzureConfig();

    // 2. Generate presigned URL for Azure to read
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 900 });

    // 3. Send to Azure AI Vision
    const analysis = await analyzeImageAzure(presignedUrl, endpoint, apiKey);
    console.log("Azure Analysis Result:", JSON.stringify(analysis, null, 2));

    // 4. Moderation logic
    const ALLOWED_CATEGORIES = [
      'clothing', 'shirt', 'pants', 'uniform', 'shoe', 'footwear', 
      'bag', 'backpack', 'apparel', 'accessory', 'socks', 'skirt',
      'dress', 'garment', 'sneakers', 'outerwear'
    ];

    let shouldDelete = false;
    let reason = '';

    // Check A: Adult/Safety Content
    if (analysis.adult) {
      if (analysis.adult.isAdultContent || analysis.adult.isRacyContent || analysis.adult.isGoryContent) {
        shouldDelete = true;
        reason = "Adult/Racy/Gory content detected.";
      }
    }

    // Check B: Business Rule - Product Category
    if (!shouldDelete) {
      const topTags = analysis.tags ? analysis.tags.filter(t => t.confidence > 0.6) : [];
      const hasAllowedTag = topTags.some(t => ALLOWED_CATEGORIES.includes(t.name.toLowerCase()));
      
      if (!hasAllowedTag) {
        shouldDelete = true;
        const mainSubject = topTags.length > 0 ? topTags[0].name : "Unknown Subject";
        reason = `Invalid Product Category: Detected '${mainSubject}', which is not an allowed school category.`;
      }
    }
    
    if (shouldDelete) {
      console.warn(`[MODERATION FLAG] Deleting image ${key}. Reason: ${reason}`);
      
      // 1. Delete from S3
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      console.log(`Successfully deleted s3://${bucket}/${key}`);

      // 2. Cleanup DynamoDB (Compensating Transaction)
      // Deriving the URL that would be in the DB
      const imageUrl = `https://${bucket}.s3.amazonaws.com/${key}`;
      const imageUrlVariant = `https://${bucket}.s3.us-east-1.amazonaws.com/${key}`;

      console.log(`Searching for product record with image: ${imageUrl}`);
      
      const scanResult = await docClient.send(new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'imageUrl = :u1 OR imageUrl = :u2',
        ExpressionAttributeValues: { ':u1': imageUrl, ':u2': imageUrlVariant }
      }));

      if (scanResult.Items?.length > 0) {
        for (const item of scanResult.Items) {
          await docClient.send(new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { PK: item.PK, SK: item.SK }
          }));
          console.log(`Deleted orphaned product record: ${item.PK}`);
        }
      } else {
        console.log("No matching product record found in DynamoDB to delete.");
      }
    } else {
      console.log(`[MODERATION PASSED] Image ${key} is safe and matches an allowed product category.`);
    }

    return { statusCode: 200, body: 'Moderation complete.' };

  } catch (err) {
    console.error('Image Moderation Error:', err);
    throw err; // allow Lambda to retry if needed
  }
};
