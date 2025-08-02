const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

const shopifyStorefrontToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const shopifyDomain = process.env.SHOPIFY_DOMAIN;
const shopifyApiVersion = "2024-10";
const shopifyApiEndpoint = `https://${shopifyDomain}/api/${shopifyApiVersion}/graphql.json`;

async function shopifyFetch(query, variables = {}) {
  try {
    const response = await axios.post(shopifyApiEndpoint, {
      query,
      variables
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': shopifyStorefrontToken
      }
    });
    
    if (response.data.errors) {
      console.error('GraphQL errors:', response.data.errors);
      throw new Error('GraphQL query failed: ' + JSON.stringify(response.data.errors));
    }
    
    return response.data;
  } catch (error) {
    console.error('Shopify API error:', error.response?.data || error.message);
    throw error;
  }
}

async function testImageQuery() {
  console.log('Testing direct image query from Storefront API...\n');
  
  // Test with a simple query first to get just a few products with full image details
  const query = `
    query getProductsWithImages($first: Int!) {
      products(first: $first) {
        edges {
          node {
            id
            title
            handle
            images(first: 5) {
              edges {
                node {
                  id
                  url
                  altText
                  width
                  height
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const result = await shopifyFetch(query, { first: 5 });
    
    console.log('=== Raw API Response Sample ===');
    console.log(JSON.stringify(result.data.products.edges[0], null, 2));
    
    console.log('\n=== Image Alt Text Analysis (Live from API) ===');
    result.data.products.edges.forEach(edge => {
      const product = edge.node;
      console.log(`\nProduct: ${product.title}`);
      console.log(`Handle: ${product.handle}`);
      
      if (product.images.edges.length > 0) {
        product.images.edges.forEach((imageEdge, index) => {
          const image = imageEdge.node;
          console.log(`  Image ${index + 1}:`);
          console.log(`    ID: ${image.id}`);
          console.log(`    URL: ${image.url}`);
          console.log(`    Alt Text: "${image.altText || 'NULL/EMPTY'}"`);
          console.log(`    Dimensions: ${image.width}x${image.height}`);
        });
      } else {
        console.log('  No images found');
      }
    });
    
    return result;
    
  } catch (error) {
    console.error('Failed to fetch from API:', error.message);
    return null;
  }
}

async function compareWithCachedData() {
  console.log('\n=== Comparing with Cached Data ===');
  
  try {
    const cachedData = JSON.parse(fs.readFileSync('./data/products.json', 'utf8'));
    const cachedProducts = cachedData.products || [];
    
    console.log(`Cached data contains ${cachedProducts.length} products`);
    
    // Show first 3 products from cache
    cachedProducts.slice(0, 3).forEach(product => {
      console.log(`\nCached Product: ${product.title}`);
      if (product.images && product.images.edges) {
        product.images.edges.forEach((imageEdge, index) => {
          const image = imageEdge.node;
          console.log(`  Cached Image ${index + 1} Alt Text: "${image.altText || 'NULL/EMPTY'}"`);
        });
      }
    });
    
  } catch (error) {
    console.error('Failed to read cached data:', error.message);
  }
}

async function testAlternativeImageQuery() {
  console.log('\n=== Testing Alternative Query Format ===');
  
  // Try a different query format to see if we get different results
  const altQuery = `
    query getProductImages {
      products(first: 3) {
        edges {
          node {
            title
            handle
            featuredImage {
              id
              url
              altText
              width
              height
            }
            images(first: 10) {
              nodes {
                id
                url
                altText
                width
                height
              }
            }
          }
        }
      }
    }
  `;

  try {
    const result = await shopifyFetch(altQuery);
    
    console.log('Alternative query results:');
    result.data.products.edges.forEach(edge => {
      const product = edge.node;
      console.log(`\nProduct: ${product.title}`);
      
      if (product.featuredImage) {
        console.log(`  Featured Image Alt: "${product.featuredImage.altText || 'NULL/EMPTY'}"`);
      }
      
      if (product.images.nodes) {
        product.images.nodes.forEach((image, index) => {
          console.log(`  Image ${index + 1} Alt (nodes format): "${image.altText || 'NULL/EMPTY'}"`);
        });
      }
    });
    
  } catch (error) {
    console.log('Alternative query failed:', error.message);
  }
}

// Run the diagnostic
async function runDiagnostic() {
  console.log('🔍 Diagnosing Image Alt Text Issue\n');
  console.log(`API Endpoint: ${shopifyApiEndpoint}`);
  console.log(`API Version: ${shopifyApiVersion}`);
  
  await testImageQuery();
  await compareWithCachedData();
  await testAlternativeImageQuery();
  
  console.log('\n=== Recommendations ===');
  console.log('1. Check if recent alt text changes in Shopify admin are newer than cached data');
  console.log('2. Refresh cached data: visit /api/refresh-products');
  console.log('3. Verify Storefront API permissions vs Admin API capabilities');
  console.log('4. Consider using Admin API if Storefront API has limitations');
}

runDiagnostic().catch(console.error);