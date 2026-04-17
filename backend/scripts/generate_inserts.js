const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '../../production_dump.sql');
const outputFile = path.join(__dirname, '../../production_inserts.sql');

try {
    const sql = fs.readFileSync(inputFile, 'utf8');
    const lines = sql.split('\n');
    let outputSql = [];
    let copyMode = false;
    let currentTable = '';
    let currentColumns = [];

    for (const line of lines) {
        if (line.startsWith('COPY public.')) {
            copyMode = true;
            const match = line.match(/COPY public\.(\w+) \((.*)\) FROM stdin;/);
            if (match) {
                currentTable = match[1];
                currentColumns = match[2].split(', ').map(c => c.trim());
                console.log(`Converting table: ${currentTable}`);
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
                if (isNaN(v)) return `'${v.replace(/'/g, "''")}'`;
                return v;
            });

            outputSql.push(`INSERT INTO public.${currentTable} (${currentColumns.join(', ')}) VALUES (${values.join(', ')});`);
        } else {
            if (line.trim() && !line.startsWith('--')) {
                outputSql.push(line);
            }
        }
    }

    fs.writeFileSync(outputFile, outputSql.join('\n'));
    console.log(`Successfully generated ${outputFile}`);
} catch (err) {
    console.error("Error generating inserts:", err);
}
