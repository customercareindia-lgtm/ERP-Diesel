import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { 
  Users, 
  MapPin, 
  ShoppingCart, 
  Wallet, 
  Search,
  CheckCircle2,
  Calendar,
  LogOut,
  Navigation,
  Clock,
  ArrowRight,
  Plus,
  Box,
  ChevronRight,
  User,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { auth, db } from '../../firebase';
import { useAuth } from '../../AuthContext';
import { salesmanService } from '../../services/salesmanService';
import { salesService } from '../../services/salesService';
import { inventoryService } from '../../services/inventoryService';
import { 
  Customer, 
  Product, 
  OrderItem, 
  Visit, 
  Attendance, 
  ERPUser,
  Salesman,
  SalesOrder
} from '../../types/erp';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

// --- Components ---

const VisitLog: React.FC<{ 
  customers: Customer[], 
  salesman: Salesman | null, 
  onLogVisit: (data: any) => void 
}> = ({ customers, salesman, onLogVisit }) => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const { erpUser } = useAuth();

  useEffect(() => {
    if (erpUser?.tenantId && salesman?.id) {
       salesmanService.getVisits(erpUser.tenantId, salesman.id).then(setVisits);
    }
  }, [erpUser?.tenantId, salesman?.id]);

  return (
    <div className="space-y-6">
        <header className="flex justify-between items-center">
            <div>
                <h2 className="text-xl font-black uppercase italic font-serif leading-none">Visits</h2>
                <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-widest">Beat: {salesman?.territory || 'Active Territory'}</span>
            </div>
            <button 
              onClick={() => onLogVisit(null)}
              className="bg-[#141414] text-[#E4E3E0] px-4 py-2 text-[10px] uppercase font-black tracking-widest rounded-full flex items-center gap-2"
            >
              <Navigation className="w-3 h-3" /> Area Check-in
            </button>
        </header>

        <div className="space-y-4">
            {visits.length === 0 ? (
              <div className="py-10 text-center text-[10px] font-mono text-zinc-400 uppercase">No visits recorded for this session</div>
            ) : visits.map((v, i) => (
                <div key={i} className="p-4 border border-[#141414] bg-white flex items-center gap-4 relative overflow-hidden group">
                     <div className={`w-1.5 h-full absolute left-0 top-0 ${v.status === 'Order Taken' ? 'bg-success' : 'bg-brand-accent'}`} />
                     <div className="flex-1 pl-2">
                        <h4 className="font-bold text-xs uppercase">{v.customerName}</h4>
                        <p className="font-mono text-[9px] text-zinc-500 uppercase">{v.status}</p>
                     </div>
                     <span className="font-mono text-[10px] text-zinc-400">{format(new Date(v.checkIn), 'HH:mm')}</span>
                </div>
            ))}
        </div>
    </div>
  );
};

const CustomerCatalog: React.FC<{ 
  customers: Customer[], 
  onCheckIn: (c: Customer) => void,
  onOrder: (c: Customer) => void
}> = ({ customers, onCheckIn, onOrder }) => {
  const [search, setSearch] = useState('');
  
  const filtered = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
        <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search Dealer Network..." 
              className="w-full bg-white border border-[#141414] pl-12 pr-4 py-4 text-xs font-mono uppercase focus:outline-none" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
        </div>
        
        <div className="grid grid-cols-1 gap-4">
            {filtered.map((c, i) => (
                <div key={i} className="p-6 border border-[#141414] bg-white relative overflow-hidden group shadow-sm hover:shadow-xl transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <h4 className="font-black text-lg uppercase tracking-tight italic font-serif">{c.name}</h4>
                        <div className={`text-[10px] font-mono px-2 py-0.5 border ${c.outstandingBalance > 50000 ? 'border-red-500 text-red-500' : 'border-green-500 text-green-500'}`}>
                          Bal: ₹{(c.outstandingBalance/1000).toFixed(0)}k
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 font-mono text-[10px] uppercase mb-4">
                        <div>
                            <span className="text-zinc-400 block mb-1">City</span>
                            <span className="font-bold">{c.city}</span>
                        </div>
                        <div>
                            <span className="text-zinc-400 block mb-1">Type</span>
                            <span className="font-bold">{c.type}</span>
                        </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                      <button 
                        onClick={() => onCheckIn(c)}
                        className="flex-1 py-3 bg-zinc-100 text-brand-text font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200"
                      >
                        Visit Log
                      </button>
                      <button 
                        onClick={() => onOrder(c)}
                        className="flex-1 py-3 bg-brand-sidebar text-white font-black text-[10px] uppercase tracking-widest hover:bg-black"
                      >
                        Order Form
                      </button>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

const OrderForm: React.FC<{ 
  customer: Customer, 
  products: Product[],
  onClose: () => void,
  onSubmit: (items: any[]) => void 
}> = ({ customer, products, onClose, onSubmit }) => {
  const [items, setItems] = useState<any[]>([]);

  const addItem = (p: Product) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === p.id);
      if (existing) {
        return prev.map(i => i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { productId: p.id, name: p.name, quantity: 1, price: p.sellingPrice, sku: p.sku }];
    });
  };

  const total = items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      className="fixed inset-0 z-50 bg-white flex flex-col pt-12 pb-24 px-6 overflow-hidden"
    >
      <header className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">New Order</h2>
          <p className="text-[10px] font-mono text-zinc-400 uppercase">Customer: {customer.name}</p>
        </div>
        <button onClick={onClose} className="p-2 bg-slate-100 rounded-full font-mono text-xs">CLOSE</button>
      </header>

      <div className="flex-1 overflow-y-auto space-y-6">
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest border-b border-zinc-100 pb-1">Products</h3>
          <div className="grid grid-cols-1 gap-2">
            {products.slice(0, 10).map(p => (
              <button 
                key={p.id}
                onClick={() => addItem(p)}
                className="p-3 border border-zinc-100 hover:border-brand-accent flex justify-between items-center text-xs text-left"
              >
                <div>
                  <div className="font-bold uppercase tracking-tight">{p.name}</div>
                  <div className="text-[9px] font-mono text-zinc-400">₹{p.sellingPrice} / {p.packSize}</div>
                </div>
                <Plus className="w-4 h-4 text-brand-accent" />
              </button>
            ))}
          </div>
        </div>

        {items.length > 0 && (
          <div className="space-y-3 pt-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest border-b border-zinc-100 pb-1">Cart Summary</h3>
            {items.map(item => (
              <div key={item.productId} className="flex justify-between items-center font-mono text-[10px] uppercase">
                <span>{item.quantity}x {item.name.substring(0, 20)}...</span>
                <span>₹{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <div className="pt-3 border-t border-zinc-100 flex justify-between items-center font-black text-sm uppercase">
              <span>Total Value</span>
              <span>₹{total.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-6 left-6 right-6">
        <button 
          disabled={items.length === 0}
          onClick={() => onSubmit(items)}
          className="w-full py-4 bg-brand-sidebar text-white font-black uppercase tracking-[0.2em] rounded shadow-2xl disabled:opacity-50"
        >
          Confirm Execution
        </button>
      </div>
    </motion.div>
  );
};

// --- Main Dashboard ---

export default function SalesmanDashboard() {
  const { erpUser } = useAuth();
  const [activeTab, setActiveTab] = useState('customers');
  const [salesman, setSalesman] = useState<Salesman | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load Salesman Profile & Data
  useEffect(() => {
    if (!erpUser?.tenantId) return;

    const loadData = async () => {
      // Find current salesman record by email matching ERP user
      const allSalesmen = await salesmanService.getSalesmen(erpUser.tenantId);
      const profile = allSalesmen.find(s => s.email === erpUser.email) || allSalesmen[0];
      setSalesman(profile);

      // Fetch customers and products
      salesService.subscribeToCustomers(erpUser.tenantId, setCustomers);
      inventoryService.subscribeToProducts(erpUser.tenantId, setProducts);
      
      setLoading(false);
    };

    loadData();
  }, [erpUser]);

  // Telemetry: Periodic Location Update
  useEffect(() => {
    if (!salesman?.id) return;

    // Simulate location updates if user is on the dashboard
    const interval = setInterval(() => {
      if (Math.random() > 0.5) return; // Only 50% chance to move each tick
      
      const lat = (salesman.currentLocation?.lat || 19) + (Math.random() - 0.5) * 0.001;
      const lng = (salesman.currentLocation?.lng || 72) + (Math.random() - 0.5) * 0.001;
      
      salesmanService.updateSalesmanLocation(salesman.id, lat, lng);
    }, 15000); // Every 15s

    return () => clearInterval(interval);
  }, [salesman?.id]);

  const handleVisit = async (customer: Customer | null) => {
    if (!salesman || !erpUser) return;
    
    // Simulate check-in at customer location
    const visit: Omit<Visit, 'id'> = {
      salesmanId: salesman.id,
      salesmanName: salesman.name,
      customerId: customer?.id || 'area-checkin',
      customerName: customer?.name || 'Area Coverage',
      checkIn: new Date().toISOString(),
      status: customer ? 'Visited' : 'Follow Up',
      location: {
        lat: salesman.currentLocation?.lat || 19,
        lng: salesman.currentLocation?.lng || 72
      },
      tenantId: erpUser.tenantId
    };

    await salesmanService.logVisit(visit);
    alert(`Success: ${customer?.name || 'Area'} visit entry logged.`);
    setActiveTab('visits');
  };

  const handleCreateOrder = async (items: OrderItem[]) => {
    if (!selectedCustomer || !erpUser || !salesman) return;
    
    const subtotal = items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    const tax = subtotal * 0.18; // 18% GST estimate
    
    const order: Omit<SalesOrder, 'id' | 'createdAt'> = {
      orderNumber: `SO-${Date.now().toString().slice(-6)}`,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      items,
      subtotal,
      taxAmount: tax,
      cgst: tax / 2,
      sgst: tax / 2,
      discountAmount: 0,
      totalAmount: subtotal + tax,
      status: 'confirmed',
      tenantId: erpUser.tenantId,
      salesmanId: salesman.id,
      salesmanName: salesman.name
    };

    try {
      await salesService.createSalesOrder(order);
      
      // Also log a visit with status "Order Taken"
      await salesmanService.logVisit({
        salesmanId: salesman.id,
        salesmanName: salesman.name,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        checkIn: new Date().toISOString(),
        status: 'Order Taken',
        location: {
          lat: salesman.currentLocation?.lat || 19,
          lng: salesman.currentLocation?.lng || 72
        },
        tenantId: erpUser.tenantId,
        orderId: order.orderNumber // Reference
      });

      alert('Order Confirmed. Inventory Reserved.');
      setShowOrderForm(false);
      setSelectedCustomer(null);
      setActiveTab('visits');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-brand-sidebar text-white gap-4">
        <Smartphone className="w-12 h-12 text-brand-accent animate-pulse" />
        <span className="text-[10px] font-mono uppercase tracking-[0.4em] opacity-40">Connecting to ERP Nexus...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-brand-bg text-brand-text font-sans overflow-hidden max-w-md mx-auto border-x border-brand-border shadow-2xl relative">
      <header className="p-5 bg-brand-sidebar text-white flex justify-between items-center shrink-0">
        <div className="flex flex-col">
            <span className="text-[9px] font-mono uppercase tracking-[0.3em] opacity-40">Field Identity: {erpUser?.name || 'Sales Agent'}</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <h1 className="text-lg font-extrabold uppercase tracking-tight leading-none">Force Mobile</h1>
            </div>
        </div>
        <button onClick={() => auth.signOut()} className="w-9 h-9 border border-white/10 grid place-items-center hover:bg-white/5 transition-all rounded">
            <LogOut className="w-4 h-4 text-white/50" />
        </button>
      </header>

      <div className="bg-brand-sidebar text-white px-5 pb-5 shrink-0">
          <div className="p-3.5 bg-white/5 flex justify-between items-center rounded border border-white/5 shadow-inner">
             <div>
                <span className="text-[9px] font-mono uppercase text-white/40 block mb-0.5">Today's Targets</span>
                <span className="text-xl font-bold font-mono leading-none tracking-tight italic uppercase">{salesman?.territory || 'Unassigned'}</span>
             </div>
             <div className="text-right">
                <span className="text-[9px] font-mono uppercase text-success block mb-0.5">GPS Active</span>
                <div className="flex gap-0.5 justify-end">
                   {[1,2,3,4].map(i => <div key={i} className={`w-1 h-3 rounded-full ${i <= 3 ? 'bg-brand-accent' : 'bg-white/10'}`} />)}
                </div>
             </div>
          </div>
      </div>

      <main className="flex-1 overflow-y-auto p-4 scroll-smooth">
          {activeTab === 'customers' && (
            <CustomerCatalog 
              customers={customers} 
              onCheckIn={(c) => handleVisit(c)}
              onOrder={(c) => {
                setSelectedCustomer(c);
                setShowOrderForm(true);
              }}
            />
          )}
          {activeTab === 'visits' && (
            <VisitLog 
              customers={customers} 
              salesman={salesman} 
              onLogVisit={() => handleVisit(null)} 
            />
          )}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <header>
                <h2 className="text-xl font-black uppercase italic font-serif leading-none">Revenue Stream</h2>
                <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-widest">Live order queue</span>
              </header>
              <div className="py-20 text-center font-mono uppercase text-brand-text-muted text-[10px] bg-slate-50/50 border border-dashed border-zinc-200">
                Secure ledger sync in progress...
              </div>
            </div>
          )}
          {activeTab === 'wallet' && (
             <div className="space-y-6">
                <div className="p-8 bg-[#141414] text-[#E4E3E0] rounded-xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 border-l border-b border-white/10 text-[8px] font-mono">ENCRYPTED</div>
                   <span className="text-[10px] font-mono uppercase opacity-40">Field Expense Limit</span>
                   <div className="text-4xl font-black mt-2 mb-8 tracking-tighter">₹25,000</div>
                   <div className="flex justify-between items-end">
                      <div>
                        <span className="text-[9px] uppercase font-bold opacity-30">Account Ref:</span>
                        <div className="text-[11px] font-bold">LBN-FORCE-8821</div>
                      </div>
                      <Box className="w-10 h-10 opacity-10" />
                   </div>
                </div>

                <div className="space-y-3">
                   <h3 className="text-[10px] font-black uppercase tracking-widest">Recent Settlements</h3>
                   {[
                     { label: 'Fuel Reimbursement', amount: '₹1,240', status: 'PAID' },
                     { label: 'Lunch Allowance', amount: '₹350', status: 'PAID' },
                     { label: 'Client Meet (Exp)', amount: '₹980', status: 'PENDING' },
                   ].map((tx, i) => (
                     <div key={i} className="flex justify-between items-center p-3 border-b border-zinc-100 font-mono text-[9px] uppercase">
                       <span>{tx.label}</span>
                       <span className="font-bold">{tx.amount} // {tx.status}</span>
                     </div>
                   ))}
                </div>

                <button className="w-full py-4 border border-[#141414] text-[#141414] font-black text-[10px] uppercase tracking-widest hover:bg-slate-50">Upload Expense Receipt</button>
             </div>
          )}
      </main>

      <nav className="shrink-0 bg-white border-t border-brand-border grid grid-cols-4 h-16 safe-area-bottom shadow-[0_-10px_30px_rgba(0,0,0,0.03)] z-40">
        {[
            { id: 'customers', icon: Users, label: 'Dealers' },
            { id: 'visits', icon: MapPin, label: 'Visits' },
            { id: 'orders', icon: ShoppingCart, label: 'Activity' },
            { id: 'wallet', icon: Wallet, label: 'Wallet' },
        ].map((tab) => (
            <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center gap-1 transition-all relative ${activeTab === tab.id ? 'text-brand-accent bg-slate-50' : 'text-brand-text-muted hover:text-brand-text'}`}
            >
                {activeTab === tab.id && <motion.div layoutId="tabMarker" className="absolute top-0 left-0 right-0 h-1 bg-brand-accent" />}
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'stroke-[3px]' : 'stroke-[1.5px]'}`} />
                <span className="text-[8px] font-black uppercase tracking-[0.15em]">{tab.label}</span>
            </button>
        ))}
      </nav>

      <AnimatePresence>
        {showOrderForm && selectedCustomer && (
          <OrderForm 
            customer={selectedCustomer}
            products={products}
            onClose={() => setShowOrderForm(false)}
            onSubmit={handleCreateOrder}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
