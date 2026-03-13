import { useEffect, useRef, useState } from 'react';

/**
 * PongGame — Single-player pong vs CPU. Move paddle with mouse or arrow keys.
 */
export default function PongGame() {
  const canvasRef = useRef(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [cpuScore, setCpuScore] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = 400;
    const H = canvas.height = 200;

    const PADDLE_H = 40, PADDLE_W = 6, BALL_R = 5;
    const state = {
      player: H / 2 - PADDLE_H / 2,
      cpu: H / 2 - PADDLE_H / 2,
      ball: { x: W / 2, y: H / 2, vx: 3, vy: 2 },
      pScore: 0,
      cScore: 0,
    };

    function resetBall(dir) {
      state.ball.x = W / 2;
      state.ball.y = H / 2;
      state.ball.vx = 3 * dir;
      state.ball.vy = (Math.random() - 0.5) * 4;
    }

    function update() {
      const b = state.ball;
      b.x += b.vx;
      b.y += b.vy;

      // Top/bottom bounce
      if (b.y - BALL_R < 0) { b.y = BALL_R; b.vy *= -1; }
      if (b.y + BALL_R > H) { b.y = H - BALL_R; b.vy *= -1; }

      // Player paddle (left)
      if (b.x - BALL_R < 15 + PADDLE_W && b.y > state.player && b.y < state.player + PADDLE_H && b.vx < 0) {
        b.vx *= -1.05;
        b.vy += (b.y - (state.player + PADDLE_H / 2)) * 0.15;
      }

      // CPU paddle (right)
      if (b.x + BALL_R > W - 15 - PADDLE_W && b.y > state.cpu && b.y < state.cpu + PADDLE_H && b.vx > 0) {
        b.vx *= -1.05;
        b.vy += (b.y - (state.cpu + PADDLE_H / 2)) * 0.15;
      }

      // Score
      if (b.x < 0) { state.cScore++; setCpuScore(state.cScore); resetBall(1); }
      if (b.x > W) { state.pScore++; setPlayerScore(state.pScore); resetBall(-1); }

      // CPU AI — follows ball with slight delay
      const cpuCenter = state.cpu + PADDLE_H / 2;
      const diff = b.y - cpuCenter;
      state.cpu += diff * 0.06;
      state.cpu = Math.max(0, Math.min(H - PADDLE_H, state.cpu));

      // Clamp ball speed
      const maxV = 8;
      if (Math.abs(b.vx) > maxV) b.vx = maxV * Math.sign(b.vx);
      if (Math.abs(b.vy) > maxV) b.vy = maxV * Math.sign(b.vy);
    }

    function draw() {
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, W, H);

      // Center line
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#1e1e2e';
      ctx.beginPath();
      ctx.moveTo(W / 2, 0);
      ctx.lineTo(W / 2, H);
      ctx.stroke();
      ctx.setLineDash([]);

      // Paddles
      ctx.fillStyle = '#6366f1';
      ctx.fillRect(15, state.player, PADDLE_W, PADDLE_H);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(W - 15 - PADDLE_W, state.cpu, PADDLE_W, PADDLE_H);

      // Ball
      ctx.fillStyle = '#e8e8f0';
      ctx.beginPath();
      ctx.arc(state.ball.x, state.ball.y, BALL_R, 0, Math.PI * 2);
      ctx.fill();
    }

    let raf;
    function loop() { update(); draw(); raf = requestAnimationFrame(loop); }
    raf = requestAnimationFrame(loop);

    function onKey(e) {
      if (e.code === 'ArrowUp') { state.player -= 15; e.preventDefault(); }
      if (e.code === 'ArrowDown') { state.player += 15; e.preventDefault(); }
      state.player = Math.max(0, Math.min(H - PADDLE_H, state.player));
    }
    function onMouse(e) {
      const rect = canvas.getBoundingClientRect();
      state.player = e.clientY - rect.top - PADDLE_H / 2;
      state.player = Math.max(0, Math.min(H - PADDLE_H, state.player));
    }
    function onTouch(e) {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const scaleY = H / rect.height;
      const touch = e.touches[0];
      state.player = (touch.clientY - rect.top) * scaleY - PADDLE_H / 2;
      state.player = Math.max(0, Math.min(H - PADDLE_H, state.player));
    }

    window.addEventListener('keydown', onKey);
    canvas.addEventListener('mousemove', onMouse);
    canvas.addEventListener('touchstart', onTouch, { passive: false });
    canvas.addEventListener('touchmove', onTouch, { passive: false });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      canvas.removeEventListener('mousemove', onMouse);
      canvas.removeEventListener('touchstart', onTouch);
      canvas.removeEventListener('touchmove', onTouch);
    };
  }, []);

  return (
    <div>
      <div className="game-hud">You: {playerScore} | CPU: {cpuScore}</div>
      <canvas ref={canvasRef} className="game-canvas" />
    </div>
  );
}
