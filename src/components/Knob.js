import React, { useRef } from 'react';

/**
 * Rotary control.
 *
 * Knobs are what make a control surface read as an instrument rather than a
 * settings form, but a knob that only answers to the mouse is a downgrade from
 * the range input it replaces. So this is a real slider: role="slider" with
 * live aria values, arrow keys to nudge, Home/End for the extremes, and Shift
 * for fine adjustment on both pointer and keyboard.
 */

/** Degrees of travel, from 7 o'clock round to 5 o'clock. */
const SWEEP = 270;
/** Circumference of the r=18 arc, so the dash can express the value. */
const ARC = 2 * Math.PI * 18;
/** Vertical pixels of drag that cover the full range. */
const DRAG_SPAN = 180;

const Knob = ({ id, label, value, min, max, step = 0.01, display, onChange, tone }) => {
  const drag = useRef(null);

  const lo = Number(min);
  const hi = Number(max);
  const stepSize = Number(step);
  const norm = Math.min(1, Math.max(0, (value - lo) / (hi - lo)));
  const angle = -135 + norm * SWEEP;

  const clamp = (v) => Math.min(hi, Math.max(lo, v));
  /* Snap to the step, then round off binary float dust so 0.1 + 0.2 doesn't
     surface as 0.30000000000000004 in the readout. */
  const quantise = (v) => {
    const snapped = Math.round(clamp(v) / stepSize) * stepSize;
    return parseFloat(snapped.toPrecision(12));
  };

  const handlePointerDown = (e) => {
    /* Record the drag before capturing: setPointerCapture throws on an unknown
       pointer id, and losing the handler to that would leave a knob that
       silently does nothing. Capture is an optimisation, not a requirement. */
    drag.current = { y: e.clientY, from: value };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {
      /* no capture; the move handler still tracks while the pointer is down */
    }
    e.currentTarget.focus();
  };

  const handlePointerMove = (e) => {
    if (!drag.current) return;
    const dy = drag.current.y - e.clientY;
    const travel = (hi - lo) * (dy / DRAG_SPAN) * (e.shiftKey ? 0.1 : 1);
    onChange(quantise(drag.current.from + travel));
  };

  const endDrag = (e) => {
    drag.current = null;
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleKeyDown = (e) => {
    const coarse = (hi - lo) / 10;
    let next = null;
    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowRight':
        next = value + (e.shiftKey ? coarse : stepSize);
        break;
      case 'ArrowDown':
      case 'ArrowLeft':
        next = value - (e.shiftKey ? coarse : stepSize);
        break;
      case 'PageUp':
        next = value + coarse;
        break;
      case 'PageDown':
        next = value - coarse;
        break;
      case 'Home':
        next = lo;
        break;
      case 'End':
        next = hi;
        break;
      default:
        return;
    }
    e.preventDefault();
    onChange(quantise(next));
  };

  return (
    <div className="knob-cell">
      <div
        id={id}
        className="knob"
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={lo}
        aria-valuemax={hi}
        aria-valuenow={value}
        aria-valuetext={display}
        data-tone={tone || undefined}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={handleKeyDown}
      >
        <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
          <circle className="knob-track" cx="24" cy="24" r="18" />
          <circle
            className="knob-arc"
            cx="24"
            cy="24"
            r="18"
            style={{ strokeDasharray: `${(norm * SWEEP * ARC) / 360} ${ARC}` }}
          />
          <line
            className="knob-pointer"
            x1="24"
            y1="9"
            x2="24"
            y2="17"
            style={{ transform: `rotate(${angle}deg)` }}
          />
        </svg>
      </div>
      <span className="knob-label">{label}</span>
      <span className="knob-readout">{display}</span>
    </div>
  );
};

export default Knob;
