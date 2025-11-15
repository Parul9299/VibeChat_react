import { useState } from 'react';
import { MessageCircle, Mail, CheckCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LandingPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [showForgotOtp, setShowForgotOtp] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmSignUpPassword, setConfirmSignUpPassword] = useState('');
  const [fullName, setFullName] = useState('');
  // const [mobileNumber, setMobileNumber] = useState('');
  const [phone, setPhone] = useState('');

  const [verificationCode, setVerificationCode] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSignInPass, setShowSignInPass] = useState(false);
  const [showSignUpPass, setShowSignUpPass] = useState(false);
  const [showConfirmSignUpPass, setShowConfirmSignUpPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmNewPass, setShowConfirmNewPass] = useState(false);
  const { signIn, signUp, forgotPassword, resetPassword, resendOTP, verifyEmail, verifyForgotOtp } = useAuth();

  const redirectToChat = () => {
    window.location.href = '/';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        if (password !== confirmSignUpPassword) {
          throw new Error('Passwords do not match');
        }
        // const { error: signUpError } = await signUp(email, password, fullName, mobileNumber);
        const { error: signUpError } = await signUp(email, password, fullName, phone);

        if (signUpError) throw signUpError;
        setShowVerification(true);
      } else {
        const { error: signInError } = await signIn(email, password);
        if (signInError) throw signInError;
        redirectToChat();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { error } = await forgotPassword(email);
      if (error) throw new Error(error.message || error);
      setIsForgot(true);
      setShowForgotOtp(true);
      setPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyForgotOtp = async (e) => {
    e.preventDefault();
    if (resetOtp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { error } = await verifyForgotOtp(email, resetOtp);
      if (error) throw new Error(error.message || error);
      setShowForgotOtp(false);
      setShowResetPassword(true);
      setResetOtp('');
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPass !== confirmNewPass) {
      setError('Passwords do not match');
      return;
    }
    if (newPass.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { error } = await resetPassword(email, newPass);
      if (error) throw error;
      // Auto sign-in and redirect removed as per requirement
      setIsForgot(false);
      setShowResetPassword(false);
      setShowForgotOtp(false);
      setResetOtp('');
      setNewPass('');
      setConfirmNewPass('');
      setPassword(''); // Clear password field for manual login
      setError('Password reset successfully! Please sign in with your new password.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (verificationCode.length < 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { error } = await verifyEmail(email, verificationCode);
      if (error) throw new Error(error.message || error);
      setShowVerification(false);
      setIsSignUp(false);
      setPassword(''); // Clear password field for manual login
      setError('Email verified successfully! Please sign in.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { error } = await resendOTP(email);
      if (error) throw new Error(error.message || error);
      setError('OTP resent successfully');
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

  const goBackToSignIn = () => {
    setIsForgot(false);
    setShowForgotOtp(false);
    setShowResetPassword(false);
    setResetOtp('');
    setNewPass('');
    setConfirmNewPass('');
    setError('');
  };

  const getTitle = () => {
    if (showVerification) return 'Verify Your Email';
    if (isForgot) {
      if (showForgotOtp) return 'Verify Reset Code';
      if (showResetPassword) return 'Reset Your Password';
    }
    return isSignUp ? 'Create Account' : 'Welcome Back';
  };

  return (
    <div className="h-screen w-full flex" style={{ backgroundColor: '#031229' }}>
      <div className="flex-1 flex items-center justify-center p-3"
        style={{ backgroundColor: '#031229' }}>
        <div className="max-w-md w-full">
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className="w-16 h-16 max-[260px]:w-10 max-[260px]:h-10 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #FFD87C 0%, #CA973E 100%)',
                  }}
                >
                  <MessageCircle className="w-8 h-8 max-[260px]:w-6 max-[260px]:h-6" style={{ color: '#031229' }} strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <h1 className="text-4xl max-[260px]:text-xl font-bold" style={{ color: '#FFD87C' }}>
                  VibeChat
                </h1>
                <p className="text-sm max-[260px]:text-[10px] tracking-widest" style={{ color: '#CA973E' }}>
                  BIZVILITY
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl p-3" style={{ backgroundColor: '#021142' }}>
            <h2 className="text-2xl max-[260px]:text-sm font-bold mb-6 text-center" style={{ color: '#FFFFFF' }}>
              {getTitle()}
            </h2>
            {showVerification ? (
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="text-center mb-4">
                  <Mail className="w-12 h-12 max-[260px]:w-10 max-[260px]:h-10 mx-auto mb-2" style={{ color: '#FFD87C' }} />
                  <p className="text-sm max-[260px]:text-xs" style={{ color: '#526F8A' }}>
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
                    className="w-full px-4 py-3 max-[260px]:px-2 max-[260px]:py-2 max-[260px]:text-xs rounded-lg focus:outline-none focus:ring-2 transition-all text-center text-lg tracking-widest"
                    style={{
                      backgroundColor: '#051834',
                      color: '#FFFFFF',
                      border: '1px solid #385B9E',
                    }}
                  />
                </div>
                {error && (
                  <div className="text-red-400 text-sm max-[260px]:text-xs text-center">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading || verificationCode.length < 6}
                  className="w-full py-3 max-[260px]:py-2 rounded-lg font-semibold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #FFD87C 0%, #CA973E 100%)',
                    color: '#031229',
                  }}
                >
                  {loading ? 'Verifying...' : (
                    <>
                      <CheckCircle className="w-5 h-5 max-[260px]:w-3 max-[260px]:h-3" />
                      Verify Email
                    </>
                  )}
                </button>
                <div className="text-center space-y-2">
                  <button
                    onClick={handleResend}
                    type="button"
                    disabled={loading}
                    className="text-sm max-[260px]:text-xs hover:underline flex items-center justify-center gap-1"
                    style={{ color: '#FFD87C' }}
                  >
                    Didn't receive? Resend OTP
                  </button>
                  <button
                    onClick={resetVerification}
                    type="button"
                    className="text-sm max-[260px]:text-xs hover:underline"
                    style={{ color: '#FFD87C' }}
                  >
                    Edit Email
                  </button>
                </div>
              </form>
            ) : isForgot ? (
              showForgotOtp ? (
                <form onSubmit={handleVerifyForgotOtp} className="space-y-4">
                  <div className="text-center mb-4">
                    <Mail className="w-12 h-12 max-[260px]:w-10 max-[260px]:h-10 mx-auto mb-2" style={{ color: '#FFD87C' }} />
                    <p className="text-sm max-[260px]:text-xs" style={{ color: '#526F8A' }}>
                      We've sent a 6-digit reset code to {email}. Please enter it below.
                    </p>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Enter 6-digit reset code"
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value)}
                      required
                      maxLength={6}
                      className="w-full px-4 py-3 max-[260px]:px-2 max-[260px]:py-2 max-[260px]:text-xs rounded-lg focus:outline-none focus:ring-2 transition-all text-center text-lg tracking-widest"
                      style={{
                        backgroundColor: '#051834',
                        color: '#FFFFFF',
                        border: '1px solid #385B9E',
                      }}
                    />
                  </div>
                  {error && (
                    <div className="text-red-400 text-sm max-[260px]:text-xs text-center">
                      {error}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading || resetOtp.length < 6}
                    className="w-full py-3 max-[260px]:py-2 rounded-lg font-semibold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, #FFD87C 0%, #CA973E 100%)',
                      color: '#031229',
                    }}
                  >
                    {loading ? 'Verifying...' : (
                      <>
                        <CheckCircle className="w-5 h-5 max-[260px]:w-3 max-[260px]:h-3" />
                        Verify Code
                      </>
                    )}
                  </button>
                  <div className="text-center space-y-2">
                    <button
                      onClick={handleResend}
                      type="button"
                      disabled={loading}
                      className="text-sm max-[260px]:text-xs hover:underline flex items-center justify-center gap-1"
                      style={{ color: '#FFD87C' }}
                    >
                      Resend OTP
                    </button>
                    <button
                      onClick={goBackToSignIn}
                      type="button"
                      className="text-sm max-[260px]:text-xs hover:underline"
                      style={{ color: '#FFD87C' }}
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleReset} className="space-y-4">
                  <div className="text-center mb-4">
                    <Lock className="w-12 h-12 max-[260px]:w-10 max-[260px]:h-10 mx-auto mb-2" style={{ color: '#FFD87C' }} />
                    <p className="text-sm max-[260px]:text-xs" style={{ color: '#526F8A' }}>
                      Enter your new password for {email}.
                    </p>
                  </div>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      placeholder="New Password"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-4 py-3 max-[260px]:px-2 max-[260px]:py-2 max-[260px]:text-sm rounded-lg focus:outline-none focus:ring-2 transition-all pr-10"
                      style={{
                        backgroundColor: '#051834',
                        color: '#FFFFFF',
                        border: '1px solid #385B9E',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showNewPass ? (
                        <EyeOff className="h-5 w-5" style={{ color: '#526F8A' }} />
                      ) : (
                        <Eye className="h-5 w-5" style={{ color: '#526F8A' }} />
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showConfirmNewPass ? 'text' : 'password'}
                      placeholder="Confirm New Password"
                      value={confirmNewPass}
                      onChange={(e) => setConfirmNewPass(e.target.value)}
                      required
                      className="w-full px-4 py-3 max-[260px]:px-2 max-[260px]:py-2 max-[260px]:text-sm rounded-lg focus:outline-none focus:ring-2 transition-all pr-10"
                      style={{
                        backgroundColor: '#051834',
                        color: '#FFFFFF',
                        border: '1px solid #385B9E',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPass(!showConfirmNewPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmNewPass ? (
                        <EyeOff className="h-5 w-5" style={{ color: '#526F8A' }} />
                      ) : (
                        <Eye className="h-5 w-5" style={{ color: '#526F8A' }} />
                      )}
                    </button>
                  </div>
                  {error && (
                    <div className="text-red-400 text-sm max-[260px]:text-xs text-center">
                      {error}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading || newPass.length < 6 || newPass !== confirmNewPass}
                    className="w-full py-3 max-[260px]:py-2 rounded-lg font-semibold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, #FFD87C 0%, #CA973E 100%)',
                      color: '#031229',
                    }}
                  >
                    {loading ? 'Resetting...' : (
                      <>
                        <CheckCircle className="w-5 h-5 max-[260px]:w-3 max-[260px]:h-3" />
                        Reset Password
                      </>
                    )}
                  </button>
                  <div className="text-center">
                    <button
                      onClick={goBackToSignIn}
                      type="button"
                      className="text-sm max-[260px]:text-xs hover:underline"
                      style={{ color: '#FFD87C' }}
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              )
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <>
                    <div>
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="w-full px-4 py-3 max-[260px]:px-2 max-[260px]:py-2 max-[260px]:text-sm rounded-lg focus:outline-none focus:ring-2 transition-all"
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
                        placeholder="Phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}

                        required
                        className="w-full px-4 py-3 max-[260px]:px-2 max-[260px]:py-2 rounded-lg focus:outline-none focus:ring-2 transition-all max-[260px]:text-sm"
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
                    className="w-full px-4 py-3 max-[260px]:px-2 max-[260px]:py-2 rounded-lg focus:outline-none focus:ring-2 transition-all max-[260px]:text-sm"
                    style={{
                      backgroundColor: '#051834',
                      color: '#FFFFFF',
                      border: '1px solid #385B9E',
                    }}
                  />
                </div>
                {isSignUp ? (
                  <>
                    <div className="relative">
                      <input
                        type={showSignUpPass ? 'text' : 'password'}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-3 max-[260px]:px-2 max-[260px]:py-2 max-[260px]:text-sm rounded-lg focus:outline-none focus:ring-2 transition-all pr-10"
                        style={{
                          backgroundColor: '#051834',
                          color: '#FFFFFF',
                          border: '1px solid #385B9E',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpPass(!showSignUpPass)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showSignUpPass ? (
                          <EyeOff className="h-5 w-5" style={{ color: '#526F8A' }} />
                        ) : (
                          <Eye className="h-5 w-5" style={{ color: '#526F8A' }} />
                        )}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showConfirmSignUpPass ? 'text' : 'password'}
                        placeholder="Confirm Password"
                        value={confirmSignUpPassword}
                        onChange={(e) => setConfirmSignUpPassword(e.target.value)}
                        required
                        className="w-full px-4 py-3 max-[260px]:px-2 max-[260px]:py-2 max-[260px]:text-sm rounded-lg focus:outline-none focus:ring-2 transition-all pr-10"
                        style={{
                          backgroundColor: '#051834',
                          color: '#FFFFFF',
                          border: '1px solid #385B9E',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmSignUpPass(!showConfirmSignUpPass)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showConfirmSignUpPass ? (
                          <EyeOff className="h-5 w-5" style={{ color: '#526F8A' }} />
                        ) : (
                          <Eye className="h-5 w-5" style={{ color: '#526F8A' }} />
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="relative">
                    <input
                      type={showSignInPass ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 max-[260px]:px-2 max-[260px]:py-2 max-[260px]:text-sm rounded-lg focus:outline-none focus:ring-2 transition-all pr-10"
                      style={{
                        backgroundColor: '#051834',
                        color: '#FFFFFF',
                        border: '1px solid #385B9E',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPass(!showSignInPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showSignInPass ? (
                        <EyeOff className="h-5 w-5" style={{ color: '#526F8A' }} />
                      ) : (
                        <Eye className="h-5 w-5" style={{ color: '#526F8A' }} />
                      )}
                    </button>
                  </div>
                )}
                {error && (
                  <div className={`text-sm text-center ${error.includes('successfully') || error.includes('verified') ? 'text-green-400' : 'text-red-400'}`}>
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading || (isSignUp && (password !== confirmSignUpPassword || password.length < 6))}
                  className="w-full py-3 max-[260px]:py-2 max-[260px]:text-sm rounded-lg font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #FFD87C 0%, #CA973E 100%)',
                    color: '#031229',
                  }}
                >
                  {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                </button>
                {!isSignUp && !isForgot && (
                  <div className="text-center mt-2">
                    <button
                      type="button"
                      onClick={handleForgot}
                      disabled={loading}
                      className="text-sm max-[260px]:text-xs hover:underline"
                      style={{ color: '#FFD87C' }}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </form>
            )}
            {!showVerification && !isForgot && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setShowVerification(false);
                    setIsForgot(false);
                    setShowForgotOtp(false);
                    setShowResetPassword(false);
                    setError('');
                    setVerificationCode('');
                    setResetOtp('');
                    setNewPass('');
                    setConfirmNewPass('');
                    setConfirmSignUpPassword('');
                  }}
                  className="text-sm max-[260px]:text-xs hover:underline"
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