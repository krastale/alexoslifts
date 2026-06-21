import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useData } from './hooks/useData';
import { Home, Dumbbell, Settings as SettingsIcon, Loader2, BarChart2, Users } from 'lucide-react';

import { Auth } from './components/Auth';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { RoutineBuilder } from './components/RoutineBuilder';
import { WorkoutLogger } from './components/WorkoutLogger';
import { Settings } from './components/Settings';
import { Progress } from './components/Progress';
import { Community } from './components/Community';

function AppContent() {
  const { user, loading: authLoading, isRecoveryMode } = useAuth();
  const { 
    profile, updateProfile, routines, addRoutine, updateRoutine, deleteRoutine, 
    history, addHistory, deleteHistory, loading: dataLoading,
    measurements, addMeasurement, deleteMeasurement,
    photos, uploadPhoto, deletePhoto
  } = useData();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [isWorkoutMinimized, setIsWorkoutMinimized] = useState(false);

  useEffect(() => {
    if (isRecoveryMode) {
      setActiveTab('settings');
    }
  }, [isRecoveryMode]);

  useEffect(() => {
    const handleStartWorkout = (e) => {
      setActiveWorkout(e.detail);
      setIsWorkoutMinimized(false);
      setActiveTab('dashboard'); // Switch to a tab that won't conflict visually
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
        return <Dashboard profile={profile} history={history} deleteHistory={deleteHistory} addHistory={addHistory} />;
      case 'routines':
        return <RoutineBuilder routines={routines} addRoutine={addRoutine} updateRoutine={updateRoutine} deleteRoutine={deleteRoutine} />;
      case 'progress':
        return (
          <Progress
            profile={profile}
            updateProfile={updateProfile}
            history={history}
            measurements={measurements}
            addMeasurement={addMeasurement}
            deleteMeasurement={deleteMeasurement}
            photos={photos}
            uploadPhoto={uploadPhoto}
            deletePhoto={deletePhoto}
          />
        );
      case 'community':
        return <Community profile={profile} addRoutine={addRoutine} />;
      case 'settings':
        return <Settings profile={profile} updateProfile={updateProfile} />;
      default:
        return <Dashboard profile={profile} history={history} deleteHistory={deleteHistory} addHistory={addHistory} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground max-w-5xl mx-auto border-x border-border/50 shadow-2xl shadow-black/50 relative">
      {/* Active Workout Overlay */}
      {activeWorkout && (
        <div className={`fixed inset-0 z-[100] bg-background ${isWorkoutMinimized ? 'hidden' : ''}`}>
          <WorkoutLogger 
            routine={activeWorkout} 
            history={history}
            onSave={async (workout) => {
              await addHistory(workout);
              setActiveWorkout(null);
              setActiveTab('dashboard');
            }} 
            onCancel={() => setActiveWorkout(null)}
            onMinimize={() => setIsWorkoutMinimized(true)}
          />
        </div>
      )}

      {/* Resume Workout Floating Button */}
      {activeWorkout && isWorkoutMinimized && (
        <button 
          onClick={() => setIsWorkoutMinimized(false)}
          className="fixed bottom-24 right-6 z-[90] bg-primary text-white p-4 rounded-full shadow-2xl shadow-primary/40 animate-bounce flex items-center gap-2 font-black uppercase tracking-tighter text-xs"
        >
          <Dumbbell className="w-5 h-5" />
          Resume
        </button>
      )}

      <main className="min-h-screen">
        {renderContent()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border p-2 lg:sticky lg:top-0 lg:order-first lg:border-t-0 lg:border-b overflow-x-auto no-scrollbar">
        <div className="max-w-md mx-auto lg:max-w-none flex justify-between items-center min-w-max gap-2 px-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center p-2 rounded-xl transition-all min-w-[70px] ${
              activeTab === 'dashboard' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">Home</span>
          </button>

          <button
            onClick={() => setActiveTab('routines')}
            className={`flex flex-col items-center p-2 rounded-xl transition-all min-w-[70px] ${
              activeTab === 'routines' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Dumbbell className="w-6 h-6" />
            <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">Routines</span>
          </button>

          <button
            onClick={() => setActiveTab('community')}
            className={`flex flex-col items-center p-2 rounded-xl transition-all min-w-[70px] ${
              activeTab === 'community' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-6 h-6" />
            <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">Social</span>
          </button>

          <button
            onClick={() => setActiveTab('progress')}
            className={`flex flex-col items-center p-2 rounded-xl transition-all min-w-[70px] ${
              activeTab === 'progress' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart2 className="w-6 h-6" />
            <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">Progress</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center p-2 rounded-xl transition-all min-w-[70px] ${
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
