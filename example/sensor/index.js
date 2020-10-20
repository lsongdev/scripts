import { ready, querySelector as $, addEventListener as on } from '../../dom.js';
import { accelerometer, orientation } from '../../sensor.js';

ready(() => {
  const acl = accelerometer({}, acl => {
    $('#x').textContent = acl.x;
    $('#y').textContent = acl.y;
    $('#z').textContent = acl.z;
  });
  on('#accelerometer_start', 'click', () => {
    acl.start();
  });

  const ball = $('.ball');
  const garden = $('.garden');
  const output = $('.output');

  const maxX = garden.clientWidth - ball.clientWidth;
  const maxY = garden.clientHeight - ball.clientHeight;

  orientation(({ absolute, alpha, beta: x, gamma: y }) => {

    output.innerHTML = "beta : " + x + "\n";
    output.innerHTML += "gamma: " + y + "\n";

    // Because we don't want to have the device upside down
    // We constrain the x value to the range [-90,90]
    if (x > 90) { x = 90 };
    if (x < -90) { x = -90 };

    // To make computation easier we shift the range of 
    // x and y to [0,180]
    x += 90;
    y += 90;

    // 10 is half the size of the ball
    // It center the positioning point to the center of the ball
    ball.style.top = (maxY * y / 180 - 10) + "px";
    ball.style.left = (maxX * x / 180 - 10) + "px";

  });
});
