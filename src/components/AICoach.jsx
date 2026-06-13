import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Dumbbell, Activity, Utensils, Save, CheckCircle2, RefreshCcw } from 'lucide-react';

export function AICoach({ profile, addRoutine }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi ${profile?.username || profile?.name || 'there'}! I'm your AI fitness coach. I am now using a high-reliability connection. I can create plans, fix form, or give advice. What's on your mind?`
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

  const parseRoutine = (text) => {
    try {
      // Find the last JSON block in the response
      const matches = text.match(/\{[\s\S]*?"exercises"[\s\S]*?\}/g);
      if (matches) {
        const rawJson = matches[matches.length - 1]; 
        const cleanedJson = rawJson.replace(/```json|```/g, '').trim();
        const data = JSON.parse(cleanedJson);
        if (data.name && Array.isArray(data.exercises)) {
          return {
            name: data.name,
            exercises: data.exercises.map(ex => ({
              name: ex.name || 'Exercise',
              sets: parseInt(ex.sets) || 3,
              reps: parseInt(ex.reps) || 10
            }))
          };
        }
      }
    } catch (e) {
      console.warn("Routine parse issue:", e);
    }
    return null;
  };

  const handleSend = async (text = input) => {
    if (!text.trim()) return;
    
    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setProposedRoutine(null);
    setIsSaved(false);

    try {
      // STRATEGY 1: DuckDuckGo AI Proxy (Hyper-reliable, Free, GPT-4o-mini class)
      // This is often cleaner for browsers to handle
      const systemPrompt = `You are a pro gym coach. User Profile: ${JSON.stringify(profile)}. Be brief. Routine JSON at end: {"name":"...","exercises":[{"name":"...","sets":3,"reps":10}]}`;
      
      const response = await fetch("https://text.pollinations.ai/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.slice(-3).map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: text }
          ],
          model: "openai"
        })
      });

      if (!response.ok) throw new Error("Secondary API needed");
      
      const responseText = await response.text();
      
      const routine = parseRoutine(responseText);
      if (routine) setProposedRoutine(routine);

      const displayContent = responseText.split(/\{[\s\S]*?"exercises"/)[0].trim();
      setMessages([...newMessages, { role: 'assistant', content: displayContent || responseText }]);

    } catch (error) {
      console.warn('Primary AI failed, trying backup...');
      try {
        // STRATEGY 2: Backup GET stream (Bypasses POST issues)
        const prompt = `Coach: Brief gym advice for ${profile?.name}. Q: ${text}. Routine JSON if needed.`;
        const fallbackRes = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=mistral&cache=false`);
        const fallbackText = await fallbackRes.text();
        
        const routine = parseRoutine(fallbackText);
        if (routine) setProposedRoutine(routine);
        
        const displayContent = fallbackText.split(/\{[\s\S]*?"exercises"/)[0].trim();
        setMessages([...newMessages, { role: 'assistant', content: displayContent || fallbackText }]);
      } catch (e2) {
        setMessages([...newMessages, { 
          role: 'assistant', 
          content: "I'm having a quick water break. Please check your internet or try again in a few seconds! (Error: No AI connection available)" 
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
      setMessages(prev => [...prev, { role: 'assistant', content: `Done! "${proposedRoutine.name}" has been added to your Routines.` }]);
    }
  };

  const suggestions = [
    { icon: <Dumbbell className="w-4 h-4" />, text: "3-day split plan" },
    { icon: <Activity className="w-4 h-4" />, text: "Squat form check" },
    { icon: <Utensils className="w-4 h-4" />, text: "Protein meal ideas" },
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
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">v3.0 ULTIMATE</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-primary' : 'bg-secondary'}`}>
              {m.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-primary" />}
            </div>
            <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${m.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-card border border-border rounded-tl-none shadow-sm'}`}>
              {m.content.split('\n').map((line, i) => (
                <p key={i} className="mb-2 last:mb-0 min-h-[1em] whitespace-pre-wrap">{line}</p>
              ))}
              
              {idx === messages.length - 1 && proposedRoutine && (
                <div className="mt-4 p-4 bg-secondary/30 rounded-xl border border-primary/20 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <div className="flex items-center gap-2 text-primary font-bold">
                      <Dumbbell className="w-4 h-4" />
                      <span>{proposedRoutine.name}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 py-1">
                    {proposedRoutine.exercises.map((ex, i) => (
                      <div key={i} className="flex justify-between text-[11px] font-bold">
                        <span className="text-foreground/70">{ex.name}</span>
                        <span className="text-primary">{ex.sets}x{ex.reps}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleSaveRoutine}
                    disabled={isSaved}
                    className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-black transition-all ${
                      isSaved 
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                        : 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02]'
                    }`}
                  >
                    {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {isSaved ? 'SAVED!' : 'SAVE ROUTINE'}
                  </button>
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
            <div className="bg-card border border-border rounded-2xl rounded-tl-none p-5 flex gap-1.5 items-center">
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
                className="whitespace-nowrap flex items-center gap-2 bg-secondary/50 hover:bg-secondary border border-border px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
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
            placeholder="Ask your coach anything..."
            className="flex-1 bg-secondary border border-border rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary text-sm shadow-inner"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-primary text-white p-4 rounded-2xl hover:bg-primary/90 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            <Send className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
}
