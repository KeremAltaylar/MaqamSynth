import React, { useEffect, useRef } from 'react';
import Nexus from 'nexusui';

const NexusDial = ({ value, min, max, step = 0, onChange, size = [60, 60] }) => {
  const containerRef = useRef(null);
  const dialRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      // Clear container just in case
      containerRef.current.innerHTML = '';
      
      const dial = new Nexus.Dial(containerRef.current, {
        'size': size,
        'interaction': 'vertical',
        'mode': 'relative',
        'min': min,
        'max': max,
        'step': step,
        'value': value
      });

      // Pastel Theme Colors
      const accentColor = "#FFB7B2"; // Pastel Red/Pink
      const fillColor = "#E0F2F1";   // Very Light Teal (Panel contrast)
      const mediumColor = "#4A4063"; // Dark Violet (Lines)

      dial.colorize("accent", accentColor);
      dial.colorize("fill", fillColor);
      dial.colorize("medium", mediumColor);

      dial.on('change', (v) => {
        onChange(v);
      });

      dialRef.current = dial;

      return () => {
        if (dialRef.current) {
          dialRef.current.destroy();
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to initialize once

  // Update dial when prop value changes (if change didn't originate from dial)
  useEffect(() => {
    if (dialRef.current && dialRef.current.value !== value) {
      // Check if difference is significant to avoid loops
      if (Math.abs(dialRef.current.value - value) > (step || 0.001)) {
        dialRef.current.value = value;
      }
    }
  }, [value, step]);

  return <div ref={containerRef} style={{ display: 'inline-block' }} />;
};

export default NexusDial;
