import React from 'react';

const Row = ({ mappings = [], activeFreqs = new Set() }) => {
  return (
    <div className="note-grid">
      {mappings
        .filter(m => m && m.freq)
        .map(({ freq, name, key }, idx) => {
          const isActive = activeFreqs.has(freq);
          return (
            <span key={idx} className={`note-button ${isActive ? 'active' : ''}`}>
              {name} {key ? `(${key})` : ''}
            </span>
          );
        })}
    </div>
  );
};

const MaqamNoteDisplay = ({ upMappings = [], baseMappings = [], downMappings = [], activeFreqs = new Set() }) => {
  return (
    <div className="note-display-section">
      <h2>Maqam Notes:</h2>
      <Row mappings={upMappings} activeFreqs={activeFreqs} />
      <Row mappings={baseMappings} activeFreqs={activeFreqs} />
      <Row mappings={downMappings} activeFreqs={activeFreqs} />
    </div>
  );
};

export default MaqamNoteDisplay;
