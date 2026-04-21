import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { RawMaterial, BOM, BOMItem } from '../types/erp';

const RM_COLLECTION = 'raw_materials';
const BOM_COLLECTION = 'boms';
const PROD_COLLECTION = 'products';

export const seedManufacturingData = async (tenantId: string) => {
  console.log('Seeding Manufacturing Data...');

  // 1. Create Raw Materials (30+)
  const baseOils = ['SN 150', 'SN 500', 'BS 150', 'Group III 4cSt', 'Group III 6cSt', 'PAO 4', 'PAO 6'];
  const additives = [
    'Viscosity Index Improver (VII)', 
    'Anti-wear (ZDDP)', 
    'Detergent / Dispersant', 
    'Anti-oxidant', 
    'Pour Point Depressant', 
    'Corrosion Inhibitor', 
    'Antifoam Agent',
    'Industrial Gear Package',
    'Engine Oil Performance Package (API SP)',
    'Hydraulic Additive Package'
  ];

  const rawMaterialIds: { [name: string]: string } = {};

  for (const name of [...baseOils, ...additives]) {
    const isBaseOil = baseOils.includes(name);
    const code = `${isBaseOil ? 'BO' : 'AD'}-${name.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 900) + 100}`;
    
    const docRef = await addDoc(collection(db, RM_COLLECTION), {
      code,
      name,
      category: isBaseOil ? 'Base Oil' : 'Additive',
      supplier: isBaseOil ? 'Reliance Industries' : 'Lubrizol / Afton',
      stockQuantity: Math.floor(Math.random() * 50000) + 10000,
      unit: 'Liters',
      costPerUnit: isBaseOil ? Math.floor(Math.random() * 40) + 60 : Math.floor(Math.random() * 200) + 300,
      minStockLevel: 5000,
      tenantId
    });
    rawMaterialIds[name] = docRef.id;
  }

  // 2. Sample BOMs for existing Products
  const productsSnap = await getDocs(query(collection(db, PROD_COLLECTION), where('tenantId', '==', tenantId)));
  const products = productsSnap.docs.slice(0, 20); // Seed BOMs for first 20 products

  for (const p of products) {
    const pData = p.data();
    const items: BOMItem[] = [];

    // Simple Formulation logic: 85% Base Oil, 15% Additives
    // Select a random base oil
    const boName = baseOils[Math.floor(Math.random() * baseOils.length)];
    items.push({
      materialId: rawMaterialIds[boName],
      materialName: boName,
      quantity: 850 // 850L per 1000L batch
    });

    // Select 2-3 additives
    const selectedAdditives = additives.sort(() => 0.5 - Math.random()).slice(0, 3);
    selectedAdditives.forEach(ad => {
      items.push({
        materialId: rawMaterialIds[ad],
        materialName: ad,
        quantity: Math.floor(Math.random() * 50) + 30
      });
    });

    await addDoc(collection(db, BOM_COLLECTION), {
      productId: p.id,
      productName: pData.name,
      items,
      version: '1.0',
      tenantId
    });
  }

  console.log('Manufacturing Seed Completed.');
};
