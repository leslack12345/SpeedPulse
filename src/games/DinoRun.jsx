import { useEffect, useRef, useState } from 'react';

/**
 * DinoRun — Side-scrolling jump game. Tap/click/space to jump over cacti.
 */
export default function DinoRun() {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = 400;
    const H = canvas.height = 200;

    const GROUND = H - 30;
    const DINO_W = 20, DINO_H = 30;
    const GRAVITY = 0.6;
    const JUMP_FORCE = -10;

    const state = {
      dino: { x: 50, y: GROUND - DINO_H, vy: 0, jumping: false },
      obstacles: [],
      speed: 4,
      frame: 0,
      score: 0,
      running: false,
      dead: false,
    };
    stateRef.current = state;

    function spawnObstacle() {
      const h = 15 + Math.random() * 20;
      state.obstacles.push({ x: W + 10, w: 12, h });
    }

    function jump() {
      if (state.dead) {
        // Reset
        state.dino.y = GROUND - DINO_H;
        state.dino.vy = 0;
        state.dino.jumping = false;
        state.obstacles = [];
        state.speed = 4;
        state.frame = 0;
        state.score = 0;
        state.dead = false;
        state.running = true;
        setGameOver(false);
        setStarted(true);
        setScore(0);
        return;
      }
      if (!state.running) {
        state.running = true;
        setStarted(true);
        window.gtag?.('event', 'game_start', { event_category: 'games', game_name: 'Dino Run' });
      }
      if (!state.dino.jumping) {
        state.dino.vy = JUMP_FORCE;
        state.dino.jumping = true;
      }
    }

    function update() {
      if (!state.running || state.dead) return;
      state.frame++;
      state.score = Math.floor(state.frame / 5);
      setScore(state.score);

      // Dino physics
      state.dino.vy += GRAVITY;
      state.dino.y += state.dino.vy;
      if (state.dino.y >= GROUND - DINO_H) {
        state.dino.y = GROUND - DINO_H;
        state.dino.vy = 0;
        state.dino.jumping = false;
      }

      // Spawn obstacles
      if (state.frame % Math.max(40, 80 - state.score) === 0) spawnObstacle();

      // Move obstacles
      state.obstacles.forEach(o => { o.x -= state.speed; });
      state.obstacles = state.obstacles.filter(o => o.x > -20);

      // Speed up gradually
      state.speed = 4 + state.score * 0.02;

      // Collision
      for (const o of state.obstacles) {
        if (
          state.dino.x + DINO_W > o.x &&
          state.dino.x < o.x + o.w &&
          state.dino.y + DINO_H > GROUND - o.h
        ) {
          state.dead = true;
          state.running = false;
          setGameOver(true);
          window.gtag?.('event', 'game_over', { event_category: 'games', game_name: 'Dino Run', score: state.score });
          return;
        }
      }
    }

    function draw() {
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, W, H);

      // Ground
      ctx.strokeStyle = '#2a2a3a';
      ctx.beginPath();
      ctx.moveTo(0, GROUND);
      ctx.lineTo(W, GROUND);
      ctx.stroke();

      // Dino
      ctx.fillStyle = '#6366f1';
      ctx.fillRect(state.dino.x, state.dino.y, DINO_W, DINO_H);
      // Eye
      ctx.fillStyle = '#fff';
      ctx.fillRect(state.dino.x + 13, state.dino.y + 5, 4, 4);

      // Obstacles
      ctx.fillStyle = '#ef4444';
      for (const o of state.obstacles) {
        ctx.fillRect(o.x, GROUND - o.h, o.w, o.h);
      }

      // UI
      if (!state.running && !state.dead && !started) {
        ctx.fillStyle = '#8888a0';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Press SPACE or tap to start', W / 2, H / 2);
      }
      if (state.dead) {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', W / 2, H / 2 - 10);
        ctx.fillStyle = '#8888a0';
        ctx.font = '12px sans-serif';
        ctx.fillText('Press SPACE to restart', W / 2, H / 2 + 12);
      }
    }

    let raf;
    function loop() {
      update();
      draw();
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    function onKey(e) {
      if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); jump(); }
    }
    function onClick() { jump(); }

    function onTouchStart(e) { e.preventDefault(); jump(); }

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
