import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Dumbbell, Activity, Utensils, Save, CheckCircle2, RefreshCcw } from 'lucide-react';

export function AICoach({ profile, addRoutine }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi ${profile?.username || profile?.name || 'there'}! I'm your AI fitness coach. I'm now powered by a high-performance open-source model. I can create workout plans, explain form, or help with nutrition. How can I help today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [proposedRoutine, setProposedRoutine] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Robust routine parsing
  const parseRoutine = (text) => {
    try {
      // Find the last JSON-like block in the text
      const matches = text.match(/\{[\s\S]*"exercises"[\s\S]*\}/g);
      if (matches) {
        const rawJson = matches[matches.length - 1]; // Take the last one
        const data = JSON.parse(rawJson);
        if (data.name && Array.isArray(data.exercises)) {
          // Normalize exercises
          data.exercises = data.exercises.map(ex => ({
            name: ex.name || 'Exercise',
            sets: parseInt(ex.sets) || 3,
            reps: parseInt(ex.reps) || 10
          }));
          return data;
        }
      }
    } catch (e) {
      console.error("Routine Parse Error:", e);
    }
    return null;
  };

  const handleSend = async (text = input, retryCount = 0) => {
    if (!text.trim()) return;
    
    if (retryCount === 0) {
      setMessages(prev => [...prev, { role: 'user', content: text }]);
      setInput('');
      setProposedRoutine(null);
      setIsSaved(false);
    }
    
    setIsLoading(true);

    try {
      const systemPrompt = `You are a professional, encouraging fitness coach. User info: ${JSON.stringify(profile)}.
      Goal: Provide practical gym advice. Be concise. 
      IF recommending a workout routine, you MUST output a valid JSON block at the very end of your response like this:
      {"name": "Upper Body", "exercises": [{"name": "Bench Press", "sets": 3, "reps": 10}, {"name": "Rows", "sets": 3, "reps": 12}]}
      Only include JSON for the exercises themselves. The user can save it directly.`;

      const response = await fetch("https://text.pollinations.ai/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.slice(1).map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: text }
          ],
          model: "openai",
          seed: Math.floor(Math.random() * 1000)
        }),
      });

      if (!response.ok) throw new Error("API Limit");
      
      const responseText = await response.text();
      if (!responseText || responseText.length < 5) throw new Error("Empty response");

      const routine = parseRoutine(responseText);
      if (routine) setProposedRoutine(routine);

      // Remove the raw JSON from the displayed text for a cleaner look
      const cleanedText = responseText.replace(/\{[\s\S]*"exercises"[\s\S]*\}/g, '').trim();

      setMessages(prev => [...prev, { role: 'assistant', content: cleanedText || "Here is your plan:" }]);
    } catch (error) {
      console.error('AI Error:', error);
      if (retryCount < 2) {
        // Automatic silent retry
        setTimeout(() => handleSend(text, retryCount + 1), 1000);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: "I'm still waking up! Please try clicking Send again. If this persists, please Hard Refresh (Ctrl+F5)." 
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRoutine = async () => {
    if (!proposedRoutine) return;
    const { error } = await addRoutine(proposedRoutine);
    if (!error) {
      setIsSaved(true);
      setMessages(prev => [...prev, { role: 'assistant', content: `Success! "${proposedRoutine.name}" has been added to your Routines tab.` }]);
    }
  };

  const suggestions = [
    { icon: <Dumbbell className="w-4 h-4" />, text: "Create a 3-day full body split" },
    { icon: <Activity className="w-4 h-4" />, text: "Explain deadlift form" },
    { icon: <Utensils className="w-4 h-4" />, text: "High protein snacks" },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] lg:h-[calc(100vh-64px)] pb-24 lg:pb-0">
      <header className="p-4 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-xl">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Alexos Coach</h1>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">v2.5 Live</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-primary' : 'bg-secondary'}`}>
              {m.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-primary" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl p-4 text-sm ${m.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-card border border-border rounded-tl-none'}`}>
              {m.content.split('\n').map((line, i) => (
                <p key={i} className="mb-2 last:mb-0 min-h-[1em] whitespace-pre-wrap">{line}</p>
              ))}
              
              {idx === messages.length - 1 && proposedRoutine && (
                <div className="mt-4 p-4 bg-secondary/50 rounded-xl border border-primary/20 space-y-3 animate-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary font-bold">
                      <Dumbbell className="w-4 h-4" />
                      <span>{proposedRoutine.name}</span>
                    </div>
                    <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase">AI Suggested</span>
                  </div>
                  <div className="space-y-1">
                    {proposedRoutine.exercises.map((ex, i) => (
                      <div key={i} className="flex justify-between text-[11px] font-medium opacity-80">
                        <span>{ex.name}</span>
                        <span>{ex.sets}x{ex.reps}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleSaveRoutine}
                    disabled={isSaved}
                    className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 font-bold transition-all shadow-sm ${
                      isSaved ? 'bg-green-500/20 text-green-500 border border-green-500/20' : 'bg-primary text-white hover:shadow-primary/20 hover:scale-[1.02]'
                    }`}
                  >
                    {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {isSaved ? 'Added to Routines' : 'Save this Routine'}
                  </button>
                  {!isSaved && (
                    <p className="text-[9px] text-center text-muted-foreground">
                      Tip: You can ask me to "add more reps" or "change exercises" to refine this!
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-none p-4 flex gap-1 items-center">
              <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce [animation-delay:-0.3s]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-background border-t border-border space-y-4">
        {messages.length === 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(s.text)}
                className="whitespace-nowrap flex items-center gap-2 bg-secondary/50 hover:bg-secondary border border-border px-3 py-2 rounded-xl text-xs font-medium transition-colors"
              >
                {s.icon}
                {s.text}
              </button>
            ))}
          </div>
        )}
        
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your coach for a routine..."
            className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-primary text-white p-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}


