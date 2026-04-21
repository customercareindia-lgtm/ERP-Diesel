import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  onSnapshot,
  serverTimestamp,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from '../firebase';
import { Product, Inventory, Batch } from '../types/erp';

const PRODUCTS_COLLECTION = 'products';
const INVENTORY_COLLECTION = 'inventory';
const BATCHES_COLLECTION = 'batches';

export const inventoryService = {
  // Products
  async addProduct(product: Omit<Product, 'id' | 'createdAt'>) {
    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
      ...product,
      createdAt: new Date().toISOString()
    });
    
    // Initialize empty inventory for this product
    await addDoc(collection(db, INVENTORY_COLLECTION), {
      productId: docRef.id,
      totalStock: 0,
      reservedStock: 0,
      tenantId: product.tenantId,
      status: 'Out of Stock',
      lastUpdated: new Date().toISOString()
    });

    return docRef.id;
  },

  async updateProduct(id: string, product: Partial<Product>) {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await updateDoc(docRef, product);
  },

  async deleteProduct(id: string) {
    await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
    // Also clean up inventory and batches in real world
  },

  // Stock Management Logic
  async updateStock(productId: string, quantityChange: number, tenantId: string) {
    const q = query(
      collection(db, INVENTORY_COLLECTION), 
      where('productId', '==', productId),
      where('tenantId', '==', tenantId)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const invDoc = snapshot.docs[0];
      const newTotal = (invDoc.data().totalStock || 0) + quantityChange;
      
      // Prevent negative stock
      if (newTotal < 0) throw new Error('Insufficient stock levels');
      
      // Fetch product to determine status based on minStockLevel
      const prodDoc = await getDocs(query(collection(db, PRODUCTS_COLLECTION), where('__name__', '==', productId)));
      const minStock = prodDoc.docs[0]?.data()?.minStockLevel || 0;
      
      let status: Inventory['status'] = 'In Stock';
      if (newTotal === 0) status = 'Out of Stock';
      else if (newTotal <= minStock) status = 'Low Stock';

      await updateDoc(invDoc.ref, {
        totalStock: increment(quantityChange),
        lastUpdated: new Date().toISOString(),
        status
      });

      // Log Activity (Optional feature)
      await addDoc(collection(db, 'activity_logs'), {
        action: 'STOCK_UPDATE',
        productId,
        quantityChange,
        tenantId,
        timestamp: serverTimestamp()
      });
    }
  },

  // Real-time Listeners
  subscribeToProducts(tenantId: string, callback: (products: Product[]) => void) {
    const q = query(collection(db, PRODUCTS_COLLECTION), where('tenantId', '==', tenantId));
    return onSnapshot(q, (snapshot) => {
      const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      callback(products);
    });
  },

  subscribeToInventory(tenantId: string, callback: (inv: Inventory[]) => void) {
    const q = query(collection(db, INVENTORY_COLLECTION), where('tenantId', '==', tenantId));
    return onSnapshot(q, (snapshot) => {
      const inventories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Inventory));
      callback(inventories);
    });
  }
};
