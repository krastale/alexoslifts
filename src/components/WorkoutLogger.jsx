import { useState, useEffect, useMemo } from 'react';
import { Check, Play, Save, X, Plus, Trash2, ChevronLeft, Timer, Calculator, Trophy, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { RestMinigames } from './Minigames';
import confetti from 'canvas-confetti';

// Helper for 1RM calculation (Brzycki Formula)
const calculate1RM = (weight, reps) => {
  if (!weight || !reps || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (36 / (37 - reps));
};

function PlateCalculator({ weight, onClose }) {
  const barWeight = 20; // Default Olympic Bar
  const targetSide = (weight - barWeight) / 2;
  const availablePlates = [25, 20, 15, 10, 5, 2.5, 1.25];
  
  let remaining = targetSide;
  const platesNeeded = [];

  availablePlates.forEach(plate => {
    while (remaining >= plate) {
      platesNeeded.push(plate);
      remaining -= plate;
    }
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border w-full max-w-sm rounded-3xl p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Plate Calculator
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center space-y-1">
          <p className="text-4xl font-black text-primary">{weight} <span className="text-sm font-normal text-muted-foreground uppercase tracking-widest">kg</span></p>
          <p className="text-xs text-muted-foreground">Using 20kg Standard Barbell</p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Per Side:</p>
          {platesNeeded.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {platesNeeded.map((p, i) => (
                <div key={i} className={`px-4 py-2 rounded-xl font-bold border-b-4 transition-all ${
                  p >= 20 ? 'bg-red-500 border-red-700 text-white' :
                  p >= 10 ? 'bg-blue-500 border-blue-700 text-white' :
                  p >= 5 ? 'bg-yellow-500 border-yellow-700 text-black' :
                  'bg-secondary border-border text-foreground'
                }`}>
                  {p} kg
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center py-4 bg-secondary/50 rounded-xl italic">Only the bar!</p>
          )}
        </div>

        <button 
          onClick={onClose}
          className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          GOT IT
        </button>
      </div>
    </div>
  );
}

export function WorkoutLogger({ routine, history, onSave, onCancel }) {
  const { user } = useAuth();
  const [workout, setWorkout] = useState({
    routineName: routine.name,
    date: new Date().toISOString(),
    exercises: routine.exercises.map(ex => {
      const repPattern = String(ex.reps).split(',').map(r => parseInt(r.trim()) || 10);
      return {
        name: ex.name,
        category: ex.category || 'arms',
        sets: Array.from({ length: ex.sets }, (_, i) => ({ 
          weight: '', 
          reps: repPattern[i] || repPattern[repPattern.length - 1] || 10, 
          rpe: '', 
          completed: false 
        }))
      };
    })
  });

  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [showPlateCalc, setShowPlateCalc] = useState(null); // stores {weight}

  // PR Logic: Calculate bests from history
  const personalBests = useMemo(() => {
    const bests = {};
    history?.forEach(session => {
      session.exercises?.forEach(ex => {
        ex.sets?.forEach(set => {
          const w = parseFloat(set.weight);
          if (w > (bests[ex.name] || 0)) {
            bests[ex.name] = w;
          }
        });
      });
    });
    return bests;
  }, [history]);

  // Last Performance Logic
  const lastPerformances = useMemo(() => {
    const last = {};
    if (!history) return last;
    
    // Sort history by date descending just in case
    const sortedHistory = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedHistory.forEach(session => {
      session.exercises?.forEach(ex => {
        if (!last[ex.name]) {
          last[ex.name] = ex.sets;
        }
      });
    });
    return last;
  }, [history]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  useEffect(() => {
    let restInterval;
    if (isResting && restTimeLeft > 0) {
      restInterval = setInterval(() => {
        setRestTimeLeft(prev => {
          if (prev <= 1) {
            setIsResting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(restInterval);
  }, [isResting, restTimeLeft]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const updateSet = (exIdx, setIdx, field, value) => {
    const updated = { ...workout };
    updated.exercises[exIdx].sets[setIdx][field] = value;
    setWorkout(updated);
  };

  const toggleSet = (exIdx, setIdx) => {
    const updated = { ...workout };
    const set = updated.exercises[exIdx].sets[setIdx];
    const willBeCompleted = !set.completed;
    
    if (willBeCompleted) {
      const weight = parseFloat(set.weight);
      const exerciseName = updated.exercises[exIdx].name;
      
      // PR Detection
      if (weight > 0 && weight > (personalBests[exerciseName] || 0)) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#ffffff', '#60a5fa']
        });
        set.isPR = true;
      }
      
      setIsResting(true);
      setRestTimeLeft(60);
    } else {
      set.isPR = false;
    }

    set.completed = willBeCompleted;
    setWorkout(updated);
  };

  const addSet = (exIdx) => {
    const updated = { ...workout };
    const lastSet = updated.exercises[exIdx].sets[updated.exercises[exIdx].sets.length - 1];
    updated.exercises[exIdx].sets.push({ 
      weight: lastSet ? lastSet.weight : '', 
      reps: lastSet ? lastSet.reps : 10, 
      completed: false 
    });
    setWorkout(updated);
  };

  const handleFinish = () => {
    onSave({
      ...workout,
      duration: elapsed,
      date: new Date().toISOString()
    });
  };

  return (
    <div className="min-h-screen bg-background pb-40">
      {showPlateCalc && (
        <PlateCalculator weight={showPlateCalc} onClose={() => setShowPlateCalc(null)} />
      )}

      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border p-4">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={onCancel} className="p-2 hover:bg-secondary rounded-lg">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="font-bold">{workout.routineName}</h1>
              <p className="text-xs text-primary font-mono">{formatTime(elapsed)}</p>
            </div>
          </div>
          <button
            onClick={handleFinish}
            className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-full font-bold transition-all shadow-lg shadow-primary/20"
          >
            Finish
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-8 mt-4">
        {workout.exercises.map((ex, exIdx) => {
          const best = personalBests[ex.name] || 0;
          return (
            <div key={exIdx} className="space-y-4">
              <div className="flex justify-between items-end">
                <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                  <Play className="w-5 h-5 fill-primary" />
                  {ex.name}
                </h2>
                {best > 0 && (
                  <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-yellow-500" />
                    Best: {best}kg
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <div className="col-span-1 text-center">#</div>
                  <div className="col-span-4 text-center">Weight</div>
                  <div className="col-span-3 text-center">Reps</div>
                  <div className="col-span-2 text-center">RPE</div>
                  <div className="col-span-2 text-center">Done</div>
                </div>

                {ex.sets.map((set, setIdx) => {
                  const lastSetData = lastPerformances[ex.name]?.[setIdx];
                  
                  // Intelligent Progression Logic
                  let placeholderWeight = "0";
                  let targetSubtext = null;
                  
                  if (lastSetData) {
                    const lastWeight = parseFloat(lastSetData.weight) || 0;
                    const lastReps = parseInt(lastSetData.reps) || 0;
                    const lastRpe = parseInt(lastSetData.rpe) || 10;
                    
                    if (lastWeight > 0) {
                      // If they hit the target reps and it wasn't max effort, suggest a small bump
                      if (lastReps >= set.reps && lastRpe < 9) {
                        placeholderWeight = `${lastWeight + 2.5}`;
                        targetSubtext = "Target";
                      } else {
                        placeholderWeight = `${lastWeight}`;
                        targetSubtext = "Last";
                      }
                    }
                  }

                  return (
                    <div 
                      key={setIdx} 
                      className={`grid grid-cols-12 gap-2 items-center p-2 rounded-2xl transition-all ${
                        set.completed ? 'bg-primary/5 opacity-60' : 'bg-card border border-border shadow-sm'
                      }`}
                    >
                      <div className="col-span-1 text-center font-bold text-sm">
                        {setIdx + 1}
                      </div>
                      <div className="col-span-4 relative group">
                        <input
                          type="number"
                          placeholder={placeholderWeight}
                          className="w-full bg-secondary border border-border rounded-xl py-2.5 text-center text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
                          value={set.weight}
                          onChange={(e) => updateSet(exIdx, setIdx, 'weight', e.target.value)}
                        />
                        {targetSubtext && !set.weight && (
                          <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-background px-1 text-[8px] font-bold text-primary uppercase whitespace-nowrap rounded">
                            {targetSubtext}
                          </span>
                        )}
                        <button 
                          onClick={() => setShowPlateCalc(parseFloat(set.weight) || 0)}
                          className="absolute -top-2 -right-1 bg-background border border-border p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Calculator className="w-3 h-3 text-primary" />
                        </button>
                      </div>
                      <div className="col-span-3 relative">
                        <input
                          type="number"
                          placeholder={lastSetData ? `${lastSetData.reps}` : "0"}
                          className="w-full bg-secondary border border-border rounded-xl py-2.5 text-center text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
                          value={set.reps}
                          onChange={(e) => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2 relative group">
                        <input
                          type="number"
                          min="1" max="10"
                          placeholder="-"
                          className="w-full bg-secondary border border-border rounded-xl py-2.5 text-center text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
                          value={set.rpe || ''}
                          onChange={(e) => updateSet(exIdx, setIdx, 'rpe', e.target.value)}
                        />
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-card border border-border text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 transition-opacity shadow-xl">
                          RPE (1-10)
                        </div>
                      </div>
                      <div className="col-span-2 flex justify-center relative">
                        {set.isPR && (
                          <div className="absolute -top-3 -right-1 animate-bounce">
                            <Trophy className="w-5 h-5 text-yellow-500 fill-yellow-500 shadow-xl" />
                          </div>
                        )}
                        <button
                          onClick={() => toggleSet(exIdx, setIdx)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                            set.completed 
                              ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' 
                              : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                          }`}
                        >
                          <Check className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                
                <button
                  onClick={() => addSet(exIdx)}
                  className="w-full py-3 bg-secondary/30 hover:bg-secondary/50 border border-dashed border-border rounded-2xl text-xs font-bold uppercase tracking-widest text-muted-foreground transition-all mt-2"
                >
                  + Add Set
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rest Timer Overlay */}
      {isResting && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-xl border-t border-border z-20 animate-in slide-in-from-bottom-full duration-500 shadow-[0_-15px_50px_-15px_rgba(0,0,0,0.6)]">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-primary/20 p-3 rounded-2xl text-primary animate-pulse">
                  <Timer className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-black text-xl uppercase tracking-tighter italic">Rest Time</h3>
                  <p className="text-primary font-mono text-3xl leading-none">{formatTime(restTimeLeft)}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsResting(false)}
                className="bg-secondary px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-secondary/80 transition-all active:scale-95"
              >
                Skip
              </button>
            </div>

            <RestMinigames user={user} />
          </div>
        </div>
      )}
    </div>
  );
}
