const fs = require('fs');

console.log('Generating product-level alt text summary...\n');

// Read the Admin API CSV file
let imageData = [];
try {
  const csvContent = fs.readFileSync('complete-product-images-admin-api.csv', 'utf8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  // Parse header
  const headerLine = lines[0];
  console.log('CSV Headers:', headerLine);
  
  // Process each data line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const fields = [];
    let current = '';
    let inQuotes = false;
    
    // Simple CSV parser
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.replace(/^"|"$/g, ''));
        current = '';
        continue;
      }
      if (char !== '"' || inQuotes) {
        current += char;
      }
    }
    fields.push(current.replace(/^"|"$/g, ''));
    
    // Map to expected format based on GraphQL CSV structure
    if (fields.length >= 17) {
      imageData.push({
        productId: fields[0], // Product ID
        productTitle: fields[1], // Product Title
        productHandle: fields[2], // Product Handle
        productType: fields[3], // Product Type
        productStatus: fields[4], // Product Status
        imageId: fields[8], // Image ID
        altText: fields[11], // Alt Text
        imageIndex: fields[14], // Image Index
        totalImages: parseInt(fields[15]) || 0, // Total Images for Product
        hasAltText: fields[16] === 'true' || (fields[11] && fields[11].trim() !== '') // Has Alt Text or check alt text field
      });
    }
  }
  
  console.log(`Parsed ${imageData.length} image records`);
  
} catch (error) {
  console.error('Error reading CSV file:', error.message);
  process.exit(1);
}

// Group by product
const productMap = new Map();

imageData.forEach(row => {
  const productId = row.productId;
  
  if (!productMap.has(productId)) {
    productMap.set(productId, {
      productId: productId,
      productTitle: row.productTitle,
      productHandle: row.productHandle,
      productType: row.productType,
      productStatus: row.productStatus,
      productUrl: `https://jane-burns-designs.myshopify.com/products/${row.productHandle}`,
      adminUrl: `https://jane-burns-designs.myshopify.com/admin/products/${productId.split('/').pop()}`,
      totalImages: 0,
      imagesWithAltText: 0,
      imagesMissingAltText: 0,
      sku: 'PENDING' // Will be filled from products data
    });
  }
  
  const product = productMap.get(productId);
  product.totalImages++;
  
  if (row.hasAltText) {
    product.imagesWithAltText++;
  } else {
    product.imagesMissingAltText++;
  }
});

// Get SKU data from cached products
try {
  const productsData = JSON.parse(fs.readFileSync('./data/products.json', 'utf8'));
  const products = productsData.products || [];
  
  products.forEach(product => {
    const graphqlId = product.id; // This is already in GraphQL format
    if (productMap.has(graphqlId)) {
      const sku = product.sku || product.handle;
      productMap.get(graphqlId).sku = sku;
    }
  });
  
  console.log(`Updated SKU data for products`);
  
} catch (error) {
  console.warn('Could not load SKU data:', error.message);
}

// Convert to array and sort by most missing alt text
const productArray = Array.from(productMap.values());
productArray.sort((a, b) => b.imagesMissingAltText - a.imagesMissingAltText);

// Create CSV
const headers = [
  'Product Name',
  'SKU',
  'Product URL',
  'Admin URL',
  'Total Images',
  'Images Missing Alt Text',
  'Images With Alt Text',
  'Alt Text Coverage %',
  'Product Type',
  'Status',
  'Handle'
];

const csvRows = productArray.map(product => {
  const coverage = product.totalImages > 0 
    ? Math.round((product.imagesWithAltText / product.totalImages) * 100) 
    : 0;
  
  return [
    `"${product.productTitle.replace(/"/g, '""')}"`,
    `"${product.sku}"`,
    `"${product.productUrl}"`,
    `"${product.adminUrl}"`,
    product.totalImages,
    product.imagesMissingAltText,
    product.imagesWithAltText,
    `${coverage}%`,
    `"${product.productType}"`,
    `"${product.productStatus}"`,
    `"${product.productHandle}"`
  ].join(',');
});

const csvContent = [headers.join(','), ...csvRows].join('\n');
fs.writeFileSync('product-alt-text-summary.csv', csvContent);

// Statistics
const stats = {
  totalProducts: productArray.length,
  productsWithMissingAltText: productArray.filter(p => p.imagesMissingAltText > 0).length,
  productsWithCompleteAltText: productArray.filter(p => p.imagesMissingAltText === 0).length,
  totalImagesMissingAltText: productArray.reduce((sum, p) => sum + p.imagesMissingAltText, 0),
  totalImages: productArray.reduce((sum, p) => sum + p.totalImages, 0)
};

console.log('\n=== Product Alt Text Summary ===');
console.log(`Total products: ${stats.totalProducts}`);
console.log(`Products with missing alt text: ${stats.productsWithMissingAltText}`);
console.log(`Products with complete alt text: ${stats.productsWithCompleteAltText}`);
console.log(`Total images missing alt text: ${stats.totalImagesMissingAltText}`);
console.log(`Overall coverage: ${Math.round((1 - stats.totalImagesMissingAltText / stats.totalImages) * 100)}%`);

console.log('\n=== Generated File ===');
console.log('product-alt-text-summary.csv - Product summary with URLs and missing alt text counts');

console.log('\n=== Top 10 Products Needing Most Alt Text Work ===');
productArray.filter(p => p.imagesMissingAltText > 0).slice(0, 10).forEach((product, index) => {
  console.log(`${index + 1}. ${product.productTitle}`);
  console.log(`   SKU: ${product.sku}`);
  console.log(`   Missing: ${product.imagesMissingAltText}/${product.totalImages} images (${Math.round((product.imagesMissingAltText/product.totalImages)*100)}%)`);
  console.log(`   URL: ${product.productUrl}`);
  console.log('');
});

const completeProducts = productArray.filter(p => p.imagesMissingAltText === 0);
console.log(`=== ${completeProducts.length} Products with Complete Alt Text ===`);
if (completeProducts.length > 0) {
  completeProducts.slice(0, 5).forEach(product => {
    console.log(`✅ ${product.productTitle} (${product.totalImages} images)`);
  });
  if (completeProducts.length > 5) {
    console.log(`... and ${completeProducts.length - 5} more with complete coverage`);
  }
}