const fs = require('fs');

// Read the products data
const productsData = JSON.parse(fs.readFileSync('./data/products.json', 'utf8'));
const products = productsData.products || [];

console.log(`Extracting image alt text from ${products.length} products...`);

const imageData = [];

products.forEach(product => {
  // Check if product has images
  if (product.images && product.images.edges && product.images.edges.length > 0) {
    product.images.edges.forEach((imageEdge, imageIndex) => {
      const image = imageEdge.node;
      
      imageData.push({
        productId: product.id,
        productTitle: product.title,
        productHandle: product.handle,
        productType: product.productType || '',
        imageId: image.id,
        imageUrl: image.url,
        altText: image.altText || '', // Keep empty if null/undefined
        imageWidth: image.width || '',
        imageHeight: image.height || '',
        imageIndex: imageIndex + 1, // 1-based index
        totalImagesForProduct: product.images.edges.length
      });
    });
  } else {
    // Product has no images - still record this fact
    imageData.push({
      productId: product.id,
      productTitle: product.title,
      productHandle: product.handle,
      productType: product.productType || '',
      imageId: 'NO_IMAGES',
      imageUrl: '',
      altText: '',
      imageWidth: '',
      imageHeight: '',
      imageIndex: 0,
      totalImagesForProduct: 0
    });
  }
});

// Create CSV content
const headers = [
  'Product ID',
  'Product Title',
  'Product Handle',
  'Product Type',
  'Image ID',
  'Image URL',
  'Alt Text',
  'Image Width',
  'Image Height',
  'Image Index',
  'Total Images for Product'
];

const csvContent = [
  headers.join(','),
  ...imageData.map(row => [
    `"${row.productId}"`,
    `"${row.productTitle.replace(/"/g, '""')}"`,
    `"${row.productHandle}"`,
    `"${row.productType}"`,
    `"${row.imageId}"`,
    `"${row.imageUrl}"`,
    `"${row.altText}"`, // Exact alt text as-is, no generation
    row.imageWidth,
    row.imageHeight,
    row.imageIndex,
    row.totalImagesForProduct
  ].join(','))
].join('\n');

// Write the CSV file
fs.writeFileSync('product-images-alt-text.csv', csvContent);

// Generate statistics
const stats = {
  totalProducts: products.length,
  productsWithImages: imageData.filter(row => row.imageId !== 'NO_IMAGES').length,
  productsWithoutImages: imageData.filter(row => row.imageId === 'NO_IMAGES').length,
  totalImages: imageData.filter(row => row.imageId !== 'NO_IMAGES').length,
  imagesWithAltText: imageData.filter(row => row.altText && row.altText.trim() !== '').length,
  imagesWithoutAltText: imageData.filter(row => row.imageId !== 'NO_IMAGES' && (!row.altText || row.altText.trim() === '')).length
};

// Create summary CSV
const summaryCSV = [
  'Statistic,Count',
  `Total Products,${stats.totalProducts}`,
  `Products with Images,${stats.productsWithImages}`,
  `Products without Images,${stats.productsWithoutImages}`,
  `Total Images,${stats.totalImages}`,
  `Images with Alt Text,${stats.imagesWithAltText}`,
  `Images without Alt Text,${stats.imagesWithoutAltText}`,
  `Alt Text Coverage,${stats.totalImages > 0 ? Math.round((stats.imagesWithAltText / stats.totalImages) * 100) : 0}%`
].join('\n');

fs.writeFileSync('image-alt-text-summary.csv', summaryCSV);

console.log('\n=== Image Alt Text Analysis ===');
console.log(`Total products: ${stats.totalProducts}`);
console.log(`Products with images: ${stats.productsWithImages}`);
console.log(`Products without images: ${stats.productsWithoutImages}`);
console.log(`Total images: ${stats.totalImages}`);
console.log(`Images with alt text: ${stats.imagesWithAltText}`);
console.log(`Images without alt text: ${stats.imagesWithoutAltText}`);
console.log(`Alt text coverage: ${stats.totalImages > 0 ? Math.round((stats.imagesWithAltText / stats.totalImages) * 100) : 0}%`);

console.log('\n=== Generated Files ===');
console.log('1. product-images-alt-text.csv - Complete list of all images and their alt text');
console.log('2. image-alt-text-summary.csv - Statistics summary');

console.log('\n=== Sample of images without alt text ===');
const imagesWithoutAlt = imageData.filter(row => 
  row.imageId !== 'NO_IMAGES' && (!row.altText || row.altText.trim() === '')
);

imagesWithoutAlt.slice(0, 5).forEach(image => {
  console.log(`- ${image.productTitle} (${image.productHandle})`);
  console.log(`  Image: ${image.imageUrl}`);
});

if (imagesWithoutAlt.length > 5) {
  console.log(`... and ${imagesWithoutAlt.length - 5} more images without alt text`);
}