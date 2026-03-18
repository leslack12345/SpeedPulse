import { useEffect, useRef, useState } from 'react';

/**
 * Breakout — Brick breaker game. Mouse or arrow keys to move paddle.
 */
export default function Breakout() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = 400;
    const H = canvas.height = 200;

    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const PADDLE_W = isMobile ? 70 : 50, PADDLE_H = isMobile ? 8 : 6;
    const BALL_R = 4;
    const BRICK_ROWS = 3, BRICK_COLS = 10;
    const BRICK_W = (W - 20) / BRICK_COLS;
    const BRICK_H = 12;
    const COLORS = ['#ef4444', '#eab308', '#22c55e'];

    let paddle, ball, bricks, scoreVal, dead, won;

    function init() {
      paddle = W / 2 - PADDLE_W / 2;
      ball = { x: W / 2, y: H - 30, vx: 2.5, vy: -2.5 };
      bricks = [];
      for (let r = 0; r < BRICK_ROWS; r++) {
        for (let c = 0; c < BRICK_COLS; c++) {
          bricks.push({ x: 10 + c * BRICK_W, y: 20 + r * (BRICK_H + 3), w: BRICK_W - 2, h: BRICK_H, color: COLORS[r], alive: true });
        }
      }
      scoreVal = 0;
      dead = false;
      won = false;
      setScore(0);
      setGameOver(false);
    }

    function update() {
      if (dead || won) return;
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Wall bounce
      if (ball.x - BALL_R < 0 || ball.x + BALL_R > W) ball.vx *= -1;
      if (ball.y - BALL_R < 0) ball.vy *= -1;

      // Paddle bounce
      if (
        ball.vy > 0 &&
        ball.y + BALL_R >= H - 15 - PADDLE_H &&
        ball.x > paddle && ball.x < paddle + PADDLE_W
      ) {
        ball.vy *= -1;
        ball.vx += (ball.x - (paddle + PADDLE_W / 2)) * 0.08;
      }

      // Bottom — game over
      if (ball.y > H + 10) {
        dead = true;
        setGameOver(true);
        window.gtag?.('event', 'game_over', { event_category: 'games', game_name: 'Brick Breaker', score: scoreVal });
      }

      // Brick collision
      for (const b of bricks) {
        if (!b.alive) continue;
        if (ball.x + BALL_R > b.x && ball.x - BALL_R < b.x + b.w &&
            ball.y + BALL_R > b.y && ball.y - BALL_R < b.y + b.h) {
          b.alive = false;
          ball.vy *= -1;
          scoreVal += 10;
          setScore(scoreVal);
          break;
        }
      }

      if (bricks.every(b => !b.alive)) {
        won = true;
        setGameOver(true);
        window.gtag?.('event', 'game_over', { event_category: 'games', game_name: 'Brick Breaker', score: scoreVal, result: 'win' });
      }
    }

    function draw() {
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, W, H);

      // Bricks
      for (const b of bricks) {
        if (!b.alive) continue;
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.w, b.h);
      }

      // Paddle
      ctx.fillStyle = '#6366f1';
      ctx.fillRect(paddle, H - 15, PADDLE_W, PADDLE_H);

      // Ball
      ctx.fillStyle = '#e8e8f0';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
      ctx.fill();

      if (dead) {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', W / 2, H / 2);
        ctx.fillStyle = '#8888a0';
        ctx.font = '12px sans-serif';
        ctx.fillText('Click to restart', W / 2, H / 2 + 18);
      }
      if (won) {
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('YOU WIN!', W / 2, H / 2);
      }
    }

    init();

    let raf;
    function loop() { update(); draw(); raf = requestAnimationFrame(loop); }
    raf = requestAnimationFrame(loop);

    function onMouse(e) {
      const rect = canvas.getBoundingClientRect();
      paddle = e.clientX - rect.left - PADDLE_W / 2;
      paddle = Math.max(0, Math.min(W - PADDLE_W, paddle));
    }
    function onKey(e) {
      if (e.code === 'ArrowLeft') paddle -= 20;
      if (e.code === 'ArrowRight') paddle += 20;
      paddle = Math.max(0, Math.min(W - PADDLE_W, paddle));
      e.preventDefault();
    }
    function onClick() { if (dead || won) init(); }

    function onTouch(e) {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const touch = e.touches[0];
      paddle = (touch.clientX - rect.left) * scaleX - PADDLE_W / 2;
      paddle = Math.max(0, Math.min(W - PADDLE_W, paddle));
    }
    function onTouchStart(e) {
      if (dead || won) { init(); return; }
      onTouch(e);
    }

    canvas.addEventListener('mousemove', onMouse);
    window.addEventListener('keydown', onKey);
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouch, { passive: false });

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('mousemove', onMouse);
      window.removeEventListener('keydown', onKey);
      canvas.removeEventListener('click', onClick);
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
