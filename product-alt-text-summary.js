const fs = require('fs');

console.log('Generating product-level alt text summary...\n');

// Read the complete image data from the Admin API
let imageData;
try {
  const csvContent = fs.readFileSync('complete-product-images-admin-api.csv', 'utf8');
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',');
  
  imageData = lines.slice(1).filter(line => line.trim()).map(line => {
    // Simple CSV parsing - handle quoted fields
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && (i === 0 || line[i-1] === ',')) {
        inQuotes = true;
      } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i+1] === ',')) {
        inQuotes = false;
      } else if (char === ',' && !inQuotes) {
        values.push(current.replace(/^"|"$/g, '').replace(/""/g, '"'));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.replace(/^"|"$/g, '').replace(/""/g, '"'));
    
    // Map to object using headers
    const obj = {};
    headers.forEach((header, index) => {
      obj[header.replace(/^"|"$/g, '')] = values[index] || '';
    });
    
    return obj;
  });
  
  console.log(`Loaded ${imageData.length} image records`);
  
} catch (error) {
  console.error('Error reading image data:', error.message);
  console.error('Make sure you have run the Admin API image extraction first');
  process.exit(1);
}

// Group by product and calculate missing alt text
const productSummary = {};

imageData.forEach(row => {
  const productId = row['Product ID (Shopify)'];
  const productTitle = row['Product Title'];
  const productHandle = row['Product Handle'];
  const hasAltText = row['Has Alt Text'] === 'true';
  const imageId = row['Image ID (Shopify)'];
  
  // Skip products with no images
  if (imageId === 'NO_IMAGES' || !imageId) {
    return;
  }
  
  if (!productSummary[productId]) {
    productSummary[productId] = {
      productId: productId,
      productTitle: productTitle,
      productHandle: productHandle,
      productUrl: `https://jane-burns-designs.myshopify.com/products/${productHandle}`,
      totalImages: 0,
      imagesWithAltText: 0,
      imagesMissingAltText: 0,
      sku: 'UNKNOWN' // Will be populated from products data
    };
  }
  
  productSummary[productId].totalImages++;
  if (hasAltText) {
    productSummary[productId].imagesWithAltText++;
  } else {
    productSummary[productId].imagesMissingAltText++;
  }
});

// Get SKU information from the latest products cache
let skuData = {};
try {
  const productsData = JSON.parse(fs.readFileSync('./data/products.json', 'utf8'));
  const products = productsData.products || [];
  
  products.forEach(product => {
    const shopifyId = product.id.split('/').pop(); // Extract numeric ID
    if (product.variants && product.variants.edges && product.variants.edges[0]) {
      const variant = product.variants.edges[0].node;
      skuData[shopifyId] = variant.sku || product.handle; // Use variant SKU or fallback to handle
    }
  });
  
  console.log(`Loaded SKU data for ${Object.keys(skuData).length} products`);
  
} catch (error) {
  console.warn('Could not load SKU data from products cache:', error.message);
}

// Update SKUs in product summary
Object.values(productSummary).forEach(product => {
  if (skuData[product.productId]) {
    product.sku = skuData[product.productId];
  }
});

// Convert to array and sort by products with most missing alt text
const productArray = Object.values(productSummary);
productArray.sort((a, b) => b.imagesMissingAltText - a.imagesMissingAltText);

// Create CSV content
const headers = [
  'Product Name',
  'SKU',
  'Product URL',
  'Total Images',
  'Images Missing Alt Text',
  'Images With Alt Text',
  'Alt Text Coverage %',
  'Product Handle',
  'Product ID'
];

const csvContent = [
  headers.join(','),
  ...productArray.map(product => {
    const coverage = product.totalImages > 0 
      ? Math.round((product.imagesWithAltText / product.totalImages) * 100) 
      : 0;
    
    return [
      `"${product.productTitle.replace(/"/g, '""')}"`,
      `"${product.sku}"`,
      `"${product.productUrl}"`,
      product.totalImages,
      product.imagesMissingAltText,
      product.imagesWithAltText,
      `${coverage}%`,
      `"${product.productHandle}"`,
      product.productId
    ].join(',');
  })
].join('\n');

// Write the CSV file
fs.writeFileSync('product-alt-text-summary.csv', csvContent);

// Generate statistics
const stats = {
  totalProducts: productArray.length,
  productsWithMissingAltText: productArray.filter(p => p.imagesMissingAltText > 0).length,
  productsWithCompleteAltText: productArray.filter(p => p.imagesMissingAltText === 0).length,
  totalImagesMissingAltText: productArray.reduce((sum, p) => sum + p.imagesMissingAltText, 0),
  totalImages: productArray.reduce((sum, p) => sum + p.totalImages, 0)
};

const statsCSV = [
  'Statistic,Count',
  `Total Products,${stats.totalProducts}`,
  `Products with Missing Alt Text,${stats.productsWithMissingAltText}`,
  `Products with Complete Alt Text,${stats.productsWithCompleteAltText}`,
  `Total Images Missing Alt Text,${stats.totalImagesMissingAltText}`,
  `Total Images,${stats.totalImages}`,
  `Overall Alt Text Coverage,${Math.round((1 - stats.totalImagesMissingAltText / stats.totalImages) * 100)}%`
].join('\n');

fs.writeFileSync('product-alt-text-stats.csv', statsCSV);

console.log('=== Product Alt Text Summary ===');
console.log(`Total products analyzed: ${stats.totalProducts}`);
console.log(`Products with missing alt text: ${stats.productsWithMissingAltText}`);
console.log(`Products with complete alt text: ${stats.productsWithCompleteAltText}`);
console.log(`Total images missing alt text: ${stats.totalImagesMissingAltText}`);
console.log(`Overall coverage: ${Math.round((1 - stats.totalImagesMissingAltText / stats.totalImages) * 100)}%`);

console.log('\n=== Generated Files ===');
console.log('1. product-alt-text-summary.csv - Product-level summary with URLs and missing counts');
console.log('2. product-alt-text-stats.csv - Overall statistics');

console.log('\n=== Top 10 Products with Most Missing Alt Text ===');
productArray.slice(0, 10).forEach((product, index) => {
  console.log(`${index + 1}. ${product.productTitle}`);
  console.log(`   SKU: ${product.sku}`);
  console.log(`   Missing: ${product.imagesMissingAltText}/${product.totalImages} images`);
  console.log(`   URL: ${product.productUrl}`);
  console.log('');
});

console.log('=== Products with Complete Alt Text ===');
const completeProducts = productArray.filter(p => p.imagesMissingAltText === 0);
if (completeProducts.length > 0) {
  console.log(`${completeProducts.length} products have complete alt text coverage:`);
  completeProducts.slice(0, 5).forEach(product => {
    console.log(`✅ ${product.productTitle} (${product.totalImages} images)`);
  });
  if (completeProducts.length > 5) {
    console.log(`... and ${completeProducts.length - 5} more`);
  }
} else {
  console.log('No products have complete alt text coverage');
}