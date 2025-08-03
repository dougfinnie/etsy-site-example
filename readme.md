# Etsy Shop Demo Site
This is a demo to run a dynamic website yourself that gets all the information from your Etsy Shop using the Etsy Open API v3.

You will need an Etsy API key and OAuth 2.0 access token (find out more at https://developers.etsy.com/documentation) 
but once you have them, you can customize this site, edit the `.env` file, and it will work with your store information.

## Environment Variables

Copy `.env.example` to `.env` and update with your Etsy details:

- `ETSY_API_KEY` - Your Etsy API Key (from https://www.etsy.com/developers/your-apps)
- `ETSY_ACCESS_TOKEN` - Your OAuth 2.0 access token (with appropriate scopes)
- `ETSY_SHOP_ID` - Your numeric Etsy shop ID
- `SHOP_NAME` - The display name for your shop
- `PORT` - The port to run the server on (default: 3000)

## Features

- Display shop information and featured products on the homepage
- Browse all products with images and pricing
- View individual product details with variants
- Responsive design using Bootstrap
- Data caching to reduce API calls

# Tech stack
* Node.js 22.x
* Fastify web framework
* Pug for templating
* Bootstrap for styling
* jQuery and DataTables for interactive product lists
* Gulp for build and folder structure
* Etsy Open API v3 REST API

# Routes
* `/` - Homepage with shop info and featured products
* `/products` - Product listing page
* `/product/:listing_id` - Individual product page (using Etsy listing ID)
* `/api/refresh-products` - Refresh product cache
* `/api/refresh-shop` - Refresh shop info cache

# Setup Instructions

1. **Get Etsy API Credentials:**
   - Visit https://www.etsy.com/developers/your-apps
   - Create a new application or use an existing one
   - Note your API Key

2. **OAuth 2.0 Setup:**
   - Set up OAuth 2.0 flow for your application
   - Required scopes: `listings_r`, `shops_r`
   - Get an access token for your shop

3. **Find Your Shop ID:**
   - You can find your shop ID by calling the API or from your Etsy shop URL

4. **Configure Environment:**
   - Copy `.env.example` to `.env`
   - Fill in your credentials

# API Differences from Shopify
* Uses REST API instead of GraphQL
* Requires both API Key and OAuth token
* Uses listing_id instead of handle for product URLs
* Different data structure for products and shop info
* Price amounts are returned as integers that need to be divided by divisor

# TODO
* Currently the header image is hard coded
* Add collections/sections support
* Implement search functionality
* Add shopping cart functionality
* Add OAuth 2.0 token refresh handling
