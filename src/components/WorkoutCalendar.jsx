import { useState } from 'react';
import { ChevronLeft, ChevronRight, Dumbbell, Coffee } from 'lucide-react';

export function WorkoutCalendar({ history }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);

  const workoutDays = history.reduce((acc, workout) => {
    if (!workout.date) return acc;
    const date = workout.date.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(workout);
    return acc;
  }, {});

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const [selectedDate, setSelectedDate] = useState(null);

  return (
    <div className="bg-card border border-border rounded-3xl p-6 space-y-6 shadow-sm">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg">{monthName} {year}</h3>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-muted-foreground py-2">{d}</div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="p-2"></div>
        ))}
        {Array.from({ length: days }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const workouts = workoutDays[dateStr];
          const isToday = new Date().toISOString().split('T')[0] === dateStr;

          const hasWorkout = workouts && workouts.some(w => {
            const name = (w.routine_name || w.routineName || '').trim().toLowerCase();
            return name !== 'rest day';
          });
          const todayStr = new Date().toISOString().split('T')[0];
          const isPastOrToday = dateStr <= todayStr;
          const hasRest = (workouts && workouts.some(w => {
            const name = (w.routine_name || w.routineName || '').trim().toLowerCase();
            return name === 'rest day';
          })) || (!hasWorkout && isPastOrToday);

          let bgClass = 'hover:bg-secondary';
          let textClass = 'font-medium';
          let dotColor = 'bg-primary';

          if (hasWorkout) {
            bgClass = 'bg-primary/10 text-primary';
            textClass = 'font-bold';
            dotColor = 'bg-primary';
          } else if (hasRest) {
            bgClass = 'bg-amber-500/10 text-amber-500';
            textClass = 'font-bold';
            dotColor = 'bg-amber-500';
          }

          return (
            <button
              key={day}
              onClick={() => setSelectedDate(dateStr)}
              className={`relative p-2 h-10 w-full rounded-xl text-sm transition-all flex items-center justify-center
                ${bgClass} ${textClass}
                ${isToday ? 'border border-primary' : ''}
                ${selectedDate === dateStr ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
              `}
            >
              {day}
              {workouts && workouts.length > 0 && (
                <div className={`absolute bottom-1 w-1 h-1 ${dotColor} rounded-full`}></div>
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Activity on {new Date(selectedDate).toLocaleDateString()}
          </h4>
          {workoutDays[selectedDate] && workoutDays[selectedDate].length > 0 ? (
            workoutDays[selectedDate].map(workout => {
              const isRest = (workout.routine_name || workout.routineName || '').trim().toLowerCase() === 'rest day';
              return (
                <div key={workout.id} className="bg-secondary/50 p-4 rounded-2xl flex justify-between items-center border border-border/50">
                  <div>
                    <p className="font-bold flex items-center gap-2">
                      {workout.routine_name || workout.routineName}
                      {isRest && <span className="text-sm">☕</span>}
                    </p>
                    {!isRest ? (
                      <p className="text-xs text-muted-foreground">{workout.exercises?.length || 0} Exercises • {workout.duration || 0} min</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Rest & recovery day</p>
                    )}
                  </div>
                  {isRest ? (
                    <Coffee className="w-5 h-5 text-amber-500" />
                  ) : (
                    <Dumbbell className="w-5 h-5 text-primary" />
                  )}
                </div>
              );
            })
          ) : (
            <div className="bg-secondary/50 p-4 rounded-2xl flex justify-between items-center border border-border/50">
              <div>
                <p className="font-bold flex items-center gap-2">
                  {selectedDate <= new Date().toISOString().split('T')[0] ? (
                    <>Rest Day <span className="text-sm">☕</span></>
                  ) : (
                    <>No Activity Scheduled</>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedDate <= new Date().toISOString().split('T')[0] 
                    ? 'Auto-generated rest & recovery day' 
                    : 'Plan your next workout in the Routine Builder'
                  }
                </p>
              </div>
              {selectedDate <= new Date().toISOString().split('T')[0] ? (
                <Coffee className="w-5 h-5 text-amber-500" />
              ) : (
                <Dumbbell className="w-5 h-5 text-muted-foreground/30" />
              )}
            </div>
          )}
        </div>
      )}

      {!selectedDate && (
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground italic">Select a marked day to see workout details</p>
        </div>
      )}
    </div>
  );
}
