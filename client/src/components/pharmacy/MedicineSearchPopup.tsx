import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X } from "lucide-react";

interface Medicine {
  id: number;
  name: string;
  genericName: string;
  manufacturer: string;
  category: string;
  packSize: number;
  unitPrice: number;
  fullPackPrice: number;
}

interface MedicineSearchPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedicine: (medicine: Medicine) => void;
  initialSearchTerm?: string;
}

export function MedicineSearchPopup({ 
  isOpen, 
  onClose, 
  onSelectMedicine, 
  initialSearchTerm = "" 
}: MedicineSearchPopupProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchMedicines = async (term: string) => {
    if (!term || term.length < 2) {
      setMedicines([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/v1/medicines/search?q=${encodeURIComponent(term)}`);
      const data = await response.json();
      setMedicines(data);
    } catch (error) {
      console.error("Medicine search error:", error);
      setMedicines([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && initialSearchTerm) {
      setSearchTerm(initialSearchTerm);
      searchMedicines(initialSearchTerm);
    }
  }, [isOpen, initialSearchTerm]);

  const handleSearch = () => {
    searchMedicines(searchTerm);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelectMedicine = (medicine: Medicine) => {
    onSelectMedicine(medicine);
    onClose();
  };

  const formatMedicineName = (name: string) => {
    // Remove registration number and clean up the name
    const cleanName = name.replace(/ - \d+\/[\d\.\/]+/g, '').trim();
    return cleanName;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-blue-700">
            Medicine Search - Zimbabwe Registered Medicines
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search medicines by name or generic name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 text-lg"
                autoFocus
              />
            </div>
            <Button onClick={handleSearch} className="px-6">
              Search
            </Button>
            <Button variant="outline" onClick={onClose} size="icon">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Search Results */}
          <div className="max-h-[60vh] overflow-y-auto space-y-3">
            {isLoading && (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-gray-600">Searching medicines...</p>
              </div>
            )}

            {!isLoading && searchTerm && medicines.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg">No medicines found for "{searchTerm}"</p>
                <p className="text-gray-400">Try searching with a different term</p>
              </div>
            )}

            {!isLoading && medicines.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  Found {medicines.length} medicine{medicines.length !== 1 ? 's' : ''}
                </p>
                <div className="grid gap-3">
                  {medicines.map((medicine) => (
                    <Card 
                      key={medicine.id} 
                      className="cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      onClick={() => handleSelectMedicine(medicine)}
                    >
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <h3 className="font-semibold text-lg text-blue-800 mb-1">
                              {formatMedicineName(medicine.name)}
                            </h3>
                            {medicine.genericName && (
                              <p className="text-gray-600 font-medium">
                                Generic: {medicine.genericName}
                              </p>
                            )}
                            <p className="text-gray-700">
                              Manufacturer: {medicine.manufacturer}
                            </p>
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-2 ${
                              medicine.category === 'Prescription' 
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {medicine.category}
                            </span>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-lg font-semibold text-blue-700">
                              ${medicine.fullPackPrice}
                            </div>
                            <div className="text-sm text-gray-600">
                              Pack of {medicine.packSize}
                            </div>
                            <div className="text-xs text-gray-500">
                              ${medicine.unitPrice.toFixed(3)} per unit
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {!searchTerm && (
              <div className="text-center py-8">
                <Search className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p className="text-gray-500 text-lg">Enter a medicine name to search</p>
                <p className="text-gray-400">Search through 2,719 registered medicines</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}