

export const createEffect = ({ canvas }) => {
  const ctx = canvas.getContext("2d");
  const cursor = { x: null, y: null, max: 20000 };
  window.onmousemove = function (e) {
    e = e || window.event;
    cursor.x = e.clientX;
    cursor.y = e.clientY;
  };
  window.onmouseout = function (e) {
    cursor.x = null;
    cursor.y = null;
  };
  // 添加粒子
  // x，y为粒子坐标，xa, ya为粒子xy轴加速度，max为连线的最大距离
  const dots = [];
  for (var i = 0; i < 300; i++) {
    var x = Math.random() * canvas.width;
    var y = Math.random() * canvas.height;
    var xa = Math.random() * 2 - 1;
    var ya = Math.random() * 2 - 1;
    dots.push({
      x: x,
      y: y,
      xa: xa,
      ya: ya,
      max: 6000
    })
  }
  let running = false;
  // 每一帧循环的逻辑
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 将鼠标坐标添加进去，产生一个用于比对距离的点数组
    var ndots = [cursor].concat(dots);
    for (const dot of dots) {
      // 粒子位移
      dot.x += dot.xa;
      dot.y += dot.ya;
      // 遇到边界将加速度反向
      dot.xa *= (dot.x > canvas.width || dot.x < 0) ? -1 : 1;
      dot.ya *= (dot.y > canvas.height || dot.y < 0) ? -1 : 1;

      // 绘制点
      ctx.fillRect(dot.x - 0.5, dot.y - 0.5, 1, 1);

      // 循环比对粒子间的距离
      for (var i = 0; i < ndots.length; i++) {
        var d2 = ndots[i];

        if (dot === d2 || d2.x === null || d2.y === null) continue;

        var xc = dot.x - d2.x;
        var yc = dot.y - d2.y;

        // 两个粒子之间的距离
        var dis = xc * xc + yc * yc;

        // 距离比
        var ratio;

        // 如果两个粒子之间的距离小于粒子对象的max值，则在两个粒子间画线
        if (dis < d2.max) {

          // 如果是鼠标，则让粒子向鼠标的位置移动
          if (d2 === cursor && dis > (d2.max / 2)) {
            dot.x -= xc * 0.03;
            dot.y -= yc * 0.03;
          }

          // 计算距离比
          ratio = (d2.max - dis) / d2.max;

          // 画线
          ctx.beginPath();
          ctx.lineWidth = ratio / 2;
          ctx.strokeStyle = `rgba(79,192,141,${ratio + 0.2})`;
          ctx.moveTo(dot.x, dot.y);
          ctx.lineTo(d2.x, d2.y);
          ctx.stroke();
        }
      }
      // 将已经计算过的粒子从数组中删除
      ndots.splice(ndots.indexOf(dot), 1);
    }
  }
  return {
    start() {
      running = true;
      (function loop() {
        draw();
        if (running) requestAnimationFrame(loop);
      })();
    },
    stop() {
      running = false;
    }
  };
};
