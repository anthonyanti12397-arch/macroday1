#!/usr/bin/env node

/**
 * Generate Apple OAuth Secret (JWT) for NextAuth
 * Run: node scripts/generate-apple-secret.js
 */

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

// Apple credentials
const TEAM_ID = '4443DJTZ8S';
const KEY_ID = 'HS9892AQR5';
const SERVICE_ID = 'com.fuelweek.macroday';
const PRIVATE_KEY_PATH = path.join(process.env.HOME, 'Downloads/AuthKey_HS9892AQR5.p8');

try {
  // Read private key
  if (!fs.existsSync(PRIVATE_KEY_PATH)) {
    console.error(`❌ Private key not found at: ${PRIVATE_KEY_PATH}`);
    process.exit(1);
  }

  const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf-8');

  // Create JWT header and payload
  const header = {
    alg: 'ES256',
    kid: KEY_ID,
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: TEAM_ID,
    iat: now,
    exp: now + 15777000, // 6 months
    aud: 'https://appleid.apple.com',
    sub: SERVICE_ID
  };

  // Encode header and payload
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const message = `${encodedHeader}.${encodedPayload}`;

  // Sign with private key
  const signer = crypto.createSign('SHA256');
  signer.update(message);
  const signature = signer.sign(privateKey, 'base64url');

  // Create JWT
  const jwt = `${message}.${signature}`;

  console.log('\n✅ Apple OAuth Secret (JWT) Generated!\n');
  console.log('Copy this value to Vercel as APPLE_CLIENT_SECRET:\n');
  console.log('─'.repeat(80));
  console.log(jwt);
  console.log('─'.repeat(80));
  console.log('\nAlso set these in Vercel:\n');
  console.log(`APPLE_CLIENT_ID = ${SERVICE_ID}`);
  console.log('\n');

} catch (error) {
  console.error('❌ Error generating JWT:', error.message);
  process.exit(1);
}
