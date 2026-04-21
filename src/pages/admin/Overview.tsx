import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  CheckCircle,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  ChevronDown,
  Package,
  ShoppingCart,
  DollarSign,
  Truck
} from 'lucide-react';
import { BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { inventoryService } from '../../services/inventoryService';
import { useAuth } from '../../AuthContext';
import { Product, Inventory as IInventory } from '../../types/erp';

export default function Overview() {
  const { erpUser } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<IInventory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!erpUser?.tenantId) return;

    const unsubProducts = inventoryService.subscribeToProducts(erpUser.tenantId, setProducts);
    const unsubInv = inventoryService.subscribeToInventory(erpUser.tenantId, (inv) => {
      setInventory(inv);
      setLoading(false);
    });

    return () => {
      unsubProducts();
      unsubInv();
    };
  }, [erpUser?.tenantId]);

  const stats = useMemo(() => {
    const totalValuation = products.reduce((acc, p) => {
      const inv = inventory.find(i => i.productId === p.id);
      return acc + (p.purchasePrice * (inv?.totalStock || 0));
    }, 0);

    const lowStockItems = inventory.filter(i => i.status === 'Low Stock');
    const outOfStockItems = inventory.filter(i => i.status === 'Out of Stock');

    return { totalValuation, lowStockCount: lowStockItems.length, outOfStockCount: outOfStockItems.length };
  }, [products, inventory]);

  return (
    <div className="space-y-4">
      <section className="dashboard-grid">
         <div className="card border-l-4 border-l-brand-accent">
            <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-tight">System Valuation (Inventory)</span>
                <DollarSign className="w-4 h-4 text-brand-accent opacity-40" />
            </div>
            <div className="text-xl font-black font-mono tracking-tight leading-none mb-1">₹{(stats.totalValuation).toLocaleString()}</div>
            <div className={`text-[10px] text-success font-medium flex items-center gap-1`}>
              <ArrowUpRight className="w-3 h-3" /> Real-time Asset Tracking
            </div>
          </div>

          <div className="card border-l-4 border-l-warning">
            <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-tight">Active Supply Risks</span>
                <AlertTriangle className="w-4 h-4 text-warning opacity-40" />
            </div>
            <div className="text-xl font-black font-mono tracking-tight leading-none mb-1">{stats.lowStockCount} SKUs</div>
            <div className={`text-[10px] text-warning font-medium`}>Below configured Thresholds</div>
          </div>

          <div className="card border-l-4 border-l-danger">
            <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-tight">Stock Outs (Stock Null)</span>
                <TrendingDown className="w-4 h-4 text-danger opacity-40" />
            </div>
            <div className="text-xl font-black font-mono tracking-tight leading-none mb-1">{stats.outOfStockCount} SKUs</div>
            <div className={`text-[10px] text-danger font-medium`}>Immediate Fulfilment Needed</div>
          </div>

          <div className="card border-l-4 border-l-success">
            <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-tight">Fulfillment Readiness</span>
                <CheckCircle className="w-4 h-4 text-success opacity-40" />
            </div>
            <div className="text-xl font-black font-mono tracking-tight leading-none mb-1">
              {((inventory.filter(i => i.status === 'In Stock').length / (inventory.length || 1)) * 100).toFixed(0)}%
            </div>
            <div className={`text-[10px] text-brand-text-muted font-medium uppercase font-mono`}>Service Level Index</div>
          </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-[11px] font-black uppercase tracking-tight">Inventory Health Index // Global Distribution</h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={[
                { name: 'ENG', val: 42 },
                { name: 'GRS', val: 38 },
                { name: 'CLT', val: 12 },
                { name: 'HDY', val: 24 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                <YAxis hide />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="val" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card flex flex-col">
            <div className="flex items-center gap-2 mb-4">
               <AlertTriangle className="w-4 h-4 text-warning" />
               <h3 className="text-[11px] font-black uppercase tracking-tight">Supply Chain Alerts</h3>
            </div>
            <div className="space-y-2 flex-1">
               {inventory.filter(i => i.status !== 'In Stock').slice(0, 4).map((inv, idx) => {
                 const p = products.find(p => p.id === inv.productId);
                 return (
                   <div key={idx} className="p-3 bg-slate-50 border border-brand-border rounded flex justify-between items-center group hover:border-brand-accent transition-all cursor-pointer">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-extrabold uppercase truncate max-w-[140px]">{p?.name || 'Loading SKU...'}</span>
                        <span className="text-[8px] font-mono text-brand-text-muted">{inv.status} // {inv.totalStock} LITERS</span>
                      </div>
                      <ChevronDown className="w-3 h-3 text-brand-text-muted group-hover:text-brand-accent" />
                   </div>
                 );
               })}
               {inventory.filter(i => i.status !== 'In Stock').length === 0 && (
                 <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-30">
                    <CheckCircle className="w-10 h-10 mb-2" />
                    <p className="text-[10px] font-black uppercase text-brand-text">No anomalies detected</p>
                 </div>
               )}
            </div>
            <button className="w-full mt-4 py-2 bg-brand-sidebar text-white text-[9px] font-extrabold uppercase rounded shadow-lg shadow-brand-sidebar/10 hover:bg-zinc-800 transition-all">View Full Analytics</button>
        </div>
      </div>

      <section className="card bg-slate-900 text-white min-h-[300px]">
          <div className="flex justify-between items-center mb-6 px-2">
             <div className="flex items-center gap-3">
               <Activity className="w-5 h-5 text-brand-accent" />
               <div>
                  <h3 className="text-sm font-black uppercase tracking-tight">System Core Audit Ledger</h3>
                  <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Global activity monitoring // Real-time feed</p>
               </div>
             </div>
             <div className="text-[9px] font-bold bg-brand-accent text-white px-2 py-1 rounded select-none">NODE_STATUS: SYNCED</div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                 <tr className="border-b border-white/10 text-white/30 uppercase text-[9px] font-black tracking-widest">
                    <th className="px-5 py-3">Sequence-ID</th>
                    <th className="px-5 py-3">Timestamp (UTC)</th>
                    <th className="px-5 py-3">Actor / Process</th>
                    <th className="px-5 py-3">Transaction Map</th>
                    <th className="px-5 py-3 text-right">Integrity</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                 {[
                   { id: 'TX-4421/B', time: '2026-04-17 12:05:42', actor: 'SYSTEM_BOT_01', desc: 'CRON: STOCK_LEVEL_RECONCILIATION_COMPLETE', status: 'VERIFIED' },
                   { id: 'TX-4420/A', time: '2026-04-17 11:58:22', actor: 'ADMIN_SUPER', desc: 'SCHEMA_UPDATE: FIREBASE_BLUEPRINT_SYNCED', status: 'COMMIT_OK' },
                   { id: 'TX-4419/C', time: '2026-04-17 11:42:10', actor: 'GUEST_ACCESS', desc: 'PORTAL_AUTH: BYPASS_ENABLED_DEMO_MODE', status: 'SEC_ALRT' },
                   { id: 'TX-4418/A', time: '2026-04-17 11:02:44', actor: 'SYSTEM_AI', desc: 'MODEL_PREDICT: INVENTORY_DRIFT_DETECTED_MUMBAI', status: 'TRAINED' }
                 ].map((log, idx) => (
                   <tr key={idx} className="hover:bg-white/5 transition-colors group">
                      <td className="px-5 py-3 font-mono text-[10px] text-brand-accent font-bold">{log.id}</td>
                      <td className="px-5 py-3 font-mono text-[9px] text-white/40">{log.time}</td>
                      <td className="px-5 py-3 text-[10px] font-black uppercase tracking-tight">{log.actor}</td>
                      <td className="px-5 py-3 text-[10px] font-bold opacity-70 group-hover:opacity-100 transition-opacity whitespace-nowrap">{log.desc}</td>
                      <td className="px-5 py-3 text-right">
                         <span className="text-[8px] font-black bg-white/10 px-2 py-0.5 rounded tracking-tighter uppercase">{log.status}</span>
                      </td>
                   </tr>
                 ))}
              </tbody>
            </table>
          </div>
      </section>
    </div>
  );
}
