import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  email: string;
  isDemo: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginDemo: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('demo_user');
    return stored ? JSON.parse(stored) : null;
  });
  const navigate = useNavigate();

  const login = useCallback(async (email: string, _password: string) => {
    // Demo auth - accept any credentials
    const newUser = { email, isDemo: false };
    setUser(newUser);
    localStorage.setItem('demo_user', JSON.stringify(newUser));
    navigate('/scenarios');
  }, [navigate]);

  const loginDemo = useCallback(() => {
    const newUser = { email: 'demo@operator.io', isDemo: true };
    setUser(newUser);
    localStorage.setItem('demo_user', JSON.stringify(newUser));
    navigate('/scenarios');
  }, [navigate]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('demo_user');
    navigate('/login');
  }, [navigate]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      loginDemo,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
