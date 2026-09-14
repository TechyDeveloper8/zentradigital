import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

// Determine target dashboard path based on role and user type
export function getDashboardPath(user) {
  if (!user) return '/login';
  if (user.role_name === 'admin' || user.user_type === 'admin') {
    return '/admin';
  }
  if (user.user_type === 'client' || user.role_name === 'client') {
    return '/client';
  }
  if (user.role_name === 'sales') {
    return '/sales';
  }
  return '/employee';
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('zentra_token'));
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [client, setClient] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load session on initial mount
  useEffect(() => {
    const savedToken = localStorage.getItem('zentra_token');
    if (savedToken) {
      setToken(savedToken);
      loadProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const loadProfile = async () => {
    try {
      const data = await api.get('/auth/me');
      setUser(data.user);
      setEmployee(data.employee);
      setClient(data.client);

      // If employee, fetch today's attendance status
      if (data.employee) {
        try {
          const att = await api.get('/attendance/my-today');
          setAttendance(att.record);
        } catch (e) {
          console.error('Failed to load attendance:', e);
        }
      }
    } catch (err) {
      console.warn('Session expired or invalid token:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const data = await api.post('/auth/login', { username, password });
    localStorage.setItem('zentra_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setEmployee(data.employee);
    setClient(data.client);

    if (data.employee) {
      try {
        const att = await api.get('/attendance/my-today');
        setAttendance(att.record);
      } catch (e) {
        console.error('Failed to load attendance:', e);
      }
    }

    return data;
  };

  const logout = () => {
    localStorage.removeItem('zentra_token');
    setToken(null);
    setUser(null);
    setEmployee(null);
    setClient(null);
    setAttendance(null);
  };

  const refreshAttendance = async () => {
    if (employee) {
      const att = await api.get('/attendance/my-today');
      setAttendance(att.record);
    }
  };

  return (
    <AuthContext.Provider value={{
      token,
      user,
      employee,
      client,
      attendance,
      loading,
      login,
      logout,
      refreshAttendance,
      loadProfile,
      getDashboardPath,
      isAuthenticated: !!(token && user),
      isAdmin: user?.role_name === 'admin',
      isSales: user?.role_name === 'sales',
      isEmployee: user?.user_type === 'employee' || user?.role_name === 'admin',
      isClient: user?.user_type === 'client'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
