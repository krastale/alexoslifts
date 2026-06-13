import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Users, UserPlus, MessageCircle, Send, Trophy, Loader2, Check, X, Activity, Heart, Dumbbell } from 'lucide-react';

export function Community({ profile, addRoutine }) {
  const [activeTab, setActiveTab] = useState('feed'); // feed, friends, add, chat
  const [friends, setFriends] = useState([]);
  const [feed, setFeed] = useState([]);
  const [feedInteractions, setFeedInteractions] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [friendScores, setFriendScores] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Chat state
  const [activeChat, setActiveChat] = useState(null); // friend user object
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef(null);

  // Friend Profile View
  const [viewingFriendRoutines, setViewingFriendRoutines] = useState(null);
  const [friendRoutines, setFriendRoutines] = useState([]);

  useEffect(() => {
    if (profile?.id) {
      fetchFriendsAndRequests();
    }
  }, [profile?.id]);

  useEffect(() => {
    if (friends.length > 0) {
      fetchFriendScores();
      fetchFeed();
    }
  }, [friends]);

  const fetchFriendRoutines = async (friend) => {
    setLoading(true);
    setViewingFriendRoutines(friend);
    const { data } = await supabase
      .from('routines')
      .select('*')
      .eq('user_id', friend.id)
      .eq('is_public', true);
    
    setFriendRoutines(data || []);
    setLoading(false);
  };

  const importRoutine = async (routine) => {
    const { error } = await addRoutine({
      name: routine.name,
      exercises: routine.exercises,
      is_public: routine.is_public
    });
    
    if (!error) {
      alert(`Imported "${routine.name}" to your routines!`);
    }
  };

  const fetchFeed = async () => {
    const friendIds = friends.map(f => f.id);
    const { data } = await supabase
      .from('history')
      .select('*')
      .in('user_id', friendIds)
      .order('date', { ascending: false })
      .limit(30);
    
    if (data) {
      const feedWithProfiles = data.map(item => {
        const friend = friends.find(f => f.id === item.user_id);
        return { ...item, profile: friend };
      });
      setFeed(feedWithProfiles);
      
      const { data: interactionData } = await supabase
        .from('messages')
        .select('*')
        .like('content', 'FEED_LIKE:%');
        
      if (interactionData) {
        setFeedInteractions(interactionData);
      }
    }
  };

  const handleClap = async (historyItem) => {
    const alreadyClapped = feedInteractions.find(m => m.sender_id === profile.id && m.content === `FEED_LIKE:${historyItem.id}`);
    if (alreadyClapped) return;

    const newClap = {
      sender_id: profile.id,
      receiver_id: historyItem.user_id,
      content: `FEED_LIKE:${historyItem.id}`,
      created_at: new Date().toISOString()
    };
    
    setFeedInteractions(prev => [...prev, newClap]);
    await supabase.from('messages').insert([newClap]);
  };

  // Real-time chat subscription
  useEffect(() => {
    if (!activeChat || !profile?.id) return;
    
    fetchMessages();

    const subscription = supabase
      .channel(`chat_${profile.id}_${activeChat.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `sender_id=eq.${activeChat.id}` // Only listen to incoming from this friend
      }, payload => {
        if (payload.new.receiver_id === profile.id) {
          setMessages(prev => [...prev, payload.new]);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [activeChat, profile?.id]);

  const fetchFriendsAndRequests = async () => {
    setLoading(true);
    // Fetch where I am user_1 or user_2
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        id, status, user_id_1, user_id_2,
        user1:profiles!friendships_user_id_1_fkey(id, username),
        user2:profiles!friendships_user_id_2_fkey(id, username)
      `)
      .or(`user_id_1.eq.${profile.id},user_id_2.eq.${profile.id}`);

    if (data) {
      const accepted = [];
      const pending = [];
      data.forEach(f => {
        const isUser1 = f.user_id_1 === profile.id;
        const friendProfile = isUser1 ? f.user2 : f.user1;
        if (!friendProfile) return;

        if (f.status === 'accepted') {
          accepted.push({ ...friendProfile, friendship_id: f.id });
        } else if (f.status === 'pending' && !isUser1) {
          // Only show pending if I am the receiver (user_2)
          pending.push({ ...friendProfile, friendship_id: f.id });
        }
      });
      setFriends(accepted);
      setPendingRequests(pending);
    }
    setLoading(false);
  };

  const fetchFriendScores = async () => {
    const friendIds = friends.map(f => f.id);
    const { data } = await supabase
      .from('game_scores')
      .select('*')
      .in('user_id', friendIds)
      .order('score', { ascending: false });
    
    if (data) {
      const scoresMap = {};
      data.forEach(score => {
        if (!scoresMap[score.user_id]) scoresMap[score.user_id] = [];
        if (scoresMap[score.user_id].length < 3) { // keep top 3
          scoresMap[score.user_id].push(score);
        }
      });
      setFriendScores(scoresMap);
    }
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${activeChat.id}),and(sender_id.eq.${activeChat.id},receiver_id.eq.${profile.id})`)
      .order('created_at', { ascending: true })
      .limit(50);
    
    if (data) {
      setMessages(data);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const searchUsers = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, username')
      .ilike('username', `%${searchQuery}%`)
      .neq('id', profile.id)
      .limit(10);
    setSearchResults(data || []);
    setLoading(false);
  };

  const sendFriendRequest = async (userId) => {
    await supabase.from('friendships').insert([{
      user_id_1: profile.id,
      user_id_2: userId,
      status: 'pending'
    }]);
    alert('Friend request sent!');
    setSearchResults([]);
  };

  const handleRequest = async (friendshipId, accept) => {
    if (accept) {
      await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
    } else {
      await supabase.from('friendships').delete().eq('id', friendshipId);
    }
    fetchFriendsAndRequests();
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChat) return;

    const newMessage = {
      sender_id: profile.id,
      receiver_id: activeChat.id,
      content: messageInput,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, { ...newMessage, id: Date.now() }]);
    setMessageInput('');
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    await supabase.from('messages').insert([newMessage]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] lg:h-[calc(100vh-64px)] pb-24 lg:pb-0 bg-background">
      <header className="p-4 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <h1 className="text-xl font-bold mb-4">Community</h1>
        {!activeChat && !viewingFriendRoutines ? (
          <div className="flex gap-2 p-1 bg-secondary/50 rounded-xl overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveTab('feed')} className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-bold transition-all ${activeTab === 'feed' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground'}`}>
              <Activity className="w-4 h-4" /> Feed
            </button>
            <button onClick={() => setActiveTab('friends')} className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-bold transition-all ${activeTab === 'friends' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground'}`}>
              <Users className="w-4 h-4" /> Friends
            </button>
            <button onClick={() => setActiveTab('add')} className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-bold transition-all ${activeTab === 'add' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground'}`}>
              <UserPlus className="w-4 h-4" /> Add
              {pendingRequests.length > 0 && <span className="bg-red-500 text-white w-4 h-4 rounded-full text-[10px] flex items-center justify-center">{pendingRequests.length}</span>}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button onClick={() => { setActiveChat(null); setViewingFriendRoutines(null); }} className="text-muted-foreground hover:text-foreground">
              <X className="w-6 h-6" />
            </button>
            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-bold">{activeChat?.username || viewingFriendRoutines?.username}</h2>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto">
        {!activeChat && !viewingFriendRoutines && activeTab === 'feed' && (
          // ... (rest of feed rendering is unchanged, I'll keep it simple in this call)
          <div className="p-4 space-y-6">
            {feed.length === 0 ? (
              <div className="text-center text-muted-foreground p-12 bg-secondary/20 rounded-3xl border border-dashed border-border space-y-4">
                <Activity className="w-10 h-10 mx-auto text-primary/50" />
                <p className="text-sm">Your feed is quiet.<br/>Add friends to see their workouts!</p>
                <button onClick={() => setActiveTab('add')} className="text-primary font-bold hover:underline">Find Friends</button>
              </div>
            ) : (
              feed.map(item => {
                const totalVolume = Math.round(item.exercises?.reduce((acc, ex) => 
                  acc + (ex.sets?.reduce((sAcc, set) => sAcc + (parseFloat(set.weight) * parseInt(set.reps) || 0), 0) || 0)
                , 0) || 0);
                
                const claps = feedInteractions.filter(m => m.content === `FEED_LIKE:${item.id}`);
                const hasClapped = claps.some(m => m.sender_id === profile.id);

                return (
                  <div key={item.id} className="bg-card border border-border p-5 rounded-3xl space-y-4 shadow-sm hover:border-primary/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
                          {item.profile?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold">{item.profile?.username}</h3>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            {new Date(item.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="p-2 bg-secondary rounded-xl text-primary">
                        <Dumbbell className="w-4 h-4" />
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="font-black text-lg tracking-tight uppercase">{item.routine_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Crushed {item.exercises?.length || 0} exercises, lifting a total of <span className="font-bold text-foreground">{totalVolume.toLocaleString()} {profile?.units}</span>.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border flex gap-4">
                      <button 
                        onClick={() => handleClap(item)}
                        className={`flex items-center gap-2 text-xs font-bold transition-all ${hasClapped ? 'text-red-500' : 'text-muted-foreground hover:text-red-400'}`}
                      >
                        <Heart className={`w-4 h-4 ${hasClapped ? 'fill-red-500' : ''}`} />
                        {claps.length} {claps.length === 1 ? 'Clap' : 'Claps'}
                      </button>
                      <button 
                        onClick={() => setActiveChat(item.profile)}
                        className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Comment
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {!activeChat && !viewingFriendRoutines && activeTab === 'friends' && (
          <div className="p-4 space-y-4">
            {friends.length === 0 ? (
              <div className="text-center text-muted-foreground p-8 bg-secondary/20 rounded-2xl border border-dashed border-border">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">You have no friends yet.</p>
                <button onClick={() => setActiveTab('add')} className="text-primary font-bold mt-2 hover:underline">Find friends</button>
              </div>
            ) : (
              friends.map(friend => (
                <div key={friend.id} className="bg-card border border-border p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xs">
                        {friend.username?.charAt(0).toUpperCase()}
                      </div>
                      {friend.username}
                    </h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => fetchFriendRoutines(friend)}
                        className="bg-secondary p-2 rounded-lg text-primary hover:bg-secondary/80 transition-colors"
                        title="View Routines"
                      >
                        <Dumbbell className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setActiveChat(friend)}
                        className="bg-secondary p-2 rounded-lg text-primary hover:bg-secondary/80 transition-colors"
                        title="Send Message"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Friend Scores */}
                  {friendScores[friend.id] && friendScores[friend.id].length > 0 && (
                    <div className="bg-secondary/30 p-3 rounded-xl">
                      <p className="text-xs font-bold text-muted-foreground uppercase mb-2 flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-yellow-500" /> Top Scores
                      </p>
                      <div className="space-y-1">
                        {friendScores[friend.id].map((s, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{s.game_name}</span>
                            <span className="font-bold">{s.score}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Friend Routines View */}
        {viewingFriendRoutines && (
          <div className="p-4 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Public Routines
            </h3>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : friendRoutines.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No public routines found.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {friendRoutines.map(routine => (
                  <div key={routine.id} className="bg-card border border-border p-5 rounded-2xl space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-lg">{routine.name}</h4>
                        <p className="text-xs text-muted-foreground uppercase font-black">{routine.exercises.length} Exercises</p>
                      </div>
                      <button 
                        onClick={() => importRoutine(routine)}
                        className="bg-primary/10 text-primary p-2 rounded-xl hover:bg-primary/20 transition-colors"
                        title="Import Routine"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-1.5 border-t border-border/50 pt-3">
                      {routine.exercises.slice(0, 3).map((ex, i) => (
                        <div key={i} className="flex justify-between text-xs text-muted-foreground">
                          <span>{ex.name}</span>
                          <span>{ex.sets}x{ex.reps}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!activeChat && activeTab === 'add' && (
          <div className="p-4 space-y-8">
            {pendingRequests.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-muted-foreground uppercase">Friend Requests</h3>
                {pendingRequests.map(req => (
                  <div key={req.friendship_id} className="bg-card border border-border p-3 rounded-xl flex justify-between items-center">
                    <span className="font-bold">{req.username}</span>
                    <div className="flex gap-2">
                      <button onClick={() => handleRequest(req.friendship_id, true)} className="p-2 bg-green-500 text-white rounded-lg"><Check className="w-4 h-4" /></button>
                      <button onClick={() => handleRequest(req.friendship_id, false)} className="p-2 bg-red-500 text-white rounded-lg"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3">
              <h3 className="font-bold text-sm text-muted-foreground uppercase">Find Users</h3>
              <form onSubmit={searchUsers} className="flex gap-2">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search username..."
                  className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                <button type="submit" disabled={loading} className="bg-primary text-white px-4 rounded-xl font-bold">Search</button>
              </form>

              <div className="space-y-2 mt-4">
                {searchResults.map(u => (
                  <div key={u.id} className="bg-card border border-border p-3 rounded-xl flex justify-between items-center">
                    <span className="font-bold">{u.username}</span>
                    <button 
                      onClick={() => sendFriendRequest(u.id)}
                      className="text-xs bg-secondary px-3 py-1.5 rounded-lg font-bold hover:bg-secondary/80"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chat Interface */}
        {activeChat && (
          <div className="p-4 space-y-4">
            {messages.map((m, idx) => {
              const isMe = m.sender_id === profile.id;
              return (
                <div key={m.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-secondary text-foreground rounded-tl-none'}`}>
                    {m.content}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 mx-1">
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {activeChat && (
        <div className="p-4 bg-background border-t border-border mt-auto">
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Message..."
              className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary text-sm"
            />
            <button
              type="submit"
              disabled={!messageInput.trim()}
              className="bg-primary text-white p-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
