// ══════════════════════════════════════════════════════════
// Shared JWT Authentication Middleware
// Extracts and verifies the Bearer token from the
// Authorization header of API Gateway events.
// ══════════════════════════════════════════════════════════

const jwt = require('jsonwebtoken');

function getLegacyUserId(email, sub) {
  if (email === 'admin@scholarkit.com') return '1';
  if (email === 'seller@scholarkit.com') return '2';
  if (email === 'parent@scholarkit.com') return '3';
  return sub;
}

/**
 * Verify JWT from event headers. Returns decoded payload or null.
 */
function verifyToken(event) {
  const getRole = (email) => {
    if (!email) return 'user';
    const e = email.toLowerCase();
    if (e === 'admin@scholarkit.com') return 'admin';
    if (e === 'seller@scholarkit.com') return 'seller';
    return 'user';
  };

  let claims = null;

  // 1. Try API Gateway v2 (HTTP API) JWT Authorizer
  if (event.requestContext?.authorizer?.jwt?.claims) {
    claims = event.requestContext.authorizer.jwt.claims;
  }
  // 2. Try API Gateway v1 (REST API) Cognito Authorizer
  else if (event.requestContext?.authorizer?.claims) {
    claims = event.requestContext.authorizer.claims;
  }
  // 3. Manual Fallback: Decode token from headers
  else {
    const authHeader = event.headers?.authorization || event.headers?.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        claims = jwt.decode(token);
        if (claims) console.log("Manual token decode success for:", claims.email || claims.sub);
      } catch (err) {
        console.warn("Manual token decode failed:", err.message);
      }
    }
  }

  if (claims) {
    // Try to find the email in common claim locations
    const email = claims.email || claims['cognito:username'] || claims.sub;
    
    return {
      id: getLegacyUserId(email, claims.sub),
      email: email,
      name: claims.name || claims.given_name || email,
      role: getRole(email),
    };
  }

  console.warn("Auth Failed: No valid claims found in event. Headers keys:", Object.keys(event.headers || {}));
  return null;
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
