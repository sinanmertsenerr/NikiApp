#!/bin/bash

# ===========================================
# Niki Coffee API - Production Deployment Script
# ===========================================

set -e

echo "=========================================="
echo "Niki Coffee API - Production Deployment"
echo "=========================================="

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "ERROR: .env.production file not found!"
    echo "Please copy .env.production.example to .env.production and fill in the values."
    exit 1
fi

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

# Validate required variables
if [ -z "$POSTGRES_PASSWORD" ] || [ "$POSTGRES_PASSWORD" = "SUPER_STRONG_PASSWORD_HERE" ]; then
    echo "ERROR: Please set a strong POSTGRES_PASSWORD in .env.production"
    exit 1
fi

if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "GENERATE_64_CHAR_RANDOM_STRING_HERE" ]; then
    echo "ERROR: Please generate and set JWT_SECRET in .env.production"
    echo "Generate with: openssl rand -base64 64"
    exit 1
fi

echo "Step 1: Building Docker image..."
docker-compose -f docker-compose.prod.yml build --no-cache api

echo "Step 2: Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

echo "Step 3: Starting database and redis..."
docker-compose -f docker-compose.prod.yml up -d postgres redis

echo "Step 4: Waiting for database to be ready..."
sleep 10

echo "Step 5: Running database migrations..."
docker-compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy

echo "Step 6: Starting all services..."
docker-compose -f docker-compose.prod.yml up -d

echo "Step 7: Checking health..."
sleep 15

if docker-compose -f docker-compose.prod.yml ps | grep -q "healthy"; then
    echo "=========================================="
    echo "Deployment successful!"
    echo "=========================================="
    docker-compose -f docker-compose.prod.yml ps
else
    echo "WARNING: Some services may not be healthy yet."
    echo "Check logs with: docker-compose -f docker-compose.prod.yml logs"
fi
