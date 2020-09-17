import { ready, querySelector as $, addEventListener } from '../../dom.js';
import { requestCamera, requestMicrophone } from '../../media.js';

ready(() => {

  addEventListener('#camera', 'click', async () => {
    const camera = await requestCamera({ microphonoe: false, width: 1280, height: 720 });
    console.log('camera:', camera);
    video.srcObject = camera;
    video.onloadedmetadata = () => video.play();
  });

  addEventListener('#microphone', 'click', async () => {
    const microphone = await requestMicrophone();
    console.log('microphone:', microphone);
  });

  const screen = $('#screen');
  addEventListener('#capture', 'click', () => {
    const context = screen.getContext('2d');
    const width = 320;
    const height = video.videoHeight / (video.videoWidth/width);
    screen.setAttribute('width', width);
    screen.setAttribute('height', height);
    context.drawImage(video, 0, 0, width, height);
  });

});
