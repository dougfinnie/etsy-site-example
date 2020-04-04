// server.js
// where your node app starts

// init project
var express = require("express");
var request = require("request");

var app = express();

const ravelryApiEndpoint = 'https://api.ravelry.com';
 
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
  var opt = {
    url: ravelryApiEndpoint + '/stores/' + this.storeId + '/products.json',
    method: 'GET',
    json: true,
    auth: {
      "user": this.authUsername,
      "pass": this.authPassword
    }
  };
  resp.send(request(opt));
});

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
