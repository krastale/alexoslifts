import { useState } from 'react';
import { User, Weight, Activity } from 'lucide-react';

export function Onboarding({ onComplete }) {
  const [formData, setFormData] = useState({
    name: '',
    weight: '',
    units: 'kg'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.weight) {
      onComplete(formData);
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
        
        <h1 className="text-3xl font-bold text-center mb-2">Welcome to AlexosLifts</h1>
        <p className="text-muted-foreground text-center mb-8">Let's set up your profile to start tracking your progress.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Your Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                required
                className="w-full bg-secondary border border-border rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="Alex"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
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
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg shadow-lg shadow-primary/20 transition-all mt-4"
          >
            Start Lifting
          </button>
        </form>
      </div>
    </div>
  );
}
