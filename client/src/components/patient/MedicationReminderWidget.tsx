import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Clock, CheckCircle, AlertCircle, Pill } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface MedicationReminder {
  id: number;
  type: string;
  medicineId?: number;
  medicineName: string;
  details: string;
  dueDate: string;
  isDismissed: boolean;
  dosage?: string;
  instructions?: string;
}

export default function MedicationReminderWidget() {
  const [animatingPills, setAnimatingPills] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();

  const { data: reminders, isLoading } = useQuery<MedicationReminder[]>({
    queryKey: ['/api/v1/patient/reminders'],
  });

  const dismissReminderMutation = useMutation({
    mutationFn: async (reminderId: number) => {
      return apiRequest(`/api/v1/patient/reminders/${reminderId}/dismiss`, {
        method: 'PUT'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/patient/reminders'] });
    }
  });

  const handleTakeMedication = (reminderId: number) => {
    // Add pill animation
    setAnimatingPills(prev => new Set(prev).add(reminderId));
    
    // Remove animation after 2 seconds and dismiss reminder
    setTimeout(() => {
      setAnimatingPills(prev => {
        const newSet = new Set(prev);
        newSet.delete(reminderId);
        return newSet;
      });
      dismissReminderMutation.mutate(reminderId);
    }, 2000);
  };

  const getPillColor = (medicineType: string): string => {
    const colors = {
      'antibiotic': 'bg-red-400',
      'painkiller': 'bg-blue-400', 
      'vitamin': 'bg-yellow-400',
      'blood_pressure': 'bg-purple-400',
      'diabetes': 'bg-green-400',
      'default': 'bg-pink-400'
    };
    return colors[medicineType?.toLowerCase() as keyof typeof colors] || colors.default;
  };

  const getTimeStatus = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffMinutes = Math.floor((due.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffMinutes < 0) {
      return { status: 'overdue', text: 'Overdue', color: 'bg-red-100 text-red-800' };
    } else if (diffMinutes <= 30) {
      return { status: 'due_soon', text: 'Due Soon', color: 'bg-orange-100 text-orange-800' };
    } else {
      return { status: 'upcoming', text: 'Upcoming', color: 'bg-green-100 text-green-800' };
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-pink-500" />
            Medication Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading your medication reminders...</div>
        </CardContent>
      </Card>
    );
  }

  const medicationReminders = reminders?.filter(r => r.type === 'MEDICATION' && !r.isDismissed) || [];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pill className="h-5 w-5 text-pink-500" />
          Medication Reminders
          {medicationReminders.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {medicationReminders.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {medicationReminders.length === 0 ? (
          <div className="text-center py-8">
            <div className="relative inline-block">
              <div className="w-16 h-16 bg-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">😊</span>
              </div>
              <div className="absolute -top-1 -right-1">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <p className="text-gray-600">All caught up! No pending medication reminders.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {medicationReminders.map((reminder) => {
              const timeStatus = getTimeStatus(reminder.dueDate);
              const isAnimating = animatingPills.has(reminder.id);
              
              return (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Animated Pill Character */}
                    <div className="relative">
                      <div
                        className={`w-12 h-8 ${getPillColor(reminder.medicineName)} rounded-full flex items-center justify-center transition-all duration-500 ${
                          isAnimating ? 'animate-bounce scale-110' : ''
                        }`}
                      >
                        <span className="text-white text-sm font-bold">
                          {isAnimating ? '✨' : '💊'}
                        </span>
                      </div>
                      {isAnimating && (
                        <div className="absolute -top-1 -right-1 animate-ping">
                          <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">
                          {reminder.medicineName}
                        </h3>
                        <Badge className={timeStatus.color}>
                          {timeStatus.text}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {new Date(reminder.dueDate).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        {reminder.dosage && (
                          <span className="text-gray-500">
                            Dose: {reminder.dosage}
                          </span>
                        )}
                      </div>
                      
                      {reminder.instructions && (
                        <p className="text-sm text-gray-500 mt-1">
                          {reminder.instructions}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {timeStatus.status === 'overdue' && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    
                    <Button
                      onClick={() => handleTakeMedication(reminder.id)}
                      disabled={isAnimating || dismissReminderMutation.isPending}
                      className={`${
                        isAnimating 
                          ? 'bg-green-500 text-white' 
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      } transition-all duration-300`}
                    >
                      {isAnimating ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Taken!
                        </>
                      ) : (
                        <>
                          <Pill className="h-4 w-4 mr-1" />
                          Take Now
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Motivational Footer */}
        {medicationReminders.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 text-blue-700">
              <Bell className="h-5 w-5" />
              <span className="font-medium">Stay Healthy!</span>
            </div>
            <p className="text-sm text-blue-600 mt-1">
              Taking your medications on time helps you feel your best. You've got this! 💪
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}