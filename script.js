/* globals RavelryApi */

RavelryApi = function(base, authUsername, authPassword) {
  this.base = base;
  this.authUsername = authUsername;
  this.authPassword = authPassword;
};


RavelryApi.prototype.get = function(url, callback) {
  const headers = new Headers();
  // This is the HTTP header that you need to access api.ravelry.com with a read only API key
  headers.append('Authorization', 'Basic ' + btoa(this.authUsername + ":" + this.authPassword));
  
  return fetch(url, { method: 'GET', headers: headers });
};

RavelryApi.prototype.projectsList = function(username) {
  const url = this.base + '/projects/' + username + '/list.json';
  return this.get(url);
};






// The above is all we need to get some JSON from the API!   The rest makes the example page do stuff:



document.addEventListener("DOMContentLoaded", function(event) {
  let ravelryApiClient = null;

  // request a project list from the API and render it as a list of project names
  
  function renderProjects(username) {
    ravelryApiClient.projectsList(username).then(function(response) {
      return response.json();
    }).then(function(json) {
      var rootElement = document.getElementById('projects-list-results');
      rootElement.innerHTML = '<strong>' + json.projects.length + ' projects found</strong>';
      
      json.projects.forEach(function(project) {
        var child = document.createElement('DIV');
        child.innerText = project.name;
        rootElement.appendChild(child);
      });
    });  
  };
  
  const credentialsForm = document.getElementById('api-credentials-form');
  const projectListForm = document.getElementById('projects-list-form');
  
  // create an API client whenever the credentials form is submitted

  credentialsForm.onsubmit = function() {
    const usernameKey = credentialsForm.querySelector("input[name='username_key']").value;
    const passwordKey = credentialsForm.querySelector("input[name='password_key']").value;
    
    ravelryApiClient = new RavelryApi('https://api.ravelry.com', usernameKey, passwordKey);
    
    document.getElementById('api-request').style.display = 'block';
    projectListForm.onsubmit();
    
    return false;
  };

  projectListForm.onsubmit = function() {
    const username = projectListForm.querySelector("input[name='username']").value;
    renderProjects(username);
    return false;
  };
  
});
