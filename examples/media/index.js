import { $ } from '../../dom/query.js';
import { defineCamera } from '../../elements/camera.js';
import {
  listDevices,
  requestCamera,
  requestDisplay,
  stopMediaStream,
} from '../../media/capture.js';
import { attachMediaStream } from '../../media/video.js';

defineCamera();

const video = $('video');
let stream = null;
let detach = null;

function stop() {
  if (stream) stopMediaStream(stream);
  stream = null;
  detach?.();
  detach = null;
}

async function show(nextStream) {
  stop();
  stream = nextStream;
  detach = attachMediaStream(video, stream);
  await video.play();
}

const $videoinputs = $('#videoinputs');
const $audioinputs = $('#audioinputs');
const $audiooutputs = $('#audiooutputs');

const appendToSelect = (dom, device) => {
  const option = document.createElement('option');
  option.value = device.deviceId;
  option.textContent = device.label;
  dom.appendChild(option);
  return option;
};

$('#refresh').addEventListener('click', async () => {
  for (const select of [$audioinputs, $audiooutputs, $videoinputs]) {
    select.replaceChildren();
  }
  for (const device of await listDevices()) {
    const target = {
      audioinput: $audioinputs,
      audiooutput: $audiooutputs,
      videoinput: $videoinputs,
    }[device.kind];
    if (target) appendToSelect(target, device);
  }
});

$('#camera').addEventListener('click', async () => show(await requestCamera()));
$('#screen').addEventListener('click', async () => show(await requestDisplay()));
$('#stop').addEventListener('click', stop);

const cameraView = $('camera-view');
$('#camera-view-start').addEventListener('click', () => cameraView.start());
$('#camera-view-stop').addEventListener('click', () => cameraView.stop());
