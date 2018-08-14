/* globals RavelryApi */

window.ravelryApiClient = null;

RavelryApi = function(base, authUsername, authPassword) {
  this.base = base;
  this.authUsername = authUsername;
  this.authPassword = authPassword;
  
  this.onErrorCallback = null;
};

RavelryApi.prototype.onError = function(callback) {
  this.onErrorCallback = callback;
};

RavelryApi.prototype.get = function(url, callback) {
  const headers = new Headers();
  headers.append('Authorization', 'Basic ' + btoa(this.authUsername + ":" + this.authPassword));
  
  fetch(url, { method: 'GET', headers: headers }).then(callback);
};

RavelryApi.prototype.projectsList = function(username) {
  const url = this.base + '/projects/' + username + '/list.json';
  this.get(url, function(response) {
    console.log(response);
  });
  return url;
};




document.addEventListener("DOMContentLoaded", function(event) {
  const credentialsForm = document.getElementById('api-credentials-form');
  credentialsForm.onsubmit = function() {
    const username = credentialsForm.querySelector("input[name='username_key']").value;
    const password = credentialsForm.querySelector("input[name='password_key']").value;
    
    window.ravelryApiClient = new RavelryApi('https://api.ravelry.com', username, password);
    window.ravelryApiClient.onError(function(errorMessage) {
      document.getElementById('api-success').style.display = 'none';
      const errorElement = document.getElementById('api-error');
      errorElement.style.display = 'block';
      errorElement.innerHTML = errorMessage;
    });
    
    console.log(ravelryApiClient.projectsList('frecklegirl'));
    
    return false;
  };
});
