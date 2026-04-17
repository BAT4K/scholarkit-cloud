const { Pool } = require('pg');

const connectionString = "postgresql://neondb_owner:npg_SQOGtp30PkRr@ep-odd-cake-a1pp4bh6-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const res = await pool.query('SELECT count(*) FROM schools');
        console.log(`Schools count: ${res.rows[0].count}`);
    } catch (err) {
        console.error("Query failed:", err);
    } finally {
        await pool.end();
    }
}

run();
