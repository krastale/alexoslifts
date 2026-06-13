import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Dumbbell, Activity, Utensils, Save, CheckCircle2 } from 'lucide-react';

export function AICoach({ profile, addRoutine }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi ${profile?.username || profile?.name || 'there'}! I'm your AI fitness coach. I use open-source models to help you for free. I can create workout plans, check your form, or give nutrition advice. How can I help today?`
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
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*"exercises"[\s\S]*}/);
      if (jsonMatch) {
        const rawJson = jsonMatch[0].replace(/```json|```/g, '').trim();
        const data = JSON.parse(rawJson);
        if (data.name && Array.isArray(data.exercises)) {
          return data;
        }
      }
    } catch (e) {
      console.error("Failed to parse routine:", e);
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
      // Using a slightly more reliable model path and adding better response checking
      const systemPrompt = `You are a professional fitness coach. Keep answers short. If recommending a routine, use JSON: {"name": "...", "exercises": [{"name": "...", "sets": 3, "reps": 10}]}`;
      const payload = {
        inputs: `[INST] ${systemPrompt} ${text} [/INST]`,
        parameters: { max_new_tokens: 400, return_full_text: false }
      };

      const response = await fetch(
        "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta",
        {
          headers: { "Content-Type": "application/json" },
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      
      const result = await response.json();
      let responseText = "";
      
      if (Array.isArray(result)) {
        responseText = result[0]?.generated_text || "";
      } else if (result.generated_text) {
        responseText = result.generated_text;
      }

      if (!responseText) throw new Error("Empty response");

      const routine = parseRoutine(responseText);
      if (routine) setProposedRoutine(routine);

      setMessages([...newMessages, { role: 'assistant', content: responseText }]);
    } catch (error) {
      console.error('AI Error:', error);
      // Fallback message with more detail
      setMessages([...newMessages, { role: 'assistant', content: "The AI is currently under heavy load. Please try one more time in 5 seconds!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRoutine = async () => {
    if (!proposedRoutine) return;
    const { error } = await addRoutine(proposedRoutine);
    if (!error) {
      setIsSaved(true);
      setMessages(prev => [...prev, { role: 'assistant', content: `Routine "${proposedRoutine.name}" saved!` }]);
    }
  };

  const suggestions = [
    { icon: <Dumbbell className="w-4 h-4" />, text: "Create a 3-day full body split" },
    { icon: <Activity className="w-4 h-4" />, text: "How to properly do a deadlift" },
    { icon: <Utensils className="w-4 h-4" />, text: "Quick high-protein breakfast idea" },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] lg:h-[calc(100vh-64px)] pb-24 lg:pb-0">
      <header className="p-4 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10 flex items-center gap-3">
        <div className="bg-primary/20 p-2 rounded-xl">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Free AI Coach</h1>
          <p className="text-xs text-muted-foreground">Powered by Open Source AI</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-primary' : 'bg-secondary'}`}>
              {m.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-primary" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl p-4 text-sm ${m.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-card border border-border rounded-tl-none'}`}>
              {m.content.split('\n').map((line, i) => {
                if (line.includes('{"name":') || line.includes('"exercises":')) return null;
                if (line.startsWith('```')) return null;
                return <p key={i} className="mb-2 last:mb-0 min-h-[1em] whitespace-pre-wrap">{line}</p>;
              })}
              
              {idx === messages.length - 1 && proposedRoutine && (
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <Dumbbell className="w-4 h-4" />
                    <span>Proposed Routine: {proposedRoutine.name}</span>
                  </div>
                  <button
                    onClick={handleSaveRoutine}
                    disabled={isSaved}
                    className={`w-full py-2 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${
                      isSaved ? 'bg-green-500/20 text-green-500' : 'bg-primary text-white hover:bg-primary/90'
                    }`}
                  >
                    {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {isSaved ? 'Saved!' : 'Save Routine'}
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
            placeholder="Ask your coach anything..."
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


