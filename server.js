// server.js
// where your node app starts

// init project
var express = require("express");

var app = express();

const ravelryApiEndpoint = "https://api.ravelry.com";
const storeId = process.env.STORE_ID;
const authUsername = process.env.API_KEY;
const authPassword = process.env.API_PASSWORD;

const https = require("https");

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function(request, response) {
  response.sendFile(__dirname + "/views/index.html");
});

// app.get("/projects/", function(request, response) {
//   response.send()
// });
app.get("/product/:id", function(req, resp) {
  const id = req.params.id;
  const products = require("./data/products_21596.json");  
  const product = products.products.filter(p => p.id == id);
  if (product.length == 1) {
    resp.send(JSON.stringify(product));  
  } else {
    resp.sendStatus(404);
  }
});
app.get("/loveknitting/:id", function(resp, resp) {
  // products/loveknitting/export
});
app.get("/products/", function(req, resp) {
  
  // fetchProducts().then(function(data) {
  //   resp.send(data);
  // }, function(err) {
  //   console.log(err);
  // });

  const url = ravelryApiEndpoint + "/stores/" + storeId + "/products.json";
  var opt = {
    auth: `${authUsername}:${authPassword}`,
    method: 'GET'
  };
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
  const url = ravelryApiEndpoint + "/stores/" + storeId + "/products.json";
  var opt = {
    auth: `${authUsername}:${authPassword}`,
    method: 'GET'
  };
  return new Promise ((resolve, reject) => {
    let req = https.request(url, opt);

    req.on('response', res => {
      resolve(res);
    });

    req.on('error', err => {
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
