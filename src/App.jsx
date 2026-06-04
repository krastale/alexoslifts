import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useData } from './hooks/useData';
import { Home, Dumbbell, Settings as SettingsIcon, Loader2 } from 'lucide-react';

import { Auth } from './components/Auth';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { RoutineBuilder } from './components/RoutineBuilder';
import { WorkoutLogger } from './components/WorkoutLogger';
import { Settings } from './components/Settings';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { 
    profile, updateProfile, routines, addRoutine, deleteRoutine, history, addHistory, loading: dataLoading 
  } = useData();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeWorkout, setActiveWorkout] = useState(null);

  useEffect(() => {
    const handleStartWorkout = (e) => {
      setActiveWorkout(e.detail);
    };
    window.addEventListener('start-workout', handleStartWorkout);
    return () => window.removeEventListener('start-workout', handleStartWorkout);
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (!profile && !dataLoading) {
    return <Onboarding onComplete={updateProfile} />;
  }

  if (activeWorkout) {
    return (
      <WorkoutLogger 
        routine={activeWorkout} 
        onSave={async (workout) => {
          await addHistory(workout);
          setActiveWorkout(null);
          setActiveTab('dashboard');
        }} 
        onCancel={() => setActiveWorkout(null)} 
      />
    );
  }

  const renderContent = () => {
    if (dataLoading && !profile) {
      return (
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard profile={profile} history={history} />;
      case 'routines':
        return <RoutineBuilder routines={routines} addRoutine={addRoutine} deleteRoutine={deleteRoutine} />;
      case 'settings':
        return <Settings profile={profile} updateProfile={updateProfile} />;
      default:
        return <Dashboard profile={profile} history={history} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground max-w-5xl mx-auto border-x border-border/50 shadow-2xl shadow-black/50">
      <main className="min-h-screen">
        {renderContent()}
      </main>

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

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
