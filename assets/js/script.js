'use strict';

/* ---------- theme toggle ---------- */
(function () {
  var root = document.documentElement;
  var toggle = document.querySelector('[data-theme-toggle]');
  var stored = null;
  try { stored = localStorage.getItem('theme'); } catch (e) {}
  if (stored === 'light' || stored === 'dark') root.setAttribute('data-theme', stored);

  if (toggle) {
    toggle.addEventListener('click', function () {
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var current = root.getAttribute('data-theme') || (prefersDark ? 'dark' : 'light');
      var next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  }
})();

/* ---------- language switch: open the other page at the same section ---------- */
(function () {
  document.querySelectorAll('.lang-switch a:not([aria-current])').forEach(function (link) {
    link.addEventListener('click', function () {
      link.href = link.getAttribute('href').split('#')[0] + location.hash;
    });
  });
})();

/* ---------- mobile nav ---------- */
(function () {
  var navToggle = document.querySelector('[data-nav-toggle]');
  var navLinks = document.querySelector('[data-nav-links]');
  if (!navToggle || !navLinks) return;

  function closeNav() {
    navLinks.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }

  navToggle.addEventListener('click', function () {
    var isOpen = navLinks.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeNav);
  });
})();

/* ---------- scroll-spy active nav link ---------- */
(function () {
  var links = Array.prototype.slice.call(document.querySelectorAll('[data-nav-link]'));
  if (!links.length) return;

  var sections = links
    .map(function (link) {
      var id = link.getAttribute('href').replace('#', '');
      return document.getElementById(id);
    })
    .filter(Boolean);

  if (!sections.length || !('IntersectionObserver' in window)) return;

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (link) {
          link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
        });
      });
    },
    { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
  );

  sections.forEach(function (section) { observer.observe(section); });
})();

/* ---------- reveal-on-scroll ---------- */
(function () {
  var targets = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  if (!targets.length) return;

  if (!('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  targets.forEach(function (el) { observer.observe(el); });
})();

/* ---------- footer year ---------- */
(function () {
  var yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
