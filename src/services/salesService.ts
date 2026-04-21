import { 
  collection, 
  addDoc, 
  serverTimestamp,
  runTransaction,
  doc,
  query,
  where,
  getDocs,
  onSnapshot,
  updateDoc,
  increment,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { SalesOrder, Inventory, Customer, Invoice, Payment } from '../types/erp';
import { accountingService } from './accountingService';

const SALES_COLLECTION = 'sales_orders';
const INV_COLLECTION = 'inventory';
const CUST_COLLECTION = 'customers';
const INVOICE_COLLECTION = 'invoices';
const PAYMENT_COLLECTION = 'payments';

export const salesService = {
  // Customers
  subscribeToCustomers(tenantId: string, callback: (customers: Customer[]) => void) {
    const q = query(collection(db, CUST_COLLECTION), where('tenantId', '==', tenantId));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
    });
  },

  // Sales Orders
  async createSalesOrder(order: Omit<SalesOrder, 'id' | 'createdAt'>) {
    // Orders start as 'draft' or 'confirmed'
    // If 'confirmed', we reserve stock
    return await runTransaction(db, async (transaction) => {
      // 1. Create Order
      const orderRef = doc(collection(db, SALES_COLLECTION));
      const orderData = {
        ...order,
        id: orderRef.id,
        createdAt: new Date().toISOString()
      };
      transaction.set(orderRef, orderData);

      // 2. If already confirmed, reserve stock
      if (order.status === 'confirmed') {
        for (const item of order.items) {
          const invQuery = query(collection(db, INV_COLLECTION), 
            where('productId', '==', item.productId), 
            where('tenantId', '==', order.tenantId)
          );
          const invSnap = await getDocs(invQuery);
          if (!invSnap.empty) {
            const invDoc = invSnap.docs[0];
            const invData = invDoc.data() as Inventory;
            if (invData.totalStock - invData.reservedStock < item.quantity) {
              throw new Error(`Insufficient available stock for ${item.name}`);
            }
            transaction.update(invDoc.ref, {
              reservedStock: increment(item.quantity)
            });
          }
        }
      }

      return orderRef.id;
    });
  },

  async updateOrderStatus(orderId: string, newStatus: SalesOrder['status']) {
    return await runTransaction(db, async (transaction) => {
      const orderRef = doc(db, SALES_COLLECTION, orderId);
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists()) throw new Error('Order not found');
      
      const order = orderSnap.data() as SalesOrder;
      const oldStatus = order.status;

      if (oldStatus === newStatus) return;

      // WORKFLOW LOGIC:
      // draft -> confirmed: Reserve stock
      if (oldStatus === 'draft' && newStatus === 'confirmed') {
        for (const item of order.items) {
          const invQuery = query(collection(db, INV_COLLECTION), where('productId', '==', item.productId), where('tenantId', '==', order.tenantId));
          const invSnap = await getDocs(invQuery);
          if (!invSnap.empty) {
            transaction.update(invSnap.docs[0].ref, { reservedStock: increment(item.quantity) });
          }
        }
      }

      // confirmed/processing -> shipped: Deduct from total and reserved
      if ((oldStatus === 'confirmed' || oldStatus === 'draft') && newStatus === 'shipped') {
        for (const item of order.items) {
          const invQuery = query(collection(db, INV_COLLECTION), where('productId', '==', item.productId), where('tenantId', '==', order.tenantId));
          const invSnap = await getDocs(invQuery);
          if (!invSnap.empty) {
            const updateObj: any = { totalStock: increment(-item.quantity) };
            if (oldStatus === 'confirmed') {
              updateObj.reservedStock = increment(-item.quantity);
            }
            transaction.update(invSnap.docs[0].ref, updateObj);
          }
        }
        // Also create an invoice automatically when shipped
        const invoiceRef = doc(collection(db, INVOICE_COLLECTION));
        const invoice: Invoice = {
          id: invoiceRef.id,
          invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
          orderId: order.id,
          customerId: order.customerId,
          customerName: order.customerName,
          totalAmount: order.totalAmount,
          paidAmount: 0,
          status: 'unpaid',
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days net
          createdAt: new Date().toISOString(),
          tenantId: order.tenantId
        };
        transaction.set(invoiceRef, invoice);
        
        // AUTO-ACCOUNTS: Post Invoice to Ledger
        accountingService.postSalesInvoiceEntry(invoice, order.tenantId);
      }

      // confirmed -> cancelled: Release reserved stock
      if (oldStatus === 'confirmed' && newStatus === 'cancelled') {
        for (const item of order.items) {
          const invQuery = query(collection(db, INV_COLLECTION), where('productId', '==', item.productId), where('tenantId', '==', order.tenantId));
          const invSnap = await getDocs(invQuery);
          if (!invSnap.empty) {
            transaction.update(invSnap.docs[0].ref, { reservedStock: increment(-item.quantity) });
          }
        }
      }

      // shipped -> cancelled: Restore total stock (if allowed by business logic)
      if (oldStatus === 'shipped' && newStatus === 'cancelled') {
        for (const item of order.items) {
          const invQuery = query(collection(db, INV_COLLECTION), where('productId', '==', item.productId), where('tenantId', '==', order.tenantId));
          const invSnap = await getDocs(invQuery);
          if (!invSnap.empty) {
            transaction.update(invSnap.docs[0].ref, { totalStock: increment(item.quantity) });
          }
        }
      }

      transaction.update(orderRef, { status: newStatus });
    });
  },

  // Payments
  async recordPayment(payment: Omit<Payment, 'id'>) {
    return await runTransaction(db, async (transaction) => {
      const invoiceRef = doc(db, INVOICE_COLLECTION, payment.invoiceId);
      const invoiceSnap = await transaction.get(invoiceRef);
      if (!invoiceSnap.exists()) throw new Error('Invoice not found');
      
      const invoice = invoiceSnap.data() as Invoice;
      const newPaidAmount = invoice.paidAmount + payment.amount;
      
      let status: Invoice['status'] = 'partial';
      if (newPaidAmount >= invoice.totalAmount) status = 'paid';
      
      transaction.update(invoiceRef, { 
        paidAmount: newPaidAmount,
        status: status
      });

      const paymentRef = doc(collection(db, PAYMENT_COLLECTION));
      transaction.set(paymentRef, { ...payment, id: paymentRef.id });

      // Update customer balance
      const customerRef = doc(db, CUST_COLLECTION, invoice.customerId);
      transaction.update(customerRef, {
        outstandingBalance: increment(-payment.amount)
      });

      // AUTO-ACCOUNTS: Post Receipt to Ledger
      accountingService.postPaymentEntry(payment, invoice, invoice.tenantId);
    });
  },

  subscribeToOrders(tenantId: string, callback: (orders: SalesOrder[]) => void) {
    const q = query(collection(db, SALES_COLLECTION), where('tenantId', '==', tenantId));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SalesOrder)));
    });
  },

  subscribeToInvoices(tenantId: string, callback: (invoices: Invoice[]) => void) {
    const q = query(collection(db, INVOICE_COLLECTION), where('tenantId', '==', tenantId));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice)));
    });
  }
};
