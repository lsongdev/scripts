import { randomId } from '../../math.js';
import { get, set } from '../../storage.js';

set('test', 'test');

(async () => {
  const value = await get('test');
  console.log(value);
})();
