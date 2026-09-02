import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Tone from 'tone';
import SynthControls from './SynthControls';
import MaqamNoteDisplay from './MaqamNoteDisplay';
import Scope from './Scope';
import StepSequencer from './StepSequencer';
import { createSaturator } from '../audio/saturator';
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
  const filterEffect = useRef(null);
  const crusherEffect = useRef(null);
  const driveEffect = useRef(null);
  const chorusEffect = useRef(null);
  const phaserEffect = useRef(null);
  const tremoloEffect = useRef(null);
  const delayEffect = useRef(null);
  const reverbEffect = useRef(null);
  const limiter = useRef(null); // Add a limiter to prevent clipping
  const saturator = useRef(null);
  /* The second voice: its own synth and its own Tone.Sequence, fed through the
     same effect chain so both voices share the room. */
  const seqSynth = useRef(null);
  const seqGain = useRef(null);
  const sequence = useRef(null);
  const waveAnalyser = useRef(null);
  const fftAnalyser = useRef(null);

  // --- State for Synth Parameters ---
  const [oscillatorType, setOscillatorType] = useState('sine');
  const [attack, setAttack] = useState(0.01); // Default attack
  const [decay, setDecay] = useState(0.2);   // Default decay
  const [sustain, setSustain] = useState(0.5); // Default sustain
  const [release, setRelease] = useState(1.0);  // Default release

  // --- State for Effects ---
  const [filterType, setFilterType] = useState('lowpass');
  const [filterFreq, setFilterFreq] = useState(12000);
  const [filterQ, setFilterQ] = useState(1);
  const [crushAmount, setCrushAmount] = useState(0);
  const [driveAmount, setDriveAmount] = useState(0);
  const [chorusAmount, setChorusAmount] = useState(0);
  const [phaserAmount, setPhaserAmount] = useState(0);
  const [tremoloAmount, setTremoloAmount] = useState(0);
  const [tremoloRate, setTremoloRate] = useState(6);
  const [delayAmount, setDelayAmount] = useState(0);
  const [delayFeedback, setDelayFeedback] = useState(0.5); // New: Delay Feedback
  const [delayTime, setDelayTime] = useState(0.25);
  const [reverbAmount, setReverbAmount] = useState(0);
  const [reverbDecay, setReverbDecay] = useState(1.5);

  // --- Maqam related states ---
  const [currentMaqam, setCurrentMaqam] = useState('Rast');
  const [maqamNotes, setMaqamNotes] = useState([]);
  const [rootNoteOffset, setRootNoteOffset] = useState(0);
  const currentMaqamScaleLength = (tMaqamsIntervals[currentMaqam]?.length || 0) + 1;
  const [activeFreqs, setActiveFreqs] = useState(new Set());
  /* Open by default where there is room for it, closed on a phone so the
     controls are the first thing you see. */
  /* ---- Second voice ----
     Steps hold a degree index into the current maqam, or -1 for a rest, so a
     pattern survives a change of maqam and is reinterpreted in the new tuning
     rather than being wrong in the old one. */
  const SEQ_STEPS = 16;
  const [seqPattern, setSeqPattern] = useState(() => new Array(SEQ_STEPS).fill(-1));
  const [seqRunning, setSeqRunning] = useState(false);
  const [seqBpm, setSeqBpm] = useState(96);
  const [seqDivision, setSeqDivision] = useState(2);
  const [seqGate, setSeqGate] = useState(0.5);
  const [seqLevel, setSeqLevel] = useState(0.5);
  const [seqOctave, setSeqOctave] = useState(-1);
  const [seqWave, setSeqWave] = useState('triangle');
  const [seqStep, setSeqStep] = useState(-1);
  const [satLow, setSatLow] = useState(0);
  const [satHigh, setSatHigh] = useState(0);
  const [clipped, setClipped] = useState(false);

  const [keyboardOpen, setKeyboardOpen] = useState(() => window.innerWidth > 640);
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

      /* Effects are ordered the way they would be patched on a desk: shape the
         tone first, then colour it, then move it, and only then put it in a
         room. Everything starts fully dry so the instrument opens up clean. */
      filterEffect.current = new Tone.Filter({ type: 'lowpass', frequency: 12000, Q: 1 });
      crusherEffect.current = new Tone.BitCrusher(4).set({ wet: 0 });
      driveEffect.current = new Tone.Distortion(0.6).set({ wet: 0 });
      chorusEffect.current = new Tone.Chorus(1.8, 3.5, 0.7).set({ wet: 0 }).start();
      phaserEffect.current = new Tone.Phaser({ frequency: 0.4, octaves: 3, baseFrequency: 400 }).set({ wet: 0 });
      tremoloEffect.current = new Tone.Tremolo(6, 0.9).set({ wet: 0 }).start();
      delayEffect.current = new Tone.FeedbackDelay(0.25, delayFeedback).set({ wet: 0 });
      reverbEffect.current = new Tone.Reverb({ decay: 1.5, wet: 0.05 }).set({ wet: 0 });
      limiter.current = new Tone.Limiter(-6); // -6 dB threshold, prevents clipping

      waveAnalyser.current = new Tone.Analyser('waveform', 1024);
      // Analyser sizes must be powers of two — the Web Audio node rejects anything else.
      fftAnalyser.current = new Tone.Analyser('fft', 128);

      /* Two-band saturator just before the master, so it colours everything
         both voices play and still sits inside the limiter's reach. */
      saturator.current = createSaturator({ lowCross: 180, highCross: 3200 });

      synth.current = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: oscillatorType },
        envelope: { attack, decay, sustain, release }, // Use state variables
      }).chain(
        filterEffect.current,
        crusherEffect.current,
        driveEffect.current,
        chorusEffect.current,
        phaserEffect.current,
        tremoloEffect.current,
        delayEffect.current,
        reverbEffect.current,
        saturator.current.input
      );
      saturator.current.output.chain(limiter.current, gainNode.current, Tone.Destination);

      /* The second voice is monophonic and deliberately plainer than the
         keyboard voice: it holds a line under what you play rather than
         competing with it. It joins the chain at the head, so both voices
         share the filter, colour, motion and space settings. */
      seqGain.current = new Tone.Gain(0.5);
      seqSynth.current = new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.25, release: 0.3 },
      }).connect(seqGain.current);
      seqGain.current.connect(filterEffect.current);

      gainNode.current.connect(waveAnalyser.current);
      gainNode.current.connect(fftAnalyser.current);

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
      });
    }
  }, [oscillatorType, attack, decay, sustain, release]);

  // --- Update Filter ---
  useEffect(() => {
    if (!filterEffect.current) return;
    filterEffect.current.type = filterType;
    filterEffect.current.frequency.value = filterFreq;
    filterEffect.current.Q.value = filterQ;
  }, [filterType, filterFreq, filterQ]);

  // --- Update Colour (crush / drive / chorus) ---
  useEffect(() => {
    if (crusherEffect.current) crusherEffect.current.wet.value = crushAmount;
    if (driveEffect.current) driveEffect.current.wet.value = driveAmount;
    if (chorusEffect.current) chorusEffect.current.wet.value = chorusAmount;
  }, [crushAmount, driveAmount, chorusAmount]);

  // --- Update Motion (phaser / tremolo) ---
  useEffect(() => {
    if (phaserEffect.current) phaserEffect.current.wet.value = phaserAmount;
    if (tremoloEffect.current) {
      tremoloEffect.current.wet.value = tremoloAmount;
      tremoloEffect.current.frequency.value = tremoloRate;
    }
  }, [phaserAmount, tremoloAmount, tremoloRate]);

  // --- Update Delay Effect ---
  useEffect(() => {
    if (delayEffect.current) {
      delayEffect.current.wet.value = delayAmount;
      delayEffect.current.feedback.value = delayFeedback;
      delayEffect.current.delayTime.value = delayTime;
    }
  }, [delayAmount, delayFeedback, delayTime]);

  // --- Update Reverb Effect ---
  useEffect(() => {
    if (reverbEffect.current) {
      reverbEffect.current.wet.value = reverbAmount;
      /* Regenerating the impulse response is async; the node keeps playing the
         previous one until the new one is ready. */
      reverbEffect.current.decay = reverbDecay;
    }
  }, [reverbAmount, reverbDecay]);

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

  /* ---- Second voice sequencing ----
     Tone's Transport is already a lookahead scheduler against the audio clock,
     so the sequence is sample-accurate without hand-rolling one. Rates are
     divisions of the bar rather than free numbers, which is what keeps the
     delay and the tremolo locked to the pattern when the tempo moves. */
  const SEQ_DIVISIONS = React.useMemo(() => ([
    { label: '1/4', time: '4n' },
    { label: '1/8', time: '8n' },
    { label: '1/16', time: '16n' },
    { label: '1/8T', time: '8t' },
    { label: '1/16T', time: '16t' },
  ]), []);

  useEffect(() => {
    Tone.Transport.bpm.rampTo(seqBpm, 0.05);
  }, [seqBpm]);

  /* Delay time and tremolo rate follow the tempo. A delay set by hand drifts
     against the pattern the moment the tempo changes. */
  useEffect(() => {
    const beat = 60 / seqBpm;
    if (delayEffect.current) delayEffect.current.delayTime.rampTo(beat / 2, 0.05);
    if (tremoloEffect.current) tremoloEffect.current.frequency.rampTo(1 / beat, 0.05);
  }, [seqBpm]);

  useEffect(() => {
    if (seqSynth.current) seqSynth.current.oscillator.type = seqWave;
  }, [seqWave]);

  useEffect(() => {
    if (seqGain.current) seqGain.current.gain.rampTo(seqLevel, 0.03);
  }, [seqLevel]);

  /* The sequence is rebuilt when anything it reads changes. Tone.Sequence
     schedules ahead, so the callback receives the exact time to play at — the
     React state update for the playhead is deliberately pushed out with
     Tone.Draw so the UI follows the audio rather than leading it. */
  useEffect(() => {
    if (sequence.current) {
      sequence.current.stop();
      sequence.current.dispose();
      sequence.current = null;
    }
    const indices = Array.from({ length: SEQ_STEPS }, (_, i) => i);
    sequence.current = new Tone.Sequence(
      (time, i) => {
        const degree = seqPattern[i];
        if (degree >= 0 && seqSynth.current) {
          const freq = maqamNotes[degree];
          if (freq) {
            const shifted = freq * Math.pow(2, seqOctave);
            const stepSeconds = Tone.Time(SEQ_DIVISIONS[seqDivision].time).toSeconds();
            seqSynth.current.triggerAttackRelease(shifted, stepSeconds * seqGate, time);
          }
        }
        Tone.Draw.schedule(() => setSeqStep(i), time);
      },
      indices,
      SEQ_DIVISIONS[seqDivision].time
    );
    if (seqRunning) sequence.current.start(0);
    return () => {
      if (sequence.current) {
        sequence.current.stop();
        sequence.current.dispose();
        sequence.current = null;
      }
    };
  }, [seqPattern, seqDivision, seqGate, seqOctave, seqRunning, maqamNotes, SEQ_DIVISIONS]);

  const toggleSequencer = useCallback(async () => {
    if (Tone.context.state !== 'running') await Tone.start();
    if (seqRunning) {
      Tone.Transport.stop();
      setSeqRunning(false);
      setSeqStep(-1);
    } else {
      Tone.Transport.start();
      setSeqRunning(true);
    }
  }, [seqRunning]);

  /* One degree per step: clicking the cell that is already set clears it, so a
     step holds a single pitch and the grid cannot end up ambiguous. */
  const toggleSeqCell = useCallback((step, degree) => {
    setSeqPattern((prev) => {
      const next = prev.slice();
      next[step] = next[step] === degree ? -1 : degree;
      return next;
    });
  }, []);

  const clearSequence = useCallback(() => setSeqPattern(new Array(SEQ_STEPS).fill(-1)), []);

  /* Weighted rather than uniform: rests are common, downbeats are likelier to
     sound, and low degrees are favoured so the line sits under the keyboard
     voice instead of fighting it. */
  const randomSequence = useCallback(() => {
    const span = Math.max(1, Math.min(maqamNotes.length, currentMaqamScaleLength));
    setSeqPattern(Array.from({ length: SEQ_STEPS }, (_, i) => {
      const strength = i % 4 === 0 ? 0.8 : i % 2 === 0 ? 0.45 : 0.25;
      if (Math.random() > strength) return -1;
      const bias = Math.pow(Math.random(), 1.6);
      return Math.floor(bias * span);
    }));
  }, [maqamNotes.length, currentMaqamScaleLength]);

  /* Clip watch on the master: read the analyser rather than guess from faders. */
  useEffect(() => {
    let raf;
    const tick = () => {
      const buf = waveAnalyser.current && waveAnalyser.current.getValue();
      if (buf) {
        let peak = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = Math.abs(buf[i]);
          if (v > peak) peak = v;
        }
        setClipped((was) => (peak >= 0.99 ? true : was && peak > 0.9));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (saturator.current) saturator.current.setLow(satLow);
  }, [satLow]);
  useEffect(() => {
    if (saturator.current) saturator.current.setHigh(satHigh);
  }, [satHigh]);

  return (
    <div className={`synth-app ${keyboardOpen ? 'dock-open' : ''}`}>
      <header className="synth-bar">
        <div className="brand">
          <span className="brand-mark">53-TET</span>
          {/* The `long` spans drop away on narrow screens, leaving "Maqam Synth". */}
          <h1><span className="long">Turkish </span>Maqam Synth<span className="long">esizer</span></h1>
        </div>
        {clipped && <span className="clip-lamp">Clip</span>}
        <button
          type="button"
          className="kbd-toggle"
          aria-expanded={keyboardOpen}
          onClick={() => setKeyboardOpen((open) => !open)}
        >
          {keyboardOpen ? 'Hide keys' : 'Play keys'}
        </button>
      </header>

      <main className="synth-body">
        <Scope waveform={waveAnalyser} fft={fftAnalyser} />

        <SynthControls
          currentMaqam={currentMaqam}
          setCurrentMaqam={setCurrentMaqam}
          tMaqamsIntervals={tMaqamsIntervals}
          rootNoteOffset={rootNoteOffset}
          setRootNoteOffset={setRootNoteOffset}
          oscillatorType={oscillatorType}
          setOscillatorType={setOscillatorType}
          attack={attack}
          setAttack={setAttack}
          decay={decay}
          setDecay={setDecay}
          sustain={sustain}
          setSustain={setSustain}
          release={release}
          setRelease={setRelease}
          filterType={filterType}
          setFilterType={setFilterType}
          filterFreq={filterFreq}
          setFilterFreq={setFilterFreq}
          filterQ={filterQ}
          setFilterQ={setFilterQ}
          crushAmount={crushAmount}
          setCrushAmount={setCrushAmount}
          driveAmount={driveAmount}
          setDriveAmount={setDriveAmount}
          satLow={satLow}
          setSatLow={setSatLow}
          satHigh={satHigh}
          setSatHigh={setSatHigh}
          chorusAmount={chorusAmount}
          setChorusAmount={setChorusAmount}
          phaserAmount={phaserAmount}
          setPhaserAmount={setPhaserAmount}
          tremoloAmount={tremoloAmount}
          setTremoloAmount={setTremoloAmount}
          tremoloRate={tremoloRate}
          setTremoloRate={setTremoloRate}
          delayAmount={delayAmount}
          setDelayAmount={setDelayAmount}
          delayFeedback={delayFeedback}
          setDelayFeedback={setDelayFeedback}
          delayTime={delayTime}
          setDelayTime={setDelayTime}
          reverbAmount={reverbAmount}
          setReverbAmount={setReverbAmount}
          reverbDecay={reverbDecay}
          setReverbDecay={setReverbDecay}
        />
        <StepSequencer
          steps={SEQ_STEPS}
          degrees={maqamNotes.slice(0, currentMaqamScaleLength).map((f, i) => ({
            index: i,
            name: f ? frequencyToNoteName(f) : String(i + 1),
          }))}
          pattern={seqPattern}
          playhead={seqRunning ? seqStep : -1}
          onToggle={toggleSeqCell}
          running={seqRunning}
          onRun={toggleSequencer}
          bpm={seqBpm}
          setBpm={setSeqBpm}
          division={seqDivision}
          setDivision={setSeqDivision}
          DIVISIONS={SEQ_DIVISIONS}
          gate={seqGate}
          setGate={setSeqGate}
          level={seqLevel}
          setLevel={setSeqLevel}
          octave={seqOctave}
          setOctave={setSeqOctave}
          wave={seqWave}
          setWave={setSeqWave}
          onClear={clearSequence}
          onRandom={randomSequence}
        />
      </main>

      <div className={`keyboard-dock ${keyboardOpen ? 'open' : ''}`} aria-hidden={!keyboardOpen}>
        <MaqamNoteDisplay
          upMappings={upMappings}
          baseMappings={baseMappings}
          downMappings={downMappings}
          activeFreqs={activeFreqs}
          onNoteDown={(freq, key) => triggerAttack(freq, key)}
          onNoteUp={(key) => triggerRelease(key)}
        />
      </div>
    </div>
  );
};

export default MaqamSynth;