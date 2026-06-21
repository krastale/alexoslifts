import { useState, useMemo, useRef } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Plus, Camera, Trash2, Ruler, TrendingUp, Sparkles, Loader2, Calendar as CalendarIcon, ChevronDown, ChevronUp, Settings2, Trophy, Award 
} from 'lucide-react';
import { WorkoutCalendar } from './WorkoutCalendar';

export function Progress({ profile, updateProfile, history, measurements, addMeasurement, deleteMeasurement, photos, uploadPhoto, deletePhoto }) {
  const [isAddingMeasurement, setIsAddingMeasurement] = useState(false);
  const [isManagingTypes, setIsManagingTypes] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newMeasurementType, setNewMeasurementType] = useState('');
  
  const defaultTypes = ['Weight', 'Bicep', 'Waist', 'Chest', 'Thigh', 'Gluteus'];
  const measurementTypes = profile?.measurement_types || defaultTypes;

  const [newMeasurementData, setNewMeasurementData] = useState({});
  const [selectedChartMetric, setSelectedChartMetric] = useState('Weight');
  const [comparisonPhotos, setComparisonPhotos] = useState([]); // [photo1, photo2]
  const [sliderPosition, setSliderPosition] = useState(50);
  
  const fileInputRef = useRef(null);

  const handleSelectForComparison = (photo) => {
    setComparisonPhotos(prev => {
      const exists = prev.find(p => p.id === photo.id);
      if (exists) return prev.filter(p => p.id !== photo.id);
      if (prev.length >= 2) return [prev[1], photo];
      return [...prev, photo];
    });
  };

  // Motivational Logic
  const motivation = useMemo(() => {
    if (!history || history.length === 0) return "Start your first workout to begin your journey!";
    
    const workoutCount = history.length;
    // We look for 'Weight' in either the direct column (legacy) or the data JSONB column
    const getWeight = (m) => m?.weight || m?.data?.Weight;
    
    const latestWeight = getWeight(measurements[0]);
    const initialWeight = getWeight(measurements[measurements.length - 1]);
    
    let message = `You've completed ${workoutCount} workouts. `;
    
    if (latestWeight && initialWeight && latestWeight !== initialWeight) {
      const diff = (latestWeight - initialWeight).toFixed(1);
      message += `You've ${diff > 0 ? 'gained' : 'lost'} ${Math.abs(diff)}${profile?.units || 'kg'} since you started. `;
    }

    if (history.length >= 3) {
      message += "Your consistency is paying off. Stay focused!";
    } else {
      message += "Keep showing up. The results will follow!";
    }

    return message;
  }, [history, measurements, profile]);

  // Total Lifetime Volume
  const totalLifetimeVolume = useMemo(() => {
    let total = 0;
    history?.forEach(workout => {
      workout.exercises?.forEach(ex => {
        ex.sets?.forEach(set => {
          total += (parseFloat(set.weight) * parseInt(set.reps) || 0);
        });
      });
    });
    return Math.round(total);
  }, [history]);

  // Personal Records for big lifts
  const prs = useMemo(() => {
    const maxWeights = { bench: 0, squat: 0, deadlift: 0, ohp: 0 };
    history?.forEach(workout => {
      workout.exercises?.forEach(ex => {
        const name = ex.name?.toLowerCase() || '';
        let key = '';
        if (name.includes('bench press')) key = 'bench';
        else if (name.includes('squat')) key = 'squat';
        else if (name.includes('deadlift')) key = 'deadlift';
        else if (name.includes('overhead press') || name.includes('ohp')) key = 'ohp';
        
        if (key) {
          ex.sets?.forEach(set => {
            const w = parseFloat(set.weight) || 0;
            if (w > maxWeights[key]) {
              maxWeights[key] = w;
            }
          });
        }
      });
    });
    return maxWeights;
  }, [history]);

  // Volume Comparison selector
  const volumeComparison = useMemo(() => {
    const vol = totalLifetimeVolume;
    if (vol === 0) return { text: "No weight lifted yet. Start your training to log volume!", emoji: "🌱", nextMilestone: 500, object: "" };
    if (vol < 500) return { text: `You've lifted ${vol.toLocaleString()} ${profile?.units || 'kg'} total—that's a giant tortoise! 🐢`, emoji: "🐢", nextMilestone: 500, object: "Giant Tortoise" };
    if (vol < 1000) return { text: `You've lifted ${vol.toLocaleString()} ${profile?.units || 'kg'} total—that's a Baby Grand Piano! 🎹`, emoji: "🎹", nextMilestone: 1000, object: "Grand Piano" };
    if (vol < 3000) return { text: `You've lifted ${vol.toLocaleString()} ${profile?.units || 'kg'} total—that's a Smart Car! 🚗`, emoji: "🚗", nextMilestone: 3000, object: "Smart Car" };
    if (vol < 6000) return { text: `You've lifted ${vol.toLocaleString()} ${profile?.units || 'kg'} total—that's a full-grown Hippopotamus! 🦛`, emoji: "🦛", nextMilestone: 6000, object: "Hippo" };
    if (vol < 12000) return { text: `You've lifted ${vol.toLocaleString()} ${profile?.units || 'kg'} total—that's a massive Orca Whale! 🐳`, emoji: "🐳", nextMilestone: 12000, object: "Orca Whale" };
    if (vol < 45000) return { text: `You've lifted ${vol.toLocaleString()} ${profile?.units || 'kg'} total—that's a Double-Decker Bus! 🚌`, emoji: "🚌", nextMilestone: 45000, object: "Double-Decker Bus" };
    if (vol < 150000) return { text: `You've lifted ${vol.toLocaleString()} ${profile?.units || 'kg'} total—that's a whole Boeing 737 Airplane! ✈️`, emoji: "✈️", nextMilestone: 150000, object: "Boeing 737" };
    return { text: `You've lifted ${vol.toLocaleString()} ${profile?.units || 'kg'} total—that's equivalent to a giant Blue Whale! 🐋`, emoji: "🐋", nextMilestone: null, object: "Blue Whale" };
  }, [totalLifetimeVolume, profile?.units]);

  // PR Animal Comparisons
  const prComparisons = useMemo(() => {
    const getDeadliftAnimal = (w) => {
      if (w === 0) return { name: "No lift logged", emoji: "🔒" };
      if (w < 50) return { name: "Giant Panda 🐼", emoji: "🐼" };
      if (w < 100) return { name: "Kangaroo 🦘", emoji: "🦘" };
      if (w < 150) return { name: "Newborn Baby Elephant! 🐘", emoji: "🐘" };
      if (w < 200) return { name: "Lion 🦁", emoji: "🦁" };
      return { name: "Grizzly Bear! 🐻", emoji: "🐻" };
    };

    const getBenchAnimal = (w) => {
      if (w === 0) return { name: "No lift logged", emoji: "🔒" };
      if (w < 40) return { name: "Golden Retriever 🦮", emoji: "🦮" };
      if (w < 80) return { name: "Adult Cheetah 🐆", emoji: "🐆" };
      if (w < 120) return { name: "Silverback Gorilla 🦍", emoji: "🦍" };
      return { name: "Wild Boar! 🐗", emoji: "🐗" };
    };

    const getSquatAnimal = (w) => {
      if (w === 0) return { name: "No lift logged", emoji: "🔒" };
      if (w < 60) return { name: "Giant Sea Turtle 🐢", emoji: "🐢" };
      if (w < 120) return { name: "Reindeer 🦌", emoji: "🦌" };
      if (w < 180) return { name: "Bengal Tiger 🐅", emoji: "🐅" };
      return { name: "American Alligator! 🐊", emoji: "🐊" };
    };

    return {
      deadlift: getDeadliftAnimal(prs.deadlift),
      bench: getBenchAnimal(prs.bench),
      squat: getSquatAnimal(prs.squat)
    };
  }, [prs]);

  // Trophy Room Badges
  const badges = useMemo(() => {
    const list = [
      {
        id: 'initiate',
        name: 'Iron Initiate',
        desc: 'Lift 1,000 kg total volume',
        unlocked: totalLifetimeVolume >= 1000,
        icon: '🛡️',
        color: 'from-slate-500/20 to-slate-500/5 text-slate-400 border-slate-500/30'
      },
      {
        id: 'warrior',
        name: 'Iron Warrior',
        desc: 'Lift 50,000 kg total volume',
        unlocked: totalLifetimeVolume >= 50000,
        icon: '⚔️',
        color: 'from-red-500/20 to-red-500/5 text-red-400 border-red-500/30'
      },
      {
        id: 'hero',
        name: 'Habit Hero',
        desc: 'Complete at least 5 workouts',
        unlocked: history?.filter(w => w.routine_name !== 'Rest Day').length >= 5,
        icon: '🔥',
        color: 'from-orange-500/20 to-orange-500/5 text-orange-400 border-orange-500/30'
      },
      {
        id: 'titan',
        name: 'Consistent Titan',
        desc: 'Complete at least 20 workouts',
        unlocked: history?.filter(w => w.routine_name !== 'Rest Day').length >= 20,
        icon: '👑',
        color: 'from-yellow-500/20 to-yellow-500/5 text-yellow-400 border-yellow-500/30'
      },
      {
        id: 'early',
        name: 'Early Riser',
        desc: 'Log a workout before 8:00 AM',
        unlocked: history?.some(w => {
          if (w.routine_name === 'Rest Day') return false;
          const timePart = w.date.split('T')[1];
          if (!timePart) return false;
          const hour = parseInt(timePart.split(':')[0]);
          return hour < 8;
        }),
        icon: '🌅',
        color: 'from-cyan-500/20 to-cyan-500/5 text-cyan-400 border-cyan-500/30'
      },
      {
        id: 'night',
        name: 'Night Owl',
        desc: 'Log a workout after 8:00 PM',
        unlocked: history?.some(w => {
          if (w.routine_name === 'Rest Day') return false;
          const timePart = w.date.split('T')[1];
          if (!timePart) return false;
          const hour = parseInt(timePart.split(':')[0]);
          return hour >= 20;
        }),
        icon: '🦉',
        color: 'from-indigo-500/20 to-indigo-500/5 text-indigo-400 border-indigo-500/30'
      },
      {
        id: 'rest',
        name: 'Recover Pro',
        desc: 'Log a dedicated rest day',
        unlocked: history?.some(w => w.routine_name === 'Rest Day'),
        icon: '☕',
        color: 'from-amber-500/20 to-amber-500/5 text-amber-500 border-amber-500/30'
      }
    ];
    return list;
  }, [history, totalLifetimeVolume]);

  const handleAddMeasurementType = async (e) => {
    e.preventDefault();
    if (!newMeasurementType.trim() || measurementTypes.includes(newMeasurementType.trim())) return;
    
    const updatedTypes = [...measurementTypes, newMeasurementType.trim()];
    await updateProfile({ measurement_types: updatedTypes });
    setNewMeasurementType('');
  };

  const handleRemoveMeasurementType = async (typeToRemove) => {
    const updatedTypes = measurementTypes.filter(t => t !== typeToRemove);
    await updateProfile({ measurement_types: updatedTypes });
    if (selectedChartMetric === typeToRemove) {
      setSelectedChartMetric(updatedTypes[0] || '');
    }
  };

  const handleAddMeasurement = async (e) => {
    e.preventDefault();
    // Prepare data. We keep 'weight' at root if it exists for backwards compatibility
    const payload = { 
      date: new Date().toISOString(),
      data: newMeasurementData 
    };
    
    // Legacy support: if 'Weight' is one of the custom data fields, also save it in root
    if (newMeasurementData['Weight']) {
      payload.weight = parseFloat(newMeasurementData['Weight']);
    }

    const { error } = await addMeasurement(payload);
    if (!error) {
      setNewMeasurementData({});
      setIsAddingMeasurement(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const { error } = await uploadPhoto(file);
      if (error) {
        alert(`Failed to upload photo: ${error.message}`);
      }
      setIsUploading(false);
    }
  };

  const chartData = useMemo(() => {
    return [...measurements].reverse().map(m => {
      // Find the value for the selected metric. Look in data JSONB, fallback to legacy column if available
      const val = m.data?.[selectedChartMetric] || m[selectedChartMetric.toLowerCase()];
      return {
        date: new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        value: val ? parseFloat(val) : null
      };
    }).filter(d => d.value !== null); // Only show points that have data for this metric
  }, [measurements, selectedChartMetric]);

  return (
    <div className="p-6 space-y-8 pb-32 lg:pb-12">
      <header className="space-y-4">
        <h1 className="text-3xl font-bold">Progress</h1>
        
        <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 p-6 rounded-2xl relative overflow-hidden group">
          <Sparkles className="absolute -right-2 -top-2 w-24 h-24 text-primary/10 group-hover:scale-110 transition-transform" />
          <h2 className="text-primary font-bold flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5" />
            Motivational Update
          </h2>
          <p className="text-foreground font-medium relative z-10">{motivation}</p>
        </div>
      </header>

      {/* Workout Calendar Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-muted-foreground" />
          Workout Calendar
        </h2>
        <WorkoutCalendar history={history} />
      </section>

      {/* Trophy Room & Milestones Section */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Trophy Room & Milestones
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lifetime Weight Card */}
          <div className="bg-card border border-border p-6 rounded-3xl space-y-4 flex flex-col justify-between shadow-sm relative overflow-hidden group">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Lifetime Volume</span>
              <p className="text-4xl font-black text-primary">
                {totalLifetimeVolume.toLocaleString()} <span className="text-sm font-normal text-muted-foreground uppercase">{profile?.units || 'kg'}</span>
              </p>
              <div className="bg-secondary/40 border border-border/60 p-4 rounded-2xl flex items-center gap-4 mt-2">
                <span className="text-3xl select-none">{volumeComparison.emoji}</span>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Comparison</p>
                  <p className="text-sm font-black text-foreground mt-0.5">{volumeComparison.text}</p>
                </div>
              </div>
            </div>
            
            {volumeComparison.nextMilestone && (
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <span>Progress to next milestone</span>
                  <span>{Math.min(Math.round((totalLifetimeVolume / volumeComparison.nextMilestone) * 100), 100)}%</span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((totalLifetimeVolume / volumeComparison.nextMilestone) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* PR Animal Lifting Card */}
          <div className="bg-card border border-border p-6 rounded-3xl space-y-4 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">What Can You Lift?</span>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-secondary/30 p-3 rounded-2xl border border-border/40">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{prComparisons.bench.emoji}</span>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Bench Press PR ({prs.bench} {profile?.units})</p>
                    <p className="text-sm font-black text-foreground">{prComparisons.bench.name}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between bg-secondary/30 p-3 rounded-2xl border border-border/40">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{prComparisons.squat.emoji}</span>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Squat PR ({prs.squat} {profile?.units})</p>
                    <p className="text-sm font-black text-foreground">{prComparisons.squat.name}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between bg-secondary/30 p-3 rounded-2xl border border-border/40">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{prComparisons.deadlift.emoji}</span>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Deadlift PR ({prs.deadlift} {profile?.units})</p>
                    <p className="text-sm font-black text-foreground">{prComparisons.deadlift.name}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Badges Grid */}
        <div className="bg-card border border-border p-6 rounded-3xl space-y-4 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Award className="w-4 h-4 text-primary" />
            Earned Badges
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {badges.map((b) => (
              <div 
                key={b.id}
                className={`border p-4 rounded-2xl flex flex-col items-center text-center justify-between gap-2 transition-all relative group ${
                  b.unlocked 
                    ? `bg-gradient-to-b ${b.color} hover:scale-105 shadow-md` 
                    : 'bg-card/50 border-border/40 opacity-40'
                }`}
              >
                <div className={`text-3xl select-none ${b.unlocked ? 'animate-bounce' : 'grayscale filter'}`}>
                  {b.unlocked ? b.icon : '🔒'}
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black uppercase tracking-tight line-clamp-1">{b.name}</p>
                  <p className="text-[8px] text-muted-foreground font-medium leading-none line-clamp-2">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Measurements Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Ruler className="w-5 h-5 text-muted-foreground" />
            Measurements
          </h2>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsManagingTypes(!isManagingTypes)}
              className="text-muted-foreground text-sm font-bold flex items-center gap-1 hover:text-primary transition-colors"
            >
              <Settings2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsAddingMeasurement(!isAddingMeasurement)}
              className="text-primary text-sm font-bold flex items-center gap-1 hover:underline"
            >
              {isAddingMeasurement ? <ChevronUp className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {isAddingMeasurement ? 'Close' : 'Log New'}
            </button>
          </div>
        </div>

        {/* Manage Measurement Types Form */}
        {isManagingTypes && (
          <div className="bg-card border border-border p-6 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="font-bold text-sm text-muted-foreground uppercase">Manage Tracked Metrics</h3>
            <div className="flex flex-wrap gap-2">
              {measurementTypes.map(type => (
                <div key={type} className="bg-secondary px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium">
                  {type}
                  <button onClick={() => handleRemoveMeasurementType(type)} className="text-muted-foreground hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddMeasurementType} className="flex gap-2">
              <input 
                type="text" 
                placeholder="New Metric (e.g., Body Fat %)"
                className="flex-1 bg-secondary border border-border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary text-sm"
                value={newMeasurementType}
                onChange={e => setNewMeasurementType(e.target.value)}
              />
              <button type="submit" className="bg-primary text-white px-4 rounded-lg font-bold text-sm">Add</button>
            </form>
          </div>
        )}

        {/* Log New Measurement Form */}
        {isAddingMeasurement && (
          <form onSubmit={handleAddMeasurement} className="bg-card border border-border p-6 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="grid grid-cols-2 gap-4">
              {measurementTypes.map(type => (
                <div key={type} className={type.toLowerCase() === 'weight' ? 'col-span-2' : ''}>
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">
                    {type} {type.toLowerCase() === 'weight' ? `(${profile?.units})` : ''}
                  </label>
                  <input 
                    type="number" step="0.1" 
                    required={type.toLowerCase() === 'weight'}
                    className="w-full bg-secondary border border-border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary"
                    value={newMeasurementData[type] || ''}
                    onChange={e => setNewMeasurementData({...newMeasurementData, [type]: e.target.value})}
                  />
                </div>
              ))}
            </div>
            <button type="submit" className="w-full bg-primary text-white font-bold py-3 rounded-lg shadow-lg shadow-primary/20">
              Save Entry
            </button>
          </form>
        )}

        {measurements.length > 0 ? (
          <div className="space-y-6">
            {/* Chart */}
            <div className="bg-card border border-border p-4 rounded-2xl space-y-4">
              <div className="flex justify-between items-center px-2">
                <select 
                  className="bg-transparent text-sm font-bold outline-none text-foreground cursor-pointer"
                  value={selectedChartMetric}
                  onChange={(e) => setSelectedChartMetric(e.target.value)}
                >
                  {measurementTypes.map(t => <option key={t} value={t} className="bg-card">{t}</option>)}
                </select>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 10}} />
                    <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                    <Tooltip 
                      contentStyle={{backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px'}}
                      labelStyle={{color: '#a1a1aa', fontSize: '12px', marginBottom: '4px'}}
                      itemStyle={{color: '#3b82f6', fontWeight: 'bold'}}
                    />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{fill: '#3b82f6'}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* History Cards */}
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              {measurements.slice(0, 5).map(m => {
                const weight = m.data?.Weight || m.weight;
                return (
                  <div key={m.id} className="min-w-[140px] max-w-[200px] bg-card border border-border p-4 rounded-xl space-y-2 relative flex-shrink-0">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{new Date(m.date).toLocaleDateString()}</p>
                    {weight && (
                      <p className="text-xl font-bold">{weight} <span className="text-xs font-normal text-muted-foreground">{profile?.units}</span></p>
                    )}
                    <div className="text-[10px] text-muted-foreground space-y-0.5">
                      {Object.entries(m.data || {}).map(([key, val]) => {
                        if (key === 'Weight' || !val) return null; // Already displayed or empty
                        return <p key={key} className="truncate">{key}: {val}</p>;
                      })}
                      {/* Fallback for legacy data */}
                      {!m.data && Object.entries(m).map(([key, val]) => {
                        if (['id', 'user_id', 'date', 'weight'].includes(key) || !val) return null;
                        return <p key={key} className="capitalize truncate">{key}: {val}</p>;
                      })}
                    </div>
                    <button 
                      onClick={() => deleteMeasurement(m.id)}
                      className="absolute top-2 right-2 text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-secondary/20 border border-dashed border-border p-8 rounded-2xl text-center">
            <p className="text-muted-foreground text-sm">No measurements logged yet.</p>
          </div>
        )}
      </section>

      {/* Transformation Slider */}
      {photos.length >= 2 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Transformation Slider
          </h2>
          
          <div className="bg-card border border-border p-6 rounded-3xl space-y-6">
            {comparisonPhotos.length === 2 ? (
              <div className="space-y-6">
                <div className="relative aspect-[4/5] md:aspect-video w-full rounded-2xl overflow-hidden cursor-ew-resize select-none border border-border shadow-2xl">
                  {/* After Image (Base) */}
                  <img 
                    src={comparisonPhotos[1].url} 
                    alt="After" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {/* Before Image (Overlay with clip-path) */}
                  <div 
                    className="absolute inset-0 w-full h-full overflow-hidden"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                  >
                    <img 
                      src={comparisonPhotos[0].url} 
                      alt="Before" 
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                  {/* Slider Handle */}
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10"
                    style={{ left: `${sliderPosition}%` }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-xl flex items-center justify-center">
                      <Ruler className="w-4 h-4 text-primary rotate-90" />
                    </div>
                  </div>
                  {/* Range Input (Invisible overlay) */}
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={sliderPosition} 
                    onChange={(e) => setSliderPosition(parseInt(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                  />

                  {/* Labels */}
                  <div className="absolute bottom-4 left-4 z-10 bg-black/60 backdrop-blur px-3 py-1 rounded-lg text-[10px] font-black uppercase text-white">Before</div>
                  <div className="absolute bottom-4 right-4 z-10 bg-black/60 backdrop-blur px-3 py-1 rounded-lg text-[10px] font-black uppercase text-white">After</div>
                </div>
                <button 
                  onClick={() => setComparisonPhotos([])}
                  className="w-full py-3 bg-secondary hover:bg-secondary/80 rounded-xl text-sm font-bold transition-all"
                >
                  Change Photos
                </button>
              </div>
            ) : (
              <div className="text-center py-8 space-y-4">
                <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="font-bold">Create a Before & After</p>
                  <p className="text-xs text-muted-foreground">Select two photos from your gallery below to compare them.</p>
                </div>
                <div className="flex justify-center gap-2">
                  {[0, 1].map(i => (
                    <div key={i} className={`w-12 h-12 rounded-lg border-2 border-dashed flex items-center justify-center ${comparisonPhotos[i] ? 'border-primary bg-primary/10' : 'border-border'}`}>
                      {comparisonPhotos[i] ? (
                        <img src={comparisonPhotos[i].url} className="w-full h-full object-cover rounded-md" />
                      ) : (
                        <Plus className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Photo Gallery Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Camera className="w-5 h-5 text-muted-foreground" />
            Progress Photos
          </h2>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="text-primary text-sm font-bold flex items-center gap-1 hover:underline disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Upload
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handlePhotoUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        {photos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {photos.map((photo, idx) => {
              const isSelected = comparisonPhotos.some(p => p.id === photo.id);
              return (
                <div 
                  key={photo.id || `photo-${idx}`} 
                  onClick={() => handleSelectForComparison(photo)}
                  className={`aspect-square bg-card border-2 rounded-2xl overflow-hidden relative group cursor-pointer transition-all ${isSelected ? 'border-primary ring-4 ring-primary/20' : 'border-border hover:border-primary/50'}`}
                >
                  <img 
                    src={photo.url} 
                    alt="Progress" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); deletePhoto(photo); }}
                      className="p-2 bg-red-500 text-white rounded-full hover:scale-110 transition-transform"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shadow-lg">
                      {comparisonPhotos.findIndex(p => p.id === photo.id) + 1}
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-[10px] text-white flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" />
                    {photo.date ? new Date(photo.date).toLocaleDateString() : 'New'}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-secondary/20 border border-dashed border-border p-12 rounded-2xl text-center space-y-4">
            <div className="p-4 bg-secondary rounded-full w-fit mx-auto">
              <Camera className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">Upload your first progress photo to see your transformation!</p>
          </div>
        )}
      </section>
    </div>
  );
}
