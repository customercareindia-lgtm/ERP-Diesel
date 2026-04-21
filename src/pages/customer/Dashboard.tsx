import React from 'react';
import { 
  FileText, 
  Package, 
  CreditCard, 
  Download, 
  ExternalLink,
  LifeBuoy,
  LogOut,
  ChevronRight,
  TrendingUp,
  Droplet
} from 'lucide-react';
import { auth } from '../../firebase';

export default function CustomerDashboard() {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans selection:bg-brand-sidebar selection:text-white">
      <nav className="p-4 border-b border-brand-border flex justify-between items-center bg-white sticky top-0 z-20">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-brand-sidebar rounded grid place-items-center">
             <Droplet className="w-4 h-4 text-white" />
           </div>
           <span className="text-lg font-extrabold uppercase tracking-tight">Dealer <span className="text-brand-accent">Portal</span></span>
        </div>
        <div className="flex items-center gap-6">
            <span className="hidden md:block font-mono text-[9px] uppercase tracking-widest font-bold border-r pr-6 border-brand-border">ID: DL-8841 // Welcome, Reliance Motors</span>
            <button onClick={() => auth.signOut()} className="flex items-center gap-2 font-mono text-[10px] uppercase font-bold text-danger hover:opacity-70 transition-opacity">
                <LogOut className="w-4 h-4" /> End Session
            </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 p-8 bg-brand-sidebar text-white rounded relative overflow-hidden group">
                <div className="relative z-10">
                    <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/40 mb-6 block">Total Outstanding Amount</span>
                    <h2 className="text-5xl md:text-6xl font-extrabold mb-4 tracking-tighter">₹1,12,450.00</h2>
                    <div className="flex flex-wrap gap-4 mt-10">
                        <button className="px-6 py-3 bg-brand-accent text-white font-bold uppercase text-[11px] tracking-widest flex items-center gap-3 hover:translate-y-[-1px] transition-all rounded shadow-lg shadow-brand-accent/20">
                            <CreditCard className="w-4 h-4" /> Pay Now
                        </button>
                        <button className="px-6 py-3 border border-white/20 font-bold uppercase text-[11px] tracking-widest flex items-center gap-3 hover:bg-white/5 transition-all text-white/60 rounded">
                           <FileText className="w-4 h-4" /> Get Statement
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-8 border border-brand-border rounded flex flex-col justify-between bg-white shadow-sm">
                 <div className="flex justify-between items-start mb-6">
                    <span className="text-[10px] font-bold uppercase text-brand-text-muted">Loyalty Status</span>
                    <TrendingUp className="w-5 h-5 text-success" />
                 </div>
                 <div>
                    <span className="text-3xl font-extrabold uppercase leading-none tracking-tighter">92 <span className="text-brand-text-muted text-sm tracking-normal">/100</span></span>
                    <p className="font-mono text-[10px] mt-2 uppercase text-success font-bold tracking-widest">A+ Tier Loyalty</p>
                 </div>
                 <div className="mt-8 space-y-2">
                    <div className="flex justify-between font-mono text-[9px] uppercase font-bold text-brand-text-muted">
                        <span>Limit: ₹5.0L</span>
                    </div>
                    <div className="h-1.5 bg-brand-bg rounded-full overflow-hidden border border-brand-border">
                        <div className="w-[20%] h-full bg-brand-sidebar" />
                    </div>
                 </div>
            </div>
        </section>

        <section className="card !p-0 overflow-hidden">
             <div className="px-6 py-3 border-b border-brand-border flex justify-between items-center bg-slate-50">
                <h3 className="text-sm font-bold uppercase tracking-tight">Recent Activity & Orders</h3>
                <button className="text-[9px] font-bold uppercase text-brand-accent hover:underline decoration-2">View Global History</button>
             </div>
             <div className="overflow-x-auto">
                <table className="data-table">
                    <thead className="bg-brand-sidebar text-white uppercase text-[9px] tracking-widest">
                        <tr>
                            <th className="px-6 py-3 font-bold">Order #</th>
                            <th className="px-6 py-3 font-bold">Date</th>
                            <th className="px-6 py-3 font-bold text-center">Status</th>
                            <th className="px-6 py-3 font-bold">Amount</th>
                            <th className="px-6 py-3 text-right">Documents</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-bg">
                        {[
                            { id: 'SO-26-0044', date: 'APR 12, 2026', status: 'SHIPPED', amount: '₹14,500' },
                            { id: 'SO-26-0045', date: 'APR 15, 2026', status: 'PROCESSING', amount: '₹42,200' },
                            { id: 'SO-26-0041', date: 'APR 05, 2026', status: 'DELIVERED', amount: '₹8,900' },
                        ].map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50 transition-colors uppercase">
                                <td className="px-6 py-4 font-bold text-brand-accent font-mono">{row.id}</td>
                                <td className="px-6 py-4 text-brand-text-muted font-mono">{row.date}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`status-pill px-2 py-0.5 rounded-full font-bold text-[9px] ${row.status === 'DELIVERED' ? 'pill-green' : 'pill-orange'}`}>
                                        {row.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-bold font-mono">{row.amount}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button className="p-1.5 hover:bg-brand-sidebar hover:text-white transition-all border border-brand-border rounded" title="Download Invoice"><Download className="w-3 h-3" /></button>
                                        <button className="p-1.5 hover:bg-brand-sidebar hover:text-white transition-all border border-brand-border rounded" title="Track Shipment"><ExternalLink className="w-3 h-3" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-12">
            {[
                { icon: Package, title: "Product Catalog", desc: "Browse latest additives & gear oils" },
                { icon: LifeBuoy, title: "Support Ticket", desc: "Speak with your territory manager" },
                { icon: Download, title: "Compliance Doc", desc: "Get SDS & CoA certificates" },
                { icon: CreditCard, title: "Manage Rewards", desc: "Check loyalty points balance" }
            ].map((box, i) => (
                <div key={i} className="card hover:border-brand-accent flex flex-col justify-between aspect-square group cursor-pointer transition-all">
                    <box.icon className="w-6 h-6 text-brand-text-muted group-hover:text-brand-accent transition-colors" />
                    <div>
                        <h4 className="font-extrabold uppercase text-[11px] mb-1">{box.title}</h4>
                        <p className="text-[10px] text-brand-text-muted leading-tight">{box.desc}</p>
                    </div>
                </div>
            ))}
        </section>
      </main>
    </div>
  );
}
