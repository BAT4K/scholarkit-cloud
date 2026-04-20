// ══════════════════════════════════════════════════════════
// ScholarKit — Reviews Lambda Handler
// ─────────────────────────────────────────────────────────
//
// Routes:
//   GET  /reviews/:productId   → Get reviews for a product
// ══════════════════════════════════════════════════════════

const { docClient } = require('../shared/dynamo');
const { success, error, options } = require('../shared/response');
const { TABLE_NAME, keys } = require('../shared/tableConfig');
const { QueryCommand } = require('@aws-sdk/lib-dynamodb');

exports.handler = async (event) => {
  const method = event.httpMethod || event.requestContext?.http?.method;
  if (method === 'OPTIONS') return options();

  const path = (event.path || event.rawPath || '').replace(/\/+$/, '');

  try {
    const segments = path.split('/').filter(Boolean);
    const reviewsIdx = segments.indexOf('reviews');
    if (reviewsIdx === -1) return error('Route not found', 404);

    const sub = segments.slice(reviewsIdx + 1);

    // GET /reviews/:productId
    if (method === 'GET' && sub.length === 1) {
      return await getProductReviews(sub[0]);
    }

    return error('Route not found', 404);
  } catch (err) {
    console.error('Reviews Lambda Error:', err);
    if (err.statusCode) return error(err.message, err.statusCode);
    return error(`Internal server error: ${err.message}`, 500);
  }
};

// ═══════════════════════════════════════════════════════
// GET PRODUCT REVIEWS
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
      engine:          r.sentimentEngine || 'HUGGING_FACE',
      created_at:      r.createdAt,
    }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return success(reviews);
}
