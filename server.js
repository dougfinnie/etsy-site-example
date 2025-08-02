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

const shopifyStorefrontToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const shopifyDomain = process.env.SHOPIFY_DOMAIN; // your-shop.myshopify.com
const shopifyApiVersion = "2024-10"; // Using stable version instead of 2025-01
const shopName = process.env.SHOP_NAME;
const cachePeriod = 1000 * 60 * 60 * 24 * 7; // 1 week
const shopifyApiEndpoint = `https://${shopifyDomain}/api/${shopifyApiVersion}/graphql.json`;

// Debug environment variables
console.log('Environment check:');
console.log('SHOPIFY_DOMAIN:', shopifyDomain ? '✓' : '✗ MISSING');
console.log('SHOPIFY_STOREFRONT_ACCESS_TOKEN:', shopifyStorefrontToken ? '✓' : '✗ MISSING');
console.log('SHOP_NAME:', shopName ? '✓' : '✗ MISSING');
console.log('API Endpoint:', shopifyApiEndpoint);

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
    console.log("Fetching products from Shopify...");
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
  const featured = products.products ? products.products.slice(0, 3) : [];
  
  return reply.viewAsync("index.pug", {
    name: shopName,
    title: shopName,
    featured: featured,
    photo: null, // Shopify doesn't have owner photos in the same way
    about: shop.description || "Welcome to our store",
    sites: [], // We'll handle social links differently
  });
});

fastify.get("/product/:handle", async (req, reply) => {
  const product = await getProduct(req.params.handle);
  return reply.viewAsync("pattern.pug", {
    pattern: product, // keeping 'pattern' name for template compatibility
    title: shopName + " - " + product.title,
  });
});

fastify.get("/products", async (req, reply) => {
  let productsData;
  if (!fileExists(productsPath) || hasFileCacheExpired(productsPath)) {
    console.log("Product cache expired, fetching from Shopify...");
    productsData = await fetchProducts();
    await saveJson(productsPath, productsData);
  } else {
    productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
  }

  const products = productsData.products || [];
  let sorted = products.sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
  );

  return reply.viewAsync("patterns.pug", {
    patterns: sorted, // keeping 'patterns' name for template compatibility
    title: shopName + " - Products",
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

async function getProduct(handle) {
  const productPath = `data/products/${handle}.json`;
  if (fileExists(productPath)) {
    console.log(productPath + " exists");

    if (!hasFileCacheExpired(productPath)) {
      const product = JSON.parse(fs.readFileSync(productPath, 'utf8'));
      return product;
    }
  }
  
  const query = `
    query getProduct($handle: String!) {
      product(handle: $handle) {
        id
        title
        handle
        description
        descriptionHtml
        productType
        tags
        vendor
        createdAt
        updatedAt
        publishedAt
        availableForSale
        totalInventory
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
          maxVariantPrice {
            amount
            currencyCode
          }
        }
        images(first: 10) {
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
        variants(first: 10) {
          edges {
            node {
              id
              title
              sku
              availableForSale
              quantityAvailable
              price {
                amount
                currencyCode
              }
              compareAtPrice {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  `;
  
  const json = await shopifyFetch(query, { handle });
  const product = json.data.product;

  await saveJson(productPath, product);
  return product;
}

async function getShop() {
  const query = `
    query getShop {
      shop {
        id
        name
        description
        primaryDomain {
          url
          host
        }
        brand {
          logo {
            image {
              url
              altText
            }
          }
          shortDescription
          slogan
        }
        paymentSettings {
          currencyCode
        }
      }
    }
  `;
  
  try {
    const json = await shopifyFetch(query);
    const shop = json.data.shop;
    await saveJson(shopPath, shop);
    return shop;
  } catch (error) {
    console.error('Error fetching shop:', error);
    return null;
  }
}

async function fetchProducts() {
  const query = `
    query getProducts($first: Int!) {
      products(first: $first) {
        edges {
          node {
            id
            title
            handle
            description
            productType
            tags
            vendor
            createdAt
            updatedAt
            publishedAt
            availableForSale
            totalInventory
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
              maxVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 1) {
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
            variants(first: 1) {
              edges {
                node {
                  id
                  title
                  sku
                  availableForSale
                  quantityAvailable
                  price {
                    amount
                    currencyCode
                  }
                  compareAtPrice {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;
  
  try {
    const json = await shopifyFetch(query, { first: 250 });
    
    // Transform GraphQL response to match expected structure
    const products = json.data.products.edges.map(edge => {
      const product = edge.node;
      const variant = product.variants.edges[0]?.node;
      const image = product.images.edges[0]?.node;
      
      return {
        ...product,
        // Add fields for template compatibility
        sku: product.handle,
        title: product.title,
        pretty_price: variant ? `${variant.price.currencyCode} ${variant.price.amount}` : 'N/A',
        square_thumbnail_url: image?.url || '',
        saleables: variant ? [variant] : []
      };
    });
    
    return { products };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { products: [] };
  }
}

async function shopifyFetch(query, variables = {}) {
  // Check if required environment variables are set
  if (!shopifyStorefrontToken) {
    throw new Error('SHOPIFY_STOREFRONT_ACCESS_TOKEN environment variable is required');
  }
  if (!shopifyDomain) {
    throw new Error('SHOPIFY_DOMAIN environment variable is required');
  }

  console.log('Making request to:', shopifyApiEndpoint);
  console.log('Using token:', shopifyStorefrontToken ? `${shopifyStorefrontToken.substring(0, 10)}...` : 'MISSING');

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
    console.error('Shopify API error details:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Response data:', error.response?.data);
    console.error('Request URL:', shopifyApiEndpoint);
    console.error('Error message:', error.message);
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
