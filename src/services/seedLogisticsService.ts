import { 
  collection, 
  writeBatch, 
  doc, 
  getDocs, 
  query, 
  where, 
  limit 
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Transporter, 
  Vehicle, 
  Warehouse, 
  DispatchOrder, 
  SalesOrder 
} from '../types/erp';

export const seedLogisticsData = async (tenantId: string) => {
  const batch = writeBatch(db);

  // 1. Warehouses (3-5)
  const warehouses: Omit<Warehouse, 'id'>[] = [
    { name: 'Central Warehouse (Gujarat)', location: 'Ahmedabad, Gujarat', capacity: 500000, contactPhone: '+91 9988776655', tenantId },
    { name: 'Regional Hub (Maharashtra)', location: 'Pune, Maharashtra', capacity: 300000, contactPhone: '+91 9988776644', tenantId },
    { name: 'North Depot (HR)', location: 'Gurgaon, Haryana', capacity: 200000, contactPhone: '+91 9988776633', tenantId },
    { name: 'South Transit (TN)', location: 'Chennai, Tamil Nadu', capacity: 150000, contactPhone: '+91 9988776622', tenantId },
  ];

  const warehouseIds: string[] = [];
  warehouses.forEach(w => {
    const ref = doc(collection(db, 'warehouses'));
    batch.set(ref, w);
    warehouseIds.push(ref.id);
  });

  // 2. Transporters (15+)
  const transporters: Omit<Transporter, 'id'>[] = [
    { name: 'VRL Logistics Ltd', contactPerson: 'Vijay Sankeshwar', phone: '0836-2237511', email: 'vrl@example.com', gstin: '29AAACV5678A1Z1', tenantId },
    { name: 'GATI KWE', contactPerson: 'Mahendra Agarwal', phone: '040-27844284', email: 'gati@example.com', gstin: '36AAACG1234F1Z2', tenantId },
    { name: 'TCI Freight', contactPerson: 'Vineet Agarwal', phone: '1800-1800-444', email: 'tci@example.com', gstin: '07AAACT0000E1Z3', tenantId },
    { name: 'Blue Dart Logistics', contactPerson: 'Balfour Manuel', phone: '1860-233-1234', email: 'bluedart@example.com', gstin: '27AAACD1111B1Z4', tenantId },
    { name: 'Mahindra Logistics', contactPerson: 'Pirojshaw Sarkari', phone: '022-28716800', email: 'mahindra@example.com', gstin: '27AAACM2222C1Z5', tenantId },
    { name: 'SafeExpress', contactPerson: 'Pawan Jain', phone: '1800-113-113', email: 'safe@example.com', gstin: '07AAACS3333D1Z6', tenantId },
    { name: 'Rivigo Services', contactPerson: 'Deepak Garg', phone: '0124-4354354', email: 'rivigo@example.com', gstin: '06AAACR4444G1Z7', tenantId },
    { name: 'Delhivery B2B', contactPerson: 'Sahil Barua', phone: '0124-6719500', email: 'delhivery@example.com', gstin: '06AAACD5555H1Z8', tenantId },
    { name: 'Agarwal Packers', contactPerson: 'Ramesh Agarwal', phone: '9300300300', email: 'apml@example.com', gstin: '07AAACA6666J1Z9', tenantId },
    { name: 'Ecom Express', contactPerson: 'T.A. Krishnan', phone: '011-30212000', email: 'ecom@example.com', gstin: '07AAACE7777K1Z0', tenantId },
    { name: 'DTDC Logistics', contactPerson: 'Subhasish Chakraborty', phone: '1800-3456-789', email: 'dtdc@example.com', gstin: '29AAACD8888L1Z1', tenantId },
    { name: 'Express Logistics Services', contactPerson: 'Amit Kumar', phone: '9876543210', email: 'els@example.com', gstin: '09AAACE9999M1Z2', tenantId },
    { name: 'Bharat Freight', contactPerson: 'Rajesh Gupta', phone: '9876543211', email: 'bharat@example.com', gstin: '33AAACB0000N1Z3', tenantId },
    { name: 'Western Transport Co', contactPerson: 'Sanjay Shah', phone: '9876543212', email: 'wtc@example.com', gstin: '24AAACW1111P1Z4', tenantId },
    { name: 'Punjab Roadways Cargo', contactPerson: 'Gurmeet Singh', phone: '9876543213', email: 'prc@example.com', gstin: '03AAACP2222Q1Z5', tenantId },
  ];

  const transporterIds: {id: string, name: string}[] = [];
  transporters.forEach(t => {
    const ref = doc(collection(db, 'transporters'));
    batch.set(ref, t);
    transporterIds.push({ id: ref.id, name: t.name });
  });

  // 3. Vehicles (25+)
  const vehicleTypes: Vehicle['type'][] = ['Tanker', 'Truck', 'Mini Truck', 'Van'];
  const drivers = ['Ramesh', 'Suresh', 'Amit', 'Rajesh', 'Pankaj', 'Vijay', 'Anil', 'Sunil', 'Karan', 'Arjun', 'Vikram', 'Deepak', 'Manoj', 'Ashish', 'Santosh'];
  
  const vehicleIds: {id: string, num: string, dr: string, drPh: string}[] = [];
  for (let i = 1; i <= 30; i++) {
    const type = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
    const dr = drivers[Math.floor(Math.random() * drivers.length)];
    const v: Omit<Vehicle, 'id'> = {
      vehicleNumber: `GJ-0${1 + Math.floor(i/4)}-${1000 + i}`,
      type,
      capacity: type === 'Tanker' ? 20000 : type === 'Truck' ? 10000 : 2000,
      driverName: dr,
      driverPhone: `+91 98${Math.floor(Math.random() * 90000000) + 10000000}`,
      status: i % 5 === 0 ? 'On Trip' : 'Available',
      tenantId
    };
    const ref = doc(collection(db, 'vehicles'));
    batch.set(ref, v);
    vehicleIds.push({ id: ref.id, num: v.vehicleNumber, dr: v.driverName, drPh: v.driverPhone });
  }

  // 4. Dispatch Orders (60+) - Mocked based on current sales orders
  const salesOrdersSnapshot = await getDocs(query(collection(db, 'sales_orders'), where('tenantId', '==', tenantId), limit(100)));
  const salesOrders = salesOrdersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as SalesOrder);

  if (salesOrders.length > 0) {
    const statuses: DispatchOrder['status'][] = ['dispatched', 'in_transit', 'delivered', 'delivered', 'delayed', 'completed'];
    const shipmentTypes: DispatchOrder['shipmentType'][] = ['Bulk', 'Packed'];
    const locations = ['Surat Highway', 'Panvel Toll', 'Delhi Bypass', 'JNPT Port', 'Industrial Area, Phase 2', 'Nagar Road Hub'];

    for (let i = 0; i < 65; i++) {
      const so = salesOrders[i % salesOrders.length];
      const transporter = transporterIds[Math.floor(Math.random() * transporterIds.length)];
      const vehicle = vehicleIds[Math.floor(Math.random() * vehicleIds.length)];
      const warehouseId = warehouseIds[Math.floor(Math.random() * warehouseIds.length)];
      const warehouse = warehouses.find((_, idx) => warehouseIds[idx] === warehouseId);
      
      const status = i < 40 ? 'delivered' : statuses[Math.floor(Math.random() * statuses.length)];
      const shipmentType = i % 3 === 0 ? 'Bulk' : 'Packed';
      
      const doData: Omit<DispatchOrder, 'id'> = {
        dispatchId: `DO-${100000 + i}`,
        orderId: so.id,
        orderNumber: so.orderNumber,
        customerId: so.customerId,
        customerName: so.customerName,
        deliveryAddress: `${so.customerName} Warehouse, Sector ${10 + (i%50)}, Near Main Road`,
        items: so.items,
        warehouseId,
        warehouseName: warehouse?.name || 'Main Warehouse',
        transporterId: transporter.id,
        transporterName: transporter.name,
        vehicleId: vehicle.id,
        vehicleNumber: vehicle.num,
        driverName: vehicle.dr,
        driverPhone: vehicle.drPh,
        shipmentType,
        status,
        trackingId: `TRK${700000 + i}`,
        eta: new Date(Date.now() + 86400000 * 2).toISOString(),
        lastLocation: locations[Math.floor(Math.random() * locations.length)],
        freightCharges: 5000 + (Math.random() * 15000),
        handlingCharges: 500 + (Math.random() * 2000),
        loadingDate: new Date(Date.now() - 86400000 * (i < 40 ? 5 : 1)).toISOString(),
        deliveryDate: status === 'delivered' || status === 'completed' ? new Date().toISOString() : undefined,
        ewayBillNumber: `27${100000000000 + i}`,
        tenantId,
        createdAt: new Date(Date.now() - 86400000 * 10 - i * 3600000).toISOString()
      };
      
      const doRef = doc(collection(db, 'dispatch_orders'));
      batch.set(doRef, doData);
    }
  }

  await batch.commit();
};
