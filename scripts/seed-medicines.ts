import { db } from "../server/db";
import { medicines } from "../shared/schema";

const medicineData = [
  // OTC Medicines (Brand Names)
  {
    name: "4CS Children's Cough and Cold Syrup",
    genericName: "Dextromethorphan, Chlorpheniramine Maleate, Paracetamol, Phenylephrine HCl",
    dosage: "0.5/2/120/2.5mg per 5ml",
    form: "Syrup",
    manufacturer: "CAPS Pvt Ltd",
    price: 8.50,
    category: "OTC",
    description: "Children's cough and cold relief syrup"
  },
  {
    name: "Panadol",
    genericName: "Paracetamol",
    dosage: "500mg",
    form: "Tablet",
    manufacturer: "GSK",
    price: 3.20,
    category: "OTC",
    description: "Pain and fever relief"
  },
  {
    name: "Dispirin",
    genericName: "Aspirin",
    dosage: "300mg",
    form: "Tablet",
    manufacturer: "Reckitt Benckiser",
    price: 2.80,
    category: "OTC",
    description: "Pain relief and anti-inflammatory"
  },
  {
    name: "Brufen",
    genericName: "Ibuprofen",
    dosage: "400mg",
    form: "Tablet",
    manufacturer: "Abbott",
    price: 4.50,
    category: "OTC",
    description: "Non-steroidal anti-inflammatory drug"
  },
  {
    name: "Actifed",
    genericName: "Triprolidine, Pseudoephedrine",
    dosage: "1.25mg/30mg",
    form: "Tablet",
    manufacturer: "GSK",
    price: 6.75,
    category: "OTC",
    description: "Cold and allergy relief"
  },
  
  // Prescription Medicines (Generic names with brand in brackets)
  {
    name: "Abacavir (Ziagen)",
    genericName: "Abacavir",
    dosage: "300mg",
    form: "Tablet",
    manufacturer: "Aurobindo Pharma Ltd",
    price: 45.20,
    category: "Prescription",
    description: "Antiretroviral medication for HIV treatment"
  },
  {
    name: "Abacavir/Lamivudine (Kivexa)",
    genericName: "Abacavir Sulfate, Lamivudine",
    dosage: "600mg/300mg",
    form: "Tablet",
    manufacturer: "Aurobindo Pharma Ltd",
    price: 68.90,
    category: "Prescription",
    description: "Fixed-dose combination for HIV treatment"
  },
  {
    name: "Acetazolamide (Diamox)",
    genericName: "Acetazolamide",
    dosage: "250mg",
    form: "Tablet",
    manufacturer: "Remedica Ltd",
    price: 12.30,
    category: "Prescription",
    description: "Carbonic anhydrase inhibitor for glaucoma and altitude sickness"
  },
  {
    name: "Aciclovir (Zovirax)",
    genericName: "Acyclovir",
    dosage: "200mg",
    form: "Tablet",
    manufacturer: "Cipla Ltd",
    price: 8.60,
    category: "Prescription",
    description: "Antiviral medication for herpes infections"
  },
  {
    name: "Aciclovir (Zovirax)",
    genericName: "Acyclovir",
    dosage: "800mg",
    form: "Tablet",
    manufacturer: "Hetero Labs Ltd",
    price: 24.80,
    category: "Prescription",
    description: "High-dose antiviral for severe herpes infections"
  },
  {
    name: "Aceclofenac (Aclotas)",
    genericName: "Aceclofenac",
    dosage: "100mg",
    form: "Tablet",
    manufacturer: "Intas Pharmaceuticals Ltd",
    price: 6.40,
    category: "Prescription",
    description: "NSAID for pain and inflammation"
  },
  {
    name: "Albendazole (ABZ)",
    genericName: "Albendazole",
    dosage: "400mg",
    form: "Tablet",
    manufacturer: "Indoco Remedies Ltd",
    price: 4.20,
    category: "Prescription",
    description: "Antiparasitic medication"
  },
  {
    name: "Filgrastim (Accofil)",
    genericName: "Filgrastim",
    dosage: "300mcg/0.5ml",
    form: "Injection",
    manufacturer: "Intas Pharmaceuticals Ltd",
    price: 185.50,
    category: "Prescription",
    description: "Colony stimulating factor for neutropenia"
  },
  {
    name: "Bevacizumab (Abevmy)",
    genericName: "Bevacizumab",
    dosage: "100mg/4ml",
    form: "Injection",
    manufacturer: "Biocon Limited",
    price: 890.00,
    category: "Prescription",
    description: "Monoclonal antibody for cancer treatment"
  },
  {
    name: "Abiraterone (Abirapro)",
    genericName: "Abiraterone Acetate",
    dosage: "500mg",
    form: "Tablet",
    manufacturer: "Glenmark Pharmaceuticals Ltd",
    price: 320.75,
    category: "Prescription",
    description: "Hormone therapy for prostate cancer"
  },
  
  // Additional common medicines
  {
    name: "Amoxicillin (Amoxil)",
    genericName: "Amoxicillin",
    dosage: "500mg",
    form: "Capsule",
    manufacturer: "GSK",
    price: 12.50,
    category: "Prescription",
    description: "Penicillin antibiotic"
  },
  {
    name: "Amoxicillin/Clavulanate (Augmentin)",
    genericName: "Amoxicillin, Clavulanic Acid",
    dosage: "625mg",
    form: "Tablet",
    manufacturer: "GSK",
    price: 18.90,
    category: "Prescription",
    description: "Penicillin antibiotic with beta-lactamase inhibitor"
  },
  {
    name: "Metformin (Glucophage)",
    genericName: "Metformin Hydrochloride",
    dosage: "500mg",
    form: "Tablet",
    manufacturer: "Merck",
    price: 5.60,
    category: "Prescription",
    description: "Antidiabetic medication"
  },
  {
    name: "Metformin (Glucophage XR)",
    genericName: "Metformin Hydrochloride",
    dosage: "850mg",
    form: "Extended Release Tablet",
    manufacturer: "Merck",
    price: 8.90,
    category: "Prescription",
    description: "Extended-release antidiabetic medication"
  },
  {
    name: "Amlodipine (Norvasc)",
    genericName: "Amlodipine Besylate",
    dosage: "5mg",
    form: "Tablet",
    manufacturer: "Pfizer",
    price: 7.20,
    category: "Prescription",
    description: "Calcium channel blocker for hypertension"
  },
  {
    name: "Atorvastatin (Lipitor)",
    genericName: "Atorvastatin Calcium",
    dosage: "20mg",
    form: "Tablet",
    manufacturer: "Pfizer",
    price: 15.80,
    category: "Prescription",
    description: "Statin for cholesterol management"
  },
  {
    name: "Lisinopril (Prinivil)",
    genericName: "Lisinopril",
    dosage: "10mg",
    form: "Tablet",
    manufacturer: "Merck",
    price: 6.40,
    category: "Prescription",
    description: "ACE inhibitor for hypertension"
  },
  {
    name: "Omeprazole (Losec)",
    genericName: "Omeprazole",
    dosage: "20mg",
    form: "Capsule",
    manufacturer: "AstraZeneca",
    price: 9.50,
    category: "Prescription",
    description: "Proton pump inhibitor for acid reflux"
  },
  {
    name: "Salbutamol (Ventolin)",
    genericName: "Salbutamol Sulfate",
    dosage: "100mcg",
    form: "Inhaler",
    manufacturer: "GSK",
    price: 22.40,
    category: "Prescription",
    description: "Bronchodilator for asthma and COPD"
  },
  {
    name: "Ciprofloxacin (Cipro)",
    genericName: "Ciprofloxacin Hydrochloride",
    dosage: "500mg",
    form: "Tablet",
    manufacturer: "Bayer",
    price: 14.70,
    category: "Prescription",
    description: "Fluoroquinolone antibiotic"
  }
];

async function seedMedicines() {
  try {
    console.log("Starting medicine seeding...");
    
    // Clear existing medicines
    await db.delete(medicines);
    console.log("Cleared existing medicines");
    
    // Insert new medicines
    for (const medicine of medicineData) {
      await db.insert(medicines).values({
        name: medicine.name,
        genericName: medicine.genericName,
        manufacturer: medicine.manufacturer,
        category: medicine.category,
        description: `${medicine.form} - ${medicine.dosage} - ${medicine.description}`,
        requiresPrescription: medicine.category === "Prescription"
      });
    }
    
    console.log(`Successfully seeded ${medicineData.length} medicines`);
    
    // Query and display seeded medicines
    const seededMedicines = await db.select().from(medicines);
    console.log("Seeded medicines:", seededMedicines.slice(0, 5)); // Show first 5
    
  } catch (error) {
    console.error("Error seeding medicines:", error);
  }
}

// Run seeding when script is executed directly
seedMedicines()
  .then(() => {
    console.log("Medicine seeding completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Medicine seeding failed:", error);
    process.exit(1);
  });

export { seedMedicines };