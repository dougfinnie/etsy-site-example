Readonly Ravelry API key demo
=================


The Ravelry API allows you to create an API key with readonly access. After creating a key, you'll receive a username and password that can be used with HTTP Basic Authentication:

![app keys](https://skitch2.ravelrycache.com/Screen-Shot-2018-08-14-at-9.42.38-AM-1534254425.png)

If you are not using a client library that supports Basic Authentication, you can do it yourself by adding an HTTP Header

* That name of the header is "Authorization"
* The value of the header should be "Basic" + " " + btoa(username + ":" + password)

`btoa` is the Javascript function to base 64 encode a value. In other languages, you'll use whatever base 64 encoding utility or library is available to you.

More information about the `Authorization` header: [https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization)


## Ravelry API Documentation

More information about the API can be found at [https://ravelry.com/api](https://ravelry.com/api)

## Project Files

### ← index.html

A page with two forms - one for API credentials and one for testing the <code>/projects/list.json</code> API call.

### ← script.js

Some Javascript that uses a read only API key to make a Ravelry API request