import { Link, useLocation } from 'wouter';
import { Home, ShoppingBag, Shield, Activity, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const MobileNavbar = () => {
  const [location] = useLocation();
  const { isAuthenticated, user } = useAuth();

  // Define base navigation items
  const baseNavItems = [
    {
      label: 'Home',
      href: '/',
      icon: <Home className="h-6 w-6" />
    },
    {
      label: 'Patient',
      href: '/patient-portal',
      icon: <ShoppingBag className="h-6 w-6" />,
      roles: ['PATIENT']
    },
    {
      label: 'Pharmacy',
      href: '/pharmacy-portal',
      icon: <ShoppingBag className="h-6 w-6" />,
      roles: ['PHARMACY_STAFF']
    },
    {
      label: 'Doctor',
      href: '/doctor-portal',
      icon: <Shield className="h-6 w-6" />,
      roles: ['DOCTOR']
    },
    {
      label: 'Wholesaler',
      href: '/wholesaler-portal',
      icon: <ShoppingBag className="h-6 w-6" />,
      roles: ['WHOLESALER_STAFF']
    },
    {
      label: 'Health',
      href: '/wellness-hub',
      icon: <Activity className="h-6 w-6" />
    },
    {
      label: 'Profile',
      href: '/profile',
      icon: <User className="h-6 w-6" />
    }
  ];

  // Show all navigation items for authenticated users
  const navItems = isAuthenticated 
    ? baseNavItems 
    : baseNavItems.filter(item => !item.roles);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className={`flex flex-col items-center justify-center ${
              location === item.href ? 'text-primary-600' : 'text-gray-500'
            }`}
          >
            {item.icon}
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MobileNavbar;
