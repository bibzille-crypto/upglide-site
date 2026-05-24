(function() {
  'use strict';
  // Ne compte pas les visites de l'admin ou en localhost
  var host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || window.location.pathname.startsWith('/admin')) return;

  var path = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  var slug = '';
  if (path === '/article') {
    slug = new URLSearchParams(window.location.search).get('slug') || '';
  }

  var body = new URLSearchParams({ path: path });
  if (slug) body.set('slug', slug);

  // sendBeacon : non-bloquant, fonctionne même si l'utilisateur quitte la page
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/.netlify/functions/pageview', body.toString());
  }
})();
