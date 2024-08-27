export const createAudioContext = () => new AudioContext();

export const createOscillator = (context, options) => {
  const osc = context.createOscillator();
  osc.type = options.type || 'sine';
  osc.frequency.setValueAtTime(options.frequency, context.currentTime);
  return osc;
};

export const createGain = (context, options) => {
  const gain = context.createGain();
  gain.gain.setValueAtTime(options.initialGain || 1, context.currentTime);
  if (options.endGain !== undefined && options.duration !== undefined) {
    gain.gain.exponentialRampToValueAtTime(options.endGain, context.currentTime + options.duration);
  }
  return gain;
};

export const connectNodes = (...nodes) => {
  for (let i = 0; i < nodes.length - 1; i++) {
    nodes[i].connect(nodes[i + 1]);
  }
};

export const playSound = async (context, setup) => {
  await context.resume();
  const { oscillators, gains, duration } = setup(context);
  oscillators.forEach((osc, i) => connectNodes(osc, gains[i], context.destination));
  oscillators.forEach(osc => osc.start());
  oscillators.forEach(osc => osc.stop(context.currentTime + duration));
};

export const stopSound = (sound) => {
  sound.oscillators.forEach(osc => osc.stop());
};

// Existing sound effects
export const createExplosionSound = context => ({
  oscillators: [
    createOscillator(context, { frequency: 100, type: 'sawtooth' }),
    createOscillator(context, { frequency: 80, type: 'square' }),
    createOscillator(context, { frequency: 60, type: 'triangle' })
  ],
  gains: [
    createGain(context, { initialGain: 1, endGain: 0.001, duration: 0.5 }),
    createGain(context, { initialGain: 1, endGain: 0.001, duration: 0.5 }),
    createGain(context, { initialGain: 1, endGain: 0.001, duration: 0.5 })
  ],
  duration: 0.5
});

export const createShootSound = context => ({
  oscillators: [
    createOscillator(context, { frequency: 880, type: 'sine' }),
    createOscillator(context, { frequency: 440, type: 'square' })
  ],
  gains: [
    createGain(context, { initialGain: 1, endGain: 0.001, duration: 0.1 }),
    createGain(context, { initialGain: 1, endGain: 0.001, duration: 0.1 })
  ],
  duration: 0.1
});

export const createPowerUpSound = context => {
  const osc = createOscillator(context, { frequency: 220, type: 'sine' });
  const gain = createGain(context, { initialGain: 1, endGain: 0.001, duration: 0.3 });
  osc.frequency.exponentialRampToValueAtTime(880, context.currentTime + 0.3);
  return {
    oscillators: [osc],
    gains: [gain],
    duration: 0.3
  };
};

export const createSpaceAmbience = context => {
  const osc = createOscillator(context, { frequency: 220, type: 'sine' });
  const lfo = createOscillator(context, { frequency: 0.5, type: 'sine' });
  const lfoGain = createGain(context, { initialGain: 10 });
  const gain = createGain(context, { initialGain: 0.2 });
  connectNodes(lfo, lfoGain, osc.frequency);
  connectNodes(osc, gain, context.destination);
  return { oscillators: [osc, lfo], gains: [lfoGain, gain] };
};

// Enhanced piano support
export const noteToFreq = (note) => {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = parseInt(note.slice(-1));
  const semitone = notes.indexOf(note.slice(0, -1));
  return 440 * Math.pow(2, (octave - 4) + (semitone - 9) / 12);
};

export const playNote = (context, note, duration = 0.5, type = 'sine') => {
  const frequency = noteToFreq(note);
  const oscillator = createOscillator(context, { frequency, type });
  const gain = createGain(context, { initialGain: 0.5, endGain: 0.001, duration });
  connectNodes(oscillator, gain, context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
};

// New noise generators
export const createNoiseGenerator = (context, type) => {
  const bufferSize = 2 * context.sampleRate;
  const noiseBuffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const output = noiseBuffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    switch (type) {
      case 'white':
        output[i] = Math.random() * 2 - 1;
        break;
      case 'pink':
        let b0, b1, b2, b3, b4, b5, b6;
        b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + (Math.random() * 2 - 1) * 0.5) / 3.5;
        b0 = 0.99886 * b0 + (Math.random() * 2 - 1) * 0.0555179;
        b1 = 0.99332 * b1 + (Math.random() * 2 - 1) * 0.0750759;
        b2 = 0.96900 * b2 + (Math.random() * 2 - 1) * 0.1538520;
        b3 = 0.86650 * b3 + (Math.random() * 2 - 1) * 0.3104856;
        b4 = 0.55000 * b4 + (Math.random() * 2 - 1) * 0.5329522;
        b5 = -0.7616 * b5 - (Math.random() * 2 - 1) * 0.0168980;
        break;
      default:
        throw new Error('Unsupported noise type');
    }
  }

  const noise = context.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.loop = true;
  return noise;
};

export const playNoise = (context, type, duration) => {
  const noise = createNoiseGenerator(context, type);
  const gain = createGain(context, { initialGain: 0.5, endGain: 0.001, duration });
  connectNodes(noise, gain, context.destination);
  noise.start();
  if (duration) {
    noise.stop(context.currentTime + duration);
  }
  return { source: noise, gain };
};

// New environmental sound effects
export const createRainSound = (context, intensity = 1, duration) => {
  const noise = createNoiseGenerator(context, 'white');
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 500 + intensity * 500;
  const gain = createGain(context, { initialGain: 0.2 * intensity, endGain: 0.001, duration });
  connectNodes(noise, filter, gain, context.destination);
  noise.start();
  if (duration) {
    noise.stop(context.currentTime + duration);
  }
  return { source: noise, filter, gain };
};

export const createOceanWaves = (context, frequency = 0.2, duration) => {
  const noise = createNoiseGenerator(context, 'white');
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 500;
  const lfo = createOscillator(context, { frequency, type: 'sine' });
  const lfoGain = createGain(context, { initialGain: 400 });
  const gain = createGain(context, { initialGain: 0.5, endGain: 0.001, duration });
  connectNodes(lfo, lfoGain, filter.frequency);
  connectNodes(noise, filter, gain, context.destination);
  lfo.start();
  noise.start();
  if (duration) {
    lfo.stop(context.currentTime + duration);
    noise.stop(context.currentTime + duration);
  }
  return { sources: [noise, lfo], filter, gains: [lfoGain, gain] };
};
