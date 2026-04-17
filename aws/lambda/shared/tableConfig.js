// ══════════════════════════════════════════════════════════
// Re-export table config from the canonical source.
// During development, this resolves to dynamodb/table-config.js.
// During deployment, build.sh copies the real file here.
// ══════════════════════════════════════════════════════════

module.exports = require('../../dynamodb/table-config');
