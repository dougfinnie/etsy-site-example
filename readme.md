# Jane Burns Designs - Etsy Shop Frontend

A modern, responsive website for the Jane Burns Designs Etsy shop, built with Node.js and integrated with the Etsy Open API v3. This application displays knitting and crochet patterns with full product information, customer reviews, and tag-based browsing.

Originally developed as a Shopify storefront demo, this project has been completely refactored to work exclusively with Etsy's Open API v3, providing a professional frontend for Jane Burns Designs' knitting patterns and tutorials.

## Key Features

✨ **Product Catalog Management**
- Automatic sync with Etsy listings via Open API v3
- Handle-based SEO-friendly URLs (`/product/baby-froggie-hoodie`)  
- High-quality image galleries with thumbnail navigation
- Comprehensive product information and pricing

🏷️ **Smart Tag System**
- Visual tag cloud with popularity-based sizing
- Clickable tags for product filtering (`/tags/baby-knits`)
- Tag-based product discovery and navigation

⭐ **Customer Reviews Integration**
- Real-time review fetching from Etsy API
- Star ratings with visual breakdown charts
- Individual review display with buyer information
- Comprehensive review analytics and summaries

🛒 **E-commerce Features**
- Direct "Buy on Etsy" integration with product pages
- Responsive design optimized for mobile shopping
- Fast loading with intelligent caching system
- Professional Bootstrap-based UI

📊 **Analytics & Tools**
- Command-line review analysis tools
- Product and review data export capabilities
- Caching system for optimal performance
- RESTful API endpoints for data access

## Environment Variables

Copy `.env.example` to `.env` and update with your Etsy details:

- `ETSY_API_KEY` - Your Etsy API Key (from https://www.etsy.com/developers/your-apps)
- `ETSY_API_SECRET` - Your Etsy API Secret (from https://www.etsy.com/developers/your-apps)
- `ETSY_ACCESS_TOKEN` - Your OAuth 2.0 access token (requires `listings_r` and `shops_r` scopes)
- `ETSY_SHOP_ID` - Your numeric Etsy shop ID (6793288 for Jane Burns Designs)
- `SHOP_NAME` - The display name for your shop
- `PORT` - The port to run the server on (default: 3000)

## Quick Start

```bash
# Install dependencies
npm install

# Build frontend assets  
npm run build

# Configure your Etsy API credentials
cp .env.example .env
# Edit .env with your Etsy API details

# Start the server
npm start
# Server will be available at http://localhost:3000
```

## Tech Stack

**Backend:**
- Node.js 22.x with Fastify web framework
- Etsy Open API v3 REST integration
- OAuth 2.0 authentication
- File-based caching system with 1-week TTL

**Frontend:**
- Pug templating engine
- Bootstrap 5 responsive design  
- jQuery and DataTables for interactive lists
- Font Awesome icons
- Custom CSS for enhanced UX

**Build System:**
- Gulp for asset management and build tasks
- NPM scripts for development workflow
- Auto-generated data directories

## Available Routes

**Public Pages:**
- `/` - Homepage with shop info and featured products
- `/products` - Complete product catalog with search/filter
- `/product/:handle` - Individual product pages (SEO-friendly URLs)
- `/tags` - Visual tag cloud for browsing by category  
- `/tags/:tag` - Products filtered by specific tag

**API Endpoints:**
- `/api/refresh-products` - Force refresh product cache
- `/api/refresh-shop` - Force refresh shop information
- `/api/reviews/:listingId` - Get reviews for specific product
- `/api/reviews` - Get reviews for all products  
- `/api/reviews-summary` - Get aggregated review statistics

## Command Line Tools

The application includes several utility scripts for managing and analyzing data:

```bash
# Fetch and analyze customer reviews
node fetch-reviews.js                    # Get reviews for all products  
node fetch-reviews.js --listing 12345    # Get reviews for specific product
node fetch-reviews.js --summary           # Show review statistics

# Generate detailed review summaries  
node generate-review-summaries.js        # Create human-readable review reports

# Product analysis (legacy from Shopify migration)
node analyze-skus.js                     # Analyze products for missing SKUs
node simple-product-summary.js           # Generate basic product reports
```

## Data Structure & Caching

**Caching System:**
- Products cached in `data/products.json` (shop catalog)
- Individual products in `data/products/{listing_id}.json` 
- Reviews cached in `data/reviews/{listing_id}.json`
- Shop information in `data/shop.json`
- All caches expire after 1 week for fresh data

**Review Integration:**
- Reviews fetched from: `https://openapi.etsy.com/v3/application/listings/{listing_id}/reviews`
- Automatic integration with product detail pages
- Rating statistics and review text display
- Multi-language support with translation handling

## Development Setup

1. **Get Etsy API Credentials:**
   ```bash
   # Visit https://www.etsy.com/developers/your-apps
   # Create a new application and note your API Key & Secret
   ```

2. **OAuth 2.0 Setup:**
   ```bash
   # Required scopes: listings_r, shops_r  
   # Use OAuth 2.0 flow to get access token
   # Jane Burns Designs shop ID: 6793288
   ```

3. **Configure Environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your Etsy API credentials
   ```

4. **Development Commands:**
   ```bash
   npm run build     # Build frontend assets
   npm run watch     # Start with file watching
   npm start         # Production start
   ```

## Project Evolution

This project started as a Shopify Storefront API demo and has been completely transformed into a comprehensive Etsy shop frontend. Key changes include:

**Migration from Shopify to Etsy:**
- ✅ Converted from GraphQL to REST API integration
- ✅ Implemented OAuth 2.0 authentication 
- ✅ Added handle-based SEO-friendly URLs with ID lookup
- ✅ Transformed data structures to match Etsy API format
- ✅ Updated price handling (amount/divisor conversion)

**New Features Added:**
- ✅ Complete customer reviews system with Etsy API integration
- ✅ Tag-based product browsing and filtering
- ✅ Visual tag cloud with popularity sizing
- ✅ Image gallery with thumbnail navigation  
- ✅ Direct Etsy purchase integration
- ✅ Command-line analytics and management tools
- ✅ Comprehensive review summaries and statistics

**Architecture Improvements:**
- ✅ Enhanced caching system with structured data directories
- ✅ RESTful API endpoints for external integration
- ✅ Responsive Bootstrap 5 design updates
- ✅ Error handling and graceful fallbacks

## Jane Burns Designs Shop Statistics

Based on current data analysis:
- **100 knitting & crochet patterns** in catalog
- **4.89/5.0 average customer rating** (64 reviews across 23 products)
- **89% five-star reviews** with zero negative feedback
- **Popular themes:** Dinosaurs, Christmas, Baby patterns, Animals
- **International customer base** with multi-language review support

## Contributing

This project showcases a complete Etsy API integration with advanced features like reviews analytics, tag-based browsing, and SEO optimization. The modular architecture makes it easy to extend with additional features or adapt for other Etsy shops.

## License

MIT License - See LICENSE file for details
