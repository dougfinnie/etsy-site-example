const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

const shopifyAdminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const shopifyDomain = process.env.SHOPIFY_DOMAIN;
const shopifyApiVersion = "2024-10";
const baseURL = `https://${shopifyDomain}/admin/api/${shopifyApiVersion}`;

async function restApiCall(endpoint) {
  try {
    const response = await axios.get(`${baseURL}${endpoint}`, {
      headers: {
        'X-Shopify-Access-Token': shopifyAdminToken
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error.response?.status, error.response?.data || error.message);
    throw error;
  }
}

async function getAllProducts() {
  console.log('Fetching all products using REST API...\n');
  
  let allProducts = [];
  let nextPageInfo = null;
  let pageCount = 0;
  
  try {
    do {
      pageCount++;
      let url = '/products.json?limit=250&fields=id,title,handle,product_type,vendor,status,created_at,updated_at,images';
      
      if (nextPageInfo) {
        url += `&page_info=${nextPageInfo}`;
      }
      
      console.log(`Fetching page ${pageCount}...`);
      const response = await axios.get(`${baseURL}${url}`, {
        headers: {
          'X-Shopify-Access-Token': shopifyAdminToken
        }
      });
      
      const products = response.data.products;
      allProducts.push(...products);
      
      console.log(`Retrieved ${products.length} products (total: ${allProducts.length})`);
      
      // Check for next page
      const linkHeader = response.headers.link;
      nextPageInfo = null;
      
      if (linkHeader) {
        const nextMatch = linkHeader.match(/<[^>]+page_info=([^>&]+)[^>]*>; rel="next"/);
        if (nextMatch) {
          nextPageInfo = nextMatch[1];
        }
      }
      
    } while (nextPageInfo);
    
    return allProducts;
    
  } catch (error) {
    console.error('Error fetching products:', error.message);
    throw error;
  }
}

async function extractImageData() {
  console.log('🔍 Extracting Complete Image Data with REST Admin API\n');
  console.log(`API Base URL: ${baseURL}`);
  console.log(`API Version: ${shopifyApiVersion}\n`);
  
  try {
    const products = await getAllProducts();
    
    console.log(`\n✅ Retrieved ${products.length} products total\n`);
    
    // Extract all image data
    const imageData = [];
    let totalImages = 0;
    let imagesWithAltText = 0;
    let imagesWithoutAltText = 0;
    
    products.forEach(product => {
      if (product.images && product.images.length > 0) {
        product.images.forEach((image, imageIndex) => {
          totalImages++;
          
          const hasAltText = image.alt && image.alt.trim() !== '';
          if (hasAltText) {
            imagesWithAltText++;
          } else {
            imagesWithoutAltText++;
          }
          
          imageData.push({
            productId: `gid://shopify/Product/${product.id}`,
            shopifyProductId: product.id,
            productTitle: product.title,
            productHandle: product.handle,
            productType: product.product_type || '',
            productStatus: product.status,
            vendor: product.vendor || '',
            createdAt: product.created_at,
            updatedAt: product.updated_at,
            imageId: `gid://shopify/ProductImage/${image.id}`,
            shopifyImageId: image.id,
            imageUrl: image.src,
            altText: image.alt || '',
            imageWidth: image.width || '',
            imageHeight: image.height || '',
            imageIndex: imageIndex + 1,
            totalImagesForProduct: product.images.length,
            hasAltText: hasAltText,
            imagePosition: image.position || imageIndex + 1
          });
        });
      } else {
        // Product has no images
        imageData.push({
          productId: `gid://shopify/Product/${product.id}`,
          shopifyProductId: product.id,
          productTitle: product.title,
          productHandle: product.handle,
          productType: product.product_type || '',
          productStatus: product.status,
          vendor: product.vendor || '',
          createdAt: product.created_at,
          updatedAt: product.updated_at,
          imageId: 'NO_IMAGES',
          shopifyImageId: '',
          imageUrl: '',
          altText: '',
          imageWidth: '',
          imageHeight: '',
          imageIndex: 0,
          totalImagesForProduct: 0,
          hasAltText: false,
          imagePosition: 0
        });
      }
    });
    
    // Create comprehensive CSV
    const headers = [
      'Product ID (GraphQL)',
      'Product ID (Shopify)',
      'Product Title',
      'Product Handle',
      'Product Type',
      'Product Status',
      'Vendor',
      'Created At',
      'Updated At',
      'Image ID (GraphQL)',
      'Image ID (Shopify)',
      'Image URL',
      'Alt Text',
      'Image Width',
      'Image Height',
      'Image Index',
      'Image Position',
      'Total Images for Product',
      'Has Alt Text'
    ];
    
    const csvContent = [
      headers.join(','),
      ...imageData.map(row => [
        `"${row.productId}"`,
        row.shopifyProductId,
        `"${row.productTitle.replace(/"/g, '""')}"`,
        `"${row.productHandle}"`,
        `"${row.productType}"`,
        `"${row.productStatus}"`,
        `"${row.vendor}"`,
        `"${row.createdAt}"`,
        `"${row.updatedAt}"`,
        `"${row.imageId}"`,
        row.shopifyImageId,
        `"${row.imageUrl}"`,
        `"${row.altText.replace(/"/g, '""')}"`,
        row.imageWidth,
        row.imageHeight,
        row.imageIndex,
        row.imagePosition,
        row.totalImagesForProduct,
        row.hasAltText
      ].join(','))
    ].join('\n');
    
    fs.writeFileSync('complete-product-images-rest-api.csv', csvContent);
    
    // Create images without alt text CSV
    const imagesWithoutAlt = imageData.filter(row => 
      row.imageId !== 'NO_IMAGES' && !row.hasAltText
    );
    
    if (imagesWithoutAlt.length > 0) {
      const missingAltCSV = [
        headers.join(','),
        ...imagesWithoutAlt.map(row => [
          `"${row.productId}"`,
          row.shopifyProductId,
          `"${row.productTitle.replace(/"/g, '""')}"`,
          `"${row.productHandle}"`,
          `"${row.productType}"`,
          `"${row.productStatus}"`,
          `"${row.vendor}"`,
          `"${row.createdAt}"`,
          `"${row.updatedAt}"`,
          `"${row.imageId}"`,
          row.shopifyImageId,
          `"${row.imageUrl}"`,
          `"${row.altText.replace(/"/g, '""')}"`,
          row.imageWidth,
          row.imageHeight,
          row.imageIndex,
          row.imagePosition,
          row.totalImagesForProduct,
          row.hasAltText
        ].join(','))
      ].join('\n');
      
      fs.writeFileSync('images-missing-alt-text-rest-api.csv', missingAltCSV);
    }
    
    // Create statistics summary
    const stats = {
      totalProducts: products.length,
      productsWithImages: products.filter(p => p.images?.length > 0).length,
      productsWithoutImages: products.filter(p => !p.images?.length).length,
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
    
    fs.writeFileSync('rest-api-image-summary.csv', summaryCSV);
    
    console.log('=== Complete Image Analysis (REST Admin API) ===');
    console.log(`Total products: ${stats.totalProducts}`);
    console.log(`Products with images: ${stats.productsWithImages}`);
    console.log(`Products without images: ${stats.productsWithoutImages}`);
    console.log(`Total images: ${stats.totalImages}`);
    console.log(`Images with alt text: ${stats.imagesWithAltText}`);
    console.log(`Images without alt text: ${stats.imagesWithoutAltText}`);
    console.log(`Alt text coverage: ${stats.altTextCoverage}%`);
    
    console.log('\n=== Generated Files ===');
    console.log('1. complete-product-images-rest-api.csv - All products and images with complete data');
    console.log('2. images-missing-alt-text-rest-api.csv - Only images that need alt text');
    console.log('3. rest-api-image-summary.csv - Statistics summary');
    
    console.log('\n=== Sample of images with alt text ===');
    const imagesWithAlt = imageData.filter(row => row.hasAltText);
    if (imagesWithAlt.length > 0) {
      imagesWithAlt.slice(0, 5).forEach(image => {
        console.log(`✅ ${image.productTitle} (Image ${image.imageIndex})`);
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