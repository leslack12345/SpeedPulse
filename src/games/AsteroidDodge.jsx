import { useEffect, useRef, useState } from 'react';

/**
 * AsteroidDodge — Move ship left/right to dodge falling asteroids.
 */
export default function AsteroidDodge() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = 400;
    const H = canvas.height = 200;

    const SHIP_W = 16, SHIP_H = 20;
    let ship, asteroids, frame, scoreVal, dead, running, keys;

    function init() {
      ship = { x: W / 2, y: H - 30 };
      asteroids = [];
      frame = 0;
      scoreVal = 0;
      dead = false;
      running = false;
      keys = {};
      setScore(0);
      setGameOver(false);
    }

    function update() {
      if (!running || dead) return;
      frame++;
      scoreVal = Math.floor(frame / 10);
      setScore(scoreVal);

      // Move ship
      if (keys['ArrowLeft'] || keys['KeyA']) ship.x -= 4;
      if (keys['ArrowRight'] || keys['KeyD']) ship.x += 4;
      ship.x = Math.max(SHIP_W / 2, Math.min(W - SHIP_W / 2, ship.x));

      // Spawn asteroids
      const spawnRate = Math.max(10, 30 - Math.floor(scoreVal / 10));
      if (frame % spawnRate === 0) {
        asteroids.push({
          x: Math.random() * W,
          y: -10,
          r: 4 + Math.random() * 8,
          speed: 1.5 + Math.random() * 2 + scoreVal * 0.01,
        });
      }

      // Move asteroids
      asteroids.forEach(a => { a.y += a.speed; });
      asteroids = asteroids.filter(a => a.y < H + 20);

      // Collision
      for (const a of asteroids) {
        const dx = ship.x - a.x;
        const dy = ship.y - a.y;
        if (Math.sqrt(dx * dx + dy * dy) < a.r + 8) {
          dead = true;
          running = false;
          setGameOver(true);
          window.gtag?.('event', 'game_over', { event_category: 'games', game_name: 'Asteroid Dodge', score: scoreVal });
        }
      }
    }

    function draw() {
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, W, H);

      // Stars background
      ctx.fillStyle = '#1e1e2e';
      for (let i = 0; i < 30; i++) {
        const sx = (i * 137 + frame * 0.1) % W;
        const sy = (i * 97 + frame * 0.3) % H;
        ctx.fillRect(sx, sy, 1, 1);
      }

      // Ship (triangle)
      ctx.fillStyle = '#6366f1';
      ctx.beginPath();
      ctx.moveTo(ship.x, ship.y - SHIP_H / 2);
      ctx.lineTo(ship.x - SHIP_W / 2, ship.y + SHIP_H / 2);
      ctx.lineTo(ship.x + SHIP_W / 2, ship.y + SHIP_H / 2);
      ctx.closePath();
      ctx.fill();

      // Asteroids
      ctx.fillStyle = '#8888a0';
      for (const a of asteroids) {
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!running && !dead) {
        ctx.fillStyle = '#8888a0';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Arrow keys or drag to dodge', W / 2, H / 2);
      }
      if (dead) {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('DESTROYED', W / 2, H / 2 - 10);
        ctx.fillStyle = '#8888a0';
        ctx.font = '12px sans-serif';
        ctx.fillText('Press any key to retry', W / 2, H / 2 + 12);
      }
    }

    init();

    let raf;
    function loop() { update(); draw(); raf = requestAnimationFrame(loop); }
    raf = requestAnimationFrame(loop);

    function onKeyDown(e) {
      if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(e.code)) e.preventDefault();
      if (dead) { init(); running = true; return; }
      if (!running) running = true;
      keys[e.code] = true;
    }
    function onKeyUp(e) { keys[e.code] = false; }

    function onTouch(e) {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const touch = e.touches[0];
      ship.x = (touch.clientX - rect.left) * scaleX;
      ship.x = Math.max(SHIP_W / 2, Math.min(W - SHIP_W / 2, ship.x));
    }
    function onTouchStart(e) {
      e.preventDefault();
      if (dead) { init(); running = true; return; }
      if (!running) running = true;
      onTouch(e);
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouch, { passive: false });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouch);
    };
  }, []);

  return (
    <div>
      <div className="game-hud">Score: {score}</div>
      <canvas ref={canvasRef} className="game-canvas" />
    </div>
  );
}
