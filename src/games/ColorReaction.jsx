import { useState, useRef, useCallback } from 'react';

/**
 * ColorReaction — Test your reaction time. Wait for green, click as fast as you can.
 */
export default function ColorReaction() {
  const [phase, setPhase] = useState('idle'); // idle, waiting, ready, result
  const [time, setTime] = useState(null);
  const [best, setBest] = useState(null);
  const [times, setTimes] = useState([]);
  const startRef = useRef(null);
  const timeoutRef = useRef(null);

  const start = useCallback(() => {
    setPhase('waiting');
    setTime(null);
    const delay = 1500 + Math.random() * 3000;
    timeoutRef.current = setTimeout(() => {
      startRef.current = performance.now();
      setPhase('ready');
    }, delay);
  }, []);

  function handleClick() {
    if (phase === 'idle' || phase === 'result') {
      start();
      return;
    }
    if (phase === 'waiting') {
      // Clicked too early
      clearTimeout(timeoutRef.current);
      setPhase('idle');
      setTime('Too early!');
      return;
    }
    if (phase === 'ready') {
      const reaction = Math.round(performance.now() - startRef.current);
      setTime(reaction);
      setPhase('result');
      const newTimes = [...times, reaction];
      setTimes(newTimes);
      if (!best || reaction < best) setBest(reaction);
    }
  }

  const avg = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;

  const bgColor = {
    idle: '#1a1a28',
    waiting: '#7f1d1d',
    ready: '#14532d',
    result: '#1a1a28',
  }[phase];

  const message = {
    idle: time === 'Too early!' ? 'Too early! Click to try again' : 'Click to start',
    waiting: 'Wait for green...',
    ready: 'CLICK NOW!',
    result: `${time}ms — Click to go again`,
  }[phase];

  return (
    <div>
      <div className="game-hud">
        Best: {best ? `${best}ms` : '—'} | Avg: {avg ? `${avg}ms` : '—'}
      </div>
      <div
        className="reaction-box"
        onClick={handleClick}
        style={{ background: bgColor }}
      >
        <span className="reaction-text">{message}</span>
      </div>
    </div>
  );
}
