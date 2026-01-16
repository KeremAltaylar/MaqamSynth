import React from 'react';
import NexusDial from './NexusDial';

const dialSize = [45, 45];

// Reusable Segmented Control Component
const SegmentedControl = ({ options, value, onChange, name }) => {
  return (
    <div className="segmented-control">
      {options.map((option) => (
        <label key={option.value} className={`segment ${value === option.value ? 'active' : ''}`}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
};

// Reusable Stepper/Segmented Control for Octave
const OctaveControl = ({ value, onChange }) => {
  const options = [
    { label: '-2', value: -2 },
    { label: '-1', value: -1 },
    { label: '0', value: 0 },
    { label: '+1', value: 1 },
    { label: '+2', value: 2 },
  ];

  return (
    <div className="segmented-control octave-control">
      {options.map((option) => (
        <label key={option.value} className={`segment ${value === option.value ? 'active' : ''}`}>
           <input
            type="radio"
            name="octave"
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(parseInt(e.target.value))}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
};


const SynthControls = ({ 
  // Maqam props removed
  rootNoteOffset, setRootNoteOffset,
  oscillatorType, setOscillatorType,
  attack, setAttack, decay, setDecay, sustain, setSustain, release, setRelease,
  // Modulation
  modOscillatorType, setModOscillatorType,
  modAttack, setModAttack, modDecay, setModDecay, modSustain, setModSustain, modRelease, setModRelease,
  modulationIndex, setModulationIndex, harmonicity, setHarmonicity,
  // Effects
  delayAmount, setDelayAmount, delayFeedback, setDelayFeedback,
  reverbAmount, setReverbAmount,
  filterCutoff, setFilterCutoff, filterResonance, setFilterResonance,
  distortionAmount, setDistortionAmount,
  chorusDepth, setChorusDepth
}) => {

  const waveOptions = [
    { label: 'Sin', value: 'sine' },
    { label: 'Saw', value: 'sawtooth' },
    { label: 'Tri', value: 'triangle' },
    { label: 'Sqr', value: 'square' },
  ];

  return (
    <div className="synth-controls-container">
      {/* Top Row: Global, Osc Types, Mod Params, Effects */}
      <div className="controls-row top-row">
        <div className="control-group offset-group">
          <label>Root Octave</label>
          <OctaveControl value={rootNoteOffset} onChange={setRootNoteOffset} />
        </div>

        <div className="control-group osc-type-group">
          <label>Osc 1 Wave</label>
          <SegmentedControl options={waveOptions} value={oscillatorType} onChange={setOscillatorType} name="oscType" />
        </div>

        <div className="control-group osc-type-group">
          <label>Osc 2 (Mod) Wave</label>
          <SegmentedControl options={waveOptions} value={modOscillatorType} onChange={setModOscillatorType} name="modOscType" />
        </div>

         <div className="control-group mod-params-group compact-group">
            <label>FM Params</label>
             <div className="adsr-row">
                <div className="control-item dial-item">
                  <label>Index</label>
                  <NexusDial size={dialSize} min={0} max={100} step={1} value={modulationIndex} onChange={setModulationIndex} />
                </div>
                <div className="control-item dial-item">
                  <label>Harmonic</label>
                  <NexusDial size={dialSize} min={0.1} max={10} step={0.1} value={harmonicity} onChange={setHarmonicity} />
                </div>
             </div>
         </div>

        <div className="control-group fx-controls compact-group">
          <label>Effects Rack</label>
          <div className="adsr-row">
             {/* Filter */}
             <div className="control-item dial-item">
              <label>Cutoff</label>
              <NexusDial size={dialSize} min={20} max={5000} step={10} value={filterCutoff} onChange={setFilterCutoff} />
            </div>
            <div className="control-item dial-item">
              <label>Res</label>
              <NexusDial size={dialSize} min={0} max={20} step={0.1} value={filterResonance} onChange={setFilterResonance} />
            </div>
             {/* Distortion */}
            <div className="control-item dial-item">
              <label>Dist</label>
              <NexusDial size={dialSize} min={0} max={1} step={0.01} value={distortionAmount} onChange={setDistortionAmount} />
            </div>
            {/* Chorus */}
             <div className="control-item dial-item">
              <label>Chorus</label>
              <NexusDial size={dialSize} min={0} max={1} step={0.01} value={chorusDepth} onChange={setChorusDepth} />
            </div>
            {/* Delay & Reverb */}
            <div className="control-item dial-item">
              <label>D.Mix</label>
              <NexusDial size={dialSize} min={0} max={1} step={0.01} value={delayAmount} onChange={setDelayAmount} />
            </div>
            <div className="control-item dial-item">
              <label>D.Fdbk</label>
              <NexusDial size={dialSize} min={0} max={0.95} step={0.01} value={delayFeedback} onChange={setDelayFeedback} />
            </div>
            <div className="control-item dial-item">
              <label>Reverb</label>
              <NexusDial size={dialSize} min={0} max={1} step={0.01} value={reverbAmount} onChange={setReverbAmount} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Envelopes */}
      <div className="controls-row bottom-row">
        <div className="control-group adsr-controls">
          <h3>Osc 1 Envelope</h3>
          <div className="adsr-row">
            <div className="control-item dial-item">
              <label>A</label>
              <NexusDial size={dialSize} min={0.001} max={2} step={0.001} value={attack} onChange={setAttack} />
            </div>
            <div className="control-item dial-item">
              <label>D</label>
              <NexusDial size={dialSize} min={0.01} max={2} step={0.01} value={decay} onChange={setDecay} />
            </div>
            <div className="control-item dial-item">
              <label>S</label>
              <NexusDial size={dialSize} min={0} max={1} step={0.01} value={sustain} onChange={setSustain} />
            </div>
            <div className="control-item dial-item">
              <label>R</label>
              <NexusDial size={dialSize} min={0.01} max={3} step={0.01} value={release} onChange={setRelease} />
            </div>
          </div>
        </div>

        <div className="control-group adsr-controls">
          <h3>Osc 2 (Mod) Envelope</h3>
          <div className="adsr-row">
            <div className="control-item dial-item">
              <label>A</label>
              <NexusDial size={dialSize} min={0.001} max={2} step={0.001} value={modAttack} onChange={setModAttack} />
            </div>
            <div className="control-item dial-item">
              <label>D</label>
              <NexusDial size={dialSize} min={0.01} max={2} step={0.01} value={modDecay} onChange={setModDecay} />
            </div>
            <div className="control-item dial-item">
              <label>S</label>
              <NexusDial size={dialSize} min={0} max={1} step={0.01} value={modSustain} onChange={setModSustain} />
            </div>
            <div className="control-item dial-item">
              <label>R</label>
              <NexusDial size={dialSize} min={0.01} max={3} step={0.01} value={modRelease} onChange={setModRelease} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SynthControls;
