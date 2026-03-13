import { useState, useCallback } from 'react';

const LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

function checkWinner(board) {
  for (const [a,b,c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

/**
 * TicTacToe — Play X vs a simple CPU opponent (O).
 */
export default function TicTacToe() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xTurn, setXTurn] = useState(true);
  const [winner, setWinner] = useState(null);
  const [draws, setDraws] = useState(0);
  const [wins, setWins] = useState(0);

  const cpuMove = useCallback((b) => {
    // Try to win
    for (let i = 0; i < 9; i++) {
      if (!b[i]) {
        const test = [...b]; test[i] = 'O';
        if (checkWinner(test) === 'O') return i;
      }
    }
    // Block player
    for (let i = 0; i < 9; i++) {
      if (!b[i]) {
        const test = [...b]; test[i] = 'X';
        if (checkWinner(test) === 'X') return i;
      }
    }
    // Center, then random
    if (!b[4]) return 4;
    const open = b.map((v, i) => v ? -1 : i).filter(i => i >= 0);
    return open[Math.floor(Math.random() * open.length)];
  }, []);

  function play(i) {
    if (board[i] || winner || !xTurn) return;
    const next = [...board];
    next[i] = 'X';

    const w = checkWinner(next);
    if (w) {
      setBoard(next);
      setWinner(w);
      setWins(prev => prev + 1);
      return;
    }
    if (next.every(v => v)) {
      setBoard(next);
      setWinner('draw');
      setDraws(prev => prev + 1);
      return;
    }

    // CPU turn
    const ci = cpuMove(next);
    if (ci !== undefined && ci >= 0) {
      next[ci] = 'O';
      const w2 = checkWinner(next);
      if (w2) { setBoard(next); setWinner(w2); return; }
      if (next.every(v => v)) { setBoard(next); setWinner('draw'); setDraws(prev => prev + 1); return; }
    }

    setBoard(next);
  }

  function reset() {
    setBoard(Array(9).fill(null));
    setXTurn(true);
    setWinner(null);
  }

  return (
    <div>
      <div className="game-hud">Wins: {wins} | Draws: {draws}</div>
      <div className="ttt-grid">
        {board.map((cell, i) => (
          <div
            key={i}
            className={`ttt-cell ${cell === 'X' ? 'ttt-x' : ''} ${cell === 'O' ? 'ttt-o' : ''}`}
            onClick={() => play(i)}
          >
            {cell}
          </div>
        ))}
      </div>
      {winner && (
        <div className="game-overlay-msg">
          <div style={{
            color: winner === 'X' ? '#22c55e' : winner === 'O' ? '#ef4444' : '#eab308',
            fontWeight: 700, fontSize: '1.1rem', marginBottom: 8
          }}>
            {winner === 'draw' ? "It's a draw!" : winner === 'X' ? 'You win!' : 'CPU wins!'}
          </div>
          <button className="game-start-btn" onClick={reset}>Play Again</button>
        </div>
      )}
    </div>
  );
}
