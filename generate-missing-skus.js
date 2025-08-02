const fs = require('fs');

// Read the products data
const productsData = JSON.parse(fs.readFileSync('./data/products.json', 'utf8'));
const products = productsData.products || [];

console.log('Generating SKU suggestions for products without SKUs...\n');

// Find products without SKUs and generate suggestions
const missingSkuProducts = [];

products.forEach(product => {
  let needsSKU = false;
  let variantIssues = [];
  
  // Check individual variants for missing SKUs
  if (product.variants && product.variants.edges) {
    product.variants.edges.forEach((variantEdge, index) => {
      const variant = variantEdge.node;
      if (!variant.sku || variant.sku === null || variant.sku === '') {
        needsSKU = true;
        variantIssues.push({
          variantId: variant.id,
          variantTitle: variant.title,
          price: variant.price.amount
        });
      }
    });
  }
  
  if (needsSKU) {
    // Generate suggested SKU based on existing pattern
    // Most SKUs seem to follow JB-XXXXXX pattern
    const randomSuffix = Math.floor(Math.random() * 900000) + 100000; // 6-digit random number
    const suggestedSKU = `JB-${randomSuffix}`;
    
    missingSkuProducts.push({
      id: product.id,
      title: product.title,
      handle: product.handle,
      productType: product.productType,
      vendor: product.vendor,
      price: product.pretty_price,
      suggestedSKU: suggestedSKU,
      variantIssues: variantIssues,
      shopifyProductId: product.id.split('/').pop(), // Extract numeric ID
      shopifyVariantIds: variantIssues.map(v => v.variantId.split('/').pop())
    });
  }
});

// Create detailed CSV with suggested SKUs
const headers = [
  'Product ID',
  'Shopify Product ID',
  'Title',
  'Handle',
  'Product Type',
  'Current Price',
  'Suggested SKU',
  'Variant Count',
  'Variant IDs (Shopify)',
  'Action Required'
];

const csvContent = [
  headers.join(','),
  ...missingSkuProducts.map(product => [
    `"${product.id}"`,
    product.shopifyProductId,
    `"${product.title.replace(/"/g, '""')}"`,
    `"${product.handle}"`,
    `"${product.productType || ''}"`,
    `"${product.price || ''}"`,
    `"${product.suggestedSKU}"`,
    product.variantIssues.length,
    `"${product.shopifyVariantIds.join('; ')}"`,
    `"Add SKU ${product.suggestedSKU} to variant(s)"`
  ].join(','))
].join('\n');

// Write the CSV file
fs.writeFileSync('products-missing-skus-with-suggestions.csv', csvContent);

// Create a simple text file with just the SKU assignments
const skuAssignments = [
  '# SKU Assignments for Products Missing SKUs',
  '# Generated on: ' + new Date().toISOString(),
  '# Format: Product Handle -> Suggested SKU',
  '',
  ...missingSkuProducts.map(product => 
    `${product.handle} -> ${product.suggestedSKU} (${product.title})`
  )
].join('\n');

fs.writeFileSync('sku-assignments.txt', skuAssignments);

// Create a shopify-import ready CSV (simplified format)
const shopifyImportCSV = [
  'Handle,Variant SKU,Variant ID',
  ...missingSkuProducts.flatMap(product => 
    product.shopifyVariantIds.map(variantId => 
      `${product.handle},${product.suggestedSKU},${variantId}`
    )
  )
].join('\n');

fs.writeFileSync('shopify-sku-import.csv', shopifyImportCSV);

console.log('=== Generated Files ===');
console.log('1. products-missing-skus-with-suggestions.csv - Detailed analysis with suggested SKUs');
console.log('2. sku-assignments.txt - Simple list of handle -> SKU assignments');
console.log('3. shopify-sku-import.csv - Format ready for Shopify bulk import');
console.log(`\nFound ${missingSkuProducts.length} products needing SKUs:`);

missingSkuProducts.forEach((product, index) => {
  console.log(`${index + 1}. ${product.title}`);
  console.log(`   Handle: ${product.handle}`);
  console.log(`   Suggested SKU: ${product.suggestedSKU}`);
  console.log(`   Variants needing SKU: ${product.variantIssues.length}`);
  console.log('');
});

console.log('=== Next Steps ===');
console.log('1. Review the suggested SKUs in products-missing-skus-with-suggestions.csv');
console.log('2. Adjust any SKUs that don\'t follow your preferred naming convention');
console.log('3. Use shopify-sku-import.csv for bulk import to Shopify (if supported)');
console.log('4. Or manually add SKUs to each product variant in Shopify admin');