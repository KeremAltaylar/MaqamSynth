import React from 'react';

/**
 * One register of the maqam. Touch is handled explicitly and the synthetic
 * mouse events that follow a tap are suppressed, otherwise a phone triggers
 * every note twice.
 */
const OctaveRow = ({
  label,
  tone,
  mappings = [],
  activeFreqs = new Set(),
  onNoteDown = () => {},
  onNoteUp = () => {},
}) => (
  <div className="octave-row" style={{ '--row-tone': tone }}>
    <span className="octave-tag">{label}</span>
    <div className="note-row">
      {mappings
        .filter((m) => m && m.freq)
        .map(({ freq, name, key }, idx) => (
          <span
            key={idx}
            className={`note-key ${activeFreqs.has(freq) ? 'active' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault();
              onNoteDown(freq, key);
            }}
            onMouseUp={() => onNoteUp(key)}
            onMouseLeave={() => onNoteUp(key)}
            onTouchStart={(e) => {
              e.preventDefault();
              onNoteDown(freq, key);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              onNoteUp(key);
            }}
            onTouchCancel={() => onNoteUp(key)}
          >
            <span className="n">{name}</span>
            {key && <span className="k">{key}</span>}
          </span>
        ))}
    </div>
  </div>
);

const MaqamNoteDisplay = ({
  upMappings = [],
  baseMappings = [],
  downMappings = [],
  activeFreqs = new Set(),
  onNoteDown = () => {},
  onNoteUp = () => {},
}) => (
  <>
    <OctaveRow
      label="8va"
      tone="var(--m-cool)"
      mappings={upMappings}
      activeFreqs={activeFreqs}
      onNoteDown={onNoteDown}
      onNoteUp={onNoteUp}
    />
    <OctaveRow
      label="base"
      tone="var(--m-warm)"
      mappings={baseMappings}
      activeFreqs={activeFreqs}
      onNoteDown={onNoteDown}
      onNoteUp={onNoteUp}
    />
    <OctaveRow
      label="8vb"
      tone="var(--m-clay)"
      mappings={downMappings}
      activeFreqs={activeFreqs}
      onNoteDown={onNoteDown}
      onNoteUp={onNoteUp}
    />
    <p className="dock-hint">Tap the keys, or play the matching letters on a physical keyboard</p>
  </>
);

export default MaqamNoteDisplay;
