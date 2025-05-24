import { useEffect } from 'react';
import { useLocation } from 'wouter';
import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from '@/hooks/useAuth';

const LoginPage = () => {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect authenticated users to their appropriate portal
  useEffect(() => {
    if (isAuthenticated && user) {
      switch (user.role) {
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
    }
  }, [isAuthenticated, user, setLocation]);

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;
