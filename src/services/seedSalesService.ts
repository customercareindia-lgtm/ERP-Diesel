import { collection, addDoc, getDocs, query, where, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Customer, SalesOrder, OrderItem, Product } from '../types/erp';

const CUST_COLLECTION = 'customers';
const SALES_COLLECTION = 'sales_orders';
const PROD_COLLECTION = 'products';

export const seedSalesData = async (tenantId: string) => {
  console.log('Seeding Sales Data...');

  // 1. Create Customers (50+)
  const cities = ['Mumbai', 'Pune', 'Nashik', 'Surat', 'Ahmedabad', 'Indore', 'Nagpur', 'Goa'];
  const customerNames = [
    'Super Lubes Distributor', 'Reliance Logistics', 'Mahindra Spares', 'Tata Service Center',
    'Adani Ports Hub', 'Om Sai Auto Parts', 'Jai Maharashtra Dealers', 'Kishore Lubricants',
    'Bharat Petroleum Depot', 'Indian Oil vendor', 'Maruti Suzuki Arena', 'Hyundai Care',
    'Ashok Leyland Service', 'Royal Enfield Garage', 'Castrol Point', 'Mobil One Shop',
    'Auto Zone', 'Speedy Spares', 'Trust Motors', 'National Transporters',
    'Shree Ganesh Traders', 'Guru Nanak Auto', 'Metro Spares', 'Central Lubricants',
    'Western Wheels', 'Eastern Distributors', 'Southern Spares', 'Northern Auto'
  ];

  const customerIds: string[] = [];
  for (let i = 1; i <= 50; i++) {
    const name = customerNames[i % customerNames.length] + ' ' + i;
    const docRef = await addDoc(collection(db, CUST_COLLECTION), {
      name,
      phone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      city: cities[Math.floor(Math.random() * cities.length)],
      gstin: `27${Math.random().toString(36).substring(2, 11).toUpperCase()}1Z5`,
      tenantId,
      type: i % 5 === 0 ? 'Distributor' : i % 3 === 0 ? 'Bulk Buyer' : 'Retailer',
      outstandingBalance: Math.floor(Math.random() * 100000)
    });
    customerIds.push(docRef.id);
  }

  // 2. Create Sales Orders (50+)
  const productsSnap = await getDocs(query(collection(db, PROD_COLLECTION), where('tenantId', '==', tenantId)));
  const products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product));

  if (products.length === 0) {
    console.warn('No products found for sales seeding.');
    return;
  }

  const statuses: SalesOrder['status'][] = ['draft', 'confirmed', 'shipped', 'delivered', 'completed', 'cancelled'];

  for (let i = 1; i <= 50; i++) {
    const custId = customerIds[Math.floor(Math.random() * customerIds.length)];
    const custSnap = await getDocs(query(collection(db, CUST_COLLECTION), where('tenantId', '==', tenantId))); // Actually I have the IDs
    // Simplified: Just use a generic customer name for seeding
    const customerName = `Demo Customer ${i}`;

    const orderItems: OrderItem[] = [];
    const itemCount = Math.floor(Math.random() * 3) + 1;
    let subtotal = 0;

    for (let j = 0; j < itemCount; j++) {
      const p = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 20) + 5;
      const price = p.sellingPrice;
      orderItems.push({
        productId: p.id,
        sku: p.sku,
        name: p.name,
        quantity,
        price
      });
      subtotal += quantity * price;
    }

    const taxAmount = subtotal * 0.18; // 18% GST
    const discountAmount = i % 10 === 0 ? subtotal * 0.05 : 0;
    const totalAmount = subtotal + taxAmount - discountAmount;

    await addDoc(collection(db, SALES_COLLECTION), {
      orderNumber: `SO-${Date.now().toString().slice(-6)}-${i}`,
      customerId: custId,
      customerName,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createdAt: new Date().toISOString(),
      items: orderItems,
      tenantId
    });
  }

  console.log('Sales Seed Completed.');
};
