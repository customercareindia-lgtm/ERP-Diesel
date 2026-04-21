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
  writeBatch,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Salesman, 
  Visit, 
  Attendance, 
  SalesTarget, 
  SalesExpense,
  SalesOrder
} from '../types/erp';

export const salesmanService = {
  // Salesman Master
  async getSalesmen(tenantId: string): Promise<Salesman[]> {
    const q = query(collection(db, 'salesmen'), where('tenantId', '==', tenantId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Salesman);
  },

  subscribeToSalesmen(tenantId: string, callback: (salesmen: Salesman[]) => void) {
    const q = query(collection(db, 'salesmen'), where('tenantId', '==', tenantId));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Salesman));
    });
  },

  async updateSalesmanLocation(salesmanId: string, lat: number, lng: number): Promise<void> {
    const salesmanRef = doc(db, 'salesmen', salesmanId);
    await updateDoc(salesmanRef, {
      currentLocation: {
        lat,
        lng,
        lastUpdated: new Date().toISOString()
      }
    });
  },

  // Visits
  async logVisit(data: Omit<Visit, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'visits'), data);
    return docRef.id;
  },

  async getVisits(tenantId: string, salesmanId?: string): Promise<Visit[]> {
    let q = query(collection(db, 'visits'), where('tenantId', '==', tenantId), orderBy('checkIn', 'desc'));
    if (salesmanId) {
      q = query(collection(db, 'visits'), where('tenantId', '==', tenantId), where('salesmanId', '==', salesmanId), orderBy('checkIn', 'desc'));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Visit);
  },

  // Attendance
  async markAttendance(data: Omit<Attendance, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'attendance'), data);
    return docRef.id;
  },

  async getAttendance(tenantId: string, date: string): Promise<Attendance[]> {
    const q = query(
      collection(db, 'attendance'), 
      where('tenantId', '==', tenantId), 
      where('date', '==', date)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Attendance);
  },

  // Targets & Performance
  async getTargets(tenantId: string, month: string): Promise<SalesTarget[]> {
    const q = query(
      collection(db, 'sales_targets'), 
      where('tenantId', '==', tenantId), 
      where('month', '==', month)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as SalesTarget);
  },

  // Expenses
  async submitExpense(data: Omit<SalesExpense, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'sales_expenses'), data);
    return docRef.id;
  },

  async getExpenses(tenantId: string, status?: string): Promise<SalesExpense[]> {
    let q = query(collection(db, 'sales_expenses'), where('tenantId', '==', tenantId), orderBy('date', 'desc'));
    if (status) {
      q = query(collection(db, 'sales_expenses'), where('tenantId', '==', tenantId), where('status', '==', status), orderBy('date', 'desc'));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as SalesExpense);
  }
};
