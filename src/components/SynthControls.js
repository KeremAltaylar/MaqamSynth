import React from 'react';

const WAVEFORMS = ['sine', 'triangle', 'sawtooth', 'square'];
const FILTER_TYPES = [
  { id: 'lowpass', label: 'LP' },
  { id: 'highpass', label: 'HP' },
  { id: 'bandpass', label: 'BP' },
];

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

const Segmented = ({ label, options, value, onChange }) => (
  <div className="field">
    {label && <label>{label}</label>}
    <div className="segmented">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  </div>
);

/** Hz reads better as kHz once past a thousand. */
const hz = (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}`);

const SynthControls = ({
  currentMaqam, setCurrentMaqam, tMaqamsIntervals,
  rootNoteOffset, setRootNoteOffset,
  oscillatorType, setOscillatorType,
  attack, setAttack, decay, setDecay, sustain, setSustain, release, setRelease,
  filterType, setFilterType, filterFreq, setFilterFreq, filterQ, setFilterQ,
  crushAmount, setCrushAmount, driveAmount, setDriveAmount, chorusAmount, setChorusAmount,
  phaserAmount, setPhaserAmount, tremoloAmount, setTremoloAmount, tremoloRate, setTremoloRate,
  delayAmount, setDelayAmount, delayFeedback, setDelayFeedback, delayTime, setDelayTime,
  reverbAmount, setReverbAmount, reverbDecay, setReverbDecay,
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
      <h2>Filter</h2>
      <Segmented label="Type" options={FILTER_TYPES} value={filterType} onChange={setFilterType} />
      <Slider id="filter-freq" label="Cutoff" min="80" max="14000" step="10"
        value={filterFreq} display={`${hz(filterFreq)}Hz`} onChange={setFilterFreq} />
      <Slider id="filter-q" label="Resonance" min="0" max="14" step="0.1"
        value={filterQ} display={filterQ.toFixed(1)} onChange={setFilterQ} />
    </section>

    <section className="panel">
      <h2>Colour</h2>
      <Slider id="chorus" label="Chorus" min="0" max="1" step="0.01"
        value={chorusAmount} display={chorusAmount.toFixed(2)} onChange={setChorusAmount} />
      <Slider id="drive" label="Drive" min="0" max="1" step="0.01"
        value={driveAmount} display={driveAmount.toFixed(2)} onChange={setDriveAmount} />
      <Slider id="crush" label="Bit crush" min="0" max="1" step="0.01"
        value={crushAmount} display={crushAmount.toFixed(2)} onChange={setCrushAmount} />
    </section>

    <section className="panel">
      <h2>Motion</h2>
      <Slider id="phaser" label="Phaser" min="0" max="1" step="0.01"
        value={phaserAmount} display={phaserAmount.toFixed(2)} onChange={setPhaserAmount} />
      <Slider id="tremolo" label="Tremolo" min="0" max="1" step="0.01"
        value={tremoloAmount} display={tremoloAmount.toFixed(2)} onChange={setTremoloAmount} />
      <Slider id="tremolo-rate" label="Tremolo rate" min="0.2" max="16" step="0.1"
        value={tremoloRate} display={`${tremoloRate.toFixed(1)}Hz`} onChange={setTremoloRate} />
    </section>

    <section className="panel wide">
      <h2>Space</h2>
      <Slider id="delay" label="Delay mix" min="0" max="1" step="0.01"
        value={delayAmount} display={delayAmount.toFixed(2)} onChange={setDelayAmount} />
      <Slider id="delay-time" label="Delay time" min="0.02" max="1.2" step="0.01"
        value={delayTime} display={`${delayTime.toFixed(2)}s`} onChange={setDelayTime} />
      <Slider id="delay-feedback" label="Delay feedback" min="0" max="0.95" step="0.01"
        value={delayFeedback} display={delayFeedback.toFixed(2)} onChange={setDelayFeedback} />
      <Slider id="reverb" label="Reverb mix" min="0" max="1" step="0.01"
        value={reverbAmount} display={reverbAmount.toFixed(2)} onChange={setReverbAmount} />
      <Slider id="reverb-decay" label="Reverb decay" min="0.2" max="8" step="0.1"
        value={reverbDecay} display={`${reverbDecay.toFixed(1)}s`} onChange={setReverbDecay} />
    </section>
  </div>
);

export default SynthControls;
