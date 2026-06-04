import { useLocalStorage } from './useLocalStorage';

export function useData() {
  const [user, setUser] = useLocalStorage('alexoslifts_user', null);
  const [routines, setRoutines] = useLocalStorage('alexoslifts_routines', []);
  const [history, setHistory] = useLocalStorage('alexoslifts_history', []);

  const addRoutine = (routine) => {
    setRoutines([...routines, { ...routine, id: Date.now().toString() }]);
  };

  const deleteRoutine = (id) => {
    setRoutines(routines.filter(r => r.id !== id));
  };

  const addHistory = (workout) => {
    setHistory([{ ...workout, id: Date.now().toString() }, ...history]);
  };

  const exportData = () => {
    const data = {
      user,
      routines,
      history,
      version: '1.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `alexoslifts_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const importData = (jsonData) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.user) setUser(data.user);
      if (data.routines) setRoutines(data.routines);
      if (data.history) setHistory(data.history);
      return true;
    } catch (error) {
      console.error('Import failed:', error);
      return false;
    }
  };

  return {
    user,
    setUser,
    routines,
    addRoutine,
    deleteRoutine,
    history,
    addHistory,
    exportData,
    importData
  };
}
