import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'researcher' | 'admin';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  setDemoUser: (role: 'user' | 'researcher' | 'admin') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('geovision_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const storedToken = localStorage.getItem('geovision_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success && res.data.user) {
            setUser(res.data.user);
          }
        } catch {
          // Token invalid
          localStorage.removeItem('geovision_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem('geovision_token', newToken);
      setToken(newToken);
      setUser(newUser);
    }
  };

  const register = async (name: string, email: string, password: string, role = 'researcher') => {
    const res = await api.post('/auth/register', { name, email, password, role });
    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem('geovision_token', newToken);
      setToken(newToken);
      setUser(newUser);
    }
  };

  const logout = () => {
    localStorage.removeItem('geovision_token');
    setToken(null);
    setUser(null);
  };

  const setDemoUser = (role: 'user' | 'researcher' | 'admin') => {
    const demoAccounts: Record<string, { email: string; pass: string }> = {
      admin: { email: 'admin@geovision.ai', pass: 'Admin@12345' },
      researcher: { email: 'researcher@geovision.ai', pass: 'Researcher@12345' },
      user: { email: 'user@geovision.ai', pass: 'User@12345' },
    };
    const target = demoAccounts[role];
    if (target) {
      login(target.email, target.pass);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, setDemoUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
