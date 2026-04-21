import { collection, addDoc, getDocs, query, where, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { Account, JournalEntry, Vendor, PurchaseOrder, SalesOrder } from '../types/erp';

const ACCOUNTS_COLLECTION = 'accounts';
const JOURNALS_COLLECTION = 'journal_entries';
const VENDOR_COLLECTION = 'vendors';
const PURCHASE_COLLECTION = 'purchase_orders';

export const seedAccountingData = async (tenantId: string) => {
  console.log('Seeding Accounting Data...');

  // 1. Chart of Accounts
  const coa: Omit<Account, 'id'>[] = [
    // Assets
    { code: '1000', name: 'Cash in Hand', group: 'Assets', balance: 50000, tenantId },
    { code: '1001', name: 'HDFC Bank', group: 'Assets', balance: 1250000, tenantId },
    { code: '1002', name: 'Accounts Receivable', group: 'Assets', balance: 0, tenantId },
    { code: '1003', name: 'Inventory Asset', group: 'Assets', balance: 0, tenantId },
    // Liabilities
    { code: '2000', name: 'Accounts Payable', group: 'Liabilities', balance: 0, tenantId },
    { code: '2001', name: 'GST Output CGST', group: 'Liabilities', balance: 0, tenantId },
    { code: '2002', name: 'GST Output SGST', group: 'Liabilities', balance: 0, tenantId },
    { code: '2003', name: 'GST Input CGST', group: 'Liabilities', balance: 0, tenantId },
    { code: '2004', name: 'GST Input SGST', group: 'Liabilities', balance: 0, tenantId },
    // Income
    { code: '3000', name: 'Sales Revenue', group: 'Income', balance: 0, tenantId },
    { code: '3001', name: 'Service Income', group: 'Income', balance: 0, tenantId },
    // Expenses
    { code: '4000', name: 'Cost of Goods Sold', group: 'Expenses', balance: 0, tenantId },
    { code: '4001', name: 'Purchase Expenses', group: 'Expenses', balance: 0, tenantId },
    { code: '4002', name: 'Manufacturing Overhead', group: 'Expenses', balance: 0, tenantId },
    { code: '4003', name: 'Facility Rent', group: 'Expenses', balance: 0, tenantId },
    { code: '4004', name: 'Electricity Charges', group: 'Expenses', balance: 0, tenantId },
  ];

  const accountMap: Record<string, string> = {};
  for (const acc of coa) {
    const docRef = await addDoc(collection(db, ACCOUNTS_COLLECTION), acc);
    accountMap[acc.name] = docRef.id;
  }

  // 2. Vendors
  const vendors = [
    { name: 'Bharat Petroleum', type: 'Raw Material', gstin: '27BPCL001Z5', city: 'Mumbai' },
    { name: 'Reliance Petrochemicals', type: 'Raw Material', gstin: '27RIL001Z5', city: 'Surat' },
    { name: 'Additive Tech Ltd', type: 'Packaging', gstin: '27ATL001Z5', city: 'Pune' }
  ];

  const vendorIds: string[] = [];
  for (const v of vendors) {
    const docRef = await addDoc(collection(db, VENDOR_COLLECTION), {
      ...v,
      tenantId,
      phone: '+91 9999999999',
      email: v.name.toLowerCase().replace(/\s/g, '') + '@supply.com',
      outstandingBalance: 0
    });
    vendorIds.push(docRef.id);
  }

  // 3. Historical Journals
  const journals: Omit<JournalEntry, 'id' | 'createdAt'>[] = [
    {
      date: '2026-04-01T10:00:00Z',
      voucherType: 'Journal',
      voucherNumber: 'JV/001',
      narration: 'Opening balance capital introduction',
      tenantId,
      lines: [
        { accountId: accountMap['HDFC Bank'], accountName: 'HDFC Bank', debit: 1000000, credit: 0 },
        { accountId: accountMap['Cash in Hand'], accountName: 'Cash in Hand', debit: 50000, credit: 0 },
      ]
    },
    {
      date: '2026-04-05T14:00:00Z',
      voucherType: 'Payment',
      voucherNumber: 'PAY/001',
      narration: 'April Office Rent Payment',
      tenantId,
      lines: [
        { accountId: accountMap['Facility Rent'], accountName: 'Facility Rent', debit: 45000, credit: 0 },
        { accountId: accountMap['HDFC Bank'], accountName: 'HDFC Bank', debit: 0, credit: 45000 },
      ]
    }
  ];

  for (const j of journals) {
    await addDoc(collection(db, JOURNALS_COLLECTION), {
      ...j,
      createdAt: new Date().toISOString()
    });
  }

  // 4. Generate some Sales Vouchers from existing orders if needed, 
  // but better to just seed a few specifically for accounting
  for (let i = 1; i <= 10; i++) {
     const amt = Math.floor(Math.random() * 50000) + 10000;
     const tax = amt * 0.18;
     await addDoc(collection(db, JOURNALS_COLLECTION), {
       date: new Date(Date.now() - Math.random() * 15 * 86400000).toISOString(),
       voucherType: 'Sales',
       voucherNumber: `SLS/26/0${i}`,
       narration: `Sales Voucher for order #SO-${i}055`,
       tenantId,
       lines: [
         { accountId: accountMap['Accounts Receivable'], accountName: 'Accounts Receivable', debit: amt + tax, credit: 0 },
         { accountId: accountMap['Sales Revenue'], accountName: 'Sales Revenue', debit: 0, credit: amt },
         { accountId: accountMap['GST Output CGST'], accountName: 'GST Output CGST', debit: 0, credit: tax/2 },
         { accountId: accountMap['GST Output SGST'], accountName: 'GST Output SGST', debit: 0, credit: tax/2 }
       ],
       createdAt: new Date().toISOString()
     });
  }

  console.log('Accounting Seed Completed.');
};
