import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot,
  runTransaction,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  ProductionOrder, 
  RawMaterial, 
  BOM, 
  Batch, 
  QCResult,
  Product,
  Inventory
} from '../types/erp';

const RM_COLLECTION = 'raw_materials';
const BOM_COLLECTION = 'boms';
const PO_COLLECTION = 'production_orders';
const BATCH_COLLECTION = 'batches';
const INV_COLLECTION = 'inventory';
const PROD_COLLECTION = 'products';

export const manufacturingService = {
  // Raw Materials
  subscribeToRawMaterials(tenantId: string, callback: (rms: RawMaterial[]) => void) {
    const q = query(collection(db, RM_COLLECTION), where('tenantId', '==', tenantId));
    return onSnapshot(q, (snapshot) => {
      const rms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RawMaterial));
      callback(rms);
    });
  },

  // BOM
  async getBOMByProduct(productId: string, tenantId: string): Promise<BOM | null> {
    const q = query(collection(db, BOM_COLLECTION), where('productId', '==', productId), where('tenantId', '==', tenantId));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as BOM;
  },

  // Production Orders
  async createProductionOrder(
    productId: string, 
    productName: string,
    quantity: number, 
    tenantId: string
  ) {
    return await runTransaction(db, async (transaction) => {
      // 1. Get BOM
      const bomQuery = query(collection(db, BOM_COLLECTION), where('productId', '==', productId), where('tenantId', '==', tenantId));
      const bomSnap = await getDocs(bomQuery);
      if (bomSnap.empty) throw new Error('BOM not found for this product');
      const bom = bomSnap.docs[0].data() as BOM;

      // 2. Check and deduct Raw Materials
      for (const item of bom.items) {
        const requiredQty = item.quantity * (quantity / 1000); // Assuming BOM is per 1000L
        const rmRef = doc(db, RM_COLLECTION, item.materialId);
        const rmSnap = await transaction.get(rmRef);
        
        if (!rmSnap.exists()) throw new Error(`Raw material ${item.materialName} not found`);
        const currentQty = rmSnap.data().stockQuantity;
        if (currentQty < requiredQty) throw new Error(`Insufficient stock for ${item.materialName}`);
        
        transaction.update(rmRef, {
          stockQuantity: increment(-requiredQty)
        });
      }

      // 3. Create Batch
      const batchNumber = `LUB-${Date.now().toString().slice(-6)}`;
      const batchRef = await addDoc(collection(db, BATCH_COLLECTION), {
        productId,
        batchNumber,
        mfgDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 2).toISOString(), // 2 years
        quantity,
        status: 'planned',
        tenantId
      });

      // 4. Create Production Order
      const poRef = await addDoc(collection(db, PO_COLLECTION), {
        batchId: batchRef.id,
        productId,
        productName,
        requestedQuantity: quantity,
        status: 'planned',
        startDate: new Date().toISOString(),
        tenantId
      });

      // 5. Log activity
      await addDoc(collection(db, 'activity_logs'), {
        action: 'PRODUCTION_START',
        poId: poRef.id,
        batchNumber,
        tenantId,
        timestamp: serverTimestamp()
      });

      return poRef.id;
    });
  },

  async updatePOStatus(poId: string, batchId: string, status: ProductionOrder['status']) {
    const poRef = doc(db, PO_COLLECTION, poId);
    const batchRef = doc(db, BATCH_COLLECTION, batchId);
    
    await updateDoc(poRef, { status });
    await updateDoc(batchRef, { status });
  },

  async submitQCResults(poId: string, batchId: string, results: QCResult, passed: boolean) {
    const poRef = doc(db, PO_COLLECTION, poId);
    const batchRef = doc(db, BATCH_COLLECTION, batchId);
    
    const status = passed ? 'qc_passed' : 'qc_failed';
    
    await updateDoc(poRef, { status });
    await updateDoc(batchRef, { 
      status,
      qcResults: results
    });

    if (passed) {
      // If passed, move to completed stage in PO
      await updateDoc(poRef, { status: 'completed', completionDate: new Date().toISOString() });
      
      // Add to Finished Goods Inventory
      const batchSnap = await getDoc(batchRef);
      const batchData = batchSnap.data() as Batch;
      
      const invQuery = query(collection(db, INV_COLLECTION), where('productId', '==', batchData.productId), where('tenantId', '==', batchData.tenantId));
      const invSnap = await getDocs(invQuery);
      
      if (!invSnap.empty) {
        await updateDoc(invSnap.docs[0].ref, {
          totalStock: increment(batchData.quantity),
          lastUpdated: new Date().toISOString(),
          status: 'In Stock'
        });
      }
    }
  },

  subscribeToProductionOrders(tenantId: string, callback: (orders: ProductionOrder[]) => void) {
    const q = query(collection(db, PO_COLLECTION), where('tenantId', '==', tenantId));
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductionOrder));
      callback(orders);
    });
  },

  subscribeToBatches(tenantId: string, callback: (batches: Batch[]) => void) {
    const q = query(collection(db, BATCH_COLLECTION), where('tenantId', '==', tenantId));
    return onSnapshot(q, (snapshot) => {
      const batches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Batch));
      callback(batches);
    });
  }
};
