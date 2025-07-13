// nav-active.js

document.addEventListener('DOMContentLoaded', function () {
  const navLinks = document.querySelectorAll('.nav-interactive');
  const path = window.location.pathname;
  // Normalize home paths
  const homePaths = ['/', '', '/index', '/index.html'];

  navLinks.forEach(link => {
    const route = link.dataset.route;
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