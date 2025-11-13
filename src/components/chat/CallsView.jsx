import { useState, useEffect } from 'react';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export const CallsView = () => {
  const { profile } = useAuth();
  const [calls, setCalls] = useState([]);
  useEffect(() => {
    if (profile) {
      loadCalls();
    }
  }, [profile]);

  const loadCalls = async () => {
    if (!profile) return;
    const { data: participantData } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', profile.id);
    if (!participantData) return;
    const conversationIds = participantData.map(p => p.conversation_id);
    const { data: callsData } = await supabase
      .from('calls')
      .select('*')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false });
    if (callsData) {
      const callsWithUsers = await Promise.all(
        callsData.map(async (call) => {
          const { data: caller } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', call.caller_id)
            .maybeSingle();
          const { data: participants } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', call.conversation_id)
            .neq('user_id', profile.id)
            .maybeSingle();
          let otherUser = null;
          if (participants) {
            const { data: user } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', participants.user_id)
              .maybeSingle();
            otherUser = user;
          }
          return { ...call, caller, otherUser };
        })
      );
      setCalls(callsWithUsers);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCallIcon = (call) => {
    const isIncoming = call.caller_id !== profile?.id;
    const isMissed = call.status === 'missed';
    if (isMissed) {
      return <PhoneMissed className="w-5 h-5" style={{ color: '#F44336' }} />;
    } else if (isIncoming) {
      return <PhoneIncoming className="w-5 h-5" style={{ color: '#4CAF50' }} />;
    } else {
      return <PhoneOutgoing className="w-5 h-5" style={{ color: '#526F8A' }} />;
    }
  };

  return (
    <div className="flex-1 flex flex-col" style={{ backgroundColor: '#020E20' }}>
      <div className="p-4 border-b"
           style={{ backgroundColor: '#021142', borderColor: '#051834' }}>
        <h2 className="text-xl font-bold" style={{ color: '#FFFFFF' }}>
          Calls
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {calls.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center"
                   style={{ backgroundColor: '#051834' }}>
                <Phone className="w-12 h-12" style={{ color: '#526F8A' }} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#FFFFFF' }}>
                No calls yet
              </h3>
              <p style={{ color: '#526F8A' }}>
                Start a voice or video call from any chat
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#051834' }}>
            {calls.map((call) => {
              const otherPerson = call.caller_id === profile?.id ? call.otherUser : call.caller;
              const isIncoming = call.caller_id !== profile?.id;
              return (
                <div key={call.id} className="p-4 flex items-center gap-3 hover:bg-opacity-5 hover:bg-white transition-colors">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold"
                       style={{ backgroundColor: '#385B9E', color: '#FFFFFF' }}>
                    {otherPerson?.full_name[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium" style={{ color: '#FFFFFF' }}>
                      {otherPerson?.full_name || 'Unknown'}
                    </p>
                    <div className="flex items-center gap-2 text-sm" style={{ color: '#526F8A' }}>
                      {getCallIcon(call)}
                      <span>
                        {isIncoming ? 'Incoming' : 'Outgoing'} {call.call_type} call
                      </span>
                      {call.status === 'completed' && call.duration > 0 && (
                        <span>• {formatDuration(call.duration)}</span>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: '#526F8A' }}>
                      {new Date(call.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    className="p-3 rounded-full hover:bg-opacity-10 hover:bg-white transition-colors"
                    style={{ color: '#FFD87C' }}
                  >
                    {call.call_type === 'video' ? (
                      <Video className="w-5 h-5" />
                    ) : (
                      <Phone className="w-5 h-5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};