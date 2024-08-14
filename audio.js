
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
