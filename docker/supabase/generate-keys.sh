#!/bin/bash

# ================================================
# Supabase JWT Key Generator
# Generates ANON_KEY and SERVICE_KEY for self-hosted Supabase
# ================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Supabase JWT Key Generator ===${NC}"
echo ""

# Check if JWT_SECRET is provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage: $0 <JWT_SECRET>${NC}"
    echo ""
    echo "JWT_SECRET must be at least 32 characters long."
    echo ""
    echo "Example:"
    echo "  $0 'your-super-secret-jwt-key-min-32-characters-here'"
    exit 1
fi

JWT_SECRET="$1"

# Validate JWT_SECRET length
if [ ${#JWT_SECRET} -lt 32 ]; then
    echo -e "${RED}Error: JWT_SECRET must be at least 32 characters long${NC}"
    exit 1
fi

echo "JWT_SECRET: ${JWT_SECRET:0:10}..."
echo ""

# Check for required tools
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is required but not installed.${NC}"
    echo "Install Node.js and try again."
    exit 1
fi

# Generate keys using Node.js
echo -e "${GREEN}Generating JWT tokens...${NC}"
echo ""

node << EOF
const crypto = require('crypto');

function base64url(source) {
    // Encode in classical base64
    let encodedSource = Buffer.from(JSON.stringify(source)).toString('base64');
    // Remove padding equal characters
    encodedSource = encodedSource.replace(/=+\$/, '');
    // Replace characters according to base64url specifications
    encodedSource = encodedSource.replace(/\+/g, '-');
    encodedSource = encodedSource.replace(/\//g, '_');
    return encodedSource;
}

function signJWT(payload, secret) {
    const header = { alg: 'HS256', typ: 'JWT' };

    const encodedHeader = base64url(header);
    const encodedPayload = base64url(payload);

    const signature = crypto
        .createHmac('sha256', secret)
        .update(encodedHeader + '.' + encodedPayload)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    return encodedHeader + '.' + encodedPayload + '.' + signature;
}

const secret = '${JWT_SECRET}';
const exp = Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60); // 10 years

const anonPayload = {
    role: 'anon',
    iss: 'supabase',
    iat: Math.floor(Date.now() / 1000),
    exp: exp
};

const servicePayload = {
    role: 'service_role',
    iss: 'supabase',
    iat: Math.floor(Date.now() / 1000),
    exp: exp
};

const anonKey = signJWT(anonPayload, secret);
const serviceKey = signJWT(servicePayload, secret);

console.log('# Add these to your .env file:');
console.log('');
console.log('JWT_SECRET=${JWT_SECRET}');
console.log('');
console.log('ANON_KEY=' + anonKey);
console.log('');
console.log('SERVICE_KEY=' + serviceKey);
console.log('');
console.log('# Expiry: ' + new Date(exp * 1000).toISOString());
EOF

echo ""
echo -e "${GREEN}Done! Copy the values above to your .env file.${NC}"
