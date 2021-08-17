import { format, diff } from '../../time.js';
import '../../components/time.js';


setInterval(() => {
  console.log(diff('{mm}:{ss}'));
  console.log('现在时间是：', format('{yyyy}-{MM}-{dd} {HH}:{mm}:{ss}'), '已经过了', diff('{d}天{hour}小时{mm}分钟{ss}秒', new Date(0)));
}, 1000);
