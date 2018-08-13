Readonly Ravelry API key demo
=================


The Ravelry API allows you to create an API key with readonly access. After creating a key, you receive a username and password that can be used with HTTP Basic Authentication.

If you are not using a client library that supports Basic Authentication, you can do it yourself by adding an HTTP Header

* That name of the header is "Authorization"
* The value of the header should be "Basic" + " " + btoa(username + ":" + password)
* more information: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization
