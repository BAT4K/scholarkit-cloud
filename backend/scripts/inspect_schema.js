const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' }); // Adjust path if needed

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'scholarkit',
    password: process.env.DB_PASSWORD || 'root',
    port: process.env.DB_PORT || 5432,
});

async function inspectTable(tableName) {
    const res = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
    `, [tableName]);
    console.log(`\nTable: ${tableName}`);
    res.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
}

async function run() {
    try {
        await inspectTable('products');
        await inspectTable('school_requirements');
        await inspectTable('grade_groups');
        await inspectTable('schools');
        
        // Also dump data for schools and grade_groups to map
        console.log('\n--- DATA ---');
        const schools = await pool.query('SELECT * FROM schools');
        console.log('Schools:', schools.rows);
        
        const groups = await pool.query('SELECT * FROM grade_groups');
        console.log('Grade Groups:', groups.rows);
        
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

run();
