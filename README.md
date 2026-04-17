# ScholarKit 🎓
### Multi-Vendor E-Commerce Database System

ScholarKit is a comprehensive full-stack solution for school uniform procurement, built to demonstrate advanced DBMS concepts including ACID transactions, stored procedures, triggers, and analytical views.

---

## 🚀 Getting Started

### 1. Prerequisites
- **MySQL 8.0+**
- **Node.js 18+**
- **Cloudinary Account** (for image uploads)
- **Razorpay Account** (for test payments)

### 2. Database Setup
1. Create a database named `scholarkit_dbms`.
2. Run the migration scripts in order:
   ```bash
   mysql -u root -p scholarkit_dbms < production_dump.sql
   mysql -u root -p scholarkit_dbms < scripts/migration_v2_part1.sql
   mysql -u root -p scholarkit_dbms < scripts/migration_v2_part2.sql
   ```

### 3. Backend Configuration
Create a `.env` file in the `backend/` directory:
```env
DB_HOST=127.0.0.1
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=scholarkit_dbms
JWT_SECRET=your_secret
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

### 4. Installation & Launch
```bash
# Install backend dependencies
cd backend && npm install
npm start

# Install frontend dependencies
cd ../frontend && npm install
npm start
```

---

## 🛠️ Advanced Database Features

| Feature | Implementation | Purpose |
| :--- | :--- | :--- |
| **ACID Transactions** | `PlaceOrder` Stored Procedure | Ensures atomic checkouts and stock consistency. |
| **SQL Cursors** | `CalculateTotalInventoryValue` | Iterative inventory audit logic. |
| **Triggers** | `before_product_price_update` | Automatic price history logging for auditing. |
| **Window Functions** | `vw_top_products_per_school` | Analytical ranking of products without complex app-logic. |
| **Views** | `vw_user_recommendations` | Personalized recommendation engine. |
| **Normalization** | 3rd Normal Form (3NF) | Reduced redundancy and optimized storage. |

---

## 🔗 References & Credits
- **UI Design:** Inspired by modern B2C platforms (Zappos, Nike).
- **Security:** Follows [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/) for JWT and hashing.
- **Database:** Standard SQL patterns from [MySQL 8.0 Reference Manual](https://dev.mysql.com/doc/refman/8.0/en/).
- **Icons:** [Lucide React](https://lucide.dev/).
- **Toast Notifications:** [React Hot Toast](https://react-hot-toast.com/).
