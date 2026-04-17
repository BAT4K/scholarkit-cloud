const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'scholarkit',
    password: process.env.DB_PASSWORD || 'root',
    port: process.env.DB_PORT || 5432,
});

// Configuration
const PUBLIC_DIR = path.join(__dirname, '../../frontend/public/products'); // Adjust based on execution CWD
const SCHOOL_DIRS = ['sns', 'ais', 'tkhs'];

const SCHOOL_MAPPING = {
    'sns': 'Shiv Nadar School',
    'ais': 'Amity International School',
    'tkhs': 'The Knowledge Habitat School' // Check exact name in DB
};

const GRADE_MAPPING = {
    'foundation': 'Foundation',
    'primary': 'Primary',
    'senior': 'Senior'
};

const GENDERS = ['male', 'female', 'unisex'];

async function run() {
    try {
        console.log('Connecting to DB...');

        // 1. Fetch References
        const schoolsTypeRes = await pool.query('SELECT * FROM schools');
        const schools = schoolsTypeRes.rows;

        const gradesRes = await pool.query('SELECT * FROM grade_groups');
        const grades = gradesRes.rows;

        console.log(`Found ${schools.length} schools and ${grades.length} grade groups.`);

        // 2. Clear Tables
        console.log('Clearing old data...');
        await pool.query('TRUNCATE TABLE school_requirements, products RESTART IDENTITY CASCADE');

        let productCount = 0;

        // 3. Process each school directory
        for (const dir of SCHOOL_DIRS) {
            const schoolNamePartial = SCHOOL_MAPPING[dir];
            // Find school ID loosely matching name
            const school = schools.find(s => s.name.includes(schoolNamePartial.split(' ')[0])); // e.g. "Shiv" matches "Shiv Nadar"

            if (!school) {
                console.error(`Could not find school for directory: ${dir} (${schoolNamePartial})`);
                continue;
            }
            console.log(`\nProcessing ${dir} -> ID: ${school.id} (${school.name})`);

            const fullPath = path.join(PUBLIC_DIR, dir);
            if (!fs.existsSync(fullPath)) {
                console.log(`Directory not found: ${fullPath}`);
                continue;
            }

            const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.webp') || f.endsWith('.png') || f.endsWith('.jpg'));

            for (const file of files) {
                const nameParts = file.replace(/\.(webp|png|jpg)$/, '').split('-');

                // Format: [school]-[product]-[product?]-[gender]-[grade?]
                // Remove school prefix if present (it should be)
                if (nameParts[0] === dir) nameParts.shift();

                let gender = 'Unisex'; // Default
                let specificGrade = null; // Null means all grades

                // Check Last Part (Grade or Gender?)
                const last = nameParts[nameParts.length - 1];

                if (Object.keys(GRADE_MAPPING).includes(last)) {
                    // It is a grade
                    specificGrade = GRADE_MAPPING[last];
                    nameParts.pop();

                    // Check previous for gender
                    const prev = nameParts[nameParts.length - 1];
                    if (GENDERS.includes(prev)) {
                        gender = prev.charAt(0).toUpperCase() + prev.slice(1);
                        nameParts.pop();
                    }
                } else if (GENDERS.includes(last)) {
                    // It is a gender, no specific grade
                    gender = last.charAt(0).toUpperCase() + last.slice(1);
                    nameParts.pop();
                }

                // Remaining parts are name
                const productName = nameParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');

                // Create Product
                const insertProductQuery = `
                    INSERT INTO products (name, price, category, image_url, stock, school_id)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING id
                `;
                const imageUrl = `/products/${dir}/${file}`;

                const productRes = await pool.query(insertProductQuery, [
                    productName,
                    500, // Default Price
                    'Uniform',
                    imageUrl,
                    100, // Stock
                    school.id
                ]);
                const productId = productRes.rows[0].id;

                // Create Requirements
                // If specificGrade is set, map to simple ID. If null, map to all IDs for this school.
                // Wait, grade_groups are school-specific? 
                // DB Schema: grade_groups has school_id?
                // Looking at dump: grade_groups has school_id: 1.
                // Uh oh. If grade_groups are bound to schools, we need to pick the right grade group for THIS school.
                // But the dump showed grade groups having school_id.
                // Let's check schema/dump again.
                // dump says: Table: grade_groups, column school_id: integer (NULL).
                // DATA: school_id: 1 for Foundation, Primary, Senior.
                // Does this mean Only School 1 has grade groups? Or do they share?
                // shopController.js: "SELECT id, name, sort_order FROM grade_groups". It does NOT filter by school_id.
                // This implies grade groups are GLOBAL or the controller is bugged.
                // "We do NOT filter by schoolId anymore. This ensures every school sees 'Foundation', 'Primary', 'Senior'."
                // So I can assume IDs 1, 2, 3 apply to ALL schools effectively?
                // Or I should look up by Name.

                const targetGroups = [];
                if (specificGrade) {
                    const grp = grades.find(g => g.name.includes(specificGrade));
                    if (grp) targetGroups.push(grp.id);
                } else {
                    // All groups
                    grades.forEach(g => targetGroups.push(g.id));
                }

                for (const groupId of targetGroups) {
                    await pool.query(`
                        INSERT INTO school_requirements (grade_group_id, product_id, gender, is_mandatory)
                        VALUES ($1, $2, $3, $4)
                    `, [groupId, productId, gender, true]);
                }

                productCount++;
                console.log(`Created: ${productName} (${gender}, ${specificGrade || 'All'})`);
            }
        }

        console.log(`\nDone! Created ${productCount} products.`);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

run();
