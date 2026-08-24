import {
  connectNodes,
  createGain,
  createNoiseSource,
  createOscillator,
} from '../../media/audio.js';

function startSources(sources, { duration, signal } = {}) {
  signal?.throwIfAborted();
  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    signal?.removeEventListener('abort', stop);
    for (const source of sources) {
      try {
        source.stop();
      } catch (error) {
        if (error?.name !== 'InvalidStateError') throw error;
      }
    }
  };
  signal?.addEventListener('abort', stop, { once: true });
  for (const source of sources) source.start();
  if (duration !== undefined) {
    for (const source of sources) source.stop(source.context.currentTime + duration);
  }
  return Object.freeze({ sources, stop });
}

export function createExplosion(context, { destination = context.destination, signal } = {}) {
  const frequencies = [100, 80, 60];
  const types = ['sawtooth', 'square', 'triangle'];
  const sources = frequencies.map((frequency, index) => {
    const oscillator = createOscillator(context, { frequency, type: types[index] });
    const gain = createGain(context, { gain: 0.35 });
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.5);
    connectNodes(oscillator, gain, destination);
    return oscillator;
  });
  return startSources(sources, { duration: 0.5, signal });
}

export function createPowerUp(context, { destination = context.destination, signal } = {}) {
  const oscillator = createOscillator(context, { frequency: 220 });
  const gain = createGain(context, { gain: 0.5 });
  oscillator.frequency.exponentialRampToValueAtTime(880, context.currentTime + 0.3);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.3);
  connectNodes(oscillator, gain, destination);
  return startSources([oscillator], { duration: 0.3, signal });
}

export function createRain(context, {
  destination = context.destination,
  duration,
  intensity = 1,
  signal,
} = {}) {
  const source = createNoiseSource(context, { type: 'white' });
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 500 + intensity * 500;
  const gain = createGain(context, { gain: 0.2 * intensity });
  connectNodes(source, filter, gain, destination);
  return Object.freeze({ ...startSources([source], { duration, signal }), filter, gain });
}

export function createOcean(context, {
  destination = context.destination,
  duration,
  frequency = 0.2,
  signal,
} = {}) {
  const noise = createNoiseSource(context, { type: 'pink' });
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 500;
  const lfo = createOscillator(context, { frequency });
  const modulation = createGain(context, { gain: 400 });
  const output = createGain(context, { gain: 0.5 });
  connectNodes(lfo, modulation, filter.frequency);
  connectNodes(noise, filter, output, destination);
  return Object.freeze({
    ...startSources([noise, lfo], { duration, signal }),
    filter,
    gains: Object.freeze([modulation, output]),
  });
}
