function finite(value, name, { minimum = -Infinity, exclusive = false } = {}) {
  if (!Number.isFinite(value) || (exclusive ? value <= minimum : value < minimum)) {
    const relation = exclusive ? 'greater than' : 'at least';
    throw new RangeError(`${name} must be finite and ${relation} ${minimum}`);
  }
  return value;
}

/** Create and return the standard AudioContext. Construction starts no sound. */
export function createAudioContext(options, {
  AudioContext: AudioContextConstructor = globalThis.AudioContext,
} = {}) {
  if (!AudioContextConstructor) throw new ReferenceError('AudioContext is required');
  return new AudioContextConstructor(options);
}

/** Create a configured native OscillatorNode without starting it. */
export function createOscillator(context, {
  type = 'sine',
  frequency = 440,
  detune = 0,
} = {}) {
  finite(frequency, 'frequency', { minimum: 0 });
  finite(detune, 'detune');
  const oscillator = context.createOscillator();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  oscillator.detune.value = detune;
  return oscillator;
}

/** Create a configured native GainNode. Zero gain is preserved. */
export function createGain(context, { gain = 1 } = {}) {
  finite(gain, 'gain', { minimum: 0 });
  const node = context.createGain();
  node.gain.value = gain;
  return node;
}

/** Connect AudioNodes/AudioParams in order and return the final destination. */
export function connectNodes(...nodes) {
  if (nodes.length < 2) throw new TypeError('At least two audio nodes are required');
  for (let index = 0; index < nodes.length - 1; index += 1) {
    nodes[index].connect(nodes[index + 1]);
  }
  return nodes.at(-1);
}

/** Convert a scientific-pitch note such as A4, C#5, or Bb3 to hertz. */
export function noteToFrequency(note, { a4 = 440 } = {}) {
  finite(a4, 'a4', { minimum: 0, exclusive: true });
  const match = /^([A-Ga-g])([#b]?)(-?\d+)$/.exec(note);
  if (!match) throw new SyntaxError(`Invalid note: ${note}`);

  const pitch = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[match[1].toUpperCase()];
  const accidental = match[2] === '#' ? 1 : match[2] === 'b' ? -1 : 0;
  const midi = (Number(match[3]) + 1) * 12 + pitch + accidental;
  return a4 * 2 ** ((midi - 69) / 12);
}

/** Create a mono AudioBuffer containing white, pink, or brown noise. */
export function createNoiseBuffer(context, {
  type = 'white',
  duration = 2,
  random = Math.random,
} = {}) {
  if (!['white', 'pink', 'brown'].includes(type)) {
    throw new TypeError(`Unsupported noise type: ${type}`);
  }
  finite(duration, 'duration', { minimum: 0, exclusive: true });
  if (typeof random !== 'function') throw new TypeError('random must be a function');

  const length = Math.ceil(duration * context.sampleRate);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const output = buffer.getChannelData(0);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;
  let brown = 0;

  for (let index = 0; index < output.length; index += 1) {
    const white = random() * 2 - 1;
    if (type === 'white') {
      output[index] = white;
    } else if (type === 'pink') {
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      output[index] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    } else {
      brown = (brown + white * 0.02) / 1.02;
      output[index] = brown * 3.5;
    }
  }
  return buffer;
}

/** Create an unstarted looping AudioBufferSourceNode for generated noise. */
export function createNoiseSource(context, options = {}) {
  const source = context.createBufferSource();
  source.buffer = createNoiseBuffer(context, options);
  source.loop = options.loop ?? true;
  return source;
}

function startHandle(source, { signal, when, duration } = {}) {
  signal?.throwIfAborted();
  let stopped = false;
  const stop = (at = 0) => {
    if (stopped) return;
    stopped = true;
    signal?.removeEventListener('abort', abort);
    source.stop(at);
  };
  const abort = () => stop();
  signal?.addEventListener('abort', abort, { once: true });
  source.addEventListener('ended', () => {
    stopped = true;
    signal?.removeEventListener('abort', abort);
  }, { once: true });
  source.start(when);
  if (duration !== undefined) source.stop(when + duration);
  return Object.freeze({ source, stop });
}

/** Play a note and return its native nodes plus an idempotent stop operation. */
export function playNote(context, note, {
  destination = context.destination,
  duration = 0.5,
  gain = 0.5,
  signal,
  type = 'sine',
  when = context.currentTime,
} = {}) {
  finite(duration, 'duration', { minimum: 0, exclusive: true });
  finite(when, 'when', { minimum: 0 });
  const oscillator = createOscillator(context, {
    frequency: noteToFrequency(note),
    type,
  });
  const gainNode = createGain(context, { gain });
  gainNode.gain.exponentialRampToValueAtTime(Math.max(gain * 0.0001, 0.000001), when + duration);
  connectNodes(oscillator, gainNode, destination);
  const handle = startHandle(oscillator, { duration, signal, when });
  return Object.freeze({ ...handle, gain: gainNode, oscillator });
}

/** Play generated noise and return its native nodes plus explicit cleanup. */
export function playNoise(context, type, duration, {
  destination = context.destination,
  gain = 0.5,
  signal,
  when = context.currentTime,
  ...noiseOptions
} = {}) {
  if (duration !== undefined) finite(duration, 'duration', { minimum: 0, exclusive: true });
  const source = createNoiseSource(context, { ...noiseOptions, type });
  const gainNode = createGain(context, { gain });
  connectNodes(source, gainNode, destination);
  const handle = startHandle(source, { duration, signal, when });
  return Object.freeze({ ...handle, gain: gainNode });
}
