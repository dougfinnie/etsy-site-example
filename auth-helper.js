require('dotenv').config();
const crypto = require('crypto');

const etsyApiKey = process.env.ETSY_API_KEY;
const redirectUri = process.env.ETSY_REDIRECT_URI || 'http://localhost:3000/auth/callback';

// Generate PKCE code verifier and challenge
function generatePKCE() {
  // Generate a cryptographically random 32-byte string, base64url encoded
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  
  // Create SHA256 hash of the code verifier, base64url encoded
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  
  console.log('PKCE Debug:');
  console.log('Code Verifier Length:', codeVerifier.length);
  console.log('Code Challenge Length:', codeChallenge.length);
  console.log('Code Verifier:', codeVerifier);
  console.log('Code Challenge:', codeChallenge);
  console.log();
  
  return { codeVerifier, codeChallenge };
}

// Generate state for security
function generateState() {
  return crypto.randomBytes(16).toString('hex');
}

console.log('=== Etsy OAuth 2.0 Authentication Helper ===\n');

if (!etsyApiKey) {
  console.error('❌ ETSY_API_KEY is missing from .env file');
  process.exit(1);
}

const { codeVerifier, codeChallenge } = generatePKCE();
const state = generateState();

// Store these for the token exchange
console.log('🔐 Save these values - you\'ll need them for the token exchange:');
console.log(`CODE_VERIFIER=${codeVerifier}`);
console.log(`STATE=${state}\n`);

// Build authorization URL
const authUrl = new URL('https://www.etsy.com/oauth/connect');
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('client_id', etsyApiKey);
authUrl.searchParams.set('redirect_uri', redirectUri);
authUrl.searchParams.set('scope', 'listings_r');
authUrl.searchParams.set('state', state);
authUrl.searchParams.set('code_challenge', codeChallenge);
authUrl.searchParams.set('code_challenge_method', 'S256');

console.log('🌐 Step 1: Visit this URL to authorize your app:');
console.log(authUrl.toString());
console.log('\n📝 Step 2: After authorization, you\'ll be redirected to your callback URL with a "code" parameter');
console.log('📝 Step 3: Use that code with the exchange-token.js script to get your access token\n');

console.log('💡 Make sure your redirect URI is configured in your Etsy app settings:');
console.log(`   ${redirectUri}`);