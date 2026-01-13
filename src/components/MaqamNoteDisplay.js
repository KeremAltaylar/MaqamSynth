import React from 'react';

const Row = ({ mappings = [], activeFreqs = new Set(), onNoteDown = () => {}, onNoteUp = () => {} }) => {
  return (
    <div className="note-grid">
      {mappings
        .filter(m => m && m.freq)
        .map(({ freq, name, key }, idx) => {
          const isActive = activeFreqs.has(freq);
          return (
            <span
              key={idx}
              className={`note-button ${isActive ? 'active' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); onNoteDown(freq, key); }}
              onMouseUp={(e) => { e.preventDefault(); onNoteUp(key); }}
              onTouchStart={(e) => { onNoteDown(freq, key); }}
              onTouchEnd={(e) => { onNoteUp(key); }}
            >
              {name} {key ? `(${key})` : ''}
            </span>
          );
        })}
    </div>
  );
};

const MaqamNoteDisplay = ({ upMappings = [], baseMappings = [], downMappings = [], activeFreqs = new Set(), onNoteDown = () => {}, onNoteUp = () => {} }) => {
  return (
    <div className="note-display-section">
      <h2>Maqam Notes:</h2>
      <Row mappings={upMappings} activeFreqs={activeFreqs} onNoteDown={onNoteDown} onNoteUp={onNoteUp} />
      <Row mappings={baseMappings} activeFreqs={activeFreqs} onNoteDown={onNoteDown} onNoteUp={onNoteUp} />
      <Row mappings={downMappings} activeFreqs={activeFreqs} onNoteDown={onNoteDown} onNoteUp={onNoteUp} />
    </div>
  );
};

export default MaqamNoteDisplay;
