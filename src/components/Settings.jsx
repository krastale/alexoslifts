import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Info, Loader2, Check, X, Weight } from 'lucide-react';
import { supabase } from '../supabaseClient';

export function Settings({ profile, updateProfile }) {
  const { signOut } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [newUsername, setNewUsername] = useState(profile?.username || '');
  const [newWeight, setNewWeight] = useState(profile?.weight || '');
  const [usernameStatus, setUsernameStatus] = useState(null); // 'available', 'taken', 'checking', 'invalid'
  const [usernameError, setUsernameError] = useState('');

  useEffect(() => {
    setNewUsername(profile?.username || '');
    setNewWeight(profile?.weight || '');
  }, [profile]);

  useEffect(() => {
    if (newUsername === profile?.username) {
      setUsernameStatus(null);
      setUsernameError('');
      return;
    }

    const timer = setTimeout(() => {
      if (newUsername.length >= 3) {
        checkUsername(newUsername);
      } else {
        setUsernameStatus(null);
        setUsernameError('');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [newUsername, profile?.username]);

  const checkUsername = async (username) => {
    if (!/^[a-zA-Z0-9_]{3,15}$/.test(username)) {
      setUsernameStatus('invalid');
      setUsernameError('3-15 chars, alphanumeric & underscores');
      return;
    }

    setUsernameStatus('checking');
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username.toLowerCase())
      .maybeSingle();

    if (error) return;

    if (data) {
      setUsernameStatus('taken');
      setUsernameError('Username taken');
    } else {
      setUsernameStatus('available');
      setUsernameError('');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (newUsername.length < 3) return;
    if (usernameStatus === 'taken' || usernameStatus === 'invalid') return;

    setIsUpdating(true);
    await updateProfile({ 
      username: newUsername.toLowerCase(), 
      weight: parseFloat(newWeight) 
    });
    setIsUpdating(false);
    alert('Profile Updated!');
  };

  return (
    <div className="p-6 space-y-8 pb-32 lg:pb-12 max-w-2xl mx-auto">
      <header>
        <h1 className="text-3xl font-bold italic uppercase tracking-tighter text-primary">Settings</h1>
      </header>

      <section className="space-y-4">
        <h2 className="text-sm font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
          <User className="w-4 h-4" />
          Edit Profile
        </h2>
        
        <form onSubmit={handleSave} className="bg-card border border-border p-6 rounded-3xl space-y-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Username</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">@</div>
                <input
                  type="text"
                  className={`w-full bg-secondary border-2 rounded-2xl py-3.5 pl-8 pr-12 outline-none transition-all font-bold ${
                    usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'border-red-500/50' : 
                    usernameStatus === 'available' ? 'border-green-500/50' : 'border-transparent focus:border-primary'
                  }`}
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="username"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {usernameStatus === 'checking' && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                  {usernameStatus === 'available' && <Check className="w-5 h-5 text-green-500" />}
                  {(usernameStatus === 'taken' || usernameStatus === 'invalid') && <X className="w-5 h-5 text-red-500" />}
                </div>
              </div>
              {usernameError && (
                <p className="text-[10px] font-black text-red-500 mt-2 uppercase tracking-widest">{usernameError}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Body Weight ({profile?.units})</label>
              <div className="relative">
                <Weight className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="number"
                  step="0.1"
                  className="w-full bg-secondary border-2 border-transparent focus:border-primary rounded-2xl py-3.5 pl-11 pr-4 outline-none transition-all font-bold"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  placeholder="0.0"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isUpdating || (newUsername !== profile?.username && usernameStatus !== 'available')}
            className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-2xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-50"
          >
            {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
          <LogOut className="w-4 h-4" />
          Account Actions
        </h2>
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-4 bg-card border border-border p-5 rounded-3xl hover:bg-red-500/5 hover:border-red-500/20 transition-all text-left group"
        >
          <div className="p-3 bg-red-500/10 rounded-2xl text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
            <LogOut className="w-6 h-6" />
          </div>
          <div>
            <p className="font-black uppercase tracking-tight">Log Out</p>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Sign out on this device</p>
          </div>
        </button>
      </section>

      <section className="space-y-4 pt-4">
        <div className="bg-secondary/30 p-6 rounded-3xl space-y-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Info className="w-5 h-5" />
            <div>
              <p className="text-xs font-black uppercase tracking-widest">AlexosLifts Cloud v1.1.0</p>
              <p className="text-[10px] font-bold uppercase opacity-60">Production Stable Build</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
