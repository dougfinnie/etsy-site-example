const fs = require('fs');
const path = require('path');

// Read the products data
const productsData = JSON.parse(fs.readFileSync('./data/products.json', 'utf8'));
const products = productsData.products || [];

console.log(`Analyzing ${products.length} products for missing SKUs...`);

// Find products without SKUs
const productsWithoutSKUs = [];
const productsWithMissingVariantSKUs = [];

products.forEach(product => {
  let hasAllSKUs = true;
  let variantIssues = [];
  
  // Check if main product SKU is missing (our computed field)
  if (!product.sku || product.sku === product.handle) {
    // If our computed SKU equals the handle, it means the variant had no SKU
    hasAllSKUs = false;
  }
  
  // Check individual variants
  if (product.variants && product.variants.edges) {
    product.variants.edges.forEach((variantEdge, index) => {
      const variant = variantEdge.node;
      if (!variant.sku || variant.sku === null || variant.sku === '') {
        variantIssues.push({
          variantId: variant.id,
          variantTitle: variant.title,
          variantIndex: index
        });
        hasAllSKUs = false;
      }
    });
  }
  
  if (!hasAllSKUs) {
    const productInfo = {
      id: product.id,
      title: product.title,
      handle: product.handle,
      productType: product.productType,
      vendor: product.vendor,
      price: product.pretty_price,
      variantIssues: variantIssues,
      totalVariants: product.variants?.edges?.length || 0
    };
    
    if (variantIssues.length > 0) {
      productsWithMissingVariantSKUs.push(productInfo);
    } else {
      productsWithoutSKUs.push(productInfo);
    }
  }
});

// Create CSV content
const createCSV = (products, filename) => {
  if (products.length === 0) {
    console.log(`No products found for ${filename}`);
    return;
  }
  
  const headers = [
    'Product ID',
    'Title',
    'Handle',
    'Product Type',
    'Vendor',
    'Price',
    'Total Variants',
    'Missing Variant SKUs',
    'Variant Details'
  ];
  
  const csvContent = [
    headers.join(','),
    ...products.map(product => [
      `"${product.id}"`,
      `"${product.title.replace(/"/g, '""')}"`,
      `"${product.handle}"`,
      `"${product.productType || ''}"`,
      `"${product.vendor || ''}"`,
      `"${product.price || ''}"`,
      product.totalVariants,
      product.variantIssues.length,
      `"${product.variantIssues.map(v => `${v.variantTitle} (${v.variantId})`).join('; ').replace(/"/g, '""')}"`
    ].join(','))
  ].join('\n');
  
  fs.writeFileSync(filename, csvContent);
  console.log(`Created ${filename} with ${products.length} products`);
};

// Generate reports
console.log('\n=== SKU Analysis Results ===');
console.log(`Total products analyzed: ${products.length}`);
console.log(`Products with missing SKUs: ${productsWithoutSKUs.length + productsWithMissingVariantSKUs.length}`);
console.log(`Products with missing variant SKUs: ${productsWithMissingVariantSKUs.length}`);

if (productsWithoutSKUs.length > 0 || productsWithMissingVariantSKUs.length > 0) {
  createCSV([...productsWithoutSKUs, ...productsWithMissingVariantSKUs], 'products-missing-skus.csv');
  
  console.log('\n=== Sample of products missing SKUs ===');
  [...productsWithoutSKUs, ...productsWithMissingVariantSKUs].slice(0, 5).forEach(product => {
    console.log(`- ${product.title} (${product.handle})`);
    if (product.variantIssues.length > 0) {
      product.variantIssues.forEach(issue => {
        console.log(`  → Missing SKU for variant: ${issue.variantTitle}`);
      });
    }
  });
} else {
  console.log('\n🎉 All products have SKUs assigned!');
  
  // Create a summary report anyway
  const summaryCSV = [
    'Analysis Summary',
    `Total Products,${products.length}`,
    `Products with SKUs,${products.length}`,
    `Products missing SKUs,0`,
    `Analysis Date,${new Date().toISOString()}`
  ].join('\n');
  
  fs.writeFileSync('sku-analysis-summary.csv', summaryCSV);
  console.log('Created sku-analysis-summary.csv with results');
}

console.log('\n=== Sample SKUs from your products ===');
products.slice(0, 5).forEach(product => {
  console.log(`${product.title}: ${product.sku}`);
});