// server.js
// where your node app starts

// init project
var express = require("express");

var app = express();

const ravelryApiEndpoint = "https://api.ravelry.com";
const storeId = process.env.STORE_ID;
const authUsername = process.env.API_KEY;
const authPassword = process.env.API_PASSWORD;

const http = require("https");

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function(request, response) {
  response.sendFile(__dirname + "/views/index.html");
});

// app.get("/projects/", function(request, response) {
//   response.send()
// });

app.get("/products/", function(req, resp) {
  const http = require("https");
  const url = ravelryApiEndpoint + "/stores/" + storeId + "/products.json";
  var opt = {
    auth: `${authUsername}:${authPassword}`,
    method: 'GET'
  };
  http.get(url, opt, function(response) {
      // console.log(response);
      response.pipe(resp);
  });
});
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
