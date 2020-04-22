// server.js
// where your node app starts

// init project
var express = require("express");
var bodyParser = require("body-parser");
var app = express();
app.set("view engine", "pug");
const pug = require("pug");
app.use(bodyParser.urlencoded({ extended: true }));


const authUsername = process.env.API_KEY;
const authPassword = process.env.API_PASSWORD;
const ravelryApiEndpoint = "https://api.ravelry.com";
const storeId = process.env.STORE_ID;
const designerId = 'jane-burns';

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
  const designer = require("./data/designer_jane-burns.json");
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
app.get("/pattern/:id", function(req, resp) {
  const pattern = getPattern(req.params.id);
  resp.render("pattern.pug", {
    pattern: pattern.pattern
  });
});
function getPattern(id) {
  const fs = require("fs");
  const patternPath = `./data/patterns/${id}.json`;
  if (fs.existsSync(patternPath)) {
    console.log(patternPath + ' exists');
    const pattern = require(patternPath);
    return pattern;
  }
  const url = `${ravelryApiEndpoint}/patterns/${id}.json`;

  https.get(url, opt, function(response) {
    // console.log(response);
    let file = fs.createWriteStream(patternPath);
    
    var stream = response.pipe(file);
    stream.on('finish', function () {
      const pattern = require(patternPath);
      return pattern;
    });
  });
}
app.get("/products/", function(req, resp) {
  const url = `${ravelryApiEndpoint}/stores/${storeId}/products.json`;

  https.get(url, opt, function(response) {
    // console.log(response);
    var products = resp;
    const fs = require("fs");
    let file = fs.createWriteStream(`data/products_${storeId}.json`);
    response.pipe(file);
    response.pipe(resp);
  });
});
function fetchProducts() {
  const url = `${ravelryApiEndpoint}/stores/${storeId}/products.json`;
  var opt = {
    auth: `${authUsername}:${authPassword}`,
    method: "GET"
  };
  return new Promise((resolve, reject) => {
    let req = https.request(url, opt);

    req.on("response", res => {
      resolve(res);
    });

    req.on("error", err => {
      reject(err);
    });
  });
}

// function getProducts() {
//   const fs = require("fs");
//   let file = fs.createWriteStream(`data/products_${storeId}.json`);
//   var opt = {
//     url: ravelryApiEndpoint + "/stores/" + storeId + "/products.json",
//     method: "GET",
//     json: true,
//     auth: {
//       user: authUsername,
//       pass: authPassword
//     }
//   };
//   let request = this.http.get(opt, function(response) {
//       console.log(response);
//       // resp.send(response);
//     })
//     .pipe(file);
// }
// app.get("/stores/", function(request, response) {
//   var api = new RavelryApi();
//   response.send(api.stores());
// });

// listen for requests :)
var listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});

//     stores() {
//       const url = '/stores/list.json';
//       console.log(url);
//       return this.get(url);
//     }
//     products() {

//       console.log(url);
//       return this.get(url);
//     }
//     projects(page) {
//       const pageSize = 25;
//       const url = '/projects/' + this.user + '/list.json?page=' + page + '&page_size=' + pageSize;
//       console.log(url);
//       return this.get(url);
//     }
// }
