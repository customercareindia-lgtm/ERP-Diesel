import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Droplet, Factory, Truck, BarChart3, ShieldCheck, ChevronRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans selection:bg-brand-sidebar selection:text-white">
      {/* Dynamic Grid Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `linear-gradient(var(--color-brand-sidebar) 1px, transparent 1px), linear-gradient(90deg, var(--color-brand-sidebar) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

      <nav className="relative z-10 flex items-center justify-between p-4 border-b border-brand-border bg-white/80 backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-brand-sidebar rounded">
            <Droplet className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-extrabold uppercase tracking-tight">LubriERP <span className="text-brand-accent">Pro</span></span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-[10px] font-bold uppercase tracking-tight">
          <a href="#features" className="hover:text-brand-accent transition-all">Features</a>
          <a href="#compliance" className="hover:text-brand-accent transition-all">Compliance</a>
          <Link to="/admin" className="px-5 py-2 bg-brand-sidebar text-white hover:bg-zinc-800 transition-all rounded font-bold">Launch Console</Link>
        </div>
      </nav>

      <main className="relative z-10 px-6 py-20 max-w-7xl mx-auto">
        <header className="mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-3 py-1 mb-6 border border-brand-border rounded text-[10px] font-bold uppercase tracking-widest bg-white shadow-sm"
          >
            v1.0 // Production Ready // ISO 9001
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black leading-[0.9] mb-8 tracking-tighter uppercase"
          >
            Efficiency <br />
            Is the <br />
            Ultimate <br />
            Substance.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="max-w-xl text-lg text-brand-text-muted font-medium leading-relaxed"
          >
            Tailored exclusively for lubricant manufacturers and wholesale distributors. 
            From multi-level BOM to AI demand forecasting in a high-density environment.
          </motion.p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-20 text-brand-text">
          {[
            { icon: Factory, title: "Manufacturing", desc: "Batch tracking, multi-level BOM, and QC pass/fail workflow." },
            { icon: Truck, title: "Logistics", desc: "LR management, E-way bill auto-gen, and POD tracking." },
            { icon: BarChart3, title: "Intelligence", desc: "AI-driven demand forecasting and real-time BI dashboards." },
            { icon: ShieldCheck, title: "Compliance", desc: "Indian GST, E-invoice, and tamper-proof audit trails." }
          ].map((feature, idx) => (
            <motion.div 
              key={idx}
              className="card group hover:border-brand-accent hover:bg-white transition-all cursor-default"
            >
              <feature.icon className="w-8 h-8 mb-6 text-brand-accent opacity-60 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-sm font-extrabold uppercase mb-2 tracking-tight">{feature.title}</h3>
              <p className="text-[11px] text-brand-text-muted leading-relaxed font-mono uppercase">{feature.desc}</p>
            </motion.div>
          ))}
        </section>

        <section className="border-t border-brand-border pt-20 grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-4xl font-extrabold uppercase mb-12 tracking-tight">Market Focused</h2>
            <div className="space-y-6">
              {[
                "Automatic CGST/SGST/IGST Calculation based on HSN",
                "Direct API Integration for E-Invoice QR Generation",
                "Multi-Warehouse Inventory Control",
                "Salesman Beat Planning & GPS Verification",
                "Bill-wise Outstanding Aging Analytics"
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4 items-center group">
                  <span className="font-mono text-[10px] text-brand-accent font-bold">0{idx + 1} //</span>
                  <span className="text-lg font-bold uppercase group-hover:pl-2 transition-all">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-brand-sidebar text-white p-12 flex flex-col justify-between overflow-hidden relative rounded-lg">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 opacity-20" />
            
            <div className="relative z-10">
              <span className="font-mono text-[10px] tracking-widest text-white/40 uppercase mb-8 block">Ready for scale?</span>
              <p className="text-2xl font-bold leading-tight mb-12 tracking-tight">
                Built to handle up to 200 concurrent users with enterprise-grade data synchronization.
              </p>
            </div>
            
            <Link to="/admin" className="flex items-center justify-between group py-4 border-t border-white/10">
              <span className="text-4xl font-black uppercase group-hover:text-brand-accent transition-all">Launch Console</span>
              <ChevronRight className="w-10 h-10 group-hover:translate-x-2 transition-transform text-white/40" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="p-8 border-t border-brand-border flex flex-col md:flex-row justify-between items-center gap-6 font-bold text-[10px] uppercase tracking-tight text-brand-text-muted bg-white">
        <div>© 2026 LubriERP Pro Architecture // High Density Engine</div>
        <div className="flex gap-8">
          <a href="#" className="hover:text-brand-accent">Privacy</a>
          <a href="#" className="hover:text-brand-accent">Terms</a>
          <a href="#" className="hover:text-brand-accent">SLA Agreement</a>
        </div>
      </footer>
    </div>
  );
}
