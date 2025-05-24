import { Card, CardContent } from '@/components/ui/card';

// Define an array of partner logos
const partnerLogos = [
  { name: 'Cimas MedAid', url: 'https://placehold.co/150x60/a5f3fc/0e7490?text=Cimas+Logo' },
  { name: 'Bonvie Pharmacy', url: 'https://placehold.co/150x60/d8b4fe/581c87?text=Bonvie+Pharmacy' },
  { name: 'MediSupply Wholesalers', url: 'https://placehold.co/150x60/fecaca/991b1b?text=MediSupply' },
  { name: 'Wellness Hub ZW', url: 'https://placehold.co/150x60/a7f3d0/14532d?text=Wellness+Hub' },
  { name: 'Dr. Moyo Clinic', url: 'https://placehold.co/150x60/bfdbfe/1e40af?text=Dr+Moyo+Clinic' },
];

const PartnerLogos = () => {
  return (
    <Card className="bg-white rounded-xl shadow-sm">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Our Partners</h3>
        <div className="overflow-hidden">
          <div className="flex space-x-8 animate-scroll hover:paused">
            {/* Duplicate the logos to create a seamless scroll effect */}
            {[...partnerLogos, ...partnerLogos].map((logo, index) => (
              <div key={`${logo.name}-${index}`} className="flex-shrink-0">
                <img src={logo.url} alt={logo.name} className="h-12" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PartnerLogos;
