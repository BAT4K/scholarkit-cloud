const pool = require('../config/db');
const { columnExists } = require('../utils/schema');

const PRODUCT_PLACEHOLDER = 'https://placehold.co/600x400/e2e8f0/1e3a8a?text=ScholarKit';

const isPrivilegedUser = (user) => user?.role === 'admin' || user?.role === 'seller';

exports.getSellerProducts = async (req, res) => {
    if (!isPrivilegedUser(req.user)) {
        return res.status(403).json({ message: 'Access denied.' });
    }

    try {
        const { school_id } = req.query;
        const hasProductImage = await columnExists('products', 'image_url');
        const conditions = [];
        const params = [PRODUCT_PLACEHOLDER];
        const imageSelect = hasProductImage
            ? 'COALESCE(p.image_url, ?) AS image_url'
            : '? AS image_url';

        if (school_id) {
            conditions.push('p.school_id = ?');
            params.push(school_id);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const [rows] = await pool.query(
            `SELECT
                p.id,
                p.name,
                p.category,
                p.price,
                p.stock,
                p.school_id,
                p.discount_percent,
                s.name AS school_name,
                ${imageSelect}
             FROM products p
             LEFT JOIN schools s ON s.id = p.school_id
             ${whereClause}
             ORDER BY s.name ASC, p.name ASC`,
            params
        );

        res.json(rows);
    } catch (err) {
        console.error('Seller products error:', err);
        res.status(500).json({ message: 'Failed to load inventory.' });
    }
};

exports.updateProductStock = async (req, res) => {
    if (!isPrivilegedUser(req.user)) {
        return res.status(403).json({ message: 'Access denied.' });
    }

    const { id } = req.params;
    const stock = Number.parseInt(req.body.stock, 10);

    if (Number.isNaN(stock) || stock < 0) {
        return res.status(400).json({ message: 'Stock must be a non-negative number.' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE products SET stock = ? WHERE id = ?',
            [stock, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        const [[product]] = await pool.query(
            `SELECT id, name, stock
             FROM products
             WHERE id = ?`,
            [id]
        );

        res.json(product);
    } catch (err) {
        console.error('Update stock error:', err);
        res.status(500).json({ message: 'Failed to update stock.' });
    }
};

exports.getProductPriceHistory = async (req, res) => {
    const { id } = req.params;

    try {
        const [[product]] = await pool.query(
            `SELECT id, price
             FROM products
             WHERE id = ?`,
            [id]
        );

        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        const tableChecks = [
            { table: 'price_history', changedAt: 'changed_at' },
            { table: 'product_price_history', changedAt: 'changed_at' },
            { table: 'price_audit', changedAt: 'changed_at' },
            { table: 'product_price_audit', changedAt: 'changed_at' }
        ];

        for (const candidate of tableChecks) {
            const [tables] = await pool.query(`SHOW TABLES LIKE ?`, [candidate.table]);
            if (tables.length === 0) {
                continue;
            }

            const [rows] = await pool.query(
                `SELECT old_price, new_price, ${candidate.changedAt} AS changed_at
                 FROM ${candidate.table}
                 WHERE product_id = ?
                 ORDER BY ${candidate.changedAt} DESC
                 LIMIT 20`,
                [id]
            );

            return res.json(rows);
        }

        // No price history table found — return current price as the only entry
        return res.json(
            [{ old_price: product.price, new_price: product.price, changed_at: new Date().toISOString() }]
        );
    } catch (err) {
        console.error('Price history error:', err);
        res.status(500).json({ message: 'Failed to load price history.' });
    }
};

// 4. Get Personalized Recommendations
exports.getRecommendations = async (req, res) => {
    const userId = req.user.id;

    try {
        const [rows] = await pool.query(
            `SELECT
                product_id   AS id,
                product_name AS name,
                product_price AS price,
                product_category AS category,
                product_stock AS stock,
                product_discount AS discount_percent,
                school_name
             FROM vw_user_recommendations
             WHERE user_id = ?
             LIMIT 8`,
            [userId]
        );

        res.json(rows);
    } catch (err) {
        console.error('Recommendations error:', err);
        res.status(500).json({ message: 'Failed to load recommendations.' });
    }
};

// ═══════════════════════════════════════════════════════
// 5. PRODUCT CRUD (Full Create / Update / Delete)
// ═══════════════════════════════════════════════════════

// CREATE — POST /api/products
exports.createProduct = async (req, res) => {
    const { name, price, stock, category, school_id, discount_percent, size, image_url } = req.body;
    const isAdmin = req.user.role === 'admin';
    const sellerId = isAdmin ? (req.body.seller_id || req.user.id) : req.user.id;

    if (!name || !price) {
        return res.status(400).json({ message: 'Name and price are required.' });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO products (name, price, stock, category, school_id, seller_id, discount_percent, size, image_url)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name,
                price,
                stock || 0,
                category || null,
                school_id || null,
                sellerId,
                discount_percent || 0,
                size || null,
                image_url || null
            ]
        );

        const [[newProduct]] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
        res.status(201).json(newProduct);
    } catch (err) {
        console.error('Create product error:', err);
        res.status(500).json({ message: 'Failed to create product.' });
    }
};

// UPDATE — PUT /api/products/:id
exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, price, stock, category, school_id, discount_percent, size, image_url } = req.body;
    const isAdmin = req.user.role === 'admin';

    try {
        // RBAC: Sellers can only update their own products
        if (!isAdmin) {
            const [[existing]] = await pool.query('SELECT seller_id FROM products WHERE id = ?', [id]);
            if (!existing) return res.status(404).json({ message: 'Product not found.' });
            if (existing.seller_id !== req.user.id) {
                return res.status(403).json({ message: 'You can only edit your own products.' });
            }
        }

        const fields = [];
        const params = [];

        if (name !== undefined)            { fields.push('name = ?');             params.push(name); }
        if (price !== undefined)           { fields.push('price = ?');            params.push(price); }
        if (stock !== undefined)           { fields.push('stock = ?');            params.push(stock); }
        if (category !== undefined)        { fields.push('category = ?');         params.push(category); }
        if (discount_percent !== undefined){ fields.push('discount_percent = ?'); params.push(discount_percent); }
        if (size !== undefined)            { fields.push('size = ?');             params.push(size); }
        if (image_url !== undefined)       { fields.push('image_url = ?');        params.push(image_url); }

        // Only admins can reassign school_id
        if (isAdmin && school_id !== undefined) {
            fields.push('school_id = ?');
            params.push(school_id);
        }

        if (fields.length === 0) {
            return res.status(400).json({ message: 'No fields to update.' });
        }

        params.push(id);

        await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, params);

        const [[updated]] = await pool.query(
            `SELECT p.*, s.name AS school_name
             FROM products p
             LEFT JOIN schools s ON s.id = p.school_id
             WHERE p.id = ?`,
            [id]
        );

        res.json(updated);
    } catch (err) {
        console.error('Update product error:', err);
        res.status(500).json({ message: 'Failed to update product.' });
    }
};

// DELETE — DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
    const { id } = req.params;
    const isAdmin = req.user.role === 'admin';

    try {
        // RBAC: Sellers can only delete their own products
        if (!isAdmin) {
            const [[existing]] = await pool.query('SELECT seller_id FROM products WHERE id = ?', [id]);
            if (!existing) return res.status(404).json({ message: 'Product not found.' });
            if (existing.seller_id !== req.user.id) {
                return res.status(403).json({ message: 'You can only delete your own products.' });
            }
        }

        const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        res.json({ message: 'Product deleted successfully.' });
    } catch (err) {
        console.error('Delete product error:', err);
        res.status(500).json({ message: 'Failed to delete product.' });
    }
};

// 6. Get all schools (for dropdowns)
exports.getSchools = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, name FROM schools ORDER BY name ASC');
        res.json(rows);
    } catch (err) {
        console.error('Schools error:', err);
        res.status(500).json({ message: 'Failed to load schools.' });
    }
};

// 7. Media Library — unique product images for reuse
exports.getImageGallery = async (req, res) => {
    try {
        const isAdmin = req.user.role === 'admin';

        let query, params;
        if (isAdmin) {
            // Admins see all unique images across the platform
            query = `SELECT DISTINCT image_url FROM products WHERE image_url IS NOT NULL AND image_url != '' ORDER BY image_url`;
            params = [];
        } else {
            // Sellers see images from their own products
            query = `SELECT DISTINCT image_url FROM products WHERE image_url IS NOT NULL AND image_url != '' AND seller_id = ? ORDER BY image_url`;
            params = [req.user.id];
        }

        const [rows] = await pool.query(query, params);
        res.json(rows.map(r => r.image_url));
    } catch (err) {
        console.error('Image gallery error:', err);
        res.status(500).json({ message: 'Failed to load image gallery.' });
    }
};
