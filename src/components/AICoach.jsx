import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Send, Bot, User, Sparkles, AlertCircle, Dumbbell, Activity, Utensils } from 'lucide-react';

// Initialize Gemini if key exists
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export function AICoach({ profile }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi ${profile?.username || 'there'}! I'm your AI fitness coach. I can help you create workout plans, check your form, or give nutrition advice. How can I help today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (text = input) => {
    if (!text.trim()) return;
    
    if (!genAI) {
      alert("Please add your VITE_GEMINI_API_KEY to your .env.local file to use the AI Coach.");
      return;
    }

    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      // Build a simple prompt context
      const systemPrompt = `You are a professional, encouraging fitness coach. Keep answers concise, practical, and tailored for a gym app user. User profile: ${JSON.stringify(profile)}.`;
      
      const chat = model.startChat({
        history: messages.slice(1).map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        generationConfig: { maxOutputTokens: 1000 },
      });

      const result = await chat.sendMessage(`${systemPrompt}\n\nUser: ${text}`);
      const response = await result.response;
      
      setMessages([...newMessages, { role: 'assistant', content: response.text() }]);
    } catch (error) {
      console.error(error);
      setMessages([...newMessages, { role: 'assistant', content: 'Oops! I had trouble connecting. Please check your API key or internet connection.' }]);
    } finally {
      setIsLoading(false);
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

      {!apiKey && (
        <div className="m-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-500">
            <strong>Missing API Key:</strong> Add <code className="bg-black/20 px-1 rounded">VITE_GEMINI_API_KEY</code> to your <code className="bg-black/20 px-1 rounded">.env.local</code> file to enable the AI Coach.
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
              {m.content.split('\n').map((line, i) => (
                <p key={i} className="mb-2 last:mb-0 min-h-[1em]">{line}</p>
              ))}
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
            disabled={isLoading || !apiKey}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || !apiKey}
            className="bg-primary text-white p-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
