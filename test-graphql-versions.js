const axios = require('axios');
require('dotenv').config();

const shopifyAdminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const shopifyDomain = process.env.SHOPIFY_DOMAIN;

async function testGraphQLVersions() {
  console.log('Testing GraphQL Admin API across different versions...\n');
  
  const versions = ['2025-01', '2024-10', '2024-07', '2024-04'];
  const simpleQuery = `
    query {
      shop {
        id
        name
      }
    }
  `;
  
  for (const version of versions) {
    const endpoint = `https://${shopifyDomain}/admin/api/${version}/graphql.json`;
    console.log(`Testing version ${version}...`);
    console.log(`Endpoint: ${endpoint}`);
    
    try {
      const response = await axios.post(endpoint, {
        query: simpleQuery
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': shopifyAdminToken
        }
      });
      
      if (response.data.errors) {
        console.log(`❌ Version ${version}: GraphQL errors:`, response.data.errors);
      } else {
        console.log(`✅ Version ${version}: SUCCESS! GraphQL Admin API works`);
        console.log(`   Shop: ${response.data.data.shop.name}`);
        
        // If this version works, test a product query
        const productQuery = `
          query {
            products(first: 1) {
              edges {
                node {
                  title
                  images(first: 1) {
                    edges {
                      node {
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
          const productResponse = await axios.post(endpoint, {
            query: productQuery
          }, {
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': shopifyAdminToken
            }
          });
          
          if (productResponse.data.errors) {
            console.log(`   ⚠️  Product query has errors:`, productResponse.data.errors);
          } else {
            console.log(`   ✅ Product query also works!`);
          }
        } catch (productError) {
          console.log(`   ❌ Product query failed:`, productError.response?.status);
        }
      }
    } catch (error) {
      console.log(`❌ Version ${version}: HTTP ${error.response?.status} - ${error.response?.data?.errors || error.message}`);
    }
    
    console.log('');
  }
  
  console.log('=== Recommendations ===');
  console.log('If all versions fail with 404:');
  console.log('1. Check Admin API app scopes include GraphQL access');
  console.log('2. Regenerate Admin API access token after updating scopes');
  console.log('3. Verify the app has "Admin API" permissions (not just "Storefront API")');
  console.log('4. Some Shopify plans may not support GraphQL Admin API');
}

testGraphQLVersions().catch(console.error);