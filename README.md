![splash page bob](https://skitch2.ravelrycache.com/bob-1534265617.png) Read only Ravelry API demo
=================


### ← index.html

A page with two forms - one for API credentials and one for testing the <code>/projects/list.json</code> API call.

### ← script.js

Some JavaScript that uses a read only API key to make a Ravelry API request


## Ravelry API Documentation

More information about the API can be found at [https://ravelry.com/api](https://ravelry.com/api)


## How does it work?

The Ravelry API allows you to create an API key with readonly access. After creating a key, you'll receive a username and password that can be used with HTTP Basic Authentication:

![app keys](https://skitch2.ravelrycache.com/Screen-Shot-2018-08-14-at-9.42.38-AM-1534254425.png)

If you are not using a client library that supports Basic Authentication, you can do it yourself by adding the [Authorization HTTP Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization) when you make HTTP requests. See `script.js` in this project for an example.

* That name of the header is "Authorization"
* The value of the header should be "Basic" + " " + btoa(username + ":" + password)

`btoa` is the JavaScript function to base 64 encode a value. In other languages, you'll use whatever base 64 encoding utility or library is available to you.



