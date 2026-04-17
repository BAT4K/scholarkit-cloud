// ══════════════════════════════════════════════════════════
// Shared JWT Authentication Middleware
// Extracts and verifies the Bearer token from the
// Authorization header of API Gateway events.
// ══════════════════════════════════════════════════════════

const jwt = require('jsonwebtoken');

/**
 * Verify JWT from event headers. Returns decoded payload or null.
 */
function verifyToken(event) {
  const headers = event.headers || {};
  // API Gateway normalises header names to lowercase in HTTP API (v2),
  // but preserves case in REST API (v1). Handle both.
  const authHeader = headers.Authorization || headers.authorization;
  if (!authHeader) return null;

  const token = authHeader.replace(/^Bearer\s+/i, '');
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * Require a valid token. Throws a structured error if missing/invalid,
 * which the handler's catch block converts into a 401 response.
 */
function requireAuth(event) {
  const user = verifyToken(event);
  if (!user) {
    const err = new Error('Unauthorized');
    err.statusCode = 401;
    throw err;
  }
  return user;
}

module.exports = { verifyToken, requireAuth };
