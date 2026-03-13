import { useEffect, useRef, useState } from 'react';

/**
 * FlappyDot — Flap through gaps in pipes.
 */
export default function FlappyDot() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = 400;
    const H = canvas.height = 200;

    const state = {
      bird: { x: 80, y: H / 2, vy: 0 },
      pipes: [],
      frame: 0,
      score: 0,
      running: false,
      dead: false,
    };

    const GAP = 60;
    const PIPE_W = 30;
    const GRAVITY = 0.35;
    const FLAP = -5.5;
    const SPEED = 2.5;

    function spawnPipe() {
      const gapY = 40 + Math.random() * (H - 80 - GAP);
      state.pipes.push({ x: W, gapY, scored: false });
    }

    function flap() {
      if (state.dead) {
        state.bird = { x: 80, y: H / 2, vy: 0 };
        state.pipes = [];
        state.frame = 0;
        state.score = 0;
        state.dead = false;
        state.running = true;
        setGameOver(false);
        setScore(0);
        return;
      }
      if (!state.running) state.running = true;
      state.bird.vy = FLAP;
    }

    function update() {
      if (!state.running || state.dead) return;
      state.frame++;

      state.bird.vy += GRAVITY;
      state.bird.y += state.bird.vy;

      if (state.frame % 90 === 0) spawnPipe();

      state.pipes.forEach(p => { p.x -= SPEED; });
      state.pipes = state.pipes.filter(p => p.x > -PIPE_W);

      // Score & collision
      for (const p of state.pipes) {
        if (!p.scored && p.x + PIPE_W < state.bird.x) {
          p.scored = true;
          state.score++;
          setScore(state.score);
        }
        // Collision
        if (
          state.bird.x + 8 > p.x && state.bird.x - 8 < p.x + PIPE_W &&
          (state.bird.y - 8 < p.gapY || state.bird.y + 8 > p.gapY + GAP)
        ) {
          state.dead = true;
          state.running = false;
          setGameOver(true);
        }
      }

      if (state.bird.y < 0 || state.bird.y > H) {
        state.dead = true;
        state.running = false;
        setGameOver(true);
      }
    }

    function draw() {
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, W, H);

      // Pipes
      ctx.fillStyle = '#22c55e';
      for (const p of state.pipes) {
        ctx.fillRect(p.x, 0, PIPE_W, p.gapY);
        ctx.fillRect(p.x, p.gapY + GAP, PIPE_W, H - p.gapY - GAP);
      }

      // Bird
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(state.bird.x, state.bird.y, 8, 0, Math.PI * 2);
      ctx.fill();

      if (!state.running && !state.dead) {
        ctx.fillStyle = '#8888a0';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Press SPACE or tap to flap', W / 2, H / 2);
      }
      if (state.dead) {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', W / 2, H / 2 - 10);
        ctx.fillStyle = '#8888a0';
        ctx.font = '12px sans-serif';
        ctx.fillText('Tap to restart', W / 2, H / 2 + 12);
      }
    }

    let raf;
    function loop() { update(); draw(); raf = requestAnimationFrame(loop); }
    raf = requestAnimationFrame(loop);

    function onKey(e) { if (e.code === 'Space') { e.preventDefault(); flap(); } }
    function onClick() { flap(); }
    function onTouchStart(e) { e.preventDefault(); flap(); }

    window.addEventListener('keydown', onKey);
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('touchstart', onTouchStart);
    };
  }, []);

  return (
    <div>
      <div className="game-hud">Score: {score}</div>
      <canvas ref={canvasRef} className="game-canvas" />
    </div>
  );
}
