#!/usr/bin/env node

/**
 * Generate Review Summaries Script
 * 
 * This script analyzes all cached reviews and generates human-readable summaries
 * of the review content for products that have reviews.
 * 
 * Usage:
 *   node generate-review-summaries.js
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const reviewsCacheDir = path.join(__dirname, 'data', 'reviews');
const productsPath = path.join(__dirname, 'data', 'products.json');

async function main() {
  try {
    console.log('📝 Generating review summaries for products with reviews...\n');

    // Load products data to get product titles
    const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    const products = productsData.results || [];
    const productMap = {};
    products.forEach(product => {
      productMap[product.id] = product;
    });

    // Get all review files
    if (!fs.existsSync(reviewsCacheDir)) {
      console.log('❌ No reviews cache directory found. Run fetch-reviews.js first.');
      return;
    }

    const reviewFiles = fs.readdirSync(reviewsCacheDir)
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(reviewsCacheDir, file));

    const productsWithReviews = [];

    // Process each review file
    for (const reviewFile of reviewFiles) {
      try {
        const reviewData = JSON.parse(fs.readFileSync(reviewFile, 'utf8'));
        
        // Only include products that have actual reviews
        if (reviewData.totalReviews > 0 && reviewData.reviews && reviewData.reviews.length > 0) {
          const product = productMap[reviewData.listingId];
          productsWithReviews.push({
            listingId: reviewData.listingId,
            productTitle: product ? product.title : `Listing ${reviewData.listingId}`,
            reviewData: reviewData
          });
        }
      } catch (error) {
        console.error(`Error reading review file ${reviewFile}:`, error.message);
      }
    }

    console.log(`Found ${productsWithReviews.length} products with reviews\n`);

    // Sort by average rating (highest first), then by number of reviews
    productsWithReviews.sort((a, b) => {
      if (b.reviewData.averageRating !== a.reviewData.averageRating) {
        return b.reviewData.averageRating - a.reviewData.averageRating;
      }
      return b.reviewData.totalReviews - a.reviewData.totalReviews;
    });

    // Generate summaries for each product
    console.log('═'.repeat(80));
    console.log('REVIEW SUMMARIES FOR JANE BURNS DESIGNS PRODUCTS');
    console.log('═'.repeat(80));
    console.log();

    let totalReviews = 0;
    let totalRating = 0;

    for (const product of productsWithReviews) {
      const { listingId, productTitle, reviewData } = product;
      
      console.log(`🧶 ${productTitle}`);
      console.log(`   Listing ID: ${listingId}`);
      console.log(`   ⭐ ${reviewData.averageRating.toFixed(1)}/5.0 (${reviewData.totalReviews} review${reviewData.totalReviews === 1 ? '' : 's'})`);
      
      // Rating breakdown
      const breakdown = [];
      for (let rating = 5; rating >= 1; rating--) {
        const count = reviewData.summary[rating] || 0;
        if (count > 0) {
          breakdown.push(`${rating}⭐: ${count}`);
        }
      }
      if (breakdown.length > 0) {
        console.log(`   📊 ${breakdown.join(', ')}`);
      }

      console.log();
      console.log('   📝 Customer Reviews:');
      
      // Display each review
      reviewData.reviews.forEach((review, index) => {
        const reviewDate = review.reviewDate ? new Date(review.reviewDate).toLocaleDateString() : 'Unknown date';
        const stars = '⭐'.repeat(review.rating);
        const buyerName = review.buyerDisplayName && review.buyerDisplayName !== 'Anonymous' 
          ? review.buyerDisplayName 
          : 'Anonymous Customer';
        
        console.log(`   ${index + 1}. ${stars} (${reviewDate}) - ${buyerName}`);
        if (review.review && review.review.trim()) {
          // Wrap long reviews for better readability
          const reviewText = review.review.trim();
          const wrappedText = wrapText(reviewText, 70);
          wrappedText.forEach(line => {
            console.log(`      "${line}"`);
          });
        } else {
          console.log('      (No written review)');
        }
        
        // Show translated review if different
        if (review.translatedReview && 
            review.translatedReview !== review.review && 
            review.translatedReview.trim()) {
          console.log('      📄 Translation:');
          const translatedText = review.translatedReview.trim();
          const wrappedTranslation = wrapText(translatedText, 70);
          wrappedTranslation.forEach(line => {
            console.log(`      "${line}"`);
          });
        }
        
        console.log();
      });

      totalReviews += reviewData.totalReviews;
      totalRating += reviewData.averageRating * reviewData.totalReviews;

      console.log('─'.repeat(80));
      console.log();
    }

    // Overall summary
    const overallAverage = totalReviews > 0 ? totalRating / totalReviews : 0;
    
    console.log('📊 OVERALL SUMMARY');
    console.log('═'.repeat(80));
    console.log(`Products with reviews: ${productsWithReviews.length}`);
    console.log(`Total reviews: ${totalReviews}`);
    console.log(`Overall average rating: ${overallAverage.toFixed(2)}/5.0`);
    console.log();
    
    // Find most popular patterns (highest rated with most reviews)
    console.log('🏆 TOP RATED PATTERNS:');
    const topRated = productsWithReviews
      .filter(p => p.reviewData.averageRating >= 4.8)
      .slice(0, 5);
    
    topRated.forEach((product, index) => {
      console.log(`${index + 1}. ${product.productTitle}`);
      console.log(`   ⭐ ${product.reviewData.averageRating.toFixed(1)}/5.0 (${product.reviewData.totalReviews} reviews)`);
    });
    
    console.log();
    console.log('✅ Review summary generation complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

/**
 * Wrap text to specified line length
 * @param {string} text - Text to wrap
 * @param {number} length - Maximum line length
 * @returns {string[]} - Array of wrapped lines
 */
function wrapText(text, length) {
  if (!text || text.length <= length) {
    return [text || ''];
  }

  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= length) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Word is longer than line length, split it
        lines.push(word);
      }
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

// Run the script
if (require.main === module) {
  main();
}