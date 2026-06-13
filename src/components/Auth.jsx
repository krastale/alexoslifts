import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Activity, Mail, Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

export function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const { signIn, signUp, resetPassword, updatePassword } = useAuth();

  useEffect(() => {
    // Check if we arrived here from a password reset link
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsUpdatingPassword(true);
        setIsResetMode(false);
        setIsSignUp(false);
      }
    });
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      if (isUpdatingPassword) {
        const { error: updateError } = await updatePassword(password);
        if (updateError) throw updateError;
        setMessage('Password updated successfully! You can now log in.');
        setIsUpdatingPassword(false);
        setPassword('');
        return;
      }

      if (isResetMode) {
        const { error: resetError } = await resetPassword(email);
        if (resetError) throw resetError;
        setMessage('Password reset link sent! Please check your email.');
        return;
      }

      const { data, error: authError } = isSignUp 
        ? await signUp(email, password) 
        : await signIn(email, password);
      
      if (authError) throw authError;
      
      if (isSignUp && data?.user && data?.session === null) {
        setMessage('Registration successful! Please check your email to confirm your account.');
      }
    } catch (err) {
      if (err.message === 'Load failed' || err.name === 'TypeError') {
        setError('Network Error: Could not connect to Supabase. Check your connection.');
      } else {
        setError(err.message || 'An unexpected error occurred.');
      }
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
          {isUpdatingPassword ? 'Set your new password' : 
           isResetMode ? 'Reset your password' :
           isSignUp ? 'Create your cloud account' : 'Sign in to sync your workouts'}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl flex gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {message && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 text-sm rounded-xl flex gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <p>{message}</p>
            </div>
          )}

          {!isUpdatingPassword && (
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
          )}

          {!isResetMode && (
            <div>
              <label className="block text-sm font-medium mb-2">
                {isUpdatingPassword ? 'New Password' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full bg-secondary border border-border rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-primary outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 
             (isUpdatingPassword ? 'Update Password' :
              isResetMode ? 'Send Reset Link' :
              isSignUp ? 'Sign Up' : 'Log In')}
          </button>
        </form>

        <div className="mt-6 space-y-3 text-center">
          {!isUpdatingPassword && (
            <button
              onClick={() => {
                setIsResetMode(!isResetMode);
                setError(null);
                setMessage(null);
              }}
              className="block w-full text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isResetMode ? 'Back to login' : 'Forgot your password?'}
            </button>
          )}
          
          {!isResetMode && !isUpdatingPassword && (
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setMessage(null);
              }}
              className="block w-full text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
