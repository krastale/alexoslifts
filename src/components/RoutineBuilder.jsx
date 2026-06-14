import { useState, useEffect } from 'react';
import { Plus, Trash2, Dumbbell, Save, X, Share2, Download, Library, User, Globe, Lock, Edit2, ChevronUp, ChevronDown } from 'lucide-react';

export const EXERCISE_CATEGORIES = [
  'arms', 'shoulders', 'abs', 'chest', 'back', 'legs', 'gluteus', 'forearms'
];

export const LIBRARY_ROUTINES = [
  {
    id: 'l1',
    name: 'Push Day (PPL)',
    exercises: [
      { name: 'Bench Press', sets: 3, reps: 8, category: 'chest' },
      { name: 'Overhead Press', sets: 3, reps: 10, category: 'shoulders' },
      { name: 'Tricep Pushdowns', sets: 3, reps: 12, category: 'arms' }
    ]
  },
  {
    id: 'l2',
    name: 'Pull Day (PPL)',
    exercises: [
      { name: 'Deadlift', sets: 3, reps: 5, category: 'back' },
      { name: 'Pull Ups', sets: 3, reps: 10, category: 'back' },
      { name: 'Bicep Curls', sets: 3, reps: 12, category: 'arms' }
    ]
  },
  {
    id: 'l3',
    name: 'Leg Day (PPL)',
    exercises: [
      { name: 'Squats', sets: 3, reps: 8, category: 'legs' },
      { name: 'Leg Press', sets: 3, reps: 12, category: 'legs' },
      { name: 'Calf Raises', sets: 4, reps: 15, category: 'legs' }
    ]
  }
];

export function RoutineBuilder({ routines, addRoutine, deleteRoutine, updateRoutine }) {
  const [activeTab, setActiveTab] = useState('mine'); // 'mine' or 'library'
  const [isAdding, setIsAdding] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [newRoutine, setNewRoutine] = useState({
    name: '',
    is_public: true,
    exercises: [{ name: '', sets: 3, reps: 10, category: 'arms' }]
  });

  const handleAddExercise = () => {
    const target = editingRoutine || newRoutine;
    const updated = {
      ...target,
      exercises: [...target.exercises, { name: '', sets: 3, reps: 10, category: 'arms' }]
    };
    editingRoutine ? setEditingRoutine(updated) : setNewRoutine(updated);
  };

  const handleRemoveExercise = (index) => {
    const target = editingRoutine || newRoutine;
    const updatedExercises = [...target.exercises];
    updatedExercises.splice(index, 1);
    const updated = { ...target, exercises: updatedExercises };
    editingRoutine ? setEditingRoutine(updated) : setNewRoutine(updated);
  };

  const handleExerciseChange = (index, field, value) => {
    const target = editingRoutine || newRoutine;
    const updatedExercises = [...target.exercises];
    updatedExercises[index][field] = value;
    const updated = { ...target, exercises: updatedExercises };
    editingRoutine ? setEditingRoutine(updated) : setNewRoutine(updated);
  };

  const moveExercise = (index, direction) => {
    const target = editingRoutine || newRoutine;
    const updatedExercises = [...target.exercises];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= updatedExercises.length) return;
    
    const [movedItem] = updatedExercises.splice(index, 1);
    updatedExercises.splice(newIndex, 0, movedItem);
    
    const updated = { ...target, exercises: updatedExercises };
    editingRoutine ? setEditingRoutine(updated) : setNewRoutine(updated);
  };

  const handleSave = async () => {
    const target = editingRoutine || newRoutine;
    if (target.name && target.exercises.every(ex => ex.name)) {
      if (editingRoutine?.id) {
        await updateRoutine(editingRoutine);
        setEditingRoutine(null);
      } else {
        await addRoutine(target);
        setNewRoutine({ name: '', is_public: true, exercises: [{ name: '', sets: 3, reps: 10, category: 'arms' }] });
        setIsAdding(false);
      }
      setActiveTab('mine');
    }
  };

  const importLibraryRoutine = (routine) => {
    setNewRoutine({
      name: routine.name,
      exercises: routine.exercises,
      is_public: false
    });
    setIsAdding(true);
  };

  const handleShare = (routine) => {
    const shareData = {
      title: 'AlexosLifts Routine',
      text: `Check out my workout routine: ${routine.name}`,
      url: window.location.href
    };
    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(`Check out my workout routine: ${routine.name} at ${window.location.href}`);
      alert('Link copied to clipboard!');
    }
  };

  const routineToEdit = editingRoutine || newRoutine;

  return (
    <div className="p-6 space-y-6 pb-24 lg:pb-6">
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Routines</h1>
        {!isAdding && !editingRoutine && (
          <button
            onClick={() => setIsAdding(true)}
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition-all"
          >
            <Plus className="w-5 h-5" />
            New Routine
          </button>
        )}
      </header>

      {!isAdding && !editingRoutine && (
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

      {(isAdding || editingRoutine) ? (
        <div className="bg-card border border-border p-6 rounded-2xl space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">{editingRoutine ? 'Edit Routine' : 'Create Routine'}</h2>
            <button onClick={() => { setIsAdding(false); setEditingRoutine(null); }} className="text-muted-foreground hover:text-foreground">
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
                  value={routineToEdit.name}
                  onChange={(e) => editingRoutine ? setEditingRoutine({ ...editingRoutine, name: e.target.value }) : setNewRoutine({ ...newRoutine, name: e.target.value })}
                />
              </div>
              <div className="w-fit">
                <label className="block text-sm font-medium mb-2">Privacy</label>
                <button
                  onClick={() => {
                    const updated = { ...routineToEdit, is_public: !routineToEdit.is_public };
                    editingRoutine ? setEditingRoutine(updated) : setNewRoutine(updated);
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all font-bold text-sm ${
                    routineToEdit.is_public ? 'bg-green-500/10 border-green-500/50 text-green-500' : 'bg-secondary border-border text-muted-foreground'
                  }`}
                >
                  {routineToEdit.is_public ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  {routineToEdit.is_public ? 'Public' : 'Private'}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium">Exercises</label>
              {routineToEdit.exercises.map((ex, idx) => (
                <div key={idx} className="p-4 bg-secondary/50 border border-border rounded-xl space-y-4 relative">
                  <div className="absolute top-4 right-4 flex gap-2">
                    <div className="flex flex-col gap-1">
                      <button 
                        onClick={() => moveExercise(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-muted-foreground hover:text-primary disabled:opacity-0 transition-all"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => moveExercise(idx, 'down')}
                        disabled={idx === routineToEdit.exercises.length - 1}
                        className="p-1 text-muted-foreground hover:text-primary disabled:opacity-0 transition-all"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                    <button 
                      onClick={() => handleRemoveExercise(idx)}
                      className="text-red-500 hover:text-red-400 self-center"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  
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
                          onChange={(e) => handleExerciseChange(idx, 'sets', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Reps per Set</label>
                        <input
                          type="text"
                          className="w-full bg-secondary border border-border rounded-lg py-2 px-3 outline-none focus:ring-1 focus:ring-primary"
                          placeholder="e.g. 10 or 10,8,6"
                          value={ex.reps}
                          onChange={(e) => handleExerciseChange(idx, 'reps', e.target.value)}
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
            {editingRoutine ? 'Update Routine' : 'Save Routine'}
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
                    onClick={() => setEditingRoutine(routine)}
                    className="p-2 bg-secondary text-primary hover:bg-primary/20 rounded-lg transition-colors"
                    title="Edit Routine"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
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
