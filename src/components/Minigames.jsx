import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Play, RotateCcw, Trophy, Target, Zap } from 'lucide-react';

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
      <span className="font-bold text-xl">
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
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('done');
      onScore(taps);
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft, taps, onScore]);

  const handleTap = () => {
    if (gameState === 'idle') {
      setGameState('playing');
      setTaps(1);
      setTimeLeft(10);
    } else if (gameState === 'playing') {
      setTaps(t => t + 1);
    } else if (gameState === 'done') {
      setGameState('idle');
      setTaps(0);
      setTimeLeft(10);
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
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => setActiveGame('reaction')}
            className="bg-secondary hover:bg-secondary/80 border border-border p-4 rounded-xl flex flex-col items-center gap-2 transition-colors"
          >
            <Zap className="w-6 h-6 text-yellow-500" />
            <span className="text-xs font-bold">Reaction</span>
          </button>
          <button 
            onClick={() => setActiveGame('tap')}
            className="bg-secondary hover:bg-secondary/80 border border-border p-4 rounded-xl flex flex-col items-center gap-2 transition-colors"
          >
            <Target className="w-6 h-6 text-blue-500" />
            <span className="text-xs font-bold">Speed Tap</span>
          </button>
        </div>
      ) : (
        <div className="relative">
          {activeGame === 'reaction' && <ReactionGame onScore={(s) => handleScore('Reaction Time (ms)', s)} />}
          {activeGame === 'tap' && <TapGame onScore={(s) => handleScore('Speed Tap (10s)', s)} />}
          {saving && <span className="absolute bottom-2 right-2 text-[10px] text-white/50">Saving score...</span>}
        </div>
      )}
    </div>
  );
}
