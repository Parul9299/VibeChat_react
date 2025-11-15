// contexts/AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const Base_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:3000/api';
  console.log('Base_URL:', Base_URL);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`${Base_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        // Backend returns a flat user object, NOT { user: {} }
        if (res.ok && data && data._id) {
          const updatedUser = {
            ...user, // prev is not available here, but since initial is null, use data
            ...data // merge fresh data (name, avatar, etc)
          };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser)); // Persist user data
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setUser(null);
        }
      } catch (err) {
        console.error('Token verification error:', err);
        localStorage.removeItem("token");
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const signUp = async (email, password, fullName, phone) => {
    try {
      const response = await fetch(`${Base_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, phone }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { error: data.message || 'Signup failed' };
      }
      // Optionally store temp data, but token comes after verification
      return { data };
    } catch (err) {
      return { error: err.message };
    }
  };

  const signIn = async (email, password) => {
    try {
      const response = await fetch(`${Base_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { error: data.message || 'Signin failed' };
      }
      if (data.accessToken) {
        localStorage.setItem('token', data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        // Assuming backend returns { accessToken, refreshToken, user: {...} } – adjust if flat
        const userData = data.user || data; // Use data.user if nested, else data (flat user)
        localStorage.setItem('user', JSON.stringify(userData)); // Persist user data
        setUser(userData);
      }
      return { data };
    } catch (err) {
      return { error: err.message };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await fetch(`${Base_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { error: data.message || 'Failed to send reset email' };
      }
      return { data };
    } catch (err) {
      return { error: err.message };
    }
  };

  const verifyForgotOtp = async (email, otp) => {
    try {
      const response = await fetch(`${Base_URL}/auth/verify-forgot-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { error: data.message || 'OTP verification failed' };
      }
      return { data };
    } catch (err) {
      return { error: err.message };
    }
  };

  const resetPassword = async (email, password) => {
    try {
      const response = await fetch(`${Base_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { error: data.message || 'Reset failed' };
      }
      return { data };
    } catch (err) {
      return { error: err.message };
    }
  };

  const resendOTP = async (email) => {
    try {
      const response = await fetch(`${Base_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { error: data.message || 'Failed to resend OTP' };
      }
      return { data };
    } catch (err) {
      return { error: err.message };
    }
  };

  const sendVerificationEmail = async (email) => {
    try {
      const response = await fetch(`${Base_URL}/auth/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { error: data.message || 'Failed to send verification email' };
      }
      return { data };
    } catch (err) {
      return { error: err.message };
    }
  };

  const verifyEmail = async (email, otp) => {
    try {
      const response = await fetch(`${Base_URL}/auth/verify-email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { error: data.message || 'Verification failed' };
      }
      // After verification, perhaps sign in or update user
      return { data };
    } catch (err) {
      return { error: err.message };
    }
  };

  const logout = () => {
    // First, local cleanup (immediate)
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    setLoading(false);

    // Then, optional server logout (fire-and-forget, no await to avoid blocking)
    const token = localStorage.getItem('token'); // Already removed, but if needed for server
    if (token) { // Won't be true, but for completeness
      fetch(`${Base_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }).catch(err => {
        console.error('Logout API error (non-blocking):', err);
      });
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    forgotPassword,
    verifyForgotOtp,
    resetPassword,
    resendOTP,
    sendVerificationEmail,
    verifyEmail,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};