import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { WellnessActivity, BlogPost } from '@/types';
import { useState } from 'react';
import { CalendarClock, Users, MapPin, Info } from 'lucide-react';

const WellnessHub = () => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [bookingActivity, setBookingActivity] = useState<number | null>(null);

  const { data: activities, isLoading: activitiesLoading, error: activitiesError, refetch } = useQuery<WellnessActivity[]>({
    queryKey: ['/api/v1/wellness/activities'],
  });

  const { data: blogPosts, isLoading: blogLoading, error: blogError } = useQuery<BlogPost[]>({
    queryKey: ['/api/v1/blog/posts'],
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
    <div className="space-y-6">
      <div className="text-center py-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-gray-100 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-3">
          Community Wellness Hub
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto mb-6">
          Join our wellness community and participate in activities designed to improve your 
          physical and mental wellbeing. Stay informed with the latest health information.
        </p>
        {!isAuthenticated && (
          <Button className="mx-auto">Sign up to participate</Button>
        )}
      </div>

      {/* Wellness Activities Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Wellness Activities</CardTitle>
              <CardDescription>Book your spot in our community wellness events</CardDescription>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="space-y-4">
                  {Array(4).fill(0).map((_, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start">
                        <Skeleton className="h-12 w-12 rounded-full mr-4" />
                        <div className="flex-1">
                          <Skeleton className="h-5 w-40 mb-2" />
                          <Skeleton className="h-4 w-full max-w-md mb-2" />
                          <div className="flex flex-wrap gap-2 mt-3">
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-8 w-24" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : activitiesError ? (
                <div className="text-center py-8">
                  <p className="text-red-500">Error loading wellness activities</p>
                </div>
              ) : activities && activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="p-4 border rounded-lg hover:border-primary-300 hover:shadow-sm transition-all">
                      <div className="flex items-start md:items-center flex-col md:flex-row">
                        <div className="text-4xl mr-4 mb-2 md:mb-0">{activity.iconEmoji || '🏋️'}</div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">{activity.name}</h3>
                          {activity.description && (
                            <p className="text-gray-600 text-sm mb-2">{activity.description}</p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-1">
                            <Badge variant="outline" className="flex items-center gap-1 text-gray-600">
                              <CalendarClock className="h-3 w-3" />
                              {activity.dayOfWeek}, {activity.time}
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1 text-gray-600">
                              <MapPin className="h-3 w-3" />
                              {activity.location}
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1 text-gray-600">
                              <Users className="h-3 w-3" />
                              {activity.availableSlots} of {activity.totalSlots} slots available
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-3 md:mt-0 w-full md:w-auto">
                          {activity.bookedByCurrentUser ? (
                            <Badge className="bg-green-100 text-green-800 font-medium">Booked</Badge>
                          ) : activity.availableSlots <= 0 ? (
                            <Badge className="bg-red-100 text-red-800 font-medium">Full</Badge>
                          ) : (
                            <Button 
                              onClick={() => handleBookActivity(activity.id)} 
                              disabled={bookingActivity === activity.id || !isAuthenticated}
                              className="w-full md:w-auto"
                            >
                              {bookingActivity === activity.id ? 'Booking...' : 'Book Now'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No wellness activities available at the moment</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Health Resources */}
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Health Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-700 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Mental Health Support
                  </h3>
                  <p className="text-sm text-blue-600 mt-1">Resources for managing stress and anxiety</p>
                  <Button variant="link" className="text-blue-700 p-0 mt-1">Learn more</Button>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <h3 className="font-medium text-green-700 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Nutrition Guides
                  </h3>
                  <p className="text-sm text-green-600 mt-1">Healthy eating with local ingredients</p>
                  <Button variant="link" className="text-green-700 p-0 mt-1">Learn more</Button>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <h3 className="font-medium text-purple-700 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Chronic Disease Management
                  </h3>
                  <p className="text-sm text-purple-600 mt-1">Tips for diabetes and hypertension</p>
                  <Button variant="link" className="text-purple-700 p-0 mt-1">Learn more</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Health Blog Section */}
          <Card>
            <CardHeader>
              <CardTitle>Health Blog</CardTitle>
            </CardHeader>
            <CardContent>
              {blogLoading ? (
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, index) => (
                    <div key={index} className="flex border-b border-gray-200 pb-4">
                      <Skeleton className="w-16 h-16 rounded-md mr-3" />
                      <div>
                        <Skeleton className="h-4 w-40 mb-1" />
                        <Skeleton className="h-3 w-32 mb-1" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : blogError ? (
                <div className="text-center py-6">
                  <p className="text-red-500">Error loading blog posts</p>
                </div>
              ) : blogPosts && blogPosts.length > 0 ? (
                <div className="space-y-4">
                  {blogPosts.slice(0, 3).map((post, index) => (
                    <div 
                      key={post.id} 
                      className={`flex ${index < blogPosts.length - 1 ? 'border-b border-gray-200 pb-4' : ''}`}
                    >
                      {post.imageUrl ? (
                        <img 
                          src={post.imageUrl} 
                          alt={post.title} 
                          className="w-16 h-16 object-cover rounded-md mr-3"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-md mr-3 flex items-center justify-center text-gray-400">
                          No image
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{post.title}</h4>
                        <p className="text-xs text-gray-500 mb-1">
                          {new Date(post.publishDate).toLocaleDateString()} • {post.authorName}
                        </p>
                        <p className="text-xs text-gray-600 line-clamp-2">{post.snippet}</p>
                        <Button variant="link" className="text-xs text-primary-600 hover:text-primary-700 p-0 mt-1">
                          Read more
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">No blog posts available at the moment</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WellnessHub;
