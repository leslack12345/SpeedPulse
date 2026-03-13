import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * WhackAMole — Click the moles before they disappear. 30-second rounds.
 */
export default function WhackAMole() {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [moles, setMoles] = useState(Array(9).fill(false));
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const timerRef = useRef(null);
  const moleTimerRef = useRef(null);

  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(30);
    setGameOver(false);
    setStarted(true);
    setMoles(Array(9).fill(false));
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!started || gameOver) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameOver(true);
          setStarted(false);
          clearInterval(timerRef.current);
          clearInterval(moleTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [started, gameOver]);

  // Pop up moles randomly
  useEffect(() => {
    if (!started || gameOver) return;
    moleTimerRef.current = setInterval(() => {
      setMoles(prev => {
        const next = Array(9).fill(false);
        // Show 1-2 moles
        const count = Math.random() > 0.6 ? 2 : 1;
        for (let i = 0; i < count; i++) {
          next[Math.floor(Math.random() * 9)] = true;
        }
        return next;
      });
    }, 800);
    return () => clearInterval(moleTimerRef.current);
  }, [started, gameOver]);

  function whack(i) {
    if (!started || !moles[i]) return;
    setScore(prev => prev + 1);
    setMoles(prev => { const n = [...prev]; n[i] = false; return n; });
  }

  return (
    <div>
      <div className="game-hud">
        Score: {score} | Time: {timeLeft}s
      </div>
      <div className="mole-grid">
        {moles.map((active, i) => (
          <div
            key={i}
            className={`mole-hole ${active ? 'mole-up' : ''}`}
            onClick={() => whack(i)}
          >
            {active && <div className="mole" />}
          </div>
        ))}
      </div>
      {!started && !gameOver && (
        <div className="game-overlay-msg">
          <button className="game-start-btn" onClick={startGame}>Start Whacking!</button>
        </div>
      )}
      {gameOver && (
        <div className="game-overlay-msg">
          <div style={{ color: '#eab308', fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>
            Final Score: {score}
          </div>
          <button className="game-start-btn" onClick={startGame}>Play Again</button>
        </div>
      )}
    </div>
  );
}
