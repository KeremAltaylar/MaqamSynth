import * as Tone from 'tone';

/* Two-band saturator, the same design as VMI-001's but built from Tone nodes.
 *
 * The dry signal passes through untouched. A low band and a high band are split
 * off, driven through a waveshaper, filtered again, and blended back on top —
 * so raising a band ADDS harmonics at that end rather than replacing what was
 * there. Both band gains start at zero, so at rest it is transparent.
 *
 * The second filter on each band is not decoration. Saturation generates
 * harmonics above the fundamental, so a driven low band sprays energy into the
 * midrange; without it, a "low saturator" mostly makes mids. Measured on the
 * drum machine, that was +60% mid against +22% low before the taming filters
 * and +40% against +31% after.
 */

const SAMPLES = 2048;

/** Soft and symmetric: rounds peaks, thickens weight. */
function tanhCurve(drive) {
  const curve = new Float32Array(SAMPLES);
  const k = 1 + drive * 24;
  for (let i = 0; i < SAMPLES; i++) {
    const x = (i / (SAMPLES - 1)) * 2 - 1;
    curve[i] = Math.tanh(k * x) / Math.tanh(k);
  }
  return curve;
}

/** Harder knee: more odd harmonics, which is what reads as bite. */
function edgeCurve(drive) {
  const curve = new Float32Array(SAMPLES);
  const k = 1 + drive * 60;
  for (let i = 0; i < SAMPLES; i++) {
    const x = (i / (SAMPLES - 1)) * 2 - 1;
    curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
  }
  return curve;
}

export function createSaturator({ lowCross = 180, highCross = 3200 } = {}) {
  const input = new Tone.Gain(1);
  const output = new Tone.Gain(1);
  const dry = new Tone.Gain(1);

  const lowSplit = new Tone.Filter(lowCross, 'lowpass');
  const lowShaper = new Tone.WaveShaper(tanhCurve(0.5));
  const lowTame = new Tone.Filter(lowCross * 4, 'lowpass');
  const lowGain = new Tone.Gain(0);

  const highSplit = new Tone.Filter(highCross, 'highpass');
  const highShaper = new Tone.WaveShaper(edgeCurve(0.5));
  const highTame = new Tone.Filter(highCross, 'highpass');
  const highGain = new Tone.Gain(0);

  input.connect(dry);
  dry.connect(output);

  input.chain(lowSplit, lowShaper, lowTame, lowGain, output);
  input.chain(highSplit, highShaper, highTame, highGain, output);

  return {
    input,
    output,

    setLow(amount) {
      lowShaper.setMap((x) => {
        const k = 1 + amount * 24;
        return Math.tanh(k * x) / Math.tanh(k);
      });
      /* Blended below unity: a saturated low band at full level is mud. */
      lowGain.gain.rampTo(amount * 0.55, 0.03);
    },

    setHigh(amount) {
      highShaper.setMap((x) => {
        const k = 1 + amount * 60;
        return ((1 + k) * x) / (1 + k * Math.abs(x));
      });
      highGain.gain.rampTo(amount * 0.4, 0.03);
    },

    setLowCross(hz) {
      lowSplit.frequency.rampTo(hz, 0.03);
      lowTame.frequency.rampTo(hz * 4, 0.03);
    },

    setHighCross(hz) {
      highSplit.frequency.rampTo(hz, 0.03);
      highTame.frequency.rampTo(hz, 0.03);
    },

    dispose() {
      [input, output, dry, lowSplit, lowShaper, lowTame, lowGain,
        highSplit, highShaper, highTame, highGain].forEach((n) => n.dispose());
    },
  };
}
