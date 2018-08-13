document.addEventListener("DOMContentLoaded", function(event) {
  var credentialsForm = document.getElementById('credentials-form');
  credentialsForm.onsubmit = function() {
    var username = credentialsForm.querySelector("input[name='username_key']");
    var password = credentialsForm.querySelector("input[name='password_key']");
    
    var credentials =alert(username.value + ':' + password.value);
    
    var ravelryApiClient = new RavelryApi('https://api.ravelry.com');
    console.log(ravelryApiClient.projectsList);
    
    return false;
  };
});

window.RavelryApi = function(base) {
  this.base = base;
};

RavelryApi.prototype.projectsList = function(username) {
  var url = '/projects/' + username + 'list.json';
  return url;
};


