import { useState, useEffect } from 'react';
import { Check, Play, Save, X, Plus, Trash2, ChevronLeft } from 'lucide-react';

export function WorkoutLogger({ routine, onSave, onCancel }) {
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

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

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
    updated.exercises[exIdx].sets[setIdx].completed = !updated.exercises[exIdx].sets[setIdx].completed;
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

  const removeSet = (exIdx, setIdx) => {
    const updated = { ...workout };
    updated.exercises[exIdx].sets.splice(setIdx, 1);
    setWorkout(updated);
  };

  const handleFinish = () => {
    // Only save completed sets or all sets? Let's save all but maybe filter empty ones
    onSave({
      ...workout,
      duration: elapsed,
      date: new Date().toISOString()
    });
  };

  return (
    <div className="min-h-screen bg-background pb-32">
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
    </div>
  );
}
