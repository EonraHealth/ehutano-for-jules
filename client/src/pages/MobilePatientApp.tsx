import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Heart, 
  Pill, 
  ShoppingCart, 
  Bell, 
  User, 
  Search,
  MapPin,
  Clock,
  Plus,
  Camera,
  QrCode,
  Shield,
  Activity,
  FileText,
  Phone,
  MessageSquare
} from "lucide-react";

export default function MobilePatientApp() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("home");

  // Quick actions data
  const quickActions = [
    { icon: Camera, label: "Upload Prescription", color: "bg-blue-100 text-blue-600" },
    { icon: QrCode, label: "Scan Medicine", color: "bg-green-100 text-green-600" },
    { icon: Shield, label: "Verify Medicine", color: "bg-purple-100 text-purple-600" },
    { icon: MapPin, label: "Find Pharmacy", color: "bg-orange-100 text-orange-600" }
  ];

  // Recent orders
  const recentOrders = [
    { id: "ORD-001", items: "Paracetamol, Vitamin C", status: "Delivered", date: "2025-05-25" },
    { id: "ORD-002", items: "Amoxicillin, Ibuprofen", status: "In Transit", date: "2025-05-24" }
  ];

  // Active prescriptions
  const activePrescriptions = [
    { name: "Metformin 500mg", dosage: "2x daily", nextDose: "2:00 PM", remaining: 15 },
    { name: "Lisinopril 10mg", dosage: "1x daily", nextDose: "8:00 AM", remaining: 28 }
  ];

  // Medicine reminders
  const [upcomingReminders, setUpcomingReminders] = useState([
    { id: 1, medicine: "Metformin", time: "2:00 PM", taken: false },
    { id: 2, medicine: "Vitamin D", time: "6:00 PM", taken: false }
  ]);

  const handleMarkTaken = (id: number) => {
    setUpcomingReminders(prev => 
      prev.map(reminder => 
        reminder.id === id ? { ...reminder, taken: true } : reminder
      )
    );
  };

  const HomeTab = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-xl">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12 border-2 border-white">
            <AvatarFallback className="bg-white text-blue-600 font-semibold">
              {user?.username?.charAt(0).toUpperCase() || 'P'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold">Hello, {user?.username || 'Patient'}</h2>
            <p className="text-blue-100">How are you feeling today?</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action, index) => (
            <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <div className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium">{action.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Medicine Reminders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Today's Reminders</h3>
          <Badge variant="outline">{upcomingReminders.length} pending</Badge>
        </div>
        <div className="space-y-3">
          {upcomingReminders.map((reminder) => (
            <Card key={reminder.id} className={reminder.taken ? "bg-green-50 border-green-200" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      reminder.taken ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      <Pill className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{reminder.medicine}</p>
                      <p className="text-sm text-gray-500">{reminder.time}</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant={reminder.taken ? "outline" : "default"}
                    onClick={() => handleMarkTaken(reminder.id)}
                    disabled={reminder.taken}
                  >
                    {reminder.taken ? "✓ Taken" : "Mark Taken"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Orders</h3>
          <Button variant="ghost" size="sm">View All</Button>
        </div>
        <div className="space-y-3">
          {recentOrders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{order.id}</p>
                    <p className="text-sm text-gray-500">{order.items}</p>
                    <p className="text-xs text-gray-400">{order.date}</p>
                  </div>
                  <Badge variant={order.status === "Delivered" ? "default" : "secondary"}>
                    {order.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  const MedicinesTab = () => (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder="Search medicines..."
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Quick Medicine Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <QrCode className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Scan QR Code</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Verify Medicine</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Prescriptions */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Active Prescriptions</h3>
        <div className="space-y-3">
          {activePrescriptions.map((prescription, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 text-green-600 w-10 h-10 rounded-full flex items-center justify-center">
                      <Pill className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{prescription.name}</p>
                      <p className="text-sm text-gray-500">{prescription.dosage}</p>
                      <p className="text-xs text-gray-400">Next: {prescription.nextDose}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{prescription.remaining} pills</p>
                    <Button size="sm" variant="outline" className="mt-1">
                      Refill
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Upload Prescription */}
      <Card className="border-dashed border-2 border-gray-300">
        <CardContent className="p-6 text-center">
          <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-3">Upload a new prescription</p>
          <Button>
            <Camera className="h-4 w-4 mr-2" />
            Take Photo
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const OrdersTab = () => (
    <div className="space-y-6">
      {/* Cart Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
              <div>
                <p className="font-medium">3 items in cart</p>
                <p className="text-sm text-gray-600">Total: $45.50</p>
              </div>
            </div>
            <Button>Checkout</Button>
          </div>
        </CardContent>
      </Card>

      {/* Order History */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Order History</h3>
        <div className="space-y-3">
          {recentOrders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{order.id}</p>
                  <Badge variant={order.status === "Delivered" ? "default" : "secondary"}>
                    {order.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">{order.items}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">{order.date}</p>
                  <Button variant="outline" size="sm">View Details</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Find Nearby Pharmacies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Nearby Pharmacies
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600 mb-3">Find pharmacies near your location</p>
          
          {/* Pharmacy List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Central Pharmacy</p>
                <p className="text-sm text-gray-600">0.8 km away • Open until 8 PM</p>
              </div>
              <div className="flex space-x-1">
                <Button size="sm" variant="outline">
                  <Phone className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline">
                  <MapPin className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">HealthFirst Pharmacy</p>
                <p className="text-sm text-gray-600">1.2 km away • Open 24/7</p>
              </div>
              <div className="flex space-x-1">
                <Button size="sm" variant="outline">
                  <Phone className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline">
                  <MapPin className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
          
          <Button className="w-full">
            <MapPin className="h-4 w-4 mr-2" />
            View All on Map
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const HealthTab = () => (
    <div className="space-y-6">
      {/* Health Overview */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Heart className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-lg font-semibold">Health Status</p>
              <p className="text-sm text-green-700">All medications on track</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wellness Activities */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Wellness Activities</h3>
        <div className="grid grid-cols-1 gap-3">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Activity className="h-6 w-6 text-purple-600" />
                <div>
                  <p className="font-medium">Yoga for Beginners</p>
                  <p className="text-sm text-gray-500">Monday 9:00 AM</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Activity className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="font-medium">Nutrition Workshop</p>
                  <p className="text-sm text-gray-500">Wednesday 2:00 PM</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Health Articles */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Health Articles</h3>
        <div className="space-y-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-medium">Understanding Your Medication Labels</p>
                  <p className="text-sm text-gray-500">Dr. Grace Nyambo • 5 min read</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <p className="font-medium">Managing Chronic Conditions</p>
                  <p className="text-sm text-gray-500">Pharmacist John Mwanza • 8 min read</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const ProfileTab = () => (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-blue-100 text-blue-600 text-xl font-semibold">
                {user?.username?.charAt(0).toUpperCase() || 'P'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{user?.username || 'Patient'}</h2>
              <p className="text-gray-500">{user?.email || 'patient@example.com'}</p>
              <Badge variant="outline" className="mt-1">Verified Account</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Actions */}
      <div className="space-y-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-600" />
                <span>Edit Profile</span>
              </div>
              <span className="text-gray-400">→</span>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="h-5 w-5 text-gray-600" />
                <span>Notification Settings</span>
              </div>
              <span className="text-gray-400">→</span>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-gray-600" />
                <span>Privacy & Security</span>
              </div>
              <span className="text-gray-400">→</span>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-600" />
                <span>Contact Support</span>
              </div>
              <span className="text-gray-400">→</span>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MessageSquare className="h-5 w-5 text-gray-600" />
                <span>Help & FAQ</span>
              </div>
              <span className="text-gray-400">→</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emergency Contact */}
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Phone className="h-6 w-6 text-red-600" />
            <div>
              <p className="font-semibold text-red-800">Emergency Hotline</p>
              <p className="text-sm text-red-700">24/7 Medical Support: +263 123 456 789</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Heart className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Welcome to ehutano+</h2>
            <p className="text-gray-600 mb-4">Please sign in to access your mobile health companion</p>
            <Button className="w-full">Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Content */}
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-blue-600">ehutano+</h1>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4 pb-20">
          {activeTab === "home" && <HomeTab />}
          {activeTab === "medicines" && <MedicinesTab />}
          {activeTab === "orders" && <OrdersTab />}
          {activeTab === "health" && <HealthTab />}
          {activeTab === "profile" && <ProfileTab />}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200">
          <div className="grid grid-cols-5 py-2">
            {[
              { id: "home", icon: Heart, label: "Home" },
              { id: "medicines", icon: Pill, label: "Medicines" },
              { id: "orders", icon: ShoppingCart, label: "Orders" },
              { id: "health", icon: Activity, label: "Health" },
              { id: "profile", icon: User, label: "Profile" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center py-2 px-1 ${
                  activeTab === tab.id 
                    ? "text-blue-600" 
                    : "text-gray-500"
                }`}
              >
                <tab.icon className="h-5 w-5 mb-1" />
                <span className="text-xs">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}