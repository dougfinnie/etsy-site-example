// server.js
// where your node app starts

// init project
var express = require("express");
var bodyParser = require("body-parser");
var app = express();
app.set("view engine", "pug");
const pug = require("pug");
app.use(bodyParser.urlencoded({ extended: true }));

// /js and /css bootstrap files
app.use(express.static(__dirname + "/node_modules/bootstrap/dist"));

const authUsername = process.env.API_KEY;
const authPassword = process.env.API_PASSWORD;
const ravelryApiEndpoint = "https://api.ravelry.com";
const storeId = process.env.STORE_ID;
const designerId = process.env.DESIGNER_ID;

const https = require("https");

const opt = {
  auth: `${authUsername}:${authPassword}`,
  method: "GET"
};

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function(request, response) {
  // response.sendFile(__dirname + "/views/index.html");
  const designer = require(`./data/designer_${designerId}.json`);
  response.render("index.pug", {
    title: "Jane Burns Designs",
    featured: designer.featured_bundles,
    about: designer.pattern_author.notes_html
  });
});
app.get("/designer", function(req, resp) {
  const url = `${ravelryApiEndpoint}/designers/${designerId}.json?include=featured_bundles`;

  https.get(url, opt, function(response) {
    // console.log(response);
    const fs = require("fs");
    let file = fs.createWriteStream(`data/designer_${designerId}.json`);
    response.pipe(file);
    response.pipe(resp);
  });
});
// app.get("/loveknitting", function(req, resp) {
//   const url = ravelryApiEndpoint + "/products/loveknitting/export.json?product_id_list=368294";
//   https.get(url, opt, function(response) {
//     // console.log(response);
//     const fs = require("fs");
//     let file = fs.createWriteStream(`data/products_${storeId}.json`);
//     response.pipe(resp);
//   });
// });
app.get("/pattern/:id", async function(req, resp) {
  const pattern = getPattern(req.params.id);
  resp.render("pattern.pug", {
    pattern: pattern.pattern
  });
});
app.get("/patterns", function(req, resp) {
  const patterns = require(`./data/products_${storeId}.json`);
  // resp.send(patterns.products);
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
    patterns: sorted
  });
});
function getPattern(id) {
  const fs = require("fs");
  const patternPath = `./data/patterns/${id}.json`;
  if (fs.existsSync(patternPath)) {
    console.log(patternPath + " exists");
    const pattern = require(patternPath);
    return pattern;
  }
  const url = `${ravelryApiEndpoint}/patterns/${id}.json`;

  getAPI(url).then(function (json) {
    // console.log(response);
    let file = fs.writeFile(patternPath, json, err => {
      // Checking for errors
      if (err) throw err; 
      console.log("Done writing"); // Success
    });
    return json;
  });
}
app.get("/products/", function(req, resp) {
  const url = `${ravelryApiEndpoint}/stores/${storeId}/products.json`;
  getAPI(url).then(function (json) {
    const fs = require("fs");
    let file = fs.writeFile(`data/products_${storeId}.json`, json, err => {
      // Checking for errors
      if (err) throw err; 
      console.log("Done writing"); // Success
    });
    return json;
  }).catch((error)=>{
    console.log(error);
  });
});
function fetchProducts() {
  const url = `${ravelryApiEndpoint}/stores/${storeId}/products.json`;
  getAPI(url).then(function (json) {
    return json;
  }).catch((error)=>{
    console.log(error);
  });
}

function getAPI(url) {
  const fetch = require('fetch');
  global.fetch = fetch
  global.Headers = fetch.Headers;
  const headers = new Headers();
  headers.append("Authorization", "Basic " +  Buffer.from(authUsername + ":" + authPassword).toString('base64'));
  return fetch(url, { method: "GET", headers: headers })
    .then(function (response) {
      return response.json();
    })
    .then(function (json) {
      return json;
    }).catch(function(error){
      console.log(error);
    });

}


var listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});

