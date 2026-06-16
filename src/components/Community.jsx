import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { Users, UserPlus, MessageCircle, Send, Trophy, Loader2, Check, X, Activity, Heart, Dumbbell, RefreshCw, Globe, Download, Flame, BarChart3, Calendar } from 'lucide-react';

export function Community({ profile, addRoutine }) {
  const [activeTab, setActiveTab] = useState('feed'); // feed, friends, add, chat
  const [friends, setFriends] = useState([]);
  const [feed, setFeed] = useState([]);
  const [feedInteractions, setFeedInteractions] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [friendScores, setFriendScores] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [postInput, setPostInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Chat state
  const [activeChat, setActiveChat] = useState(null); // friend user object
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef(null);

  const [newMessages, setNewMessages] = useState({}); // { friendId: count }

  const leaderboardData = useMemo(() => {
    if (activeTab !== 'leaderboards') return null;

    try {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0,0,0,0);
      const startTs = startOfWeek.getTime();

      const userStats = {};
      const allProfiles = [profile, ...friends].filter(Boolean);

      allProfiles.forEach(p => {
        if (p?.id) {
          userStats[p.id] = { 
            profile: p, 
            volume: 0, 
            workouts: 0, 
            claps: 0 
          };
        }
      });

      // Volume & Workouts
      (feed || []).forEach(item => {
        if (!item) return;
        const itemTs = item.timestamp || (item.date ? new Date(item.date).getTime() : 0);
        if (item.type === 'workout' && itemTs >= startTs) {
          if (item.user_id && userStats[item.user_id]) {
            userStats[item.user_id].workouts += 1;
            const vol = item.exercises?.reduce((acc, ex) => 
              acc + (ex.sets?.reduce((sAcc, set) => sAcc + (parseFloat(set.weight) * parseInt(set.reps) || 0), 0) || 0)
            , 0) || 0;
            userStats[item.user_id].volume += vol;
          }
        }
      });

      // Claps
      (feedInteractions || []).forEach(m => {
        if (!m) return;
        const createdTs = m.created_at ? new Date(m.created_at).getTime() : 0;
        if (createdTs >= startTs) {
          if (m.receiver_id && userStats[m.receiver_id]) {
            userStats[m.receiver_id].claps += 1;
          }
        }
      });

      const statsArray = Object.values(userStats);

      return {
        volume: [...statsArray].sort((a, b) => (b.volume || 0) - (a.volume || 0)),
        consistency: [...statsArray].sort((a, b) => (b.workouts || 0) - (a.workouts || 0)),
        popular: [...statsArray].sort((a, b) => (b.claps || 0) - (a.claps || 0))
      };
    } catch (err) {
      console.error('Leaderboard error:', err);
      return { volume: [], consistency: [], popular: [] };
    }
  }, [activeTab, feed, feedInteractions, friends, profile]);

  // Friend Profile View
  const [viewingFriendRoutines, setViewingFriendRoutines] = useState(null);
  const [friendRoutines, setFriendRoutines] = useState([]);

  useEffect(() => {
    if (profile?.id) {
      fetchFriendsAndRequests();
    }
  }, [profile?.id]);

  // Global message subscription for notifications
  useEffect(() => {
    if (!profile?.id) return;

    const subscription = supabase
      .channel('global_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${profile.id}`
      }, payload => {
        if (!activeChat || activeChat.id !== payload.new.sender_id) {
          setNewMessages(prev => ({
            ...prev,
            [payload.new.sender_id]: (prev[payload.new.sender_id] || 0) + 1
          }));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [profile?.id, activeChat]);

  useEffect(() => {
    if (friends.length > 0) {
      fetchFriendScores();
      fetchFeed();

      // Real-time feed subscription
      const subscription = supabase
        .channel('public_feed')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'history'
        }, payload => {
          const friend = (friends || []).filter(Boolean).find(f => f.id === payload.new.user_id);
          if (friend) {
            setFeed(prev => [{ ...payload.new, profile: friend }, ...prev]);
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
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
    const allIds = [...friendIds, profile.id];

    const [historyRes, postsRes] = await Promise.all([
      supabase.from('history').select('*').in('user_id', allIds).order('date', { ascending: false }).limit(20),
      supabase.from('posts').select('*').in('user_id', allIds).order('created_at', { ascending: false }).limit(20)
    ]);
    
    const combinedFeed = [];
    
    if (historyRes.data) {
      historyRes.data.forEach(item => {
        const userProfile = item.user_id === profile.id ? profile : (friends || []).filter(Boolean).find(f => f.id === item.user_id);
        combinedFeed.push({ ...item, type: 'workout', profile: userProfile, timestamp: new Date(item.date).getTime() });
      });
    }

    if (postsRes.data) {
      postsRes.data.forEach(item => {
        const userProfile = item.user_id === profile.id ? profile : (friends || []).filter(Boolean).find(f => f.id === item.user_id);
        combinedFeed.push({ ...item, type: 'post', profile: userProfile, timestamp: new Date(item.created_at).getTime() });
      });
    }

    combinedFeed.sort((a, b) => b.timestamp - a.timestamp);
    setFeed(combinedFeed);
    
    const { data: interactionData } = await supabase
      .from('messages')
      .select('*')
      .or(`content.like.FEED_LIKE:%,content.like.POST_LIKE:%`);
        
    if (interactionData) {
      setFeedInteractions(interactionData);
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!postInput.trim()) return;

    const { error } = await supabase
      .from('posts')
      .insert([{
        user_id: profile.id,
        content: postInput.trim()
      }]);

    if (!error) {
      setPostInput('');
      fetchFeed();
    }
  };

  const handleClap = async (item) => {
    const typePrefix = item.type === 'workout' ? 'FEED_LIKE' : 'POST_LIKE';
    const alreadyClapped = feedInteractions.find(m => m.sender_id === profile.id && m.content === `${typePrefix}:${item.id}`);
    if (alreadyClapped) return;

    const newClap = {
      sender_id: profile.id,
      receiver_id: item.user_id,
      content: `${typePrefix}:${item.id}`,
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
    if (!profile?.id) return;
    setLoading(true);
    try {
      // Fetch where I am user_1 (sender) or user_2 (receiver)
      // Using explicit FK column hints for reliability
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          id, status, user_id_1, user_id_2,
          user1:profiles!user_id_1(id, username),
          user2:profiles!user_id_2(id, username)
        `)
        .or(`user_id_1.eq.${profile.id},user_id_2.eq.${profile.id}`);

      if (error) {
        console.error('Database join error:', error);
        throw error;
      }

      if (data) {
        const accepted = [];
        const incoming = [];
        const outgoing = [];
        
        data.forEach(f => {
          const isUser1 = f.user_id_1 === profile.id;
          const friendProfile = isUser1 ? f.user2 : f.user1;
          
          if (f.status === 'accepted') {
            if (friendProfile) accepted.push({ ...friendProfile, friendship_id: f.id });
          } else if (f.status === 'pending') {
            if (isUser1) {
              if (friendProfile) outgoing.push({ ...friendProfile, friendship_id: f.id });
            } else {
              if (friendProfile) incoming.push({ ...friendProfile, friendship_id: f.id });
            }
          }
        });
        
        setFriends(accepted);
        setPendingRequests(incoming);
        setSentRequests(outgoing);
      }
    } catch (err) {
      console.error('Error fetching friends:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriendScores = async () => {
    const friendIds = friends.map(f => f.id);
    const { data } = await supabase
      .from('game_scores')
      .select('*')
      .in('user_id', friendIds);
    
    if (data) {
      const scoresMap = {};
      data.forEach(score => {
        if (!scoresMap[score.user_id]) scoresMap[score.user_id] = {};
        const gName = score.game_name;
        
        if (!scoresMap[score.user_id][gName]) {
          scoresMap[score.user_id][gName] = score;
        } else {
          const currentBest = scoresMap[score.user_id][gName].score;
          if (gName.includes('Reaction Time')) {
             if (score.score < currentBest) scoresMap[score.user_id][gName] = score;
          } else {
             if (score.score > currentBest) scoresMap[score.user_id][gName] = score;
          }
        }
      });
      
      const finalMap = {};
      for (const [userId, games] of Object.entries(scoresMap)) {
         finalMap[userId] = Object.values(games).sort((a, b) => {
           if (a.game_name.includes('Reaction Time')) return 0; // Don't sub-sort yet
           return b.score - a.score;
         });
      }
      setFriendScores(finalMap);
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
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username')
      .ilike('username', `%${searchQuery.trim()}%`)
      .neq('id', profile.id)
      .limit(10);
    
    if (error) {
      console.error('Search error:', error);
      alert('Error searching for users. Please try again.');
    }
    
    setSearchResults(data || []);
    setLoading(false);
  };

  const sendFriendRequest = async (userId) => {
    const { error } = await supabase.from('friendships').insert([{
      user_id_1: profile.id,
      user_id_2: userId,
      status: 'pending'
    }]);

    if (error) {
      console.error('Error sending friend request:', error);
      alert(`Failed to send request: ${error.message}`);
    } else {
      alert('Friend request sent!');
      fetchFriendsAndRequests();
    }
    setSearchResults([]);
  };

  const handleRequest = async (friendshipId, accept) => {
    let error;
    if (accept) {
      const { error: err } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
      error = err;
    } else {
      const { error: err } = await supabase.from('friendships').delete().eq('id', friendshipId);
      error = err;
    }

    if (error) {
      console.error('Error handling friend request:', error);
      alert(`Error: ${error.message}`);
    } else {
      fetchFriendsAndRequests();
    }
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
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Community</h1>
          <button 
            onClick={() => { fetchFriendsAndRequests(); fetchFeed(); }}
            className={`p-2 hover:bg-secondary rounded-lg transition-all ${loading ? 'animate-spin text-primary' : 'text-muted-foreground'}`}
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
        {!activeChat && !viewingFriendRoutines ? (
          <div className="flex gap-2 p-1 bg-secondary/50 rounded-xl overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveTab('feed')} className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-bold transition-all ${activeTab === 'feed' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground'}`}>
              <Activity className="w-4 h-4" /> Feed
            </button>
            <button 
              onClick={() => { setActiveTab('friends'); fetchFriendsAndRequests(); }} 
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-bold transition-all relative ${activeTab === 'friends' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground'}`}
            >
              <Users className="w-4 h-4" /> Friends
              {Object.values(newMessages).some(count => count > 0) && (
                <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full border border-background"></span>
              )}
            </button>
            <button 
              onClick={() => { setActiveTab('add'); fetchFriendsAndRequests(); }} 
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-bold transition-all ${activeTab === 'add' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground'}`}
            >
              <UserPlus className="w-4 h-4" /> Add
              {pendingRequests.length > 0 && <span className="bg-red-500 text-white w-4 h-4 rounded-full text-[10px] flex items-center justify-center">{pendingRequests.length}</span>}
            </button>
            <button 
              onClick={() => setActiveTab('leaderboards')} 
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-bold transition-all ${activeTab === 'leaderboards' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground'}`}
            >
              <BarChart3 className="w-4 h-4" /> Leaders
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
          <div className="p-4 space-y-6">
            {/* Post Input */}
            <form onSubmit={handlePost} className="bg-card border border-border p-4 rounded-3xl shadow-sm space-y-3">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold shrink-0">
                  {profile?.username?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <textarea
                  value={postInput}
                  onChange={(e) => setPostInput(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full bg-secondary border-none rounded-2xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary min-h-[80px] resize-none"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!postInput.trim()}
                  className="bg-primary text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Post
                </button>
              </div>
            </form>

            {feed.length === 0 ? (
              <div className="text-center text-muted-foreground p-12 bg-secondary/20 rounded-3xl border border-dashed border-border space-y-4">
                <Activity className="w-10 h-10 mx-auto text-primary/50" />
                <p className="text-sm">Your feed is quiet.<br/>Add friends to see their updates!</p>
                <button onClick={() => setActiveTab('add')} className="text-primary font-bold hover:underline">Find Friends</button>
              </div>
            ) : (
              feed.map(item => {
                const isWorkout = item.type === 'workout';
                const totalVolume = isWorkout ? Math.round(item.exercises?.reduce((acc, ex) => 
                  acc + (ex.sets?.reduce((sAcc, set) => sAcc + (parseFloat(set.weight) * parseInt(set.reps) || 0), 0) || 0)
                , 0) || 0) : 0;
                
                const typePrefix = isWorkout ? 'FEED_LIKE' : 'POST_LIKE';
                const claps = feedInteractions.filter(m => m.content === `${typePrefix}:${item.id}`);
                const hasClapped = claps.some(m => m.sender_id === profile.id);

                return (
                  <div key={`${item.type}-${item.id}`} className="bg-card border border-border p-5 rounded-3xl space-y-4 shadow-sm hover:border-primary/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
                          {item.profile?.username?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold">{item.profile?.username || 'Lifter'}</h3>
                            {isWorkout && item.exercises?.some(ex => ex.sets?.some(s => s.isPR)) && (
                              <span className="bg-orange-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 animate-pulse">
                                NEW PR <Flame className="w-2 h-2 fill-white" />
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            {new Date(item.timestamp).toLocaleDateString()} at {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="p-2 bg-secondary rounded-xl text-primary">
                        {isWorkout ? <Dumbbell className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
                      </div>
                    </div>
                    
                    {isWorkout ? (
                      <div className="space-y-1">
                        <p className="font-black text-lg tracking-tight uppercase">{item.routine_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Crushed {item.exercises?.length || 0} exercises, lifting a total of <span className="font-bold text-foreground">{totalVolume.toLocaleString()} {profile?.units}</span>.
                        </p>
                      </div>
                    ) : (
                      <p className="text-foreground whitespace-pre-wrap">{item.content}</p>
                    )}

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

        {/* Leaderboards View */}
        {!activeChat && !viewingFriendRoutines && activeTab === 'leaderboards' && leaderboardData && (
          <div className="p-4 space-y-8 pb-32">
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-6 rounded-3xl border border-primary/20">
              <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-2 mb-1">
                <Trophy className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                Weekly Champions
              </h2>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Resets every Sunday</p>
            </div>

            {/* Volume King */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Dumbbell className="w-4 h-4" /> Volume King (kg)
              </h3>
              <div className="bg-card border border-border rounded-3xl divide-y divide-border overflow-hidden">
                {leaderboardData.volume.map((stat, i) => (
                  <div key={stat.profile?.id || i} className="p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-black ${i === 0 ? 'bg-yellow-500 text-black' : 'bg-secondary text-muted-foreground'}`}>{i + 1}</span>
                      <span className="font-bold">{stat.profile?.username || 'Lifter'}</span>
                    </div>
                    <span className="font-black text-primary">{stat.volume.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Consistency Legend */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Consistency Legend
              </h3>
              <div className="bg-card border border-border rounded-3xl divide-y divide-border overflow-hidden">
                {leaderboardData.consistency.map((stat, i) => (
                  <div key={stat.profile?.id || i} className="p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-black ${i === 0 ? 'bg-blue-500 text-white' : 'bg-secondary text-muted-foreground'}`}>{i + 1}</span>
                      <span className="font-bold">{stat.profile?.username || 'Lifter'}</span>
                    </div>
                    <span className="font-black text-blue-500">{stat.workouts} Workouts</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Clap Magnet */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Heart className="w-4 h-4" /> Clap Magnet
              </h3>
              <div className="bg-card border border-border rounded-3xl divide-y divide-border overflow-hidden">
                {leaderboardData.popular.map((stat, i) => (
                  <div key={stat.profile?.id || i} className="p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-black ${i === 0 ? 'bg-red-500 text-white' : 'bg-secondary text-muted-foreground'}`}>{i + 1}</span>
                      <span className="font-bold">{stat.profile?.username || 'Lifter'}</span>
                    </div>
                    <span className="font-black text-red-500">{stat.claps} Claps</span>
                  </div>
                ))}
              </div>
            </div>
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
                        {friend.username?.charAt(0)?.toUpperCase() || 'U'}
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
                        onClick={() => {
                          setActiveChat(friend);
                          setNewMessages(prev => ({ ...prev, [friend.id]: 0 }));
                        }}
                        className="bg-secondary p-2 rounded-lg text-primary hover:bg-secondary/80 transition-colors relative"
                        title="Send Message"
                      >
                        <MessageCircle className="w-5 h-5" />
                        {newMessages[friend.id] > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                            {newMessages[friend.id]}
                          </span>
                        )}
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
                      {routine.exercises.map((ex, i) => (
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
                <h3 className="font-bold text-sm text-muted-foreground uppercase">Incoming Requests</h3>
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

            {sentRequests.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-muted-foreground uppercase">Sent Requests</h3>
                {sentRequests.map(req => (
                  <div key={req.friendship_id} className="bg-card border border-border p-3 rounded-xl flex justify-between items-center opacity-70">
                    <span className="font-bold">{req.username}</span>
                    <span className="text-xs font-bold uppercase tracking-widest text-primary">Pending</span>
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
                {searchResults.map(u => {
                  const isFriend = friends.some(f => f.id === u.id);
                  const isSent = sentRequests.some(s => s.id === u.id);
                  const isIncoming = pendingRequests.some(p => p.id === u.id);

                  return (
                    <div key={u.id} className="bg-card border border-border p-3 rounded-xl flex justify-between items-center">
                      <span className="font-bold">{u.username}</span>
                      {isFriend ? (
                        <span className="text-xs text-green-500 font-bold px-3 py-1.5 bg-green-500/10 rounded-lg">Friends</span>
                      ) : isSent ? (
                        <span className="text-xs text-primary font-bold px-3 py-1.5 bg-primary/10 rounded-lg">Request Sent</span>
                      ) : isIncoming ? (
                        <button 
                          onClick={() => setActiveTab('add')}
                          className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-bold"
                        >
                          Respond
                        </button>
                      ) : (
                        <button 
                          onClick={() => sendFriendRequest(u.id)}
                          className="text-xs bg-secondary px-3 py-1.5 rounded-lg font-bold hover:bg-secondary/80"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  );
                })}
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
