import { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { Trophy, Flame, Dumbbell, TrendingUp } from 'lucide-react';

export function Dashboard({ user, history }) {
  const stats = useMemo(() => {
    if (!history || history.length === 0) return null;

    // Calculate total volume
    const totalVolume = history.reduce((acc, workout) => {
      return acc + workout.exercises.reduce((exAcc, ex) => {
        return exAcc + ex.sets.reduce((setAcc, set) => {
          return setAcc + (parseFloat(set.weight) * parseInt(set.reps) || 0);
        }, 0);
      }, 0);
    }, 0);

    // Calculate streak
    let streak = 0;
    const sortedDates = [...new Set(history.map(w => w.date.split('T')[0]))].sort().reverse();
    const today = new Date().toISOString().split('T')[0];
    
    let current = today;
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

    // Chart data: Estimated 1RM over time (taking the max 1RM of any exercise per session)
    const chartData = history.slice().reverse().map(workout => {
      const max1RM = Math.max(...workout.exercises.flatMap(ex => 
        ex.sets.map(set => {
          const w = parseFloat(set.weight);
          const r = parseInt(set.reps);
          if (r === 0) return 0;
          return w * (1 + r / 30); // Epley formula
        })
      ));
      
      return {
        date: new Date(workout.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        oneRM: Math.round(max1RM)
      };
    });

    return {
      totalVolume: Math.round(totalVolume),
      streak,
      chartData,
      lastWorkout: history[0]
    };
  }, [history]);

  if (!stats) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Welcome back, {user.name}!</h1>
        <div className="bg-card border border-border p-8 rounded-2xl text-center space-y-4">
          <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">No workouts logged yet. Start your journey today!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 pb-24 lg:pb-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">Welcome back, {user.name}</h1>
        <p className="text-muted-foreground">Here's how you're performing lately.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-orange-500/10 rounded-xl">
            <Flame className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Streak</p>
            <p className="text-2xl font-bold">{stats.streak} Days</p>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl">
            <TrendingUp className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Volume</p>
            <p className="text-2xl font-bold">{stats.totalVolume.toLocaleString()} {user.units}</p>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-green-500/10 rounded-xl">
            <Trophy className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Workouts</p>
            <p className="text-2xl font-bold">{history.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border p-6 rounded-2xl">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Estimated 1-Rep Max Progress
        </h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.chartData}>
              <defs>
                <linearGradient id="colorRM" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#a1a1aa', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                hide 
                domain={['dataMin - 10', 'dataMax + 10']}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                itemStyle={{ color: '#3b82f6' }}
              />
              <Area 
                type="monotone" 
                dataKey="oneRM" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRM)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Recent History</h2>
        <div className="space-y-3">
          {history.slice(0, 3).map((workout) => (
            <div key={workout.id} className="bg-card border border-border p-4 rounded-xl flex justify-between items-center">
              <div>
                <p className="font-medium">{workout.routineName}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(workout.date).toLocaleDateString()} • {workout.exercises.length} Exercises
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">
                  {Math.round(workout.exercises.reduce((acc, ex) => 
                    acc + ex.sets.reduce((sAcc, set) => sAcc + (parseFloat(set.weight) * parseInt(set.reps) || 0), 0)
                  , 0)).toLocaleString()} {user.units}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
