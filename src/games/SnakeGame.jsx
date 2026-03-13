import { useEffect, useRef, useState } from 'react';

/**
 * SnakeGame — Classic snake. Arrow keys or WASD to move.
 */
export default function SnakeGame() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = 400;
    const H = canvas.height = 200;
    const CELL = 10;
    const COLS = W / CELL;
    const ROWS = H / CELL;

    let snake, dir, nextDir, food, dead, running, scoreVal, tickInterval;

    function init() {
      snake = [{ x: 5, y: Math.floor(ROWS / 2) }];
      dir = { x: 1, y: 0 };
      nextDir = { x: 1, y: 0 };
      dead = false;
      running = false;
      scoreVal = 0;
      placeFood();
      setScore(0);
      setGameOver(false);
    }

    function placeFood() {
      do {
        food = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
      } while (snake.some(s => s.x === food.x && s.y === food.y));
    }

    function tick() {
      if (!running || dead) return;
      dir = { ...nextDir };
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

      // Wrap around
      if (head.x < 0) head.x = COLS - 1;
      if (head.x >= COLS) head.x = 0;
      if (head.y < 0) head.y = ROWS - 1;
      if (head.y >= ROWS) head.y = 0;

      // Self collision
      if (snake.some(s => s.x === head.x && s.y === head.y)) {
        dead = true;
        running = false;
        setGameOver(true);
        return;
      }

      snake.unshift(head);

      if (head.x === food.x && head.y === food.y) {
        scoreVal++;
        setScore(scoreVal);
        placeFood();
      } else {
        snake.pop();
      }
    }

    function draw() {
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, W, H);

      // Grid dots
      ctx.fillStyle = '#15151f';
      for (let x = 0; x < COLS; x++) {
        for (let y = 0; y < ROWS; y++) {
          ctx.fillRect(x * CELL + CELL / 2, y * CELL + CELL / 2, 1, 1);
        }
      }

      // Snake
      snake.forEach((s, i) => {
        ctx.fillStyle = i === 0 ? '#6366f1' : '#4f46e5';
        ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
      });

      // Food
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(food.x * CELL + 1, food.y * CELL + 1, CELL - 2, CELL - 2);

      if (!running && !dead) {
        ctx.fillStyle = '#8888a0';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Arrow keys or swipe to start', W / 2, H / 2);
      }
      if (dead) {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', W / 2, H / 2 - 10);
        ctx.fillStyle = '#8888a0';
        ctx.font = '12px sans-serif';
        ctx.fillText('Press any arrow to restart', W / 2, H / 2 + 12);
      }
    }

    init();

    tickInterval = setInterval(tick, 100);
    let raf;
    function loop() { draw(); raf = requestAnimationFrame(loop); }
    raf = requestAnimationFrame(loop);

    function onKey(e) {
      const dirs = {
        ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 },
        KeyW: { x: 0, y: -1 }, KeyS: { x: 0, y: 1 },
        KeyA: { x: -1, y: 0 }, KeyD: { x: 1, y: 0 },
      };
      const d = dirs[e.code];
      if (!d) return;
      e.preventDefault();
      if (dead) { init(); running = true; return; }
      if (!running) running = true;
      // Prevent reversing
      if (d.x !== -dir.x || d.y !== -dir.y) nextDir = d;
    }
    let touchStart = null;
    function onTouchStart(e) {
      e.preventDefault();
      const t = e.touches[0];
      touchStart = { x: t.clientX, y: t.clientY };
      if (dead) { init(); running = true; return; }
      if (!running) running = true;
    }
    function onTouchEnd(e) {
      if (!touchStart) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStart.x;
      const dy = t.clientY - touchStart.y;
      touchStart = null;
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return; // too small
      let d;
      if (Math.abs(dx) > Math.abs(dy)) {
        d = dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
      } else {
        d = dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
      }
      if (d.x !== -dir.x || d.y !== -dir.y) nextDir = d;
    }

    window.addEventListener('keydown', onKey);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(tickInterval);
      window.removeEventListener('keydown', onKey);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  return (
    <div>
      <div className="game-hud">Score: {score}</div>
      <canvas ref={canvasRef} className="game-canvas" />
    </div>
  );
}
