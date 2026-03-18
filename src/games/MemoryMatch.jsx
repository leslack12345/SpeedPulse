import { useState, useEffect, useRef } from 'react';

const SYMBOLS = ['♠', '♥', '♦', '♣', '★', '●', '▲', '■'];

/**
 * MemoryMatch — Flip cards to find matching pairs.
 */
export default function MemoryMatch() {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const lockRef = useRef(false);

  useEffect(() => { resetGame(); }, []);

  function resetGame() {
    const deck = [...SYMBOLS, ...SYMBOLS]
      .sort(() => Math.random() - 0.5)
      .map((sym, i) => ({ id: i, sym }));
    setCards(deck);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setWon(false);
    lockRef.current = false;
  }

  function flipCard(id) {
    if (lockRef.current) return;
    if (flipped.includes(id) || matched.includes(id)) return;

    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      const newMoves = moves + 1;
      setMoves(newMoves);
      lockRef.current = true;

      const [a, b] = newFlipped;
      if (cards[a].sym === cards[b].sym) {
        const newMatched = [...matched, a, b];
        setMatched(newMatched);
        setFlipped([]);
        lockRef.current = false;
        if (newMatched.length === cards.length) {
          setWon(true);
          window.gtag?.('event', 'game_over', { event_category: 'games', game_name: 'Memory Match', moves: newMoves });
        }
      } else {
        setTimeout(() => {
          setFlipped([]);
          lockRef.current = false;
        }, 600);
      }
    }
  }

  return (
    <div>
      <div className="game-hud">Moves: {moves} | Pairs: {matched.length / 2}/{SYMBOLS.length}</div>
      <div className="memory-grid">
        {cards.map((card) => {
          const isFlipped = flipped.includes(card.id) || matched.includes(card.id);
          return (
            <div
              key={card.id}
              className={`memory-card ${isFlipped ? 'flipped' : ''} ${matched.includes(card.id) ? 'matched' : ''}`}
              onClick={() => flipCard(card.id)}
            >
              {isFlipped ? card.sym : '?'}
            </div>
          );
        })}
      </div>
      {won && (
        <div className="game-overlay-msg">
          <div style={{ color: '#22c55e', fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>
            Solved in {moves} moves!
          </div>
          <button className="game-start-btn" onClick={resetGame}>Play Again</button>
        </div>
      )}
    </div>
  );
}
