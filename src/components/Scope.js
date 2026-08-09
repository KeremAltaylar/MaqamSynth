import React, { useEffect, useRef } from 'react';

/**
 * Oscilloscope + spectrum drawn from a pair of Tone.Analyser nodes tapped off
 * the master gain. Purely decorative — it never touches the audio graph.
 *
 * The drawing is deliberately layered rather than literal: a mirrored spectrum
 * standing on the floor, the waveform traced twice (a wide soft pass under a
 * thin bright one) so the trace glows without needing a shadow filter, and a
 * slow-moving fundamental line that gives the panel life while nothing plays.
 */
const Scope = ({ waveform, fft }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let raf = 0;
    let t = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const frame = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      t += 0.006;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0f1412';
      ctx.fillRect(0, 0, w, h);

      /* Spectrum: a band of columns rising from the floor, warm at the bottom
         of the range and cool at the top so register is legible at a glance. */
      const bins = fft.current ? fft.current.getValue() : null;
      if (bins) {
        const bw = w / bins.length;
        for (let i = 0; i < bins.length; i += 1) {
          // Analyser returns dB; -100 is the practical floor.
          const level = Math.max(0, (bins[i] + 100) / 100);
          const bh = level * h * 0.62;
          const mix = i / bins.length;
          ctx.fillStyle = `rgba(${Math.round(217 - mix * 90)}, ${Math.round(
            132 + mix * 46
          )}, ${Math.round(90 + mix * 106)}, ${0.18 + level * 0.5})`;
          ctx.fillRect(i * bw, h - bh, bw + 0.5, bh);
        }
      }

      // Horizon.
      ctx.strokeStyle = 'rgba(188, 207, 182, 0.14)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      const wave = waveform.current ? waveform.current.getValue() : null;
      if (wave) {
        const trace = (width, colour) => {
          ctx.beginPath();
          for (let i = 0; i < wave.length; i += 1) {
            const x = (i / (wave.length - 1)) * w;
            const y = h / 2 - wave[i] * h * 0.42;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.lineWidth = width;
          ctx.strokeStyle = colour;
          ctx.stroke();
        };
        trace(5, 'rgba(232, 182, 76, 0.16)');
        trace(1.5, '#e8b64c');
      }

      /* A slow sine drifting across the floor: the panel is never completely
         dead, even before the first note. */
      ctx.beginPath();
      for (let x = 0; x <= w; x += 6) {
        const y = h - 10 - Math.sin(x * 0.012 + t) * 5;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(188, 207, 182, 0.16)';
      ctx.lineWidth = 1;
      ctx.stroke();

      raf = requestAnimationFrame(frame);
    };
    frame();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [waveform, fft]);

  return <div className="scope"><canvas ref={canvasRef} aria-hidden="true" /></div>;
};

export default Scope;
