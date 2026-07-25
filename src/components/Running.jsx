import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Footprints, Flame, Timer, Play, Pause, Square, MapPin, Gauge, Trophy, 
  TrendingUp, Calendar, Trash2, Plus, Zap, ChevronDown, ChevronUp, Music, 
  Heart, ArrowUpRight, Activity, Check, Info, Sparkles, Navigation, RotateCcw
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell 
} from 'recharts';

export function Running({ runs = [], addRun, deleteRun }) {
  const [activeTab, setActiveTab] = useState('tracker'); // 'tracker' | 'manual' | 'tempo' | 'history'

  // --- LIVE GPS & STOPWATCH TRACKER STATE ---
  const [isLiveRunning, setIsLiveRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [liveDistance, setLiveDistance] = useState(0); // in kilometers
  const [liveSplits, setLiveSplits] = useState([]);
  const [runTitle, setRunTitle] = useState('Outdoor Run');
  const [runType, setRunType] = useState('outdoor');
  const [gpsError, setGpsError] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);

  const timerRef = useRef(null);
  const watchIdRef = useRef(null);
  const lastCoordRef = useRef(null);

  // --- MANUAL LOG STATE ---
  const [manualTitle, setManualTitle] = useState('Morning Run');
  const [manualType, setManualType] = useState('outdoor');
  const [manualDistance, setManualDistance] = useState('');
  const [manualMinutes, setManualMinutes] = useState('');
  const [manualSecs, setManualSecs] = useState('');
  const [manualHr, setManualHr] = useState('');
  const [manualElevation, setManualElevation] = useState('');
  const [manualCadence, setManualCadence] = useState('');
  const [manualRpe, setManualRpe] = useState('5');
  const [manualNotes, setManualNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- CADENCE METRONOME STATE ---
  const [metronomeActive, setMetronomeActive] = useState(false);
  const [targetSpm, setTargetSpm] = useState(170);
  const audioCtxRef = useRef(null);
  const metronomeTimerRef = useRef(null);

  // --- TEMPO CALCULATOR STATE ---
  const [calcDistance, setCalcDistance] = useState('5');
  const [calcTargetMins, setCalcTargetMins] = useState('25');
  const [calcTargetSecs, setCalcTargetSecs] = useState('00');

  // --- HISTORY SEARCH & EXPAND STATE ---
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [expandedRunId, setExpandedRunId] = useState(null);

  // --- LIVE TIMER EFFECT ---
  useEffect(() => {
    if (isLiveRunning && !isPaused) {
      timerRef.current = setInterval(() => {
        setLiveSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isLiveRunning, isPaused]);

  // --- LIVE GPS GEOLOCATION EFFECT ---
  useEffect(() => {
    if (isLiveRunning && !isPaused && 'geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setGpsAccuracy(Math.round(accuracy));
          setGpsError(null);

          if (lastCoordRef.current) {
            const distMeters = calculateHaversineDistance(
              lastCoordRef.current.lat,
              lastCoordRef.current.lng,
              latitude,
              longitude
            );
            // Only add if movement is realistic (e.g. > 2m and accuracy <= 40m)
            if (distMeters > 0.002 && accuracy < 40) {
              setLiveDistance(prev => {
                const nextDist = prev + distMeters;
                // Auto track per-km splits
                const currentKmIndex = Math.floor(nextDist);
                setLiveSplits(prevSplits => {
                  if (currentKmIndex > prevSplits.length) {
                    const splitTime = liveSeconds - (prevSplits.reduce((acc, curr) => acc + curr.seconds, 0));
                    return [...prevSplits, { km: currentKmIndex, seconds: splitTime, pace: formatPace(splitTime) }];
                  }
                  return prevSplits;
                });
                return nextDist;
              });
            }
          }
          lastCoordRef.current = { lat: latitude, lng: longitude };
        },
        (err) => {
          setGpsError('GPS signal weak or permission denied.');
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    } else if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [isLiveRunning, isPaused, liveSeconds]);

  // --- METRONOME AUDIO CLICK EFFECT ---
  useEffect(() => {
    if (metronomeActive) {
      const intervalMs = (60 / targetSpm) * 1000;
      metronomeTimerRef.current = setInterval(() => {
        playMetronomeClick();
      }, intervalMs);
    } else {
      clearInterval(metronomeTimerRef.current);
    }
    return () => clearInterval(metronomeTimerRef.current);
  }, [metronomeActive, targetSpm]);

  const playMetronomeClick = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      console.warn('Audio Metronome Error:', e);
    }
  };

  // --- HAVERSINE DISTANCE HELPER (KM) ---
  function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // --- FORMATTERS & CALCULATORS ---
  const formatSecondsToHMS = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatPace = (secs, km) => {
    if (!km || km <= 0 || !secs || secs <= 0) return '0:00';
    const paceSecsPerKm = secs / km;
    const mins = Math.floor(paceSecsPerKm / 60);
    const remainderSecs = Math.round(paceSecsPerKm % 60);
    return `${mins}'${remainderSecs < 10 ? '0' : ''}${remainderSecs}"`;
  };

  const calculateCalories = (distKm, durationSecs) => {
    if (!distKm || distKm <= 0) return 0;
    return Math.round(distKm * 65);
  };

  // --- LIVE TRACKER CONTROLS ---
  const handleStartLiveRun = () => {
    setIsLiveRunning(true);
    setIsPaused(false);
    setLiveSeconds(0);
    setLiveDistance(0);
    setLiveSplits([]);
    lastCoordRef.current = null;
  };

  const handleFinishLiveRun = async () => {
    if (liveDistance < 0.05 && liveSeconds < 10) {
      if (!confirm('Run is very short. Do you still want to save it?')) {
        setIsLiveRunning(false);
        setIsPaused(false);
        setLiveSeconds(0);
        setLiveDistance(0);
        return;
      }
    }

    const calculatedPace = formatPace(liveSeconds, liveDistance);
    const newRun = {
      title: runTitle || 'Outdoor Run',
      run_type: runType,
      date: new Date().toISOString(),
      distance: Number(liveDistance.toFixed(2)),
      duration: liveSeconds,
      pace: calculatedPace,
      calories: calculateCalories(liveDistance, liveSeconds),
      splits: liveSplits.length > 0 ? liveSplits : generateEstimatedSplits(liveDistance, liveSeconds),
      perceived_exertion: 6
    };

    await addRun(newRun);
    setIsLiveRunning(false);
    setIsPaused(false);
    setLiveSeconds(0);
    setLiveDistance(0);
    setLiveSplits([]);
    alert('🎉 Run saved successfully!');
    setActiveTab('history');
  };

  // --- MANUAL RUN LOG SUBMIT ---
  const handleSaveManualRun = async (e) => {
    e.preventDefault();
    const dist = parseFloat(manualDistance);
    const mins = parseInt(manualMinutes || '0', 10);
    const secs = parseInt(manualSecs || '0', 10);
    const totalSecs = mins * 60 + secs;

    if (!dist || dist <= 0 || totalSecs <= 0) {
      alert('Please enter valid distance and duration.');
      return;
    }

    setIsSubmitting(true);
    const calculatedPace = formatPace(totalSecs, dist);
    const generatedSplits = generateEstimatedSplits(dist, totalSecs);

    const newRun = {
      title: manualTitle || 'Running Workout',
      run_type: manualType,
      date: new Date().toISOString(),
      distance: Number(dist.toFixed(2)),
      duration: totalSecs,
      pace: calculatedPace,
      avg_heart_rate: manualHr ? parseInt(manualHr, 10) : null,
      elevation_gain: manualElevation ? parseInt(manualElevation, 10) : null,
      cadence: manualCadence ? parseInt(manualCadence, 10) : null,
      calories: calculateCalories(dist, totalSecs),
      perceived_exertion: parseInt(manualRpe, 10),
      notes: manualNotes,
      splits: generatedSplits
    };

    await addRun(newRun);
    setIsSubmitting(false);

    // Reset manual form
    setManualDistance('');
    setManualMinutes('');
    setManualSecs('');
    setManualHr('');
    setManualElevation('');
    setManualCadence('');
    setManualNotes('');
    alert('🏃 Workout Logged!');
    setActiveTab('history');
  };

  const generateEstimatedSplits = (distKm, totalSecs) => {
    const totalFullKm = Math.floor(distKm);
    if (totalFullKm <= 0) return [];
    const avgSecsPerKm = totalSecs / distKm;
    const splits = [];
    for (let i = 1; i <= totalFullKm; i++) {
      const variance = (Math.sin(i * 1.5) * 4);
      const splitSecs = Math.round(avgSecsPerKm + variance);
      splits.push({
        km: i,
        seconds: splitSecs,
        pace: formatPace(splitSecs, 1)
      });
    }
    return splits;
  };

  // --- STATS & PR CALCULATIONS ---
  const stats = useMemo(() => {
    const totalDist = runs.reduce((acc, r) => acc + (Number(r.distance) || 0), 0);
    const totalDuration = runs.reduce((acc, r) => acc + (Number(r.duration) || 0), 0);
    const totalCalories = runs.reduce((acc, r) => acc + (Number(r.calories) || 0), 0);
    const totalRunsCount = runs.length;

    const avgPaceSecs = totalDist > 0 ? totalDuration / totalDist : 0;
    const avgPace = formatPace(avgPaceSecs, 1);

    // Personal Records
    let pr1k = null, pr5k = null, pr10k = null, prHalf = null, longest = 0;

    runs.forEach(r => {
      const d = Number(r.distance) || 0;
      const sec = Number(r.duration) || 0;
      if (d > longest) longest = d;

      const paceSecPerKm = d > 0 ? sec / d : Infinity;
      if (d >= 1 && (!pr1k || paceSecPerKm < pr1k.paceSecs)) {
        pr1k = { time: formatSecondsToHMS(Math.round(paceSecPerKm)), paceSecs: paceSecPerKm, date: r.date };
      }
      if (d >= 5 && (!pr5k || (sec / (d / 5)) < pr5k.totalSecs)) {
        const est5kSecs = Math.round((sec / d) * 5);
        pr5k = { time: formatSecondsToHMS(est5kSecs), totalSecs: est5kSecs, date: r.date };
      }
      if (d >= 10 && (!pr10k || (sec / (d / 10)) < pr10k.totalSecs)) {
        const est10kSecs = Math.round((sec / d) * 10);
        pr10k = { time: formatSecondsToHMS(est10kSecs), totalSecs: est10kSecs, date: r.date };
      }
      if (d >= 21.1 && (!prHalf || (sec / (d / 21.1)) < prHalf.totalSecs)) {
        const estHalfSecs = Math.round((sec / d) * 21.1);
        prHalf = { time: formatSecondsToHMS(estHalfSecs), totalSecs: estHalfSecs, date: r.date };
      }
    });

    return {
      totalDist: totalDist.toFixed(1),
      totalDuration: formatSecondsToHMS(totalDuration),
      avgPace,
      totalCalories,
      totalRunsCount,
      longest: longest.toFixed(1),
      pr1k, pr5k, pr10k, prHalf
    };
  }, [runs]);

  // --- RECHARTS WEEKLY TREND DATA ---
  const chartData = useMemo(() => {
    if (runs.length === 0) return [];
    const sorted = [...runs].sort((a, b) => new Date(a.date) - new Date(b.date));
    return sorted.slice(-10).map(r => {
      const d = new Date(r.date);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      const paceSecs = r.distance > 0 ? (r.duration / r.distance) : 0;
      return {
        date: label,
        distance: Number(r.distance) || 0,
        paceMin: Number((paceSecs / 60).toFixed(2)),
        paceFormatted: r.pace || formatPace(r.duration, r.distance)
      };
    });
  }, [runs]);

  // --- FILTERED RUNS FOR HISTORY ---
  const filteredRuns = useMemo(() => {
    return runs.filter(r => {
      const matchesSearch = (r.title || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
                            (r.notes || '').toLowerCase().includes(searchFilter.toLowerCase());
      const matchesType = typeFilter === 'all' || r.run_type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [runs, searchFilter, typeFilter]);

  // --- CALCULATE TARGET PACE & SPLITS ---
  const calculatedSplits = useMemo(() => {
    const dist = parseFloat(calcDistance) || 0;
    const mins = parseInt(calcTargetMins || '0', 10);
    const secs = parseInt(calcTargetSecs || '0', 10);
    const totalSecs = mins * 60 + secs;

    if (dist <= 0 || totalSecs <= 0) return { targetPace: '0:00', splits: [], zones: null };

    const targetPaceSecs = totalSecs / dist;
    const targetPace = formatPace(targetPaceSecs, 1);

    const fullKmCount = Math.floor(dist);
    const splitsList = [];
    for (let i = 1; i <= fullKmCount; i++) {
      splitsList.push({
        km: i,
        time: formatSecondsToHMS(Math.round(targetPaceSecs * i)),
        pace: targetPace
      });
    }
    if (dist > fullKmCount) {
      const rem = dist - fullKmCount;
      splitsList.push({
        km: Number(dist.toFixed(2)),
        time: formatSecondsToHMS(totalSecs),
        pace: formatPace(targetPaceSecs * rem, rem)
      });
    }

    const zones = {
      recovery: `${formatPace(targetPaceSecs * 1.25, 1)} - ${formatPace(targetPaceSecs * 1.35, 1)}`,
      easy: `${formatPace(targetPaceSecs * 1.15, 1)} - ${formatPace(targetPaceSecs * 1.25, 1)}`,
      tempo: `${formatPace(targetPaceSecs * 1.02, 1)} - ${formatPace(targetPaceSecs * 1.08, 1)}`,
      vo2max: `${formatPace(targetPaceSecs * 0.90, 1)} - ${formatPace(targetPaceSecs * 0.95, 1)}`
    };

    return { targetPace, splits: splitsList, zones };
  }, [calcDistance, calcTargetMins, calcTargetSecs]);

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-32 lg:pb-12 max-w-4xl mx-auto">
      
      {/* APP HEADER */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs mb-1">
            <Footprints className="w-4 h-4" />
            AlexosLifts Endurance
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold italic uppercase tracking-tighter text-foreground flex items-center gap-3">
            Running Hub
          </h1>
        </div>

        {/* TOP TAB NAVIGATOR */}
        <div className="flex items-center gap-1 bg-secondary/40 p-1.5 rounded-2xl border border-border/50 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('tracker')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all whitespace-nowrap ${
              activeTab === 'tracker' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Timer className="w-4 h-4" />
            GPS Live
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all whitespace-nowrap ${
              activeTab === 'manual' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Plus className="w-4 h-4" />
            Log Run
          </button>
          <button
            onClick={() => setActiveTab('tempo')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all whitespace-nowrap ${
              activeTab === 'tempo' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Gauge className="w-4 h-4" />
            Tempo Tools
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all whitespace-nowrap ${
              activeTab === 'history' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calendar className="w-4 h-4" />
            History ({runs.length})
          </button>
        </div>
      </header>

      {/* STATS OVERVIEW CARDS */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-card border border-border/60 p-4 rounded-3xl relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest">Total Distance</span>
            <Footprints className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl sm:text-3xl font-black italic tracking-tighter text-foreground">
            {stats.totalDist} <span className="text-xs font-bold text-muted-foreground not-italic">km</span>
          </p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Across {stats.totalRunsCount} runs</p>
        </div>

        <div className="bg-card border border-border/60 p-4 rounded-3xl relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest">Avg Tempo</span>
            <Gauge className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black italic tracking-tighter text-foreground">
            {stats.avgPace}
          </p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Pace / kilometer</p>
        </div>

        <div className="bg-card border border-border/60 p-4 rounded-3xl relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest">Total Duration</span>
            <Timer className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black italic tracking-tighter text-foreground">
            {stats.totalDuration}
          </p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Time on feet</p>
        </div>

        <div className="bg-card border border-border/60 p-4 rounded-3xl relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest">Calories Burned</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black italic tracking-tighter text-foreground">
            {stats.totalCalories.toLocaleString()} <span className="text-xs font-bold text-muted-foreground not-italic">kcal</span>
          </p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Total energy spent</p>
        </div>
      </section>

      {/* PR TROPHIES BANNER */}
      {(stats.pr5k || stats.pr10k || stats.pr1k || stats.longest > 0) && (
        <section className="bg-gradient-to-r from-primary/10 via-amber-500/10 to-transparent border border-primary/20 p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/20 text-primary rounded-2xl">
              <Trophy className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-tight text-sm text-foreground">Endurance Records</h3>
              <p className="text-xs text-muted-foreground font-bold">Your top running achievements</p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {stats.pr5k && (
              <div className="text-left shrink-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fastest 5K</p>
                <p className="text-base font-black italic text-primary">{stats.pr5k.time}</p>
              </div>
            )}
            {stats.pr10k && (
              <div className="text-left shrink-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fastest 10K</p>
                <p className="text-base font-black italic text-amber-400">{stats.pr10k.time}</p>
              </div>
            )}
            {stats.longest > 0 && (
              <div className="text-left shrink-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Longest Run</p>
                <p className="text-base font-black italic text-emerald-400">{stats.longest} km</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* --- TAB 1: LIVE GPS & TRACKER --- */}
      {activeTab === 'tracker' && (
        <div className="space-y-6">
          <div className="bg-card border border-border/80 p-6 rounded-3xl space-y-6 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full filter blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1 mb-1">
                  <span className={`w-2 h-2 rounded-full ${isLiveRunning && !isPaused ? 'bg-green-500 animate-ping' : 'bg-muted-foreground'}`} />
                  {isLiveRunning ? (isPaused ? 'Run Paused' : 'Live GPS Tracking') : 'Ready to Run'}
                </span>
                <h2 className="text-xl font-black uppercase tracking-tight text-foreground">Outdoor GPS Workout</h2>
              </div>

              {!isLiveRunning && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input 
                    type="text" 
                    value={runTitle} 
                    onChange={e => setRunTitle(e.target.value)} 
                    placeholder="Run Title" 
                    className="bg-secondary border border-border px-3 py-2 rounded-xl text-xs font-bold w-full sm:w-48 outline-none focus:border-primary"
                  />
                  <select 
                    value={runType} 
                    onChange={e => setRunType(e.target.value)}
                    className="bg-secondary border border-border px-3 py-2 rounded-xl text-xs font-bold outline-none focus:border-primary uppercase"
                  >
                    <option value="outdoor">Outdoor</option>
                    <option value="treadmill">Treadmill</option>
                    <option value="track">Track</option>
                    <option value="interval">Interval</option>
                  </select>
                </div>
              )}
            </div>

            {gpsError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-2xl flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                {gpsError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 text-center">
              <div className="bg-secondary/20 p-5 rounded-3xl border border-border/40">
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Distance</span>
                <div className="text-4xl sm:text-5xl font-black italic tracking-tighter text-primary mt-1">
                  {liveDistance.toFixed(2)}
                </div>
                <span className="text-xs font-bold text-muted-foreground uppercase">Kilometers</span>
              </div>

              <div className="bg-secondary/20 p-5 rounded-3xl border border-border/40">
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Timer</span>
                <div className="text-4xl sm:text-5xl font-black italic tracking-tighter text-foreground mt-1">
                  {formatSecondsToHMS(liveSeconds)}
                </div>
                <span className="text-xs font-bold text-muted-foreground uppercase">HH:MM:SS</span>
              </div>

              <div className="bg-secondary/20 p-5 rounded-3xl border border-border/40">
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Current Pace</span>
                <div className="text-4xl sm:text-5xl font-black italic tracking-tighter text-emerald-400 mt-1">
                  {formatPace(liveSeconds, liveDistance)}
                </div>
                <span className="text-xs font-bold text-muted-foreground uppercase">min / km</span>
              </div>
            </div>

            {isLiveRunning && (
              <div className="flex items-center justify-between px-2 text-xs font-bold text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary animate-bounce" />
                  <span>GPS Signal: {gpsAccuracy ? `±${gpsAccuracy}m accuracy` : 'Searching...'}</span>
                </div>
                <div>
                  Splits Tracked: <span className="text-foreground font-black">{liveSplits.length} km</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              {!isLiveRunning ? (
                <button
                  onClick={handleStartLiveRun}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/30 transition-all flex items-center justify-center gap-3 text-lg uppercase tracking-wider"
                >
                  <Play className="w-6 h-6 fill-current" />
                  Start Run
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className={`flex-1 font-black py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-base ${
                      isPaused ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'
                    }`}
                  >
                    {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
                    {isPaused ? 'Resume' : 'Pause'}
                  </button>

                  <button
                    onClick={handleFinishLiveRun}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-base"
                  >
                    <Square className="w-5 h-5 fill-current" />
                    Finish & Save
                  </button>
                </>
              )}
            </div>

            {liveSplits.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-border/40">
                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Live Kilometer Splits
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {liveSplits.map(s => (
                    <div key={s.km} className="bg-secondary/40 border border-border/50 p-2.5 rounded-2xl flex justify-between items-center text-xs">
                      <span className="font-black text-muted-foreground">KM {s.km}</span>
                      <span className="font-black text-primary italic">{s.pace}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 2: MANUAL LOG WORKOUT --- */}
      {activeTab === 'manual' && (
        <form onSubmit={handleSaveManualRun} className="bg-card border border-border p-6 rounded-3xl space-y-6 shadow-sm">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Manual Run Entry
            </h2>
            <p className="text-xs font-bold text-muted-foreground">Log treadmill, past runs, or manual distance sessions</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Workout Title</label>
              <input
                type="text"
                required
                value={manualTitle}
                onChange={e => setManualTitle(e.target.value)}
                placeholder="e.g. 5K Tempo Run"
                className="w-full bg-secondary border border-border rounded-2xl p-3.5 outline-none font-bold text-foreground focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Run Type</label>
              <select
                value={manualType}
                onChange={e => setManualType(e.target.value)}
                className="w-full bg-secondary border border-border rounded-2xl p-3.5 outline-none font-bold text-foreground focus:border-primary transition-all uppercase"
              >
                <option value="outdoor">Outdoor Run</option>
                <option value="treadmill">Treadmill</option>
                <option value="track">Track Run</option>
                <option value="interval">Interval / Speedwork</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Distance (KM)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="5.00"
                value={manualDistance}
                onChange={e => setManualDistance(e.target.value)}
                className="w-full bg-secondary border border-border rounded-2xl p-3.5 outline-none font-bold text-foreground focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Minutes</label>
              <input
                type="number"
                required
                placeholder="25"
                value={manualMinutes}
                onChange={e => setManualMinutes(e.target.value)}
                className="w-full bg-secondary border border-border rounded-2xl p-3.5 outline-none font-bold text-foreground focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Seconds</label>
              <input
                type="number"
                placeholder="00"
                value={manualSecs}
                onChange={e => setManualSecs(e.target.value)}
                className="w-full bg-secondary border border-border rounded-2xl p-3.5 outline-none font-bold text-foreground focus:border-primary transition-all"
              />
            </div>
          </div>

          {manualDistance && manualMinutes && (
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Estimated Pace</span>
                <p className="text-xl font-black italic text-foreground">
                  {formatPace(parseInt(manualMinutes || '0', 10) * 60 + parseInt(manualSecs || '0', 10), parseFloat(manualDistance))} /km
                </p>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">Est. Energy Spent</span>
                <p className="text-xl font-black italic text-foreground">
                  {calculateCalories(parseFloat(manualDistance), 0)} kcal
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Optional Metrics</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Avg HR (bpm)</label>
                <input
                  type="number"
                  placeholder="155"
                  value={manualHr}
                  onChange={e => setManualHr(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl p-3 outline-none font-bold text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Elevation (m)</label>
                <input
                  type="number"
                  placeholder="45"
                  value={manualElevation}
                  onChange={e => setManualElevation(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl p-3 outline-none font-bold text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Cadence (spm)</label>
                <input
                  type="number"
                  placeholder="170"
                  value={manualCadence}
                  onChange={e => setManualCadence(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl p-3 outline-none font-bold text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">RPE Effort (1-10)</label>
                <select
                  value={manualRpe}
                  onChange={e => setManualRpe(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl p-3 outline-none font-bold text-xs"
                >
                  <option value="3">3 - Light</option>
                  <option value="5">5 - Moderate</option>
                  <option value="7">7 - Hard</option>
                  <option value="9">9 - Maximum</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Workout Notes</label>
            <textarea
              rows={2}
              placeholder="Felt great, pushed tempo on km 4..."
              value={manualNotes}
              onChange={e => setManualNotes(e.target.value)}
              className="w-full bg-secondary border border-border rounded-2xl p-3.5 outline-none font-bold text-foreground focus:border-primary transition-all text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-base"
          >
            {isSubmitting ? 'Saving Run...' : 'Save Running Log'}
          </button>
        </form>
      )}

      {/* --- TAB 3: TEMPO & CADENCE TOOLS --- */}
      {activeTab === 'tempo' && (
        <div className="space-y-6">
          <div className="bg-card border border-border p-6 rounded-3xl space-y-5 shadow-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1 mb-1">
                  <Music className="w-3.5 h-3.5" />
                  Cadence Trainer
                </span>
                <h3 className="text-lg font-black uppercase tracking-tight text-foreground">Interactive Running Metronome</h3>
              </div>

              <button
                onClick={() => setMetronomeActive(!metronomeActive)}
                className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
                  metronomeActive ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/30' : 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30'
                }`}
              >
                {metronomeActive ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                {metronomeActive ? 'Stop Beat' : 'Start Beat'}
              </button>
            </div>

            <div className="flex flex-col items-center justify-center py-4 space-y-4">
              <div className="relative flex items-center justify-center">
                <div className={`w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center transition-all ${
                  metronomeActive ? 'border-primary bg-primary/10 animate-pulse' : 'border-border bg-secondary/30'
                }`}>
                  <span className="text-4xl font-black italic tracking-tighter text-foreground">{targetSpm}</span>
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">SPM</span>
                </div>
              </div>

              <div className="w-full max-w-md space-y-2">
                <div className="flex justify-between text-xs font-black uppercase tracking-widest text-muted-foreground">
                  <span>150 SPM</span>
                  <span>Target Stride Rhythm</span>
                  <span>200 SPM</span>
                </div>
                <input
                  type="range"
                  min="150"
                  max="200"
                  step="2"
                  value={targetSpm}
                  onChange={e => setTargetSpm(parseInt(e.target.value, 10))}
                  className="w-full accent-primary h-2 bg-secondary rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border p-6 rounded-3xl space-y-6 shadow-sm">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1 mb-1">
                <Gauge className="w-3.5 h-3.5" />
                Race Assistant
              </span>
              <h3 className="text-lg font-black uppercase tracking-tight text-foreground">Target Pace & Split Predictor</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Distance (KM)</label>
                <input
                  type="number"
                  step="0.1"
                  value={calcDistance}
                  onChange={e => setCalcDistance(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-2xl p-3.5 outline-none font-bold text-foreground focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Target Minutes</label>
                <input
                  type="number"
                  value={calcTargetMins}
                  onChange={e => setCalcTargetMins(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-2xl p-3.5 outline-none font-bold text-foreground focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Target Seconds</label>
                <input
                  type="number"
                  value={calcTargetSecs}
                  onChange={e => setCalcTargetSecs(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-2xl p-3.5 outline-none font-bold text-foreground focus:border-primary"
                />
              </div>
            </div>

            {calculatedSplits.targetPace && (
              <div className="space-y-4">
                <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Required Target Pace</span>
                    <p className="text-3xl font-black italic text-foreground tracking-tight">
                      {calculatedSplits.targetPace} <span className="text-xs font-bold text-muted-foreground not-italic">/km</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setCalcDistance('5'); setCalcTargetMins('22'); setCalcTargetSecs('30'); }} className="px-3 py-1.5 bg-secondary text-xs font-bold rounded-xl hover:text-primary uppercase">5K (22:30)</button>
                    <button onClick={() => { setCalcDistance('10'); setCalcTargetMins('48'); setCalcTargetSecs('00'); }} className="px-3 py-1.5 bg-secondary text-xs font-bold rounded-xl hover:text-primary uppercase">10K (48:00)</button>
                    <button onClick={() => { setCalcDistance('21.1'); setCalcTargetMins('105'); setCalcTargetSecs('00'); }} className="px-3 py-1.5 bg-secondary text-xs font-bold rounded-xl hover:text-primary uppercase">21K (1:45)</button>
                  </div>
                </div>

                {calculatedSplits.zones && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Target Pace Zones</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-secondary/30 p-3 rounded-2xl border border-border/50">
                        <span className="text-[10px] font-black uppercase text-muted-foreground">Easy / Recovery</span>
                        <p className="font-black text-foreground mt-1">{calculatedSplits.zones.easy}</p>
                      </div>
                      <div className="bg-secondary/30 p-3 rounded-2xl border border-border/50">
                        <span className="text-[10px] font-black uppercase text-emerald-400">Tempo / Threshold</span>
                        <p className="font-black text-foreground mt-1">{calculatedSplits.zones.tempo}</p>
                      </div>
                      <div className="bg-secondary/30 p-3 rounded-2xl border border-border/50">
                        <span className="text-[10px] font-black uppercase text-amber-400">Intervals</span>
                        <p className="font-black text-foreground mt-1">{calculatedSplits.zones.vo2max}</p>
                      </div>
                      <div className="bg-secondary/30 p-3 rounded-2xl border border-border/50">
                        <span className="text-[10px] font-black uppercase text-rose-400">Race Pace</span>
                        <p className="font-black text-foreground mt-1">{calculatedSplits.targetPace} /km</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 4: RUN HISTORY & ANALYTICS --- */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {chartData.length > 0 && (
            <div className="bg-card border border-border/70 p-5 rounded-3xl space-y-4 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-black uppercase tracking-tight text-sm text-foreground">Distance & Tempo Progress</h3>
                  <p className="text-xs text-muted-foreground font-bold">Recent runs trend analysis</p>
                </div>
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>

              <div className="h-48 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorDist" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="date" stroke="#71717a" tick={{ fontSize: 10, fontWeight: 700 }} />
                    <YAxis stroke="#71717a" tick={{ fontSize: 10, fontWeight: 700 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderRadius: '1rem', borderColor: '#3f3f46' }}
                      formatter={(val, name) => [name === 'distance' ? `${val} km` : `${val} min/km`, name === 'distance' ? 'Distance' : 'Pace']}
                    />
                    <Area type="monotone" dataKey="distance" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorDist)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
            <input
              type="text"
              placeholder="Search runs..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className="w-full sm:w-64 bg-secondary border border-border px-4 py-2.5 rounded-2xl text-xs font-bold outline-none focus:border-primary"
            />

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all whitespace-nowrap ${
                  typeFilter === 'all' ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'
                }`}
              >
                All ({runs.length})
              </button>
              <button
                onClick={() => setTypeFilter('outdoor')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all whitespace-nowrap ${
                  typeFilter === 'outdoor' ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'
                }`}
              >
                Outdoor
              </button>
              <button
                onClick={() => setTypeFilter('treadmill')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all whitespace-nowrap ${
                  typeFilter === 'treadmill' ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'
                }`}
              >
                Treadmill
              </button>
              <button
                onClick={() => setTypeFilter('interval')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all whitespace-nowrap ${
                  typeFilter === 'interval' ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'
                }`}
              >
                Intervals
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredRuns.length === 0 ? (
              <div className="bg-card border border-border/60 p-8 rounded-3xl text-center space-y-3">
                <Footprints className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
                <h3 className="text-base font-black uppercase text-muted-foreground">No Running Logs Found</h3>
                <p className="text-xs text-muted-foreground font-bold">Start a live GPS run or add a manual log above!</p>
              </div>
            ) : (
              filteredRuns.map(run => {
                const isExpanded = expandedRunId === run.id;
                const formattedDate = new Date(run.date).toLocaleDateString(undefined, {
                  month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                });

                return (
                  <div key={run.id} className="bg-card border border-border/80 rounded-3xl p-5 space-y-4 hover:border-border transition-all shadow-sm">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider rounded-lg border border-primary/20">
                            {run.run_type || 'Outdoor'}
                          </span>
                          <span className="text-[10px] font-bold text-muted-foreground">{formattedDate}</span>
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-foreground">{run.title}</h3>
                      </div>

                      <button
                        onClick={() => deleteRun(run.id)}
                        className="text-muted-foreground hover:text-red-500 p-2 rounded-xl hover:bg-red-500/10 transition-all"
                        title="Delete Run"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 bg-secondary/30 p-4 rounded-2xl border border-border/40">
                      <div>
                        <span className="text-[10px] font-black uppercase text-muted-foreground">Distance</span>
                        <p className="text-lg font-black italic text-primary">{run.distance} <span className="text-xs not-italic text-muted-foreground">km</span></p>
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-muted-foreground">Pace</span>
                        <p className="text-lg font-black italic text-emerald-400">{run.pace} <span className="text-xs not-italic text-muted-foreground">/km</span></p>
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-muted-foreground">Duration</span>
                        <p className="text-lg font-black italic text-foreground">{formatSecondsToHMS(run.duration)}</p>
                      </div>
                      <div className="hidden sm:block">
                        <span className="text-[10px] font-black uppercase text-muted-foreground">Energy</span>
                        <p className="text-lg font-black italic text-rose-400">{run.calories || calculateCalories(run.distance, run.duration)} <span className="text-xs not-italic text-muted-foreground">kcal</span></p>
                      </div>
                    </div>

                    {run.notes && (
                      <p className="text-xs font-bold text-muted-foreground bg-secondary/20 p-3 rounded-xl border border-border/30">
                        "{run.notes}"
                      </p>
                    )}

                    {run.splits && run.splits.length > 0 && (
                      <div>
                        <button
                          onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
                          className="flex items-center gap-1.5 text-xs font-black uppercase text-primary hover:underline"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          {isExpanded ? 'Hide Splits' : `View ${run.splits.length} KM Splits`}
                        </button>

                        {isExpanded && (
                          <div className="mt-3 space-y-2 pt-2 border-t border-border/40">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {run.splits.map(s => (
                                <div key={s.km} className="bg-secondary/40 border border-border/50 p-2.5 rounded-2xl flex justify-between items-center text-xs">
                                  <span className="font-black text-muted-foreground">KM {s.km}</span>
                                  <span className="font-black text-emerald-400 italic">{s.pace}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
