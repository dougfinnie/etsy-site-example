const fs = require('fs');

// Read the products data
const productsData = JSON.parse(fs.readFileSync('./data/products.json', 'utf8'));
const products = productsData.products || [];

console.log('Analyzing existing SKU patterns...\n');

// Analyze existing SKUs
const existingSKUs = [];
const skuPatterns = {
  'JB-': [],
  'EB-': [],
  other: []
};

products.forEach(product => {
  if (product.variants && product.variants.edges) {
    product.variants.edges.forEach(variantEdge => {
      const variant = variantEdge.node;
      if (variant.sku && variant.sku !== null && variant.sku !== '') {
        existingSKUs.push(variant.sku);
        
        if (variant.sku.startsWith('JB-')) {
          const number = variant.sku.substring(3);
          if (!isNaN(number)) {
            skuPatterns['JB-'].push(parseInt(number));
          }
        } else if (variant.sku.startsWith('EB-')) {
          const number = variant.sku.substring(3);
          if (!isNaN(number)) {
            skuPatterns['EB-'].push(parseInt(number));
          }
        } else {
          skuPatterns.other.push(variant.sku);
        }
      }
    });
  }
});

// Analyze patterns
console.log('=== Existing SKU Analysis ===');
console.log(`Total SKUs found: ${existingSKUs.length}`);
console.log(`JB- SKUs: ${skuPatterns['JB-'].length}`);
console.log(`EB- SKUs: ${skuPatterns['EB-'].length}`);
console.log(`Other patterns: ${skuPatterns.other.length}`);

if (skuPatterns['JB-'].length > 0) {
  const jbNumbers = skuPatterns['JB-'].sort((a, b) => a - b);
  console.log(`JB- number range: ${jbNumbers[0]} to ${jbNumbers[jbNumbers.length - 1]}`);
  console.log(`Highest JB- number: ${Math.max(...jbNumbers)}`);
}

if (skuPatterns['EB-'].length > 0) {
  const ebNumbers = skuPatterns['EB-'].sort((a, b) => a - b);
  console.log(`EB- number range: ${ebNumbers[0]} to ${ebNumbers[ebNumbers.length - 1]}`);
  console.log(`Highest EB- number: ${Math.max(...ebNumbers)}`);
}

console.log('\n=== Sample existing SKUs ===');
existingSKUs.slice(0, 10).forEach(sku => console.log(`  ${sku}`));

// Find products needing SKUs
const missingSkuProducts = [];
products.forEach(product => {
  let needsSKU = false;
  let variantIssues = [];
  
  if (product.variants && product.variants.edges) {
    product.variants.edges.forEach(variantEdge => {
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
    missingSkuProducts.push({
      id: product.id,
      title: product.title,
      handle: product.handle,
      productType: product.productType,
      createdAt: product.createdAt,
      variantIssues: variantIssues
    });
  }
});

console.log(`\n=== Products needing SKUs: ${missingSkuProducts.length} ===`);

// Generate smart SKU suggestions
const generateSequentialSKUs = () => {
  const jbNumbers = skuPatterns['JB-'];
  const highestJB = jbNumbers.length > 0 ? Math.max(...jbNumbers) : 100000;
  
  console.log('\n=== Sequential SKU Suggestions ===');
  console.log(`Starting from highest existing JB- number: ${highestJB}`);
  
  const suggestions = missingSkuProducts.map((product, index) => {
    const suggestedNumber = highestJB + index + 1;
    const suggestedSKU = `JB-${suggestedNumber}`;
    
    return {
      ...product,
      suggestedSKU: suggestedSKU,
      method: 'sequential'
    };
  });
  
  return suggestions;
};

const generateCategoryBasedSKUs = () => {
  console.log('\n=== Category-Based SKU Suggestions ===');
  
  // Define category prefixes/ranges
  const categoryRanges = {
    'Garments': { prefix: 'JB-', rangeStart: 800000 },
    'Accessory': { prefix: 'JB-', rangeStart: 900000 },
    'Home': { prefix: 'JB-', rangeStart: 700000 },
    'Socks': { prefix: 'JB-', rangeStart: 600000 },
    'default': { prefix: 'JB-', rangeStart: 500000 }
  };
  
  const usedNumbers = new Set(existingSKUs.map(sku => {
    const match = sku.match(/JB-(\d+)/);
    return match ? parseInt(match[1]) : null;
  }).filter(n => n !== null));
  
  const suggestions = missingSkuProducts.map(product => {
    const category = product.productType || 'default';
    const range = categoryRanges[category] || categoryRanges['default'];
    
    // Find next available number in range
    let suggestedNumber = range.rangeStart;
    while (usedNumbers.has(suggestedNumber)) {
      suggestedNumber++;
    }
    usedNumbers.add(suggestedNumber);
    
    const suggestedSKU = `${range.prefix}${suggestedNumber}`;
    
    return {
      ...product,
      suggestedSKU: suggestedSKU,
      method: 'category-based',
      category: category
    };
  });
  
  return suggestions;
};

// Generate both types of suggestions
const sequentialSuggestions = generateSequentialSKUs();
const categoryBasedSuggestions = generateCategoryBasedSKUs();

// Create comparison CSV
const comparisonHeaders = [
  'Product Title',
  'Handle',
  'Product Type',
  'Created Date',
  'Sequential SKU',
  'Category-Based SKU',
  'Recommended'
];

const comparisonCSV = [
  comparisonHeaders.join(','),
  ...missingSkuProducts.map((product, index) => [
    `"${product.title.replace(/"/g, '""')}"`,
    `"${product.handle}"`,
    `"${product.productType || ''}"`,
    `"${product.createdAt}"`,
    `"${sequentialSuggestions[index].suggestedSKU}"`,
    `"${categoryBasedSuggestions[index].suggestedSKU}"`,
    `"${sequentialSuggestions[index].suggestedSKU}"` // Default to sequential
  ].join(','))
].join('\n');

fs.writeFileSync('sku-suggestions-comparison.csv', comparisonCSV);

// Create a manual template
const manualTemplate = [
  '# Manual SKU Assignment Template',
  '# Edit the SKUs below and run the import script',
  '# Format: Handle,Suggested_SKU,Your_SKU',
  '',
  'Handle,Suggested_SKU,Your_SKU',
  ...missingSkuProducts.map((product, index) => 
    `${product.handle},${sequentialSuggestions[index].suggestedSKU},`
  )
].join('\n');

fs.writeFileSync('manual-sku-template.csv', manualTemplate);

console.log('\n=== Generated Analysis Files ===');
console.log('1. sku-suggestions-comparison.csv - Compare sequential vs category-based suggestions');
console.log('2. manual-sku-template.csv - Template for manual SKU assignment');

console.log('\n=== Recommendations ===');
console.log('Sequential method: Continue your existing numbering sequence');
console.log('Category-based method: Organize SKUs by product type for easier management');
console.log('Manual method: Full control over SKU assignment');

// Show both suggestions
console.log('\n=== Sequential Suggestions ===');
sequentialSuggestions.forEach(product => {
  console.log(`${product.handle} -> ${product.suggestedSKU}`);
});

console.log('\n=== Category-Based Suggestions ===');
categoryBasedSuggestions.forEach(product => {
  console.log(`${product.handle} -> ${product.suggestedSKU} (${product.category})`);
});