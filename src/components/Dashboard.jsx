import { useMemo, useState } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import { Trophy, Flame, Dumbbell, TrendingUp, Activity, PieChart as PieIcon, Trash2, Calendar } from 'lucide-react';

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

export function Dashboard({ profile, history, deleteHistory }) {
  const [timeRange, setTimeRange] = useState('all');

  const filteredHistory = useMemo(() => {
    if (!history) return [];
    if (timeRange === 'all') return history;
    
    const cutoff = new Date();
    if (timeRange === '7d') cutoff.setDate(cutoff.getDate() - 7);
    if (timeRange === '30d') cutoff.setDate(cutoff.getDate() - 30);
    
    return history.filter(w => new Date(w.date) >= cutoff);
  }, [history, timeRange]);

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

    // Streak logic with 1-day grace period
    let streak = 0;
    const sortedDates = [...new Set(history.map(w => w.date.split('T')[0]))].sort().reverse();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    let current = sortedDates[0] === today ? today : yesterday;
    
    if (sortedDates.includes(today) || sortedDates.includes(yesterday)) {
      for (const date of sortedDates) {
        if (date === current) {
          streak++;
          const prev = new Date(current);
          prev.setDate(prev.getDate() - 1);
          current = prev.toISOString().split('T')[0];
        } else if (date < current) {
          break;
        }
      }
    }

    const chartData = filteredHistory.slice().reverse().map(workout => {
      const max1RM = Math.max(...(workout.exercises?.flatMap(ex => 
        ex.sets?.map(set => {
          const w = parseFloat(set.weight);
          const r = parseInt(set.reps);
          if (r === 0 || isNaN(w) || isNaN(r)) return 0;
          return w * (1 + r / 30);
        }) || [0]
      ) || [0]));
      
      return {
        date: new Date(workout.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        oneRM: Math.round(max1RM)
      };
    });

    return {
      totalVolume: Math.round(totalVolume),
      streak,
      chartData,
      muscleData,
      lastWorkout: filteredHistory[0]
    };
  }, [filteredHistory, history]);

  const handleDelete = async (id) => {
    if (window.confirm('Delete this workout from your history?')) {
      await deleteHistory(id);
    }
  };

  if (!stats) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex gap-1 p-1 bg-secondary/50 rounded-xl">
            {['7d', '30d', 'all'].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                  timeRange === range ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-card border border-border p-12 rounded-3xl text-center space-y-4">
          <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto opacity-20" />
          <p className="text-muted-foreground">No workouts found for this period.</p>
        </div>
      </div>
    );
  }

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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border p-5 rounded-3xl flex flex-col gap-2">
          <div className="p-2 bg-orange-500/20 text-orange-500 rounded-xl w-fit">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-black">{stats.streak}</p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Day Streak</p>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-3xl flex flex-col gap-2">
          <div className="p-2 bg-blue-500/20 text-blue-500 rounded-xl w-fit">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-black">{stats.totalVolume.toLocaleString()}</p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total {profile?.units}</p>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-3xl flex flex-col gap-2 col-span-2 md:col-span-1">
          <div className="p-2 bg-green-500/20 text-green-500 rounded-xl w-fit">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-black">{filteredHistory.length}</p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Workouts</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Chart */}
        <div className="bg-card border border-border p-6 rounded-3xl space-y-6">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Strength Over Time
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="colorRM" x1="0" y1="0" x2="0" y2="1">
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
                <Area type="monotone" dataKey="oneRM" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorRM)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Muscle Split Heatmap */}
        <div className="bg-card border border-border p-6 rounded-3xl space-y-6">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-primary" />
            Muscle Focus Split
          </h2>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="h-48 w-48">
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
        </div>
      </div>

      {/* Recent History */}
      <div className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">Recent Activity</h2>
        <div className="space-y-3">
          {filteredHistory.slice(0, 5).map((workout) => (
            <div key={workout.id} className="bg-card border border-border p-5 rounded-3xl flex justify-between items-center group hover:border-primary/50 transition-all relative">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-secondary rounded-2xl group-hover:bg-primary/10 transition-colors">
                  <Dumbbell className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <p className="font-black uppercase tracking-tight">{workout.routine_name}</p>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    {new Date(workout.date).toLocaleDateString()} • {workout.exercises?.length || 0} EX
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-lg font-black text-primary">
                    {Math.round(workout.exercises?.reduce((acc, ex) => 
                      acc + (ex.sets?.reduce((sAcc, set) => sAcc + (parseFloat(set.weight) * parseInt(set.reps) || 0), 0) || 0)
                    , 0) || 0).toLocaleString()}
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{profile?.units}</p>
                </div>
                <button 
                  onClick={() => handleDelete(workout.id)}
                  className="p-2 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete workout"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

