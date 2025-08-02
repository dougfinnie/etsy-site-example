# Shopify Storefront Demo Site
This is a demo to run a dynamic website yourself that gets all the information from your Shopify Store using the Storefront API.

You will need a Storefront API access token (find out more at https://shopify.dev/docs/api/storefront) 
but once you have, you can customize this site, edit the `.env` file, and it will work with your store information.

## Environment Variables

Copy `.env.example` to `.env` and update with your Shopify details:

- `SHOPIFY_DOMAIN` - Your shop domain (e.g., your-shop.myshopify.com)
- `SHOPIFY_STOREFRONT_ACCESS_TOKEN` - Your Storefront API access token
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
* Shopify Storefront GraphQL API

# Routes
* `/` - Homepage with shop info and featured products
* `/products` - Product listing page
* `/product/:handle` - Individual product page
* `/api/refresh-products` - Refresh product cache
* `/api/refresh-shop` - Refresh shop info cache

# TODO
* Currently the header image is hard coded
* Add collections support
* Implement search functionality
* Add shopping cart functionality
