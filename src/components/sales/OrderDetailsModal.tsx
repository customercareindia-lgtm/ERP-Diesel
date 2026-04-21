import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle2, 
  Truck, 
  ArrowRight,
  Printer,
  FileDown,
  AlertTriangle,
  History,
  Box,
  ShoppingCart,
  FileText
} from 'lucide-react';
import { SalesOrder, Inventory, Invoice } from '../../types/erp';
import { salesService } from '../../services/salesService';

interface Props {
  order: SalesOrder;
  onClose: () => void;
}

export default function OrderDetailsModal({ order, onClose }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    // Ideally we'd subscribe to this specific order's invoices
    const unsub = salesService.subscribeToInvoices(order.tenantId, (all) => {
      setInvoices(all.filter(i => i.orderId === order.id));
    });
    return () => unsub();
  }, [order.id]);

  const handleStatusChange = async (newStatus: SalesOrder['status']) => {
    setSubmitting(true);
    try {
      await salesService.updateOrderStatus(order.id, newStatus);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getNextStatus = () => {
    switch (order.status) {
      case 'draft': return 'confirmed';
      case 'confirmed': return 'shipped';
      case 'shipped': return 'delivered';
      case 'delivered': return 'completed';
      default: return null;
    }
  };

  const nextStatus = getNextStatus();

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
       <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden border border-brand-border flex flex-col">
          {/* Header Panel */}
          <div className="bg-slate-900 px-8 py-6 text-white flex justify-between items-center shrink-0">
             <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-brand-accent/20 rounded-2xl flex items-center justify-center text-brand-accent shadow-inner">
                   <ShoppingCart className="w-8 h-8" />
                </div>
                <div>
                   <h2 className="text-2xl font-black uppercase tracking-tighter">Manifest: #{order.orderNumber}</h2>
                   <div className="flex items-center gap-4 mt-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                        order.status === 'completed' ? 'bg-emerald-500 text-white' : 
                        order.status === 'cancelled' ? 'bg-red-500 text-white' : 'bg-brand-accent text-white'
                      }`}>
                         PROTOCOL: {order.status}
                      </span>
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{new Date(order.createdAt).toLocaleString()}</span>
                   </div>
                </div>
             </div>
             <div className="flex items-center gap-3">
                <button className="p-2.5 border border-white/10 rounded-xl hover:bg-white/5 transition-all outline-none">
                   <Printer className="w-5 h-5 text-white/60" />
                </button>
                <button onClick={onClose} className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
                   <X className="w-5 h-5" />
                </button>
             </div>
          </div>

          <div className="flex-1 overflow-hidden flex divide-x divide-brand-border">
             {/* Left Panel: Detailed Ledger */}
             <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* 1. Entity Context */}
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <h4 className="text-[11px] font-black uppercase text-brand-text-muted tracking-widest flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Ship-to Entity Profile
                      </h4>
                      <div className="p-5 bg-brand-bg border border-brand-border rounded-2xl">
                         <div className="text-sm font-black uppercase tracking-tight mb-2 italic">{order.customerName}</div>
                         <div className="space-y-1.5 opacity-60">
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"><Phone className="w-3 h-3" /> +91 98XXX-XXXXX</div>
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"><Mail className="w-3 h-3" /> dispatch@{order.customerName.toLowerCase().replace(/\s/g, '')}.com</div>
                         </div>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <h4 className="text-[11px] font-black uppercase text-brand-text-muted tracking-widest flex items-center gap-2">
                        <Truck className="w-4 h-4" /> Logistical Status
                      </h4>
                      <div className="p-5 border border-brand-border border-dashed rounded-2xl flex flex-col justify-center items-center text-center group hover:bg-slate-50 transition-all cursor-default">
                         {order.status === 'confirmed' ? (
                           <>
                              <Box className="w-8 h-8 text-brand-accent animate-bounce mb-3" />
                              <div className="text-[10px] font-black uppercase tracking-widest">Awaiting Warehouse Picker</div>
                              <p className="text-[9px] font-bold opacity-40 uppercase mt-1">Inventory reserved & validated</p>
                           </>
                         ) : order.status === 'shipped' ? (
                           <>
                              <Truck className="w-8 h-8 text-brand-accent animate-pulse mb-3" />
                              <div className="text-[10px] font-black uppercase tracking-widest">In-Transit Flow Active</div>
                              <p className="text-[9px] font-bold opacity-40 uppercase mt-1">Deduct protocol complete</p>
                           </>
                         ) : (
                           <>
                              <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-3" />
                              <div className="text-[10px] font-black uppercase tracking-widest">Lifecycle Terminated</div>
                              <p className="text-[9px] font-bold opacity-40 uppercase mt-1">Audit ledger immutable</p>
                           </>
                         )}
                      </div>
                   </div>
                </div>

                {/* 2. Line Items Table */}
                <div className="space-y-4">
                   <h4 className="text-[11px] font-black uppercase text-brand-text-muted tracking-widest">Consolidated Itemization</h4>
                   <div className="border border-brand-border rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-left">
                         <thead className="bg-slate-50 border-b border-brand-border font-black text-[9px] text-brand-text-muted uppercase tracking-widest">
                            <tr>
                               <th className="px-5 py-3">SKU Identifier</th>
                               <th className="px-5 py-3">Description</th>
                               <th className="px-5 py-3 text-right">Qty</th>
                               <th className="px-5 py-3 text-right">Unit Net</th>
                               <th className="px-5 py-3 text-right">Total Net</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-brand-bg">
                            {order.items.map((item, i) => (
                              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                 <td className="px-5 py-3 font-mono text-[10px] font-black text-brand-accent">{item.sku}</td>
                                 <td className="px-5 py-3 text-[11px] font-black uppercase tracking-tight italic">{item.name}</td>
                                 <td className="px-5 py-3 text-right font-black font-mono text-[11px] italic">{item.quantity}</td>
                                 <td className="px-5 py-3 text-right text-[11px] font-bold opacity-40 font-mono italic">₹{item.price.toLocaleString()}</td>
                                 <td className="px-5 py-3 text-right text-[12px] font-black font-mono tracking-tighter italic shadow-sm">₹{(item.price * item.quantity).toLocaleString()}</td>
                              </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>

                {/* 3. Invoices */}
                {invoices.length > 0 && (
                   <div className="space-y-4">
                      <h4 className="text-[11px] font-black uppercase text-brand-text-muted tracking-widest">Associated Financial Records</h4>
                      <div className="grid grid-cols-1 gap-2">
                         {invoices.map(invoice => (
                           <div key={invoice.id} className="p-4 border border-brand-border rounded-xl flex justify-between items-center group hover:border-brand-accent transition-all cursor-pointer">
                              <div className="flex items-center gap-4">
                                 <div className="p-2 bg-emerald-50 rounded-lg"><FileText className="w-5 h-5 text-emerald-600" /></div>
                                 <div>
                                    <div className="text-[11px] font-black uppercase tracking-tight italic">{invoice.invoiceNumber}</div>
                                    <div className="text-[9px] font-bold text-brand-text-muted uppercase tracking-widest">Issued: {new Date(invoice.createdAt).toLocaleDateString()}</div>
                                 </div>
                              </div>
                              <div className="flex items-center gap-6">
                                 <div className="text-right">
                                    <div className="text-[12px] font-black font-mono italic">₹{invoice.totalAmount.toLocaleString()}</div>
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                       invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-600 animate-pulse'
                                    }`}>{invoice.status}</span>
                                 </div>
                                 <FileDown className="w-4 h-4 text-brand-text-muted opacity-20 group-hover:opacity-100 transition-opacity" />
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                )}
             </div>

             {/* Right Panel: Controls & Summary */}
             <div className="w-96 bg-slate-50 p-8 flex flex-col shrink-0">
                <div className="flex-1 space-y-8">
                   <div>
                      <h4 className="text-[11px] font-black uppercase text-brand-text-muted tracking-widest mb-4">Financial Summary</h4>
                      <div className="space-y-3 bg-white p-6 rounded-2xl border border-brand-border shadow-sm italic font-mono">
                         <div className="flex justify-between text-[11px] font-bold opacity-60">
                            <span>SUBTOTAL NET</span>
                            <span>₹{order.subtotal.toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between text-[11px] font-bold text-brand-accent">
                            <span>TOTAL GST (18%)</span>
                            <span>+₹{order.taxAmount.toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between text-[11px] font-bold text-danger">
                            <span>TOTAL DISCOUNT</span>
                            <span>-₹{order.discountAmount.toLocaleString()}</span>
                         </div>
                         <div className="pt-4 mt-2 border-t border-brand-border flex justify-between items-baseline">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">TOTAL FISCAL</span>
                            <span className="text-2xl font-black tracking-tighter">₹{order.totalAmount.toLocaleString()}</span>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h4 className="text-[11px] font-black uppercase text-brand-text-muted tracking-widest">Workflow Transition</h4>
                      {nextStatus ? (
                        <div className="space-y-3">
                           <div className="p-4 bg-white border border-brand-border rounded-xl flex items-center justify-between group cursor-default">
                              <div className="flex flex-col">
                                 <span className="text-[9px] font-black uppercase text-brand-text-muted opacity-40">Current Flow</span>
                                 <span className="text-[11px] font-black uppercase tracking-tight">{order.status}</span>
                              </div>
                              <ArrowRight className="w-4 h-4 text-brand-accent" />
                              <div className="flex flex-col text-right">
                                 <span className="text-[9px] font-black uppercase text-brand-text-muted opacity-40">Next Objective</span>
                                 <span className="text-[11px] font-black uppercase tracking-tight text-brand-accent">{nextStatus}</span>
                              </div>
                           </div>
                           <button 
                             onClick={() => handleStatusChange(nextStatus)}
                             disabled={submitting}
                             className={`w-full py-4 bg-brand-sidebar text-white rounded-xl font-black text-[11px] uppercase tracking-wider shadow-xl shadow-brand-sidebar/10 transition-all transform active:scale-95 flex items-center justify-center gap-2 group ${
                               submitting ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:bg-zinc-800'
                             }`}
                           >
                              {submitting ? 'Executing Protocol...' : `Authorize ${nextStatus.toUpperCase()}`}
                              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                           </button>
                        </div>
                      ) : (
                        <div className="p-8 border-2 border-dashed border-brand-border rounded-2xl flex flex-col items-center justify-center text-center">
                           <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Lifecycle Completed</span>
                        </div>
                      )}

                      {order.status !== 'cancelled' && order.status !== 'completed' && (
                        <button 
                          onClick={() => handleStatusChange('cancelled')}
                          disabled={submitting}
                          className="w-full py-2 text-danger font-black text-[10px] uppercase tracking-widest hover:bg-red-50 rounded-xl transition-all flex items-center justify-center gap-2 mt-2"
                        >
                           <AlertTriangle className="w-3.5 h-3.5" /> Abort Manifest
                        </button>
                      )}
                   </div>
                </div>

                <div className="mt-8 pt-8 border-t border-brand-border space-y-4">
                   <div className="flex items-center gap-2 text-[10px] font-black uppercase text-brand-text-muted tracking-widest">
                      <History className="w-4 h-4" /> Activity Protocol
                   </div>
                   <div className="space-y-4">
                      {[
                        { time: '10:45 AM', action: 'Manifest Initialized', user: 'SYSTEM' },
                        { time: '11:02 AM', action: 'Stock Reservation Validated', user: 'ADMIN' },
                      ].map((item, i) => (
                        <div key={i} className="flex gap-3 relative pl-4 border-l border-brand-border">
                           <div className="absolute -left-[4.5px] top-1 w-2 h-2 rounded-full bg-brand-border" />
                           <div>
                              <div className="text-[10px] font-black uppercase tracking-tight leading-none">{item.action}</div>
                              <div className="text-[8px] font-bold text-brand-text-muted uppercase mt-1 italic">{item.time} // USER: {item.user}</div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}
