import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Search, 
  Plus, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Beaker,
  MoreVertical,
  ArrowRight,
  Info
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../AuthContext';
import { ProductionOrder, Product } from '../../types/erp';
import { manufacturingService } from '../../services/manufacturingService';

interface Props {
  orders: ProductionOrder[];
}

export default function ProductionOrderWorkflow({ orders }: Props) {
  const { erpUser } = useAuth();
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1000);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!erpUser?.tenantId) return;
    const q = query(collection(db, 'products'), where('tenantId', '==', erpUser.tenantId));
    const unsub = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });
    return () => unsub();
  }, [erpUser?.tenantId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !erpUser?.tenantId) return;
    
    setSubmitting(true);
    try {
      const prod = products.find(p => p.id === selectedProduct);
      await manufacturingService.createProductionOrder(selectedProduct, prod?.name || 'Unknown', quantity, erpUser.tenantId);
      setShowNewOrder(false);
      setSelectedProduct('');
      setQuantity(1000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (poId: string, batchId: string, currentStatus: string) => {
    let nextStatus: ProductionOrder['status'] = 'planned';
    if (currentStatus === 'planned') nextStatus = 'blending';
    else if (currentStatus === 'blending') nextStatus = 'qc_pending';
    else return;

    try {
      await manufacturingService.updatePOStatus(poId, batchId, nextStatus);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = orders.filter(o => o.productName.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-3 border border-brand-border rounded-lg shadow-sm">
         <div className="flex items-center gap-3">
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
               <input 
                 type="text" 
                 placeholder="Search Order ID or Product..."
                 className="pl-10 pr-4 py-2 bg-brand-bg border border-brand-border rounded text-[11px] font-bold w-64 focus:ring-1 ring-brand-accent/30 outline-none"
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
               />
            </div>
         </div>
         <button 
           onClick={() => setShowNewOrder(true)}
           className="bg-brand-sidebar text-white px-4 py-2 rounded font-black text-[10px] uppercase tracking-wider flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-lg shadow-brand-sidebar/10"
         >
            <Plus className="w-4 h-4" /> Start Production
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         {filtered.reverse().map((order) => (
           <div key={order.id} className="card relative flex flex-col group hover:shadow-xl transition-all border-l-4 border-l-brand-accent">
              <div className="flex justify-between items-start mb-4">
                 <div className="p-2 bg-brand-bg rounded">
                    <Beaker className="w-5 h-5 text-brand-accent" />
                 </div>
                 <div className="text-right">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                       order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                       order.status === 'qc_pending' ? 'bg-amber-100 text-amber-700' :
                       order.status === 'qc_failed' ? 'bg-red-100 text-red-700' :
                       'bg-blue-100 text-blue-700'
                    }`}>
                       {order.status}
                    </span>
                    <div className="text-[9px] font-mono font-bold text-brand-text-muted mt-1 uppercase tracking-widest">{order.startDate.split('T')[0]}</div>
                 </div>
              </div>

              <div className="flex-1 mb-6">
                 <h3 className="text-sm font-black uppercase tracking-tight leading-tight group-hover:text-brand-accent transition-colors">{order.productName}</h3>
                 <div className="flex items-center gap-4 mt-2">
                    <div className="flex flex-col">
                       <span className="text-[9px] font-bold text-brand-text-muted uppercase">Batch ID</span>
                       <span className="text-[10px] font-black font-mono">B-{order.batchId.slice(0, 8)}</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[9px] font-bold text-brand-text-muted uppercase">Target Vol</span>
                       <span className="text-[10px] font-black font-mono">{order.requestedQuantity} L</span>
                    </div>
                 </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-brand-border">
                 <div className="flex -space-x-1.5 overflow-hidden">
                    <div className="inline-block h-6 w-6 rounded-full border-2 border-white bg-slate-200"></div>
                 </div>
                 
                 {['planned', 'blending'].includes(order.status) && (
                    <button 
                      onClick={() => updateStatus(order.id, order.batchId, order.status)}
                      className="px-4 py-1.5 bg-brand-sidebar text-white text-[9px] font-black uppercase rounded hover:bg-brand-accent transition-all flex items-center gap-2"
                    >
                       {order.status === 'planned' ? 'Start Blending' : 'Move to QC'} <ArrowRight className="w-3 h-3" />
                    </button>
                 )}

                 {order.status === 'qc_pending' && (
                    <div className="flex items-center gap-1.5 text-warning font-black text-[9px] uppercase">
                       <Clock className="w-3.5 h-3.5 animate-spin" /> Awaiting Lab
                    </div>
                 )}

                 {order.status === 'completed' && (
                    <div className="flex items-center gap-1.5 text-success font-black text-[9px] uppercase">
                       <CheckCircle2 className="w-3.5 h-3.5" /> Fulfilled
                    </div>
                 )}
              </div>
           </div>
         ))}
      </div>

      {showNewOrder && (
        <div className="fixed inset-0 bg-brand-sidebar/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden border border-brand-border">
              <form onSubmit={handleCreate}>
                 <div className="px-6 py-4 border-b border-brand-border bg-slate-50 flex justify-between items-center">
                    <h3 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-3">
                       <Plus className="w-4 h-4 text-brand-accent" /> Configure Production Order
                    </h3>
                    <button type="button" onClick={() => setShowNewOrder(false)} className="text-brand-text-muted hover:text-black">✕</button>
                 </div>
                 <div className="p-6 space-y-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-brand-text-muted">Target Product Formulation</label>
                       <select 
                          required
                          className="w-full bg-brand-bg border border-brand-border px-4 py-2 rounded text-[11px] font-bold focus:ring-1 ring-brand-accent/30 outline-none"
                          value={selectedProduct}
                          onChange={(e) => setSelectedProduct(e.target.value)}
                       >
                          <option value="">Select Formulation...</option>
                          {products.map(p => (
                             <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                          ))}
                       </select>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-brand-text-muted">Batch Size (Liters)</label>
                       <input 
                          type="number" 
                          required
                          min={200}
                          step={100}
                          className="w-full bg-brand-bg border border-brand-border px-4 py-2 rounded text-[11px] font-bold focus:ring-1 ring-brand-accent/30 outline-none"
                          value={quantity}
                          onChange={(e) => setQuantity(Number(e.target.value))}
                       />
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex gap-3">
                       <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                       <p className="text-[9px] font-bold text-blue-700 leading-normal uppercase">
                          BOM raw materials will be automatically reserved from system inventory upon confirmation. 
                       </p>
                    </div>
                 </div>
                 <div className="p-6 bg-slate-50 border-t border-brand-border">
                    <button 
                       disabled={submitting}
                       className="w-full py-3 bg-brand-sidebar text-white font-black text-[11px] uppercase tracking-wider rounded shadow-xl shadow-brand-sidebar/20 hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                    >
                       {submitting ? 'Authenticating & Allocating...' : 'Authorize Production Run'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
