import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Search, 
  X, 
  Info, 
  ShoppingBag,
  Calculator,
  Scan,
  UserPlus,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../AuthContext';
import { salesService } from '../../services/salesService';
import { inventoryService } from '../../services/inventoryService';
import { Product, Customer } from '../../types/erp';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

interface Props {
  onClose: () => void;
}

export default function CreateOrderModal({ onClose }: Props) {
  const { erpUser } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!erpUser?.tenantId) return;
    
    const unsubCust = salesService.subscribeToCustomers(erpUser.tenantId, setCustomers);
    const qProd = query(collection(db, 'products'), where('tenantId', '==', erpUser.tenantId));
    const unsubProd = onSnapshot(qProd, (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    });

    return () => {
      unsubCust();
      unsubProd();
    };
  }, [erpUser?.tenantId]);

  const addItem = () => {
    setItems([...items, { productId: '', quantity: 1, price: 0, name: '', sku: '' }]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    if (field === 'productId') {
      const p = products.find(prod => prod.id === value);
      if (p) {
        newItems[index] = { ...newItems[index], productId: p.id, name: p.name, sku: p.sku, price: p.sellingPrice };
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || items.length === 0 || !erpUser?.tenantId) return;

    setSubmitting(true);
    try {
      const customer = customers.find(c => c.id === selectedCustomerId);
      await salesService.createSalesOrder({
        orderNumber: `SO-${Date.now().toString().slice(-6)}`,
        customerId: selectedCustomerId,
        customerName: customer?.name || 'Unknown',
        subtotal,
        taxAmount: tax,
        discountAmount: 0,
        totalAmount: total,
        status: 'confirmed',
        items: items,
        tenantId: erpUser.tenantId
      });
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-sidebar/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
       <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-brand-border flex flex-col max-h-[90vh]">
          <div className="px-6 py-5 border-b border-brand-border bg-slate-50 flex justify-between items-center shrink-0">
             <div>
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                   <Plus className="w-5 h-5 text-brand-accent" /> Configure Sales Manifest
                </h3>
                <p className="text-[9px] font-bold text-brand-text-muted mt-0.5 uppercase tracking-tighter italic">Batch ID: {Math.random().toString(36).substring(7).toUpperCase()}</p>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
             <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Section 1: Entity Mapping */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-brand-text-muted flex items-center gap-2">
                        <Users className="w-3.5 h-3.5" /> Target Customer Portfolio
                      </label>
                      <div className="flex gap-2">
                        <select 
                           required
                           className="flex-1 bg-brand-bg border border-brand-border px-4 py-3 rounded-lg text-[12px] font-bold outline-none focus:ring-2 ring-brand-accent/20 transition-all font-mono"
                           value={selectedCustomerId}
                           onChange={(e) => setSelectedCustomerId(e.target.value)}
                        >
                           <option value="">Select B2B Channel Partner...</option>
                           {customers.map(c => (
                              <option key={c.id} value={c.id}>{c.name} // {c.city}</option>
                           ))}
                        </select>
                        <button type="button" className="p-3 border border-brand-border rounded-lg bg-white hover:bg-slate-50 transition-colors">
                           <UserPlus className="w-4 h-4 text-brand-accent" />
                        </button>
                      </div>
                   </div>
                   <div className="p-4 bg-brand-sidebar text-white rounded-xl flex items-center gap-4 relative overflow-hidden">
                      <div className="relative z-10 w-10 h-10 rounded-full bg-brand-accent/20 flex items-center justify-center text-brand-accent font-black">
                         <Scan className="w-5 h-5" />
                      </div>
                      <div className="relative z-10">
                         <div className="text-[10px] font-black uppercase opacity-40">System Availability Check</div>
                         <div className="text-[11px] font-bold">Real-time inventory lock protocol active. Multi-line items supported.</div>
                      </div>
                      <Calculator className="absolute -right-4 -bottom-4 w-20 h-20 opacity-[0.05]" />
                   </div>
                </div>

                {/* Section 2: Line Items */}
                <div className="space-y-4">
                   <div className="flex justify-between items-center">
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-brand-text-muted flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4" /> SKU Line Selection
                      </h4>
                      <button 
                        type="button" 
                        onClick={addItem}
                        className="text-[10px] font-black uppercase text-brand-accent hover:underline flex items-center gap-1.5"
                      >
                         <Plus className="w-3.5 h-3.5" /> Append Row
                      </button>
                   </div>
                   
                   <div className="space-y-2">
                      {items.map((item, index) => (
                        <motion.div 
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex gap-3 items-end p-4 bg-slate-50 border border-brand-border rounded-xl group relative hover:border-brand-accent/50 transition-all"
                        >
                           <div className="flex-1 space-y-1.5">
                              <label className="text-[9px] font-black uppercase text-brand-text-muted ml-1">Product Catalog Selection</label>
                              <select 
                                 required
                                 className="w-full bg-white border border-brand-border px-3 py-2 rounded-lg text-[11px] font-black outline-none focus:ring-1 ring-brand-accent/20"
                                 value={item.productId}
                                 onChange={(e) => updateItem(index, 'productId', e.target.value)}
                              >
                                 <option value="">Search Master SKU...</option>
                                 {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.sku}) // ₹{p.sellingPrice}/U</option>
                                 ))}
                              </select>
                           </div>
                           <div className="w-24 space-y-1.5">
                              <label className="text-[9px] font-black uppercase text-brand-text-muted ml-1">Quantity</label>
                              <input 
                                 type="number" 
                                 min={1}
                                 required
                                 className="w-full bg-white border border-brand-border px-3 py-2 rounded-lg text-[11px] font-black font-mono outline-none"
                                 value={item.quantity}
                                 onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                              />
                           </div>
                           <div className="w-32 space-y-1.5">
                              <label className="text-[9px] font-black uppercase text-brand-text-muted ml-1">Unit Price</label>
                              <div className="relative">
                                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-30 italic">₹</span>
                                 <input 
                                    type="number" 
                                    readOnly
                                    className="w-full bg-white/50 border border-brand-border pl-7 pr-3 py-2 rounded-lg text-[11px] font-black font-mono outline-none text-brand-text-muted"
                                    value={item.price}
                                 />
                              </div>
                           </div>
                           <div className="w-32 space-y-1.5">
                              <label className="text-[9px] font-black uppercase text-brand-text-muted ml-1">Subtotal (L)</label>
                              <div className="w-full bg-white border border-brand-border px-3 py-2 rounded-lg text-[11px] font-black font-mono text-right italic">
                                 ₹{(item.price * item.quantity).toLocaleString()}
                              </div>
                           </div>
                           <button 
                             type="button" 
                             onClick={() => removeItem(index)}
                             className="p-2.5 text-danger hover:bg-red-50 rounded-lg transition-colors group-hover:bg-red-50"
                           >
                              <Trash2 className="w-4 h-4" />
                           </button>
                        </motion.div>
                      ))}
                      {items.length === 0 && (
                        <div className="py-12 border-2 border-dashed border-brand-border rounded-2xl flex flex-col items-center justify-center gap-3 bg-slate-50/50">
                           <ShoppingBag className="w-10 h-10 text-brand-text-muted opacity-20" />
                           <p className="text-[11px] font-black uppercase tracking-widest text-brand-text-muted opacity-40 italic">Empty Order Manifest // Add SKUs to Proceed</p>
                           <button 
                              type="button" 
                              onClick={addItem}
                              className="px-6 py-2 bg-brand-sidebar text-brand-accent text-[10px] font-black uppercase tracking-wider rounded-lg hover:text-white transition-all border border-brand-accent/20"
                           >
                              Initiate First Line Item
                           </button>
                        </div>
                      )}
                   </div>
                </div>
             </div>

             {/* Footer summary */}
             <div className="bg-slate-900 border-t border-brand-border p-8 shrink-0 flex justify-between items-center text-white relative">
                <div className="flex gap-8">
                   <div className="text-center md:text-left px-6 border-r border-white/5 last:border-0 first:pl-0">
                      <div className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-1">Items Net</div>
                      <div className="text-lg font-black font-mono tracking-tighter italic">₹{subtotal.toLocaleString()}</div>
                   </div>
                   <div className="text-center md:text-left px-6 border-r border-white/5 last:border-0">
                      <div className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-1">GST Tax (18%)</div>
                      <div className="text-lg font-black font-mono tracking-tighter italic text-brand-accent">₹{tax.toLocaleString()}</div>
                   </div>
                   <div className="text-center md:text-left px-6 border-r border-white/5 last:border-0">
                      <div className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-1">Fiscal Total</div>
                      <div className="text-2xl font-black font-mono tracking-tighter italic shadow-sm">₹{total.toLocaleString()}</div>
                   </div>
                </div>

                <div className="flex gap-3">
                   <button 
                      type="button" 
                      onClick={onClose}
                      className="px-6 py-3 border border-white/10 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-white/5 transition-all text-white/60"
                   >
                      Abort
                   </button>
                   <button 
                      disabled={submitting || items.length === 0}
                      className={`px-8 py-3 bg-brand-accent text-white rounded-xl text-[11px] font-black uppercase tracking-wider shadow-2xl shadow-brand-accent/20 transition-all flex items-center gap-2 transform active:scale-95 ${
                        (submitting || items.length === 0) ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:bg-brand-accent/90'
                      }`}
                   >
                      {submitting ? 'Verifying Stock & Committing...' : 'Finalize & Reserve Stock'}
                      <Check className="w-4 h-4" />
                   </button>
                </div>
                
                {/* Visual Accent */}
                <Calculator className="absolute right-0 top-1/2 -translate-y-1/2 w-48 h-48 opacity-[0.02] rotate-12 pointer-events-none" />
             </div>
          </form>
       </div>
    </div>
  );
}

function Check({ className }: { className?: string }) {
   return (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
   );
}
