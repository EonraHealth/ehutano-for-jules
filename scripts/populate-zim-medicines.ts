import { db } from "../server/db";
import { medicines } from "../shared/schema";
import * as fs from 'fs';

async function populateZimbabweMedicines() {
  console.log("Starting Zimbabwe medicine database population...");
  
  // Read the HTML table from the Excel export
  const htmlContent = fs.readFileSync('../attached_assets/RadGridExport (2).xls', 'utf-8');
  
  // Extract table rows from the HTML
  const rowRegex = /<tr>\s*<td[^>]*>([^<]*)<\/td><td[^>]*>([^<]*)<\/td><td[^>]*>([^<]*)<\/td><td[^>]*>([^<]*)<\/td><td[^>]*>([^<]*)<\/td><td[^>]*>([^<]*)<\/td><td[^>]*>([^<]*)<\/td><td[^>]*>([^<]*)<\/td><td[^>]*>([^<]*)<\/td><td[^>]*>([^<]*)<\/td><td[^>]*>([^<]*)<\/td>\s*<\/tr>/g;
  
  const medicineData = [];
  let match;
  
  while ((match = rowRegex.exec(htmlContent)) !== null) {
    const [, tradeName, genericName, regNo, dateReg, expiryDate, form, category, strength, manufacturer, applicant, principal] = match;
    
    // Skip empty rows or header rows
    if (!tradeName || tradeName.includes('Trade Name') || !genericName) continue;
    
    // Extract manufacturer name (first one if multiple)
    const manufacturerName = manufacturer.split(';')[0].trim();
    
    // Determine category based on the registration category
    let medicineCategory = "General";
    if (category.includes("PRESCRIPTION")) medicineCategory = "Prescription";
    else if (category.includes("PHARMACY")) medicineCategory = "Pharmacy Medicine";
    else if (category.includes("HOUSEHOLD")) medicineCategory = "Over the Counter";
    
    // Generate pricing based on medicine type and form
    let unitPrice = 0.05; // Base price
    if (form.includes("INJECTION") || form.includes("INJECTABLE")) unitPrice = 0.25;
    else if (form.includes("TABLET") || form.includes("CAPSULE")) unitPrice = 0.03;
    else if (form.includes("SYRUP") || form.includes("SUSPENSION")) unitPrice = 0.08;
    else if (form.includes("CREAM") || form.includes("OINTMENT")) unitPrice = 0.15;
    
    // Determine pack size based on form
    let packSize = 30; // Default tablets/capsules
    if (form.includes("INJECTION")) packSize = 10;
    else if (form.includes("SYRUP") || form.includes("SUSPENSION")) packSize = 1; // 1 bottle
    else if (form.includes("CREAM") || form.includes("OINTMENT")) packSize = 1; // 1 tube
    else if (strength.includes("100")) packSize = 100;
    else if (strength.includes("50")) packSize = 50;
    
    medicineData.push({
      name: `${tradeName} (${genericName})`,
      genericName: genericName.trim(),
      manufacturer: manufacturerName || "Unknown",
      category: medicineCategory,
      description: `${form} - ${strength}`,
      sideEffects: "Consult healthcare provider for side effects",
      dosage: strength.trim(),
      price: (unitPrice * packSize).toFixed(2),
      inStock: true,
      requiresPrescription: medicineCategory === "Prescription",
      strength: strength.trim(),
      form: form.trim(),
      packSize: packSize,
      unitPrice: unitPrice,
      registrationNumber: regNo.trim(),
      expiryDate: expiryDate.includes('&nbsp;') ? null : expiryDate.trim()
    });
  }
  
  console.log(`Extracted ${medicineData.length} medicines from registration file`);
  
  // Clear existing medicines and insert new ones
  await db.delete(medicines);
  
  // Insert in batches to avoid memory issues
  const batchSize = 100;
  for (let i = 0; i < medicineData.length; i += batchSize) {
    const batch = medicineData.slice(i, i + batchSize);
    await db.insert(medicines).values(batch);
    console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(medicineData.length / batchSize)}`);
  }
  
  console.log(`Successfully populated database with ${medicineData.length} Zimbabwe registered medicines`);
}

populateZimbabweMedicines().catch(console.error);