import { useRef } from 'react';
import { Download, Upload, Trash2, User, Info, FileJson } from 'lucide-react';

export function Settings({ user, setUser, exportData, importData }) {
  const fileInputRef = useRef(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = importData(event.target.result);
        if (result) {
          alert('Data imported successfully!');
        } else {
          alert('Failed to import data. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const clearData = () => {
    if (window.confirm('Are you sure you want to clear ALL data? This cannot be undone.')) {
      window.localStorage.clear();
      window.location.reload();
    }
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
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.weight} {user.units}</p>
            </div>
            <button 
              className="text-primary text-sm font-bold hover:underline"
              onClick={() => {
                const name = prompt('Enter your name:', user.name);
                const weight = prompt('Enter your weight:', user.weight);
                if (name && weight) {
                  setUser({ ...user, name, weight });
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
          <FileJson className="w-4 h-4" />
          Data Management
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={exportData}
            className="flex items-center gap-4 bg-card border border-border p-5 rounded-2xl hover:bg-secondary transition-all text-left"
          >
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold">Export Data</p>
              <p className="text-sm text-muted-foreground">Download your workout history as JSON.</p>
            </div>
          </button>

          <button
            onClick={handleImportClick}
            className="flex items-center gap-4 bg-card border border-border p-5 rounded-2xl hover:bg-secondary transition-all text-left"
          >
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold">Import Data</p>
              <p className="text-sm text-muted-foreground">Upload a previous backup file.</p>
            </div>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
        </div>

        <button
          onClick={clearData}
          className="w-full flex items-center justify-center gap-2 p-4 text-red-500 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 rounded-2xl transition-all font-bold mt-4"
        >
          <Trash2 className="w-5 h-5" />
          Delete All Data
        </button>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Info className="w-4 h-4" />
          About
        </h2>
        <div className="bg-card border border-border p-5 rounded-2xl space-y-2">
          <p className="text-sm text-muted-foreground">
            <span className="font-bold text-foreground">AlexosLifts</span> is a privacy-first workout tracker. Your data never leaves your device.
          </p>
          <p className="text-xs text-muted-foreground mt-4">Version 0.1.0 • Built with React & Tailwind</p>
        </div>
      </section>
    </div>
  );
}
