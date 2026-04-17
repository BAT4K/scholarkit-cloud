const pool = require('../config/db');

async function tableExists(tableName) {
    const [rows] = await pool.query(
        `SELECT 1
         FROM INFORMATION_SCHEMA.TABLES
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
         LIMIT 1`,
        [tableName]
    );

    return rows.length > 0;
}

async function columnExists(tableName, columnName) {
    const [rows] = await pool.query(
        `SELECT 1
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
           AND COLUMN_NAME = ?
         LIMIT 1`,
        [tableName, columnName]
    );

    return rows.length > 0;
}

module.exports = {
    tableExists,
    columnExists
};
