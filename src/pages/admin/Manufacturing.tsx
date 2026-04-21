import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Beaker, 
  Droplets, 
  Settings, 
  Activity,
  Package,
  AlertCircle,
  ClipboardList,
  FlaskConical,
  History,
  TrendingUp,
  Database
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart as ReBarChart, 
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
import { manufacturingService } from '../../services/manufacturingService';
import { seedManufacturingData } from '../../services/seedManufacturingService';
import { useAuth } from '../../AuthContext';
import { 
  ProductionOrder, 
  RawMaterial, 
  BOM, 
  Batch,
  Product 
} from '../../types/erp';
import { inventoryService } from '../../services/inventoryService';

// Sub-components
import RawMaterialsList from '../../components/manufacturing/RawMaterialsList';
import BOMManager from '../../components/manufacturing/BOMManager';
import ProductionOrderWorkflow from '../../components/manufacturing/ProductionOrderWorkflow';
import QCCenter from '../../components/manufacturing/QCCenter';

type Tab = 'dashboard' | 'materials' | 'bom' | 'orders' | 'qc';

export default function Manufacturing() {
  const { erpUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (!erpUser?.tenantId) return;

    const unsubOrders = manufacturingService.subscribeToProductionOrders(erpUser.tenantId, setOrders);
    const unsubBatches = manufacturingService.subscribeToBatches(erpUser.tenantId, setBatches);
    const unsubRM = manufacturingService.subscribeToRawMaterials(erpUser.tenantId, (mats) => {
      setMaterials(mats);
      setLoading(false);
    });

    return () => {
      unsubOrders();
      unsubBatches();
      unsubRM();
    };
  }, [erpUser?.tenantId]);

  const handleSeed = async () => {
    if (!erpUser?.tenantId) return;
    setSeeding(true);
    try {
      await seedManufacturingData(erpUser.tenantId);
      alert('Manufacturing Data Seeded Successfully');
    } catch (err) {
      console.error(err);
    } finally {
      setSeeding(false);
    }
  };

  const dashboardStats = {
    activeOrders: orders.filter(o => !['completed', 'qc_failed'].includes(o.status)).length,
    qcPending: batches.filter(b => b.status === 'qc_pending').length,
    lowRM: materials.filter(m => m.stockQuantity <= m.minStockLevel).length,
    monthlyOutput: batches
      .filter(b => b.status === 'completed' && new Date(b.mfgDate).getMonth() === new Date().getMonth())
      .reduce((acc, b) => acc + b.quantity, 0)
  };

  const statusData = [
    { name: 'Planned', value: orders.filter(o => o.status === 'planned').length, color: '#94a3b8' },
    { name: 'Blending', value: orders.filter(o => o.status === 'blending').length, color: '#3b82f6' },
    { name: 'QC Pending', value: orders.filter(o => o.status === 'qc_pending').length, color: '#f59e0b' },
    { name: 'Completed', value: orders.filter(o => o.status === 'completed').length, color: '#10b981' },
    { name: 'Rejected', value: orders.filter(o => o.status === 'qc_failed').length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Dynamic Command Bar */}
      <div className="flex justify-between items-center bg-white p-4 border border-brand-border rounded-lg shadow-sm">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-accent animate-pulse" />
            Manufacturing Operations Center
          </h1>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Facility.ID: MUMBAI-PLANT-01</span>
            <span className="text-[10px] font-bold text-success animate-pulse uppercase tracking-widest flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 bg-success rounded-full" /> Systems Online
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleSeed}
            disabled={seeding}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-black text-[10px] uppercase tracking-wider rounded hover:bg-slate-200 transition-all flex items-center gap-2"
          >
            <Database className="w-4 h-4" /> {seeding ? 'Generating...' : 'Seed Data'}
          </button>
          <button 
             onClick={() => setActiveTab('orders')}
             className="px-4 py-2 bg-brand-sidebar text-white font-black text-[10px] uppercase tracking-wider rounded hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-lg shadow-brand-sidebar/10"
          >
            <Plus className="w-4 h-4" /> New Production Order
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex gap-1 bg-white p-1 border border-brand-border rounded-lg self-start">
        {[
          { id: 'dashboard', label: 'Command Center', icon: Activity },
          { id: 'materials', label: 'Raw Materials', icon: Droplets },
          { id: 'bom', label: 'Master BOMs', icon: Settings },
          { id: 'orders', label: 'Production Queue', icon: ClipboardList },
          { id: 'qc', label: 'Quality Center', icon: FlaskConical },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
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

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === 'dashboard' && (
              <div className="space-y-4">
                <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Active Runs', value: dashboardStats.activeOrders, sub: 'Parallel Batches', icon: Activity, color: 'text-brand-accent' },
                    { label: 'QC Waiting', value: dashboardStats.qcPending, sub: 'Awaiting Testing', icon: FlaskConical, color: 'text-warning' },
                    { label: 'Supply Risks', value: dashboardStats.lowRM, sub: 'RM Low stock alerts', icon: AlertCircle, color: 'text-danger' },
                    { label: 'Monthly Output', value: `${(dashboardStats.monthlyOutput / 1000).toFixed(1)}k L`, sub: 'Target: 25.0k L', icon: TrendingUp, color: 'text-success' }
                  ].map((stat, i) => (
                    <div key={i} className="card group hover:border-brand-accent transition-all cursor-default relative overflow-hidden">
                       <div className="relative z-10">
                        <span className="text-[10px] font-black uppercase text-brand-text-muted tracking-widest flex items-center gap-2">
                           <stat.icon className={`w-3 h-3 ${stat.color}`} />
                           {stat.label}
                        </span>
                        <div className="text-2xl font-black font-mono tracking-tighter mt-1">{stat.value}</div>
                        <span className="text-[9px] font-bold text-brand-text-muted uppercase tracking-widest">{stat.sub}</span>
                       </div>
                       <stat.icon className={`absolute -right-4 -bottom-4 w-20 h-20 opacity-[0.03] transition-transform group-hover:scale-110`} />
                    </div>
                  ))}
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                   <div className="lg:col-span-2 card">
                      <h3 className="text-[11px] font-black uppercase tracking-tighter mb-6 flex items-center justify-between">
                         Production Volumetric Trend // 7 Day History
                         <span className="text-[9px] font-mono text-brand-text-muted">Unit: Liters (L)</span>
                      </h3>
                      <div className="h-[250px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={[
                               { date: '04/11', vol: 2400 },
                               { date: '04/12', vol: 3100 },
                               { date: '04/13', vol: 1800 },
                               { date: '04/14', vol: 4200 },
                               { date: '04/15', vol: 3900 },
                               { date: '04/16', vol: 5100 },
                               { date: '04/17', vol: 4800 },
                            ]}>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                               <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                               <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                               <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '4px', border: '1px solid #e2e8f0' }} />
                               <Line type="monotone" dataKey="vol" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                            </LineChart>
                         </ResponsiveContainer>
                      </div>
                   </div>

                   <div className="card">
                      <h3 className="text-[11px] font-black uppercase tracking-tighter mb-6">Execution Pipeline Status</h3>
                      <div className="h-[250px] w-full flex items-center justify-center">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                               <Pie
                                  data={statusData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={80}
                                  paddingAngle={5}
                                  dataKey="value"
                               >
                                  {statusData.map((entry, index) => (
                                     <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                               </Pie>
                               <Tooltip />
                            </PieChart>
                         </ResponsiveContainer>
                         <div className="absolute flex flex-col items-center">
                            <span className="text-[10px] font-black text-brand-text opacity-40 uppercase">Total Runs</span>
                            <span className="text-xl font-black font-mono tracking-tighter">{orders.length}</span>
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-4">
                         {statusData.map((d, i) => (
                           <div key={i} className="flex items-center gap-2 p-1.5 border border-brand-border rounded">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                              <span className="text-[9px] font-bold uppercase tracking-tighter truncate">{d.name}: {d.value}</span>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="card bg-slate-900 border-none shadow-xl">
                   <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-3">
                         <History className="w-5 h-5 text-brand-accent" />
                         <div>
                            <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Live Manufacturing Audit Ledger</h3>
                            <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Real-time facility telemetry</p>
                         </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="px-2 py-1 bg-white/5 border border-white/10 rounded text-center min-w-[60px]">
                           <div className="text-[8px] text-white/40 uppercase font-black tracking-widest">Efficiency</div>
                           <div className="text-[11px] text-brand-accent font-black tracking-tighter">94.2%</div>
                        </div>
                        <div className="px-2 py-1 bg-white/5 border border-white/10 rounded text-center min-w-[60px]">
                           <div className="text-[8px] text-white/40 uppercase font-black tracking-widest">Downtime</div>
                           <div className="text-[11px] text-danger font-black tracking-tighter">0.4h</div>
                        </div>
                      </div>
                   </div>

                   <div className="space-y-1">
                      {orders.slice(-5).map((order, i) => (
                         <div key={i} className="flex items-center justify-between p-3 border-b border-white/5 last:border-0 group hover:bg-white/5 transition-all">
                            <div className="flex items-center gap-4">
                               <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center font-mono text-[10px] text-white/40">
                                  {i+1}
                               </div>
                               <div>
                                  <div className="text-[11px] font-black text-white uppercase tracking-tight">{order.productName}</div>
                                  <div className="text-[9px] font-bold text-brand-accent tracking-widest flex items-center gap-2">
                                     <span className="opacity-40">ORDER: {order.id.slice(0, 8)}</span>
                                     <span className="w-1 h-1 bg-brand-accent rounded-full" />
                                     <span>{order.requestedQuantity} L</span>
                                  </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                               <div className="text-right">
                                  <div className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Status Protocol</div>
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                                     ['completed', 'qc_passed'].includes(order.status) ? 'bg-success text-white' : 
                                     order.status === 'qc_failed' ? 'bg-danger text-white' : 'bg-brand-accent text-white'
                                  }`}>
                                     {order.status}
                                  </span>
                               </div>
                               <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-brand-accent transition-all translate-x-0 group-hover:translate-x-1" />
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'materials' && <RawMaterialsList materials={materials} />}
            {activeTab === 'bom' && <BOMManager />}
            {activeTab === 'orders' && <ProductionOrderWorkflow orders={orders} />}
            {activeTab === 'qc' && <QCCenter batches={batches} orders={orders} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
  );
}
