import { db } from "./db";

export async function searchMedicines(searchTerm: string) {
  try {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    // Query the authentic Zimbabwe medicine database
    const result = await db.execute(`
      SELECT id, name, generic_name, manufacturer, category, description, requires_prescription 
      FROM medicines 
      WHERE LOWER(name) LIKE LOWER($1) 
         OR LOWER(generic_name) LIKE LOWER($1)
      LIMIT 20
    `, [`%${searchTerm}%`]);

    // Format for frontend with pricing calculations
    const formattedMedicines = result.rows.map((medicine: any) => {
      // Extract pack size from description or use defaults based on form
      let packSize = 30; // Default
      let unitPrice = 0.05; // Base price
      
      const description = medicine.description || "";
      if (description.includes("INJECTION")) {
        packSize = 10;
        unitPrice = 0.25;
      } else if (description.includes("SYRUP") || description.includes("SUSPENSION")) {
        packSize = 1;
        unitPrice = 0.08;
      } else if (description.includes("CREAM") || description.includes("OINTMENT")) {
        packSize = 1;
        unitPrice = 0.15;
      }
      
      return {
        id: medicine.id,
        name: medicine.name,
        genericName: medicine.generic_name || "",
        manufacturer: medicine.manufacturer || "Unknown",
        category: medicine.category || "General",
        dosage: description,
        packSize: packSize,
        unitPrice: unitPrice,
        fullPackPrice: parseFloat((unitPrice * packSize).toFixed(2)),
        nappiCode: "",
        inStock: true
      };
    });

    return formattedMedicines;
  } catch (error) {
    console.error("Medicine search error:", error);
    return [];
  }
}