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
  var api = new RavelryApi()
  response.send(this.)
});


// listen for requests :)
var listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});

var RavelryApi = function(base, authUsername, authPassword) {
  this.base = base;
  this.authUsername = process.env.API_KEY;
  this.authPassword = process.env.API_PASSWORD;
  this.debugFunction = null;
};

/* globals RavelryApi */


RavelryApi.prototype.get = function(url) {
  const headers = new Headers();
  const debugFunction = this.debugFunction;
  // This is the HTTP header that you need add in order to access api.ravelry.com with a read only API key
  // `btoa` will base 64 encode a string: https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
  
  headers.append('Authorization', 'Basic ' + btoa(this.authUsername + ":" + this.authPassword));
  
  return fetch(url, { method: 'GET', headers: headers }).then(function(response) {
    return response.json();
  }).then(function(json) { 
    if (debugFunction) debugFunction(json);
    return json; 
  });
};

// Retrieve a list of projects for a user: https://www.ravelry.com/api#projects_list
// Pagination is optional, default is no pagination

RavelryApi.prototype.projectsList = function(username, page) {
  const pageSize = 25;
  const url = this.base + '/projects/' + username + '/list.json?page=' + page + '&page_size=' + pageSize;
  return this.get(url);
};


