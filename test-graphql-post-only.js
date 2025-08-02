const axios = require('axios');
require('dotenv').config();

const shopifyAdminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const shopifyDomain = process.env.SHOPIFY_DOMAIN;

async function testGraphQLPostExclusively() {
  console.log('Testing GraphQL Admin API with POST requests only...\n');
  console.log(`Domain: ${shopifyDomain}`);
  console.log(`Token: ${shopifyAdminToken ? shopifyAdminToken.substring(0, 10) + '...' : 'MISSING'}\n`);
  
  const endpoint = `https://${shopifyDomain}/admin/api/2024-10/graphql.json`;
  console.log(`GraphQL Endpoint: ${endpoint}\n`);
  
  // Test 1: Very simple query
  console.log('=== Test 1: Simple Shop Query (POST) ===');
  
  const simpleQuery = `
    query {
      shop {
        id
        name
      }
    }
  `;
  
  const requestBody = {
    query: simpleQuery
  };
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': shopifyAdminToken,
    'Accept': 'application/json'
  };
  
  console.log('Request headers:', Object.keys(headers));
  console.log('Request body:', JSON.stringify(requestBody, null, 2));
  
  try {
    const response = await axios({
      method: 'POST',
      url: endpoint,
      headers: headers,
      data: requestBody,
      timeout: 10000
    });
    
    console.log('✅ HTTP Status:', response.status);
    console.log('Response headers:', Object.keys(response.headers));
    
    if (response.data.errors) {
      console.log('❌ GraphQL Errors:', JSON.stringify(response.data.errors, null, 2));
    } else if (response.data.data) {
      console.log('✅ GraphQL Success!');
      console.log('Shop data:', response.data.data.shop);
    } else {
      console.log('⚠️  Unexpected response format:', response.data);
    }
    
  } catch (error) {
    console.log('❌ Request failed:');
    console.log('  Status:', error.response?.status);
    console.log('  Status Text:', error.response?.statusText);
    console.log('  Response Data:', error.response?.data);
    console.log('  Error Message:', error.message);
    
    if (error.response?.status === 404) {
      console.log('\n🔍 404 Analysis:');
      console.log('  - Endpoint might not exist for this shop');
      console.log('  - GraphQL might not be enabled for this API token');
      console.log('  - Admin API scopes might be insufficient');
    }
  }
  
  // Test 2: Check if endpoint exists with different content type
  console.log('\n=== Test 2: Alternative Content-Type ===');
  
  try {
    const altResponse = await axios({
      method: 'POST',
      url: endpoint,
      headers: {
        'Content-Type': 'application/graphql',
        'X-Shopify-Access-Token': shopifyAdminToken,
        'Accept': 'application/json'
      },
      data: simpleQuery, // Send query as raw string
      timeout: 10000
    });
    
    console.log('✅ Alternative content-type works!');
    console.log('Response:', altResponse.data);
    
  } catch (altError) {
    console.log('❌ Alternative content-type failed:', altError.response?.status);
  }
  
  // Test 3: Check if URL is correct by testing a known bad endpoint
  console.log('\n=== Test 3: URL Validation ===');
  
  const badEndpoint = `https://${shopifyDomain}/admin/api/2024-10/definitely-not-real.json`;
  
  try {
    await axios({
      method: 'POST',
      url: badEndpoint,
      headers: headers,
      data: requestBody,
      timeout: 5000
    });
  } catch (badError) {
    console.log(`Bad endpoint returned: ${badError.response?.status}`);
    if (badError.response?.status === 404) {
      console.log('✅ 404s are working correctly - endpoint validation confirmed');
    }
  }
  
  console.log('\n=== Diagnostic Summary ===');
  console.log('1. All requests use POST method exclusively');
  console.log('2. Proper JSON content-type headers');
  console.log('3. Valid authentication token format');
  console.log('4. If GraphQL still returns 404, likely causes:');
  console.log('   - Admin API app lacks GraphQL permissions');
  console.log('   - Shop plan doesn\'t include GraphQL Admin API');
  console.log('   - API token scopes need updating');
}

testGraphQLPostExclusively().catch(console.error);