import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Phone, Video, ArrowLeft, Smile } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export const ChatWindow = ({ conversationId, onBack, isGroup }) => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  useEffect(() => {
    if (conversationId && profile) {
      loadMessages();
      loadOtherUser();
      const channel = supabase
        .channel(`conversation:${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          async (payload) => {
            const newMsg = payload.new;
            const { data: sender } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', newMsg.sender_id)
              .maybeSingle();
            setMessages((prev) => [...prev, { ...newMsg, sender: sender || undefined }]);
          }
        )
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [conversationId, profile]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  const loadMessages = async () => {
    if (!conversationId) return;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (data) {
      const messagesWithSenders = await Promise.all(
        data.map(async (msg) => {
          const { data: sender } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', msg.sender_id)
            .maybeSingle();
          return { ...msg, sender: sender || undefined };
        })
      );
      setMessages(messagesWithSenders);
    }
  };
  const loadOtherUser = async () => {
    if (!conversationId || !profile) return;
    const { data: participants } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .neq('user_id', profile.id)
      .maybeSingle();
    if (participants) {
      const { data: user } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', participants.user_id)
        .maybeSingle();
      setOtherUser(user);
    }
  };
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId || !profile || sending) return;
    setSending(true);
    try {
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: profile.id,
        content: newMessage.trim(),
        message_type: 'text',
      });
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId || !profile) return;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${profile.id}/${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(filePath, file);
    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return;
    }
    const { data: { publicUrl } } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath);
    let messageType = 'document';
    if (file.type.startsWith('image/')) messageType = 'image';
    else if (file.type.startsWith('video/')) messageType = 'video';
    else if (file.type.startsWith('audio/')) messageType = 'audio';
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: profile.id,
      content: null,
      message_type: messageType,
      attachment_url: publicUrl,
      attachment_name: file.name,
      attachment_size: file.size,
    });
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);
  };
  const startCall = async (callType) => {
    if (!conversationId || !profile) return;
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
    <div className="flex-1 flex flex-col" style={{ backgroundColor: '#020E20' }}>
      <div className="p-4 border-b flex items-center justify-between"
           style={{ backgroundColor: '#021142', borderColor: '#051834' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-opacity-10 hover:bg-white transition-colors lg:hidden"
            style={{ color: '#526F8A' }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold"
               style={{ backgroundColor: '#385B9E', color: '#FFFFFF' }}>
            {otherUser?.full_name[0].toUpperCase()}
          </div>
          <div>
            <p className="font-medium" style={{ color: '#FFFFFF' }}>
              {otherUser?.full_name || 'Unknown User'}
            </p>
            <p className="text-xs" style={{ color: '#526F8A' }}>
              {otherUser?.is_online ? 'Online' : 'Offline'}
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
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isOwn = msg.sender_id === profile?.id;
          return (
            <div
              key={msg.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="max-w-xs lg:max-w-md rounded-2xl px-4 py-2"
                style={{
                  backgroundColor: isOwn ? '#385B9E' : '#051834',
                  color: '#FFFFFF',
                }}
              >
                {msg.message_type === 'text' && <p>{msg.content}</p>}
                {msg.message_type === 'image' && (
                  <img
                    src={msg.attachment_url || ''}
                    alt="attachment"
                    className="rounded-lg max-w-full"
                  />
                )}
                {msg.message_type === 'document' && (
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    <span className="text-sm">{msg.attachment_name}</span>
                  </div>
                )}
                <p className="text-xs mt-1 opacity-70">
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
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
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-lg hover:bg-opacity-10 hover:bg-white transition-colors"
            style={{ color: '#526F8A' }}
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 rounded-lg outline-none"
            style={{ backgroundColor: '#051834', color: '#FFFFFF' }}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
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