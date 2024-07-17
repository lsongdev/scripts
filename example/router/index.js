import { ready, filterEvent } from '../../dom.js';
import { push, listen, back } from '../../router.js';

ready(() => {
  listen(loc => console.log('loc', loc));
  document.addEventListener('click', filterEvent('#push', e => {
    push('/app', { a: 1 });
  }));
  document.addEventListener('click', filterEvent('#back', e => {
    back();
  }));
});
