import { 
  collection, 
  writeBatch, 
  doc, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Salesman, 
  Visit, 
  Customer, 
  ERPUser,
  SalesTarget
} from '../types/erp';

const INDIAN_CITIES = [
  'Ahmedabad, Gujarat', 'Mumbai, Maharashtra', 'Pune, Maharashtra', 
  'Surat, Gujarat', 'Rajkot, Gujarat', 'Vadodara, Gujarat',
  'Indore, MP', 'Delhi NCR', 'Jaipur, Rajasthan', 'Bangalore, KA',
  'Chennai, TN', 'Hyderabad, TS', 'Kolkata, WB', 'Bhopal, MP',
  'Ludhiana, PB', 'Kanpur, UP', 'Nagpur, MH', 'Nashik, MH'
];

export const seedSalesmanData = async (tenantId: string) => {
  const batch = writeBatch(db);

  // 1. Fetch some customers to assign
  const customersSnapshot = await getDocs(query(collection(db, 'customers'), where('tenantId', '==', tenantId)));
  const customers = customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Customer);

  // 2. Create 22 Salesmen
  const salesmenNames = [
    'Rajesh Kumar', 'Sanjay Sharma', 'Amit Patel', 'Vijay Singh', 'Anil Gupta',
    'Sunil Verma', 'Ramesh Yadav', 'Deepak Mishra', 'Pankaj Tiwari', 'Manoj Joshi',
    'Vikram Rathore', 'Sandeep Dhillon', 'Karan Arora', 'Arjun Mehra', 'Rahul Saxena',
    'Vivek Chauhan', 'Ashok Reddy', 'Srinivas Rao', 'Karthik Prabhu', 'Nitin Gadkari',
    'Praveen Kumar', 'Suresh Raina'
  ];

  const salesmanIds: string[] = [];
  const currentMonth = new Date().toISOString().substring(0, 7);

  for (let i = 0; i < salesmenNames.length; i++) {
    const salesmanRef = doc(collection(db, 'salesmen'));
    const empId = `S-10${i + 1}`;
    
    // Assign 5 random customers
    const assignedCustomers = customers
      .sort(() => 0.5 - Math.random())
      .slice(0, 5)
      .map(c => c.id);

    const city = INDIAN_CITIES[i % INDIAN_CITIES.length];
    
    // Coordinates around India
    const lat = 18 + Math.random() * 8;
    const lng = 72 + Math.random() * 8;

    const s: Omit<Salesman, 'id'> = {
      employeeId: empId,
      name: salesmenNames[i],
      phone: `+91 98${Math.floor(Math.random() * 90000000) + 10000000}`,
      email: `${salesmenNames[i].toLowerCase().replace(' ', '.')}@lubrierp.pro`,
      territory: city,
      role: i < 3 ? 'Area Manager' : 'Sales Executive',
      active: true,
      assignedCustomers,
      currentLocation: {
        lat,
        lng,
        lastUpdated: new Date().toISOString()
      },
      tenantId,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    batch.set(salesmanRef, s);
    salesmanIds.push(salesmanRef.id);

    // Seed Target for each
    const targetRef = doc(collection(db, 'sales_targets'));
    const target: Omit<SalesTarget, 'id'> = {
      salesmanId: salesmanRef.id,
      month: currentMonth,
      targetAmount: 500000 + Math.random() * 500000,
      achievedAmount: 200000 + Math.random() * 600000,
      visitTarget: 80,
      achievedVisits: 40 + Math.floor(Math.random() * 50),
      tenantId
    };
    batch.set(targetRef, target);

    // Seed some recent visits (3 per salesman)
    for (let j = 0; j < 3; j++) {
      const visitRef = doc(collection(db, 'visits'));
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const visit: Omit<Visit, 'id'> = {
        salesmanId: salesmanRef.id,
        salesmanName: s.name,
        customerId: customer?.id || 'unknown',
        customerName: customer?.name || 'Unknown Retailer',
        checkIn: new Date(Date.now() - j * 24 * 60 * 60 * 1000).toISOString(),
        checkOut: new Date(Date.now() - j * 24 * 60 * 60 * 1000 + 30 * 60000).toISOString(),
        status: ['Visited', 'Order Taken', 'Follow Up'][Math.floor(Math.random() * 3)] as any,
        notes: 'Discussion regarding new premium engine oil line.',
        location: {
          lat: s.currentLocation!.lat + (Math.random() - 0.5) * 0.1,
          lng: s.currentLocation!.lng + (Math.random() - 0.5) * 0.1
        },
        tenantId
      };
      batch.set(visitRef, visit);
    }
  }

  await batch.commit();
};
