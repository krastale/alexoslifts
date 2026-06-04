import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export function useData() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [routines, setRoutines] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const [profileRes, routinesRes, historyRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('routines').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('history').select('*').eq('user_id', user.id).order('date', { ascending: false })
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (routinesRes.data) setRoutines(routinesRes.data);
      if (historyRes.data) setHistory(historyRes.data);
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

  const deleteRoutine = async (id) => {
    const { error } = await supabase
      .from('routines')
      .delete()
      .eq('id', id);
    
    if (!error) setRoutines(routines.filter(r => r.id !== id));
    return { error };
  };

  const addHistory = async (workout) => {
    const { data, error } = await supabase
      .from('history')
      .insert([{ 
        user_id: user.id,
        routine_name: workout.routineName,
        date: workout.date,
        duration: workout.duration,
        exercises: workout.exercises
      }])
      .select()
      .single();
    
    if (data) setHistory([data, ...history]);
    return { data, error };
  };

  return {
    profile,
    updateProfile,
    routines,
    addRoutine,
    deleteRoutine,
    history,
    addHistory,
    loading,
    refreshData: fetchData
  };
}
