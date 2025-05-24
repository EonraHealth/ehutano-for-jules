import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BlogPost } from '@/types';

const HealthBlog = () => {
  const { data: blogPosts, isLoading, error } = useQuery<BlogPost[]>({
    queryKey: ['/api/v1/blog/posts'],
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm h-full">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Health Blog</h3>
          <Link href="/blog">
            <Button variant="link" className="text-sm font-medium text-primary-600 hover:text-primary-700 p-0">
              View All
            </Button>
          </Link>
        </div>
        <div className="space-y-4">
          {isLoading ? (
            // Loading state
            Array(3).fill(0).map((_, index) => (
              <div key={index} className="flex border-b border-gray-200 pb-4">
                <Skeleton className="w-16 h-16 rounded-md mr-3" />
                <div>
                  <Skeleton className="h-4 w-40 mb-1" />
                  <Skeleton className="h-3 w-32 mb-1" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))
          ) : error ? (
            // Error state
            <div className="text-center py-6">
              <p className="text-red-500">Error loading blog posts</p>
            </div>
          ) : blogPosts && blogPosts.length > 0 ? (
            // Data loaded successfully
            blogPosts.slice(0, 3).map((post, index) => (
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
                    {formatDate(post.publishDate)} • {post.authorName}
                  </p>
                  <p className="text-xs text-gray-600 line-clamp-2">{post.snippet}</p>
                  <Link href={`/blog/${post.id}`}>
                    <Button variant="link" className="text-xs text-primary-600 hover:text-primary-700 p-0 mt-1">
                      Read more
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            // No blog posts found
            <div className="text-center py-6">
              <p className="text-gray-500">No blog posts available at the moment</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default HealthBlog;
