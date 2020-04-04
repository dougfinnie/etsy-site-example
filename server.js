// server.js
// where your node app starts

// init project
var express = require("express");

var app = express();

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function(request, response) {
  response.sendFile(__dirname + "/views/index.html");
});

app.get("/projects/", function(request, response) {
  var api = new RavelryApi();
  response.send(api.projects(1))
});
app.get("/products/", function(request, response) {
  var api = new RavelryApi();
  var products = api.products();
  response.json(products);
});
app.get("/stores/", function(request, response) {
  var api = new RavelryApi();
  response.send(api.stores());
});


// listen for requests :)
var listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});


class RavelryApi {
    constructor()
    {
      this.base = 'https://api.ravelry.com';
      this.user = 'knittingimage';
      this.authUsername = process.env.API_KEY;
      this.authPassword = process.env.API_PASSWORD;
      this.storeId = process.env.STORE_ID;
    }
    get(url) {
      console.log(this.base);
      var request = require("request");

      var options = {
          url: this.base + url,
          method: 'GET',
          json: true,
          auth: {
            "user": this.authUsername,
            "pass": this.authPassword
          }
      }
      request(options)
        .on('response', function(response) {
           response.on('data', function(data) {
            // compressed data as it is received
            console.log('received ' + data.length + ' bytes of compressed data')
          })
      });
   

    }
    stores() {
      const url = '/stores/list.json';
      console.log(url);
      return this.get(url);      
    }
    products() {
      const url = '/stores/' + this.storeId + '/products.json';
      console.log(url);
      return this.get(url);
    }
    projects(page) {
      const pageSize = 25;
      const url = '/projects/' + this.user + '/list.json?page=' + page + '&page_size=' + pageSize;
      console.log(url);
      return this.get(url);
    }
}
