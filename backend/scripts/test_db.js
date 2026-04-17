const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const configs = [
    { host: 'localhost', name: 'Localhost' },
    { host: 'scholarkit_db', name: 'Service Name' },
    { host: '127.0.0.1', name: 'IP 127.0.0.1' },
    { host: 'host.docker.internal', name: 'Docker Host' }
];

async function testConnection(config) {
    const pool = new Pool({
        user: process.env.DB_USER || 'postgres',
        host: config.host,
        database: process.env.DB_NAME || 'scholarkit',
        password: process.env.DB_PASSWORD || 'root',
        port: process.env.DB_PORT || 5432,
        connectionTimeoutMillis: 2000,
    });

    try {
        console.log(`Testing ${config.name} (${config.host})...`);
        const res = await pool.query('SELECT NOW()');
        console.log(`SUCCESS: ${config.name} connected! Time: ${res.rows[0].now}`);
        return true;
    } catch (err) {
        console.log(`FAILED: ${config.name} - ${err.message}`);
        return false;
    } finally {
        await pool.end();
    }
}

async function run() {
    for (const config of configs) {
        if (await testConnection(config)) break;
    }
}

run();
