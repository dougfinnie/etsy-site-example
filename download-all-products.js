const path = require("path");
require('dotenv').config();

const axios = require("axios");
const fs = require("fs");

const etsyApiKey = process.env.ETSY_API_KEY;
const etsyApiSecret = process.env.ETSY_API_SECRET;
const etsyAccessToken = process.env.ETSY_ACCESS_TOKEN;
const etsyShopId = process.env.ETSY_SHOP_ID;
const etsyApiBaseUrl = "https://api.etsy.com/v3/application/";

const shopPath = `data/shop.json`;
const productsPath = `data/products.json`;

// Ensure data directories exist
if (!fs.existsSync('data')) {
  fs.mkdirSync('data');
}
if (!fs.existsSync('data/products')) {
  fs.mkdirSync('data/products');
}

async function etsyFetch(endpoint, params = {}) {
  if (!etsyApiKey) {
    throw new Error('ETSY_API_KEY environment variable is required');
  }
  if (!etsyAccessToken) {
    throw new Error('ETSY_ACCESS_TOKEN environment variable is required. You need to complete OAuth 2.0 flow first.');
  }

  const url = new URL(endpoint, etsyApiBaseUrl);
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });

  console.log('Making request to:', url.toString());

  try {
    const response = await axios.get(url.toString(), {
      headers: {
        'x-api-key': etsyApiKey,
        'Authorization': `Bearer ${etsyAccessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Etsy API error:', error.response?.status, error.response?.statusText);
    throw error;
  }
}

async function saveJson(path, json) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, JSON.stringify(json, null, 2), (err) => {
      if (err) {
        reject(err);
      } else {
        console.log(`✓ Saved ${path}`);
        resolve();
      }
    });
  });
}

async function fetchProducts() {
  try {
    console.log('Fetching products list...');
    const listingsResponse = await etsyFetch(`shops/${etsyShopId}/listings`, {
      state: 'active',
      limit: 100,
      includes: 'Images'
    });
    
    const listings = listingsResponse.results || [];
    
    const products = listings.map(listing => {
      const image = listing.images && listing.images[0];
      const price = listing.price ? (listing.price.amount / listing.price.divisor) : 0;
      const currencyCode = listing.price ? listing.price.currency_code : 'USD';
      
      return {
        id: listing.listing_id,
        title: listing.title,
        handle: listing.url ? listing.url.split('/').pop() : listing.listing_id.toString(),
        etsyUrl: listing.url || `https://www.etsy.com/listing/${listing.listing_id}`,
        description: listing.description,
        productType: listing.taxonomy_path ? listing.taxonomy_path.join(' > ') : '',
        tags: listing.tags || [],
        vendor: '',
        createdAt: listing.creation_timestamp ? new Date(listing.creation_timestamp * 1000).toISOString() : null,
        updatedAt: listing.last_modified_timestamp ? new Date(listing.last_modified_timestamp * 1000).toISOString() : null,
        publishedAt: listing.creation_timestamp ? new Date(listing.creation_timestamp * 1000).toISOString() : null,
        availableForSale: listing.state === 'active',
        totalInventory: listing.quantity || 0,
        priceRange: {
          minVariantPrice: {
            amount: price.toString(),
            currencyCode: currencyCode
          },
          maxVariantPrice: {
            amount: price.toString(),
            currencyCode: currencyCode
          }
        },
        sku: listing.listing_id.toString(),
        pretty_price: `${currencyCode} ${price.toFixed(2)}`,
        square_thumbnail_url: image ? image.url_170x135 : '',
        saleables: [{
          id: listing.listing_id,
          title: 'Default',
          sku: listing.listing_id.toString(),
          availableForSale: listing.state === 'active',
          quantityAvailable: listing.quantity || 0,
          price: {
            amount: price.toString(),
            currencyCode: currencyCode
          }
        }]
      };
    });
    
    return { results: products };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { results: [] };
  }
}

async function fetchProduct(listingId) {
  try {
    console.log(`Fetching product ${listingId}...`);
    
    const listingResponse = await etsyFetch(`listings/${listingId}`, {
      includes: 'Images,Shop,User,Translations'
    });
    
    const inventoryResponse = await etsyFetch(`listings/${listingId}/inventory`);
    
    const listing = listingResponse;
    const inventory = inventoryResponse.results || [];
    
    const product = {
      id: listing.listing_id,
      title: listing.title,
      handle: listing.url ? listing.url.split('/').pop() : listing.listing_id.toString(),
      etsyUrl: listing.url || `https://www.etsy.com/listing/${listing.listing_id}`,
      description: listing.description,
      descriptionHtml: listing.description,
      productType: listing.taxonomy_path ? listing.taxonomy_path.join(' > ') : '',
      tags: listing.tags || [],
      vendor: listing.shop_section_id || '',
      createdAt: listing.creation_timestamp ? new Date(listing.creation_timestamp * 1000).toISOString() : null,
      updatedAt: listing.last_modified_timestamp ? new Date(listing.last_modified_timestamp * 1000).toISOString() : null,
      publishedAt: listing.creation_timestamp ? new Date(listing.creation_timestamp * 1000).toISOString() : null,
      availableForSale: listing.state === 'active',
      totalInventory: listing.quantity || 0,
      priceRange: {
        minVariantPrice: {
          amount: listing.price ? (listing.price.amount / listing.price.divisor).toString() : '0',
          currencyCode: listing.price ? listing.price.currency_code : 'USD'
        },
        maxVariantPrice: {
          amount: listing.price ? (listing.price.amount / listing.price.divisor).toString() : '0',
          currencyCode: listing.price ? listing.price.currency_code : 'USD'
        }
      },
      images: (listing.images || []).map(img => ({
        id: img.listing_image_id,
        url: img.url_fullxfull,
        altText: img.alt_text || listing.title,
        width: img.full_width,
        height: img.full_height
      })),
      variants: inventory.map(item => ({
        id: item.offering_id || item.product_id,
        title: item.price ? `${item.price.currency_code} ${(item.price.amount / item.price.divisor).toFixed(2)}` : 'Default',
        sku: item.sku || listing.listing_id.toString(),
        availableForSale: item.quantity > 0,
        quantityAvailable: item.quantity || 0,
        price: {
          amount: item.price ? (item.price.amount / item.price.divisor).toString() : '0',
          currencyCode: item.price ? item.price.currency_code : 'USD'
        },
        compareAtPrice: null
      }))
    };

    return product;
  } catch (error) {
    console.error(`Error fetching product ${listingId}:`, error.message);
    return null;
  }
}

async function downloadAllProducts() {
  console.log('🚀 Starting download of all products to cache...\n');
  
  try {
    // First, fetch and cache the products list
    console.log('📋 Fetching products list...');
    const productsData = await fetchProducts();
    await saveJson(productsPath, productsData);
    
    const products = productsData.results || [];
    console.log(`✅ Found ${products.length} products\n`);
    
    if (products.length === 0) {
      console.log('❌ No products found. Check your API credentials and shop configuration.');
      return;
    }
    
    // Download each product individually with detailed info
    console.log('📦 Downloading individual product details...');
    let successful = 0;
    let failed = 0;
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const listingId = product.id;
      const productPath = `data/products/${listingId}.json`;
      
      try {
        const detailedProduct = await fetchProduct(listingId);
        if (detailedProduct) {
          await saveJson(productPath, detailedProduct);
          successful++;
          console.log(`✅ ${i + 1}/${products.length}: ${product.title}`);
        } else {
          failed++;
          console.log(`❌ ${i + 1}/${products.length}: Failed to fetch ${product.title}`);
        }
        
        // Small delay to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        failed++;
        console.log(`❌ ${i + 1}/${products.length}: Error fetching ${product.title}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Download complete!');
    console.log(`✅ Successfully downloaded: ${successful} products`);
    console.log(`❌ Failed downloads: ${failed} products`);
    console.log(`📁 Products cached in: data/products/`);
    
  } catch (error) {
    console.error('❌ Error downloading products:', error.message);
    process.exit(1);
  }
}

// Run the download if this script is executed directly
if (require.main === module) {
  downloadAllProducts().catch(console.error);
}

module.exports = {
  downloadAllProducts,
  fetchProducts,
  fetchProduct
};