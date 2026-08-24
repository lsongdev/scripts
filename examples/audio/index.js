import {
  createAudioContext,
  playNoise,
  playNote,
} from '../../media/audio.js';

let context;
let active;

async function audioContext() {
  context ??= createAudioContext();
  await context.resume();
  return context;
}

function stopActive() {
  active?.stop();
  active = undefined;
}

document.addEventListener('click', async event => {
  const button = event.target.closest('button');
  if (!button) return;
  stopActive();
  if (button.id === 'stop') return;

  const audio = await audioContext();
  if (button.dataset.note) {
    active = playNote(audio, button.dataset.note, { duration: 0.5 });
  } else if (button.dataset.noise) {
    active = playNoise(audio, button.dataset.noise, undefined, { gain: 0.2 });
  }
});

window.addEventListener('pagehide', () => {
  stopActive();
  void context?.close();
}, { once: true });
