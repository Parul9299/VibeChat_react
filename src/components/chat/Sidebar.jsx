import { useState, useEffect, useMemo } from 'react';
import { MessageCircle, Search, EllipsisVertical, Phone, Users, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useChatUsers } from '../../contexts/Conversation'; // Import the new hook
export const Sidebar = ({
  currentView,
  onViewChange,
  selectedConversationId,
  onSelectConversation,
}) => {
  const { profile, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  // Use the hook for chat data (existing conversations/users)
  const { users: apiData, loading: loadingUsers } = useChatUsers();
  const uniqueUsers = apiData?.uniqueUsers || [];
  const conversations = useMemo(() => {
    return uniqueUsers.map((u) => ({
      id: u.conversationId,
      is_group: false,
      otherUser: {
        id: u.participant.receiver,
        full_name: u.participant.fullName,
        phone: u.participant.phone,
      },
    }));
  }, [uniqueUsers]);
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
    }
  }, []);
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
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #FFD87C 0%, #CA973E 100%)",
              }}
            >
              <MessageCircle className="w-5 h-5" style={{ color: "#031229" }} />
            </div>
            <div>
              <h2 className="font-bold" style={{ color: "#FFFFFF" }}>VibeChat</h2>
              <p className="text-xs" style={{ color: "#526F8A" }}>BIZVILITY</p>
            </div>
          </div>
          {/* Dropdown Menu */}
          <div className="relative">
            <div
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg hover:bg-opacity-10 transition-colors cursor-pointer"
              style={{ color: "#526F8A" }}
            >
              <EllipsisVertical className="w-5 h-5" />
            </div>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-[#0B1623] shadow-lg rounded-lg border border-gray-800 overflow-hidden z-50">
                {/* Profile */}
                <div
                  onClick={() => {
                    console.log("Profile clicked");
                    setMenuOpen(false);
                  }}
                  className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/40 cursor-pointer"
                >
                  Profile
                </div>
                {/* Settings */}
                <div
                  onClick={() => {
                    console.log("Settings clicked");
                    setMenuOpen(false);
                  }}
                  className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/40 cursor-pointer"
                >
                  Settings
                </div>
                {/* Logout */}
                <div
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  className="px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 cursor-pointer"
                >
                  Logout
                </div>
              </div>
            )}
          </div>
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
                {loadingUsers ? (
                  <p style={{ color: '#526F8A', padding: '16px', textAlign: 'center' }}>Loading users...</p>
                ) : (
                  uniqueUsers.map((u) => (
                    <button
                      key={u.participant.receiver}
                      onClick={() => createConversation(u.participant.receiver)}
                      className="w-full p-4 flex items-center gap-3 hover:bg-opacity-5 hover:bg-white transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold"
                        style={{ backgroundColor: '#385B9E', color: '#FFFFFF' }}>
                        {u.participant.fullName?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium" style={{ color: '#FFFFFF' }}>
                          {u.participant.fullName || 'Unknown User'}
                        </p>
                        <p className="text-sm" style={{ color: '#526F8A' }}>
                          {u.participant.phone || '@unknown'}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
            {loadingUsers ? (
              <p style={{ color: '#526F8A', padding: '16px', textAlign: 'center' }}>Loading conversations...</p>
            ) : (
              conversations.map((conv) => (
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
                      {conv.otherUser?.phone || 'Click to start chatting'}
                    </p>
                  </div>
                  {conv.otherUser?.is_online && (
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#4CAF50' }} />
                  )}
                </button>
              ))
            )}
          </>
        )}
      </div>
      <div className="p-4 border-t" style={{ borderColor: '#051834', borderTop: '1px solid #ccc' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold"
            style={{
              backgroundColor: userData?.avatar_url ? 'transparent' : '#385B9E',
              backgroundImage: userData?.avatar_url ? `url(${userData.avatar_url})` : 'none',
              backgroundSize: 'cover',
              color: '#FFFFFF'
            }}>
            {!userData?.avatar_url && userData?.fullName?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-medium" style={{ color: '#FFFFFF' }}>
              {userData?.fullName || 'Unknown User'}
            </p>
            <p className="text-xs" style={{ color: '#526F8A' }}>
              {userData?.email || 'No email'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};