import { useState, useMemo } from 'react';
import DinoRun from './DinoRun.jsx';
import FlappyDot from './FlappyDot.jsx';
import SnakeGame from './SnakeGame.jsx';
import PongGame from './PongGame.jsx';
import Breakout from './Breakout.jsx';
import AsteroidDodge from './AsteroidDodge.jsx';
import WhackAMole from './WhackAMole.jsx';
import MemoryMatch from './MemoryMatch.jsx';
import TicTacToe from './TicTacToe.jsx';
import ColorReaction from './ColorReaction.jsx';
import SpaceShooter from './SpaceShooter.jsx';

const GAMES = [
  { id: 'dino', name: 'Dino Run', component: DinoRun },
  { id: 'flappy', name: 'Flappy Dot', component: FlappyDot },
  { id: 'snake', name: 'Snake', component: SnakeGame },
  { id: 'pong', name: 'Pong', component: PongGame },
  { id: 'breakout', name: 'Brick Breaker', component: Breakout },
  { id: 'asteroid', name: 'Asteroid Dodge', component: AsteroidDodge },
  { id: 'whack', name: 'Mole Bonk', component: WhackAMole },
  { id: 'memory', name: 'Memory Match', component: MemoryMatch },
  { id: 'ttt', name: 'Tic-Tac-Toe', component: TicTacToe },
  { id: 'reaction', name: 'Reaction Test', component: ColorReaction },
  { id: 'shooter', name: 'Space Shooter', component: SpaceShooter },
];

/**
 * GameArcade — Randomly picks a game to display.
 * "Shuffle" button picks a new random game.
 */
export default function GameArcade() {
  const [gameIndex, setGameIndex] = useState(() => Math.floor(Math.random() * GAMES.length));

  // Use key to force remount when game changes
  const [gameKey, setGameKey] = useState(0);

  function shuffle() {
    let next;
    do { next = Math.floor(Math.random() * GAMES.length); } while (next === gameIndex);
    setGameIndex(next);
    setGameKey(k => k + 1);
    window.gtag?.('event', 'game_shuffle', { event_category: 'games', game_name: GAMES[next].name });
  }

  const game = GAMES[gameIndex];
  const GameComponent = game.component;

  return (
    <div className="game-arcade">
      <div className="game-arcade-header">
        <h3>Mini Games</h3>
        <button className="shuffle-btn" onClick={shuffle}>Shuffle Game</button>
      </div>
      <div className="game-title">{game.name}</div>
      <div className="game-wrapper">
        <GameComponent key={gameKey} />
      </div>
    </div>
  );
}
