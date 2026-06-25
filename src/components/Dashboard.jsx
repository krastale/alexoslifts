import { useMemo, useState, useEffect } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { Trophy, Flame, Dumbbell, TrendingUp, Activity, PieChart as PieIcon, Trash2, Calendar, Coffee, ChevronDown, Sparkles } from 'lucide-react';

const MUSCLE_COLORS = {
  'chest': '#3b82f6',
  'back': '#10b981',
  'legs': '#f59e0b',
  'shoulders': '#8b5cf6',
  'arms': '#ef4444',
  'abs': '#06b6d4',
  'gluteus': '#d946ef',
  'forearms': '#84cc16',
  'other': '#71717a'
};

const identifyMuscleGroup = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('bench') || n.includes('chest') || n.includes('fly') || n.includes('pushup')) return 'chest';
  if (n.includes('row') || n.includes('pullup') || n.includes('pulldown') || n.includes('back') || n.includes('deadlift')) return 'back';
  if (n.includes('squat') || n.includes('lunge') || n.includes('leg') || n.includes('glute') || n.includes('calf') || n.includes('thigh')) return 'legs';
  if (n.includes('press') || n.includes('shoulder') || n.includes('lateral') || n.includes('deltoid')) return 'shoulders';
  if (n.includes('curl') || n.includes('tricep') || n.includes('bicep') || n.includes('arm') || n.includes('extension')) return 'arms';
  if (n.includes('abs') || n.includes('crunch') || n.includes('plank') || n.includes('core')) return 'abs';
  return 'other';
};

const MuscleHeatmap = ({ muscleData }) => {
  // Convert muscleData array into a lookup object for quick percentage checks
  const percentages = useMemo(() => {
    const map = {};
    muscleData?.forEach(m => {
      map[m.name] = m.percentage;
    });
    return map;
  }, [muscleData]);

  const getMuscleProps = (name) => {
    const pct = percentages[name] || 0;
    const color = MUSCLE_COLORS[name] || '#71717a';
    const intensity = Math.min(pct / 40, 1.0); // max intensity at 40% focus
    return {
      fill: pct > 0 ? color : 'none',
      fillOpacity: pct > 0 ? 0.2 + intensity * 0.8 : 0.05,
      stroke: pct > 0 ? color : '#3f3f46',
      strokeWidth: pct > 0 ? '1.5' : '1',
      filter: pct > 0 ? 'url(#neonGlow)' : 'none',
      style: { transition: 'all 0.5s ease-in-out' }
    };
  };

  const getGenericProps = () => ({
    fill: '#27272a',
    fillOpacity: 0.1,
    stroke: '#3f3f46',
    strokeWidth: '1'
  });

  return (
    <div className="flex gap-4 justify-center items-center select-none bg-secondary/15 p-4 rounded-3xl border border-border/40 shrink-0">
      {/* Front View */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Front</span>
        <svg width="100" height="220" viewBox="0 0 100 220" className="overflow-visible">
          <defs>
            <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComponentTransfer in="blur" result="glow">
                <feFuncA type="linear" slope="0.6"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode in="glow"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Background Outlines / Head / Neck */}
          <circle cx="50" cy="22" r="9" {...getGenericProps()} />
          <rect x="46" y="31" width="8" height="9" rx="1" {...getGenericProps()} />

          {/* Traps */}
          <path d="M 35,40 L 46,31 L 54,31 L 65,40 Z" {...getGenericProps()} />

          {/* Shoulders */}
          <path d="M 32,40 L 23,43 L 20,55 L 29,55 Z" {...getMuscleProps('shoulders')} />
          <path d="M 68,40 L 77,43 L 80,55 L 71,55 Z" {...getMuscleProps('shoulders')} />

          {/* Chest */}
          <path d="M 50,60 L 33,56 L 29,40 L 50,40 Z" {...getMuscleProps('chest')} />
          <path d="M 50,60 L 67,56 L 71,40 L 50,40 Z" {...getMuscleProps('chest')} />

          {/* Abs */}
          <path d="M 33,61 L 67,61 L 63,80 L 57,105 L 43,105 L 37,80 Z" {...getMuscleProps('abs')} />

          {/* Arms (Biceps) */}
          <path d="M 20,56 L 27,56 L 23,88 L 17,88 Z" {...getMuscleProps('arms')} />
          <path d="M 80,56 L 73,56 L 77,88 L 83,88 Z" {...getMuscleProps('arms')} />

          {/* Forearms */}
          <path d="M 17,89 L 23,89 L 19,125 L 14,125 Z" {...getMuscleProps('forearms')} />
          <path d="M 83,89 L 77,89 L 81,125 L 86,125 Z" {...getMuscleProps('forearms')} />

          {/* Thighs (Quads) */}
          <path d="M 32,111 L 49,111 L 45,160 L 33,160 Z" {...getMuscleProps('legs')} />
          <path d="M 68,111 L 51,111 L 55,160 L 67,160 Z" {...getMuscleProps('legs')} />

          {/* Calves */}
          <path d="M 33,162 L 45,162 L 42,205 L 34,205 Z" {...getMuscleProps('legs')} />
          <path d="M 67,162 L 55,162 L 58,205 L 66,205 Z" {...getMuscleProps('legs')} />
        </svg>
      </div>

      {/* Back View */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Back</span>
        <svg width="100" height="220" viewBox="0 0 100 220" className="overflow-visible">
          {/* Head & Neck */}
          <circle cx="50" cy="22" r="9" {...getGenericProps()} />
          <rect x="46" y="31" width="8" height="9" rx="1" {...getGenericProps()} />

          {/* Traps */}
          <path d="M 35,40 L 46,31 L 54,31 L 65,40 Z" {...getGenericProps()} />

          {/* Shoulders */}
          <path d="M 32,40 L 23,43 L 20,55 L 29,55 Z" {...getMuscleProps('shoulders')} />
          <path d="M 68,40 L 77,43 L 80,55 L 71,55 Z" {...getMuscleProps('shoulders')} />

          {/* Back (Upper / Lats) */}
          <path d="M 50,40 L 32,40 L 30,62 L 35,80 L 50,75 Z" {...getMuscleProps('back')} />
          <path d="M 50,40 L 68,40 L 70,62 L 65,80 L 50,75 Z" {...getMuscleProps('back')} />
          <path d="M 35,81 L 65,81 L 60,105 L 40,105 Z" {...getMuscleProps('back')} />

          {/* Glutes */}
          <path d="M 32,106 L 50,106 L 50,126 L 31,126 Z" {...getMuscleProps('gluteus')} />
          <path d="M 68,106 L 50,106 L 50,126 L 69,126 Z" {...getMuscleProps('gluteus')} />

          {/* Arms (Triceps) */}
          <path d="M 20,56 L 27,56 L 23,88 L 17,88 Z" {...getMuscleProps('arms')} />
          <path d="M 80,56 L 73,56 L 77,88 L 83,88 Z" {...getMuscleProps('arms')} />

          {/* Forearms */}
          <path d="M 17,89 L 23,89 L 19,125 L 14,125 Z" {...getMuscleProps('forearms')} />
          <path d="M 83,89 L 77,89 L 81,125 L 86,125 Z" {...getMuscleProps('forearms')} />

          {/* Hamstrings */}
          <path d="M 31,127 L 49,127 L 45,160 L 33,160 Z" {...getMuscleProps('legs')} />
          <path d="M 69,127 L 51,127 L 55,160 L 67,160 Z" {...getMuscleProps('legs')} />

          {/* Calves */}
          <path d="M 33,162 L 45,162 L 42,205 L 34,205 Z" {...getMuscleProps('legs')} />
          <path d="M 67,162 L 55,162 L 58,205 L 66,205 Z" {...getMuscleProps('legs')} />
        </svg>
      </div>
    </div>
  );
};

export function Dashboard({ profile, history, deleteHistory, addHistory }) {
  const [timeRange, setTimeRange] = useState('all');

  const filteredHistory = useMemo(() => {
    if (!history) return [];
    if (timeRange === 'all') return history;
    
    const cutoff = new Date();
    if (timeRange === '7d') cutoff.setDate(cutoff.getDate() - 7);
    if (timeRange === '30d') cutoff.setDate(cutoff.getDate() - 30);
    
    return history.filter(w => new Date(w.date) >= cutoff);
  }, [history, timeRange]);

  // Exercise selection for progress graph
  const exercisesList = useMemo(() => {
    const list = new Set();
    history?.forEach(workout => {
      workout.exercises?.forEach(ex => {
        if (ex.name) {
          list.add(ex.name);
        }
      });
    });
    return Array.from(list).sort();
  }, [history]);

  const [selectedExercise, setSelectedExercise] = useState('');
  const [selectedMetric, setSelectedMetric] = useState('maxWeight');
  const [muscleView, setMuscleView] = useState('heatmap'); // 'heatmap' or 'chart'

  // Set default selected exercise once the list loads
  useEffect(() => {
    if (exercisesList.length > 0 && !selectedExercise) {
      setSelectedExercise(exercisesList[0]);
    }
  }, [exercisesList, selectedExercise]);

  // Rest Day Toggle handler
  const todayStr = new Date().toISOString().split('T')[0];
  const todayHasRestDay = useMemo(() => {
    return history?.some(w => w.date.split('T')[0] === todayStr && (w.routine_name || w.routineName || '').trim().toLowerCase() === 'rest day');
  }, [history, todayStr]);

  const handleToggleRestDay = async () => {
    if (todayHasRestDay) {
      const restDayEntry = history.find(w => w.date.split('T')[0] === todayStr && (w.routine_name || w.routineName || '').trim().toLowerCase() === 'rest day');
      if (restDayEntry) {
        await deleteHistory(restDayEntry.id);
      }
    } else {
      await addHistory({
        routineName: 'Rest Day',
        date: new Date().toISOString(),
        duration: 0,
        exercises: []
      });
    }
  };

  const stats = useMemo(() => {
    if (!filteredHistory || filteredHistory.length === 0) return null;

    const muscleSplit = {};
    let totalVolume = 0;

    filteredHistory.forEach(workout => {
      workout.exercises?.forEach(ex => {
        const group = ex.category || identifyMuscleGroup(ex.name);
        const volume = ex.sets?.reduce((acc, set) => acc + (parseFloat(set.weight) * parseInt(set.reps) || 0), 0) || 0;
        
        muscleSplit[group] = (muscleSplit[group] || 0) + volume;
        totalVolume += volume;
      });
    });

    const muscleData = Object.entries(muscleSplit).map(([name, value]) => ({
      name,
      value,
      percentage: Math.round((value / totalVolume) * 100)
    })).sort((a, b) => b.value - a.value);

    // Streak logic with 7-day rest window
    let streak = 0;
    const workouts = history.filter(w => 
      (w.routine_name || w.routineName || '').trim().toLowerCase() !== 'rest day' && 
      w.exercises && 
      w.exercises.length > 0
    );

    if (workouts.length > 0) {
      const uniqueWorkoutDates = [...new Set(workouts.map(w => w.date.split('T')[0]))]
        .sort((a, b) => a.localeCompare(b));

      const todayStr = new Date().toISOString().split('T')[0];
      const lastWorkoutStr = uniqueWorkoutDates[uniqueWorkoutDates.length - 1];

      const getDaysDiff = (d1Str, d2Str) => {
        const [y1, m1, d1] = d1Str.split('-').map(Number);
        const [y2, m2, d2] = d2Str.split('-').map(Number);
        const date1 = new Date(y1, m1 - 1, d1);
        const date2 = new Date(y2, m2 - 1, d2);
        return Math.round(Math.abs(date2 - date1) / (1000 * 60 * 60 * 24));
      };

      const daysSinceLast = getDaysDiff(todayStr, lastWorkoutStr);

      if (daysSinceLast <= 7) {
        let streakStart = lastWorkoutStr;
        for (let i = uniqueWorkoutDates.length - 1; i > 0; i--) {
          const d2 = uniqueWorkoutDates[i];
          const d1 = uniqueWorkoutDates[i - 1];
          const gap = getDaysDiff(d2, d1) - 1;
          if (gap >= 7) {
            streakStart = d2;
            break;
          } else {
            streakStart = d1;
          }
        }
        streak = getDaysDiff(todayStr, streakStart) + 1;
      }
    }

    const chartData = []; // Legacy field, replaced by exerciseChartData

    return {
      totalVolume: Math.round(totalVolume),
      streak,
      chartData,
      muscleData,
      lastWorkout: filteredHistory[0]
    };
  }, [filteredHistory, history]);

  // Exercise Chart Data
  const exerciseChartData = useMemo(() => {
    if (!history || !selectedExercise) return [];

    const data = [];
    const chronologicalHistory = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));

    chronologicalHistory.forEach(workout => {
      const matchingEx = workout.exercises?.find(
        ex => ex.name?.toLowerCase() === selectedExercise.toLowerCase()
      );

      if (matchingEx && matchingEx.sets && matchingEx.sets.length > 0) {
        const weights = matchingEx.sets.map(s => parseFloat(s.weight) || 0);
        const maxWeight = Math.max(...weights);

        const oneRMs = matchingEx.sets.map(s => {
          const w = parseFloat(s.weight) || 0;
          const r = parseInt(s.reps) || 0;
          if (r === 0 || isNaN(w) || isNaN(r)) return 0;
          return w * (1 + r / 30);
        });
        const maxOneRM = Math.max(...oneRMs);

        data.push({
          date: new Date(workout.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          maxWeight: Math.round(maxWeight),
          oneRM: Math.round(maxOneRM)
        });
      }
    });

    return data;
  }, [history, selectedExercise]);

  const exerciseStats = useMemo(() => {
    if (exerciseChartData.length === 0) return null;

    const maxWeight = Math.max(...exerciseChartData.map(d => d.maxWeight));
    const maxOneRM = Math.max(...exerciseChartData.map(d => d.oneRM));
    
    let totalSets = 0;
    history?.forEach(workout => {
      const matchingEx = workout.exercises?.find(
        ex => ex.name?.toLowerCase() === selectedExercise.toLowerCase()
      );
      if (matchingEx && matchingEx.sets) {
        totalSets += matchingEx.sets.length;
      }
    });

    return {
      allTimePR: maxWeight,
      bestOneRM: maxOneRM,
      totalSets
    };
  }, [exerciseChartData, history, selectedExercise]);

  const handleDelete = async (id) => {
    if (window.confirm('Delete this workout from your history?')) {
      await deleteHistory(id);
    }
  };

  return (
    <div className="p-6 space-y-8 pb-32 lg:pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-md border border-border/50 shrink-0">
            <img src={`${import.meta.env.BASE_URL}assets/logo.png`} alt="AlexosLifts Logo" className="w-full h-full object-cover" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Welcome back, {profile?.username || 'Lifter'}</h1>
            <p className="text-muted-foreground font-medium">Keep crushing those goals.</p>
          </div>
        </div>
        
        <div className="flex gap-1 p-1 bg-secondary/50 rounded-xl self-start">
          {['7d', '30d', 'all'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                timeRange === range ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {range === 'all' ? 'Always' : range}
            </button>
          ))}
        </div>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-5 rounded-3xl flex flex-col gap-2 shadow-sm">
          <div className="p-2 bg-orange-500/20 text-orange-500 rounded-xl w-fit">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-2xl font-black">{stats?.streak || 0}</p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Day Streak</p>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-3xl flex flex-col gap-2 shadow-sm">
          <div className="p-2 bg-blue-500/20 text-blue-500 rounded-xl w-fit">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-black">{(stats?.totalVolume || 0).toLocaleString()}</p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total {profile?.units}</p>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-3xl flex flex-col gap-2 shadow-sm">
          <div className="p-2 bg-green-500/20 text-green-500 rounded-xl w-fit">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-black">{filteredHistory.filter(w => (w.routine_name || w.routineName || '').trim().toLowerCase() !== 'rest day').length}</p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Workouts</p>
          </div>
        </div>

        <button
          onClick={handleToggleRestDay}
          className={`border p-5 rounded-3xl flex flex-col gap-2 text-left transition-all hover:scale-[1.02] active:scale-98 shadow-sm ${
            todayHasRestDay 
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-md shadow-amber-500/5' 
              : 'bg-card border-border text-foreground hover:border-amber-500/30'
          }`}
        >
          <div className={`p-2 rounded-xl w-fit transition-colors ${
            todayHasRestDay ? 'bg-amber-500 text-white' : 'bg-amber-500/20 text-amber-500'
          }`}>
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-black uppercase tracking-tight truncate">
              {todayHasRestDay ? 'Resting ☕' : 'Active Day'}
            </p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              {todayHasRestDay ? 'Tap to resume' : 'Tap to rest'}
            </p>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exercise Progress Chart */}
        <div className="bg-card border border-border p-6 rounded-3xl space-y-6 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Exercise Progress
              </h2>
              {exercisesList.length > 0 && (
                <div className="flex gap-1 p-1 bg-secondary/50 rounded-xl self-start sm:self-center">
                  <button
                    onClick={() => setSelectedMetric('maxWeight')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      selectedMetric === 'maxWeight' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Max Weight
                  </button>
                  <button
                    onClick={() => setSelectedMetric('oneRM')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      selectedMetric === 'oneRM' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Est. 1RM
                  </button>
                </div>
              )}
            </div>

            {exercisesList.length > 0 ? (
              <div className="space-y-4">
                <div className="relative">
                  <select
                    value={selectedExercise}
                    onChange={(e) => setSelectedExercise(e.target.value)}
                    className="appearance-none w-full bg-secondary border border-border rounded-xl px-4 py-2.5 pr-10 text-sm font-bold outline-none focus:border-primary/50 transition-all cursor-pointer"
                  >
                    {exercisesList.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3.5 top-3.5 text-muted-foreground pointer-events-none" />
                </div>

                {exerciseStats && (
                  <div className="grid grid-cols-3 gap-2 bg-secondary/35 p-3 rounded-2xl border border-border/30 text-center">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">All-Time PR</p>
                      <p className="text-sm font-black text-primary mt-0.5">{exerciseStats.allTimePR} {profile?.units}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Best 1RM</p>
                      <p className="text-sm font-black text-blue-400 mt-0.5">{exerciseStats.bestOneRM} {profile?.units}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Sets Logged</p>
                      <p className="text-sm font-black text-foreground mt-0.5">{exerciseStats.totalSets}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="h-60 w-full mt-4">
            {exercisesList.length > 0 && exerciseChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={exerciseChartData}>
                  <defs>
                    <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 10}} />
                  <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px'}}
                    itemStyle={{color: '#3b82f6', fontWeight: 'bold'}}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={selectedMetric} 
                    stroke="#3b82f6" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorMetric)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-secondary/10 rounded-2xl border border-dashed border-border space-y-3">
                <Dumbbell className="w-8 h-8 text-muted-foreground opacity-40 animate-pulse" />
                <div>
                  <p className="font-bold text-sm">No exercise data available</p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">Log routines with exercises to visualize strength trends over time.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Muscle Split Heatmap */}
        <div className="bg-card border border-border p-6 rounded-3xl space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-primary" />
              Muscle Focus Split
            </h2>
            {stats && stats.muscleData.length > 0 && (
              <div className="flex gap-1 p-1 bg-secondary/50 rounded-xl self-start sm:self-center">
                <button
                  onClick={() => setMuscleView('heatmap')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                    muscleView === 'heatmap' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Blueprint 👤
                </button>
                <button
                  onClick={() => setMuscleView('chart')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                    muscleView === 'chart' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Pie Chart 📊
                </button>
              </div>
            )}
          </div>

          {stats && stats.muscleData.length > 0 ? (
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              {muscleView === 'heatmap' ? (
                <MuscleHeatmap muscleData={stats.muscleData} />
              ) : (
                <div className="h-48 w-48 shrink-0 mx-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.muscleData}
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.muscleData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={MUSCLE_COLORS[entry.name] || MUSCLE_COLORS['other']} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              
              <div className="flex-1 w-full space-y-3">
                {stats.muscleData.map((m) => (
                  <div key={m.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                      <span className="capitalize">{m.name}</span>
                      <span className="text-muted-foreground">{m.percentage}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000" 
                        style={{ 
                          width: `${m.percentage}%`, 
                          backgroundColor: MUSCLE_COLORS[m.name] || MUSCLE_COLORS['other'] 
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-muted-foreground text-sm italic">
              No focus split data available for this period.
            </div>
          )}
        </div>
      </div>

      {/* Recent History */}
      <div className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">Recent Activity</h2>
        <div className="space-y-3">
          {filteredHistory.length > 0 ? (
            filteredHistory.slice(0, 5).map((workout) => {
              const isRest = (workout.routine_name || workout.routineName || '').trim().toLowerCase() === 'rest day';
              return (
                <div key={workout.id} className={`bg-card border p-5 rounded-3xl flex justify-between items-center group transition-all relative ${
                  isRest ? 'border-border/50 hover:border-amber-500/30' : 'border-border hover:border-primary/50'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl transition-colors ${
                      isRest 
                        ? 'bg-secondary group-hover:bg-amber-500/10 text-muted-foreground group-hover:text-amber-500' 
                        : 'bg-secondary group-hover:bg-primary/10 text-muted-foreground group-hover:text-primary'
                    }`}>
                      {isRest ? (
                        <Coffee className="w-6 h-6 transition-colors" />
                      ) : (
                        <Dumbbell className="w-6 h-6 transition-colors" />
                      )}
                    </div>
                    <div>
                      <p className="font-black uppercase tracking-tight">
                        {workout.routine_name || workout.routineName}
                        {isRest && <span className="text-sm ml-1.5">☕</span>}
                      </p>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {new Date(workout.date).toLocaleDateString()}
                        {!isRest && ` • ${workout.exercises?.length || 0} EX`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    {!isRest ? (
                      <div className="text-right">
                        <p className="text-lg font-black text-primary">
                          {Math.round(workout.exercises?.reduce((acc, ex) => 
                            acc + (ex.sets?.reduce((sAcc, set) => sAcc + (parseFloat(set.weight) * parseInt(set.reps) || 0), 0) || 0)
                          , 0) || 0).toLocaleString()}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{profile?.units}</p>
                      </div>
                    ) : (
                      <div className="text-right">
                        <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">Rest Day</p>
                      </div>
                    )}
                    <button 
                      onClick={() => handleDelete(workout.id)}
                      className="p-2 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete workout"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-card border border-border p-12 rounded-3xl text-center space-y-4">
              <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto opacity-20" />
              <p className="text-muted-foreground">No recent activity found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

