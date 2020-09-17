import { ready, addEventListener as on, querySelector as $ } from '../../dom.js';
import * as Tween from '../../tween.js';

ready(() => {

  var t = 10;
  const b = 50;
  const c = 10;
  const d = 100;
  on('#linear-start', 'click', () => {
    
    (function loop(){
      const v = Tween.Quad.easeOut(t++, b, c, d);
      console.log(v);
      $('#linear').style.width = `${v}px`;
      requestAnimationFrame(loop);
    })();

  });

});
