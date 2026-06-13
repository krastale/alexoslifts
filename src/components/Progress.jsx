import { useState, useMemo, useRef } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Plus, Camera, Trash2, Ruler, TrendingUp, Sparkles, Loader2, Calendar, ChevronDown, ChevronUp, Settings2 
} from 'lucide-react';

export function Progress({ profile, updateProfile, history, measurements, addMeasurement, deleteMeasurement, photos, uploadPhoto, deletePhoto }) {
  const [isAddingMeasurement, setIsAddingMeasurement] = useState(false);
  const [isManagingTypes, setIsManagingTypes] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newMeasurementType, setNewMeasurementType] = useState('');
  
  const defaultTypes = ['Weight', 'Bicep', 'Waist', 'Chest', 'Thigh', 'Gluteus'];
  const measurementTypes = profile?.measurement_types || defaultTypes;

  const [newMeasurementData, setNewMeasurementData] = useState({});
  const [selectedChartMetric, setSelectedChartMetric] = useState('Weight');
  
  const fileInputRef = useRef(null);

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
      await uploadPhoto(file);
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
            {photos.map(photo => (
              <div key={photo.id} className="aspect-square bg-card border border-border rounded-xl overflow-hidden relative group">
                <img 
                  src={photo.url} 
                  alt="Progress" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    onClick={() => deletePhoto(photo)}
                    className="p-2 bg-red-500 text-white rounded-full hover:scale-110 transition-transform"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-[10px] text-white flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(photo.date).toLocaleDateString()}
                </div>
              </div>
            ))}
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
