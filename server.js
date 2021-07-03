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

const auth = {
  auth: {    
    username: authUsername,
    password: authPassword
  }
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

  getAPI(url).then(function (json) {
    const fs = require("fs");
    let file = fs.createWriteStream(`data/designer_${designerId}.json`);
    json.pipe(file);
    json.pipe(resp);
    return json;
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
  console.log(req.params.id);
  const pattern = getPattern(req.params.id);
  console.log(pattern);
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
  if (checkFileExists(patternPath)) {
    console.log(patternPath + " exists");
    const pattern = require(patternPath);
    return pattern;
  }
  const url = `${ravelryApiEndpoint}/patterns/${id}.json`;

  const json = getAPI(url);
    console.log(json);
    // let file = fs.writeFile(patternPath, json.data.pattern, err => {
      // Checking for errors
    //   if (err) throw err; 
    //   console.log("Done writing"); // Success
    // });
    return json;
}
app.get("/products/", function(req, resp) {
  const url = `${ravelryApiEndpoint}/stores/${storeId}/products.json`;
  const json = getAPI(url);
    const fs = require("fs");
    let file = fs.writeFile(`data/products_${storeId}.json`, json, err => {
      // Checking for errors
      if (err) throw err; 
      console.log("Done writing"); // Success
    });
  return json;
});

function fetchProducts() {
  const url = `${ravelryApiEndpoint}/stores/${storeId}/products.json`;
  const json = getAPI(url);
  return json;
}

function getAPI(url) {
  const axios = require('axios');
  const pattern = axios.get(url, auth)
    .then((response) => response.data)
    .catch(function (error) {
      // handle error
      console.log(error);
    })
    .then(function () {
      // always executed
    });
}
function checkFileExists(file) {
  const fs = require('fs');
  return fs.existsSync(file)
}

var listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});

