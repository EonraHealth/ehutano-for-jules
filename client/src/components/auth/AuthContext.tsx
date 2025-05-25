import { createContext, useEffect, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  phoneNumber?: string;
  profilePictureUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in (token in localStorage)
    const token = localStorage.getItem('token');
    if (token) {
      fetchCurrentUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  // Effect to handle redirection when user state changes, but only on login/register
  // not on every component render to avoid redirection loops
  const initialRedirect = (user: User) => {
    const currentPath = window.location.pathname;
    const userRole = user.role;
    
    // Only redirect if we're on login, register, or home page
    const shouldRedirect = 
      currentPath === '/' || 
      currentPath === '/login' || 
      currentPath === '/register';
      
    if (shouldRedirect) {
      redirectBasedOnRole(userRole);
    }
  };
  
  useEffect(() => {
    if (user) {
      initialRedirect(user);
    }
  }, [user]);

  const fetchCurrentUser = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // If the token is invalid or expired, remove it
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid email or password');
      }
      
      const data = await response.json();
      localStorage.setItem('token', data.token);
      setUser(data.user);
      
      toast({
        title: 'Login Successful',
        description: `Welcome back, ${data.user.fullName}!`,
        variant: 'default',
      });
      
      // Redirect handled by the useEffect
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login Failed',
        description: error instanceof Error ? error.message : 'An error occurred during login',
        variant: 'destructive',
      });
      throw error; // Re-throw to allow form handling
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      const data = await response.json();
      localStorage.setItem('token', data.token);
      setUser(data.user);
      
      toast({
        title: 'Registration Successful',
        description: `Welcome, ${data.user.fullName}!`,
        variant: 'default',
      });
      
      // Redirect handled by the useEffect
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration Failed',
        description: error instanceof Error ? error.message : 'An error occurred during registration',
        variant: 'destructive',
      });
      throw error; // Re-throw to allow form handling
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setLocation('/');
    
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
      variant: 'default',
    });
  };

  const redirectBasedOnRole = (role: string) => {
    console.log(`Redirecting user with role: ${role}`);
    switch (role) {
      case 'PATIENT':
        setLocation('/patient-portal');
        break;
      case 'PHARMACY_STAFF':
        setLocation('/pharmacy-portal');
        break;
      case 'DOCTOR':
        setLocation('/doctor-portal');
        break;
      case 'WHOLESALER_STAFF':
        setLocation('/wholesaler-portal');
        break;
      default:
        setLocation('/');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
