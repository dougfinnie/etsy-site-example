require('dotenv').config();
const axios = require('axios');

const etsyApiKey = process.env.ETSY_API_KEY;
const etsyAccessToken = process.env.ETSY_ACCESS_TOKEN;
const etsyShopId = process.env.ETSY_SHOP_ID;

console.log('🔍 Testing Etsy API Authentication...\n');

console.log('Environment Variables:');
console.log('ETSY_API_KEY:', etsyApiKey ? `${etsyApiKey.substring(0, 10)}...` : 'MISSING');
console.log('ETSY_ACCESS_TOKEN:', etsyAccessToken ? `${etsyAccessToken.substring(0, 20)}...` : 'MISSING');
console.log('ETSY_SHOP_ID:', etsyShopId || 'MISSING');
console.log('Token Length:', etsyAccessToken ? etsyAccessToken.length : 0);
console.log();

async function testAuth() {
  if (!etsyApiKey || !etsyAccessToken || !etsyShopId) {
    console.error('❌ Missing required environment variables');
    return;
  }

  try {
    console.log('🧪 Testing API call to get shop info...');
    
    const url = `https://api.etsy.com/v3/application/shops/${etsyShopId}`;
    console.log('URL:', url);
    
    const response = await axios.get(url, {
      headers: {
        'x-api-key': etsyApiKey,
        'Authorization': `Bearer ${etsyAccessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Success! API call worked.');
    console.log('Shop Name:', response.data.shop_name);
    console.log('Shop URL:', response.data.url);
    
  } catch (error) {
    console.error('❌ API call failed:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
    
    if (error.response?.status === 401) {
      console.error('\n🔑 Authentication Error:');
      console.error('- Your access token is likely expired or invalid');
      console.error('- Access tokens expire after 1 hour');
      console.error('- Run the re-authentication process to get a new token');
    } else if (error.response?.status === 403) {
      console.error('\n🚫 Authorization Error:');
      console.error('- Your token may not have the required scopes');
      console.error('- Check that your app has the necessary permissions');
    } else if (error.response?.status === 400) {
      console.error('\n📝 Bad Request:');
      console.error('- Check your shop ID and API parameters');
    }
  }
}

testAuth();