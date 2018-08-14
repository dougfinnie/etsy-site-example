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
  
  const me = this;
  fetch(url, { method: 'GET', headers: headers }).then(response => {
    return response
  }).catch(error => {
  return Promise.reject(Error(error.message))
})
};

RavelryApi.prototype.projectsList = function(username) {
  const url = this.base + '/projects/' + username + '/list.json';
  return this.get(url);
};




document.addEventListener("DOMContentLoaded", function(event) {
  const credentialsForm = document.getElementById('api-credentials-form');
  credentialsForm.onsubmit = function() {
    const username = credentialsForm.querySelector("input[name='username_key']").value;
    const password = credentialsForm.querySelector("input[name='password_key']").value;
    
    window.ravelryApiClient = new RavelryApi('https://api.ravelry.com', username, password);

    window.ravelryApiClient.onError(function(response) {
      alert('An error occurred, check the console');
      console.log(response);
    });
    
    
    console.log('a');
    console.log(ravelryApiClient.projectsList('frecklegirl'));
    
    return false;
  };
});
