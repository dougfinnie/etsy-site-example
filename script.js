/* globals RavelryApi */

RavelryApi = function(base, authUsername, authPassword) {
  this.base = base;
  this.authUsername = authUsername;
  this.authPassword = authPassword;
};


RavelryApi.prototype.get = function(url, callback) {
  const headers = new Headers();
  headers.append('Authorization', 'Basic ' + btoa(this.authUsername + ":" + this.authPassword));
  
  return fetch(url, { method: 'GET', headers: headers });
};

RavelryApi.prototype.projectsList = function(username) {
  const url = this.base + '/projects/' + username + '/list.json';
  return this.get(url);
};




document.addEventListener("DOMContentLoaded", function(event) {
  let ravelryApiClient = null;

  function renderProjects(json) {
    ravelryApiClient.projectsList('frecklegirl').then(function(response) {
      return response.json();
    }).then(function(json) {
      var rootElement = document.getElementById('projects-list-results');
      rootElement.innerHTML = '';
      
      json.projects.forEach(function(project) {
        var child = document.createElement('DIV');
        child.innerText = project.name;
        rootElement.appendChild(child)
      });
    });  
  };
  
  const credentialsForm = document.getElementById('api-credentials-form');
  credentialsForm.onsubmit = function() {
    const username = credentialsForm.querySelector("input[name='username_key']").value;
    const password = credentialsForm.querySelector("input[name='password_key']").value;
    
    ravelryApiClient = new RavelryApi('https://api.ravelry.com', username, password);
    renderProjects();
    
    return false;
  };
});
