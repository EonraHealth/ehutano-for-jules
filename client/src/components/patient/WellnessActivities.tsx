import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { WellnessActivity } from '@/types';

const WellnessActivities = () => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [bookingActivity, setBookingActivity] = useState<number | null>(null);

  const { data: activities, isLoading, error, refetch } = useQuery<WellnessActivity[]>({
    queryKey: ['/api/v1/wellness/activities'],
  });

  const handleBookActivity = async (activityId: number) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to book wellness activities',
        variant: 'destructive',
      });
      return;
    }

    try {
      setBookingActivity(activityId);
      await apiRequest('POST', `/api/v1/wellness/activities/${activityId}/book`, {});
      
      toast({
        title: 'Booking Successful',
        description: 'You have successfully booked this activity',
        variant: 'default',
      });
      
      // Refetch activities to update the UI
      refetch();
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: 'Booking Failed',
        description: 'There was an error booking this activity. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setBookingActivity(null);
    }
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm h-full">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Wellness Activities</h3>
          <Link href="/wellness-hub">
            <Button variant="link" className="text-sm font-medium text-primary-600 hover:text-primary-700 p-0">
              View All
            </Button>
          </Link>
        </div>
        <div className="space-y-3">
          {isLoading ? (
            // Loading state
            Array(3).fill(0).map((_, index) => (
              <div key={index} className="flex items-center p-3 border border-gray-200 rounded-lg">
                <div className="flex-shrink-0 text-2xl mr-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
                <div className="flex-grow">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <div className="flex-shrink-0">
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))
          ) : error ? (
            // Error state
            <div className="text-center py-6">
              <p className="text-red-500">Error loading wellness activities</p>
            </div>
          ) : activities && activities.length > 0 ? (
            // Data loaded successfully
            activities.slice(0, 3).map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-blue-50 transition-all duration-200"
              >
                <div className="flex-shrink-0 text-2xl mr-3">
                  {activity.iconEmoji || '🏋️'}
                </div>
                <div className="flex-grow">
                  <h4 className="text-sm font-medium text-gray-900">{activity.name}</h4>
                  <p className="text-xs text-gray-500">{activity.dayOfWeek}, {activity.time} • {activity.location}</p>
                </div>
                {activity.bookedByCurrentUser ? (
                  <div className="flex-shrink-0 text-xs font-medium text-green-600">Booked</div>
                ) : activity.availableSlots <= 0 ? (
                  <div className="flex-shrink-0 text-xs font-medium text-red-600">Full</div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0 text-xs font-medium text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => handleBookActivity(activity.id)}
                    disabled={bookingActivity === activity.id}
                  >
                    {bookingActivity === activity.id ? 'Booking...' : `${activity.availableSlots} slots left`}
                  </Button>
                )}
              </div>
            ))
          ) : (
            // No activities found
            <div className="text-center py-6">
              <p className="text-gray-500">No wellness activities available at the moment</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WellnessActivities;
