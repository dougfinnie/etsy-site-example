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
  response.send(api.projectsList('knittingimage',1))
});


// listen for requests :)
var listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});


function RavelryApi() {
  this.base = 'https://api.ravelry.com';
  this.user = 'knittingimage'
  this.authUsername = process.env.API_KEY;
  this.authPassword = process.env.API_PASSWORD;
};

/* globals RavelryApi */


RavelryApi.prototype.get = function(url) {


  var http = require("http");

  var options = {
      host: this.base,
      port: 80,
      method: "GET",
      path: url,
      auth: this.authUsername + ':' + this.authPassword
  };

  http.get(options, function(rs) {
      var result = "";
      rs.on('data', function(data) {
          result += data;
      });
      rs.on('end', function() {
          console.log(result);
      });
    rs.on('error', function() {
      console.log(result);
    })
  });

}

// Retrieve a list of projects for a user: https://www.ravelry.com/api#projects_list
// Pagination is optional, default is no pagination

RavelryApi.prototype.projectsList = function(username, page) {
  const pageSize = 25;
  const url = '/projects/' + this.user + '/list.json?page=' + page + '&page_size=' + pageSize;
  console.log(url);
  return this.get(url);
};

