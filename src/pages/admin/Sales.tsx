import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Users, 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Truck, 
  ChevronRight,
  MoreVertical,
  ArrowUpRight,
  CreditCard,
  DollarSign
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../AuthContext';
import { salesService } from '../../services/salesService';
import { SalesOrder, Customer, Invoice } from '../../types/erp';
import CreateOrderModal from '../../components/sales/CreateOrderModal';
import OrderDetailsModal from '../../components/sales/OrderDetailsModal';

export default function Sales() {
  const { erpUser } = useAuth();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'customers' | 'invoices'>('dashboard');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!erpUser?.tenantId) return;

    const unsubOrders = salesService.subscribeToOrders(erpUser.tenantId, setOrders);
    const unsubInvoices = salesService.subscribeToInvoices(erpUser.tenantId, setInvoices);

    return () => {
      unsubOrders();
      unsubInvoices();
    };
  }, [erpUser?.tenantId]);

  const stats = {
    totalRevenue: orders.filter(o => o.status !== 'cancelled').reduce((acc, o) => acc + o.totalAmount, 0),
    activeOrders: orders.filter(o => !['delivered', 'completed', 'cancelled'].includes(o.status)).length,
    pendingPayments: invoices.filter(i => i.status !== 'paid').reduce((acc, i) => acc + (i.totalAmount - i.paidAmount), 0),
    monthlyGrowth: 12.5 // Mock
  };

  const statusColors: Record<SalesOrder['status'], string> = {
    draft: 'bg-slate-100 text-slate-700',
    confirmed: 'bg-blue-100 text-blue-700',
    shipped: 'bg-amber-100 text-amber-700',
    delivered: 'bg-indigo-100 text-indigo-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700'
  };

  const filteredOrders = orders.filter(o => 
    o.orderNumber.toLowerCase().includes(search.toLowerCase()) || 
    o.customerName.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Sales Header */}
      <div className="flex justify-between items-center bg-white p-4 border border-brand-border rounded-lg shadow-sm">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2 text-brand-sidebar">
            <ShoppingBag className="w-5 h-5 text-brand-accent" />
            Merchant Sales Console
          </h1>
          <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mt-1">Order Pipeline // Transaction Management</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setShowCreateModal(true)}
             className="bg-brand-sidebar text-white px-4 py-2 rounded font-black text-[10px] uppercase tracking-wider flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-lg shadow-brand-sidebar/10"
           >
              <Plus className="w-4 h-4" /> New Sales Order
           </button>
        </div>
      </div>

      {/* Tabs */}
      <nav className="flex gap-1 bg-white p-1 border border-brand-border rounded-lg self-start">
        {[
          { id: 'dashboard', label: 'Commercial Insight', icon: TrendingUp },
          { id: 'orders', label: 'Order Ledger', icon: ShoppingBag },
          { id: 'invoices', label: 'Billing / Invoices', icon: FileText },
          { id: 'customers', label: 'CRM / Customers', icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-tight flex items-center gap-2 rounded transition-all ${
              activeTab === tab.id 
                ? 'bg-brand-sidebar text-white shadow-md' 
                : 'text-brand-text-muted hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
               key="dash"
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="space-y-4"
            >
              <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 {[
                   { label: 'Gross Revenue', value: `₹${(stats.totalRevenue / 100000).toFixed(2)}L`, sub: '+12.5% vs Last Month', icon: DollarSign, color: 'text-emerald-500' },
                   { label: 'Open Pipeline', value: stats.activeOrders, sub: 'Needs Processing', icon: Clock, color: 'text-blue-500' },
                   { label: 'Arrears (A/R)', value: `₹${(stats.pendingPayments / 1000).toFixed(1)}k`, sub: '12 Overdue Invoices', icon: CreditCard, color: 'text-orange-500' },
                   { label: 'Avg Order Val', value: `₹${Math.floor(stats.totalRevenue / (orders.length || 1)).toLocaleString()}`, sub: 'Unit Economics', icon: TrendingUp, color: 'text-brand-accent' }
                 ].map((stat, i) => (
                    <div key={i} className="card relative overflow-hidden group">
                       <span className="text-[10px] font-black uppercase text-brand-text-muted tracking-widest flex items-center gap-2 mb-2">
                          <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                          {stat.label}
                       </span>
                       <div className="text-2xl font-black font-mono tracking-tighter">{stat.value}</div>
                       <p className="text-[9px] font-bold text-brand-text-muted mt-1 uppercase tracking-widest">{stat.sub}</p>
                       <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-110 transition-transform">
                          <stat.icon className="w-20 h-20" />
                       </div>
                    </div>
                 ))}
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                 <div className="lg:col-span-2 card">
                    <h3 className="text-[11px] font-black uppercase tracking-tighter mb-6 flex justify-between">
                       Fiscal Revenue Velocity // 7 Day History
                       <span className="text-brand-accent hover:underline cursor-pointer">FULL REPORT</span>
                    </h3>
                    <div className="h-[300px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={[
                           { day: 'Mon', rev: 45000 },
                           { day: 'Tue', rev: 52000 },
                           { day: 'Wed', rev: 38000 },
                           { day: 'Thu', rev: 65000 },
                           { day: 'Fri', rev: 48000 },
                           { day: 'Sat', rev: 25000 },
                           { day: 'Sun', rev: 15000 },
                         ]}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                            <Tooltip cursor={{ fill: '#f8fafc' }} />
                            <Bar dataKey="rev" fill="#1e293b" radius={[4, 4, 0, 0]} barSize={40} />
                         </BarChart>
                       </ResponsiveContainer>
                    </div>
                 </div>

                 <div className="card">
                    <h3 className="text-[11px] font-black uppercase tracking-tighter mb-6">Regional Distribution</h3>
                    <div className="h-[250px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                             <Pie
                               data={[
                                 { name: 'Mumbai', value: 400 },
                                 { name: 'Pune', value: 300 },
                                 { name: 'Surat', value: 200 },
                                 { name: 'Other', value: 100 },
                               ]}
                               cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                             >
                               {[ '#1e293b', '#3b82f6', '#f59e0b', '#94a3b8' ].map((color, i) => (
                                 <Cell key={i} fill={color} />
                               ))}
                             </Pie>
                             <Tooltip />
                          </PieChart>
                       </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 mt-4">
                       {[
                         { city: 'Mumbai', share: '40%', val: '₹14.2L' },
                         { city: 'Pune', share: '30%', val: '₹10.5L' },
                         { city: 'Surat', share: '20%', val: '₹7.1L' }
                       ].map((item, i) => (
                         <div key={i} className="flex justify-between items-center p-2 rounded hover:bg-slate-50 border border-transparent hover:border-brand-border transition-all">
                            <span className="text-[10px] font-black uppercase">{item.city}</span>
                            <div className="text-right">
                               <div className="text-[10px] font-black font-mono">{item.val}</div>
                               <div className="text-[8px] font-bold text-brand-text-muted uppercase tracking-widest">{item.share} Market Share</div>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div 
               key="orders"
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="space-y-4"
            >
              <div className="flex justify-between items-center bg-white p-3 border border-brand-border rounded-lg shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                     <input 
                       type="text" 
                       placeholder="Filter Order Logic (ID, Cust)..."
                       className="pl-10 pr-4 py-2 border border-brand-border rounded bg-brand-bg text-[10px] font-black w-64 focus:ring-1 ring-brand-accent/30 outline-none uppercase tracking-tight"
                       value={search}
                       onChange={(e) => setSearch(e.target.value)}
                     />
                  </div>
                  <select className="bg-brand-bg border border-brand-border px-3 py-2 rounded text-[10px] font-black uppercase outline-none">
                     <option>All Status Flow</option>
                     <option>Awaiting Shipment</option>
                     <option>Transit Active</option>
                     <option>Completed</option>
                  </select>
                </div>
              </div>

              <div className="card !p-0 overflow-hidden shadow-xl">
                 <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-900 border-b border-brand-border text-[9px] font-black text-white/50 uppercase tracking-widest">
                       <tr>
                          <th className="px-5 py-4">Serial / ID</th>
                          <th className="px-5 py-4">Client Portfolio</th>
                          <th className="px-5 py-4 text-right">Transaction Value</th>
                          <th className="px-5 py-4 text-center">Protocol Status</th>
                          <th className="px-5 py-4 text-center">Fulfillment</th>
                          <th className="px-5 py-4 text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-bg">
                       {filteredOrders.map(order => (
                         <tr 
                           key={order.id} 
                           onClick={() => setSelectedOrder(order)}
                           className="group hover:bg-slate-50 transition-all cursor-pointer"
                         >
                            <td className="px-5 py-4">
                               <div className="flex flex-col">
                                  <span className="text-[11px] font-black font-mono text-brand-accent">#{order.orderNumber}</span>
                                  <span className="text-[9px] font-bold text-brand-text-muted uppercase">{new Date(order.createdAt).toLocaleDateString()}</span>
                               </div>
                            </td>
                            <td className="px-5 py-4">
                               <div className="text-[11px] font-black uppercase tracking-tight line-clamp-1">{order.customerName}</div>
                               <div className="text-[9px] font-bold text-brand-text-muted uppercase tracking-widest">ID: {order.customerId.slice(-6)}</div>
                            </td>
                            <td className="px-5 py-4 text-right">
                               <div className="text-[12px] font-black font-mono tracking-tighter italic">₹{order.totalAmount.toLocaleString()}</div>
                               <div className="text-[8px] font-bold text-brand-text-muted uppercase">{order.items.length} SKUs Bundled</div>
                            </td>
                            <td className="px-5 py-4">
                               <div className="flex justify-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${statusColors[order.status]}`}>
                                     {order.status}
                                  </span>
                               </div>
                            </td>
                            <td className="px-5 py-4">
                               <div className="flex flex-col items-center gap-1">
                                  <div className="w-20 h-1 bg-slate-200 rounded-full overflow-hidden">
                                     <div 
                                        className="h-full bg-brand-accent" 
                                        style={{ width: order.status === 'completed' ? '100%' : order.status === 'shipped' ? '60%' : '20%' }}
                                     />
                                  </div>
                                  <span className="text-[8px] font-bold opacity-30 uppercase">Track Point</span>
                               </div>
                            </td>
                            <td className="px-5 py-4 text-right">
                               <button className="p-1 px-2 border border-brand-border rounded group-hover:border-brand-accent transition-all">
                                  <ChevronRight className="w-4 h-4 text-brand-text-muted group-hover:text-brand-accent" />
                               </button>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showCreateModal && <CreateOrderModal onClose={() => setShowCreateModal(false)} />}
      {selectedOrder && <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
}
