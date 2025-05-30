import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  MapPin, 
  DollarSign, 
  Clock, 
  Star, 
  Phone, 
  Navigation,
  Truck,
  Store,
  Filter,
  ShoppingCart
} from 'lucide-react';

interface Medicine {
  id: number;
  name: string;
  genericName: string;
  dosage: string;
  category: string;
}

interface PharmacyPrice {
  pharmacyId: number;
  pharmacyName: string;
  address: string;
  distance: number;
  phone: string;
  rating: number;
  totalReviews: number;
  price: number;
  inStock: boolean;
  lastUpdated: string;
  deliveryAvailable: boolean;
  deliveryFee: number;
  estimatedDeliveryTime: string;
  openingHours: {
    weekday: string;
    saturday: string;
    sunday: string;
  };
  isOpen: boolean;
  specialOffers?: string;
}

interface PriceComparison {
  medicine: Medicine;
  prices: PharmacyPrice[];
  averagePrice: number;
  lowestPrice: number;
  highestPrice: number;
  priceRange: number;
}

export default function PrescriptionPriceComparison() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [sortBy, setSortBy] = useState<'price' | 'distance' | 'rating'>('price');
  const [filterInStock, setFilterInStock] = useState(true);
  const [locationRadius, setLocationRadius] = useState('5');

  // Search medicines
  const { data: medicines = [] as Medicine[], isLoading: medicinesLoading } = useQuery({
    queryKey: ['/api/v1/medicines/search', { q: searchTerm }],
    enabled: searchTerm.length > 2
  });

  // Get price comparison for selected medicine
  const { data: priceComparison, isLoading: pricesLoading } = useQuery<PriceComparison>({
    queryKey: ['/api/v1/medicines/price-comparison', selectedMedicine?.id, { radius: locationRadius }],
    enabled: !!selectedMedicine
  });

  const handleMedicineSelect = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
  };

  const sortPrices = (prices: PharmacyPrice[]) => {
    if (!prices) return [];
    
    let filtered = filterInStock ? prices.filter(p => p.inStock) : prices;
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        case 'distance':
          return a.distance - b.distance;
        case 'rating':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatDistance = (distance: number) => `${distance.toFixed(1)} km`;

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Prescription Price Comparison
          </CardTitle>
          <CardDescription>
            Compare prescription prices across nearby pharmacies to find the best deals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="medicine-search">Search Medicine</Label>
              <Input
                id="medicine-search"
                placeholder="Enter medicine name (e.g., Amoxicillin, Metformin)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location-radius">Search Radius</Label>
              <Select value={locationRadius} onValueChange={setLocationRadius}>
                <SelectTrigger>
                  <SelectValue placeholder="Select radius" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 km</SelectItem>
                  <SelectItem value="10">10 km</SelectItem>
                  <SelectItem value="15">15 km</SelectItem>
                  <SelectItem value="25">25 km</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Medicine Search Results */}
          {medicinesLoading && (
            <div className="text-center py-4">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="mt-2 text-sm text-muted-foreground">Searching medicines...</p>
            </div>
          )}

          {medicines && medicines.length > 0 && (
            <div className="space-y-2">
              <Label>Select Medicine</Label>
              <div className="grid gap-2">
                {medicines.slice(0, 5).map((medicine: Medicine) => (
                  <Button
                    key={medicine.id}
                    variant={selectedMedicine?.id === medicine.id ? "default" : "outline"}
                    className="justify-start text-left h-auto p-3"
                    onClick={() => handleMedicineSelect(medicine)}
                  >
                    <div>
                      <div className="font-medium">{medicine.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {medicine.genericName} • {medicine.dosage} • {medicine.category}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price Comparison Results */}
      {selectedMedicine && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Price Comparison for {selectedMedicine.name}
            </CardTitle>
            <CardDescription>
              {selectedMedicine.genericName} • {selectedMedicine.dosage}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pricesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="mt-2 text-muted-foreground">Comparing prices across pharmacies...</p>
              </div>
            ) : priceComparison ? (
              <div className="space-y-6">
                {/* Price Overview */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(priceComparison.lowestPrice)}
                      </div>
                      <p className="text-sm text-muted-foreground">Lowest Price</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">
                        {formatCurrency(priceComparison.averagePrice)}
                      </div>
                      <p className="text-sm text-muted-foreground">Average Price</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-red-600">
                        {formatCurrency(priceComparison.highestPrice)}
                      </div>
                      <p className="text-sm text-muted-foreground">Highest Price</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">
                        {formatCurrency(priceComparison.priceRange)}
                      </div>
                      <p className="text-sm text-muted-foreground">Price Range</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Filters and Sort */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <Label>Sort by:</Label>
                    <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="price">Price</SelectItem>
                        <SelectItem value="distance">Distance</SelectItem>
                        <SelectItem value="rating">Rating</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant={filterInStock ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterInStock(!filterInStock)}
                  >
                    In Stock Only
                  </Button>
                </div>

                {/* Pharmacy List */}
                <div className="space-y-4">
                  {sortPrices(priceComparison.prices).map((pharmacy) => (
                    <Card key={pharmacy.pharmacyId} className={!pharmacy.inStock ? "opacity-75" : ""}>
                      <CardContent className="p-6">
                        <div className="grid gap-4 md:grid-cols-3">
                          {/* Pharmacy Info */}
                          <div className="md:col-span-2">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                  <Store className="h-5 w-5" />
                                  {pharmacy.pharmacyName}
                                  {pharmacy.isOpen ? (
                                    <Badge variant="outline" className="text-green-600 border-green-600">
                                      Open
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-red-600 border-red-600">
                                      Closed
                                    </Badge>
                                  )}
                                </h3>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {formatDistance(pharmacy.distance)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    {pharmacy.rating} ({pharmacy.totalReviews} reviews)
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-4 w-4" />
                                    {pharmacy.phone}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-3">{pharmacy.address}</p>
                            
                            <div className="grid gap-2 md:grid-cols-2 text-sm">
                              <div>
                                <strong>Hours:</strong>
                                <div className="text-muted-foreground">
                                  <div>Mon-Fri: {pharmacy.openingHours.weekday}</div>
                                  <div>Saturday: {pharmacy.openingHours.saturday}</div>
                                  <div>Sunday: {pharmacy.openingHours.sunday}</div>
                                </div>
                              </div>
                              {pharmacy.deliveryAvailable && (
                                <div>
                                  <strong className="flex items-center gap-1">
                                    <Truck className="h-4 w-4" />
                                    Delivery Available
                                  </strong>
                                  <div className="text-muted-foreground">
                                    <div>Fee: {formatCurrency(pharmacy.deliveryFee)}</div>
                                    <div>Time: {pharmacy.estimatedDeliveryTime}</div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {pharmacy.specialOffers && (
                              <div className="mt-3">
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                  Special Offer: {pharmacy.specialOffers}
                                </Badge>
                              </div>
                            )}
                          </div>

                          {/* Price and Actions */}
                          <div className="flex flex-col justify-between">
                            <div className="text-right">
                              <div className="text-3xl font-bold text-primary">
                                {formatCurrency(pharmacy.price)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {pharmacy.inStock ? 'In Stock' : 'Out of Stock'}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Updated: {new Date(pharmacy.lastUpdated).toLocaleDateString()}
                              </div>
                              
                              {pharmacy.price === priceComparison.lowestPrice && (
                                <Badge className="mt-2 bg-green-100 text-green-800">
                                  Best Price
                                </Badge>
                              )}
                            </div>

                            <div className="space-y-2 mt-4">
                              <Button 
                                className="w-full" 
                                disabled={!pharmacy.inStock}
                              >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Order Now
                              </Button>
                              <Button variant="outline" size="sm" className="w-full">
                                <Navigation className="h-4 w-4 mr-2" />
                                Get Directions
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {sortPrices(priceComparison.prices).length === 0 && (
                  <div className="text-center py-8">
                    <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No pharmacies found</h3>
                    <p className="text-muted-foreground">
                      Try expanding your search radius or removing the "In Stock Only" filter.
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Tips Section */}
      <Card>
        <CardHeader>
          <CardTitle>Money-Saving Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">Generic vs Brand</h4>
              <p className="text-sm text-muted-foreground">
                Generic medicines contain the same active ingredients as brand names but cost significantly less.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Bulk Purchases</h4>
              <p className="text-sm text-muted-foreground">
                Buying larger quantities (90-day supplies) often reduces the per-unit cost.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Pharmacy Loyalty Programs</h4>
              <p className="text-sm text-muted-foreground">
                Many pharmacies offer loyalty programs with discounts and rewards for regular customers.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Medical Aid Benefits</h4>
              <p className="text-sm text-muted-foreground">
                Check your medical aid benefits - some medicines may be covered or have lower co-payments.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}