import { useState, useEffect } from 'react';
import { Plus, Trash2, Dumbbell, Save, X, Share2, Download, Library, User, Globe, Lock } from 'lucide-react';

export const EXERCISE_CATEGORIES = [
  'arms', 'shoulders', 'abs', 'chest', 'back', 'legs', 'gluteus', 'forearms'
];

// ... (LIBRARY_ROUTINES unchanged)

export function RoutineBuilder({ routines, addRoutine, deleteRoutine }) {
  const [activeTab, setActiveTab] = useState('mine'); // 'mine' or 'library'
  const [isAdding, setIsAdding] = useState(false);
  const [newRoutine, setNewRoutine] = useState({
    name: '',
    is_public: true,
    exercises: [{ name: '', sets: 3, reps: 10, category: 'arms' }]
  });

  // ... (useEffect for importRoutine unchanged)

  const handleAddExercise = () => {
    setNewRoutine({
      ...newRoutine,
      exercises: [...newRoutine.exercises, { name: '', sets: 3, reps: 10, category: 'arms' }]
    });
  };

  const handleRemoveExercise = (index) => {
    const updated = [...newRoutine.exercises];
    updated.splice(index, 1);
    setNewRoutine({ ...newRoutine, exercises: updated });
  };

  const handleExerciseChange = (index, field, value) => {
    const updated = [...newRoutine.exercises];
    updated[index][field] = value;
    setNewRoutine({ ...newRoutine, exercises: updated });
  };

  const handleSave = () => {
    if (newRoutine.name && newRoutine.exercises.every(ex => ex.name)) {
      addRoutine(newRoutine);
      setNewRoutine({ name: '', is_public: true, exercises: [{ name: '', sets: 3, reps: 10, category: 'arms' }] });
      setIsAdding(false);
      setActiveTab('mine');
    }
  };

  // ... (handleShare and importLibraryRoutine unchanged)

  return (
    <div className="p-6 space-y-6 pb-24 lg:pb-6">
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Routines</h1>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition-all"
          >
            <Plus className="w-5 h-5" />
            New Routine
          </button>
        )}
      </header>

      {!isAdding && (
        <div className="flex gap-2 p-1 bg-secondary/50 rounded-xl overflow-x-auto no-scrollbar w-full max-w-sm">
          <button 
            onClick={() => setActiveTab('mine')} 
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-bold transition-all ${activeTab === 'mine' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground'}`}
          >
            <User className="w-4 h-4" /> My Routines
          </button>
          <button 
            onClick={() => setActiveTab('library')} 
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-bold transition-all ${activeTab === 'library' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground'}`}
          >
            <Library className="w-4 h-4" /> Library
          </button>
        </div>
      )}

      {isAdding ? (
        <div className="bg-card border border-border p-6 rounded-2xl space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Create Routine</h2>
            <button onClick={() => setIsAdding(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Routine Name</label>
                <input
                  type="text"
                  className="w-full bg-secondary border border-border rounded-lg py-2.5 px-4 outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="e.g., Upper Body / Push Day"
                  value={newRoutine.name}
                  onChange={(e) => setNewRoutine({ ...newRoutine, name: e.target.value })}
                />
              </div>
              <div className="w-fit">
                <label className="block text-sm font-medium mb-2">Privacy</label>
                <button
                  onClick={() => setNewRoutine({ ...newRoutine, is_public: !newRoutine.is_public })}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all font-bold text-sm ${
                    newRoutine.is_public ? 'bg-green-500/10 border-green-500/50 text-green-500' : 'bg-secondary border-border text-muted-foreground'
                  }`}
                >
                  {newRoutine.is_public ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  {newRoutine.is_public ? 'Public' : 'Private'}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium">Exercises</label>
              {newRoutine.exercises.map((ex, idx) => (
                <div key={idx} className="p-4 bg-secondary/50 border border-border rounded-xl space-y-4 relative">
                  <button 
                    onClick={() => handleRemoveExercise(idx)}
                    className="absolute top-4 right-4 text-red-500 hover:text-red-400"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs text-muted-foreground mb-1">Exercise Name</label>
                      <input
                        type="text"
                        className="w-full bg-secondary border border-border rounded-lg py-2 px-3 outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Exercise Name"
                        value={ex.name}
                        onChange={(e) => handleExerciseChange(idx, 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Category</label>
                      <select
                        className="w-full bg-secondary border border-border rounded-lg py-2 px-3 outline-none focus:ring-1 focus:ring-primary appearance-none capitalize"
                        value={ex.category}
                        onChange={(e) => handleExerciseChange(idx, 'category', e.target.value)}
                      >
                        {EXERCISE_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Sets</label>
                        <input
                          type="number"
                          className="w-full bg-secondary border border-border rounded-lg py-2 px-3 outline-none focus:ring-1 focus:ring-primary"
                          value={ex.sets}
                          onChange={(e) => handleExerciseChange(idx, 'sets', parseInt(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Reps</label>
                        <input
                          type="number"
                          className="w-full bg-secondary border border-border rounded-lg py-2 px-3 outline-none focus:ring-1 focus:ring-primary"
                          value={ex.reps}
                          onChange={(e) => handleExerciseChange(idx, 'reps', parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleAddExercise}
              className="w-full py-3 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:text-primary hover:border-primary transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Exercise
            </button>
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Save Routine
          </button>
        </div>
      ) : activeTab === 'mine' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {routines.map((routine) => (
            <div key={routine.id} className="bg-card border border-border p-5 rounded-2xl hover:border-primary/50 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-1.5 p-1 rounded-md ${routine.is_public ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {routine.is_public ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{routine.name}</h3>
                    <p className="text-muted-foreground text-sm">{routine.exercises.length} Exercises</p>
                  </div>
                </div>
                <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleShare(routine)}
                    className="p-2 bg-secondary text-primary hover:bg-primary/20 rounded-lg transition-colors"
                    title="Share Routine"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => deleteRoutine(routine.id)}
                    className="p-2 bg-secondary text-muted-foreground hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-colors"
                    title="Delete Routine"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 mb-6">
                {routine.exercises.slice(0, 3).map((ex, i) => (
                  <div key={i} className="text-sm flex justify-between items-center text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>
                      <span>{ex.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-secondary rounded text-muted-foreground/70">{ex.category || 'arms'}</span>
                      <span>{ex.sets}x{ex.reps}</span>
                    </div>
                  </div>
                ))}
                {routine.exercises.length > 3 && (
                  <p className="text-xs text-muted-foreground italic">+{routine.exercises.length - 3} more...</p>
                )}
              </div>

              <button 
                className="w-full py-2 bg-secondary group-hover:bg-primary/10 group-hover:text-primary rounded-lg font-bold transition-all text-sm"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('start-workout', { detail: routine }));
                }}
              >
                Start Workout
              </button>
            </div>
          ))}

          {routines.length === 0 && (
            <div className="md:col-span-2 text-center py-12 bg-secondary/20 border-2 border-dashed border-border rounded-2xl">
              <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No routines yet. Check the Library or create your first one!</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {LIBRARY_ROUTINES.map((routine) => (
            <div key={routine.id} className="bg-card border border-border p-5 rounded-2xl hover:border-primary/50 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">{routine.name}</h3>
                  <p className="text-muted-foreground text-sm">{routine.exercises.length} Exercises</p>
                </div>
                <button 
                  onClick={() => importLibraryRoutine(routine)}
                  className="p-2 bg-secondary text-primary hover:bg-primary/20 rounded-lg transition-colors"
                  title="Import Routine"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-2 mb-6">
                {routine.exercises.slice(0, 3).map((ex, i) => (
                  <div key={i} className="text-sm flex justify-between items-center text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>
                      <span>{ex.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-secondary rounded text-muted-foreground/70">{ex.category || 'arms'}</span>
                      <span>{ex.sets}x{ex.reps}</span>
                    </div>
                  </div>
                ))}
                {routine.exercises.length > 3 && (
                  <p className="text-xs text-muted-foreground italic">+{routine.exercises.length - 3} more...</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
