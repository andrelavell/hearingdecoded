#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Setting up Supabase database...${NC}"

# Set your Supabase credentials
PROJECT_ID="fhdsrswkrizwaprgymmu"
DB_PASSWORD="mXDjR2aJusT9d15y"

# Database connection string
DB_URL="postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_ID}.supabase.co:5432/postgres"

echo -e "${GREEN}Applying schema...${NC}"
psql "$DB_URL" -f supabase/schema.sql

echo -e "${GREEN}✓ Database setup complete!${NC}"
echo -e "${BLUE}You can now start the application with 'npm run dev'${NC}"
