import { delegate, ready } from '../../dom/events.js';
import { createRouter } from '../../navigation/router.js';

const router = createRouter({
  '/': 'home',
  '/app': 'app',
});

ready(() => {
  router.subscribe(route => console.log('route', route));
  router.start();
  delegate(document, 'click', '#push', () => {
    router.navigate('/app', { state: { a: 1 } });
  });
  delegate(document, 'click', '#back', () => {
    router.back();
  });
});
