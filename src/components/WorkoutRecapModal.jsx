import { X, Trophy, Dumbbell, Coffee, Clock, TrendingUp, Trash2, Calendar, Layers } from 'lucide-react';

export function WorkoutRecapModal({ workout, profile, onClose, onDelete }) {
  if (!workout) return null;

  const routineName = workout.routine_name || workout.routineName || 'Workout Session';
  const isRestDay = routineName.trim().toLowerCase() === 'rest day';
  const units = profile?.units || 'kg';

  // Calculate workout statistics
  let totalVolume = 0;
  let totalSets = 0;
  let totalReps = 0;
  let prCount = 0;

  if (workout.exercises && Array.isArray(workout.exercises)) {
    workout.exercises.forEach(ex => {
      if (ex.sets && Array.isArray(ex.sets)) {
        ex.sets.forEach(set => {
          const w = parseFloat(set.weight) || 0;
          const r = parseInt(set.reps) || 0;
          totalVolume += (w * r);
          totalSets += 1;
          totalReps += r;
          if (set.isPR) prCount += 1;
        });
      }
    });
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this workout entry from your history?')) {
      if (onDelete) {
        await onDelete(workout.id);
      }
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-card border border-border w-full max-w-lg rounded-[2.5rem] p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar my-auto relative">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border/50 pb-5">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${
              isRestDay ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'
            }`}>
              {isRestDay ? <Coffee className="w-6 h-6" /> : <Dumbbell className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black italic uppercase tracking-tight text-foreground truncate max-w-[220px] sm:max-w-[280px]">
                  {routineName}
                </h2>
                {isRestDay && (
                  <span className="text-xs bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full font-bold uppercase">
                    Rest
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                {formatDate(workout.date)} • {formatTime(workout.date)}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rest Day Spec Card */}
        {isRestDay ? (
          <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-3xl text-center space-y-3">
            <div className="w-12 h-12 bg-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
              <Coffee className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-tight text-amber-500 text-lg">Rest & Recovery Day</h3>
              <p className="text-xs font-medium text-muted-foreground max-w-xs mx-auto mt-1">
                You logged a dedicated rest day. Recovery is where your muscles rebuild, repair, and grow stronger.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Metric Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-secondary/30 border border-border/40 p-3.5 rounded-2xl text-center">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Total Volume</span>
                <span className="text-lg font-black text-primary italic mt-0.5 block">
                  {Math.round(totalVolume).toLocaleString()} <span className="text-[10px] font-normal not-italic text-muted-foreground">{units}</span>
                </span>
              </div>

              <div className="bg-secondary/30 border border-border/40 p-3.5 rounded-2xl text-center">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Duration</span>
                <span className="text-lg font-black text-foreground italic mt-0.5 block">
                  {workout.duration || 0} <span className="text-[10px] font-normal not-italic text-muted-foreground">min</span>
                </span>
              </div>

              <div className="bg-secondary/30 border border-border/40 p-3.5 rounded-2xl text-center">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Total Sets</span>
                <span className="text-lg font-black text-foreground italic mt-0.5 block">
                  {totalSets} <span className="text-[10px] font-normal not-italic text-muted-foreground">sets</span>
                </span>
              </div>

              <div className="bg-secondary/30 border border-border/40 p-3.5 rounded-2xl text-center">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">PRs Hit</span>
                <span className="text-lg font-black text-yellow-500 italic mt-0.5 block flex items-center justify-center gap-1">
                  <Trophy className="w-4 h-4 fill-yellow-500" />
                  {prCount}
                </span>
              </div>
            </div>

            {/* Exercise Breakdown */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Exercise Breakdown ({workout.exercises?.length || 0})
              </h3>

              {workout.exercises && workout.exercises.length > 0 ? (
                <div className="space-y-4">
                  {workout.exercises.map((ex, exIdx) => {
                    // Calculate exercise volume and max weight
                    let exVol = 0;
                    let maxW = 0;
                    let max1RM = 0;

                    ex.sets?.forEach(s => {
                      const w = parseFloat(s.weight) || 0;
                      const r = parseInt(s.reps) || 0;
                      exVol += (w * r);
                      if (w > maxW) maxW = w;
                      const est = r > 0 ? w * (1 + r / 30) : 0;
                      if (est > max1RM) max1RM = est;
                    });

                    return (
                      <div key={exIdx} className="bg-secondary/20 border border-border/60 rounded-3xl p-4 space-y-3">
                        <div className="flex justify-between items-start gap-2 border-b border-border/30 pb-2.5">
                          <div>
                            <h4 className="font-black text-base uppercase tracking-tight text-foreground">{ex.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-secondary rounded-full text-muted-foreground border border-border/40">
                                {ex.category || 'general'}
                              </span>
                              <span className="text-[10px] font-bold text-muted-foreground">
                                Vol: {Math.round(exVol)} {units}
                              </span>
                            </div>
                          </div>
                          {maxW > 0 && (
                            <div className="text-right">
                              <span className="text-[9px] font-black uppercase text-muted-foreground block">Peak / Est. 1RM</span>
                              <span className="text-xs font-black text-primary">
                                {maxW}{units} / {Math.round(max1RM)}{units}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Sets List */}
                        <div className="space-y-1.5">
                          <div className="grid grid-cols-[30px_1fr_1fr_45px] gap-2 text-[9px] font-black text-muted-foreground uppercase px-2">
                            <div>SET</div>
                            <div>WEIGHT</div>
                            <div>REPS</div>
                            <div className="text-center">INFO</div>
                          </div>

                          {ex.sets?.map((set, setIdx) => (
                            <div 
                              key={setIdx}
                              className={`grid grid-cols-[30px_1fr_1fr_45px] gap-2 items-center text-xs p-2 rounded-xl border transition-all ${
                                set.isPR 
                                  ? 'bg-yellow-500/10 border-yellow-500/30 font-bold' 
                                  : 'bg-card/50 border-border/30 font-medium'
                              }`}
                            >
                              <div className="font-black text-muted-foreground">#{setIdx + 1}</div>
                              <div className="font-bold text-foreground">{set.weight || 0} <span className="text-[10px] text-muted-foreground font-normal">{units}</span></div>
                              <div className="font-bold text-foreground">{set.reps || 0} <span className="text-[10px] text-muted-foreground font-normal">reps</span></div>
                              <div className="flex items-center justify-center">
                                {set.isPR ? (
                                  <span className="bg-yellow-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 uppercase tracking-tighter shadow-sm">
                                    <Trophy className="w-2.5 h-2.5 fill-black" /> PR
                                  </span>
                                ) : set.rpe ? (
                                  <span className="text-[9px] font-bold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                                    @{set.rpe}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground/30">-</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 bg-secondary/10 rounded-2xl border border-dashed border-border text-muted-foreground text-xs italic">
                  No exercises logged for this workout.
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-border/50 flex gap-3">
          <button
            type="button"
            onClick={handleDelete}
            className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Entry
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-primary hover:bg-primary/90 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-primary/20 transition-all"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
