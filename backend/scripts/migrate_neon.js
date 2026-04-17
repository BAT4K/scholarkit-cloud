const fs = require('fs');
const { Pool } = require('pg');

const connectionString = "postgresql://neondb_owner:npg_SQOGtp30PkRr@ep-odd-cake-a1pp4bh6-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false } // Neon uses public CA, but this is safer for scripts often
});

async function run() {
    try {
        const sql = fs.readFileSync('../production_dump.sql', 'utf8');
        const lines = sql.split('\n');
        let outputSql = [];
        let copyMode = false;
        let currentTable = '';
        let currentColumns = [];

        for (const line of lines) {
            if (line.startsWith('COPY public.')) {
                copyMode = true;
                // Extract table name and columns
                const match = line.match(/COPY public\.(\w+) \((.*)\) FROM stdin;/);
                if (match) {
                    currentTable = match[1];
                    currentColumns = match[2].split(', ').map(c => c.trim());
                    console.log(`Processing table: ${currentTable}`);
                } else {
                    console.error("Could not parse COPY line:", line);
                }
                continue;
            }

            if (copyMode) {
                if (line.trim() === '\\.') {
                    copyMode = false;
                    currentTable = '';
                    currentColumns = [];
                    continue;
                }

                if (!line.trim()) continue;

                const values = line.split('\t').map(v => {
                    if (v === '\\N') return 'NULL';
                    // Escape single quotes
                    if (isNaN(v)) return `'${v.replace(/'/g, "''")}'`;
                    return v;
                });

                const insertStmt = `INSERT INTO public.${currentTable} (${currentColumns.join(', ')}) VALUES (${values.join(', ')});`;
                outputSql.push(insertStmt);
            } else {
                // Standard SQL line
                // pg driver executes one statement at a time generally, but allows multiple separated by ;
                // We will collect them.
                if (line.trim() && !line.startsWith('--')) {
                    outputSql.push(line);
                }
            }
        }

        // Join all SQL.
        // However, some lines are partial. pg_dump separates statements by ;
        // The parser above pushes lines. We should join them and split by ; to be safe?
        // Actually, simply joining by \n is safer because comments are handled (filtered above mostly).
        // Let's refine:
        // We already removed comments starting with --.
        // We can just join by newline and execute? NO.
        // `pool.query` supports multiple statements if we use correct config, but it's better to split them?
        // Or just run one big string. `pg` usually supports multiple statements in one query.

        // IMPORTANT: production_dump.sql has `SET search_path...` etc.
        // We should keep them.

        const finalQuery = outputSql.join('\n');

        console.log("Executing SQL...");
        await pool.query(finalQuery);
        console.log("Migration successful!");

    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await pool.end();
    }
}

run();
