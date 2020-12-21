import { ready, addEventListener } from '../../dom.js';
import { push, listen, back } from '../../router.js';

ready(() => {

  listen(loc => console.log('loc', loc));

  addEventListener(document, 'click,#push', () => {
    push('/app', { a: 1 })
  });

  addEventListener(document, 'click,#back', () => {
    back();
  });

});
