import { useState, useEffect } from 'react';
import { MessageCircle, Search, Menu, Phone, Users, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export const Sidebar = ({
  currentView,
  onViewChange,
  selectedConversationId,
  onSelectConversation,
}) => {
  const { profile, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  useEffect(() => {
    if (profile) {
      loadConversations();
      loadUsers();
    }
  }, [profile]);
  const loadConversations = async () => {
    if (!profile) return;
    const { data: participantData } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', profile.id);
    if (!participantData) return;
    const conversationIds = participantData.map(p => p.conversation_id);
    const { data: conversationsData } = await supabase
      .from('conversations')
      .select('*')
      .in('id', conversationIds)
      .order('updated_at', { ascending: false });
    if (conversationsData) {
      const conversationsWithUsers = await Promise.all(
        conversationsData.map(async (conv) => {
          if (!conv.is_group) {
            const { data: participants } = await supabase
              .from('conversation_participants')
              .select('user_id')
              .eq('conversation_id', conv.id)
              .neq('user_id', profile.id)
              .maybeSingle();
            if (participants) {
              const { data: otherUser } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', participants.user_id)
                .maybeSingle();
              return { ...conv, otherUser: otherUser || undefined };
            }
          }
          return conv;
        })
      );
      setConversations(conversationsWithUsers);
    }
  };
  const loadUsers = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', profile.id);
    if (data) {
      setUsers(data);
    }
  };
  const createConversation = async (otherUserId) => {
    if (!profile) return;
    const { data: existingConv } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', profile.id);
    if (existingConv) {
      for (const conv of existingConv) {
        const { data: otherParticipant } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conv.conversation_id)
          .eq('user_id', otherUserId)
          .maybeSingle();
        if (otherParticipant) {
          onSelectConversation(conv.conversation_id);
          setShowNewChat(false);
          return;
        }
      }
    }
    const { data: newConv } = await supabase
      .from('conversations')
      .insert({
        is_group: false,
        created_by: profile.id,
      })
      .select()
      .single();
    if (newConv) {
      await supabase.from('conversation_participants').insert([
        { conversation_id: newConv.id, user_id: profile.id },
        { conversation_id: newConv.id, user_id: otherUserId },
      ]);
      onSelectConversation(newConv.id);
      setShowNewChat(false);
      loadConversations();
    }
  };
  const getConversationName = (conv) => {
    if (conv.is_group) return conv.name || 'Group Chat';
    return conv.otherUser?.full_name || 'Unknown User';
  };
  const getConversationAvatar = (conv) => {
    if (conv.is_group) return conv.avatar_url;
    return conv.otherUser?.avatar_url;
  };
  return (
    <div className="w-80 flex flex-col border-r" style={{ backgroundColor: '#021142', borderColor: '#051834' }}>
      <div className="p-4 border-b" style={{ borderColor: '#051834' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #FFD87C 0%, #CA973E 100%)' }}>
              <MessageCircle className="w-5 h-5" style={{ color: '#031229' }} />
            </div>
            <div>
              <h2 className="font-bold" style={{ color: '#FFFFFF' }}>VibeChat</h2>
              <p className="text-xs" style={{ color: '#526F8A' }}>BIZVILITY</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="p-2 rounded-lg hover:bg-opacity-10 transition-colors"
            style={{ color: '#526F8A' }}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
             style={{ backgroundColor: '#051834' }}>
          <Search className="w-4 h-4" style={{ color: '#526F8A' }} />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: '#FFFFFF' }}
          />
        </div>
      </div>
      <div className="flex border-b" style={{ borderColor: '#051834' }}>
        {(['chats', 'status', 'calls', 'groups']).map((view) => (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            className="flex-1 py-3 text-sm font-medium transition-colors"
            style={{
              color: currentView === view ? '#FFD87C' : '#526F8A',
              borderBottom: currentView === view ? '2px solid #FFD87C' : 'none',
            }}
          >
            {view === 'chats' && <MessageCircle className="w-5 h-5 mx-auto" />}
            {view === 'status' && <Clock className="w-5 h-5 mx-auto" />}
            {view === 'calls' && <Phone className="w-5 h-5 mx-auto" />}
            {view === 'groups' && <Users className="w-5 h-5 mx-auto" />}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {currentView === 'chats' && (
          <>
            <button
              onClick={() => setShowNewChat(!showNewChat)}
              className="w-full p-4 text-left hover:bg-opacity-5 hover:bg-white transition-colors"
              style={{ color: '#FFD87C', borderBottom: '1px solid #051834' }}
            >
              + New Chat
            </button>
            {showNewChat && (
              <div className="border-b" style={{ borderColor: '#051834' }}>
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => createConversation(user.id)}
                    className="w-full p-4 flex items-center gap-3 hover:bg-opacity-5 hover:bg-white transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold"
                         style={{ backgroundColor: '#385B9E', color: '#FFFFFF' }}>
                      {user.full_name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium" style={{ color: '#FFFFFF' }}>
                        {user.full_name}
                      </p>
                      <p className="text-sm" style={{ color: '#526F8A' }}>
                        @{user.username}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className="w-full p-4 flex items-center gap-3 hover:bg-opacity-5 hover:bg-white transition-colors"
                style={{
                  backgroundColor: selectedConversationId === conv.id ? 'rgba(255, 216, 124, 0.1)' : 'transparent',
                }}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold"
                     style={{
                       backgroundColor: getConversationAvatar(conv) ? 'transparent' : '#385B9E',
                       backgroundImage: getConversationAvatar(conv) ? `url(${getConversationAvatar(conv)})` : 'none',
                       backgroundSize: 'cover',
                       color: '#FFFFFF'
                     }}>
                  {!getConversationAvatar(conv) && getConversationName(conv)[0].toUpperCase()}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium" style={{ color: '#FFFFFF' }}>
                    {getConversationName(conv)}
                  </p>
                  <p className="text-sm truncate" style={{ color: '#526F8A' }}>
                    {conv.otherUser?.status_text || 'Click to start chatting'}
                  </p>
                </div>
                {conv.otherUser?.is_online && (
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#4CAF50' }} />
                )}
              </button>
            ))}
          </>
        )}
      </div>
      <div className="p-4 border-t" style={{ borderColor: '#051834' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold"
               style={{ backgroundColor: '#385B9E', color: '#FFFFFF' }}>
            {profile?.full_name[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-medium" style={{ color: '#FFFFFF' }}>
              {profile?.full_name}
            </p>
            <p className="text-xs" style={{ color: '#526F8A' }}>
              {profile?.status_text}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};