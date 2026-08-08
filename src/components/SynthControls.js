import React from 'react';

const WAVEFORMS = ['sine', 'triangle', 'sawtooth', 'square'];

const Slider = ({ id, label, value, display, onChange, ...range }) => (
  <div className="field">
    <label htmlFor={id}>{label}</label>
    <span className="value">{display}</span>
    <input
      id={id}
      type="range"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      {...range}
    />
  </div>
);

const SynthControls = ({
  currentMaqam, setCurrentMaqam, tMaqamsIntervals,
  rootNoteOffset, setRootNoteOffset,
  oscillatorType, setOscillatorType,
  attack, setAttack, decay, setDecay, sustain, setSustain, release, setRelease,
  delayAmount, setDelayAmount, delayFeedback, setDelayFeedback,
  reverbAmount, setReverbAmount,
}) => (
  <div className="synth-controls">
    <section className="panel">
      <h2>Tuning</h2>
      <div className="field">
        <label htmlFor="maqam-select">Maqam</label>
        <select
          id="maqam-select"
          value={currentMaqam}
          onChange={(e) => setCurrentMaqam(e.target.value)}
        >
          {Object.keys(tMaqamsIntervals).map((maqam) => (
            <option key={maqam} value={maqam}>{maqam}</option>
          ))}
        </select>
      </div>
      <Slider
        id="root-offset"
        label="Root octave"
        min="-2"
        max="2"
        step="1"
        value={rootNoteOffset}
        display={rootNoteOffset > 0 ? `+${rootNoteOffset}` : rootNoteOffset}
        onChange={(v) => setRootNoteOffset(Math.round(v))}
      />
    </section>

    <section className="panel">
      <h2>Oscillator</h2>
      <div className="segmented">
        {WAVEFORMS.map((wave) => (
          <button
            key={wave}
            type="button"
            aria-pressed={oscillatorType === wave}
            onClick={() => setOscillatorType(wave)}
          >
            {wave}
          </button>
        ))}
      </div>
    </section>

    <section className="panel wide">
      <h2>Envelope</h2>
      <Slider id="attack" label="Attack" min="0.001" max="2" step="0.001"
        value={attack} display={`${attack.toFixed(3)}s`} onChange={setAttack} />
      <Slider id="decay" label="Decay" min="0.01" max="2" step="0.01"
        value={decay} display={`${decay.toFixed(2)}s`} onChange={setDecay} />
      <Slider id="sustain" label="Sustain" min="0" max="1" step="0.01"
        value={sustain} display={sustain.toFixed(2)} onChange={setSustain} />
      <Slider id="release" label="Release" min="0.01" max="3" step="0.01"
        value={release} display={`${release.toFixed(2)}s`} onChange={setRelease} />
    </section>

    <section className="panel">
      <h2>Space</h2>
      <Slider id="delay" label="Delay mix" min="0" max="1" step="0.01"
        value={delayAmount} display={delayAmount.toFixed(2)} onChange={setDelayAmount} />
      <Slider id="delay-feedback" label="Delay feedback" min="0" max="0.95" step="0.01"
        value={delayFeedback} display={delayFeedback.toFixed(2)} onChange={setDelayFeedback} />
      <Slider id="reverb" label="Reverb mix" min="0" max="1" step="0.01"
        value={reverbAmount} display={reverbAmount.toFixed(2)} onChange={setReverbAmount} />
    </section>
  </div>
);

export default SynthControls;
