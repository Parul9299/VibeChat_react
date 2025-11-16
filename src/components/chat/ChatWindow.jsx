import { useState, useEffect, useRef } from 'react';
import {
  Send, Phone, Video, ArrowLeft, MoreVertical, Info, BellOff, Heart, Ban, CheckSquare, XCircle, Clock, Briefcase, MinusCircle,
  Reply,
  Copy,
  Smile,
  Download,
  Forward,
  Pin,
  Star,
  MessageSquare,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useChatUsers } from '../../contexts/Conversation';
import { useMessages } from '../../contexts/Message';

export const ChatWindow = ({ conversationId, onBack, isGroup }) => {
  const { profile } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [receiver, setReceiver] = useState(null);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [localMessages, setLocalMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const [showMenu, setShowMenu] = useState(false);
  const [activeMessageMenu, setActiveMessageMenu] = useState(null);
  const messageRefs = useRef({});
  const dropdownRef = useRef(null);
  const mainDropdownRef = useRef(null);
  const mainButtonRef = useRef(null);
  const messageButtonRefs = useRef({});
  const { users: apiData, loading: usersLoading } = useChatUsers();
  const { messages: apiMessages, loading: messagesLoading, sendMessage } = useMessages(conversationId);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const MenuItem = ({ icon, label }) => (
    <div
      className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-opacity-10 hover:bg-white transition-colors"
      style={{ color: '#FFFFFF' }}
    >
      <span className="w-5 h-5 opacity-80">{icon}</span>
      <span className="text-sm opacity-90">{label}</span>
    </div>
  );

  const MsgMenuItem = ({ icon, label }) => (
    <div
      className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-opacity-10 hover:bg-white transition-colors"
      style={{ color: '#FFFFFF' }}
    >
      <span className="w-5 h-5 opacity-80">{icon}</span>
      <span className="text-sm opacity-90">{label}</span>
    </div>
  );

  const closeAllMenus = () => {
    setShowMenu(false);
    setActiveMessageMenu(null);
  };

  const openMenu = (e, id) => {
    e.stopPropagation();
    if (activeMessageMenu === id) {
      setActiveMessageMenu(null);
    } else {
      setActiveMessageMenu(id);
      setShowMenu(false); // Close main menu if open
      setTimeout(() => positionDropdown(id), 10);
    }
  };

  const toggleMainMenu = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
    if (!showMenu) {
      setActiveMessageMenu(null); // Close message menu if open
    }
  };

  const positionDropdown = (id) => {
    const messageEl = messageRefs.current[id];
    const dropdownEl = dropdownRef.current;

    if (!messageEl || !dropdownEl) return;

    const msg = messageEl.getBoundingClientRect();
    const menu = dropdownEl.getBoundingClientRect();

    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const GAP = 12;

    let top = msg.bottom + GAP;
    let left = msg.right + GAP;

    if (msg.bottom + menu.height > screenH) {
      top = msg.top - menu.height - GAP;
    }

    if (top < 0) top = GAP;

    if (msg.right + menu.width > screenW) {
      left = msg.left - menu.width - GAP;
    }

    if (left < 0) left = GAP;

    if (top > msg.top - 10 && top < msg.bottom + 10) {
      top = msg.bottom + GAP;
    }

    if (left > msg.left - 10 && left < msg.right + 10) {
      left = msg.right + GAP;
    }

    setMenuPosition({ top, left });
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      // Check main menu
      if (mainDropdownRef.current && !mainDropdownRef.current.contains(e.target) &&
        mainButtonRef.current && !mainButtonRef.current.contains(e.target)) {
        setShowMenu(false);
      }
      // Check message menu
      if (activeMessageMenu && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        // Also check if click is on any message button
        const clickedOnMessageButton = Object.values(messageButtonRefs.current).some(btn => btn?.contains(e.target));
        if (!clickedOnMessageButton) {
          setActiveMessageMenu(null);
        }
      }
    };

    const handleResize = () => {
      if (activeMessageMenu) positionDropdown(activeMessageMenu);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
    };
  }, [activeMessageMenu, showMenu]);

  useEffect(() => {
    // Get currentUserId consistent with hook: prioritize profile.id, fallback to localStorage user._id
    let userId = null;
    if (profile?.id) {
      userId = profile.id.toString();
      console.log('Set currentUserId from profile:', userId);
    } else {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          if (user && typeof user._id !== 'undefined') {
            userId = user._id.toString();
            console.log('Set currentUserId from localStorage _id:', userId);
          }
        } catch (error) {
          console.error('Error parsing stored user:', error);
        }
      }
    }
    setCurrentUserId(userId);
  }, [profile]);

  useEffect(() => {
    if (conversationId && apiData && !usersLoading) {
      const matchingUser = apiData.uniqueUsers?.find(u => u.conversationId === conversationId);
      if (matchingUser) {
        setOtherUser({
          full_name: matchingUser.participant.fullName,
          phone: matchingUser.participant.phone,
        });
        const recvId = matchingUser.participant.receiver;
        setReceiver(recvId ? recvId.toString() : null);
        console.log('Set receiver:', recvId);
      }
    }
  }, [conversationId, apiData, usersLoading]);

  useEffect(() => {
    setLocalMessages(apiMessages || []);
    console.log('Updated localMessages:', (apiMessages || []).slice(0, 2)); // Log first 2 for brevity
  }, [apiMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    closeAllMenus(); // Close menus on send
    const trimmedMessage = newMessage.trim();
    const token = localStorage.getItem('token');
    console.log('Send attempt:', {
      newMessage: trimmedMessage,
      conversationId,
      receiver,
      currentUserId,
      sending,
      hasToken: !!token
    });

    if (!token) {
      console.log('Send blocked: No token (not authenticated)');
      return;
    }

    if (!trimmedMessage || !conversationId || !receiver || sending || !currentUserId) {
      console.log('Send blocked by guards');
      return;
    }

    setSending(true);

    // Optimistic update only if authenticated - use trimmedMessage
    const tempId = Date.now().toString();
    const optimisticMsg = {
      _id: tempId,
      text: trimmedMessage,
      sender: currentUserId,
      createdAt: new Date().toISOString(),
      isOwn: true,
    };
    setLocalMessages(prev => [...prev, optimisticMsg]);
    setNewMessage(''); // Clear input after adding optimistic

    try {
      const success = await sendMessage(trimmedMessage, receiver);
      if (!success) {
        setLocalMessages(prev => prev.filter(m => m._id !== tempId));
        console.log('Send failed, reverted');
      } else {
        console.log('Send success - refetch will update list');
      }
    } catch (error) {
      setLocalMessages(prev => prev.filter(m => m._id !== tempId));
      console.log('Send error:', error);
    }
    setSending(false);
  };

  const startCall = async (callType) => {
    if (!conversationId || !profile?.id) return;
    closeAllMenus(); // Close menus on call start
    try {
      const { data: call } = await supabase
        .from('calls')
        .insert({
          conversation_id: conversationId,
          caller_id: profile.id,
          call_type: callType,
          status: 'ongoing',
        })
        .select()
        .single();
      if (call) {
        await supabase.from('call_participants').insert({
          call_id: call.id,
          user_id: profile.id,
          status: 'joined',
        });
      }
    } catch (error) {
      console.error('Call start error:', error);
    }
  };

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: '#020E20' }}>
        <div className="text-center">
          <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #FFD87C 0%, #CA973E 100%)' }}>
            <Send className="w-12 h-12" style={{ color: '#031229' }} />
          </div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: '#FFFFFF' }}>
            Select a chat to start messaging
          </h3>
          <p style={{ color: '#526F8A' }}>
            Choose a conversation from the sidebar or start a new one
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex-1 flex flex-col" style={{ backgroundColor: '#020E20' }}>
      <div className="p-4 border-b flex items-center justify-between"
        style={{ backgroundColor: '#021142', borderColor: '#051834' }}>
        <div className="flex items-center gap-3 relative">

          {/* Back button */}
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-opacity-10 hover:bg-white transition-colors lg:hidden"
            style={{ color: '#526F8A' }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold"
            style={{ backgroundColor: '#385B9E', color: '#FFFFFF' }}
          >
            {otherUser?.full_name?.[0]?.toUpperCase() || '?'}
          </div>

          {/* Name & Phone */}
          <div>
            <p className="font-medium" style={{ color: '#FFFFFF' }}>
              {otherUser?.full_name || 'Unknown User'}
            </p>
            <p className="text-xs" style={{ color: '#526F8A' }}>
              {otherUser?.phone || 'No phone'}
            </p>
          </div>

        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => startCall('voice')}
            className="p-2 rounded-lg hover:bg-opacity-10 hover:bg-white transition-colors"
            style={{ color: '#FFD87C' }}
          >
            <Phone className="w-5 h-5" />
          </button>
          <button
            onClick={() => startCall('video')}
            className="p-2 rounded-lg hover:bg-opacity-10 hover:bg-white transition-colors"
            style={{ color: '#FFD87C' }}
          >
            <Video className="w-5 h-5" />
          </button>

          {/* -------- MORE BUTTON -------- */}
          <div className="ml-auto relative">
            <button
              ref={mainButtonRef}
              onClick={toggleMainMenu}
              className="p-2 rounded-lg hover:bg-opacity-10 hover:bg-white transition-colors"
              style={{ color: '#526F8A' }}
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* -------- DROPDOWN MENU -------- */}
            {showMenu && (
              <div
                ref={mainDropdownRef}
                className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg py-2 z-50"
                style={{ backgroundColor: '#020E20', border: '1px solid #051834' }}
              >
                {/* Menu Items */}

                <MenuItem icon={<Info />} label="Contact info" />
                <MenuItem icon={<Briefcase />} label="Business details" />
                <MenuItem icon={<CheckSquare />} label="Select messages" />
                <MenuItem icon={<BellOff />} label="Mute notifications" />
                <MenuItem icon={<Clock />} label="Disappearing messages" />
                <MenuItem icon={<Heart />} label="Add to favourites" />
                <MenuItem icon={<XCircle />} label="Close chat" />

                <div className="my-2 border-t" style={{ borderColor: '#051834' }} />

                <MenuItem icon={<MessageSquare />} label="Report" />
                <MenuItem icon={<Ban />} label="Block" />
                <MenuItem icon={<MinusCircle />} label="Clear chat" />
                <MenuItem icon={<Trash2 />} label="Delete chat" />
              </div>
            )}
          </div>
        </div>
      </div>
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#385B9E66 transparent",
        }}
          >
            <style>
              {`
          div::-webkit-scrollbar {
            width: 6px;
          }
          div::-webkit-scrollbar-track {
            background: transparent;
          }
          div::-webkit-scrollbar-thumb {
            background: rgba(56, 91, 158, 0.4);
            border-radius: 9999px;
          }
          div:hover::-webkit-scrollbar-thumb {
            background: rgba(56, 91, 158, 0.6);
          }
        `}
        </style>
        {messagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <p style={{ color: '#526F8A' }}>Loading messages...</p>
          </div>
        ) : (
          localMessages.map((msg) => {
            const isOwn = msg.isOwn || false;
            console.log('Message check:', { msgSender: msg.sender, currentId: currentUserId, isOwn });
            return (
              <div
                key={msg._id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="relative group"
                  ref={(el) => (messageRefs.current[msg._id] = el)}
                >
                  <div
                    className="max-w-xs lg:max-w-md rounded-2xl px-4 py-2"
                    style={{
                      backgroundColor: isOwn ? '#385B9E' : '#051834',
                      color: '#FFFFFF',
                    }}
                  >
                    <p>{msg.text}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {/* More Button */}
                  <button
                    ref={(el) => (messageButtonRefs.current[msg._id] = el)}
                    onClick={(e) => openMenu(e, msg._id)}
                    className="absolute -top-0 -right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg"
                    style={{ color: '#FFFFFF' }}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* -------- MESSAGE DROPDOWN (Outside map) -------- */}
      {activeMessageMenu && (
        <div
          ref={dropdownRef}
          className="fixed w-44 rounded-lg shadow-lg py-2 z-50"
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
            backgroundColor: "#020E20",
            border: "1px solid #051834",
          }}
        >
          <MsgMenuItem icon={<Reply />} label="Reply" />
          <MsgMenuItem icon={<Copy />} label="Copy" />
          <MsgMenuItem icon={<Smile />} label="React" />
          <MsgMenuItem icon={<Download />} label="Download" />
          <MsgMenuItem icon={<Forward />} label="Forward" />
          <MsgMenuItem icon={<Pin />} label="Pin" />
          <MsgMenuItem icon={<Star />} label="Star" />

          <div className="my-2 border-t" style={{ borderColor: "#051834" }} />

          <MsgMenuItem icon={<MessageSquare />} label="Report" />
          <MsgMenuItem icon={<Trash2 />} label="Delete" />
        </div>
      )}

      <div className="p-4 border-t" style={{ backgroundColor: '#021142', borderColor: '#051834' }}>
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-opacity-10 hover:bg-white transition-colors"
            style={{ color: '#526F8A' }}
          >
            <Smile className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 rounded-lg outline-none"
            style={{ backgroundColor: '#051834', color: '#FFFFFF' }}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(e)}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim() || !receiver || !currentUserId}
            className="p-2 rounded-lg transition-colors disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #FFD87C 0%, #CA973E 100%)',
              color: '#031229',
            }}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};