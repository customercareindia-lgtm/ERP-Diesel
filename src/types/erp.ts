export type UserRole = 'super_admin' | 'admin' | 'accountant' | 'warehouse_manager' | 'salesman' | 'customer';

export interface ERPUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
  active: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  gstin: string;
  pan?: string;
  address?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: 'Engine Oil' | 'Gear Oil' | 'Grease' | 'Coolant' | 'Hydraulic Oil' | 'Brake Fluid' | 'Industrial';
  hsnCode: string;
  viscosity: string;
  packSize: '1L' | '5L' | '20L' | '210L';
  purchasePrice: number;
  sellingPrice: number;
  minStockLevel: number;
  supplierName?: string;
  image?: string;
  tenantId: string;
  createdAt: string;
}

export interface Inventory {
  id: string;
  productId: string;
  totalStock: number;
  reservedStock: number;
  lastUpdated: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  tenantId: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  gstin: string;
  tenantId: string;
  type: 'Distributor' | 'Retailer' | 'Bulk Buyer';
  outstandingBalance: number;
}

export interface Vendor {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  gstin: string;
  tenantId: string;
  type: 'Raw Material' | 'Packaging' | 'Logistics' | 'Other';
  outstandingBalance: number;
}

export interface Account {
  id: string;
  code: string;
  name: string;
  group: 'Assets' | 'Liabilities' | 'Equity' | 'Income' | 'Expenses';
  subGroup?: string;
  balance: number;
  tenantId: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  voucherType: 'Sales' | 'Purchase' | 'Receipt' | 'Payment' | 'Journal' | 'Contra';
  voucherNumber: string;
  narration: string;
  lines: JournalLine[];
  refId?: string; // Linked ID (OrderId, InvoiceId, etc)
  tenantId: string;
  createdAt: string;
}

export interface JournalLine {
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface Batch {
  id: string;
  productId: string;
  batchNumber: string;
  mfgDate: string;
  expiryDate: string;
  quantity: number;
  status: 'planned' | 'blending' | 'qc_pending' | 'qc_passed' | 'qc_failed' | 'completed' | 'released' | 'recalled';
  qcResults?: QCResult;
  tenantId: string;
}

export interface RawMaterial {
  id: string;
  code: string;
  name: string;
  category: 'Base Oil' | 'Additive' | 'Package' | 'Other';
  supplier: string;
  stockQuantity: number;
  unit: 'Liters' | 'KG' | 'Units';
  costPerUnit: number;
  minStockLevel: number;
  tenantId: string;
}

export interface BOMItem {
  materialId: string;
  materialName: string;
  quantity: number; // Consumption per unit or per full batch? Usually per 1000L or similar. 
}

export interface BOM {
  id: string;
  productId: string;
  productName: string;
  items: BOMItem[];
  tenantId: string;
  version: string;
}

export interface ProductionOrder {
  id: string;
  batchId: string;
  productId: string;
  productName: string;
  requestedQuantity: number;
  status: 'planned' | 'blending' | 'qc_pending' | 'qc_passed' | 'qc_failed' | 'completed';
  startDate: string;
  completionDate?: string;
  tenantId: string;
}

export interface QCResult {
  viscosity?: number;
  density?: number;
  flashPoint?: number;
  appearance?: string;
  testedBy: string;
  testDate: string;
  remarks?: string;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  subtotal: number;
  taxAmount: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  discountAmount: number;
  totalAmount: number;
  status: 'draft' | 'confirmed' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  createdAt: string;
  items: OrderItem[];
  tenantId: string;
  salesmanId?: string;
  salesmanName?: string;
}

export interface Salesman {
  id: string;
  employeeId: string;
  name: string;
  phone: string;
  email: string;
  territory: string;
  role: 'Sales Executive' | 'Area Manager' | 'Zonal Manager';
  active: boolean;
  assignedCustomers: string[];
  currentLocation?: {
    lat: number;
    lng: number;
    lastUpdated: string;
  };
  tenantId: string;
  createdAt: string;
}

export interface Visit {
  id: string;
  salesmanId: string;
  salesmanName: string;
  customerId: string;
  customerName: string;
  checkIn: string;
  checkOut?: string;
  status: 'Visited' | 'Not Available' | 'Order Taken' | 'Follow Up';
  notes?: string;
  location: {
    lat: number;
    lng: number;
  };
  orderId?: string;
  tenantId: string;
}

export interface Attendance {
  id: string;
  salesmanId: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  locationIn: { lat: number, lng: number };
  locationOut?: { lat: number, lng: number };
  tenantId: string;
}

export interface SalesTarget {
  id: string;
  salesmanId: string;
  month: string;
  targetAmount: number;
  achievedAmount: number;
  visitTarget: number;
  achievedVisits: number;
  tenantId: string;
}

export interface SalesExpense {
  id: string;
  salesmanId: string;
  date: string;
  type: 'Fuel' | 'Food' | 'Stay' | 'Other';
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  description: string;
  attachmentUrl?: string;
  tenantId: string;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  vendorId: string;
  vendorName: string;
  totalAmount: number;
  status: 'pending' | 'received' | 'cancelled';
  createdAt: string;
  items: OrderItem[];
  tenantId: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  customerId: string;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  status: 'unpaid' | 'partial' | 'paid' | 'overdue';
  dueDate: string;
  createdAt: string;
  tenantId: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentMode: 'Cash' | 'Bank' | 'UPI';
  referenceNumber?: string;
  date: string;
  tenantId: string;
}

export interface OrderItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  price: number;
  hsnCode?: string;
  weight?: number; // Total weight in KG/L
}

export interface Transporter {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstin: string;
  tenantId: string;
}

export interface Vehicle {
  id: string;
  vehicleNumber: string;
  type: 'Tanker' | 'Truck' | 'Mini Truck' | 'Van';
  capacity: number; // in Liters or Kg
  driverName: string;
  driverPhone: string;
  status: 'Available' | 'On Trip' | 'Maintenance';
  tenantId: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  capacity: number;
  contactPhone: string;
  tenantId: string;
}

export interface DispatchOrder {
  id: string;
  dispatchId: string; // Internal sequential ID
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  deliveryAddress: string;
  items: OrderItem[];
  warehouseId: string;
  warehouseName: string;
  transporterId: string;
  transporterName: string;
  vehicleId: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  shipmentType: 'Bulk' | 'Packed';
  status: 'planned' | 'dispatched' | 'in_transit' | 'delivered' | 'delayed' | 'completed' | 'closed';
  trackingId: string;
  eta: string;
  lastLocation?: string;
  freightCharges: number;
  handlingCharges: number;
  loadingDate: string;
  deliveryDate?: string;
  ewayBillNumber?: string;
  tenantId: string;
  createdAt: string;
}
