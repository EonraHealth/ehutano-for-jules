import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Sidebar from '@/components/layout/Sidebar';

interface GenericPageProps {
  title: string;
  description?: string;
}

const GenericPage = ({ title, description }: GenericPageProps) => {
  const [location] = useLocation();
  
  return (
    <div className="flex">
      <Sidebar className="hidden md:block" />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">{title}</h1>
        <Card>
          <CardHeader>
            <CardTitle>Page Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{description || `This is the ${title} page`}</p>
            <p className="text-sm text-gray-500">Current path: {location}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GenericPage;