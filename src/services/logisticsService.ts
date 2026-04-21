import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  increment,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Transporter, 
  Vehicle, 
  Warehouse, 
  DispatchOrder, 
  SalesOrder,
  Inventory
} from '../types/erp';

export const logisticsService = {
  // Transporters
  async getTransporters(tenantId: string): Promise<Transporter[]> {
    const q = query(collection(db, 'transporters'), where('tenantId', '==', tenantId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Transporter);
  },

  async addTransporter(data: Omit<Transporter, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'transporters'), data);
    return docRef.id;
  },

  // Vehicles
  async getVehicles(tenantId: string): Promise<Vehicle[]> {
    const q = query(collection(db, 'vehicles'), where('tenantId', '==', tenantId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Vehicle);
  },

  async addVehicle(data: Omit<Vehicle, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'vehicles'), data);
    return docRef.id;
  },

  // Warehouses
  async getWarehouses(tenantId: string): Promise<Warehouse[]> {
    const q = query(collection(db, 'warehouses'), where('tenantId', '==', tenantId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Warehouse);
  },

  async addWarehouse(data: Omit<Warehouse, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'warehouses'), data);
    return docRef.id;
  },

  // Dispatch Orders
  async getDispatchOrders(tenantId: string): Promise<DispatchOrder[]> {
    const q = query(
      collection(db, 'dispatch_orders'), 
      where('tenantId', '==', tenantId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }) as DispatchOrder)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async createDispatchOrder(data: Omit<DispatchOrder, 'id' | 'dispatchId' | 'createdAt'>): Promise<string> {
    const batch = writeBatch(db);
    
    // 1. Create Dispatch Order
    const dispatchRef = doc(collection(db, 'dispatch_orders'));
    const dispatchId = `DO-${Math.floor(Math.random() * 900000) + 100000}`;
    const newDispatch: Omit<DispatchOrder, 'id'> = {
      ...data,
      dispatchId,
      createdAt: new Date().toISOString()
    };
    batch.set(dispatchRef, newDispatch);

    // 2. Update Sales Order Status to 'shipped' (or similar based on flow)
    const salesOrderRef = doc(db, 'sales_orders', data.orderId);
    batch.update(salesOrderRef, { status: 'shipped' });

    // 3. Deduct Stock from Inventory (Inventory reduction on dispatch)
    for (const item of data.items) {
      // Find inventory for this product
      const invQuery = query(
        collection(db, 'inventory'), 
        where('productId', '==', item.productId),
        where('tenantId', '==', data.tenantId),
        limit(1)
      );
      const invSnapshot = await getDocs(invQuery);
      if (!invSnapshot.empty) {
        const invDoc = invSnapshot.docs[0];
        const invData = invDoc.data() as Inventory;
        
        // If stock is unavailable, this should ideally be checked before calling service
        // But we reduce totalStock and reservedStock
        batch.update(invDoc.ref, {
          totalStock: increment(-item.quantity),
          reservedStock: increment(-item.quantity),
          lastUpdated: new Date().toISOString()
        });
      }
    }

    // 4. Update Vehicle status to 'On Trip'
    const vehicleRef = doc(db, 'vehicles', data.vehicleId);
    batch.update(vehicleRef, { status: 'On Trip' });

    await batch.commit();
    return dispatchRef.id;
  },

  async updateDispatchStatus(
    dispatchId: string, 
    status: DispatchOrder['status'], 
    location?: string,
    eta?: string
  ): Promise<void> {
    const dispatchRef = doc(db, 'dispatch_orders', dispatchId);
    const updateData: any = { status };
    
    if (location) updateData.lastLocation = location;
    if (eta) updateData.eta = eta;
    
    // If status is delivered, we might want to update the sales order too
    if (status === 'delivered') {
      const snapshot = await getDocs(query(collection(db, 'dispatch_orders'), where('__name__', '==', dispatchId)));
      if (!snapshot.empty) {
        const dispatch = snapshot.docs[0].data() as DispatchOrder;
        const salesOrderRef = doc(db, 'sales_orders', dispatch.orderId);
        await updateDoc(salesOrderRef, { status: 'delivered' });
        
        // Return vehicle to 'Available'
        const vehicleRef = doc(db, 'vehicles', dispatch.vehicleId);
        await updateDoc(vehicleRef, { status: 'Available' });
      }
    }

    await updateDoc(dispatchRef, updateData);
  }
};
