/**
 * This is the main Node.js server script for your project
 * Check out the two endpoints this back-end API provides in fastify.get and fastify.post below
 */

const path = require("path");

// Require the fastify framework and instantiate it
const fastify = require("fastify")({
  // Set this to true for detailed logging:
  logger: false,
});


// Setup our static files
fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "public"),
  prefix: "/", // optional: default '/'
});

// Formbody lets us parse incoming forms
fastify.register(require("@fastify/formbody"));


// View is a templating manager for fastify
fastify.register(require("@fastify/view"), {
  engine: {
    pug: require("pug"),
  },
});

// app.use(bodyParser.urlencoded({ extended: true }));
const axios = require('axios');

const authUsername = process.env.API_KEY;
const authPassword = process.env.API_PASSWORD;
const ravelryApiEndpoint = "https://api.ravelry.com";
const storeId = process.env.STORE_ID;
const designerId = process.env.DESIGNER_ID;
const designerName = process.env.DESIGNER_NAME;
const cachePeriod = 1000*60*60*24*7 // 1 week
const auth = {
  auth: {    
    username: authUsername,
    password: authPassword
  }
};

const designerPath = `.data/designer_${designerId}.json`;
const productsPath = `.data/products/${storeId}.json`


// http://expressjs.com/en/starter/basic-routing.html
fastify.get("/", async function(request, response) {
  console.log("home");
  if (!checkFileExists(designerPath) || hasFileCacheExpired(designerPath)) {
        await getDesigner();
  }
  const designer = require(`./${designerPath}`);
  response.view("index.pug", {
    name: designerName,
    title: designerName,
    featured: designer.featured_bundles,
    photo: designer.pattern_author.users[0].photo_url,
    about: designer.pattern_author.notes_html,
    sites: designer.pattern_author.users[0].user_sites
  });
});

fastify.get("/pattern/:id", async function(req, resp) {
  const pattern = await getPattern(req.params.id);
  resp.view("pattern.pug", {
    pattern: pattern.pattern,
    title: designerName + " - " + pattern.pattern.name
  });
});

fastify.get("/patterns",async function(req, resp) {
  let productsPath = `.data/products/${storeId}.json`;
  if (hasFileCacheExpired(productsPath)) {
    console.log('Product cache expired');
    await fetchProducts();  
  }

  const patterns = require(`./${productsPath}`);
  let sorted = patterns.products
    .sort((a, b) => 
      a.title.localeCompare(
        b.title,
        undefined,
        { sensitivity: 'base' }));

  resp.view("patterns.pug", {
    patterns: sorted,
    title: designerName + " - Patterns"
  });
});

fastify.get("/products", async function(req, resp) {
  const json = await fetchProducts();
  
  await saveJson(productsPath, json);
  resp.send("ok");
});

fastify.get("/designer", async function(req, resp) {
  const url = `${ravelryApiEndpoint}/designers/${designerId}.json?include=featured_bundles`;
  var designer = await fetch(url);
  await saveJson(`.data/designer_${designerId}.json`, designer);
  resp.send('ok');
});

async function getPattern(id) {
  const patternPath = `.data/patterns/${id}.json`;
  if (checkFileExists(patternPath)) {
    console.log(patternPath + " exists");

    if (!hasFileCacheExpired(patternPath)) {
      const pattern = require(`./${patternPath}`);
      return pattern;
    }
  }
  const url = `${ravelryApiEndpoint}/patterns/${id}.json`;
  const json = await fetch(url);

  await saveJson(patternPath, json);

  return json;
}

async function getDesigner() {
  const url = `${ravelryApiEndpoint}/designers/${designerId}.json?include=featured_bundles`;
  try {
    const json = await fetch(url);
    await saveJson(designerPath, json);
    return json;
  } catch (error) {
      return null;
    };
}

function hasFileCacheExpired(path) {
  const fs = require("fs");
  const stats = fs.statSync(path);
  let fileAge = Date.now() - stats.mtimeMs;
  console.log(`outdated cache: ${fileAge > cachePeriod}`);
  return fileAge > cachePeriod;
}

async function saveJson(path, json) {
  const fs = require("fs");
  let file = fs.writeFile(path, JSON.stringify(json), err => {
    // Checking for errors
    if (err) throw err; 
    console.log("Done writing pattern"); // Success
  });
}

async function fetchProducts() {
  const url = `${ravelryApiEndpoint}/stores/${storeId}/products.json`;
  try {
    const json = await fetch(url);
    return json;
  } catch (error) {
      return null;
    };
}

async function fetch(url) {
  try {
    const json = await axios.get(url, auth);
    return json.data;
  } catch (error) {
    console.log(error.toJSON());
    throw error;
  }
}

function checkFileExists(file) {
  const fs = require('fs');
  return fs.existsSync(file)
}

// Run the server and report out to the logs
fastify.listen(
  { port: process.env.PORT, host: "0.0.0.0" },
  function (err, address) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Your app is listening on ${address}`);
  }
);

