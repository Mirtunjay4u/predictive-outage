import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface User {
  email: string;
  isDemo: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
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

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    // Demo auth - accept any non-empty credentials
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter email and password');
      return false;
    }
    const newUser = { email, isDemo: true };
    setUser(newUser);
    localStorage.setItem('demo_user', JSON.stringify(newUser));
    toast.success('Signed in (Demo)');
    navigate('/scenarios');
    return true;
  }, [navigate]);

  const loginDemo = useCallback(() => {
    const newUser = { email: 'demo@operator.io', isDemo: true };
    setUser(newUser);
    localStorage.setItem('demo_user', JSON.stringify(newUser));
    toast.success('Signed in (Demo)');
    navigate('/scenarios');
  }, [navigate]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('demo_user');
    toast.success('Signed out');
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
