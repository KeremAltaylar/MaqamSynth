import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Tone from 'tone';
import SynthControls from './SynthControls';
import MaqamNoteDisplay from './MaqamNoteDisplay';
import './MaqamSynth.css';

// --- Global Maqam Data (constants) ---
const ROOT_FREQUENCY = 110; // Root frequency, likely A1 in Hz
const MICROTONAL_SIZE = 53; // Number of steps in the equal temperament system (53-TET)
const UP_KEY_POOL = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'ı', 'o', 'p', 'ğ', 'ü'];
const BASE_KEY_POOL = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ş', 'i', ','];
const DOWN_KEY_POOL = ['z', 'x', 'c', 'v', 'b', 'n', 'm', 'ö', 'ç', '.'];

// The dictionary of Turkish Maqams intervals in 53-TET steps
const tMaqamsIntervals = {
    Rast: [9,8,5,9,9,4,4,5], Nahawand: [9,4,9,9,4,9,9], HicazUzzalHumayun: [5,12,5,9,4,4,5,9], Hicazkar: [5,12,5,9,5,3,5,4,5], Yegah: [9,8,5,9,8,4,4,5], SultaniyegahRuhnevaz: [9,4,9,9,4,9,4,5], FerahnumaAskefza: [4,9,9,9,4,9,9], Sedaraban: [5,12,5,9,5,8,4,5], Huseyniasiran: [8,5,9,8,5,9,9], Suzidil: [5,1,5,4 ,4,5,4,5], Acemasiran: [9,9,4,4,5,9,9,4], Sevkefza: [9,5,4,4,4,5,5,13,4], Iraq: [5,9,8,5,9,9,4,4],EvicSegah: [5,9,8,5,4,5,9,4,4], Ferahnak: [5,9,8,1,4,4,5,9,4, 4], Evicara: [5,13,4,9,5,13,4], Mahur: [9,9,4,9,9,4,5,4], Suzidilara: [9,5,4,4,4 ,5,9,4,5,4], Buzurk: [9,9,4,4,5,9,4,4,5], Suzinak: [5,4,4,4,5,9,4,9,9], ZirguleliSuzinak: [5,12,5,5,4,4,4,5,9], Kurdilihicazkar: [4,1,4,4,4,5,9,4,4,5], Nihavend: [9,4,9,5,4,4,5,8,5], Neveser: [9,5,12,5,5,12,5], Nikriz: [9,5,12,5,9,4 ,4,5], HuseyniMuhayyer:[8,5,9,9,4,4,5,9], GulizarBeyati: [8,5,9,5,4,4,4,5,9], UssakAcem: [8,5,9,9,4,9,9],
    Kurdi: [4,4,1,4,9,4,5,4,9,9], Buselik: [9,4,9,5,4,4,4,5,4,5], Arazbar: [8,5,9,5,3,1,4,4,5,9],  Zirgule: [5,12,5,9,4,1,8,4,5], Sehnaz: [5,12,5,9,4,1,3,5,4,5], SabaSunbule: [8,5,5,13,4,9,9],  Kucek: [8,5,5,13,4,4,5,5,4], EskiSipihr: [8,5,5,1,3,9,4,4,5,4,5],  Dugah:[4,4,5,4,1,13,4,9,9],
    Hisar: [8,5,9,4,5,4,1,8,4,5], YeniSipihr: [5,3,5,4,5,4,5,4,1,3,5,4,5], Nisaburek: [9,8,5,9,5,8,9], Huzzam: [5,9,5,12, 5,9,4,4], Mustear: [9,5,8,9,5,9,4,4], MayeYeniMaye: [5,9,8,1,4,9,9,8], VechiArazbar: [1,4,9,8,5,9,9,3,5], Nisabur: [8,5,9,4,9,9,4,5],  CargahI: [5,13,4,9,5,12,5], CargahII: [9,9,4,9,9,9,4], Araban: [5,8,13,5,5,8,4,5], Urmawi: [9,8,5,9,9,5,8]
};

// Helper function to convert frequency to a musical note name (e.g., A4, C#5)
// Helper function to convert frequency to Turkish Maqam note name
const frequencyToNoteName = (frequency) => {
  const A4 = 440; // A4 frequency
  const A4_MIDI = 69; // MIDI note number for A4

  // Calculate MIDI note number
  const midiNote = 12 * (Math.log2(frequency / A4)) + A4_MIDI;
  
  // Round to the nearest integer for standard notes, or keep decimal for microtonal
  const roundedMidiNote = Math.round(midiNote);
  const cents = Math.round((midiNote - roundedMidiNote) * 100);

  // Turkish note names according to Nail Yavuzoğlu's theory
  const turkishNoteNames = [
    "Do", // C
    "Do♯", // C#
    "Re", // D
    "Re♯", // D#
    "Mi", // E
    "Fa", // F
    "Fa♯", // F#
    "Sol", // G
    "Sol♯", // G#
    "La", // A
    "La♯", // A#
    "Si"  // B
  ];

  // Special symbols for microtonal intervals
  let noteName = turkishNoteNames[roundedMidiNote % 12];
  const octave = Math.floor(roundedMidiNote / 12) - 1; // MIDI note 0 is C-1
  
  // Add microtonal symbols if needed
  if (Math.abs(cents) > 10 && Math.abs(cents) < 90) {
    if (cents > 0) {
      noteName += "↑"; // Up arrow for slightly sharp
    } else {
      noteName += "↓"; // Down arrow for slightly flat
    }
  }

  return `${noteName}${octave}`;
};

const MaqamSynth = () => {
  const synth = useRef(null);
  const gainNode = useRef(null);
  const delayEffect = useRef(null);
  const reverbEffect = useRef(null);
  const filterEffect = useRef(null); // Filter
  const distortionEffect = useRef(null); // Distortion
  const chorusEffect = useRef(null); // Chorus
  const limiter = useRef(null); // Add a limiter to prevent clipping

  // --- State for Synth Parameters ---
  const [oscillatorType, setOscillatorType] = useState('sine');
  const [attack, setAttack] = useState(0.01); // Default attack
  const [decay, setDecay] = useState(0.2);   // Default decay
  const [sustain, setSustain] = useState(0.5); // Default sustain
  const [release, setRelease] = useState(1.0);  // Default release

  // --- State for Modulation Oscillator ---
  const [modOscillatorType, setModOscillatorType] = useState('sine');
  const [modAttack, setModAttack] = useState(0.01);
  const [modDecay, setModDecay] = useState(0.2);
  const [modSustain, setModSustain] = useState(0.5);
  const [modRelease, setModRelease] = useState(1.0);
  const [modulationIndex, setModulationIndex] = useState(10);
  const [harmonicity, setHarmonicity] = useState(1);

  // --- State for Effects ---
  const [delayAmount, setDelayAmount] = useState(0);
  const [delayFeedback, setDelayFeedback] = useState(0.5); // New: Delay Feedback
  const [reverbAmount, setReverbAmount] = useState(0);
  const [filterCutoff, setFilterCutoff] = useState(2000); // Filter Cutoff
  const [filterResonance, setFilterResonance] = useState(1); // Filter Resonance (Q)
  const [distortionAmount, setDistortionAmount] = useState(0); // Distortion Amount
  const [chorusDepth, setChorusDepth] = useState(0); // Chorus Depth

  // --- Maqam related states ---
  const [currentMaqam, setCurrentMaqam] = useState('Rast');
  const [maqamNotes, setMaqamNotes] = useState([]);
  const [rootNoteOffset, setRootNoteOffset] = useState(0);
  const currentMaqamScaleLength = (tMaqamsIntervals[currentMaqam]?.length || 0) + 1;
  const [activeFreqs, setActiveFreqs] = useState(new Set());
  const baseOctaveKeys = React.useMemo(() => BASE_KEY_POOL.slice(0, currentMaqamScaleLength), [currentMaqamScaleLength]);
  const octaveDownKeys = React.useMemo(() => DOWN_KEY_POOL.slice(0, Math.min(currentMaqamScaleLength, DOWN_KEY_POOL.length)), [currentMaqamScaleLength]);
  const octaveUpKeys = React.useMemo(() => UP_KEY_POOL.slice(0, Math.min(currentMaqamScaleLength, UP_KEY_POOL.length)), [currentMaqamScaleLength]);
  const buildMappings = React.useCallback((keys, octaveSlot) => keys.map((k, i) => {
    const idx = (octaveSlot * currentMaqamScaleLength) + i;
    const freq = maqamNotes[idx];
    return { key: k, freq, name: freq ? frequencyToNoteName(freq) : '', index: idx };
  }), [maqamNotes, currentMaqamScaleLength]);
  const upMappings = React.useMemo(() => buildMappings(octaveUpKeys, 2), [octaveUpKeys, buildMappings]);
  const baseMappings = React.useMemo(() => buildMappings(baseOctaveKeys, 1), [baseOctaveKeys, buildMappings]);
  const downMappings = React.useMemo(() => buildMappings(octaveDownKeys, 0), [octaveDownKeys, buildMappings]);

  // Keep track of currently pressed keys to handle sustained notes
  const activeNotes = useRef(new Map()); // Map: key -> frequency

  // --- Maqam Calculation Logic ---
  const calculateMaqamFrequencies = useCallback((maqamName, rootFrequency = ROOT_FREQUENCY) => {
    const ratio = tMaqamsIntervals[maqamName];

    if (!ratio) {
      console.warn(`Maqam "${maqamName}" not found in intervals dictionary.`);
      return [];
    }

    const maqamFrequencies = [rootFrequency];
    let currentFreq = rootFrequency;

    for (let i = 0; i < ratio.length; i++) {
      currentFreq *= Math.pow(2, (ratio[i] / MICROTONAL_SIZE));
      maqamFrequencies.push(currentFreq);
    }

    const fullMaqamScale = [];
    const minOctave = -1; // Go one octave down from root
    const maxOctave = 2; // Go two octaves up from root

    for (let oct = minOctave; oct <= maxOctave; oct++) {
      maqamFrequencies.forEach(freq => {
        fullMaqamScale.push(freq * Math.pow(2, oct));
      });
    }

    fullMaqamScale.sort((a, b) => a - b);
    return fullMaqamScale;

  }, []);

  // --- Initialize Synth and Effects ---
  useEffect(() => {
    if (!synth.current) {
      // Create master gain node
      gainNode.current = new Tone.Gain(0.5);

      // Create effects
      delayEffect.current = new Tone.FeedbackDelay("8n", delayFeedback).set({ wet: 0 });
      reverbEffect.current = new Tone.Reverb({ decay: 1.5, wet: 0.05 }).set({ wet: 0 });
      filterEffect.current = new Tone.Filter(2000, "lowpass");
      distortionEffect.current = new Tone.Distortion(0).set({ wet: 0 });
      chorusEffect.current = new Tone.Chorus(4, 2.5, 0.5).set({ wet: 0 });
      limiter.current = new Tone.Limiter(-6); // -6 dB threshold, prevents clipping

      // Chain: Synth -> Distortion -> Filter -> Chorus -> Delay -> Reverb -> Limiter -> Gain -> Destination
      synth.current = new Tone.PolySynth(Tone.FMSynth, {
        oscillator: { type: oscillatorType },
        envelope: { attack, decay, sustain, release },
        modulation: { type: modOscillatorType },
        modulationEnvelope: { 
          attack: modAttack, 
          decay: modDecay, 
          sustain: modSustain, 
          release: modRelease 
        },
        modulationIndex: modulationIndex,
        harmonicity: harmonicity
      }).chain(distortionEffect.current, filterEffect.current, chorusEffect.current, delayEffect.current, reverbEffect.current, limiter.current, gainNode.current, Tone.Destination);

      // Start Tone.js context on first user interaction
      const startAudio = () => {
        if (Tone.context.state !== 'running') {
          Tone.start();
          console.log('Audio context started.');
        }
        document.removeEventListener('keydown', startAudio);
        document.removeEventListener('click', startAudio);
        document.removeEventListener('touchstart', startAudio);
      };
      document.addEventListener('keydown', startAudio);
      document.addEventListener('click', startAudio);
      document.addEventListener('touchstart', startAudio, { passive: true });
    }
  }, []); // Empty dependency array: runs only once on mount

  // --- Update Maqam Notes ---
  useEffect(() => {
    const newRootFrequency = ROOT_FREQUENCY * Math.pow(2, rootNoteOffset);
    const newNotes = calculateMaqamFrequencies(currentMaqam, newRootFrequency);
    setMaqamNotes(newNotes);
    console.log(`Maqam: ${currentMaqam}, Root Freq: ${newRootFrequency}, Notes:`, newNotes.map(n => n.toFixed(2)));
  }, [currentMaqam, rootNoteOffset, calculateMaqamFrequencies]);

  // --- Update Synth Parameters (ADSR, Oscillator Type) ---
  useEffect(() => {
    if (synth.current) {
      synth.current.set({
        oscillator: { type: oscillatorType },
        envelope: { attack, decay, sustain, release },
        modulation: { type: modOscillatorType },
        modulationEnvelope: { 
          attack: modAttack, 
          decay: modDecay, 
          sustain: modSustain, 
          release: modRelease 
        },
        modulationIndex: modulationIndex,
        harmonicity: harmonicity
      });
    }
  }, [
    oscillatorType, attack, decay, sustain, release,
    modOscillatorType, modAttack, modDecay, modSustain, modRelease,
    modulationIndex, harmonicity
  ]);

  // --- Update Effects Parameters ---
  useEffect(() => {
    if (delayEffect.current) {
      delayEffect.current.delayTime.value = "8n"; // Fixed time for now
      delayEffect.current.feedback.value = delayFeedback;
      delayEffect.current.wet.value = delayAmount;
    }
    if (reverbEffect.current) {
      reverbEffect.current.wet.value = reverbAmount;
    }
    if (filterEffect.current) {
      filterEffect.current.frequency.value = filterCutoff;
      filterEffect.current.Q.value = filterResonance;
    }
    if (distortionEffect.current) {
      distortionEffect.current.distortion = distortionAmount;
      distortionEffect.current.wet.value = distortionAmount > 0 ? 1 : 0; // Simple wet/dry mix logic or always 1 if amount > 0
    }
    if (chorusEffect.current) {
      chorusEffect.current.depth = chorusDepth;
      chorusEffect.current.wet.value = chorusDepth > 0 ? 0.5 : 0; // Default wet to 0.5 if depth is added
    }
  }, [delayAmount, delayFeedback, reverbAmount, filterCutoff, filterResonance, distortionAmount, chorusDepth]);

  // --- Play/Release Notes ---
  const triggerAttack = useCallback((frequency, key) => {
    if (synth.current && !activeNotes.current.has(key)) {
      synth.current.triggerAttack(frequency);
      activeNotes.current.set(key, frequency);
      setActiveFreqs(prev => {
        const s = new Set(prev);
        s.add(frequency);
        return s;
      });
    }
  }, []);

  const triggerRelease = useCallback((key) => {
    if (synth.current && activeNotes.current.has(key)) {
      const frequency = activeNotes.current.get(key);
      synth.current.triggerRelease(frequency);
      activeNotes.current.delete(key);
      setActiveFreqs(prev => {
        const s = new Set(prev);
        s.delete(frequency);
        return s;
      });
    }
  }, []);

  // --- Keyboard Event Listeners ---
  useEffect(() => {
    const baseOctaveKeysLocal = baseOctaveKeys;
    const octaveDownKeysLocal = octaveDownKeys;
    const octaveUpKeysLocal = octaveUpKeys;

    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      // Only process keys if they are part of our synth mapping
      if (![...baseOctaveKeysLocal, ...octaveDownKeysLocal, ...octaveUpKeysLocal].includes(key)) {
        return;
      }
      e.preventDefault(); // Prevent default browser actions for synth keys

      let baseKeyIndex = -1;
      let octaveSlot = -1; // -1 for octave down keys, 0 for base keys, 1 for octave up keys (relative to fullMaqamScale generation)

      if (baseOctaveKeysLocal.includes(key)) {
        baseKeyIndex = baseOctaveKeysLocal.indexOf(key);
        octaveSlot = 1; // Corresponds to the *second* octave generated in fullMaqamScale (index 1)
      } else if (octaveDownKeysLocal.includes(key)) {
        baseKeyIndex = octaveDownKeysLocal.indexOf(key);
        octaveSlot = 0; // Corresponds to the *first* octave generated in fullMaqamScale (index 0)
      } else if (octaveUpKeysLocal.includes(key)) {
        baseKeyIndex = octaveUpKeysLocal.indexOf(key);
        octaveSlot = 2; // Corresponds to the *third* octave generated in fullMaqamScale (index 2)
      }

      if (baseKeyIndex !== -1 && maqamNotes.length > 0) {
        const absoluteNoteIndex = (octaveSlot * currentMaqamScaleLength) + baseKeyIndex;

        if (absoluteNoteIndex >= 0 && absoluteNoteIndex < maqamNotes.length) {
          triggerAttack(maqamNotes[absoluteNoteIndex], key);
        } else {
          console.warn(`Key "${key}" maps to an out-of-bounds note index: ${absoluteNoteIndex}. Maqam notes length: ${maqamNotes.length}. Current Maqam Scale Length: ${currentMaqamScaleLength}`);
        }
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      // Only process keys if they are part of our synth mapping
      if (![...baseOctaveKeys, ...octaveDownKeys, ...octaveUpKeys].includes(key)) {
        return;
      }
      e.preventDefault(); // Prevent default browser actions
      triggerRelease(key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      activeNotes.current.clear();
      setActiveFreqs(new Set());
    };
  }, [maqamNotes, currentMaqam, triggerAttack, triggerRelease, currentMaqamScaleLength, baseOctaveKeys, octaveDownKeys, octaveUpKeys]);

  return (
    <div className="maqam-synth-container">
      <h1>Turkish Maqam Synthesizer</h1>
      <SynthControls
        rootNoteOffset={rootNoteOffset}
        setRootNoteOffset={setRootNoteOffset}
        oscillatorType={oscillatorType}
        setOscillatorType={setOscillatorType}
        attack={attack} setAttack={setAttack}
        decay={decay} setDecay={setDecay}
        sustain={sustain} setSustain={setSustain}
        release={release} setRelease={setRelease}
        // Modulation props
        modOscillatorType={modOscillatorType} setModOscillatorType={setModOscillatorType}
        modAttack={modAttack} setModAttack={setModAttack}
        modDecay={modDecay} setModDecay={setModDecay}
        modSustain={modSustain} setModSustain={setModSustain}
        modRelease={modRelease} setModRelease={setModRelease}
        modulationIndex={modulationIndex} setModulationIndex={setModulationIndex}
        harmonicity={harmonicity} setHarmonicity={setHarmonicity}
        // Effects props
        delayAmount={delayAmount} setDelayAmount={setDelayAmount}
        delayFeedback={delayFeedback} setDelayFeedback={setDelayFeedback}
        reverbAmount={reverbAmount} setReverbAmount={setReverbAmount}
        filterCutoff={filterCutoff} setFilterCutoff={setFilterCutoff}
        filterResonance={filterResonance} setFilterResonance={setFilterResonance}
        distortionAmount={distortionAmount} setDistortionAmount={setDistortionAmount}
        chorusDepth={chorusDepth} setChorusDepth={setChorusDepth}
      />
      <MaqamNoteDisplay 
        upMappings={upMappings}
        baseMappings={baseMappings}
        downMappings={downMappings}
        activeFreqs={activeFreqs}
        onNoteDown={triggerAttack}
        onNoteUp={triggerRelease}
        // Maqam Selection Props
        currentMaqam={currentMaqam}
        setCurrentMaqam={setCurrentMaqam}
        tMaqamsIntervals={tMaqamsIntervals}
      />
    </div>
  );
};

export default MaqamSynth;
