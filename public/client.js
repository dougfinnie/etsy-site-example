



// The above is all we need to get some JSON from the API!   The rest makes the example page do stuff:


/* globals ApiDemo */

ApiDemo = function() {
  this.ravelryApiClient = null;
  this.currentProjectPage = null;
  
  
  this.addEventListeners();
};

ApiDemo.prototype.createApiClient = function(authUsername, authPassword) {
  this.ravelryApiClient = new RavelryApi('https://api.ravelry.com', authUsername, authPassword);
  this.ravelryApiClient.debugFunction = function(json) {
    var inspector = document.getElementById('json-inspector');
    inspector.style.display = 'block';
    inspector.value = JSON.stringify(json, null, 2);
    console.log(json);
  };
};


ApiDemo.prototype.addEventListeners = function() {
  const credentialsForm = document.getElementById('api-credentials-form');
  const projectListForm = document.getElementById('projects-list-form');
    

  const submitProjectSearch = function() {
    const username = projectListForm.querySelector("input[name='username']").value;
    this.renderProjects(username, this.currentProjectPage);
  }.bind(this);
  

  // create an API client whenever the credentials form is submitted
  credentialsForm.onsubmit = function() {
    const usernameKey = process.env.API_KEY;
    const passwordKey = process.env.API_PASSWORD;
    
    this.createApiClient(usernameKey, passwordKey);
    
    document.getElementById('api-request').style.display = 'block';
    this.currentProjectPage = 1;
    submitProjectSearch();
    
    return false;
  }.bind(this);

    
  projectListForm.onsubmit = function() {
    this.currentProjectPage = 1;
    submitProjectSearch();
    return false;
  }.bind(this);

  const previousLink = document.getElementById('pagination-previous');
  const nextLink = document.getElementById('pagination-next');

  nextLink.addEventListener('click', function() {
    this.currentProjectPage += 1;
    submitProjectSearch();
  }.bind(this));

  previousLink.addEventListener('click', function() {
    this.currentProjectPage -= 1;
    submitProjectSearch();
  }.bind(this));

};


ApiDemo.prototype.renderProjects = function(username, page) {
  document.getElementById('loading_indicator').style.display = 'inline-block';

  this.ravelryApiClient.projectsList(username, page).then(function(json) {
    document.getElementById('loading_indicator').style.display = 'none';

    const rootElement = document.getElementById('projects-list-results');
    rootElement.innerHTML = '<h2>' + json.paginator.results + ' projects found</h2>' + 
      '<p> page ' + json.paginator.page + ' of ' + json.paginator.last_page + '</p>';

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


// go!

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function() {
    new ApiDemo();
  });
} else {
  new ApiDemo();
}
