import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  AlertTriangle, 
  ArrowUpDown, 
  MoreVertical, 
  Edit, 
  Trash2, 
  BarChart3,
  TrendingDown,
  TrendingUp,
  Database,
  X,
  RefreshCw,
  FileText,
  Activity,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { inventoryService } from '../../services/inventoryService';
import { seedDatabase } from '../../services/seedService';
import { useAuth } from '../../AuthContext';
import { Product, Inventory as IInventory } from '../../types/erp';
import { 
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

export default function Inventory() {
  const { erpUser } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<IInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

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

  const richProducts = useMemo(() => {
    return products.map(p => {
      const stock = inventory.find(i => i.productId === p.id);
      return {
        ...p,
        totalStock: stock?.totalStock || 0,
        status: stock?.status || 'Out of Stock'
      };
    });
  }, [products, inventory]);

  const filteredProducts = useMemo(() => {
    return richProducts.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = categoryFilter === 'All' || p.category === categoryFilter;
      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [richProducts, searchTerm, categoryFilter, statusFilter]);

  const stats = useMemo(() => {
    const totalProducts = richProducts.length;
    const totalStockValue = richProducts.reduce((acc, p) => acc + (p.purchasePrice * p.totalStock), 0);
    const lowStockCount = richProducts.filter(p => p.status === 'Low Stock').length;
    const outOfStockCount = richProducts.filter(p => p.status === 'Out of Stock').length;

    const categoryDataMap = richProducts.reduce((acc: any, p) => {
      acc[p.category] = (acc[p.category] || 0) + p.totalStock;
      return acc;
    }, {});
    
    const categoryData = Object.entries(categoryDataMap).map(([name, value]) => ({ name, value }));
    
    const statusData = [
      { name: 'In Stock', value: richProducts.filter(p => p.status === 'In Stock').length },
      { name: 'Low Stock', value: lowStockCount },
      { name: 'Out of Stock', value: outOfStockCount },
    ];

    const topLowStock = [...richProducts]
      .filter(p => p.totalStock > 0)
      .sort((a, b) => a.totalStock - b.totalStock)
      .slice(0, 5);

    const recentProducts = [...richProducts]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return { totalProducts, totalStockValue, lowStockCount, outOfStockCount, categoryData, statusData, topLowStock, recentProducts };
  }, [richProducts]);

  const handleSeed = async () => {
    if (!erpUser?.tenantId) return;
    setIsSeeding(true);
    await seedDatabase(erpUser.tenantId);
    setIsSeeding(false);
  };

  const exportCSV = () => {
    const headers = ['SKU', 'Name', 'Category', 'Stock', 'Min Stock', 'Purchase Price', 'Selling Price', 'Status'];
    const rows = filteredProducts.map(p => [
      p.sku, p.name, p.category, p.totalStock, p.minStockLevel, p.purchasePrice, p.sellingPrice, p.status
    ]);
    const csvContentArray = [headers.join(','), ...rows.map(r => r.join(','))];
    const csvContent = "data:text/csv;charset=utf-8," + csvContentArray.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inventory_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-4">
        <Database className="w-12 h-12 text-brand-accent animate-pulse" />
        <span className="text-xs font-bold uppercase tracking-widest text-brand-text-muted">Accessing Global Ledger...</span>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Main Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 border border-brand-border rounded outline outline-4 outline-transparent hover:outline-brand-accent/5 transition-all">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
            <Package className="w-8 h-8 text-brand-accent" /> Inventory Systems
          </h1>
          <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span> System Operational // {stats.totalProducts} Active SKUs
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
            <button 
              onClick={handleSeed}
              disabled={isSeeding}
              className="px-4 py-2 border border-brand-accent text-brand-accent text-[10px] font-bold uppercase rounded hover:bg-brand-accent hover:text-white transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-3 h-3 ${isSeeding ? 'animate-spin' : ''}`} /> {isSeeding ? 'Seeding...' : 'Seed Demo Data'}
            </button>
            <button 
              onClick={exportCSV}
              className="px-4 py-2 bg-slate-100 text-[10px] font-bold uppercase rounded flex items-center gap-2 hover:bg-slate-200 transition-all"
            >
              <Download className="w-3.5 h-3.5" /> CSV Export
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2 bg-brand-sidebar text-white text-[10px] font-bold uppercase rounded flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-lg shadow-brand-sidebar/10"
            >
              <Plus className="w-4 h-4" /> Add Security SKU
            </button>
        </div>
      </div>

      {/* High Density Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 border-l-4 border-l-brand-accent">
           <div className="flex justify-between items-start mb-4">
             <div className="text-[10px] font-bold uppercase text-brand-text-muted font-mono tracking-tighter">Liquid Assets</div>
             <BarChart3 className="w-4 h-4 text-brand-accent opacity-40" />
           </div>
           <div className="text-3xl font-black font-mono tracking-tighter">₹{(stats.totalStockValue / 100000).toFixed(2)}L</div>
           <p className="text-[9px] font-bold uppercase text-brand-text-muted mt-1">Total On-Hand Valuation</p>
        </div>

        <div className="card p-5 border-l-4 border-l-warning">
           <div className="flex justify-between items-start mb-4">
             <div className="text-[10px] font-bold uppercase text-brand-text-muted font-mono tracking-tighter">Alert Threshold</div>
             <AlertTriangle className="w-4 h-4 text-warning opacity-40" />
           </div>
           <div className="text-3xl font-black font-mono tracking-tighter text-warning">{stats.lowStockCount}</div>
           <p className="text-[9px] font-bold uppercase text-brand-text-muted mt-1">Below Minimum Level</p>
        </div>

        <div className="card p-5 border-l-4 border-l-danger">
           <div className="flex justify-between items-start mb-4">
             <div className="text-[10px] font-bold uppercase text-brand-text-muted font-mono tracking-tighter">Critical Failure</div>
             <TrendingDown className="w-4 h-4 text-danger opacity-40" />
           </div>
           <div className="text-3xl font-black font-mono tracking-tighter text-danger">{stats.outOfStockCount}</div>
           <p className="text-[9px] font-bold uppercase text-brand-text-muted mt-1">Depleted SKUs</p>
        </div>

        <div className="card p-5 border-l-4 border-l-success">
           <div className="flex justify-between items-start mb-4">
             <div className="text-[10px] font-bold uppercase text-brand-text-muted font-mono tracking-tighter">Operational</div>
             <TrendingUp className="w-4 h-4 text-success opacity-40" />
           </div>
           <div className="text-3xl font-black font-mono tracking-tighter text-success">{richProducts.filter(p => p.status === 'In Stock').length}</div>
           <p className="text-[9px] font-bold uppercase text-brand-text-muted mt-1">Healthy Units</p>
        </div>
      </div>

      {/* Analytics Visualization Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[12px] font-black uppercase tracking-tight flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-accent" /> Stock Distribution by Category
            </h3>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }}
                />
                <YAxis 
                   axisLine={false}
                   tickLine={false}
                   tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '4px', padding: '8px' }}
                  itemStyle={{ color: '#fff', fontSize: '10px', textTransform: 'uppercase', fontWeight: 900 }}
                  labelStyle={{ display: 'none' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6 flex flex-col h-full bg-slate-50/50">
           <h3 className="text-[12px] font-black uppercase tracking-tight mb-6">Critical Exceptions</h3>
           <div className="flex-1 space-y-3">
             {stats.topLowStock.map((p, idx) => (
               <div key={p.id} className="bg-white p-3 border border-brand-border rounded flex justify-between items-center group hover:border-danger transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-bold text-brand-text-muted font-mono">{String(idx+1).padStart(2, '0')}</span>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-extrabold uppercase truncate max-w-[120px]">{p.name}</span>
                      <span className="text-[8px] font-mono font-bold text-danger">{p.totalStock} {p.packSize} REMAINING</span>
                    </div>
                  </div>
                  <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-danger" 
                      style={{ width: `${(p.totalStock / p.minStockLevel) * 100}%` }} 
                    />
                  </div>
               </div>
             ))}
             {stats.topLowStock.length === 0 && (
               <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-12">
                 <ShieldCheck className="w-10 h-10 mb-2" />
                 <p className="text-[10px] font-bold uppercase">All nodes green</p>
               </div>
             )}
           </div>
        </div>
      </div>

      {/* Search & Ledger Filter Interface */}
      <div className="card overflow-hidden">
        <div className="bg-white p-4 border-b border-brand-border flex flex-col lg:flex-row justify-between items-center gap-4 sticky top-16 z-20">
          <div className="relative w-full lg:w-[400px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
            <input 
              type="text"
              placeholder="Query SKU, Product, or Warehouse Master..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-brand-border rounded text-[11px] font-bold tracking-tight focus:outline-none focus:ring-2 ring-brand-accent/10 hover:border-brand-accent/30 transition-all font-mono"
            />
          </div>
          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            <div className="flex items-center gap-2 px-3 py-2 border border-brand-border rounded bg-slate-50 overflow-hidden">
              <Filter className="w-3 h-3 text-brand-text-muted" />
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-[10px] font-black uppercase bg-transparent outline-none cursor-pointer"
              >
                <option value="All">All Categories</option>
                <option value="Engine Oil">Engine Oil</option>
                <option value="Gear Oil">Gear Oil</option>
                <option value="Grease">Grease</option>
                <option value="Coolant">Coolant</option>
                <option value="Hydraulic Oil">Hydraulic</option>
              </select>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 border border-brand-border rounded bg-slate-50 overflow-hidden">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-[10px] font-black uppercase bg-transparent outline-none cursor-pointer"
              >
                <option value="All">Global Status</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Critical (Low)</option>
                <option value="Out of Stock">Depleted (Out)</option>
              </select>
            </div>
            <button className="p-2 border border-brand-border rounded bg-white hover:bg-slate-50 text-brand-text-muted">
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 border-b border-brand-border text-brand-text-muted font-bold text-[9px] uppercase tracking-widest font-mono">
                <th className="px-6 py-4 w-1/3">System Identity / SKU</th>
                <th className="px-6 py-4">Classification</th>
                <th className="px-6 py-4">Total Liquidity</th>
                <th className="px-6 py-4 text-center">Health Vector</th>
                <th className="px-6 py-4 text-right">Pricing (INR)</th>
                <th className="px-6 py-4 text-center">Nodes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border bg-white">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-brand-accent/[0.02] transition-colors group cursor-pointer relative">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                         <span className="text-[11px] font-black uppercase group-hover:text-brand-accent transition-colors">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                         <span className="text-[9px] font-mono text-white bg-brand-sidebar px-1.5 py-0.5 rounded-sm">{p.sku}</span>
                         <span className="text-[9px] font-mono text-brand-text-muted font-bold italic tracking-tighter opacity-60">VISC: {p.viscosity}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <span className="text-[10px] font-bold uppercase text-brand-text-muted border border-brand-border px-2 py-1 rounded bg-slate-50 font-mono tracking-tighter whitespace-nowrap">
                       {p.category}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-brand-text">
                    <div className="flex flex-col gap-0.5">
                       <span className={`text-[12px] font-black font-mono leading-none ${p.totalStock <= p.minStockLevel ? 'text-danger animate-pulse' : ''}`}>
                         {p.totalStock.toLocaleString()} <span className="text-[9px] font-bold uppercase opacity-60">LITERS</span>
                       </span>
                       <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[80px] h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
                            <div 
                              className={`h-full ${p.totalStock <= p.minStockLevel ? 'bg-danger' : 'bg-success'}`} 
                              style={{ width: `${Math.min(100, (p.totalStock / (p.minStockLevel || 1)) * 50)}%` }} 
                            />
                          </div>
                          <span className="text-[8px] font-bold text-brand-text-muted uppercase">Min {p.minStockLevel}</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border overflow-hidden
                      ${p.status === 'In Stock' ? 'bg-success/5 text-success border-success/20' : ''}
                      ${p.status === 'Low Stock' ? 'bg-warning/5 text-warning border-warning/20' : ''}
                      ${p.status === 'Out of Stock' ? 'bg-danger/5 text-danger border-danger/20' : ''}
                    ">
                      <div className={`w-1.5 h-1.5 rounded-full ${p.status === 'In Stock' ? 'bg-success' : p.status === 'Low Stock' ? 'bg-warning' : 'bg-danger'}`} />
                      <span className="text-[9px] font-black uppercase tracking-tight whitespace-nowrap">{p.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end gap-0.5 font-mono">
                       <div className="flex items-center gap-1">
                         <span className="text-[8px] font-bold text-brand-text-muted uppercase">Buy</span>
                         <span className="text-[11px] font-black tracking-tighter">₹{p.purchasePrice}</span>
                       </div>
                       <div className="flex items-center gap-1">
                         <span className="text-[8px] font-bold text-brand-text-muted uppercase">Sell</span>
                         <span className="text-[11px] font-black tracking-tighter text-brand-accent">₹{p.sellingPrice}</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center relative border-l border-brand-border/20">
                    <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all absolute inset-0 bg-white/90 backdrop-blur-[1px] gap-2">
                       <button className="p-2 bg-brand-sidebar text-white rounded shadow-md hover:scale-105 transition-transform"><Plus className="w-3.5 h-3.5" /></button>
                       <button className="p-2 border border-brand-border rounded bg-white hover:bg-slate-50 transition-all shadow-sm"><Edit className="w-3.5 h-3.5" /></button>
                       <button className="p-2 border border-brand-border rounded bg-white hover:text-danger hover:border-danger transition-all shadow-sm"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                    <MoreVertical className="w-4 h-4 mx-auto text-brand-text-muted group-hover:opacity-0 transition-opacity" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Dynamic Navigation Footer */}
        <div className="p-4 bg-slate-50 border-t border-brand-border flex flex-col sm:flex-row justify-between items-center whitespace-nowrap gap-4">
          <div className="flex gap-4 items-center">
            <span className="text-[9px] font-bold uppercase text-brand-text-muted tracking-widest px-2 py-1 bg-white border border-brand-border rounded">
              Total Records: {stats.totalProducts} // Displaying {filteredProducts.length}
            </span>
            <span className="text-[9px] font-bold uppercase text-brand-text-muted tracking-widest hidden md:block">
               Checksum: {Math.random().toString(36).substring(7).toUpperCase()}
            </span>
          </div>
          <div className="flex gap-1">
             <button className="p-1 px-4 bg-white border border-brand-border rounded text-[10px] font-bold uppercase hover:bg-slate-100 transition-all">Prev Node</button>
             <button className="p-1 px-4 bg-brand-sidebar text-white rounded text-[10px] font-bold uppercase shadow-sm">Index 01</button>
             <button className="p-1 px-4 bg-white border border-brand-border rounded text-[10px] font-bold uppercase hover:bg-slate-100 transition-all">Next Node</button>
          </div>
        </div>
      </div>

      {/* Product Registration Shell (Modal) */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
               onClick={() => setShowAddModal(false)}
               className="absolute inset-0 bg-brand-sidebar/60 backdrop-blur-md" 
             />
             <motion.div 
               initial={{ y: 20, opacity: 0, scale: 0.98 }}
               animate={{ y: 0, opacity: 1, scale: 1 }}
               exit={{ y: 20, opacity: 0, scale: 0.98 }}
               className="relative bg-white w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden border border-brand-border flex"
             >
                {/* Visual Rail */}
                <div className="w-16 bg-brand-sidebar flex flex-col items-center py-6 gap-6 relative">
                  <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center text-white"><Plus className="w-5 h-5" /></div>
                  <div className="writing-mode-vertical-rl rotate-180 text-[10px] font-black uppercase tracking-widest text-white/40">Registration Protocol // SKU-001</div>
                </div>

                <div className="flex-1 flex flex-col">
                  <div className="p-6 border-b border-brand-border flex justify-between items-center bg-slate-50/50">
                    <div className="flex flex-col">
                       <h3 className="text-base font-black uppercase tracking-tight text-brand-sidebar">Product Initialization</h3>
                       <span className="text-[9px] font-bold uppercase text-brand-text-muted opacity-60">Entry context: {erpUser?.tenantId}</span>
                    </div>
                    <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-all text-brand-text-muted"><X className="w-5 h-5" /></button>
                  </div>
                  
                  <div className="p-8 grid grid-cols-2 gap-6 overflow-y-auto max-h-[70vh]">
                     <div className="space-y-1 col-span-1">
                       <label className="text-[10px] font-black uppercase text-brand-text-muted tracking-tight">Security ID (SKU)</label>
                       <input type="text" className="w-full p-2.5 bg-slate-50 border border-brand-border rounded text-[11px] font-black font-mono focus:ring-2 ring-brand-accent/20 outline-none uppercase" placeholder="LUB-PRO-123" />
                     </div>
                     <div className="space-y-1 col-span-1">
                       <label className="text-[10px] font-black uppercase text-brand-text-muted tracking-tight">System Label (Name)</label>
                       <input type="text" className="w-full p-2.5 bg-slate-50 border border-brand-border rounded text-[11px] font-black focus:ring-2 ring-brand-accent/20 outline-none" placeholder="High-Temp Chassis Grease" />
                     </div>
                     <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase text-brand-text-muted tracking-tight">Classification</label>
                       <select className="w-full p-2.5 bg-slate-50 border border-brand-border rounded text-[11px] font-black focus:ring-2 ring-brand-accent/20 outline-none uppercase">
                         {['Engine Oil', 'Gear Oil', 'Grease', 'Coolant', 'Industrial'].map(cat => <option key={cat}>{cat}</option>)}
                       </select>
                     </div>
                     <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase text-brand-text-muted tracking-tight">Alert Threshold (Min)</label>
                       <input type="number" className="w-full p-2.5 bg-slate-50 border border-brand-border rounded text-[11px] font-black focus:ring-2 ring-brand-accent/20 outline-none" defaultValue={50} />
                     </div>
                     <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase text-brand-text-muted tracking-tight">Buy Price (INR)</label>
                       <input type="number" className="w-full p-2.5 bg-slate-50 border border-brand-border rounded text-[11px] font-black focus:ring-2 ring-brand-accent/20 outline-none" placeholder="0.00" />
                     </div>
                     <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase text-brand-text-muted tracking-tight">Sell Price (INR)</label>
                       <input type="number" className="w-full p-2.5 bg-slate-50 border border-brand-border rounded text-[11px] font-black focus:ring-2 ring-brand-accent/20 outline-none" placeholder="0.00" />
                     </div>
                  </div>

                  <div className="p-6 bg-slate-50 border-t border-brand-border flex justify-end gap-3 mt-auto">
                     <button onClick={() => setShowAddModal(false)} className="px-6 py-2 text-[10px] font-bold uppercase transition-all hover:bg-slate-200 rounded">Cancel Protocol</button>
                     <button className="px-8 py-2 bg-brand-sidebar text-white text-[10px] font-black uppercase rounded shadow-lg shadow-brand-sidebar/20 hover:translate-y-[-1px] transition-all">Commit to Blockchain</button>
                  </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
