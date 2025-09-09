#!/usr/bin/env node

/**
 * Reviews Fetcher Utility Script
 * 
 * This script provides command-line access to review fetching functionality.
 * Since Etsy Open API v3 doesn't currently provide review endpoints, this serves
 * as a framework for future implementation.
 * 
 * Usage:
 *   node fetch-reviews.js                    # Fetch reviews for all products
 *   node fetch-reviews.js --listing 123456  # Fetch reviews for specific listing
 *   node fetch-reviews.js --summary          # Get reviews summary statistics
 */

const reviews = require('./utils/reviews');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  
  try {
    if (args.includes('--help') || args.includes('-h')) {
      showHelp();
      return;
    }
    
    if (args.includes('--summary')) {
      console.log('📊 Generating reviews summary...\n');
      const summary = await reviews.getReviewsSummary();
      displaySummary(summary);
      return;
    }
    
    const listingIndex = args.indexOf('--listing');
    if (listingIndex !== -1 && listingIndex + 1 < args.length) {
      const listingId = args[listingIndex + 1];
      console.log(`🔍 Fetching reviews for listing ${listingId}...\n`);
      const reviewsData = await reviews.fetchReviewsForListing(listingId);
      displayListingReviews(reviewsData);
      return;
    }
    
    // Default: fetch all reviews
    console.log('🚀 Fetching reviews for all products using Etsy Open API v3...\n');
    
    const allReviews = await reviews.fetchAllProductReviews();
    
    console.log('\n📈 Results Summary:');
    console.log(`   Total products processed: ${Object.keys(allReviews).length}`);
    
    const productsWithReviews = Object.values(allReviews).filter(r => r.totalReviews > 0).length;
    console.log(`   Products with reviews: ${productsWithReviews}`);
    
    const totalReviews = Object.values(allReviews).reduce((sum, r) => sum + r.totalReviews, 0);
    console.log(`   Total reviews fetched: ${totalReviews}`);
    
    if (productsWithReviews > 0) {
      const avgRating = Object.values(allReviews)
        .filter(r => r.totalReviews > 0)
        .reduce((sum, r) => sum + r.averageRating, 0) / productsWithReviews;
      console.log(`   Average rating across products: ${avgRating.toFixed(2)}/5.0`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

function showHelp() {
  console.log('Etsy Reviews Fetcher\n');
  console.log('Usage:');
  console.log('  node fetch-reviews.js                    # Fetch reviews for all products');
  console.log('  node fetch-reviews.js --listing 123456  # Fetch reviews for specific listing');
  console.log('  node fetch-reviews.js --summary          # Get reviews summary statistics');
  console.log('  node fetch-reviews.js --help             # Show this help message\n');
  console.log('Fetches reviews using Etsy Open API v3 reviews endpoint:');
  console.log('https://openapi.etsy.com/v3/application/listings/{listing_id}/reviews');
}

function displaySummary(summary) {
  console.log('Reviews Summary Statistics');
  console.log('========================\n');
  console.log(`Total Products: ${summary.totalProducts}`);
  console.log(`Products with Reviews: ${summary.productsWithReviews} (${summary.reviewsPercentage.toFixed(1)}%)`);
  console.log(`Total Reviews: ${summary.totalReviews}`);
  console.log(`Overall Average Rating: ${summary.overallAverageRating.toFixed(2)}/5.0\n`);
  
  console.log('Rating Distribution:');
  console.log(`  5 stars: ${summary.ratingDistribution[5]} reviews`);
  console.log(`  4 stars: ${summary.ratingDistribution[4]} reviews`);
  console.log(`  3 stars: ${summary.ratingDistribution[3]} reviews`);
  console.log(`  2 stars: ${summary.ratingDistribution[2]} reviews`);
  console.log(`  1 star:  ${summary.ratingDistribution[1]} reviews\n`);
  
  console.log(`Last Updated: ${summary.lastUpdated}`);
}

function displayListingReviews(reviewsData) {
  console.log(`Reviews for Listing ${reviewsData.listingId}`);
  console.log('================================\n');
  
  if (reviewsData.error) {
    console.log(`❌ ${reviewsData.error}\n`);
    return;
  }
  
  console.log(`Total Reviews: ${reviewsData.totalReviews}`);
  console.log(`Average Rating: ${reviewsData.averageRating.toFixed(2)}/5.0\n`);
  
  if (reviewsData.totalReviews > 0) {
    console.log('Rating Breakdown:');
    for (let i = 5; i >= 1; i--) {
      const count = reviewsData.summary[i];
      const percentage = ((count / reviewsData.totalReviews) * 100).toFixed(1);
      console.log(`  ${i} stars: ${count} (${percentage}%)`);
    }
    
    console.log('\nRecent Reviews:');
    reviewsData.reviews.slice(0, 5).forEach((review, index) => {
      console.log(`  ${index + 1}. ${review.rating}/5 - "${review.review}" by ${review.buyer_user_id}`);
    });
  } else {
    console.log('No reviews available for this listing.');
  }
  
  console.log(`\nLast Updated: ${reviewsData.lastUpdated}`);
}

// Run the script
if (require.main === module) {
  main();
}