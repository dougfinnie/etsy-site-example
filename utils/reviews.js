const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Load environment variables
require('dotenv').config();

/**
 * Reviews Utility Functions
 * 
 * Integrates with Etsy Open API v3 reviews endpoint to fetch and cache product reviews.
 * Endpoint: https://openapi.etsy.com/v3/application/listings/{listing_id}/reviews
 */

const reviewsCacheDir = path.join(__dirname, '..', 'data', 'reviews');
const cachePeriod = 1000 * 60 * 60 * 24 * 7; // 1 week

// Etsy API configuration
const etsyApiKey = process.env.ETSY_API_KEY;
const etsyAccessToken = process.env.ETSY_ACCESS_TOKEN;
const etsyApiBaseUrl = "https://openapi.etsy.com/v3/application/";

/**
 * Etsy API fetch function
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Promise resolving to API response data
 */
async function etsyFetch(endpoint, params = {}) {
  // Check if required environment variables are set
  if (!etsyApiKey) {
    throw new Error('ETSY_API_KEY environment variable is required');
  }
  if (!etsyAccessToken) {
    throw new Error('ETSY_ACCESS_TOKEN environment variable is required');
  }

  // Build URL with query parameters
  const url = new URL(endpoint, etsyApiBaseUrl);
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });

  console.log('Making reviews request to:', url.toString());

  try {
    const response = await axios.get(url.toString(), {
      headers: {
        'x-api-key': etsyApiKey,
        'Authorization': `Bearer ${etsyAccessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Etsy API error in reviews fetch:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Response data:', error.response?.data);
    console.error('Request URL:', url.toString());
    
    throw error;
  }
}

/**
 * Ensures the reviews cache directory exists
 */
function ensureReviewsCacheDir() {
  if (!fs.existsSync(reviewsCacheDir)) {
    fs.mkdirSync(reviewsCacheDir, { recursive: true });
  }
}

/**
 * Check if a reviews cache file has expired
 * @param {string} filePath - Path to the cache file
 * @returns {boolean} - True if expired or doesn't exist
 */
function hasReviewsCacheExpired(filePath) {
  if (!fs.existsSync(filePath)) {
    return true;
  }
  const stats = fs.statSync(filePath);
  const fileAge = Date.now() - stats.mtimeMs;
  return fileAge > cachePeriod;
}

/**
 * Save reviews data to cache
 * @param {string|number} listingId - The Etsy listing ID
 * @param {Array} reviews - Array of review objects
 */
async function saveReviewsToCache(listingId, reviews) {
  ensureReviewsCacheDir();
  const filePath = path.join(reviewsCacheDir, `${listingId}.json`);
  const reviewsData = {
    listingId: listingId,
    reviews: reviews,
    totalReviews: reviews.length,
    averageRating: reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0,
    lastUpdated: new Date().toISOString(),
    summary: {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length
    }
  };
  
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, JSON.stringify(reviewsData, null, 2), (err) => {
      if (err) {
        console.error(`Error saving reviews for listing ${listingId}:`, err);
        reject(err);
      } else {
        console.log(`Reviews saved for listing ${listingId}`);
        resolve(reviewsData);
      }
    });
  });
}

/**
 * Load reviews from cache
 * @param {string|number} listingId - The Etsy listing ID
 * @returns {Object|null} - Reviews data object or null if not found
 */
function loadReviewsFromCache(listingId) {
  const filePath = path.join(reviewsCacheDir, `${listingId}.json`);
  if (fs.existsSync(filePath) && !hasReviewsCacheExpired(filePath)) {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error loading reviews cache for listing ${listingId}:`, error);
      return null;
    }
  }
  return null;
}

/**
 * Fetch reviews for a specific listing using Etsy Open API v3
 * @param {string|number} listingId - The Etsy listing ID
 * @returns {Promise<Object>} - Promise resolving to reviews data object
 */
async function fetchReviewsForListing(listingId) {
  // First, try to load from cache
  const cachedReviews = loadReviewsFromCache(listingId);
  if (cachedReviews) {
    console.log(`Loaded reviews from cache for listing ${listingId}`);
    return cachedReviews;
  }

  console.log(`Fetching reviews for listing ${listingId} from Etsy API...`);
  
  try {
    // Use the official Etsy Open API v3 reviews endpoint
    const reviewsResponse = await etsyFetch(`listings/${listingId}/reviews`, {
      limit: 100 // Get up to 100 reviews
    });
    
    const rawReviews = reviewsResponse.results || [];
    
    // Transform Etsy review structure to our standard format
    const transformedReviews = rawReviews.map(review => ({
      id: review.shop_review_id || review.listing_review_id,
      rating: review.rating,
      review: review.review,
      reviewDate: review.create_timestamp ? new Date(review.create_timestamp * 1000).toISOString() : null,
      buyerUserId: review.buyer_user_id,
      buyerDisplayName: review.buyer_display_name || 'Anonymous',
      isRecommended: review.is_recommended || false,
      wasHelpful: review.was_helpful || false,
      language: review.language || 'en',
      translatedReview: review.translated_review || null
    }));
    
    return await saveReviewsToCache(listingId, transformedReviews);
    
  } catch (error) {
    console.error(`Error fetching reviews for listing ${listingId}:`, error);
    
    // Return empty reviews structure on error
    return {
      listingId: listingId,
      reviews: [],
      totalReviews: 0,
      averageRating: 0,
      lastUpdated: new Date().toISOString(),
      summary: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      error: `Failed to fetch reviews: ${error.message}`
    };
  }
}


/**
 * Fetch reviews for all products in the products cache
 * @returns {Promise<Object>} - Promise resolving to object with listingId keys and review data values
 */
async function fetchAllProductReviews() {
  const productsPath = path.join(__dirname, '..', 'data', 'products.json');
  
  if (!fs.existsSync(productsPath)) {
    throw new Error('Products cache not found. Run the server first to populate products.');
  }

  const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
  const products = productsData.results || [];
  
  console.log(`Fetching reviews for ${products.length} products...`);
  
  const allReviews = {};
  
  // Process products in batches to avoid overwhelming any future API
  const batchSize = 5;
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (product) => {
      try {
        const reviews = await fetchReviewsForListing(product.id);
        return { listingId: product.id, reviews };
      } catch (error) {
        console.error(`Failed to fetch reviews for ${product.id}:`, error);
        return { listingId: product.id, reviews: null };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach(({ listingId, reviews }) => {
      if (reviews) {
        allReviews[listingId] = reviews;
      }
    });
    
    // Small delay between batches to be respectful to any future API
    if (i + batchSize < products.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`Reviews fetching complete. Retrieved data for ${Object.keys(allReviews).length} products.`);
  return allReviews;
}

/**
 * Get reviews summary statistics across all products
 * @returns {Promise<Object>} - Promise resolving to summary statistics
 */
async function getReviewsSummary() {
  const allReviews = await fetchAllProductReviews();
  
  let totalProducts = 0;
  let productsWithReviews = 0;
  let totalReviews = 0;
  let totalRating = 0;
  let ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  
  for (const [listingId, reviewsData] of Object.entries(allReviews)) {
    totalProducts++;
    if (reviewsData.totalReviews > 0) {
      productsWithReviews++;
      totalReviews += reviewsData.totalReviews;
      totalRating += reviewsData.averageRating * reviewsData.totalReviews;
      
      // Add to distribution
      Object.keys(ratingDistribution).forEach(rating => {
        ratingDistribution[rating] += reviewsData.summary[rating] || 0;
      });
    }
  }
  
  return {
    totalProducts,
    productsWithReviews,
    totalReviews,
    overallAverageRating: totalReviews > 0 ? totalRating / totalReviews : 0,
    ratingDistribution,
    reviewsPercentage: totalProducts > 0 ? (productsWithReviews / totalProducts) * 100 : 0,
    lastUpdated: new Date().toISOString()
  };
}

module.exports = {
  fetchReviewsForListing,
  fetchAllProductReviews,
  getReviewsSummary,
  loadReviewsFromCache,
  saveReviewsToCache
};