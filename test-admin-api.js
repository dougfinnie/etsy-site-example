const axios = require('axios');
require('dotenv').config();

const shopifyAdminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const shopifyDomain = process.env.SHOPIFY_DOMAIN;
const shopifyApiVersion = "2024-10";

async function testAdminAPI() {
  console.log('Testing Admin API access...\n');
  console.log(`Domain: ${shopifyDomain}`);
  console.log(`Token: ${shopifyAdminToken ? shopifyAdminToken.substring(0, 10) + '...' : 'MISSING'}`);
  console.log(`API Version: ${shopifyApiVersion}\n`);
  
  // Test 1: Try REST API first (simpler)
  const restEndpoint = `https://${shopifyDomain}/admin/api/${shopifyApiVersion}/shop.json`;
  console.log('=== Test 1: REST API ===');
  console.log(`Testing: ${restEndpoint}`);
  
  try {
    const restResponse = await axios.get(restEndpoint, {
      headers: {
        'X-Shopify-Access-Token': shopifyAdminToken
      }
    });
    console.log('✅ REST API works!');
    console.log('Shop info:', restResponse.data.shop.name);
  } catch (error) {
    console.log('❌ REST API failed:');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
  }
  
  // Test 2: Try GraphQL endpoint
  const graphqlEndpoint = `https://${shopifyDomain}/admin/api/${shopifyApiVersion}/graphql.json`;
  console.log('\n=== Test 2: GraphQL API ===');
  console.log(`Testing: ${graphqlEndpoint}`);
  
  const simpleQuery = `
    query {
      shop {
        id
        name
        email
      }
    }
  `;
  
  try {
    const graphqlResponse = await axios.post(graphqlEndpoint, {
      query: simpleQuery
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyAdminToken
      }
    });
    
    if (graphqlResponse.data.errors) {
      console.log('❌ GraphQL has errors:', graphqlResponse.data.errors);
    } else {
      console.log('✅ GraphQL API works!');
      console.log('Shop info:', graphqlResponse.data.data.shop.name);
    }
  } catch (error) {
    console.log('❌ GraphQL API failed:');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
  }
  
  // Test 3: Test a simple product query
  console.log('\n=== Test 3: Product Query ===');
  
  const productQuery = `
    query {
      products(first: 1) {
        edges {
          node {
            id
            title
            handle
            images(first: 3) {
              edges {
                node {
                  id
                  url
                  altText
                }
              }
            }
          }
        }
      }
    }
  `;
  
  try {
    const productResponse = await axios.post(graphqlEndpoint, {
      query: productQuery
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyAdminToken
      }
    });
    
    if (productResponse.data.errors) {
      console.log('❌ Product query has errors:', productResponse.data.errors);
    } else {
      console.log('✅ Product query works!');
      const product = productResponse.data.data.products.edges[0]?.node;
      if (product) {
        console.log(`Product: ${product.title}`);
        console.log(`Images: ${product.images.edges.length}`);
        if (product.images.edges.length > 0) {
          const firstImage = product.images.edges[0].node;
          console.log(`First image alt text: "${firstImage.altText || 'NULL'}"`);
        }
      }
    }
  } catch (error) {
    console.log('❌ Product query failed:');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
  }
  
  console.log('\n=== API Access Summary ===');
  console.log('If REST API works but GraphQL fails, check:');
  console.log('1. Admin API scopes include GraphQL access');
  console.log('2. Token has read_products permission');
  console.log('3. API version compatibility');
}

testAdminAPI().catch(console.error);