import { useEffect, useRef, useState } from 'react';

/**
 * SpaceShooter — Shoot descending aliens. Arrow keys to move, Space to fire.
 */
export default function SpaceShooter() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = 400;
    const H = canvas.height = 200;

    let ship, bullets, aliens, frame, scoreVal, dead, keys;

    function init() {
      ship = { x: W / 2, y: H - 20 };
      bullets = [];
      aliens = [];
      frame = 0;
      scoreVal = 0;
      dead = false;
      keys = {};
      setScore(0);
      setGameOver(false);
      // Spawn initial wave
      spawnWave();
    }

    function spawnWave() {
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 8; c++) {
          aliens.push({
            x: 40 + c * 40,
            y: 15 + r * 25,
            alive: true,
            dx: 1,
          });
        }
      }
    }

    function update() {
      if (dead) return;
      frame++;

      // Move ship
      if (keys['ArrowLeft'] || keys['KeyA']) ship.x -= 4;
      if (keys['ArrowRight'] || keys['KeyD']) ship.x += 4;
      ship.x = Math.max(10, Math.min(W - 10, ship.x));

      // Move bullets
      bullets.forEach(b => { b.y -= 5; });
      bullets = bullets.filter(b => b.y > -5);

      // Move aliens
      let hitEdge = false;
      aliens.forEach(a => {
        if (!a.alive) return;
        a.x += a.dx * 0.5;
        if (a.x < 10 || a.x > W - 10) hitEdge = true;
      });
      if (hitEdge) {
        aliens.forEach(a => {
          a.dx *= -1;
          a.y += 8;
        });
      }

      // Bullet-alien collision
      for (const b of bullets) {
        for (const a of aliens) {
          if (!a.alive) continue;
          if (Math.abs(b.x - a.x) < 10 && Math.abs(b.y - a.y) < 8) {
            a.alive = false;
            b.y = -10; // remove bullet
            scoreVal += 10;
            setScore(scoreVal);
          }
        }
      }

      // Aliens reaching bottom
      for (const a of aliens) {
        if (a.alive && a.y > H - 30) {
          dead = true;
          setGameOver(true);
          window.gtag?.('event', 'game_over', { event_category: 'games', game_name: 'Space Shooter', score: scoreVal });
          return;
        }
      }

      // All dead — new wave
      if (aliens.every(a => !a.alive)) {
        spawnWave();
      }
    }

    function draw() {
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, W, H);

      // Ship
      ctx.fillStyle = '#6366f1';
      ctx.beginPath();
      ctx.moveTo(ship.x, ship.y - 10);
      ctx.lineTo(ship.x - 8, ship.y + 6);
      ctx.lineTo(ship.x + 8, ship.y + 6);
      ctx.closePath();
      ctx.fill();

      // Bullets
      ctx.fillStyle = '#eab308';
      bullets.forEach(b => {
        ctx.fillRect(b.x - 1, b.y, 2, 6);
      });

      // Aliens
      aliens.forEach(a => {
        if (!a.alive) return;
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(a.x - 8, a.y - 6, 16, 12);
        // Eyes
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(a.x - 4, a.y - 3, 3, 3);
        ctx.fillRect(a.x + 1, a.y - 3, 3, 3);
      });

      if (dead) {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('INVADED', W / 2, H / 2 - 10);
        ctx.fillStyle = '#8888a0';
        ctx.font = '12px sans-serif';
        ctx.fillText('SPACE or tap to retry', W / 2, H / 2 + 12);
      }
    }

    init();

    let raf;
    function loop() { update(); draw(); raf = requestAnimationFrame(loop); }
    raf = requestAnimationFrame(loop);

    function onKeyDown(e) {
      if (['ArrowLeft','ArrowRight','KeyA','KeyD','Space'].includes(e.code)) e.preventDefault();
      if (dead && e.code === 'Space') { init(); return; }
      keys[e.code] = true;
      if (e.code === 'Space' && !dead) {
        bullets.push({ x: ship.x, y: ship.y - 12 });
      }
    }
    function onKeyUp(e) { keys[e.code] = false; }

    let lastFireFrame = 0;
    function onTouch(e) {
      e.preventDefault();
      if (dead) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const touch = e.touches[0];
      ship.x = (touch.clientX - rect.left) * scaleX;
      ship.x = Math.max(10, Math.min(W - 10, ship.x));
      // Auto-fire while touching
      if (frame - lastFireFrame > 10) {
        bullets.push({ x: ship.x, y: ship.y - 12 });
        lastFireFrame = frame;
      }
    }
    function onTouchStart(e) {
      e.preventDefault();
      if (dead) { init(); return; }
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
