// ══════════════════════════════════════════════════════════
// ScholarKit — Reviews + AI Sentiment Lambda Handler
// ─────────────────────────────────────────────────────────
// Phase 3: Sentiment Analysis Integration
//
// Routes:
//   POST /reviews              → Submit review + sentiment
//   GET  /reviews/:productId   → Get reviews for a product
//   POST /reviews/analyze-all  → Batch-analyse unscored reviews
//
// Strategy:
//   1. Try Amazon Comprehend (real NLP/AI)
//   2. If Comprehend unavailable (SubscriptionRequired, etc.),
//      fall back to a local keyword-based analyzer.
//   Both produce the same API response format.
// ══════════════════════════════════════════════════════════

const { docClient } = require('../shared/dynamo');
const { requireAuth } = require('../shared/auth');
const { success, error, options } = require('../shared/response');
const { TABLE_NAME, keys, ENTITY_TYPES } = require('../shared/tableConfig');
const {
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
  ScanCommand,
} = require('@aws-sdk/lib-dynamodb');

// ── Comprehend (loaded lazily to handle unavailability) ──
let comprehend = null;
let comprehendAvailable = true;  // flip to false on first failure

function getComprehendClient() {
  if (!comprehend) {
    try {
      const { ComprehendClient } = require('@aws-sdk/client-comprehend');
      comprehend = new ComprehendClient({});
    } catch {
      comprehendAvailable = false;
    }
  }
  return comprehend;
}

// ── Handler & Router ────────────────────────────────────

exports.handler = async (event) => {
  const method = event.httpMethod || event.requestContext?.http?.method;
  if (method === 'OPTIONS') return options();

  const path = (event.path || event.rawPath || '').replace(/\/+$/, '');

  try {
    const segments = path.split('/').filter(Boolean);
    const reviewsIdx = segments.indexOf('reviews');
    if (reviewsIdx === -1) return error('Route not found', 404);

    const sub = segments.slice(reviewsIdx + 1);

    // POST /reviews
    if (method === 'POST' && sub.length === 0) {
      const user = requireAuth(event);
      return await submitReview(event, user);
    }

    // POST /reviews/analyze-all  (batch analysis for demo)
    if (method === 'POST' && sub[0] === 'analyze-all') {
      const user = requireAuth(event);
      return await analyzeAllReviews(user);
    }

    // GET /reviews/:productId
    if (method === 'GET' && sub.length === 1) {
      return await getProductReviews(sub[0]);
    }

    return error('Route not found', 404);
  } catch (err) {
    console.error('Reviews Lambda Error:', err);
    if (err.statusCode) return error(err.message, err.statusCode);
    return error(`Internal server error: ${err.name || ''} — ${err.message}`, 500);
  }
};


// ═══════════════════════════════════════════════════════
// SENTIMENT ENGINE — Comprehend → Local Fallback
// ═══════════════════════════════════════════════════════

async function detectSentiment(text) {
  // ── Strategy 1: Amazon Comprehend (real NLP/AI) ──
  if (comprehendAvailable) {
    try {
      const client = getComprehendClient();
      if (client) {
        const { DetectSentimentCommand } = require('@aws-sdk/client-comprehend');
        const result = await client.send(new DetectSentimentCommand({
          Text: text,
          LanguageCode: 'en',
        }));
        return {
          sentiment: result.Sentiment,
          sentimentScore: {
            positive: Math.round(result.SentimentScore.Positive * 10000) / 10000,
            negative: Math.round(result.SentimentScore.Negative * 10000) / 10000,
            neutral:  Math.round(result.SentimentScore.Neutral  * 10000) / 10000,
            mixed:    Math.round(result.SentimentScore.Mixed    * 10000) / 10000,
          },
          engine: 'COMPREHEND',
        };
      }
    } catch (err) {
      console.warn('Comprehend unavailable, using local analyzer:', err.name);
      comprehendAvailable = false;  // Don't retry on future calls
    }
  }

  // ── Strategy 2: Local Keyword-Based Analyzer (fallback) ──
  return localSentimentAnalysis(text);
}


// ═══════════════════════════════════════════════════════
// LOCAL SENTIMENT ANALYZER
// Weighted keyword scoring with 100+ sentiment words.
// Matches Comprehend's output format exactly.
// ═══════════════════════════════════════════════════════

function localSentimentAnalysis(text) {
  const lower = text.toLowerCase();
  const words = lower.split(/\W+/).filter(Boolean);

  const POSITIVE_WORDS = new Set([
    'excellent', 'amazing', 'wonderful', 'fantastic', 'great', 'good', 'love',
    'loves', 'loved', 'loving', 'perfect', 'awesome', 'outstanding', 'superb',
    'brilliant', 'beautiful', 'best', 'happy', 'pleased', 'satisfied',
    'recommend', 'recommended', 'comfortable', 'soft', 'sturdy', 'durable',
    'quality', 'affordable', 'worth', 'nice', 'fine', 'well', 'impressed',
    'delight', 'delighted', 'enjoy', 'enjoyed', 'favorite', 'favourite',
    'breathable', 'stylish', 'elegant', 'premium', 'solid', 'reliable',
  ]);

  const NEGATIVE_WORDS = new Set([
    'terrible', 'awful', 'horrible', 'worst', 'bad', 'poor', 'hate',
    'hated', 'disappointing', 'disappointed', 'waste', 'useless', 'broke',
    'broken', 'cheap', 'flimsy', 'defective', 'damaged', 'uncomfortable',
    'ugly', 'overpriced', 'fell', 'apart', 'loose', 'torn', 'ripped',
    'faded', 'shrunk', 'stain', 'stained', 'return', 'returned', 'refund',
    'regret', 'avoid', 'never', 'worse', 'rubbish', 'junk', 'trash',
  ]);

  const INTENSIFIERS = new Set([
    'very', 'extremely', 'really', 'absolutely', 'completely', 'totally',
    'incredibly', 'highly', 'super', 'so',
  ]);

  const NEGATORS = new Set([
    'not', 'no', 'never', 'neither', 'nobody', 'nothing', 'nowhere',
    'nor', 'cannot', "can't", "don't", "doesn't", "didn't", "won't",
    "wouldn't", "shouldn't", "isn't", "aren't", "wasn't", "weren't",
  ]);

  let positiveScore = 0;
  let negativeScore = 0;
  let isNegated = false;
  let intensity = 1;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // Track negation (flips next sentiment word)
    if (NEGATORS.has(word)) {
      isNegated = true;
      continue;
    }

    // Track intensifiers (boost next sentiment word)
    if (INTENSIFIERS.has(word)) {
      intensity = 1.5;
      continue;
    }

    if (POSITIVE_WORDS.has(word)) {
      if (isNegated) {
        negativeScore += 1 * intensity;
      } else {
        positiveScore += 1 * intensity;
      }
      isNegated = false;
      intensity = 1;
    } else if (NEGATIVE_WORDS.has(word)) {
      if (isNegated) {
        positiveScore += 0.5 * intensity;  // "not bad" is weakly positive
      } else {
        negativeScore += 1 * intensity;
      }
      isNegated = false;
      intensity = 1;
    } else {
      // Reset negation after non-sentiment word (limited scope)
      if (isNegated) isNegated = false;
      intensity = 1;
    }
  }

  // Calculate normalised scores
  const total = positiveScore + negativeScore || 1;
  const posRatio = positiveScore / total;
  const negRatio = negativeScore / total;

  // Determine sentiment label
  let sentiment;
  if (positiveScore === 0 && negativeScore === 0) {
    sentiment = 'NEUTRAL';
  } else if (posRatio > 0.6) {
    sentiment = 'POSITIVE';
  } else if (negRatio > 0.6) {
    sentiment = 'NEGATIVE';
  } else {
    sentiment = 'MIXED';
  }

  // Build Comprehend-compatible score object
  const sentimentScore = {
    positive: 0,
    negative: 0,
    neutral:  0,
    mixed:    0,
  };

  switch (sentiment) {
    case 'POSITIVE':
      sentimentScore.positive = Math.round(posRatio * 10000) / 10000;
      sentimentScore.negative = Math.round(negRatio * 0.3 * 10000) / 10000;
      sentimentScore.neutral  = Math.round((1 - sentimentScore.positive - sentimentScore.negative) * 0.7 * 10000) / 10000;
      sentimentScore.mixed    = Math.round((1 - sentimentScore.positive - sentimentScore.negative - sentimentScore.neutral) * 10000) / 10000;
      break;
    case 'NEGATIVE':
      sentimentScore.negative = Math.round(negRatio * 10000) / 10000;
      sentimentScore.positive = Math.round(posRatio * 0.3 * 10000) / 10000;
      sentimentScore.neutral  = Math.round((1 - sentimentScore.negative - sentimentScore.positive) * 0.7 * 10000) / 10000;
      sentimentScore.mixed    = Math.round((1 - sentimentScore.negative - sentimentScore.positive - sentimentScore.neutral) * 10000) / 10000;
      break;
    case 'MIXED':
      sentimentScore.mixed    = Math.round(0.5 * 10000) / 10000;
      sentimentScore.positive = Math.round(posRatio * 0.4 * 10000) / 10000;
      sentimentScore.negative = Math.round(negRatio * 0.4 * 10000) / 10000;
      sentimentScore.neutral  = Math.round((1 - sentimentScore.mixed - sentimentScore.positive - sentimentScore.negative) * 10000) / 10000;
      break;
    default: // NEUTRAL
      sentimentScore.neutral  = 0.85;
      sentimentScore.positive = 0.05;
      sentimentScore.negative = 0.05;
      sentimentScore.mixed    = 0.05;
  }

  return { sentiment, sentimentScore, engine: 'LOCAL' };
}


// ═══════════════════════════════════════════════════════
// 1. SUBMIT REVIEW + SENTIMENT ANALYSIS
//    Calls Comprehend → falls back to local analyzer
//    Saves the review + results to DynamoDB
// ═══════════════════════════════════════════════════════

async function submitReview(event, user) {
  const body = JSON.parse(event.body || '{}');
  const pid  = body.productId || body.product_id;
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

  // ══ Detect Sentiment (Comprehend or local fallback) ══
  const { sentiment, sentimentScore, engine } = await detectSentiment(text);

  // ══ Save to DynamoDB ══════════════════════════════
  const createdAt = new Date().toISOString();

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
      sentiment,
      sentimentScore,
      sentimentEngine: engine,
      createdAt,
    },
  }));

  return success({
    message: 'Review submitted successfully!',
    product: product.Item.name,
    sentiment,
    sentimentScore,
    engine,
  }, 201);
}


// ═══════════════════════════════════════════════════════
// 2. GET PRODUCT REVIEWS
//    Returns all reviews for a product, sorted newest first
// ═══════════════════════════════════════════════════════

async function getProductReviews(productId) {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
    ExpressionAttributeValues: {
      ':pk':     keys.productPK(productId),
      ':prefix': 'REVIEW#',
    },
  }));

  const reviews = (result.Items || [])
    .map((r) => ({
      user_id:         r.userId,
      product_id:      r.productId,
      review_text:     r.reviewText,
      rating:          r.rating,
      sentiment:       r.sentiment,
      sentiment_score: r.sentimentScore,
      engine:          r.sentimentEngine || 'COMPREHEND',
      created_at:      r.createdAt,
    }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return success(reviews);
}


// ═══════════════════════════════════════════════════════
// 3. BATCH ANALYZE ALL UNSCORED REVIEWS (Demo Utility)
//    Finds reviews with null sentiment, runs analysis
//    on each, and updates DynamoDB in place.
// ═══════════════════════════════════════════════════════

async function analyzeAllReviews(user) {
  if (user.role !== 'admin' && user.role !== 'seller') {
    return error('Access denied.', 403);
  }

  // Scan ALL reviews and filter in code
  const result = await docClient.send(new ScanCommand({
    TableName: TABLE_NAME,
    FilterExpression: 'entityType = :et',
    ExpressionAttributeValues: { ':et': ENTITY_TYPES.REVIEW },
  }));

  // Filter to only reviews without sentiment
  const unscored = (result.Items || []).filter((r) => !r.sentiment);

  if (unscored.length === 0) {
    return success({ message: 'All reviews already have sentiment analysis.', analyzed: 0 });
  }

  const results = [];
  let engineUsed = '';

  for (const review of unscored) {
    // Detect sentiment (Comprehend or local fallback)
    const { sentiment, sentimentScore, engine } = await detectSentiment(review.reviewText);
    engineUsed = engine;

    // Update DynamoDB
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: review.PK, SK: review.SK },
      UpdateExpression: 'SET sentiment = :s, sentimentScore = :sc, sentimentEngine = :e',
      ExpressionAttributeValues: {
        ':s':  sentiment,
        ':sc': sentimentScore,
        ':e':  engine,
      },
    }));

    results.push({
      product_id:      review.productId,
      review_text:     review.reviewText.substring(0, 60) + '...',
      sentiment,
      sentimentScore,
    });
  }

  return success({
    message: `Analyzed ${results.length} reviews with ${engineUsed === 'COMPREHEND' ? 'Amazon Comprehend' : 'Local NLP Engine'}`,
    engine: engineUsed,
    analyzed: results.length,
    results,
  });
}
