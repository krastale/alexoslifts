import { useState, useEffect } from 'react';
import { User, Weight, Activity, Check, X, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

export function Onboarding({ onComplete }) {
  const [formData, setFormData] = useState({
    username: '',
    weight: '',
    units: 'kg'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(null); // 'available', 'taken', 'checking', 'invalid'
  const [usernameError, setUsernameError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.username.length >= 3) {
        checkUsername(formData.username);
      } else {
        setUsernameStatus(null);
        setUsernameError('');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username]);

  const checkUsername = async (username) => {
    if (!/^[a-zA-Z0-9_]{3,15}$/.test(username)) {
      setUsernameStatus('invalid');
      setUsernameError('3-15 chars, alphanumeric & underscores only');
      return;
    }

    setUsernameStatus('checking');
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username.toLowerCase())
      .maybeSingle();

    if (error) {
      console.error('Error checking username:', error);
      return;
    }

    if (data) {
      setUsernameStatus('taken');
      setUsernameError('Username already taken');
    } else {
      setUsernameStatus('available');
      setUsernameError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.username && formData.weight && usernameStatus === 'available') {
      setIsSubmitting(true);
      await onComplete({
        ...formData,
        username: formData.username.toLowerCase()
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background">
      <div className="w-full max-w-md p-8 rounded-3xl bg-card border border-border shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-lg border border-border/50">
            <img src="/assets/logo.png" alt="AlexosLifts Logo" className="w-full h-full object-cover" />
          </div>
        </div>
        
        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-center mb-2">Welcome to AlexosLifts</h1>
        <p className="text-muted-foreground text-center mb-8 font-bold text-sm">Let's set up your profile to start tracking your progress.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                required
                className={`w-full bg-secondary border border-border rounded-lg py-2.5 pl-10 pr-10 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${
                  usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'border-red-500/50' : 
                  usernameStatus === 'available' ? 'border-green-500/50' : ''
                }`}
                placeholder="lift_king"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
              <div className="absolute right-3 top-3">
                {usernameStatus === 'checking' && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                {usernameStatus === 'available' && <Check className="w-5 h-5 text-green-500" />}
                {(usernameStatus === 'taken' || usernameStatus === 'invalid') && <X className="w-5 h-5 text-red-500" />}
              </div>
            </div>
            {usernameError && (
              <p className="text-[10px] font-bold text-red-500 mt-1 uppercase tracking-wider">{usernameError}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Body Weight</label>
            <div className="relative">
              <Weight className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <input
                type="number"
                required
                step="0.1"
                className="w-full bg-secondary border border-border rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="75.0"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Preferred Units</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className={`py-2 rounded-lg border transition-all ${
                  formData.units === 'kg'
                    ? 'bg-primary border-primary text-white font-bold'
                    : 'bg-secondary border-border text-muted-foreground'
                }`}
                onClick={() => setFormData({ ...formData, units: 'kg' })}
              >
                KG
              </button>
              <button
                type="button"
                className={`py-2 rounded-lg border transition-all ${
                  formData.units === 'lbs'
                    ? 'bg-primary border-primary text-white font-bold'
                    : 'bg-secondary border-border text-muted-foreground'
                }`}
                onClick={() => setFormData({ ...formData, units: 'lbs' })}
              >
                LBS
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg shadow-lg shadow-primary/20 transition-all mt-4 flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Creating Profile...' : 'Start Lifting'}
          </button>
        </form>
      </div>
    </div>
  );
}
