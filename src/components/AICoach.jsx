import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Send, Bot, User, Sparkles, AlertCircle, Dumbbell, Activity, Utensils, Save, CheckCircle2, Settings } from 'lucide-react';

export function AICoach({ profile, addRoutine }) {
  // Use user's custom key if available, fallback to environment variable
  const activeApiKey = profile?.ai_api_key || import.meta.env.VITE_GEMINI_API_KEY;
  const genAI = activeApiKey ? new GoogleGenerativeAI(activeApiKey) : null;

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi ${profile?.username || 'there'}! I'm your AI fitness coach. I can help you create workout plans, check your form, or give nutrition advice. How can I help today?`
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
      // Look for JSON block in the response
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
    
    if (!activeApiKey) {
      setMessages(prev => [...prev, { role: 'user', content: text }, { 
        role: 'assistant', 
        content: "I need an API key to help you. Please go to **Settings** and add your free Gemini API key from Google AI Studio." 
      }]);
      setInput('');
      return;
    }

    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setProposedRoutine(null);
    setIsSaved(false);

    try {
      if (!genAI) throw new Error("AI not initialized");
      
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: `You are a professional, encouraging fitness coach. Keep answers concise and practical. 
        User profile: ${JSON.stringify(profile)}.
        
        CRITICAL: If the user wants a workout plan or routine, you MUST suggest it in the following JSON format at the end of your message wrapped in code blocks:
        {
          "name": "Routine Name",
          "exercises": [
            { "name": "Exercise Name", "sets": 3, "reps": 10 },
            ...
          ]
        }
        Do not include any other text inside the JSON code block.`
      });
      
      const chat = model.startChat({
        history: messages.slice(1).map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        generationConfig: { maxOutputTokens: 1000 },
      });

      const result = await chat.sendMessage(text);
      const response = await result.response;
      const responseText = response.text();
      
      const routine = parseRoutine(responseText);
      if (routine) {
        setProposedRoutine(routine);
      }

      setMessages([...newMessages, { role: 'assistant', content: responseText }]);
    } catch (error) {
      console.error('Gemini API Error:', error);
      let errorMsg = `Error: ${error.message || 'I had trouble connecting. Please check your API key or internet connection.'}`;
      
      if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('invalid')) {
        errorMsg = 'Your Gemini API key seems to be invalid. Please go to **Settings** and update it with a fresh key from Google AI Studio.';
      } else if (error.message?.includes('API key not found')) {
        errorMsg = 'API Key not found. Please ensure your key is correctly set in **Settings**.';
      }
      
      setMessages([...newMessages, { role: 'assistant', content: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRoutine = async () => {
    if (!proposedRoutine) return;
    const { error } = await addRoutine(proposedRoutine);
    if (!error) {
      setIsSaved(true);
      setMessages(prev => [...prev, { role: 'assistant', content: `Great! I've saved the "${proposedRoutine.name}" routine to your profile. You can find it in the Routines tab.` }]);
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
          <h1 className="text-xl font-bold">AI Coach</h1>
          <p className="text-xs text-muted-foreground">Powered by Gemini</p>
        </div>
      </header>

      {!activeApiKey && (
        <div className="m-4 p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-start gap-3 animate-pulse">
          <Settings className="w-5 h-5 text-primary shrink-0" />
          <p className="text-sm text-primary">
            <strong>Ready to start?</strong> Go to **Settings** and paste your free Google Gemini API key to enable your personal fitness coach!
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-primary' : 'bg-secondary'}`}>
              {m.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-primary" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl p-4 text-sm ${m.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-card border border-border rounded-tl-none'}`}>
              {m.content.split('\n').map((line, i) => {
                if (line.startsWith('```json') || line.startsWith('```')) return null;
                if (line.trim() === '}' || (line.trim().startsWith('{') && line.includes('"name"'))) return null;
                return <p key={i} className="mb-2 last:mb-0 min-h-[1em] whitespace-pre-wrap">{line}</p>;
              })}
              
              {idx === messages.length - 1 && proposedRoutine && (
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <Dumbbell className="w-4 h-4" />
                    <span>Proposed Routine: {proposedRoutine.name}</span>
                  </div>
                  <div className="space-y-1 opacity-80">
                    {proposedRoutine.exercises.map((ex, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span>{ex.name}</span>
                        <span>{ex.sets}x{ex.reps}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleSaveRoutine}
                    disabled={isSaved}
                    className={`w-full py-2 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${
                      isSaved ? 'bg-green-500/20 text-green-500' : 'bg-primary text-white hover:bg-primary/90'
                    }`}
                  >
                    {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {isSaved ? 'Saved to Routines' : 'Save to My Routines'}
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

