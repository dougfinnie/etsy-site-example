const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

const shopifyAdminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const shopifyDomain = process.env.SHOPIFY_DOMAIN;
const shopifyApiVersion = "2024-10";
const adminApiEndpoint = `https://${shopifyDomain}/admin/api/${shopifyApiVersion}/graphql.json`;

async function adminApiCall(query, variables = {}) {
  try {
    const response = await axios.post(adminApiEndpoint, {
      query,
      variables
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyAdminToken
      }
    });
    
    if (response.data.errors) {
      console.error('GraphQL errors:', response.data.errors);
      throw new Error('GraphQL query failed: ' + JSON.stringify(response.data.errors));
    }
    
    return response.data;
  } catch (error) {
    console.error('Admin API error:', error.response?.data || error.message);
    throw error;
  }
}

async function getAllProductsWithImages() {
  console.log('Fetching all products with images from Admin API...\n');
  
  const allProducts = [];
  let hasNextPage = true;
  let cursor = null;
  
  while (hasNextPage) {
    const query = `
      query getProducts($first: Int!, $after: String) {
        products(first: $first, after: $after) {
          edges {
            node {
              id
              title
              handle
              productType
              vendor
              status
              createdAt
              updatedAt
              images(first: 20) {
                edges {
                  node {
                    id
                    url
                    altText
                    width
                    height
                    originalSrc
                  }
                }
              }
            }
            cursor
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;
    
    console.log(`Fetching products${cursor ? ' (continuation)' : ''}...`);
    
    const result = await adminApiCall(query, { 
      first: 50, 
      after: cursor 
    });
    
    const products = result.data.products.edges.map(edge => edge.node);
    allProducts.push(...products);
    
    hasNextPage = result.data.products.pageInfo.hasNextPage;
    cursor = result.data.products.pageInfo.endCursor;
    
    console.log(`Retrieved ${products.length} products (total so far: ${allProducts.length})`);
  }
  
  return allProducts;
}

async function extractImageData() {
  console.log('🔍 Extracting Complete Image Data with Admin API\n');
  console.log(`API Endpoint: ${adminApiEndpoint}`);
  console.log(`API Version: ${shopifyApiVersion}\n`);
  
  try {
    const products = await getAllProductsWithImages();
    
    console.log(`\n✅ Retrieved ${products.length} products total\n`);
    
    // Extract all image data
    const imageData = [];
    let totalImages = 0;
    let imagesWithAltText = 0;
    let imagesWithoutAltText = 0;
    
    products.forEach(product => {
      if (product.images && product.images.edges && product.images.edges.length > 0) {
        product.images.edges.forEach((imageEdge, imageIndex) => {
          const image = imageEdge.node;
          totalImages++;
          
          const hasAltText = image.altText && image.altText.trim() !== '';
          if (hasAltText) {
            imagesWithAltText++;
          } else {
            imagesWithoutAltText++;
          }
          
          imageData.push({
            productId: product.id,
            productTitle: product.title,
            productHandle: product.handle,
            productType: product.productType || '',
            productStatus: product.status,
            vendor: product.vendor || '',
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
            imageId: image.id,
            imageUrl: image.url,
            originalSrc: image.originalSrc,
            altText: image.altText || '',
            imageWidth: image.width || '',
            imageHeight: image.height || '',
            imageIndex: imageIndex + 1,
            totalImagesForProduct: product.images.edges.length,
            hasAltText: hasAltText
          });
        });
      } else {
        // Product has no images
        imageData.push({
          productId: product.id,
          productTitle: product.title,
          productHandle: product.handle,
          productType: product.productType || '',
          productStatus: product.status,
          vendor: product.vendor || '',
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          imageId: 'NO_IMAGES',
          imageUrl: '',
          originalSrc: '',
          altText: '',
          imageWidth: '',
          imageHeight: '',
          imageIndex: 0,
          totalImagesForProduct: 0,
          hasAltText: false
        });
      }
    });
    
    // Create comprehensive CSV
    const headers = [
      'Product ID',
      'Product Title',
      'Product Handle',
      'Product Type',
      'Product Status',
      'Vendor',
      'Created At',
      'Updated At',
      'Image ID',
      'Image URL',
      'Original Src',
      'Alt Text',
      'Image Width',
      'Image Height',
      'Image Index',
      'Total Images for Product',
      'Has Alt Text'
    ];
    
    const csvContent = [
      headers.join(','),
      ...imageData.map(row => [
        `"${row.productId}"`,
        `"${row.productTitle.replace(/"/g, '""')}"`,
        `"${row.productHandle}"`,
        `"${row.productType}"`,
        `"${row.productStatus}"`,
        `"${row.vendor}"`,
        `"${row.createdAt}"`,
        `"${row.updatedAt}"`,
        `"${row.imageId}"`,
        `"${row.imageUrl}"`,
        `"${row.originalSrc}"`,
        `"${row.altText.replace(/"/g, '""')}"`,
        row.imageWidth,
        row.imageHeight,
        row.imageIndex,
        row.totalImagesForProduct,
        row.hasAltText
      ].join(','))
    ].join('\n');
    
    fs.writeFileSync('complete-product-images-admin-api.csv', csvContent);
    
    // Create images without alt text CSV
    const imagesWithoutAlt = imageData.filter(row => 
      row.imageId !== 'NO_IMAGES' && !row.hasAltText
    );
    
    if (imagesWithoutAlt.length > 0) {
      const missingAltCSV = [
        headers.join(','),
        ...imagesWithoutAlt.map(row => [
          `"${row.productId}"`,
          `"${row.productTitle.replace(/"/g, '""')}"`,
          `"${row.productHandle}"`,
          `"${row.productType}"`,
          `"${row.productStatus}"`,
          `"${row.vendor}"`,
          `"${row.createdAt}"`,
          `"${row.updatedAt}"`,
          `"${row.imageId}"`,
          `"${row.imageUrl}"`,
          `"${row.originalSrc}"`,
          `"${row.altText.replace(/"/g, '""')}"`,
          row.imageWidth,
          row.imageHeight,
          row.imageIndex,
          row.totalImagesForProduct,
          row.hasAltText
        ].join(','))
      ].join('\n');
      
      fs.writeFileSync('images-missing-alt-text-admin-api.csv', missingAltCSV);
    }
    
    // Create statistics summary
    const stats = {
      totalProducts: products.length,
      productsWithImages: products.filter(p => p.images?.edges?.length > 0).length,
      productsWithoutImages: products.filter(p => !p.images?.edges?.length).length,
      totalImages: totalImages,
      imagesWithAltText: imagesWithAltText,
      imagesWithoutAltText: imagesWithoutAltText,
      altTextCoverage: totalImages > 0 ? Math.round((imagesWithAltText / totalImages) * 100) : 0
    };
    
    const summaryCSV = [
      'Statistic,Count',
      `Total Products,${stats.totalProducts}`,
      `Products with Images,${stats.productsWithImages}`,
      `Products without Images,${stats.productsWithoutImages}`,
      `Total Images,${stats.totalImages}`,
      `Images with Alt Text,${stats.imagesWithAltText}`,
      `Images without Alt Text,${stats.imagesWithoutAltText}`,
      `Alt Text Coverage,${stats.altTextCoverage}%`
    ].join('\n');
    
    fs.writeFileSync('admin-api-image-summary.csv', summaryCSV);
    
    console.log('=== Complete Image Analysis (Admin API) ===');
    console.log(`Total products: ${stats.totalProducts}`);
    console.log(`Products with images: ${stats.productsWithImages}`);
    console.log(`Products without images: ${stats.productsWithoutImages}`);
    console.log(`Total images: ${stats.totalImages}`);
    console.log(`Images with alt text: ${stats.imagesWithAltText}`);
    console.log(`Images without alt text: ${stats.imagesWithoutAltText}`);
    console.log(`Alt text coverage: ${stats.altTextCoverage}%`);
    
    console.log('\n=== Generated Files ===');
    console.log('1. complete-product-images-admin-api.csv - All products and images with complete data');
    console.log('2. images-missing-alt-text-admin-api.csv - Only images that need alt text');
    console.log('3. admin-api-image-summary.csv - Statistics summary');
    
    console.log('\n=== Sample of images with alt text ===');
    const imagesWithAlt = imageData.filter(row => row.hasAltText);
    if (imagesWithAlt.length > 0) {
      imagesWithAlt.slice(0, 5).forEach(image => {
        console.log(`✅ ${image.productTitle}`);
        console.log(`   Alt text: "${image.altText}"`);
      });
    } else {
      console.log('No images found with alt text');
    }
    
    console.log('\n=== Sample of images without alt text ===');
    if (imagesWithoutAlt.length > 0) {
      imagesWithoutAlt.slice(0, 5).forEach(image => {
        console.log(`❌ ${image.productTitle} (Image ${image.imageIndex})`);
        console.log(`   URL: ${image.imageUrl}`);
      });
      
      if (imagesWithoutAlt.length > 5) {
        console.log(`... and ${imagesWithoutAlt.length - 5} more images without alt text`);
      }
    }
    
  } catch (error) {
    console.error('Failed to extract image data:', error.message);
  }
}

extractImageData();