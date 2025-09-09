const path = require("path");
require('dotenv').config();

// Require the fastify framework and instantiate it
const fastify = require("fastify")({
  // Set this to true for detailed logging:
  logger: false,
});

// Setup our static files
fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "public"),
  prefix: "/", // optional: default '/'
});

// View is a templating manager for fastify
fastify.register(require("@fastify/view"), {
  engine: {
    pug: require("pug"),
  },
  root: "./views",
});

/**
 * Registering an `onSend` hook in the root encapsulation context.
 */
fastify.addHook("onSend", async function (request, reply) {
	reply.headers({
		"x-clacks-overhead": "GNU Terry Pratchett"
	});
});

// app.use(bodyParser.urlencoded({ extended: true }));
const axios = require("axios");
const fs = require("fs");
const reviews = require("./utils/reviews");

const etsyApiKey = process.env.ETSY_API_KEY;
const etsyApiSecret = process.env.ETSY_API_SECRET;
const etsyAccessToken = process.env.ETSY_ACCESS_TOKEN;
const etsyShopId = process.env.ETSY_SHOP_ID;
const shopName = process.env.SHOP_NAME;
const cachePeriod = 1000 * 60 * 60 * 24 * 7; // 1 week
const etsyApiBaseUrl = "https://api.etsy.com/v3/application/";

// Debug environment variables
console.log('Environment check:');
console.log('ETSY_API_KEY:', etsyApiKey ? '✓' : '✗ MISSING');
console.log('ETSY_API_SECRET:', etsyApiSecret ? '✓' : '✗ MISSING');
console.log('ETSY_ACCESS_TOKEN:', etsyAccessToken ? '✓' : '✗ MISSING');
console.log('ETSY_SHOP_ID:', etsyShopId ? '✓' : '✗ MISSING');
console.log('SHOP_NAME:', shopName ? '✓' : '✗ MISSING');
console.log('API Base URL:', etsyApiBaseUrl);

const shopPath = `data/shop.json`;
const productsPath = `data/products.json`;

// http://expressjs.com/en/starter/basic-routing.html
fastify.get("/", async (req, reply) => {
  console.log("home");
  console.log(shopPath);
  if (!fileExists(shopPath) || hasFileCacheExpired(shopPath)) {
    await getShop();
  }
  
  // Get featured products
  let products;
  if (!fileExists(productsPath) || hasFileCacheExpired(productsPath)) {
    console.log("Fetching products from Etsy...");
    products = await fetchProducts();
    await saveJson(productsPath, products);
  } else {
    products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
  }
  
  const shop = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
  
  if (shop == undefined) {
    console.log('unable to read shop data');
    return;
  }
  
  // Get first few products as featured
  const featured = products.results ? products.results.slice(0, 3) : [];
  
  return reply.viewAsync("index.pug", {
    name: shopName,
    title: shopName,
    featured: featured,
    photo: null, // Etsy doesn't have owner photos in this API
    about: shop.description || "Welcome to our store",
    sites: [], // We'll handle social links differently
  });
});

fastify.get("/product/:identifier", async (req, reply) => {
  const identifier = req.params.identifier;
  let listingId = identifier;
  
  // If identifier is not numeric, try to find the listing ID by handle
  if (isNaN(identifier)) {
    // Load products from cache to find the listing ID by handle
    if (fileExists(productsPath)) {
      const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
      const products = productsData.results || [];
      const product = products.find(p => p.handle === identifier);
      if (product) {
        listingId = product.id;
      } else {
        return reply.code(404).send('Product not found');
      }
    } else {
      return reply.code(404).send('Product not found');
    }
  }
  
  const product = await getProduct(listingId);
  if (!product) {
    return reply.code(404).send('Product not found');
  }
  
  // Optionally add reviews data (currently returns empty due to API limitations)
  try {
    const reviewsData = await reviews.fetchReviewsForListing(listingId);
    product.reviews = reviewsData;
  } catch (error) {
    console.log(`Could not fetch reviews for listing ${listingId}:`, error.message);
    product.reviews = null;
  }
  
  return reply.viewAsync("pattern.pug", {
    pattern: product, // keeping 'pattern' name for template compatibility
    title: shopName + " - " + product.title,
  });
});

fastify.get("/products", async (req, reply) => {
  let productsData;
  if (!fileExists(productsPath) || hasFileCacheExpired(productsPath)) {
    console.log("Product cache expired, fetching from Etsy...");
    productsData = await fetchProducts();
    await saveJson(productsPath, productsData);
  } else {
    productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
  }

  const products = productsData.results || [];
  let sorted = products.sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
  );

  return reply.viewAsync("patterns.pug", {
    patterns: sorted, // keeping 'patterns' name for template compatibility
    title: shopName + " - Products",
  });
});

fastify.get("/tags/:tag", async (req, reply) => {
  const tag = decodeURIComponent(req.params.tag);
  
  let productsData;
  if (!fileExists(productsPath) || hasFileCacheExpired(productsPath)) {
    console.log("Product cache expired, fetching from Etsy...");
    productsData = await fetchProducts();
    await saveJson(productsPath, productsData);
  } else {
    productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
  }

  const products = productsData.results || [];
  
  // Filter products by tag (case-insensitive)
  const filteredProducts = products.filter(product => 
    product.tags && product.tags.some(productTag => 
      productTag.toLowerCase() === tag.toLowerCase()
    )
  );
  
  let sorted = filteredProducts.sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
  );

  return reply.viewAsync("tag-products.pug", {
    patterns: sorted,
    tag: tag,
    title: shopName + " - " + tag.charAt(0).toUpperCase() + tag.slice(1),
  });
});

fastify.get("/tags", async (req, reply) => {
  let productsData;
  if (!fileExists(productsPath) || hasFileCacheExpired(productsPath)) {
    console.log("Product cache expired, fetching from Etsy...");
    productsData = await fetchProducts();
    await saveJson(productsPath, productsData);
  } else {
    productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
  }

  const products = productsData.results || [];
  
  // Collect all unique tags with product counts
  const tagCounts = {};
  products.forEach(product => {
    if (product.tags) {
      product.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });
  
  // Sort tags by count (most popular first)
  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count }));

  return reply.viewAsync("tags.pug", {
    tags: sortedTags,
    title: shopName + " - Browse by Tags",
  });
});

fastify.get("/api/refresh-products", async (req, reply) => {
  const json = await fetchProducts();
  await saveJson(productsPath, json);
  return reply.send("ok");
});

fastify.get("/api/refresh-shop", async (req, reply) => {
  const shop = await getShop();
  await saveJson(shopPath, shop);
  return reply.send("ok");
});

fastify.get("/api/reviews/:listingId", async (req, reply) => {
  const listingId = req.params.listingId;
  try {
    const reviewsData = await reviews.fetchReviewsForListing(listingId);
    return reply.send(reviewsData);
  } catch (error) {
    console.error(`Error fetching reviews for listing ${listingId}:`, error);
    return reply.code(500).send({ error: 'Failed to fetch reviews', message: error.message });
  }
});

fastify.get("/api/reviews", async (req, reply) => {
  try {
    const allReviews = await reviews.fetchAllProductReviews();
    return reply.send(allReviews);
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    return reply.code(500).send({ error: 'Failed to fetch reviews', message: error.message });
  }
});

fastify.get("/api/reviews-summary", async (req, reply) => {
  try {
    const summary = await reviews.getReviewsSummary();
    return reply.send(summary);
  } catch (error) {
    console.error('Error fetching reviews summary:', error);
    return reply.code(500).send({ error: 'Failed to fetch reviews summary', message: error.message });
  }
});

async function getProduct(listingId) {
  const productPath = `data/products/${listingId}.json`;
  if (fileExists(productPath)) {
    console.log(productPath + " exists");

    if (!hasFileCacheExpired(productPath)) {
      const product = JSON.parse(fs.readFileSync(productPath, 'utf8'));
      return product;
    }
  }
  
  try {
    // Get listing details
    const listingResponse = await etsyFetch(`listings/${listingId}`, {
      includes: 'Images,Shop,User,Translations'
    });
    
    // Get listing inventory (for pricing and variants)
    const inventoryResponse = await etsyFetch(`listings/${listingId}/inventory`);
    
    const listing = listingResponse;
    const inventory = inventoryResponse.results || [];
    
    // Transform Etsy listing to match expected structure
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

    await saveJson(productPath, product);
    return product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

async function getShop() {
  try {
    const shopResponse = await etsyFetch(`shops/${etsyShopId}`);
    
    // Transform Etsy shop to match expected structure
    const shop = {
      id: shopResponse.shop_id,
      name: shopResponse.shop_name,
      description: shopResponse.announcement || shopResponse.sale_message || '',
      primaryDomain: {
        url: shopResponse.url,
        host: 'etsy.com'
      },
      brand: {
        logo: {
          image: {
            url: shopResponse.icon_url_fullxfull || '',
            altText: shopResponse.shop_name
          }
        },
        shortDescription: shopResponse.announcement || '',
        slogan: shopResponse.title || ''
      },
      paymentSettings: {
        currencyCode: shopResponse.currency_code || 'USD'
      }
    };
    
    await saveJson(shopPath, shop);
    return shop;
  } catch (error) {
    console.error('Error fetching shop:', error);
    return null;
  }
}

async function fetchProducts() {
  try {
    const listingsResponse = await etsyFetch(`shops/${etsyShopId}/listings`, {
      state: 'active',
      limit: 100,
      includes: 'Images'
    });
    
    const listings = listingsResponse.results || [];
    
    // Transform Etsy listings to match expected structure
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
        vendor: '', // Etsy doesn't have this concept
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
        // Add fields for template compatibility
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

async function etsyFetch(endpoint, params = {}) {
  // Check if required environment variables are set
  if (!etsyApiKey) {
    throw new Error('ETSY_API_KEY environment variable is required');
  }
  if (!etsyAccessToken) {
    throw new Error('ETSY_ACCESS_TOKEN environment variable is required. You need to complete OAuth 2.0 flow first.');
  }

  // Build URL with query parameters
  const url = new URL(endpoint, etsyApiBaseUrl);
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });

  console.log('Making request to:', url.toString());
  console.log('Using API key:', etsyApiKey ? `${etsyApiKey.substring(0, 10)}...` : 'MISSING');

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
    console.error('Etsy API error details:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Response data:', error.response?.data);
    console.error('Request URL:', url.toString());
    console.error('Error message:', error.message);
    
    // If this is an authentication error, provide helpful guidance
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error('\n=== AUTHENTICATION ISSUE ===');
      console.error('Your OAuth access token may be invalid or expired.');
      console.error('You need to complete the OAuth 2.0 flow to get a valid access token.');
      console.error('See: https://developers.etsy.com/documentation/essentials/authentication');
    }
    
    throw error;
  }
}

function hasFileCacheExpired(path) {
  if (!fileExists(path)) {
    return true; // File doesn't exist, so it's "expired"
  }
  const stats = fs.statSync(path);
  let fileAge = Date.now() - stats.mtimeMs;
  console.log(`outdated cache: ${fileAge > cachePeriod}`);
  return fileAge > cachePeriod;
}

async function saveJson(path, json) {
  let file = fs.writeFile(path, JSON.stringify(json), (err) => {
    // Checking for errors
    if (err) throw err;
    console.log(`Done writing file ${path}`); // Success
  });
}

function fileExists(file) {
  return fs.existsSync(file);
}

// Run the server and report out to the logs
fastify.listen(
  { port: process.env.PORT, host: "localhost" },
  function (err, address) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Your app is listening on ${address}`);
  }
);
