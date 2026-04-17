const pool = require('../config/db');
const { tableExists, columnExists } = require('../utils/schema');

const PRODUCT_PLACEHOLDER = 'https://placehold.co/600x400/e2e8f0/1e3a8a?text=ScholarKit';
const FALLBACK_GROUPS = [
    { id: 1, name: 'Foundation', sort_order: 10 },
    { id: 2, name: 'Primary', sort_order: 20 },
    { id: 3, name: 'Secondary', sort_order: 30 }
];

function getGenderHeuristicClause(gender) {
    if (!gender) {
        return '';
    }

    const normalizedGender = gender.toLowerCase();
    if (normalizedGender === 'male') {
        return ` AND LOWER(p.name) NOT LIKE '%skirt%' `;
    }

    if (normalizedGender === 'female') {
        return ` AND LOWER(p.name) NOT LIKE '%shorts%' `;
    }

    return '';
}

// 1. Get Groups
exports.getSchoolGroups = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const hasGradeGroups = await tableExists('grade_groups');

        if (!hasGradeGroups) {
            return res.json(FALLBACK_GROUPS);
        }

        const [groups] = await pool.query(
            `SELECT id, name, sort_order
             FROM grade_groups
             WHERE school_id = ?
             ORDER BY sort_order ASC, id ASC`,
            [schoolId]
        );
        res.json(groups);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
};

// 2. Get Catalog
exports.getGroupCatalog = async (req, res) => {
    try {
        const { group_id, school_id, gender = 'Unisex' } = req.query;

        if (!group_id || !school_id) {
            return res.status(400).json({ error: 'Missing group_id or school_id' });
        }

        const hasGradeGroups = await tableExists('grade_groups');
        const hasSchoolRequirements = await tableExists('school_requirements');
        const hasProductImage = await columnExists('products', 'image_url');
        const imageSelect = hasProductImage
            ? 'COALESCE(p.image_url, ?) AS image_url'
            : '? AS image_url';

        let rows;

        if (hasGradeGroups && hasSchoolRequirements) {
            const normalizedGender = gender.toLowerCase();
            const query = `
                SELECT
                    p.id,
                    p.name,
                    p.price,
                    p.category,
                    p.stock,
                    p.school_id,
                    p.discount_percent,
                    ${imageSelect},
                    sr.is_mandatory,
                    sr.gender AS specific_gender
                FROM products p
                JOIN school_requirements sr ON sr.product_id = p.id
                JOIN grade_groups gg ON gg.id = sr.grade_group_id
                WHERE gg.id = ?
                  AND gg.school_id = ?
                  AND p.school_id = ?
                  AND (
                    sr.gender = 'Unisex'
                    OR LOWER(sr.gender) = ?
                  )
                ORDER BY sr.is_mandatory DESC, p.name ASC
            `;

            [rows] = await pool.query(query, [
                PRODUCT_PLACEHOLDER,
                group_id,
                school_id,
                school_id,
                normalizedGender
            ]);
        } else {
            const heuristicClause = getGenderHeuristicClause(gender);
            const fallbackQuery = `
                SELECT
                    p.id,
                    p.name,
                    p.price,
                    p.category,
                    p.stock,
                    p.school_id,
                    p.discount_percent,
                    ${imageSelect},
                    1 AS is_mandatory,
                    'Unisex' AS specific_gender
                FROM products p
                WHERE p.school_id = ?
                ${heuristicClause}
                ORDER BY p.name ASC
            `;

            [rows] = await pool.query(fallbackQuery, [PRODUCT_PLACEHOLDER, school_id]);
        }

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
};
