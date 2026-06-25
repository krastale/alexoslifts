import { useState, useEffect, useMemo } from 'react';
import { Check, Play, Save, X, Plus, Trash2, ChevronLeft, Timer, Calculator, Trophy, Info, History } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { RestMinigames } from './Minigames';
import confetti from 'canvas-confetti';

import { EXERCISE_CATEGORIES, SUPERSET_COLORS } from './RoutineBuilder';

function PlateCalculator({ weight, onClose, units = 'kg' }) {
  const isLbs = units === 'lbs';
  const [barWeight, setBarWeight] = useState(isLbs ? 45 : 20);
  const [isCustomBar, setIsCustomBar] = useState(false);
  const [customBarWeight, setCustomBarWeight] = useState('');

  const targetSide = Math.max(0, (weight - barWeight) / 2);
  const availablePlates = isLbs ? [45, 35, 25, 10, 5, 2.5] : [20, 15, 10, 5, 2.5, 1.25];
  
  let remaining = targetSide;
  const platesNeeded = [];

  availablePlates.forEach(plate => {
    while (remaining >= plate) {
      platesNeeded.push(plate);
      remaining = Math.round((remaining - plate) * 100) / 100;
    }
  });

  const getPlateStyle = (plate) => {
    if (isLbs) {
      switch (plate) {
        case 45:
          return { height: 'h-28', width: 'w-4', bg: 'bg-red-500 border-red-700', textColor: 'text-red-100', label: '45' };
        case 35:
          return { height: 'h-26', width: 'w-3.5', bg: 'bg-blue-500 border-blue-700', textColor: 'text-blue-100', label: '35' };
        case 25:
          return { height: 'h-24', width: 'w-3.5', bg: 'bg-yellow-500 border-yellow-700', textColor: 'text-yellow-950', label: '25' };
        case 10:
          return { height: 'h-20', width: 'w-3', bg: 'bg-green-600 border-green-800', textColor: 'text-green-100', label: '10' };
        case 5:
          return { height: 'h-16', width: 'w-2.5', bg: 'bg-zinc-200 border-zinc-400', textColor: 'text-zinc-800', label: '5' };
        case 2.5:
          return { height: 'h-12', width: 'w-2.5', bg: 'bg-zinc-800 border-zinc-950', textColor: 'text-zinc-300', label: '2.5' };
        default:
          return { height: 'h-10', width: 'w-2', bg: 'bg-zinc-500 border-zinc-600', textColor: 'text-white', label: '' };
      }
    } else {
      switch (plate) {
        case 20:
          return { height: 'h-28', width: 'w-4', bg: 'bg-blue-500 border-blue-700', textColor: 'text-blue-100', label: '20' };
        case 15:
          return { height: 'h-24', width: 'w-3.5', bg: 'bg-yellow-500 border-yellow-700', textColor: 'text-yellow-950', label: '15' };
        case 10:
          return { height: 'h-22', width: 'w-3.5', bg: 'bg-green-600 border-green-800', textColor: 'text-green-100', label: '10' };
        case 5:
          return { height: 'h-18', width: 'w-3', bg: 'bg-zinc-200 border-zinc-400', textColor: 'text-zinc-800', label: '5' };
        case 2.5:
          return { height: 'h-14', width: 'w-3', bg: 'bg-zinc-800 border-zinc-950', textColor: 'text-zinc-300', label: '2.5' };
        case 1.25:
          return { height: 'h-10', width: 'w-2.5', bg: 'bg-zinc-400 border-zinc-500', textColor: 'text-zinc-900', label: '1.2' };
        default:
          return { height: 'h-10', width: 'w-2', bg: 'bg-zinc-500 border-zinc-600', textColor: 'text-white', label: '' };
      }
    }
  };

  const barOptions = isLbs ? [
    { label: '45lbs', value: 45 },
    { label: '35lbs', value: 35 },
    { label: '25lbs', value: 25 },
    { label: '15lbs', value: 15 },
    { label: '0lbs', value: 0 },
  ] : [
    { label: '20kg', value: 20 },
    { label: '15kg', value: 15 },
    { label: '10kg', value: 10 },
    { label: '8kg', value: 8 },
    { label: '0kg', value: 0 },
  ];

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
          <p className="text-4xl font-black text-primary">{weight} <span className="text-sm font-normal text-muted-foreground uppercase tracking-widest">{units}</span></p>
          <p className="text-xs text-muted-foreground">Using {barWeight}{units} Barbell ({platesNeeded.length > 0 ? `${(weight - barWeight).toFixed(1)}${units} plates total` : 'no extra plates'})</p>
        </div>

        {/* Barbell Selector UI */}
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest">Barbell weight</label>
          <div className="grid grid-cols-5 gap-1 p-1 bg-secondary/50 rounded-xl">
            {barOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setBarWeight(opt.value);
                  setIsCustomBar(false);
                }}
                className={`py-2 px-1 rounded-lg text-[10px] font-bold transition-all ${
                  !isCustomBar && barWeight === opt.value
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setIsCustomBar(true)}
              className={`py-2 px-1 rounded-lg text-[10px] font-bold transition-all ${
                isCustomBar
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Custom
            </button>
          </div>

          {isCustomBar && (
            <div className="flex gap-2 items-center mt-2 animate-in fade-in slide-in-from-top-1 duration-150">
              <input
                type="number"
                step="0.5"
                min="0"
                className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-primary text-center"
                placeholder="Custom Bar Weight"
                value={customBarWeight}
                onChange={(e) => {
                  setCustomBarWeight(e.target.value);
                  const val = parseFloat(e.target.value) || 0;
                  setBarWeight(val);
                }}
              />
              <span className="text-xs font-bold text-muted-foreground uppercase">{units}</span>
            </div>
          )}
        </div>

        {/* 2D Barbell Plate Visualizer */}
        <div className="relative flex items-center justify-center py-6 bg-secondary/15 border border-border/40 rounded-2xl overflow-hidden min-h-[130px] shadow-inner">
          {/* Barbell Sleeve */}
          <div className="absolute left-6 right-6 h-3 bg-zinc-700 rounded-full"></div>
          
          {/* Collar (Stopper) */}
          <div className="absolute left-10 w-4 h-24 bg-zinc-800 border border-zinc-700 rounded-md z-10 flex items-center justify-center">
            <div className="w-1.5 h-full bg-zinc-900"></div>
          </div>
          
          {/* Stacked Plates */}
          <div className="absolute left-[56px] flex items-center gap-[2px] z-20">
            {platesNeeded.length > 0 ? (
              platesNeeded.map((p, idx) => {
                const info = getPlateStyle(p);
                return (
                  <div 
                    key={idx} 
                    className={`${info.height} ${info.width} ${info.bg} border rounded-md flex items-center justify-center shadow-lg relative group transition-all duration-300 hover:scale-105`}
                    title={`${p} ${units} Plate`}
                  >
                    <span className={`text-[8px] font-black tracking-tighter select-none pointer-events-none origin-center rotate-90 whitespace-nowrap ${info.textColor}`}>
                      {info.label}
                    </span>
                  </div>
                );
              })
            ) : (
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Empty Sleeve</span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Per Side:</p>
          {platesNeeded.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {platesNeeded.map((p, i) => {
                const isHeavy = isLbs ? p >= 35 : p >= 15;
                const isMedium = isLbs ? p >= 25 : p >= 10;
                const isLight = isLbs ? p >= 10 : p >= 5;
                return (
                  <div key={i} className={`px-4 py-2 rounded-xl font-bold border-b-4 transition-all ${
                    isHeavy ? 'bg-red-500 border-red-700 text-white' :
                    isMedium ? 'bg-blue-500 border-blue-700 text-white' :
                    isLight ? 'bg-yellow-500 border-yellow-700 text-black' :
                    'bg-secondary border-border text-foreground'
                  }`}>
                    {p} {units}
                  </div>
                );
              })}
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

export function WorkoutLogger({ routine, history, profile, onSave, onCancel, onMinimize }) {
  const { user } = useAuth();
  const [restStartTime, setRestStartTime] = useState(null);
  const [openHistories, setOpenHistories] = useState({});
  const [nextUpSet, setNextUpSet] = useState(null);

  const determineNextSet = (exIdx, setIdx) => {
    const currentEx = workout.exercises[exIdx];
    const group = currentEx.superset_group;

    if (group) {
      const groupExs = workout.exercises
        .map((ex, idx) => ({ ...ex, originalIndex: idx }))
        .filter(ex => ex.superset_group === group);

      const positionInGroup = groupExs.findIndex(ex => ex.originalIndex === exIdx);
      const nextPosition = (positionInGroup + 1) % groupExs.length;
      const nextEx = groupExs[nextPosition];
      const targetSetIdx = nextPosition === 0 ? setIdx + 1 : setIdx;

      if (nextEx.sets[targetSetIdx]) {
        const lastPerf = lastPerformances[nextEx.name]?.[targetSetIdx];
        return {
          exerciseName: nextEx.name,
          exerciseIndex: nextEx.originalIndex,
          setIndex: targetSetIdx,
          weight: nextEx.sets[targetSetIdx].weight || lastPerf?.weight || '',
          reps: nextEx.sets[targetSetIdx].reps || lastPerf?.reps || 10
        };
      }
    }

    if (currentEx.sets[setIdx + 1]) {
      return {
        exerciseName: currentEx.name,
        exerciseIndex: exIdx,
        setIndex: setIdx + 1,
        weight: currentEx.sets[setIdx + 1].weight || '',
        reps: currentEx.sets[setIdx + 1].reps || 10
      };
    }

    if (workout.exercises[exIdx + 1]) {
      const nextEx = workout.exercises[exIdx + 1];
      const lastPerf = lastPerformances[nextEx.name]?.[0];
      return {
        exerciseName: nextEx.name,
        exerciseIndex: exIdx + 1,
        setIndex: 0,
        weight: nextEx.sets[0].weight || lastPerf?.weight || '',
        reps: nextEx.sets[0].reps || lastPerf?.reps || 10
      };
    }

    return null;
  };

  const handleCloseRestTimer = () => {
    setIsResting(false);
    if (nextUpSet) {
      setTimeout(() => {
        const el = document.getElementById(`set-row-${nextUpSet.exerciseIndex}-${nextUpSet.setIndex}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-2', 'ring-primary', 'scale-[1.01]', 'duration-300');
          setTimeout(() => {
            el.classList.remove('ring-2', 'ring-primary', 'scale-[1.01]');
          }, 1500);
        }
      }, 100);
    }
  };

  const toggleHistory = (name) => {
    setOpenHistories(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const getExerciseHistory = (exerciseName) => {
    if (!history || !exerciseName) return [];
    const list = [];
    history.forEach(session => {
      if (session.routine_name === 'Rest Day' || !session.exercises) return;
      const found = session.exercises.find(ex => ex.name?.toLowerCase() === exerciseName.toLowerCase());
      if (found && found.sets && found.sets.length > 0) {
        list.push({
          date: session.date,
          sets: found.sets
        });
      }
    });
    return list;
  };
  
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
    if (isResting && restStartTime) {
      setRestElapsed(Math.floor((Date.now() - restStartTime) / 1000));
      
      restInterval = setInterval(() => {
        setRestElapsed(Math.floor((Date.now() - restStartTime) / 1000));
      }, 1000);
    } else {
      setRestElapsed(0);
    }
    return () => clearInterval(restInterval);
  }, [isResting, restStartTime]);

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
      setRestStartTime(Date.now());

      const next = determineNextSet(exIdx, setIdx);
      setNextUpSet(next);
    } else {
      set.isPR = false;
      setNextUpSet(null);
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
    const cleanedExercises = workout.exercises
      .map(ex => ({
        ...ex,
        sets: ex.sets.filter(s => s.completed && s.weight !== '' && s.reps !== '')
      }))
      .filter(ex => ex.sets.length > 0);

    if (cleanedExercises.length === 0) {
      if (!window.confirm("You haven't logged any completed sets. Save this workout anyway?")) {
        return;
      }
    }

    onSave({
      ...workout,
      exercises: cleanedExercises,
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

          const groupColor = ex.superset_group ? (SUPERSET_COLORS[ex.superset_group] || 'border-primary text-primary bg-primary/10') : '';

          return (
            <div key={exIdx} className={`bg-card border rounded-[2.5rem] overflow-hidden shadow-sm transition-all duration-300 ${
              ex.superset_group ? `border-l-8 ${groupColor.split(' ')[0]}` : 'border-border'
            }`}>
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
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <button
                        type="button"
                        onClick={() => toggleHistory(ex.name)}
                        className="text-[10px] font-bold text-muted-foreground hover:text-primary uppercase tracking-widest flex items-center gap-1 transition-colors"
                      >
                        <History className="w-3.5 h-3.5 text-muted-foreground/80 hover:text-primary" /> History
                      </button>
                      {ex.superset_group && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-border" />
                          <span className={`inline-flex items-center gap-1 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${groupColor}`}>
                            Superset {ex.superset_group}
                          </span>
                        </>
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

              {openHistories[ex.name] && (
                <div className="px-5 pb-4 pt-4 border-b border-border bg-secondary/10 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Exercise History</p>
                  {getExerciseHistory(ex.name).length > 0 ? (
                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 no-scrollbar text-xs">
                      {getExerciseHistory(ex.name).map((hEntry, hIdx) => (
                        <div key={hIdx} className="flex justify-between items-center bg-secondary/35 border border-border/20 px-3 py-2 rounded-xl">
                          <span className="font-bold text-muted-foreground">{new Date(hEntry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          <span className="font-black text-foreground">
                            {hEntry.sets.map((s, sIdx) => `${s.weight}kg x ${s.reps}`).join(' • ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No past sessions recorded.</p>
                  )}
                </div>
              )}
              
              <div className="p-5 space-y-4">
                {lastPerformances[ex.name] && (
                  <div className="bg-secondary/20 border border-border/40 p-3 rounded-[1.5rem] flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 mb-1 text-xs">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Last Session sets:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {lastPerformances[ex.name].map((s, idx) => (
                        <span key={idx} className="bg-secondary px-2.5 py-1 rounded-xl text-[10px] font-black text-primary border border-border/40">
                          S{idx+1}: {s.weight}kg x {s.reps}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

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
                    <div 
                      key={setIdx} 
                      id={`set-row-${exIdx}-${setIdx}`}
                      className={`grid grid-cols-[30px_1fr_1fr_45px_45px] gap-3 items-center transition-all duration-300 rounded-2xl p-1 ${set.completed ? 'opacity-40' : ''}`}
                    >
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
        <PlateCalculator weight={showPlateCalc.weight} units={profile?.units || 'kg'} onClose={() => setShowPlateCalc(null)} />
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

            {nextUpSet && (
              <div className="bg-secondary/40 border border-border/60 p-4 rounded-2xl text-center space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Next Up</span>
                <p className="font-black text-white text-base truncate uppercase">{nextUpSet.exerciseName}</p>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Set {nextUpSet.setIndex + 1} • {nextUpSet.weight ? `${nextUpSet.weight}${profile?.units || 'kg'}` : `No ${profile?.units || 'kg'}`} x {nextUpSet.reps} reps
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleCloseRestTimer}
                className="w-full py-5 bg-primary text-white font-black uppercase tracking-widest rounded-[2rem] shadow-2xl shadow-primary/30 active:scale-95 transition-all"
              >
                End Rest
              </button>
              <button 
                onClick={handleCloseRestTimer}
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
