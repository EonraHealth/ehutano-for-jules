import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WellnessHub from '@/components/wellness/WellnessHub';
import InteractiveCalendar from '@/components/wellness/InteractiveCalendar';

const WellnessHubPage = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Wellness Overview</TabsTrigger>
          <TabsTrigger value="calendar">Interactive Booking</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <WellnessHub />
        </TabsContent>

        <TabsContent value="calendar">
          <InteractiveCalendar />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WellnessHubPage;
