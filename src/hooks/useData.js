import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

async function autoLogMissingRestDays(loadedHistory, userId) {
  if (!userId) return loadedHistory;

  const historyDates = new Set(loadedHistory.map(w => w.date ? w.date.split('T')[0] : ''));
  const missingRestDays = [];
  const now = new Date();

  // Check past 7 days (including today)
  for (let i = 0; i <= 7; i++) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    if (!historyDates.has(dateStr)) {
      missingRestDays.push({
        user_id: userId,
        routine_name: 'Rest Day',
        date: d.toISOString(),
        duration: 0,
        exercises: []
      });
      historyDates.add(dateStr);
    }
  }

  if (missingRestDays.length > 0) {
    try {
      const { data, error } = await supabase
        .from('history')
        .insert(missingRestDays)
        .select();

      if (data && !error) {
        return [...data, ...loadedHistory].sort((a, b) => new Date(b.date) - new Date(a.date));
      }
    } catch (e) {
      console.warn('Auto-log rest day fallback:', e);
    }
  }

  return loadedHistory;
}

export function useData() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [routines, setRoutines] = useState([]);
  const [history, setHistory] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const [profileRes, routinesRes, historyRes, measurementsRes, photosRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('routines').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('history').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('measurements').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('progress_photos').select('*').eq('user_id', user.id).order('date', { ascending: false })
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (routinesRes.data) setRoutines(routinesRes.data);

      if (historyRes.data) {
        // Auto-log missing rest days for days with no activity in the last 7 days
        const updatedHistory = await autoLogMissingRestDays(historyRes.data, user.id);
        setHistory(updatedHistory);
      }

      if (measurementsRes.data) setMeasurements(measurementsRes.data);
      
      if (photosRes.data) {
        // Sign URLs for private photos
        const photosWithUrls = await Promise.all(photosRes.data.map(async (p) => {
          try {
            const { data } = await supabase.storage
              .from('progress-photos')
              .createSignedUrl(p.storage_path, 3600); // 1 hour link
            return { ...p, url: data?.signedUrl, date: p.date || p.created_at };
          } catch (e) {
            console.error('Error signing photo URL:', e);
            return { ...p, url: null, date: p.date || p.created_at };
          }
        }));
        setPhotos(photosWithUrls.filter(p => p.url)); // Only show photos that have valid URLs
      }

      // Fetch runs with Supabase + localStorage fallback
      let loadedRuns = [];
      try {
        const runsRes = await supabase.from('runs').select('*').eq('user_id', user.id).order('date', { ascending: false });
        if (runsRes.data && !runsRes.error) {
          loadedRuns = runsRes.data;
        }
      } catch (e) {
        console.warn('Supabase runs query fallback:', e);
      }

      const localRunsStr = localStorage.getItem(`alexoslifts_runs_${user.id}`);
      if (localRunsStr) {
        try {
          const localRuns = JSON.parse(localRunsStr);
          const runMap = new Map();
          [...loadedRuns, ...localRuns].forEach(r => runMap.set(r.id, r));
          loadedRuns = Array.from(runMap.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (e) {
          console.error('Error parsing local runs:', e);
        }
      }
      setRuns(loadedRuns);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateProfile = async (updates) => {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...updates })
      .select()
      .single();
    
    if (data) setProfile(data);
    return { data, error };
  };

  const addRoutine = async (routine) => {
    const { data, error } = await supabase
      .from('routines')
      .insert([{ ...routine, user_id: user.id }])
      .select()
      .single();
    
    if (data) setRoutines([data, ...routines]);
    return { data, error };
  };

  const updateRoutine = async (routine) => {
    const { data, error } = await supabase
      .from('routines')
      .update({ 
        name: routine.name, 
        exercises: routine.exercises, 
        is_public: routine.is_public 
      })
      .eq('id', routine.id)
      .select()
      .single();
    
    if (data) {
      setRoutines(routines.map(r => r.id === routine.id ? data : r));
    }
    return { data, error };
  };

  const deleteRoutine = async (id) => {
    const { error } = await supabase
      .from('routines')
      .delete()
      .eq('id', id);
    
    if (!error) setRoutines(routines.filter(r => r.id !== id));
    return { error };
  };

  const addHistory = async (workout) => {
    const workoutDateStr = (workout.date || new Date().toISOString()).split('T')[0];
    const isRealWorkout = (workout.routineName || workout.routine_name || '').trim().toLowerCase() !== 'rest day';

    // If logging a real workout for a date, delete any existing Rest Day entry for that date
    if (isRealWorkout) {
      const existingRestDay = history.find(w => 
        w.date && w.date.split('T')[0] === workoutDateStr && 
        (w.routine_name || w.routineName || '').trim().toLowerCase() === 'rest day'
      );
      if (existingRestDay) {
        try {
          await supabase.from('history').delete().eq('id', existingRestDay.id);
        } catch (e) {
          console.warn('Error removing auto rest day on workout log:', e);
        }
      }
    }

    const { data, error } = await supabase
      .from('history')
      .insert([{ 
        user_id: user.id,
        routine_name: workout.routineName || workout.routine_name,
        date: workout.date || new Date().toISOString(),
        duration: workout.duration || 0,
        exercises: workout.exercises || []
      }])
      .select()
      .single();
    
    if (data) {
      setHistory(prev => [data, ...prev.filter(h => h.id !== data.id && (h.date.split('T')[0] !== workoutDateStr || !isRealWorkout || (h.routine_name || h.routineName || '').trim().toLowerCase() !== 'rest day'))]);
    }
    return { data, error };
  };

  const deleteHistory = async (id) => {
    const { error } = await supabase
      .from('history')
      .delete()
      .eq('id', id);
    
    if (!error) setHistory(history.filter(h => h.id !== id));
    return { error };
  };

  const addMeasurement = async (measurement) => {
    const { data, error } = await supabase
      .from('measurements')
      .insert([{ ...measurement, user_id: user.id }])
      .select()
      .single();
    
    if (data) setMeasurements([data, ...measurements]);
    return { data, error };
  };

  const deleteMeasurement = async (id) => {
    const { error } = await supabase.from('measurements').delete().eq('id', id);
    if (!error) setMeasurements(measurements.filter(m => m.id !== id));
    return { error };
  };

  const uploadPhoto = async (file, caption = '') => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Save metadata to DB
      const { data, error: dbError } = await supabase
        .from('progress_photos')
        .insert([{
          user_id: user.id,
          storage_path: filePath,
          caption,
          date: new Date().toISOString()
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      // 3. Update local state with signed URL
      const { data: signedData } = await supabase.storage
        .from('progress-photos')
        .createSignedUrl(filePath, 3600);

      const newPhoto = { ...data, url: signedData?.signedUrl };
      setPhotos([newPhoto, ...photos]);
      return { data: newPhoto, error: null };
    } catch (error) {
      console.error('Upload photo error:', error);
      return { data: null, error };
    }
  };

  const deletePhoto = async (photo) => {
    // 1. Delete from Storage
    const { error: storageError } = await supabase.storage
      .from('progress-photos')
      .remove([photo.storage_path]);

    if (storageError) return { error: storageError };

    // 2. Delete from DB
    const { error: dbError } = await supabase
      .from('progress_photos')
      .delete()
      .eq('id', photo.id);

    if (!dbError) setPhotos(photos.filter(p => p.id !== photo.id));
    return { error: dbError };
  };

  const addRun = async (runData) => {
    const newRun = {
      id: runData.id || `run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: user.id,
      title: runData.title || 'Running Session',
      run_type: runData.run_type || 'outdoor',
      date: runData.date || new Date().toISOString(),
      distance: Number(runData.distance) || 0,
      duration: Number(runData.duration) || 0, // seconds
      pace: runData.pace || '0:00',
      avg_heart_rate: runData.avg_heart_rate ? Number(runData.avg_heart_rate) : null,
      elevation_gain: runData.elevation_gain ? Number(runData.elevation_gain) : null,
      cadence: runData.cadence ? Number(runData.cadence) : null,
      calories: runData.calories ? Number(runData.calories) : null,
      splits: runData.splits || [],
      notes: runData.notes || ''
    };

    try {
      const { data, error } = await supabase.from('runs').insert([newRun]).select().single();
      if (data && !error) {
        const updatedRuns = [data, ...runs.filter(r => r.id !== newRun.id)];
        setRuns(updatedRuns);
        localStorage.setItem(`alexoslifts_runs_${user.id}`, JSON.stringify(updatedRuns));
        return { data, error: null };
      }
    } catch (e) {
      console.warn('Supabase addRun fallback:', e);
    }

    const updatedRuns = [newRun, ...runs.filter(r => r.id !== newRun.id)];
    setRuns(updatedRuns);
    localStorage.setItem(`alexoslifts_runs_${user.id}`, JSON.stringify(updatedRuns));
    return { data: newRun, error: null };
  };

  const deleteRun = async (id) => {
    try {
      await supabase.from('runs').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase deleteRun fallback:', e);
    }
    const updatedRuns = runs.filter(r => r.id !== id);
    setRuns(updatedRuns);
    localStorage.setItem(`alexoslifts_runs_${user.id}`, JSON.stringify(updatedRuns));
    return { error: null };
  };

  return {
    profile,
    updateProfile,
    routines,
    addRoutine,
    updateRoutine,
    deleteRoutine,
    history,
    addHistory,
    deleteHistory,
    measurements,
    addMeasurement,
    deleteMeasurement,
    photos,
    uploadPhoto,
    deletePhoto,
    runs,
    addRun,
    deleteRun,
    loading,
    refreshData: fetchData
  };
}
