import { inventoryService } from './inventoryService';
import { Product } from '../types/erp';
import { seedManufacturingData } from './seedManufacturingService';
import { seedSalesData } from './seedSalesService';
import { seedAccountingData } from './seedAccountingService';
import { seedLogisticsData } from './seedLogisticsService';
import { seedSalesmanData } from './seedSalesmanService';

const LUBRICANT_BRANDS = ['Shell', 'Castrol', 'Mobil', 'Servo', 'Gulf', 'Total', 'Valvoline', 'Motul'];
const CATEGORIES: Product['category'][] = ['Engine Oil', 'Gear Oil', 'Grease', 'Coolant', 'Hydraulic Oil', 'Brake Fluid', 'Industrial'];
const VISCOSITIES = ['5W-30', '10W-40', '15W-40', '20W-50', 'SAE 90', 'SAE 140', 'ISO 68', 'ISO 46'];
const PACK_SIZES: Product['packSize'][] = ['1L', '5L', '20L', '210L'];

export const seedDatabase = async (tenantId: string) => {
  console.log('Seeding 100 products...');
  
  for (let i = 1; i <= 100; i++) {
    const brand = LUBRICANT_BRANDS[Math.floor(Math.random() * LUBRICANT_BRANDS.length)];
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const viscosity = VISCOSITIES[Math.floor(Math.random() * VISCOSITIES.length)];
    const packSize = PACK_SIZES[Math.floor(Math.random() * PACK_SIZES.length)];
    
    const name = `${brand} ${category} ${viscosity} Premium`;
    const sku = `${brand.substring(0, 3).toUpperCase()}-${category.substring(0, 2).toUpperCase()}-${viscosity.replace(/\W/g, '')}-${i}`;
    
    // Realistic pricing
    const purchasePrice = Math.floor(Math.random() * 500) + 100;
    const sellingPrice = Math.floor(purchasePrice * (1.1 + Math.random() * 0.3));
    const minStockLevel = Math.floor(Math.random() * 50) + 20;
    
    const productId = await inventoryService.addProduct({
      sku,
      name,
      category,
      hsnCode: '2710',
      viscosity,
      packSize,
      purchasePrice,
      sellingPrice,
      minStockLevel,
      supplierName: `${brand} India Pvt Ltd`,
      tenantId,
      image: `https://picsum.photos/seed/${sku}/400/400`
    });

    // Add some random initial stock
    const initialStock = Math.floor(Math.random() * 200);
    if (initialStock > 0) {
      await inventoryService.updateStock(productId, initialStock, tenantId);
    }
  }

  // Seed Manufacturing Data
  await seedManufacturingData(tenantId);

  // Seed Sales Data
  await seedSalesData(tenantId);

  // Seed Accounting Data
  await seedAccountingData(tenantId);

  // Seed Logistics Data
  await seedLogisticsData(tenantId);

  // Seed Salesman Data
  await seedSalesmanData(tenantId);
  
  console.log('Seed completed.');
};
