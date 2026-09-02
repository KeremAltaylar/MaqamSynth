import React from 'react';

/* The second voice's step grid.
 *
 * Rows are degrees of the CURRENT maqam, not semitones — the whole point of the
 * instrument is that its scale is not twelve equal steps, so a sequencer that
 * offered chromatic rows would be sequencing the wrong instrument. Change maqam
 * and the same pattern is reinterpreted in the new tuning.
 *
 * Row 0 is the lowest degree, drawn at the bottom, because pitch reads upward.
 */
const StepSequencer = ({
  steps, degrees, pattern, playhead, onToggle,
  running, onRun, bpm, setBpm, division, setDivision, DIVISIONS,
  gate, setGate, level, setLevel, intensity, setIntensity, octave, setOctave, wave, setWave, onClear, onRandom,
}) => (
  <section className="seq" aria-label="Second voice sequencer">
    <div className="seq-head">
      <h2>Second voice</h2>
      <div className="seq-tools">
        <button
          type="button"
          className={`seq-run ${running ? 'on' : ''}`}
          aria-pressed={running}
          onClick={onRun}
        >
          {running ? 'Stop' : 'Run'}
        </button>
        <label className="seq-field">
          <span>Tempo</span>
          <input
            type="range" min="40" max="200" step="1" value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value, 10))}
          />
          <b>{bpm}</b>
        </label>
        <label className="seq-field">
          <span>Rate</span>
          <input
            type="range" min="0" max={DIVISIONS.length - 1} step="1" value={division}
            onChange={(e) => setDivision(parseInt(e.target.value, 10))}
          />
          <b>{DIVISIONS[division].label}</b>
        </label>
        <label className="seq-field">
          <span>Gate</span>
          <input
            type="range" min="0.05" max="1" step="0.05" value={gate}
            onChange={(e) => setGate(parseFloat(e.target.value))}
          />
          <b>{gate.toFixed(2)}</b>
        </label>
        <label className="seq-field">
          <span>Intensity</span>
          <input
            type="range" min="0.05" max="1" step="0.01" value={intensity}
            onChange={(e) => setIntensity(parseFloat(e.target.value))}
          />
          <b>{intensity.toFixed(2)}</b>
        </label>
        <label className="seq-field">
          <span>Level</span>
          <input
            type="range" min="0" max="1" step="0.01" value={level}
            onChange={(e) => setLevel(parseFloat(e.target.value))}
          />
          <b>{level.toFixed(2)}</b>
        </label>
        <label className="seq-field">
          <span>Octave</span>
          <input
            type="range" min="-2" max="2" step="1" value={octave}
            onChange={(e) => setOctave(parseInt(e.target.value, 10))}
          />
          <b>{octave > 0 ? `+${octave}` : octave}</b>
        </label>
        <div className="segmented seq-wave">
          {['sine', 'triangle', 'sawtooth', 'square'].map((w) => (
            <button key={w} type="button" aria-pressed={wave === w} onClick={() => setWave(w)}>
              {w.slice(0, 3)}
            </button>
          ))}
        </div>
        <button type="button" className="seq-btn" onClick={onRandom}>Random</button>
        <button type="button" className="seq-btn" onClick={onClear}>Clear</button>
      </div>
    </div>

    <div className="seq-grid" style={{ '--steps': steps }}>
      {degrees.map((_, rowFromTop) => {
        /* Rows are drawn high-to-low so pitch rises up the grid — the label has
           to be read from the same reversed index as the value, or the grid
           shows the lowest degree at the top while playing the highest. */
        const row = degrees.length - 1 - rowFromTop;
        const degree = degrees[row];
        return (
          <div className="seq-row" key={row}>
            <span className="seq-degree">{degree.name}</span>
            <div className="seq-cells">
              {Array.from({ length: steps }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`seq-cell ${playhead === i ? 'playing' : ''}`}
                  data-beat={i % 4 === 0}
                  aria-pressed={pattern[i] === row}
                  aria-label={`${degree.name}, step ${i + 1}`}
                  onClick={() => onToggle(i, row)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  </section>
);

export default StepSequencer;
