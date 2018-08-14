window.ravelryApiClient = null;

document.addEventListener("DOMContentLoaded", function(event) {
  var credentialsForm = document.getElementById('api-credentials-form');
  credentialsForm.onsubmit = function() {
    var username = credentialsForm.querySelector("input[name='username_key']").value;
    var password = credentialsForm.querySelector("input[name='password_key']").value;
    
    window.ravelryApiClient = new RavelryApi('https://api.ravelry.com', username, password);
    ravelryApiClient.onError(function(errorMessage) {
      document.getElementById('api-success').style.display = 'none';
      var errorElement = document.getElementById('api-error');
      errorElement.style.display = 'block';
      errorElement.innerHTML = errorMessage;
    )};
    
    console.log(ravelryApiClient.projectsList());
    
    return false;
  };
});

RavelryApi = function(base, authUsername, authPassword) {
  this.base = base;
  this.authUsername = authUsername;
  this.authPassword = authPassword;
};

RavelryApi.prototype.projectsList = function(username) {
  var url = '/projects/' + username + '/list.json';
  return url;
};


