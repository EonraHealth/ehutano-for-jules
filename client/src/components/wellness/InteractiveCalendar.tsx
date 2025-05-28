import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface TimeSlot {
  date: string;
  time: string;
  available: number;
}

interface WellnessActivity {
  id: number;
  name: string;
  category: string;
  instructor: string;
  duration: number;
  capacity: number;
  price: number;
  description: string;
  availableSlots: TimeSlot[];
}

export default function InteractiveCalendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedActivity, setSelectedActivity] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const queryClient = useQueryClient();

  const { data: activities, isLoading } = useQuery<WellnessActivity[]>({
    queryKey: ['/api/v1/wellness/activities'],
  });

  const bookingMutation = useMutation({
    mutationFn: async ({ activityId, slot }: { activityId: number; slot: TimeSlot }) => {
      return apiRequest(`/api/v1/wellness/activities/${activityId}/book`, {
        method: 'POST',
        body: { date: slot.date, time: slot.time }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/wellness/activities'] });
      setSelectedSlot(null);
    }
  });

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getActivitiesForDate = (date: Date) => {
    if (!activities || !Array.isArray(activities)) return [];
    const dateStr = date.toISOString().split('T')[0];
    
    return activities.filter(activity => 
      activity.availableSlots && Array.isArray(activity.availableSlots) && 
      activity.availableSlots.some(slot => slot.date === dateStr && slot.available > 0)
    );
  };

  const getSlotsForActivityAndDate = (activityId: number, date: Date) => {
    const activity = activities?.find(a => a.id === activityId);
    if (!activity) return [];
    
    const dateStr = date.toISOString().split('T')[0];
    return activity.availableSlots.filter(slot => slot.date === dateStr);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleBookSlot = () => {
    if (selectedActivity && selectedSlot) {
      bookingMutation.mutate({
        activityId: selectedActivity,
        slot: selectedSlot
      });
    }
  };

  const days = getDaysInMonth(selectedDate);
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading wellness activities...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Interactive Wellness Calendar</h1>
        <p className="text-gray-600">Book your wellness activities with real-time availability</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {dayNames.map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                if (!day) {
                  return <div key={index} className="p-2 h-16"></div>;
                }
                
                const activitiesForDay = getActivitiesForDate(day);
                const isToday = day.toDateString() === new Date().toDateString();
                
                return (
                  <div
                    key={day.toISOString()}
                    className={`p-2 h-16 border rounded cursor-pointer hover:bg-gray-50 ${
                      isToday ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className="text-sm font-medium">{day.getDate()}</div>
                    {activitiesForDay.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {activitiesForDay.slice(0, 2).map(activity => (
                          <div
                            key={activity.id}
                            className="w-2 h-2 rounded-full bg-green-500"
                            title={activity.name}
                          />
                        ))}
                        {activitiesForDay.length > 2 && (
                          <div className="text-xs text-gray-500">+{activitiesForDay.length - 2}</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Activities for Selected Date */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getActivitiesForDate(selectedDate).map(activity => (
                <div
                  key={activity.id}
                  className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                    selectedActivity === activity.id ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedActivity(activity.id)}
                >
                  <div className="font-medium">{activity.name}</div>
                  <div className="text-sm text-gray-600">{activity.instructor}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">{activity.category}</Badge>
                    <span className="text-sm">${activity.price}</span>
                  </div>
                  
                  {selectedActivity === activity.id && (
                    <div className="mt-3 space-y-2">
                      <div className="text-sm font-medium">Available Times:</div>
                      {getSlotsForActivityAndDate(activity.id, selectedDate).map(slot => (
                        <div
                          key={`${slot.date}-${slot.time}`}
                          className={`flex items-center justify-between p-2 border rounded cursor-pointer ${
                            slot.available === 0 ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50'
                          } ${selectedSlot === slot ? 'border-blue-500 bg-blue-50' : ''}`}
                          onClick={() => slot.available > 0 && setSelectedSlot(slot)}
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{slot.time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span className="text-sm">
                              {slot.available}/{activity.capacity}
                            </span>
                          </div>
                        </div>
                      ))}
                      
                      {selectedSlot && (
                        <Button 
                          className="w-full mt-3"
                          onClick={handleBookSlot}
                          disabled={bookingMutation.isPending}
                        >
                          {bookingMutation.isPending ? 'Booking...' : 'Book This Slot'}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {getActivitiesForDate(selectedDate).length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No activities available on this date
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Categories Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Available Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {activities?.map(activity => (
              <div key={activity.id} className="p-4 border rounded-lg">
                <div className="font-medium">{activity.name}</div>
                <div className="text-sm text-gray-600 mt-1">{activity.category}</div>
                <div className="flex items-center gap-2 mt-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{activity.duration} min</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Max {activity.capacity}</span>
                </div>
                <div className="text-sm font-medium mt-2">${activity.price}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}