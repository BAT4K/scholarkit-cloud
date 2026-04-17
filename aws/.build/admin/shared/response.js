// ══════════════════════════════════════════════════════════
// Shared API Gateway Response Builders
// Every Lambda response must include CORS headers and
// return the body as a JSON string.
// ══════════════════════════════════════════════════════════

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
};

/** Success response */
function success(body, statusCode = 200) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

/** Error response */
function error(message, statusCode = 500) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify({ message }),
  };
}

/** CORS preflight response */
function options() {
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: '',
  };
}

module.exports = { success, error, options, CORS_HEADERS };
