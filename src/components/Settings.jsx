import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Trash2, User, Info, Loader2, Sparkles, Eye, EyeOff } from 'lucide-react';

export function Settings({ profile, updateProfile }) {
  const { signOut } = useAuth();
  const [showKey, setShowKey] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateKey = async (e) => {
    e.preventDefault();
    const key = e.target.apiKey.value.trim();
    setIsUpdating(true);
    await updateProfile({ ai_api_key: key });
    setIsUpdating(false);
    alert('AI Settings Updated!');
  };

  return (
    <div className="p-6 space-y-8 pb-24 lg:pb-6">
      <header>
        <h1 className="text-3xl font-bold">Settings</h1>
      </header>

      <section className="space-y-4">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <User className="w-4 h-4" />
          Profile
        </h2>
        <div className="bg-card border border-border p-5 rounded-2xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">{profile?.username || profile?.name || 'User'}</p>
              <p className="text-sm text-muted-foreground">{profile?.weight} {profile?.units}</p>
            </div>
            <button 
              className="text-primary text-sm font-bold hover:underline"
              onClick={() => {
                const username = prompt('Enter your username:', profile?.username);
                const weight = prompt('Enter your weight:', profile?.weight);
                if (username && weight) {
                  updateProfile({ username, weight });
                }
              }}
            >
              Edit
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          AI Coach Configuration
        </h2>
        <div className="bg-card border border-border p-5 rounded-2xl space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            To use the AI Coach for free, get your own API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-primary underline">Google AI Studio</a>.
          </p>
          <form onSubmit={handleUpdateKey} className="space-y-3">
            <div className="relative">
              <input
                name="apiKey"
                type={showKey ? "text" : "password"}
                defaultValue={profile?.ai_api_key || ''}
                placeholder="Enter your Gemini API Key"
                className="w-full bg-secondary border border-border rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-primary text-sm font-mono pr-12"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-4 top-3.5 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              type="submit"
              disabled={isUpdating}
              className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save AI Settings'}
            </button>
          </form>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <LogOut className="w-4 h-4" />
          Session
        </h2>
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-4 bg-card border border-border p-5 rounded-2xl hover:bg-secondary transition-all text-left"
        >
          <div className="p-3 bg-red-500/10 rounded-xl text-red-500">
            <LogOut className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold">Log Out</p>
            <p className="text-sm text-muted-foreground">Sign out of your account on this device.</p>
          </div>
        </button>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Info className="w-4 h-4" />
          About
        </h2>
        <div className="bg-card border border-border p-5 rounded-2xl space-y-2">
          <p className="text-sm text-muted-foreground">
            <span className="font-bold text-foreground">AlexosLifts Cloud</span> is now syncing your progress to the cloud.
          </p>
          <p className="text-xs text-muted-foreground mt-4">Version 1.0.0 • Supabase Backend</p>
        </div>
      </section>
    </div>
  );
}
