import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Play, RotateCcw, Trophy, Target, Zap, Grid3X3 } from 'lucide-react';

function ReactionGame({ onScore }) {
  const [gameState, setGameState] = useState('idle'); // idle, waiting, ready, done
  const [startTime, setStartTime] = useState(0);
  const [result, setResult] = useState(null);

  const handleClick = () => {
    if (gameState === 'idle') {
      setGameState('waiting');
      const delay = Math.floor(Math.random() * 3000) + 1500;
      setTimeout(() => {
        setGameState(prev => {
          if (prev === 'waiting') {
            setStartTime(Date.now());
            return 'ready';
          }
          return prev;
        });
      }, delay);
    } else if (gameState === 'waiting') {
      setGameState('done');
      setResult('Too early!');
    } else if (gameState === 'ready') {
      const ms = Date.now() - startTime;
      setGameState('done');
      setResult(`${ms} ms`);
      onScore(ms);
    } else if (gameState === 'done') {
      setGameState('idle');
      setResult(null);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`h-48 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors select-none ${
        gameState === 'idle' ? 'bg-primary/20 text-primary' :
        gameState === 'waiting' ? 'bg-red-500/20 text-red-500' :
        gameState === 'ready' ? 'bg-green-500 text-white' :
        'bg-secondary text-foreground'
      }`}
    >
      <Zap className={`w-8 h-8 mb-2 ${gameState === 'ready' ? 'animate-bounce' : ''}`} />
      <span className="font-bold text-xl text-center px-4">
        {gameState === 'idle' && 'Tap to start'}
        {gameState === 'waiting' && 'Wait for green...'}
        {gameState === 'ready' && 'TAP NOW!'}
        {gameState === 'done' && result}
      </span>
      {gameState === 'done' && <span className="text-xs opacity-70 mt-1">Tap to retry</span>}
    </div>
  );
}

function TapGame({ onScore }) {
  const [gameState, setGameState] = useState('idle'); // idle, playing, done
  const [taps, setTaps] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);

  useEffect(() => {
    let timer;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('done');
      onScore(taps);
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft, taps, onScore]);

  const handleTap = (e) => {
    e.stopPropagation(); // Prevent bubbling if needed
    if (gameState === 'idle') {
      setTaps(1);
      setTimeLeft(10);
      setGameState('playing');
    } else if (gameState === 'playing') {
      setTaps(t => t + 1);
    } else if (gameState === 'done') {
      setTaps(0);
      setTimeLeft(10);
      setGameState('idle');
    }
  };

  return (
    <div 
      onClick={handleTap}
      className="h-48 rounded-2xl flex flex-col items-center justify-center cursor-pointer select-none bg-primary text-white shadow-lg shadow-primary/30 active:scale-95 transition-transform"
    >
      <Target className="w-8 h-8 mb-2 opacity-80" />
      <span className="font-bold text-3xl">{taps} Taps</span>
      <span className="text-sm font-medium opacity-80 mt-1">
        {gameState === 'idle' && 'Tap to start 10s timer'}
        {gameState === 'playing' && `${timeLeft}s remaining`}
        {gameState === 'done' && 'Time up! Tap to replay'}
      </span>
    </div>
  );
}

// Simple 2048-style game (target 128)
function Game128({ onScore }) {
  const [grid, setGrid] = useState([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const initGame = useCallback(() => {
    let newGrid = Array(16).fill(0);
    newGrid = addRandom(newGrid);
    newGrid = addRandom(newGrid);
    setGrid(newGrid);
    setScore(0);
    setGameOver(false);
    setWon(false);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  function addRandom(g) {
    const empty = g.map((v, i) => v === 0 ? i : null).filter(v => v !== null);
    if (empty.length === 0) return g;
    const idx = empty[Math.floor(Math.random() * empty.length)];
    const newG = [...g];
    newG[idx] = Math.random() > 0.9 ? 4 : 2;
    return newG;
  }

  const move = (dir) => {
    if (gameOver || won) return;
    let newGrid = [...grid];
    let moved = false;

    const getLine = (i, d) => {
      if (d === 'left') return [i*4, i*4+1, i*4+2, i*4+3];
      if (d === 'right') return [i*4+3, i*4+2, i*4+1, i*4];
      if (d === 'up') return [i, i+4, i+8, i+12];
      if (d === 'down') return [i+12, i+8, i+4, i];
    };

    for (let i = 0; i < 4; i++) {
      const lineIndices = getLine(i, dir);
      let line = lineIndices.map(idx => newGrid[idx]).filter(v => v !== 0);
      
      for (let j = 0; j < line.length - 1; j++) {
        if (line[j] === line[j+1]) {
          line[j] *= 2;
          setScore(s => s + line[j]);
          if (line[j] === 128) setWon(true);
          line.splice(j+1, 1);
          moved = true;
        }
      }
      
      const newLine = [...line, ...Array(4 - line.length).fill(0)];
      lineIndices.forEach((idx, j) => {
        if (newGrid[idx] !== newLine[j]) moved = true;
        newGrid[idx] = newLine[j];
      });
    }

    if (moved) {
      newGrid = addRandom(newGrid);
      setGrid(newGrid);
      if (!canMove(newGrid)) setGameOver(true);
    }
  };

  function canMove(g) {
    if (g.includes(0)) return true;
    for (let i = 0; i < 16; i++) {
      if (i % 4 < 3 && g[i] === g[i+1]) return true;
      if (i < 12 && g[i] === g[i+4]) return true;
    }
    return false;
  }

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft') move('left');
      if (e.key === 'ArrowRight') move('right');
      if (e.key === 'ArrowUp') move('up');
      if (e.key === 'ArrowDown') move('down');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [grid, gameOver, won]);

  const colors = {
    0: 'bg-secondary/50',
    2: 'bg-primary/20 text-primary',
    4: 'bg-primary/40 text-primary',
    8: 'bg-orange-500/40 text-orange-500',
    16: 'bg-orange-500 text-white',
    32: 'bg-red-500 text-white',
    64: 'bg-red-600 text-white',
    128: 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/50',
  };

  return (
    <div className="bg-secondary/20 p-4 rounded-2xl space-y-4">
      <div className="flex justify-between items-center px-1">
        <span className="text-sm font-bold">Goal: 128</span>
        <span className="text-xs font-mono bg-secondary px-2 py-1 rounded">Score: {score}</span>
      </div>
      
      <div className="grid grid-cols-4 gap-2 aspect-square max-w-[280px] mx-auto relative">
        {grid.map((v, i) => (
          <div key={i} className={`aspect-square rounded-lg flex items-center justify-center font-bold text-lg transition-all duration-100 ${colors[v] || 'bg-yellow-600'}`}>
            {v !== 0 && v}
          </div>
        ))}

        {(gameOver || won) && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center animate-in fade-in duration-300">
            <h4 className="text-xl font-bold mb-2">{won ? 'You Win!' : 'Game Over'}</h4>
            <button 
              onClick={(e) => { e.stopPropagation(); initGame(); }}
              className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 max-w-[150px] mx-auto pt-2">
        <div />
        <button onClick={(e) => {e.stopPropagation(); move('up')}} className="p-2 bg-secondary rounded-lg flex justify-center"><Zap className="w-4 h-4 rotate-180" /></button>
        <div />
        <button onClick={(e) => {e.stopPropagation(); move('left')}} className="p-2 bg-secondary rounded-lg flex justify-center"><Zap className="w-4 h-4 -rotate-90" /></button>
        <button onClick={(e) => {e.stopPropagation(); move('down')}} className="p-2 bg-secondary rounded-lg flex justify-center"><Zap className="w-4 h-4" /></button>
        <button onClick={(e) => {e.stopPropagation(); move('right')}} className="p-2 bg-secondary rounded-lg flex justify-center"><Zap className="w-4 h-4 rotate-90" /></button>
      </div>
    </div>
  );
}

export function RestMinigames({ user }) {
  const [activeGame, setActiveGame] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleScore = async (gameName, score) => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase.from('game_scores').insert([{
        user_id: user.id,
        game_name: gameName,
        score: score
      }]);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          Rest Time Games
        </h3>
        {activeGame && (
          <button 
            onClick={() => setActiveGame(null)}
            className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Back
          </button>
        )}
      </div>

      {!activeGame ? (
        <div className="grid grid-cols-3 gap-2">
          <button 
            onClick={() => setActiveGame('reaction')}
            className="bg-secondary hover:bg-secondary/80 border border-border p-3 rounded-xl flex flex-col items-center gap-2 transition-colors"
          >
            <Zap className="w-5 h-5 text-yellow-500" />
            <span className="text-[10px] font-bold">Reaction</span>
          </button>
          <button 
            onClick={() => setActiveGame('tap')}
            className="bg-secondary hover:bg-secondary/80 border border-border p-3 rounded-xl flex flex-col items-center gap-2 transition-colors"
          >
            <Target className="w-5 h-5 text-blue-500" />
            <span className="text-[10px] font-bold">Speed Tap</span>
          </button>
          <button 
            onClick={() => setActiveGame('2048')}
            className="bg-secondary hover:bg-secondary/80 border border-border p-3 rounded-xl flex flex-col items-center gap-2 transition-colors"
          >
            <Grid3X3 className="w-5 h-5 text-purple-500" />
            <span className="text-[10px] font-bold">Game 128</span>
          </button>
        </div>
      ) : (
        <div className="relative">
          {activeGame === 'reaction' && <ReactionGame onScore={(s) => handleScore('Reaction Time (ms)', s)} />}
          {activeGame === 'tap' && <TapGame onScore={(s) => handleScore('Speed Tap (10s)', s)} />}
          {activeGame === '2048' && <Game128 onScore={(s) => handleScore('Game 128 Score', s)} />}
          {saving && <span className="absolute bottom-2 right-2 text-[10px] text-white/50">Saving score...</span>}
        </div>
      )}
    </div>
  );
}
