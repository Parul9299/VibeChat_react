import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from './chat/Sidebar';
import { ChatWindow } from './chat/ChatWindow';
import { StatusView } from './chat/StatusView';
import { CallsView } from './chat/CallsView';

export const ChatApp = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('chats');
  const [selectedConversationId, setSelectedConversationId] = useState(null);

  if (!user) return null;

  return (
    <div className="h-screen flex" style={{ backgroundColor: '#031229' }}>
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        selectedConversationId={selectedConversationId}
        onSelectConversation={setSelectedConversationId}
      />
      <div className="flex-1 flex flex-col">
        {currentView === 'chats' && (
          <ChatWindow
            conversationId={selectedConversationId}
            onBack={() => setSelectedConversationId(null)}
          />
        )}
        {currentView === 'status' && <StatusView />}
        {currentView === 'calls' && <CallsView />}
        {currentView === 'groups' && (
          <ChatWindow
            conversationId={selectedConversationId}
            onBack={() => setSelectedConversationId(null)}
            isGroup
          />
        )}
      </div>
    </div>
  );
};
