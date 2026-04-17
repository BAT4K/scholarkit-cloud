#!/bin/bash

# Check if Docker is running
if ! docker ps | grep -q scholarkit_db; then
    echo "Error: The database container 'scholarkit_db' is not running."
    echo "Please run 'docker-compose up -d postgres' first."
    exit 1
fi

echo "Exporting database to production_dump.sql..."

# Run pg_dump inside the container
docker exec scholarkit_db pg_dump -U postgres -d scholarkit --clean --if-exists --no-owner --no-acl > production_dump.sql

# Remove potential garbage artifacts
sed -i '/^\\restrict/d' production_dump.sql

if [ $? -eq 0 ]; then
    echo "✅ Success! database saved to 'production_dump.sql'"
    echo "You can now upload this file to your Neon database using the Neon Console or psql."
else
    echo "❌ Failed to export database."
fi
