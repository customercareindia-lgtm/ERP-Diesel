import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { 
  ShieldAlert, 
  Building2, 
  Users, 
  Settings, 
  Activity, 
  LogOut,
  ChevronRight,
  Database,
  Lock,
  Zap,
  HardDrive
} from 'lucide-react';
import { motion } from 'motion/react';
import { auth } from '../../firebase';

export default function SuperAdminDashboard() {
  return (
    <div className="min-h-screen bg-brand-sidebar text-white font-sans selection:bg-brand-accent selection:text-white">
      <div className="flex h-screen overflow-hidden">
        {/* Rail Sidebar */}
        <aside className="w-16 bg-black/20 border-r border-white/5 flex flex-col items-center py-6 justify-between shrink-0">
            <Link to="/super" className="p-2 bg-brand-accent rounded text-white shadow-lg shadow-brand-accent/20">
                <ShieldAlert className="w-5 h-5" />
            </Link>
            <nav className="flex flex-col gap-6 text-white/30">
                <Building2 className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
                <Users className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
                <Database className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
                <Activity className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
            </nav>
            <button onClick={() => auth.signOut()} className="text-white/20 hover:text-danger transition-colors">
                <LogOut className="w-5 h-5" />
            </button>
        </aside>

        <main className="flex-1 overflow-y-auto p-8 lg:p-16">
            <header className="mb-16 flex justify-between items-start">
                <div>
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[9px] font-bold text-brand-accent uppercase tracking-[0.4em] mb-4">Core // Super Admin Engine</motion.div>
                   <h1 className="text-6xl lg:text-8xl font-black uppercase leading-[0.85] tracking-tighter">Cloud <br /> Core <br /> Console.</h1>
                </div>
                <div className="flex gap-6 font-mono text-[10px] uppercase font-bold tracking-widest text-white/40">
                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" /> Nodes Online</div>
                    <div className="flex items-center gap-2 border-b border-brand-accent pb-1">SLC: Enterprise</div>
                </div>
            </header>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
                <div className="p-10 bg-white/5 border border-white/10 hover:border-brand-accent/40 rounded transition-all group cursor-pointer aspect-video flex flex-col justify-between overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 opacity-10" />
                    <div className="flex justify-between items-start relative z-10">
                        <Lock className="w-10 h-10 text-brand-accent opacity-50 group-hover:opacity-100 transition-opacity" />
                        <span className="text-6xl font-black opacity-5 group-hover:opacity-10 transition-opacity">01</span>
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-2xl font-extrabold uppercase mb-2 tracking-tight">Tenant Federation</h3>
                        <p className="font-mono text-white/40 uppercase text-[10px] leading-tight max-w-sm">
                            Manage multi-company instances. Provision modules, billing, and root API access.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                   <div className="p-8 bg-white/5 border border-white/10 rounded flex flex-col justify-between group cursor-pointer hover:bg-white/[0.08] transition-all">
                       <Zap className="w-6 h-6 text-brand-accent" />
                       <div>
                           <span className="text-4xl font-black font-mono">4.2M</span>
                           <span className="block text-[10px] font-bold text-white/30 uppercase mt-2 tracking-tight">API Requests Today</span>
                       </div>
                   </div>
                   <div className="p-8 bg-white/5 border border-white/10 rounded flex flex-col justify-between group cursor-pointer hover:bg-white/[0.08] transition-all">
                       <HardDrive className="w-6 h-6 text-brand-accent" />
                       <div>
                           <span className="text-4xl font-black font-mono tracking-tighter">99.9%</span>
                           <span className="block text-[10px] font-bold text-white/30 uppercase mt-2 tracking-tight">Core Slatement</span>
                       </div>
                   </div>
                </div>
            </section>

            <section className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase text-white/30 tracking-widest mb-8">Infrastructure Health</h4>
                {[
                    { node: 'AP-SOUTH-1', load: '12%', status: 'STABLE' },
                    { node: 'EU-CENTRAL-1', load: '45%', status: 'SCALING' },
                    { node: 'US-EAST-1', load: '88%', status: 'HIGH_LOAD' },
                ].map((node, i) => (
                    <div key={i} className="p-5 bg-white/5 border border-white/10 rounded flex justify-between items-center group hover:bg-white/[0.08] transition-all">
                        <div className="flex items-center gap-6">
                            <span className="font-mono text-white/20 text-[10px]">0{i+1} //</span>
                            <span className="text-xl font-bold uppercase tracking-tight">{node.node}</span>
                        </div>
                        <div className="flex gap-12 items-center font-mono text-[10px] uppercase">
                             <div className="flex flex-col items-end">
                                <span className="text-white/30 mb-0.5 tracking-tight">Compute</span>
                                <span className="font-bold">{node.load}</span>
                             </div>
                             <div className="flex flex-col items-end">
                                <span className="text-white/30 mb-0.5 tracking-tight">Status</span>
                                <span className={node.status === 'STABLE' ? 'text-success' : 'text-brand-accent'}>{node.status}</span>
                             </div>
                        </div>
                    </div>
                ))}
            </section>
        </main>
      </div>
    </div>
  );
}
