import { useState, useEffect, useMemo } from 'react';
import { Check, Play, Save, X, Plus, Trash2, ChevronLeft, Timer, Calculator, Trophy, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { RestMinigames } from './Minigames';
import confetti from 'canvas-confetti';

import { EXERCISE_CATEGORIES } from './RoutineBuilder';

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

export function WorkoutLogger({ routine, history, onSave, onCancel, onMinimize }) {
  const { user } = useAuth();
  
  // Last Performance Logic: Accurately capture previous weight/reps for each set
  const lastPerformances = useMemo(() => {
    const last = {};
    if (!history) return last;
    const sortedHistory = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));
    sortedHistory.forEach(session => {
      session.exercises?.forEach(ex => {
        if (!last[ex.name]) last[ex.name] = ex.sets;
      });
    });
    return last;
  }, [history]);

  // Smart Memory: Map weight -> reps for dynamic suggestions
  const exerciseHistoryIndex = useMemo(() => {
    const index = {};
    if (!history) return index;
    history.forEach(session => {
      session.exercises?.forEach(ex => {
        if (!index[ex.name]) index[ex.name] = { weightsToReps: {} };
        ex.sets?.forEach(set => {
          const w = parseFloat(set.weight) || 0;
          const r = parseInt(set.reps) || 0;
          if (w > 0) {
            // Keep the first (most recent) reps seen for this weight
            if (index[ex.name].weightsToReps[w] === undefined) {
              index[ex.name].weightsToReps[w] = r;
            }
          }
        });
      });
    });
    return index;
  }, [history]);

  const [workout, setWorkout] = useState({
    routineName: routine.name,
    date: new Date().toISOString(),
    exercises: routine.exercises.map(ex => {
      const prevSets = lastPerformances[ex.name] || [];
      const repPattern = String(ex.reps).split(',').map(r => parseInt(r.trim()) || 10);
      
      return {
        name: ex.name,
        category: ex.category || 'arms',
        type: ex.type || 'main',
        sets: Array.from({ length: ex.sets }, (_, i) => ({ 
          weight: prevSets[i]?.weight || '', 
          reps: prevSets[i]?.reps || repPattern[i] || repPattern[repPattern.length - 1] || 10, 
          rpe: '', 
          completed: false 
        }))
      };
    })
  });

  const autoComplete = (exIdx) => {
    const updated = { ...workout };
    const ex = updated.exercises[exIdx];
    
    ex.sets = ex.sets.map((set, setIdx) => {
      const lastSetData = lastPerformances[ex.name]?.[setIdx];
      const placeholderWeight = lastSetData?.weight || "0";
      const placeholderReps = lastSetData?.reps || "0";
      
      return {
        ...set,
        weight: set.weight || placeholderWeight,
        reps: set.reps || placeholderReps,
        completed: true
      };
    });
    setWorkout(updated);
  };

  const swapExercise = (exIdx) => {
    const updated = { ...workout };
    const newName = prompt('Enter new exercise name:', updated.exercises[exIdx].name);
    if (newName && newName.trim() !== '') {
      updated.exercises[exIdx].name = newName.trim();
      updated.exercises[exIdx].sets = updated.exercises[exIdx].sets.map(set => ({
        ...set,
        weight: '',
        reps: '',
        completed: false
      }));
      setWorkout(updated);
    }
  };

  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restElapsed, setRestElapsed] = useState(0);
  const [showPlateCalc, setShowPlateCalc] = useState(null); // stores {weight}

  // PR Logic: Now tracks { weight, reps }
  const personalBests = useMemo(() => {
    const bests = {};
    history?.forEach(session => {
      session.exercises?.forEach(ex => {
        ex.sets?.forEach(set => {
          const w = parseFloat(set.weight) || 0;
          const r = parseInt(set.reps) || 0;
          if (!bests[ex.name] || w > bests[ex.name].weight || (w === bests[ex.name].weight && r > bests[ex.name].reps)) {
            bests[ex.name] = { weight: w, reps: r };
          }
        });
      });
    });
    return bests;
  }, [history]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  useEffect(() => {
    let restInterval;
    if (isResting) {
      restInterval = setInterval(() => {
        setRestElapsed(prev => prev + 1);
      }, 1000);
    } else {
      setRestElapsed(0);
    }
    return () => clearInterval(restInterval);
  }, [isResting]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const updateSet = (exIdx, setIdx, field, value) => {
    const updated = { ...workout };
    const set = updated.exercises[exIdx].sets[setIdx];
    set[field] = value;

    // Smart Auto-fill: If typing weight and reps is empty, try to fill reps
    if (field === 'weight' && value !== '') {
      const numW = parseFloat(value);
      const exName = updated.exercises[exIdx].name;
      if (numW && exerciseHistoryIndex[exName]?.weightsToReps[numW] !== undefined) {
        if (!set.reps) {
          set.reps = String(exerciseHistoryIndex[exName].weightsToReps[numW]);
        }
      }
    }

    setWorkout(updated);
  };

  const removeSet = (exIdx, setIdx) => {
    const updated = { ...workout };
    updated.exercises[exIdx].sets.splice(setIdx, 1);
    if (updated.exercises[exIdx].sets.length === 0) {
      updated.exercises.splice(exIdx, 1);
    }
    setWorkout(updated);
  };

  const removeExercise = (exIdx) => {
    const updated = { ...workout };
    updated.exercises.splice(exIdx, 1);
    setWorkout(updated);
  };

  const addExercise = () => {
    setWorkout({
      ...workout,
      exercises: [...workout.exercises, {
        name: '',
        category: 'arms',
        sets: [{ weight: '', reps: 10, rpe: '', completed: false }]
      }]
    });
  };

  const toggleSet = (exIdx, setIdx) => {
    const updated = { ...workout };
    const set = updated.exercises[exIdx].sets[setIdx];
    const willBeCompleted = !set.completed;
    
    if (willBeCompleted) {
      const weight = parseFloat(set.weight) || 0;
      const reps = parseInt(set.reps) || 0;
      const exerciseName = updated.exercises[exIdx].name;
      const best = personalBests[exerciseName];
      
      // Refined PR Detection: Weight > Max OR (Weight == Max AND Reps > MaxReps)
      const isPR = weight > 0 && (!best || weight > best.weight || (weight === best.weight && reps > best.reps));
      
      if (isPR) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#ffffff', '#60a5fa']
        });
        set.isPR = true;
      }
      
      setIsResting(true);
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
      rpe: '',
      completed: false 
    });
    setWorkout(updated);
  };

  const handleFinish = () => {
    onSave({
      ...workout,
      duration: Math.min(Math.floor(elapsed / 60), 300),
      date: new Date().toISOString()
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-[100]">
        <div className="flex items-center gap-3">
          <button onClick={onMinimize} className="p-2 hover:bg-secondary rounded-xl transition-colors text-primary">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="font-black italic uppercase tracking-tighter text-lg leading-tight truncate max-w-[150px]">{workout.routineName}</h2>
            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] tabular-nums">{formatTime(elapsed)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              if (window.confirm("Are you sure you want to cancel this workout? All progress will be lost.")) {
                onCancel();
              }
            }}
            className="p-2.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
            title="Cancel Workout"
          >
            <X className="w-5 h-5" />
          </button>
          <button 
            onClick={handleFinish}
            className="bg-primary text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            Finish
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-40">
        {workout.exercises.map((ex, exIdx) => {
          const best = personalBests[ex.name];
          const hasPR = best && best.weight > 0;
          const bestText = hasPR ? `${best.weight}kg x ${best.reps}` : 'No PR';

          return (
            <div key={exIdx} className="bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-sm">
              <div className="p-5 border-b border-border bg-secondary/30 flex flex-col gap-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      className="bg-transparent font-black italic uppercase tracking-tight text-xl outline-none focus:text-primary w-full"
                      value={ex.name}
                      onChange={(e) => {
                        const updated = { ...workout };
                        updated.exercises[exIdx].name = e.target.value;
                        setWorkout(updated);
                      }}
                      placeholder="Exercise Name"
                    />
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <select
                        className="bg-transparent text-[10px] font-bold text-muted-foreground uppercase tracking-widest outline-none focus:text-primary cursor-pointer border-none p-0"
                        value={ex.category || 'arms'}
                        onChange={(e) => {
                          const updated = { ...workout };
                          updated.exercises[exIdx].category = e.target.value;
                          setWorkout(updated);
                        }}
                      >
                        {EXERCISE_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <span className="w-1 h-1 rounded-full bg-border" />
                      {hasPR ? (
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1">
                          <Trophy className="w-3 h-3 fill-primary" /> {bestText}
                        </p>
                      ) : (
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No PR</p>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => removeExercise(exIdx)}
                    className="p-3 text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                    title="Remove Exercise"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                
                {ex.type === 'additional' && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => swapExercise(exIdx)}
                      className="flex-1 bg-secondary hover:bg-secondary/80 text-primary font-bold text-xs py-2 rounded-xl transition-all"
                    >
                      Swap Exercise
                    </button>
                    <button 
                      onClick={() => autoComplete(exIdx)}
                      className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold text-xs py-2 rounded-xl transition-all"
                    >
                      Auto-Complete
                    </button>
                  </div>
                )}
              </div>
              
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-[30px_1fr_1fr_45px_45px] gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">
                  <div>#</div>
                  <div className="text-center">kg</div>
                  <div className="text-center">Reps</div>
                  <div className="text-center">RPE</div>
                  <div></div>
                </div>

                {ex.sets.map((set, setIdx) => {
                  const lastSetData = lastPerformances[ex.name]?.[setIdx];
                  const placeholderWeight = lastSetData?.weight || "0";
                  const placeholderReps = lastSetData?.reps || "0";

                  return (
                    <div key={setIdx} className={`grid grid-cols-[30px_1fr_1fr_45px_45px] gap-3 items-center transition-all ${set.completed ? 'opacity-40' : ''}`}>
                      <div className="text-sm font-black italic text-muted-foreground/30">{setIdx + 1}</div>
                      
                      <div className="relative group">
                        <input
                          type="number"
                          className="w-full bg-secondary border-none rounded-2xl py-3.5 px-2 text-center text-sm font-bold outline-none focus:ring-2 focus:ring-primary transition-all"
                          value={set.weight}
                          onChange={(e) => updateSet(exIdx, setIdx, 'weight', e.target.value)}
                          placeholder={placeholderWeight}
                        />
                        {!set.weight && lastSetData && (
                          <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-background px-1 text-[8px] font-black text-primary uppercase whitespace-nowrap rounded">Last</span>
                        )}
                        <button 
                          onClick={() => setShowPlateCalc({ weight: parseFloat(set.weight) || parseFloat(placeholderWeight) || 0 })}
                          className="absolute -bottom-1 -right-1 bg-card border border-border p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                          <Calculator className="w-3 h-3 text-primary" />
                        </button>
                      </div>

                      <div className="relative">
                        <input
                          type="number"
                          className="w-full bg-secondary border-none rounded-2xl py-3.5 px-2 text-center text-sm font-bold outline-none focus:ring-2 focus:ring-primary transition-all"
                          value={set.reps}
                          onChange={(e) => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                          placeholder={placeholderReps}
                        />
                        {!set.reps && lastSetData && (
                          <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-background px-1 text-[8px] font-black text-primary uppercase whitespace-nowrap rounded">Last</span>
                        )}
                      </div>

                      <input
                        type="number"
                        className="w-full bg-secondary border-none rounded-2xl py-3.5 px-1 text-center text-xs font-bold outline-none focus:ring-1 focus:ring-primary transition-all"
                        value={set.rpe}
                        onChange={(e) => updateSet(exIdx, setIdx, 'rpe', e.target.value)}
                        placeholder="-"
                      />

                      <div className="flex items-center gap-1.5 h-full">
                        <button
                          onClick={() => toggleSet(exIdx, setIdx)}
                          className={`w-full h-full rounded-2xl flex items-center justify-center transition-all ${
                            set.completed ? 'bg-green-500 text-white' : 'bg-primary/10 text-primary hover:bg-primary/20'
                          }`}
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => removeSet(exIdx, setIdx)}
                          className="text-muted-foreground/30 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                <button
                  onClick={() => addSet(exIdx)}
                  className="w-full py-4 border-2 border-dashed border-border rounded-3xl text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:border-primary transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Set
                </button>
              </div>
            </div>
          );
        })}

        <button
          onClick={addExercise}
          className="w-full py-5 bg-secondary/50 border-2 border-dashed border-border rounded-[2.5rem] text-sm font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-primary hover:border-primary transition-all flex flex-col items-center justify-center gap-2"
        >
          <Plus className="w-6 h-6" />
          Add Exercise
        </button>
      </div>

      {/* Plate Calculator Overlay */}
      {showPlateCalc && (
        <PlateCalculator weight={showPlateCalc.weight} onClose={() => setShowPlateCalc(null)} />
      )}

      {/* Rest Timer Modal */}
      {isResting && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-card border border-border rounded-[3rem] p-8 text-center space-y-8 animate-in zoom-in-95 duration-300">
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-primary">
                <Timer className="w-5 h-5 animate-pulse" />
                <h3 className="text-sm font-black uppercase tracking-[0.3em]">Rest Active</h3>
              </div>
              <p className="text-7xl font-black italic tracking-tighter tabular-nums text-white">
                {formatTime(restElapsed)}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setIsResting(false)}
                className="w-full py-5 bg-primary text-white font-black uppercase tracking-widest rounded-[2rem] shadow-2xl shadow-primary/30 active:scale-95 transition-all"
              >
                End Rest
              </button>
              <button 
                onClick={() => setIsResting(false)}
                className="w-full py-4 text-muted-foreground font-bold text-sm hover:text-white transition-colors"
              >
                Skip Timer
              </button>
            </div>

            <div className="pt-4 border-t border-border/50">
              <RestMinigames user={user} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
