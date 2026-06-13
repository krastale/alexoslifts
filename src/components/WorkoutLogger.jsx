import { useState, useEffect } from 'react';
import { Check, Play, Save, X, Plus, Trash2, ChevronLeft, Timer } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { RestMinigames } from './Minigames';

export function WorkoutLogger({ routine, onSave, onCancel }) {
  const { user } = useAuth();
  const [workout, setWorkout] = useState({
    routineName: routine.name,
    date: new Date().toISOString(),
    exercises: routine.exercises.map(ex => ({
      name: ex.name,
      sets: Array.from({ length: ex.sets }, () => ({ weight: '', reps: ex.reps, completed: false }))
    }))
  });

  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  
  // Rest Timer State
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  // Rest Timer effect
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
    const willBeCompleted = !updated.exercises[exIdx].sets[setIdx].completed;
    updated.exercises[exIdx].sets[setIdx].completed = willBeCompleted;
    setWorkout(updated);

    if (willBeCompleted) {
      // Start rest timer (e.g., 60 seconds)
      setIsResting(true);
      setRestTimeLeft(60);
    }
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
        {workout.exercises.map((ex, exIdx) => (
          <div key={exIdx} className="space-y-4">
            <h2 className="text-xl font-bold text-primary flex items-center gap-2">
              <Play className="w-5 h-5 fill-primary" />
              {ex.name}
            </h2>
            
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div className="col-span-1 text-center">Set</div>
                <div className="col-span-4 text-center">Previous</div>
                <div className="col-span-3 text-center">Weight</div>
                <div className="col-span-2 text-center">Reps</div>
                <div className="col-span-2 text-center">Done</div>
              </div>

              {ex.sets.map((set, setIdx) => (
                <div 
                  key={setIdx} 
                  className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl transition-all ${
                    set.completed ? 'bg-primary/5 opacity-60' : 'bg-card border border-border'
                  }`}
                >
                  <div className="col-span-1 text-center font-bold text-sm">
                    {setIdx + 1}
                  </div>
                  <div className="col-span-4 text-center text-xs text-muted-foreground">
                    -
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full bg-secondary border border-border rounded-lg py-2 text-center text-sm outline-none focus:ring-1 focus:ring-primary"
                      value={set.weight}
                      onChange={(e) => updateSet(exIdx, setIdx, 'weight', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full bg-secondary border border-border rounded-lg py-2 text-center text-sm outline-none focus:ring-1 focus:ring-primary"
                      value={set.reps}
                      onChange={(e) => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <button
                      onClick={() => toggleSet(exIdx, setIdx)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        set.completed 
                          ? 'bg-green-500 text-white' 
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
              
              <button
                onClick={() => addSet(exIdx)}
                className="w-full py-2 bg-secondary/50 hover:bg-secondary rounded-lg text-sm font-medium transition-all"
              >
                + Add Set
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Rest Timer Overlay */}
      {isResting && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-lg border-t border-border z-20 animate-in slide-in-from-bottom-full duration-300 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)]">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 p-2 rounded-xl text-primary animate-pulse">
                  <Timer className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Rest Time</h3>
                  <p className="text-primary font-mono text-2xl">{formatTime(restTimeLeft)}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsResting(false)}
                className="bg-secondary px-4 py-2 rounded-lg text-sm font-bold hover:bg-secondary/80"
              >
                Skip
              </button>
            </div>

            {/* Embed the Minigames */}
            <RestMinigames user={user} />
          </div>
        </div>
      )}
    </div>
  );
}
