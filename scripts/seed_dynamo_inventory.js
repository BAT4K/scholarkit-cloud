#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');

const { TABLE_NAME, AWS_REGION, ENTITY_TYPES, keys } = require('../aws/dynamodb/table-config');

const client = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

const DUMP_PATH = path.join(__dirname, '../../scholarkit-dbms/production_inserts.sql');

async function seedProducts() {
    if (!fs.existsSync(DUMP_PATH)) {
        console.error("SQL Dump not found at:", DUMP_PATH);
        return;
    }
    
    const sql = fs.readFileSync(DUMP_PATH, 'utf-8');
    const lines = sql.split('\n');
    
    const products = [];
    
    for (const line of lines) {
        if (line.includes('INSERT INTO public.products')) {
            const match = line.match(/VALUES \((.*?)\);/);
            if (match) {
                const valuesRaw = match[1];
                const parts = valuesRaw.match(/('.*?'|[^,]+)/g).map(p => p.trim());
                
                // id, name, price, category, image_url, created_at, stock, school_id
                const id = parseInt(parts[0], 10);
                const name = parts[1].replace(/^'|'$/g, '');
                const price = parseFloat(parts[2]);
                const category = parts[3].replace(/^'|'$/g, '');
                const imageUrl = parts[4].replace(/^'|'$/g, '');
                const createdAt = parts[5].replace(/^'|'$/g, '');
                const stock = parseInt(parts[6], 10);
                const rawSchoolId = parseInt(parts[7], 10);
                
                // Fix School ID mismatch:
                // SQL Dump: 1=Shiv Nadar, 2=Amity, 3=Knowledge Habitat
                // DynamoDB: 1=Shiv Nadar, 2=Knowledge Habitat, 3=Amity
                let schoolId = rawSchoolId;
                if (rawSchoolId === 2) schoolId = 3; // Amity
                else if (rawSchoolId === 3) schoolId = 2; // Knowledge Habitat

                
                let gradeGroup = 'all';
                if (imageUrl.toLowerCase().includes('foundation')) gradeGroup = 'foundation';
                else if (imageUrl.toLowerCase().includes('primary')) gradeGroup = 'primary';
                else if (imageUrl.toLowerCase().includes('senior') || imageUrl.toLowerCase().includes('secondary')) gradeGroup = 'secondary';
                
                products.push({
                    PK: keys.productPK(id),
                    SK: keys.productSK(),
                    GSI1PK: keys.productInSchoolGSI(schoolId),
                    GSI1SK: keys.productPK(id),
                    entityType: ENTITY_TYPES.PRODUCT,
                    productId: id,
                    sellerId: 1, // default seller
                    schoolId: schoolId,
                    name: name,
                    price: price,
                    stock: stock,
                    category: category,
                    gradeGroup: gradeGroup,
                    discountPercent: 0,
                    imageUrl: imageUrl,
                    size: 'Free Size', // fallback size
                    createdAt: new Date(createdAt).toISOString()
                });
            }
        }
    }
    
    console.log(`Extracted ${products.length} products. Proceeding to batch write...`);
    
    const BATCH_SIZE = 25;
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const batch = products.slice(i, i + BATCH_SIZE);
        const requestItems = {
            [TABLE_NAME]: batch.map((item) => ({
                PutRequest: { Item: item },
            })),
        };
        
        let retries = 0;
        let unprocessed = requestItems;
        
        while (Object.keys(unprocessed).length > 0 && retries < 5) {
            const result = await docClient.send(
                new BatchWriteCommand({ RequestItems: unprocessed })
            );
            
            unprocessed = result.UnprocessedItems || {};
            if (Object.keys(unprocessed).length > 0) {
                retries++;
                const delay = Math.pow(2, retries) * 100;
                await new Promise((r) => setTimeout(r, delay));
            }
        }
        console.log(`Wrote batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(products.length / BATCH_SIZE)}`);
    }
    
    console.log('Successfully seeded DynamoDB with updated product inventory.');
}

seedProducts().catch(console.error);
