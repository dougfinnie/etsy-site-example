// server.js
// where your node app starts

// init project
import express, { static } from "express";
import { urlencoded } from "body-parser";
var app = express();
app.set("view engine", "pug");
import pug from "pug";
import { get } from 'axios';

app.use(urlencoded({ extended: true }));

// /js and /css bootstrap files
app.use(static(__dirname + "/node_modules/bootstrap/dist"));

const authUsername = process.env.API_KEY;
const authPassword = process.env.API_PASSWORD;
const ravelryApiEndpoint = "https://api.ravelry.com";
const storeId = process.env.STORE_ID;
const designerId = process.env.DESIGNER_ID;

const opt = {
  auth: `${authUsername}:${authPassword}`,
  method: "GET"
};

// http://expressjs.com/en/starter/static-files.html
app.use(static("public"));

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

  (async () => {
    try {
      const response = await get(url)
      const fs = require("fs");
      let file = fs.createWriteStream(`data/designer_${designerId}.json`);
      response.pipe(file);
      response.pipe(resp);
    } catch (error) {
      console.log(error.response.body);
    }
  })();
});

app.get("/pattern/:id", async function(req, resp) {
  console.log(req.params.id);
  const pattern = await getPattern(req.params.id);
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
async function getPattern(id) {
  const fs = require("fs");
  const patternPath = `./data/patterns/${id}.json`;
  if (await fs.exists(patternPath)) {
    console.log(patternPath + " exists");
    const pattern = require(patternPath);
    return pattern;
  }
  const url = `${ravelryApiEndpoint}/patterns/${id}.json`;
    try {
      const response = await get(url)
     let file = fs.createWriteStream(patternPath);

      var stream = response.pipe(file);
      stream.on("finish", function() {
        const pattern = require(patternPath);
        return pattern;
      });
    } catch (error) {
      console.log(error.response.body);
    }
}
app.get("/products/", function(req, resp) {
  const url = `${ravelryApiEndpoint}/stores/${storeId}/products.json`;

  (async () => {
    try {
      const response = await get(url)
      const fs = require("fs");
      let file = fs.createWriteStream(`data/products_${storeId}.json`);
      response.pipe(file);
      response.pipe(resp);
    } catch (error) {
      console.log(error.response.body);
    }
  })();
});

var listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});
