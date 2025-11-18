import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from './chat/Sidebar';
import { ChatWindow } from './chat/ChatWindow';
import { StatusView } from './chat/StatusView';
import { CallsView } from './chat/CallsView';
import { MessageCircle, Phone, Users, CircleDashed } from 'lucide-react';

export const ChatApp = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('chats');
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!user) return null;

  const isChatView = currentView === 'chats' || currentView === 'groups';
  const inDetailedChat = isChatView && !!selectedConversationId;

  if (isMobile) {
    const handleTabChange = (view) => {
      setCurrentView(view);
      setSelectedConversationId(null);
    };

    let content = null;
    const availableHeight = `calc(100vh - 4rem)`;
    if (inDetailedChat) {
      content = (
        <ChatWindow
          conversationId={selectedConversationId}
          onBack={() => setSelectedConversationId(null)}
          isGroup={currentView === 'groups'}
        />
      );
    } else if (isChatView) {
      content = (
        <Sidebar
          currentView={currentView}
          onViewChange={() => {}}
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
          style={{ height: availableHeight }}
        />
      );
    } else if (currentView === 'status') {
      content = <StatusView style={{ height: availableHeight }} />;
    } else if (currentView === 'calls') {
      content = <CallsView style={{ height: availableHeight }} />;
    }

    return (
      <div className="max-[200px]:w-[fit-content] w-full h-screen flex flex-col" style={{ backgroundColor: '#031229' }}>
        <div className="flex-1 overflow-auto">
          {content}
        </div>
        {!inDetailedChat && (
          <nav className="h-16 bg-[#031229] border-t border-gray-700 flex justify-around items-center shrink-0">
            <button
              className={`p-2 text-sm font-medium rounded flex flex-col items-center ${
                currentView === 'chats' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => handleTabChange('chats')}
            >
              <MessageCircle className="mb-1" size={20} />
              <span className="text-xs">Chats</span>
            </button>
            <button
              className={`p-2 text-sm font-medium rounded flex flex-col items-center ${
                currentView === 'status' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => handleTabChange('status')}
            >
              <CircleDashed className="mb-1" size={20} />
              <span className="text-xs">Status</span>
            </button>
            <button
              className={`p-2 text-sm font-medium rounded flex flex-col items-center ${
                currentView === 'groups' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => handleTabChange('groups')}
            >
              <Users className="mb-1" size={20} />
              <span className="text-xs">Contacts</span>
            </button>
            <button
              className={`p-2 text-sm font-medium rounded flex flex-col items-center ${
                currentView === 'calls' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => handleTabChange('calls')}
            >
              <Phone className="mb-1" size={20} />
              <span className="text-xs">Calls</span>
            </button>
          </nav>
        )}
      </div>
    );
  }

  // Default layout for desktop/tablet
  return (
    <div className="w-full h-screen flex" style={{ backgroundColor: '#031229' }}>
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