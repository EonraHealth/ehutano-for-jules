import { cn } from '@/lib/utils';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import {
  Home,
  User,
  FileText,
  ShoppingBag,
  Package,
  Pill,
  Users,
  BarChart2,
  HeartPulse,
  Settings,
  LogOut,
  ChevronDown,
  Shield,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useState } from 'react';

interface SidebarProps {
  className?: string;
}

export interface SidebarItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
  submenu?: {
    title: string;
    href: string;
  }[];
}

const Sidebar = ({ className }: SidebarProps) => {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  // Define sidebar items based on user role
  const patientItems: SidebarItem[] = [
    {
      title: 'Dashboard',
      href: '/patient-portal',
      icon: <Home className="h-5 w-5" />,
      roles: ['PATIENT']
    },
    {
      title: 'My Prescriptions',
      href: '/patient-portal/prescriptions',
      icon: <FileText className="h-5 w-5" />,
      roles: ['PATIENT']
    },
    {
      title: 'Order Medicines',
      href: '/patient-portal/order-medicine',
      icon: <ShoppingBag className="h-5 w-5" />,
      roles: ['PATIENT']
    },
    {
      title: 'My Orders',
      href: '/patient-portal/orders',
      icon: <Package className="h-5 w-5" />,
      roles: ['PATIENT']
    },
    {
      title: 'Verify Medicine',
      href: '/patient-portal/verify-medicine',
      icon: <Shield className="h-5 w-5" />,
      roles: ['PATIENT']
    },
    {
      title: 'Wellness Activities',
      href: '/wellness-hub/activities',
      icon: <Activity className="h-5 w-5" />,
      roles: ['PATIENT']
    }
  ];

  const pharmacyItems: SidebarItem[] = [
    {
      title: 'Dashboard',
      href: '/pharmacy-portal',
      icon: <Home className="h-5 w-5" />,
      roles: ['PHARMACY_STAFF']
    },
    {
      title: 'Orders',
      href: '/pharmacy-portal/orders',
      icon: <ShoppingBag className="h-5 w-5" />,
      roles: ['PHARMACY_STAFF'],
      submenu: [
        { title: 'New Orders', href: '/pharmacy-portal/orders/new' },
        { title: 'Processing', href: '/pharmacy-portal/orders/processing' },
        { title: 'Ready for Pickup', href: '/pharmacy-portal/orders/ready' },
        { title: 'Completed', href: '/pharmacy-portal/orders/completed' }
      ]
    },
    {
      title: 'Inventory',
      href: '/pharmacy-portal/inventory',
      icon: <Package className="h-5 w-5" />,
      roles: ['PHARMACY_STAFF'],
      submenu: [
        { title: 'Manage Inventory', href: '/pharmacy-portal/inventory' },
        { title: 'Add Medicine', href: '/pharmacy-portal/inventory/add' },
        { title: 'Low Stock Alert', href: '/pharmacy-portal/inventory/low-stock' },
        { title: 'Stock Reports', href: '/pharmacy-portal/inventory/reports' }
      ]
    },
    {
      title: 'Prescriptions',
      href: '/pharmacy-portal/prescriptions',
      icon: <FileText className="h-5 w-5" />,
      roles: ['PHARMACY_STAFF']
    },
    {
      title: 'Medical Aid Claims',
      href: '/pharmacy-portal/claims',
      icon: <Shield className="h-5 w-5" />,
      roles: ['PHARMACY_STAFF'],
      submenu: [
        { title: 'Direct Claims Processing', href: '/medical-aid-claims' },
        { title: 'Claims Dashboard', href: '/pharmacy-portal/claims' },
        { title: 'Provider Network', href: '/medical-aid-claims?tab=providers' },
        { title: 'Claims Analytics', href: '/medical-aid-claims?tab=analytics' }
      ]
    },
    {
      title: 'Analytics',
      href: '/pharmacy-portal/analytics',
      icon: <BarChart2 className="h-5 w-5" />,
      roles: ['PHARMACY_STAFF']
    }
  ];

  const doctorItems: SidebarItem[] = [
    {
      title: 'Dashboard',
      href: '/doctor-portal',
      icon: <Home className="h-5 w-5" />,
      roles: ['DOCTOR']
    },
    {
      title: 'Patients',
      href: '/doctor-portal/patients',
      icon: <Users className="h-5 w-5" />,
      roles: ['DOCTOR']
    },
    {
      title: 'E-Prescriptions',
      href: '/doctor-portal/prescriptions',
      icon: <FileText className="h-5 w-5" />,
      roles: ['DOCTOR']
    },
    {
      title: 'Appointments',
      href: '/doctor-portal/appointments',
      icon: <Activity className="h-5 w-5" />,
      roles: ['DOCTOR']
    }
  ];

  const wholesalerItems: SidebarItem[] = [
    {
      title: 'Dashboard',
      href: '/wholesaler-portal',
      icon: <Home className="h-5 w-5" />,
      roles: ['WHOLESALER_STAFF']
    },
    {
      title: 'Catalog',
      href: '/wholesaler-portal/catalog',
      icon: <Pill className="h-5 w-5" />,
      roles: ['WHOLESALER_STAFF']
    },
    {
      title: 'Orders',
      href: '/wholesaler-portal/orders',
      icon: <ShoppingBag className="h-5 w-5" />,
      roles: ['WHOLESALER_STAFF']
    },
    {
      title: 'Pharmacy Clients',
      href: '/wholesaler-portal/pharmacies',
      icon: <HeartPulse className="h-5 w-5" />,
      roles: ['WHOLESALER_STAFF']
    },
    {
      title: 'Analytics',
      href: '/wholesaler-portal/analytics',
      icon: <BarChart2 className="h-5 w-5" />,
      roles: ['WHOLESALER_STAFF']
    }
  ];

  // Combine all items and filter based on user role
  const allItems = [...patientItems, ...pharmacyItems, ...doctorItems, ...wholesalerItems];
  
  const filteredItems = allItems.filter(item => {
    // If no roles specified, show to everyone
    if (!item.roles) return true;
    // If roles specified, check if user has the required role
    return isAuthenticated && item.roles.includes(user?.role || '');
  });

  const toggleSubmenu = (title: string) => {
    if (openSubmenu === title) {
      setOpenSubmenu(null);
    } else {
      setOpenSubmenu(title);
    }
  };

  return (
    <aside className={cn("pb-12 w-64 border-r", className)}>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
            {user?.role === 'PATIENT' ? 'Patient Portal' : 
             user?.role === 'PHARMACY_STAFF' ? 'Pharmacy Portal' :
             user?.role === 'DOCTOR' ? 'Doctor Portal' :
             user?.role === 'WHOLESALER_STAFF' ? 'Wholesaler Portal' : 'Portal'}
          </h2>
          <div className="space-y-1">
            {filteredItems.map((item) => (
              !item.submenu ? (
                <Link 
                  key={item.href} 
                  href={item.href}
                >
                  <Button
                    variant={location === item.href ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    {item.icon}
                    <span className="ml-2">{item.title}</span>
                  </Button>
                </Link>
              ) : (
                <Collapsible
                  key={item.title}
                  open={openSubmenu === item.title}
                  onOpenChange={() => toggleSubmenu(item.title)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant={location.startsWith(item.href) ? "secondary" : "ghost"}
                      className="w-full justify-start"
                    >
                      {item.icon}
                      <span className="ml-2">{item.title}</span>
                      <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${openSubmenu === item.title ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-6 space-y-1">
                    {item.submenu.map((subitem) => (
                      <Link
                        key={subitem.href}
                        href={subitem.href}
                      >
                        <Button
                          variant={location === subitem.href ? "secondary" : "ghost"}
                          className="w-full justify-start"
                        >
                          <span>{subitem.title}</span>
                        </Button>
                      </Link>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )
            ))}
          </div>
        </div>
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
            Account
          </h2>
          <div className="space-y-1">
            <Link href="/profile">
              <Button
                variant={location === '/profile' ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <User className="h-5 w-5" />
                <span className="ml-2">Profile</span>
              </Button>
            </Link>
            <Link href="/settings">
              <Button
                variant={location === '/settings' ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <Settings className="h-5 w-5" />
                <span className="ml-2">Settings</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={logout}
            >
              <LogOut className="h-5 w-5" />
              <span className="ml-2">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
