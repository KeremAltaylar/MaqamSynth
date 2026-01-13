import React from 'react';

const KeyboardInfo = ({ upMappings = [], baseMappings = [], downMappings = [], activeKeysSet = new Set() }) => {
  return (
    <div className="keyboard-info">
      <p>
        Octave Up: {upMappings.map(({ key, name }) => (
          <kbd key={`u-${key}`} className={activeKeysSet.has(key) ? 'active' : ''}>{key} {name && `(${name})`}</kbd>
        ))}
      </p>
      <p>
        Base Octave: {baseMappings.map(({ key, name }) => (
          <kbd key={`b-${key}`} className={activeKeysSet.has(key) ? 'active' : ''}>{key} {name && `(${name})`}</kbd>
        ))}
      </p>
      <p>
        Octave Down: {downMappings.map(({ key, name }) => (
          <kbd key={`d-${key}`} className={activeKeysSet.has(key) ? 'active' : ''}>{key} {name && `(${name})`}</kbd>
        ))}
      </p>
    </div>
  );
};

export default KeyboardInfo;
