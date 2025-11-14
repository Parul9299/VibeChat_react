import { useState } from 'react';
import { MessageCircle, Mail, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LandingPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const Base_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:3000/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        const { error: signUpError } = await signUp(email, password, username, fullName, mobileNumber);
        if (signUpError) throw signUpError;
        // Assuming backend sends verification email automatically on successful signup
        setShowVerification(true);
      } else {
        const { error: signInError } = await signIn(email, password);
        if (signInError) throw signInError;
        // Optionally, check if user is verified on signin; for now, assume backend handles redirect if not verified
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${Base_URL}/auth/verify-email-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp: verificationCode }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }
      setShowVerification(false);
      setError(''); // Clear any previous errors
      // Optionally, auto-signin or redirect here; backend can handle post-verification logic
      setIsSignUp(false); // Switch to signin mode after verification
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetVerification = () => {
    setShowVerification(false);
    setVerificationCode('');
    setError('');
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#031229' }}>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #FFD87C 0%, #CA973E 100%)',
                  }}
                >
                  <MessageCircle className="w-8 h-8" style={{ color: '#031229' }} strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold" style={{ color: '#FFD87C' }}>
                  VibeChat
                </h1>
                <p className="text-sm tracking-widest" style={{ color: '#CA973E' }}>
                  BIZVILITY
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl p-8" style={{ backgroundColor: '#021142' }}>
            <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: '#FFFFFF' }}>
              {showVerification ? 'Verify Your Email' : (isSignUp ? 'Create Account' : 'Welcome Back')}
            </h2>
            {showVerification ? (
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="text-center mb-4">
                  <Mail className="w-12 h-12 mx-auto mb-2" style={{ color: '#FFD87C' }} />
                  <p className="text-sm" style={{ color: '#526F8A' }}>
                    We've sent a verification code to {email}. Please enter it below.
                  </p>
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Enter 6-digit verification code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    required
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition-all text-center text-lg tracking-widest"
                    style={{
                      backgroundColor: '#051834',
                      color: '#FFFFFF',
                      border: '1px solid #385B9E',
                    }}
                  />
                </div>
                {error && (
                  <div className="text-red-400 text-sm text-center">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading || verificationCode.length < 6}
                  className="w-full py-3 rounded-lg font-semibold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #FFD87C 0%, #CA973E 100%)',
                    color: '#031229',
                  }}
                >
                  {loading ? 'Verifying...' : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Verify Email
                    </>
                  )}
                </button>
                <div className="text-center">
                  <button
                    onClick={resetVerification}
                    type="button"
                    className="text-sm hover:underline"
                    style={{ color: '#FFD87C' }}
                  >
                    Edit Email and Resend
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && !showVerification && (
                  <>
                    <div>
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition-all"
                        style={{
                          backgroundColor: '#051834',
                          color: '#FFFFFF',
                          border: '1px solid #385B9E',
                        }}
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition-all"
                        style={{
                          backgroundColor: '#051834',
                          color: '#FFFFFF',
                          border: '1px solid #385B9E',
                        }}
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        placeholder="Mobile Number"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition-all"
                        style={{
                          backgroundColor: '#051834',
                          color: '#FFFFFF',
                          border: '1px solid #385B9E',
                        }}
                      />
                    </div>
                  </>
                )}
                <div>
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: '#051834',
                      color: '#FFFFFF',
                      border: '1px solid #385B9E',
                    }}
                  />
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: '#051834',
                      color: '#FFFFFF',
                      border: '1px solid #385B9E',
                    }}
                  />
                </div>
                {error && (
                  <div className="text-red-400 text-sm text-center">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #FFD87C 0%, #CA973E 100%)',
                    color: '#031229',
                  }}
                >
                  {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                </button>
              </form>
            )}
            {!showVerification && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setShowVerification(false);
                    setError('');
                    setVerificationCode('');
                  }}
                  className="text-sm hover:underline"
                  style={{ color: '#FFD87C' }}
                >
                  {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div
        className="hidden lg:flex flex-1 items-center justify-center p-8"
        style={{ backgroundColor: '#020E20' }}
      >
        <div className="max-w-lg text-center">
          <h2 className="text-4xl font-bold mb-4" style={{ color: '#FFFFFF' }}>
            Connect with your world
          </h2>
          <p className="text-lg mb-6" style={{ color: '#526F8A' }}>
            Experience seamless communication with real-time messaging, voice and video calls, status updates, and more.
          </p>
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="p-4 rounded-xl" style={{ backgroundColor: '#031229' }}>
              <div
                className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ backgroundColor: '#FFD87C' }}
              >
                <MessageCircle className="w-6 h-6" style={{ color: '#031229' }} />
              </div>
              <h3 className="font-semibold mb-1" style={{ color: '#FFFFFF' }}>
                Instant Messaging
              </h3>
              <p className="text-sm" style={{ color: '#526F8A' }}>
                Real-time chat with friends
              </p>
            </div>
            <div className="p-4 rounded-xl" style={{ backgroundColor: '#031229' }}>
              <div
                className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ backgroundColor: '#FFD87C' }}
              >
                <MessageCircle className="w-6 h-6" style={{ color: '#031229' }} />
              </div>
              <h3 className="font-semibold mb-1" style={{ color: '#FFFFFF' }}>
                Voice & Video Calls
              </h3>
              <p className="text-sm" style={{ color: '#526F8A' }}>
                Crystal clear communication
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};