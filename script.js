/* globals RavelryApi */

RavelryApi = function(base, authUsername, authPassword) {
  this.base = base;
  this.authUsername = authUsername;
  this.authPassword = authPassword;
};


RavelryApi.prototype.get = function(url, callback) {
  const headers = new Headers();
  // This is the HTTP header that you need add in order to access api.ravelry.com with a read only API key
  // `btoa` will base 64 encode a string: https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
  
  headers.append('Authorization', 'Basic ' + btoa(this.authUsername + ":" + this.authPassword));
  
  return fetch(url, { method: 'GET', headers: headers }).then(function(response) {
    return response.json();
  });
};

// Retrieve a list of projects for a user: https://www.ravelry.com/api#projects_list
// Pagination is optional, default is no pagination

RavelryApi.prototype.projectsList = function(username, page) {
  const pageSize = 25;
  const url = this.base + '/projects/' + username + '/list.json?page=' + page + '&page_size=' + pageSize;
  return this.get(url);
};






// The above is all we need to get some JSON from the API!   The rest makes the example page do stuff:



document.addEventListener("DOMContentLoaded", function(event) {
  let ravelryApiClient = null;

  // request a project list from the API and render it as a list of project names
  
  function renderProjects(username) {
    document.getElementById('loading_indicator').style.display = 'inline-block';
    
    ravelryApiClient.projectsList(username).then(function(json) {
      document.getElementById('loading_indicator').style.display = 'none';
      
      const rootElement = document.getElementById('projects-list-results');
      rootElement.innerHTML = '<h2>' + json.paginator.results + ' projects found</h2>';
      
      const previousPageLink = document.getElementById('pagination-previous');
      previousPageLink.style.display = json.paginator.page > 1 ? 'block' : 'none';

      const nextPageLink = document.getElementById('pagination-next');
      nextPageLink.style.display = json.paginator.page < json.paginator.last_page ? 'block' : 'none';
      
      json.projects.forEach(function(project) {
        const child = document.createElement('li');
        child.className = 'project__result';
        
        if (project.first_photo) {
          const img = document.createElement('img');
          img.src = project.first_photo.square_url;
          img.className = 'project__result__thumbnail';
          child.appendChild(img);
        }

        const title = document.createElement('a');
        title.href = project.links.self.href;
        title.innerText = project.name;
        child.appendChild(title);
        
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
