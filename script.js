'use strict';

// Navigation remains usable if JavaScript fails or is disabled.
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.nav');
const mobileQuery = window.matchMedia('(max-width: 800px)');

function setMenu(open, restoreFocus = false) {
  navigation.classList.toggle('open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  if (restoreFocus) menuButton.focus();
}

if (menuButton && navigation) {
  document.documentElement.classList.add('nav-enhanced');
  menuButton.hidden = !mobileQuery.matches;
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  navigation.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') setMenu(false, true);
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.topbar')) setMenu(false);
  });
  document.addEventListener('focusin', (event) => {
    if (!event.target.closest('.topbar')) setMenu(false);
  });
  const syncNavigation = () => {
    menuButton.hidden = !mobileQuery.matches;
    setMenu(false);
  };
  if (mobileQuery.addEventListener) mobileQuery.addEventListener('change', syncNavigation);
  else mobileQuery.addListener(syncNavigation);
}

// Observe section visibility instead of running work on every scroll event.
if ('IntersectionObserver' in window) {
  const sectionLinks = Array.from(navigation.querySelectorAll('a'));
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      sectionLinks.forEach((link) => {
        if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-15% 0px -65% 0px', threshold: 0 });
  document.querySelectorAll('main section[id]').forEach((section) => observer.observe(section));
}

const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

// Native dialog handles focus trapping, Escape and focus restoration.
// The anchors open the original images when dialog is unsupported.
const dialog = document.querySelector('.certificate-dialog');
if (dialog && typeof dialog.showModal === 'function') {
  const dialogImage = dialog.querySelector('.dialog-image');
  document.querySelectorAll('[data-certificate]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      dialogImage.src = link.getAttribute('href');
      dialogImage.alt = link.closest('.certificate').querySelector('h3').textContent;
      dialog.showModal();
    });
  });
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
}
