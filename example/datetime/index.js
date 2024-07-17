import { format } from '../../time.js';
import '../../components/time.js';

setInterval(() => {
  const time = format('{yyyy}/{MM}/{dd} {HH}:{mm}:{ss}');
  document.querySelector('time').textContent = time;
}, 1000);
