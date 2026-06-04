import { useState, useEffect } from 'react';
import { useData } from './hooks/useData';
import { Layout, Home, Dumbbell, Settings as SettingsIcon, Plus } from 'lucide-react';

import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { RoutineBuilder } from './components/RoutineBuilder';
import { WorkoutLogger } from './components/WorkoutLogger';
import { Settings } from './components/Settings';

function App() {
  const { 
    user, setUser, routines, addRoutine, deleteRoutine, history, addHistory, exportData, importData 
  } = useData();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeWorkout, setActiveWorkout] = useState(null);

  // Listen for custom event to start workout from RoutineBuilder
  useEffect(() => {
    const handleStartWorkout = (e) => {
      setActiveWorkout(e.detail);
    };
    window.addEventListener('start-workout', handleStartWorkout);
    return () => window.removeEventListener('start-workout', handleStartWorkout);
  }, []);

  if (!user) {
    return <Onboarding onComplete={setUser} />;
  }

  if (activeWorkout) {
    return (
      <WorkoutLogger 
        routine={activeWorkout} 
        onSave={(workout) => {
          addHistory(workout);
          setActiveWorkout(null);
          setActiveTab('dashboard');
        }} 
        onCancel={() => setActiveWorkout(null)} 
      />
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard user={user} history={history} />;
      case 'routines':
        return <RoutineBuilder routines={routines} addRoutine={addRoutine} deleteRoutine={deleteRoutine} />;
      case 'settings':
        return <Settings user={user} setUser={setUser} exportData={exportData} importData={importData} />;
      default:
        return <Dashboard user={user} history={history} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground max-w-5xl mx-auto border-x border-border/50 shadow-2xl shadow-black/50">
      <main className="min-h-screen">
        {renderContent()}
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border p-2 lg:sticky lg:top-0 lg:order-first lg:border-t-0 lg:border-b">
        <div className="max-w-md mx-auto lg:max-w-none flex justify-around items-center">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${
              activeTab === 'dashboard' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">Home</span>
          </button>

          <button
            onClick={() => setActiveTab('routines')}
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${
              activeTab === 'routines' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Dumbbell className="w-6 h-6" />
            <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">Routines</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${
              activeTab === 'settings' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <SettingsIcon className="w-6 h-6" />
            <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default App;
