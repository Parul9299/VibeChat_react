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
    const token = localStorage.getItem('token');
    if (token) {
      // Optionally verify token with backend
      fetch(`${Base_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setUser(data.user);
          } else {
            localStorage.removeItem('token');
          }
        })
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [Base_URL]);

  const signUp = async (email, password, username, fullName) => {
    try {
      const response = await fetch(`${Base_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username, fullName }),
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
      setUser(data);        // IMPORTANT
    }

    return { data };
  } catch (err) {
    return { error: err.message };
  }
};


  const sendVerificationEmail = async (email) => {
    try {
      const response = await fetch(`${Base_URL}/api/auth/send-verification`, {
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

  const verifyEmail = async (code) => {
    try {
      const response = await fetch(`${Base_URL}/auth/verify-email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: code}),
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
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    sendVerificationEmail,
    verifyEmail,
    logout,
  };

  // return <AuthContext.Provider value={{ user, loading, signIn, signUp /* etc. */ }}>{children}</AuthContext.Provider>;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;

};