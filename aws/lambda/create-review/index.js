// ══════════════════════════════════════════════════════════
// ScholarKit — Azure AI Language Review Sentiment
// ─────────────────────────────────────────────────────────
// Phase 4: Multi-Cloud Integration (AWS + Azure)
// Replaces Hugging Face with Azure AI Language for sentiment
// ══════════════════════════════════════════════════════════

const { SSMClient, GetParametersCommand } = require('@aws-sdk/client-ssm');
const { docClient } = require('../shared/dynamo');
const { requireAuth } = require('../shared/auth');
const { success, error, options } = require('../shared/response');
const { TABLE_NAME, keys, ENTITY_TYPES } = require('../shared/tableConfig');
const { GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

const ssm = new SSMClient({});

async function getAzureSettings() {
  const command = new GetParametersCommand({
    Names: ['/scholarkit/azure_nlp/endpoint', '/scholarkit/azure_nlp/api_key'],
    WithDecryption: true
  });
  const response = await ssm.send(command);
  
  console.log(`Retrieved ${response.Parameters?.length || 0} parameters from SSM.`);
  
  const settings = {};
  (response.Parameters || []).forEach(p => {
    console.log(`Mapping SSM parameter: ${p.Name}`);
    if (p.Name === '/scholarkit/azure_nlp/endpoint') settings.endpoint = p.Value;
    if (p.Name === '/scholarkit/azure_nlp/api_key') settings.apiKey = p.Value;
  });
  
  if (!settings.endpoint || !settings.apiKey) {
    console.error("Missing Azure NLP settings. Found keys:", Object.keys(settings));
    throw new Error('Missing Azure NLP settings in SSM Parameter Store.');
  }
  
  return settings;
}

// Helper to make POST request to Azure AI Language
async function analyzeSentimentAzure(text, endpoint, apiKey) {
  // Ensure endpoint doesn't have trailing slash or https:// if provided as just the host
  const cleanEndpoint = endpoint.replace(/\/+$/, '');
  const baseUrl = cleanEndpoint.startsWith('http') ? cleanEndpoint : `https://${cleanEndpoint}`;
  const url = `${baseUrl}/language/:analyze-text?api-version=2023-04-01`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      kind: 'SentimentAnalysis',
      parameters: {
        modelVersion: 'latest'
      },
      analysisInput: {
        documents: [
          {
            id: '1',
            language: 'en',
            text: text
          }
        ]
      }
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Azure API Error: ${response.status} ${errText}`);
  }

  const result = await response.json();
  return result.results.documents[0];
}

exports.handler = async (event) => {
  const method = event.httpMethod || event.requestContext?.http?.method;
  if (method === 'OPTIONS') return options();

  try {
    const user = requireAuth(event);
    const body = JSON.parse(event.body || '{}');
    
    // Support either path parameters or body
    const pid = event.pathParameters?.id || body.productId || body.product_id;
    const text = body.reviewText || body.review_text;
    const rating = body.rating || null;

    if (!pid || !text) {
      return error('productId and reviewText are required.', 400);
    }

    // Verify product exists
    const product = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: keys.productPK(pid), SK: keys.productSK() },
    }));
    
    if (!product.Item) return error('Product not found.', 404);

    // ── Call Azure AI Language API ──
    let sentimentLabel = 'NEUTRAL';
    let sentimentScoreObj = { positive: 0, negative: 0, neutral: 0, mixed: 0 };
    
    try {
      const { endpoint, apiKey } = await getAzureSettings();
      console.log(`Analyzing sentiment with Azure at endpoint: ${endpoint}`);
      
      const azureResult = await analyzeSentimentAzure(text, endpoint, apiKey);
      console.log("Azure AI Language Result:", JSON.stringify(azureResult, null, 2));

      if (azureResult) {
        sentimentLabel = azureResult.sentiment.toUpperCase(); // POSITIVE, NEGATIVE, NEUTRAL, or MIXED
        
        // Azure returns confidenceScores as { positive, neutral, negative }
        sentimentScoreObj = {
          positive: azureResult.confidenceScores?.positive ?? 0,
          negative: azureResult.confidenceScores?.negative ?? 0,
          neutral:  azureResult.confidenceScores?.neutral ?? 0,
          mixed:    sentimentLabel === 'MIXED' ? Math.max(azureResult.confidenceScores?.positive || 0, azureResult.confidenceScores?.negative || 0) : 0
        };
        console.log(`Mapped Sentiment: ${sentimentLabel}`, sentimentScoreObj);
      }
    } catch (azureErr) {
      console.error("Azure AI Language Error:", azureErr);
      console.warn("Azure NLP failed, falling back to neutral:", azureErr.message);
    }

    const createdAt = new Date().toISOString();

    // ── Save to DynamoDB ──
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK:         keys.productPK(pid),
        SK:         keys.reviewSK(user.id),
        GSI1PK:     keys.userReviewGSI(user.id),
        GSI1SK:     keys.reviewGSI1SK(pid),
        entityType: ENTITY_TYPES.REVIEW,
        userId:     user.id,
        productId:  Number(pid),
        reviewText: text,
        rating,
        sentiment:  sentimentLabel,
        sentimentScore: sentimentScoreObj,
        sentimentEngine: 'AZURE_AI_LANGUAGE',
        createdAt,
      },
    }));

    return success({
      message: 'Review submitted and analyzed via Azure AI Language!',
      product: product.Item.name,
      sentiment: sentimentLabel,
      sentimentScore: sentimentScoreObj,
      engine: 'AZURE_AI_LANGUAGE',
    }, 201);

  } catch (err) {
    console.error('createReview Error:', err);
    if (err.statusCode) return error(err.message, err.statusCode);
    return error(`Internal server error: ${err.message}`, 500);
  }
};

