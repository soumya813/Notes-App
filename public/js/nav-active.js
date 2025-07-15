// nav-active.js

document.addEventListener('DOMContentLoaded', function () {
  const navLinks = document.querySelectorAll('.nav-interactive');
  let path = window.location.pathname;
  if (path === '') path = '/'; // Treat empty string as "/"
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  const homePaths = ['/', '', '/index', '/index.html'];

  navLinks.forEach(link => {
    let route = link.dataset.route;
    if (route.length > 1 && route.endsWith('/')) route = route.slice(0, -1);
    // Special case for Home
    if ((homePaths.includes(path) && route === '/') || route === path || link.getAttribute('href') === path) {
      link.classList.add('active');
      // Creative: animate underline on load
      link.style.transition = 'box-shadow 0.4s cubic-bezier(.4,0,.2,1)';
      link.style.boxShadow = '0 4px 0 0 #AC3B61';
      setTimeout(() => {
        link.style.boxShadow = '';
      }, 600);
    }
  });
}); 