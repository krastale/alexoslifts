import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Activity, Mail, Lock, Loader2 } from 'lucide-react';

export function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { signIn, signUp } = useAuth();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { error } = isSignUp 
        ? await signUp(email, password) 
        : await signIn(email, password);
      
      if (error) throw error;
      if (isSignUp) alert('Check your email for the confirmation link!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background">
      <div className="w-full max-w-md p-8 rounded-2xl bg-card border border-border shadow-xl">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-primary/10 rounded-full">
            <Activity className="w-10 h-10 text-primary" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-center mb-2">AlexosLifts</h1>
        <p className="text-muted-foreground text-center mb-8">
          {isSignUp ? 'Create your cloud account' : 'Sign in to sync your workouts'}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                required
                className="w-full bg-secondary border border-border rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <input
                type="password"
                required
                className="w-full bg-secondary border border-border rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? 'Sign Up' : 'Log In')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
