import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, FileText, BookOpen, Lightbulb, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Comprehensive medical abbreviation dictionary
const medicalAbbreviations: Record<string, string> = {
  // Frequency
  'od': 'once daily',
  'bd': 'twice daily', 
  'bid': 'twice daily',
  'tds': 'three times daily',
  'tid': 'three times daily',
  'qds': 'four times daily',
  'qid': 'four times daily',
  'q4h': 'every 4 hours',
  'q6h': 'every 6 hours',
  'q8h': 'every 8 hours',
  'q12h': 'every 12 hours',
  'prn': 'when necessary',
  'stat': 'immediately',
  'sos': 'if required',
  'nocte': 'at night',
  'mane': 'in the morning',
  
  // Timing
  'ac': 'before food',
  'pc': 'after food',
  'hs': 'at bedtime',
  'am': 'in the morning',
  'pm': 'in the evening',
  'ante': 'before',
  'post': 'after',
  'om': 'every morning',
  'on': 'every night',
  
  // Dosage forms and amounts
  't1': 'take one tablet',
  't2': 'take two tablets',
  't3': 'take three tablets',
  'c1': 'take one capsule',
  'c2': 'take two capsules',
  'c3': 'take three capsules',
  'tab': 'tablet',
  'tabs': 'tablets',
  'cap': 'capsule',
  'caps': 'capsules',
  'ml': 'millilitres',
  'mg': 'milligrams',
  'g': 'grams',
  'tsp': 'teaspoon',
  'tbsp': 'tablespoon',
  '5ml': '5 millilitres (one teaspoon)',
  '10ml': '10 millilitres (two teaspoons)',
  '15ml': '15 millilitres (one tablespoon)',
  
  // Routes of administration
  'po': 'by mouth',
  'topical': 'apply to skin',
  'iv': 'intravenous',
  'im': 'intramuscular',
  'sl': 'under the tongue',
  'pr': 'rectally',
  'pv': 'vaginally',
  'inhaled': 'by inhalation',
  'nasal': 'into the nose',
  'otic': 'into the ear',
  'ophthalmic': 'into the eye',
  
  // Common conditions/indications
  'pdi': 'pain and inflammation',
  'uti': 'urinary tract infection',
  'htn': 'high blood pressure',
  'dm': 'diabetes',
  'pain': 'pain relief',
  'fever': 'fever reduction',
  'infection': 'infection treatment',
  'cough': 'cough suppression',
  'nausea': 'nausea and vomiting',
  'anxiety': 'anxiety relief',
  'insomnia': 'sleep aid',
  'allergy': 'allergic reactions',
  
  // Special instructions
  'npo': 'nothing by mouth',
  'nkda': 'no known drug allergies',
  'daw': 'dispense as written',
  'ud': 'as directed',
  'qs': 'sufficient quantity',
  'dtd': 'give of such doses',
  'mdu': 'more detailed usage',
  'crf': 'chronic renal failure',
  'ccf': 'chronic cardiac failure',
  'copd': 'chronic obstructive pulmonary disease',
};

// Common prescription patterns with examples
const prescriptionPatterns = [
  {
    pattern: "t1 bd pc",
    translation: "Take one tablet twice daily after food",
    category: "Oral Medication"
  },
  {
    pattern: "c2 tds ac prn nausea", 
    translation: "Take two capsules three times daily before food when necessary for nausea",
    category: "Conditional Dosing"
  },
  {
    pattern: "5ml qds po",
    translation: "Take 5 millilitres (one teaspoon) four times daily by mouth",
    category: "Liquid Medication"
  },
  {
    pattern: "t1 od hs prn insomnia",
    translation: "Take one tablet once daily at bedtime when necessary for sleep aid",
    category: "Sleep Medication"
  },
  {
    pattern: "apply topical bd",
    translation: "Apply to skin twice daily",
    category: "Topical Application"
  },
  {
    pattern: "t2 stat then t1 q6h prn pain",
    translation: "Take two tablets immediately then take one tablet every 6 hours when necessary for pain relief",
    category: "Loading Dose"
  }
];

interface TranslationHistory {
  original: string;
  translated: string;
  timestamp: Date;
}

const MedicationInstructionTranslator = () => {
  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [highlightedTerms, setHighlightedTerms] = useState<string[]>([]);
  const [translationHistory, setTranslationHistory] = useState<TranslationHistory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Real-time translation as user types
  useEffect(() => {
    if (inputText.trim()) {
      const translated = translatePrescription(inputText);
      setTranslatedText(translated);
    } else {
      setTranslatedText("");
      setHighlightedTerms([]);
    }
  }, [inputText]);

  const translatePrescription = (prescription: string): string => {
    const words = prescription.toLowerCase().split(/\s+/);
    const foundTerms: string[] = [];
    
    const translatedWords = words.map(word => {
      // Remove punctuation for matching
      const cleanWord = word.replace(/[.,;:]/g, '');
      
      if (medicalAbbreviations[cleanWord]) {
        foundTerms.push(cleanWord);
        return medicalAbbreviations[cleanWord];
      }
      return word;
    });
    
    setHighlightedTerms(foundTerms);
    return translatedWords.join(' ');
  };

  const saveTranslation = () => {
    if (inputText.trim() && translatedText.trim()) {
      const newTranslation: TranslationHistory = {
        original: inputText,
        translated: translatedText,
        timestamp: new Date()
      };
      
      setTranslationHistory(prev => [newTranslation, ...prev.slice(0, 9)]); // Keep last 10
      
      toast({
        title: "Translation Saved",
        description: "Added to your translation history",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
    });
  };

  const useExample = (pattern: string) => {
    setInputText(pattern);
  };

  const clearAll = () => {
    setInputText("");
    setTranslatedText("");
    setHighlightedTerms([]);
  };

  // Filter abbreviations based on search
  const filteredAbbreviations = Object.entries(medicalAbbreviations).filter(
    ([abbr, meaning]) => 
      abbr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meaning.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Medication Instruction Translator
          </CardTitle>
          <CardDescription>
            Translate medical abbreviations and prescription cyphers into clear patient instructions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="translator" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="translator">Translator</TabsTrigger>
              <TabsTrigger value="reference">Reference</TabsTrigger>
              <TabsTrigger value="examples">Examples</TabsTrigger>
            </TabsList>
            
            <TabsContent value="translator" className="space-y-4">
              {/* Main Translation Interface */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prescription-input">Prescription Cypher</Label>
                  <div className="relative">
                    <Input
                      id="prescription-input"
                      placeholder="e.g., t1 tds pc prn pdi"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="min-h-[100px] p-3 text-base font-mono"
                    />
                    {highlightedTerms.length > 0 && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="text-xs">
                          {highlightedTerms.length} terms found
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  {/* Highlighted Terms */}
                  {highlightedTerms.length > 0 && (
                    <div className="flex flex-wrap gap-1 p-2 bg-blue-50 rounded">
                      <span className="text-xs text-blue-600 font-medium">Recognized:</span>
                      {highlightedTerms.map((term, index) => (
                        <Badge key={index} variant="outline" className="text-xs bg-blue-100">
                          {term}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="translation-output">Patient Instructions</Label>
                  <div className="relative">
                    <div className="min-h-[100px] p-3 border rounded-md bg-green-50 border-green-200">
                      <p className="text-base text-green-800 capitalize">
                        {translatedText || "Enter prescription cypher to see translation..."}
                      </p>
                    </div>
                    {translatedText && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(translatedText)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button onClick={saveTranslation} disabled={!translatedText}>
                  <FileText className="h-4 w-4 mr-2" />
                  Save Translation
                </Button>
                <Button variant="outline" onClick={clearAll}>
                  Clear All
                </Button>
              </div>
              
              {/* Translation History */}
              {translationHistory.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-2">Recent Translations</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {translationHistory.map((item, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                        <div className="font-mono text-xs text-gray-600">{item.original}</div>
                        <div className="text-gray-800">{item.translated}</div>
                        <div className="text-xs text-gray-500">
                          {item.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="reference" className="space-y-4">
              {/* Abbreviation Reference */}
              <div className="space-y-2">
                <Label htmlFor="search-abbreviations">Search Abbreviations</Label>
                <Input
                  id="search-abbreviations"
                  placeholder="Search abbreviations or meanings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {filteredAbbreviations.map(([abbr, meaning]) => (
                  <div key={abbr} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                       onClick={() => setInputText(prev => prev + (prev ? ' ' : '') + abbr)}>
                    <div className="font-mono font-bold text-blue-600">{abbr}</div>
                    <div className="text-sm text-gray-600">{meaning}</div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="examples" className="space-y-4">
              {/* Common Prescription Examples */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {prescriptionPatterns.map((example, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => useExample(example.pattern)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {example.category}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="font-mono text-sm text-blue-600 mb-1">
                        {example.pattern}
                      </div>
                      <div className="text-sm text-gray-700">
                        {example.translation}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Lightbulb className="h-4 w-4" />
                  Click any example to load it into the translator
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default MedicationInstructionTranslator;