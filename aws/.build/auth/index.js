// ══════════════════════════════════════════════════════════
// ScholarKit — Auth Lambda Handler
// ─────────────────────────────────────────────────────────
// Replaces: backend/controllers/authController.js
//
// Routes:
//   POST /auth/register   → Create account
//   POST /auth/login      → Authenticate & get JWT
//
// DynamoDB Access Patterns:
//   Register → GSI1 Query (EMAIL#<email>) + PutItem (USER#)
//   Login    → GSI1 Query (EMAIL#<email>)
// ══════════════════════════════════════════════════════════

const { docClient } = require('./shared/dynamo');
const { success, error, options } = require('./shared/response');
const { TABLE_NAME, GSI1_NAME, keys, ENTITY_TYPES } = require('./shared/tableConfig');
const { QueryCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ── Handler & Router ────────────────────────────────────

exports.handler = async (event) => {
  const method = event.httpMethod || event.requestContext?.http?.method;
  if (method === 'OPTIONS') return options();

  const path = (event.path || event.rawPath || '').replace(/\/+$/, '');

  try {
    if (method === 'POST' && path.endsWith('/register')) return await register(event);
    if (method === 'POST' && path.endsWith('/login'))    return await login(event);
    return error('Route not found', 404);
  } catch (err) {
    console.error('Auth Lambda Error:', err);
    return error(err.message || 'Internal server error', err.statusCode || 500);
  }
};

// ── Register ────────────────────────────────────────────

async function register(event) {
  const body = JSON.parse(event.body || '{}');
  const { name, email, password, role } = body;

  if (!name || !email || !password) {
    return error('Name, email, and password are required.', 400);
  }

  // 1. Check if email already taken (GSI1 lookup)
  const existing = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: GSI1_NAME,
    KeyConditionExpression: 'GSI1PK = :email',
    ExpressionAttributeValues: { ':email': keys.emailGSI(email) },
    Limit: 1,
  }));

  if (existing.Items?.length > 0) {
    return error('User already exists', 400);
  }

  // 2. Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // 3. Generate unique user ID (timestamp-based, unique at this scale)
  const userId = Date.now();
  const userRole = role || 'customer';
  const createdAt = new Date().toISOString();

  // 4. Write to DynamoDB
  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      PK:     keys.userPK(userId),
      SK:     keys.userSK(),
      GSI1PK: keys.emailGSI(email),
      GSI1SK: keys.userPK(userId),
      entityType: ENTITY_TYPES.USER,
      userId,
      name,
      email,
      passwordHash,
      role: userRole,
      createdAt,
    },
  }));

  // 5. Generate JWT (matches original Express token payload)
  const token = generateToken({ id: userId, name, email, role: userRole });

  return success({
    token,
    user: { id: userId, name, email, role: userRole },
  }, 201);
}

// ── Login ───────────────────────────────────────────────

async function login(event) {
  const body = JSON.parse(event.body || '{}');
  const { email, password } = body;

  if (!email || !password) {
    return error('Email and password are required.', 400);
  }

  // 1. Find user by email via GSI1
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: GSI1_NAME,
    KeyConditionExpression: 'GSI1PK = :email',
    ExpressionAttributeValues: { ':email': keys.emailGSI(email) },
    Limit: 1,
  }));

  if (!result.Items?.length) {
    return error('Invalid Credentials', 400);
  }

  const user = result.Items[0];

  // 2. Verify password
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return error('Invalid Credentials', 400);
  }

  // 3. Generate JWT
  const token = generateToken({
    id:    user.userId,
    name:  user.name,
    email: user.email,
    role:  user.role,
  });

  return success({
    token,
    user: { id: user.userId, name: user.name, email: user.email, role: user.role },
  });
}

// ── JWT Helper ──────────────────────────────────────────

function generateToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}
