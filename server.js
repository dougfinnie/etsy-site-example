// server.js
// where your node app starts

// init project
var express = require("express");
var bodyParser = require("body-parser");
var app = express();
app.set("view engine", "pug");
const pug = require("pug");
app.use(bodyParser.urlencoded({ extended: true }));
const axios = require('axios');

// /js and /css bootstrap files
app.use(express.static(__dirname + "/node_modules/bootstrap/dist"));

const authUsername = process.env.API_KEY;
const authPassword = process.env.API_PASSWORD;
const ravelryApiEndpoint = "https://api.ravelry.com";
const storeId = process.env.STORE_ID;
const designerId = process.env.DESIGNER_ID;
const cachePeriod = 1000*60*60*24*7 // 1 week
const auth = {
  auth: {    
    username: authUsername,
    password: authPassword
  }
};

const designerPath = `.data/designer_${designerId}.json`;
const productsPath = `.data/products/${storeId}.json`

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function(request, response) {
  if (!checkFileExists(designerPath)) {
        
  }
  const designer = require(`./${designerPath}`);
  response.render("index.pug", {
    name: designer.pattern_author.name,
    title: designer.pattern_author.name,
    featured: designer.featured_bundles,
    photo: designer.pattern_author.users[0].photo_url,
    about: designer.pattern_author.notes_html
  });
});

app.get("/designer", async function(req, resp) {
  const url = `${ravelryApiEndpoint}/designers/${designerId}.json?include=featured_bundles`;
  var designer = await fetch(url);
  await saveJson(`.data/designer_${designerId}.json`, designer);
  resp.send('ok');
});

async function getDesigner() {
  const url = `${ravelryApiEndpoint}/designers/${designerId}.json?include=featured_bundles`;
  try {
    const json = await fetch(url);
    return json;
  } catch (error) {
      return null;
    };
}

app.get("/pattern/:id", async function(req, resp) {
  const pattern = await getPattern(req.params.id);
  resp.render("pattern.pug", {
    pattern: pattern.pattern,
    title: pattern.designer + " - " + pattern.pattern.name
  });
});

app.get("/patterns",async function(req, resp) {
  let productsPath = `.data/products/${storeId}.json`;
  if (hasFileCacheExpired(productsPath)) {
    console.log('Product cache expired');
    await fetchProducts();  
  }

  const patterns = require(`./${productsPath}`);
  let sorted = patterns.products.sort((a, b) => {
    let fa = a.title.toLowerCase(),
        fb = b.title.toLowerCase();

    if (fa < fb) {
        return -1;
    }
    if (fa > fb) {
        return 1;
    }
    return 0;
  });
  resp.render("patterns.pug", {
    patterns: sorted,
    title: designer.pattern_author.name + " Patterns"
  });
});

app.get("/products", async function(req, resp) {
  const json = await fetchProducts();
  
  await saveJson(productsPath, json);
  resp.send("ok");
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

var listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});

