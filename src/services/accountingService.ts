import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  runTransaction,
  doc,
  increment,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { Account, JournalEntry, JournalLine } from '../types/erp';

const ACCOUNTS_COLLECTION = 'accounts';
const JOURNALS_COLLECTION = 'journal_entries';

export const accountingService = {
  // Chart of Accounts
  subscribeToAccounts(tenantId: string, callback: (accounts: Account[]) => void) {
    const q = query(collection(db, ACCOUNTS_COLLECTION), where('tenantId', '==', tenantId));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account)));
    });
  },

  // Journal Entries
  subscribeToJournals(tenantId: string, callback: (journals: JournalEntry[]) => void) {
    const q = query(
      collection(db, JOURNALS_COLLECTION), 
      where('tenantId', '==', tenantId),
      orderBy('date', 'desc'),
      limit(500)
    );
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JournalEntry)));
    });
  },

  async postJournalEntry(entry: Omit<JournalEntry, 'id' | 'createdAt'>) {
    return await runTransaction(db, async (transaction) => {
      const journalRef = doc(collection(db, JOURNALS_COLLECTION));
      
      // Update specific account balances
      for (const line of entry.lines) {
        const accountRef = doc(db, ACCOUNTS_COLLECTION, line.accountId);
        // Double entry logic: Debit increases Assets/Expenses, Credit increases Liabilities/Income/Equity
        // For simplicity: balance = debits - credits
        const amount = line.debit - line.credit;
        transaction.update(accountRef, {
          balance: increment(amount)
        });
      }

      transaction.set(journalRef, {
        ...entry,
        id: journalRef.id,
        createdAt: new Date().toISOString()
      });
    });
  },

  // Auto-posting Helpers
  async postSalesInvoiceEntry(invoice: any, tenantId: string) {
    // 1. Find relevant accounts
    const accountsSnap = await getDocs(query(collection(db, ACCOUNTS_COLLECTION), where('tenantId', '==', tenantId)));
    const accounts = accountsSnap.docs.map(d => ({id: d.id, ...d.data()} as Account));
    
    const salesAcc = accounts.find(a => a.name === 'Sales Revenue');
    const receivablesAcc = accounts.find(a => a.name === 'Accounts Receivable');
    const gstOutputAcc = accounts.find(a => a.name === 'GST Output CGST') || accounts.find(a => a.name === 'GST Output');

    if (!salesAcc || !receivablesAcc) return;

    const lines: JournalLine[] = [
      { accountId: receivablesAcc.id, accountName: receivablesAcc.name, debit: invoice.totalAmount, credit: 0 },
      { accountId: salesAcc.id, accountName: salesAcc.name, debit: 0, credit: invoice.totalAmount - (invoice.taxAmount || 0) }
    ];

    if (gstOutputAcc && invoice.taxAmount) {
      lines.push({ accountId: gstOutputAcc.id, accountName: gstOutputAcc.name, debit: 0, credit: invoice.taxAmount });
    }

    await this.postJournalEntry({
      date: new Date().toISOString(),
      voucherType: 'Sales',
      voucherNumber: invoice.invoiceNumber,
      narration: `Automated entry for Invoice ${invoice.invoiceNumber} (Client: ${invoice.customerName})`,
      lines,
      refId: invoice.id,
      tenantId
    });
  },

  async postPaymentEntry(payment: any, invoice: any, tenantId: string) {
    const accountsSnap = await getDocs(query(collection(db, ACCOUNTS_COLLECTION), where('tenantId', '==', tenantId)));
    const accounts = accountsSnap.docs.map(d => ({id: d.id, ...d.data()} as Account));

    const bankAcc = accounts.find(a => a.name === 'Bank Account') || accounts.find(a => a.name === 'HDFC Bank');
    const cashAcc = accounts.find(a => a.name === 'Cash in Hand');
    const receivablesAcc = accounts.find(a => a.name === 'Accounts Receivable');

    const paymentAcc = payment.paymentMode === 'Cash' ? cashAcc : bankAcc;

    if (!paymentAcc || !receivablesAcc) return;

    await this.postJournalEntry({
      date: new Date().toISOString(),
      voucherType: 'Receipt',
      voucherNumber: `RCPT-${Date.now().toString().slice(-6)}`,
      narration: `Payment received for Invoice ${invoice.invoiceNumber}`,
      lines: [
        { accountId: paymentAcc.id, accountName: paymentAcc.name, debit: payment.amount, credit: 0 },
        { accountId: receivablesAcc.id, accountName: receivablesAcc.name, debit: 0, credit: payment.amount }
      ],
      refId: payment.id || invoice.id,
      tenantId
    });
  },

  // Report Generators
  getTrialBalance(accounts: Account[]) {
    return accounts.map(a => ({
      name: a.name,
      code: a.code,
      debit: a.balance > 0 ? a.balance : 0,
      credit: a.balance < 0 ? Math.abs(a.balance) : 0
    }));
  },

  getProfitLoss(accounts: Account[]) {
    const income = accounts.filter(a => a.group === 'Income');
    const expenses = accounts.filter(a => a.group === 'Expenses');
    
    const totalIncome = income.reduce((acc, a) => acc + Math.abs(a.balance), 0);
    const totalExpenses = expenses.reduce((acc, a) => acc + Math.abs(a.balance), 0);
    
    return {
      income,
      expenses,
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses
    };
  }
};
