import React from 'react';
import Knob from './Knob';

const WAVEFORMS = ['sine', 'triangle', 'sawtooth', 'square'];
const FILTER_TYPES = [
  { id: 'lowpass', label: 'LP' },
  { id: 'highpass', label: 'HP' },
  { id: 'bandpass', label: 'BP' },
];

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
  satLow, setSatLow, satHigh, setSatHigh,
  phaserAmount, setPhaserAmount, tremoloAmount, setTremoloAmount, tremoloRate, setTremoloRate,
  delayAmount, setDelayAmount, delayFeedback, setDelayFeedback, delayTime, setDelayTime,
  reverbAmount, setReverbAmount, reverbDecay, setReverbDecay,
}) => (
  <div className="synth-controls">
    <section className="panel panel-tuning">
      <h2>Tuning</h2>
      <div className="panel-row">
        <div className="field field-select">
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
        <Knob
          id="root-offset" label="Root 8ve" min={-2} max={2} step={1}
          value={rootNoteOffset}
          display={rootNoteOffset > 0 ? `+${rootNoteOffset}` : `${rootNoteOffset}`}
          onChange={(v) => setRootNoteOffset(Math.round(v))}
        />
      </div>
    </section>

    <section className="panel panel-osc">
      <h2>Oscillator</h2>
      <div className="segmented segmented-stack">
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

    <section className="panel panel-env">
      <h2>Envelope</h2>
      <div className="panel-row">
        <Knob id="attack" label="Attack" min={0.005} max={2} step={0.001}
          value={attack} display={`${attack.toFixed(3)}s`} onChange={setAttack} />
        <Knob id="decay" label="Decay" min={0.01} max={2} step={0.01}
          value={decay} display={`${decay.toFixed(2)}s`} onChange={setDecay} />
        <Knob id="sustain" label="Sustain" min={0} max={1} step={0.01}
          value={sustain} display={sustain.toFixed(2)} onChange={setSustain} />
        <Knob id="release" label="Release" min={0.03} max={3} step={0.01}
          value={release} display={`${release.toFixed(2)}s`} onChange={setRelease} />
      </div>
    </section>

    <section className="panel panel-filter">
      <h2>Filter</h2>
      <div className="panel-row">
        <Segmented options={FILTER_TYPES} value={filterType} onChange={setFilterType} />
        <Knob id="filter-freq" label="Cutoff" min={80} max={14000} step={10}
          value={filterFreq} display={`${hz(filterFreq)}Hz`} onChange={setFilterFreq} />
        <Knob id="filter-q" label="Reso" min={0} max={14} step={0.1}
          value={filterQ} display={filterQ.toFixed(1)} onChange={setFilterQ} />
      </div>
    </section>

    <section className="panel panel-colour">
      <h2>Colour</h2>
      <div className="panel-row">
        <Knob id="chorus" label="Chorus" min={0} max={1} step={0.01}
          value={chorusAmount} display={chorusAmount.toFixed(2)} onChange={setChorusAmount} />
        <Knob id="drive" label="Drive" min={0} max={1} step={0.01}
          value={driveAmount} display={driveAmount.toFixed(2)} onChange={setDriveAmount} />
        <Knob id="crush" label="Crush" min={0} max={1} step={0.01}
          value={crushAmount} display={crushAmount.toFixed(2)} onChange={setCrushAmount} />
        <Knob id="sat-low" label="Sat low" min={0} max={1} step={0.01}
          value={satLow} display={satLow === 0 ? 'off' : satLow.toFixed(2)} onChange={setSatLow} />
        <Knob id="sat-high" label="Sat high" min={0} max={1} step={0.01}
          value={satHigh} display={satHigh === 0 ? 'off' : satHigh.toFixed(2)} onChange={setSatHigh} />
      </div>
    </section>

    <section className="panel panel-motion">
      <h2>Motion</h2>
      <div className="panel-row">
        <Knob id="phaser" label="Phaser" min={0} max={1} step={0.01}
          value={phaserAmount} display={phaserAmount.toFixed(2)} onChange={setPhaserAmount} />
        <Knob id="tremolo" label="Tremolo" min={0} max={1} step={0.01}
          value={tremoloAmount} display={tremoloAmount.toFixed(2)} onChange={setTremoloAmount} />
        <Knob id="tremolo-rate" label="Rate" min={0.2} max={16} step={0.1}
          value={tremoloRate} display={`${tremoloRate.toFixed(1)}Hz`} onChange={setTremoloRate} />
      </div>
    </section>

    <section className="panel panel-space">
      <h2>Space</h2>
      <div className="panel-row">
        <Knob id="delay" label="Delay" min={0} max={1} step={0.01}
          value={delayAmount} display={delayAmount.toFixed(2)} onChange={setDelayAmount} />
        <Knob id="delay-time" label="Time" min={0.02} max={1.2} step={0.01}
          value={delayTime} display={`${delayTime.toFixed(2)}s`} onChange={setDelayTime} />
        <Knob id="delay-feedback" label="Feedback" min={0} max={0.95} step={0.01}
          value={delayFeedback} display={delayFeedback.toFixed(2)} onChange={setDelayFeedback} />
        <Knob id="reverb" label="Reverb" min={0} max={1} step={0.01}
          value={reverbAmount} display={reverbAmount.toFixed(2)} onChange={setReverbAmount} />
        <Knob id="reverb-decay" label="Decay" min={0.2} max={8} step={0.1}
          value={reverbDecay} display={`${reverbDecay.toFixed(1)}s`} onChange={setReverbDecay} />
      </div>
    </section>
  </div>
);

export default SynthControls;
