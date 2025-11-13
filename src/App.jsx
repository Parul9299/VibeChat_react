import { useAuth } from './contexts/AuthContext';
import { LandingPage } from './components/LandingPage';
import { ChatApp } from './components/ChatApp';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: '#031229' }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse"
               style={{ background: 'linear-gradient(135deg, #FFD87C 0%, #CA973E 100%)' }}>
            <div className="w-8 h-8 rounded-full" style={{ backgroundColor: '#031229' }} />
          </div>
          <p style={{ color: '#FFFFFF' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return user ? <ChatApp /> : <LandingPage />;
}

export default App;
//final commit 