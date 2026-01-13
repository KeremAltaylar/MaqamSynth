import React from 'react';

const KeyboardInfo = ({ baseKeys = [], downKeys = [], upKeys = [] }) => {
  return (
    <div className="keyboard-info">
      <p>Base Octave: {baseKeys.map(k => <kbd key={`b-${k}`}>{k}</kbd>)}</p>
      <p>Octave Down: {downKeys.map(k => <kbd key={`d-${k}`}>{k}</kbd>)}</p>
      <p>Octave Up: {upKeys.map(k => <kbd key={`u-${k}`}>{k}</kbd>)}</p>
    </div>
  );
};

export default KeyboardInfo;
