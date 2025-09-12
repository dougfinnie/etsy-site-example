require('dotenv').config();
const axios = require('axios');

const etsyApiKey = process.env.ETSY_API_KEY;
const redirectUri = process.env.ETSY_REDIRECT_URI || 'http://localhost:3000/auth/callback';

async function exchangeCodeForToken(authCode, codeVerifier, state) {
  try {
    console.log('🔄 Exchanging authorization code for access token...\n');
    
    // Create form data for the token request
    const formData = new URLSearchParams();
    formData.append('grant_type', 'authorization_code');
    formData.append('client_id', etsyApiKey);
    formData.append('redirect_uri', redirectUri);
    formData.append('code', authCode);
    formData.append('code_verifier', codeVerifier);
    
    console.log('Request details:');
    console.log('URL: https://api.etsy.com/v3/public/oauth/token');
    console.log('client_id:', etsyApiKey);
    console.log('redirect_uri:', redirectUri);
    console.log('code:', authCode);
    console.log('code_verifier:', codeVerifier);
    console.log('code_verifier length:', codeVerifier.length);
    console.log();

    const response = await axios.post('https://api.etsy.com/v3/public/oauth/token', formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const tokenData = response.data;
    
    console.log('✅ Success! Here are your tokens:');
    console.log('=====================================');
    console.log(`ACCESS_TOKEN=${tokenData.access_token}`);
    console.log(`TOKEN_TYPE=${tokenData.token_type}`);
    console.log(`EXPIRES_IN=${tokenData.expires_in} seconds`);
    if (tokenData.refresh_token) {
      console.log(`REFRESH_TOKEN=${tokenData.refresh_token}`);
    }
    console.log('=====================================\n');
    
    console.log('📝 Add this to your .env file:');
    console.log(`ETSY_ACCESS_TOKEN=${tokenData.access_token}`);
    if (tokenData.refresh_token) {
      console.log(`ETSY_REFRESH_TOKEN=${tokenData.refresh_token}`);
    }
    
    const expiryTime = new Date(Date.now() + (tokenData.expires_in * 1000));
    console.log(`\n⏰ Token expires at: ${expiryTime.toLocaleString()}`);
    
    return tokenData;
    
  } catch (error) {
    console.error('❌ Error exchanging code for token:');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data);
    throw error;
  }
}

// Command line usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node exchange-token.js <authorization_code> <code_verifier> [state]');
    console.log('\nExample:');
    console.log('node exchange-token.js abc123def456 dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk optional_state');
    process.exit(1);
  }
  
  const [authCode, codeVerifier, state] = args;
  
  if (!etsyApiKey) {
    console.error('❌ ETSY_API_KEY is missing from .env file');
    process.exit(1);
  }
  
  exchangeCodeForToken(authCode, codeVerifier, state)
    .catch(error => {
      console.error('Failed to exchange token:', error.message);
      process.exit(1);
    });
}

module.exports = { exchangeCodeForToken };