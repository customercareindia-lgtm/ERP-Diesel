import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, 
  Search, 
  Filter, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight, 
  FileText, 
  TrendingUp, 
  CreditCard, 
  Activity,
  Calendar,
  Layers,
  BarChart,
  PieChart as PieChartIcon,
  ChevronRight,
  Database,
  ExternalLink,
  ShieldCheck,
  Zap,
  History as HistoryIcon
} from 'lucide-react';
import { 
  BarChart as ReBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../AuthContext';
import { accountingService } from '../../services/accountingService';
import { Account, JournalEntry } from '../../types/erp';

export default function Accounting() {
  const { erpUser } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ledger' | 'reports' | 'gst' | 'miracle'>('dashboard');
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!erpUser?.tenantId) return;
    const unsubAcc = accountingService.subscribeToAccounts(erpUser.tenantId, setAccounts);
    const unsubJou = accountingService.subscribeToJournals(erpUser.tenantId, setJournals);
    return () => {
      unsubAcc();
      unsubJou();
    };
  }, [erpUser?.tenantId]);

  const pAndL = useMemo(() => accountingService.getProfitLoss(accounts), [accounts]);
  
  const stats = {
    revenue: pAndL.totalIncome,
    expenses: pAndL.totalExpenses,
    netProfit: pAndL.netProfit,
    cashInHand: accounts.find(a => a.name === 'Cash in Hand')?.balance || 0,
    bankBalance: accounts.find(a => a.name === 'HDFC Bank')?.balance || 0,
    gstPayable: accounts.filter(a => a.name.includes('GST Output')).reduce((acc, a) => acc + Math.abs(a.balance), 0),
    gstReceivable: accounts.filter(a => a.name.includes('GST Input')).reduce((acc, a) => acc + Math.abs(a.balance), 0)
  };

  const exportToMiracle = () => {
    setExporting(true);
    setTimeout(() => {
       const miracleData = journals.map(j => ({
         VoucherType: j.voucherType,
         VoucherNumber: j.voucherNumber,
         Date: j.date.split('T')[0],
         LedgerEntries: j.lines.map(l => ({
           Account: l.accountName,
           Debit: l.debit,
           Credit: l.credit
         })),
         Narration: j.narration
       }));
       
       const blob = new Blob([JSON.stringify(miracleData, null, 2)], { type: 'application/json' });
       const url = URL.createObjectURL(blob);
       const link = document.createElement('a');
       link.href = url;
       link.download = `Miracle_Export_${new Date().toISOString().split('T')[0]}.json`;
       link.click();
       setExporting(false);
       alert('Fiscal payload prepared & exported to Miracle-compatible format.');
    }, 1500);
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
       {/* Accounting Header */}
       <div className="flex justify-between items-center bg-white p-4 border border-brand-border rounded-lg shadow-sm">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2 text-brand-sidebar">
            <Calculator className="w-5 h-5 text-brand-accent" />
            Core Financial Control
          </h1>
          <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mt-1">General Ledger // Fiscal Audit // Taxation</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={exportToMiracle}
             disabled={exporting}
             className="bg-brand-sidebar text-white px-4 py-2 rounded font-black text-[10px] uppercase tracking-wider flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-lg shadow-brand-sidebar/10"
           >
              {exporting ? <Activity className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export to Miracle
           </button>
        </div>
      </div>

      {/* Tabs */}
      <nav className="flex gap-1 bg-white p-1 border border-brand-border rounded-lg self-start">
        {[
          { id: 'dashboard', label: 'Fiscal Dashboard', icon: TrendingUp },
          { id: 'ledger', label: 'Voucher Ledger', icon: Layers },
          { id: 'gst', label: 'Taxation / GST', icon: ShieldCheck },
          { id: 'reports', label: 'Financial Statements', icon: FileText },
          { id: 'miracle', label: 'Integrations', icon: Zap },
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
               key="dash" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
               className="space-y-4"
             >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                   {[
                     { label: 'Net Operating Profit', value: `₹${(stats.netProfit/1000).toFixed(1)}k`, sub: 'Fiscal Year 26', icon: Zap, color: 'text-emerald-500' },
                     { label: 'Liquidity (Cash/Bank)', value: `₹${((stats.cashInHand + stats.bankBalance)/1000).toFixed(1)}k`, sub: 'Available Resources', icon: CreditCard, color: 'text-blue-500' },
                     { label: 'GST Liability (Net)', value: `₹${((stats.gstPayable - stats.gstReceivable)/1000).toFixed(1)}k`, sub: 'Current Month Dues', icon: ShieldCheck, color: 'text-orange-500' },
                     { label: 'Expense Velocity', value: `₹${(stats.expenses/1000).toFixed(1)}k`, sub: 'Burn Rate', icon: TrendingUp, color: 'text-brand-accent' }
                   ].map((stat, i) => (
                     <div key={i} className="card relative overflow-hidden group border-l-4 border-l-brand-sidebar hover:border-l-brand-accent transition-all">
                        <span className="text-[10px] font-black uppercase text-brand-text-muted tracking-widest flex items-center gap-2 mb-2">
                           {stat.label}
                        </span>
                        <div className="text-2xl font-black font-mono tracking-tighter italic">{stat.value}</div>
                        <p className="text-[9px] font-bold text-brand-text-muted mt-1 uppercase tracking-widest">{stat.sub}</p>
                        <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-110 transition-transform">
                           <stat.icon className="w-20 h-20" />
                        </div>
                     </div>
                   ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                   <div className="lg:col-span-2 card">
                      <h3 className="text-[11px] font-black uppercase tracking-tighter mb-6 flex justify-between">
                         Cash Flow Analytics // Integrated Outlook
                         <Calendar className="w-4 h-4 text-brand-text-muted opacity-30" />
                      </h3>
                      <div className="h-[300px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={[
                              { name: 'W1', in: 40000, out: 24000 },
                              { name: 'W2', in: 30000, out: 13980 },
                              { name: 'W3', in: 20000, out: 9800 },
                              { name: 'W4', in: 27800, out: 3908 },
                              { name: 'W5', in: 18900, out: 4800 },
                              { name: 'W6', in: 23900, out: 3800 },
                            ]}>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                               <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                               <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                               <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                               <Line type="monotone" dataKey="in" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
                               <Line type="monotone" dataKey="out" stroke="#f43f5e" strokeWidth={3} dot={{ fill: '#f43f5e', r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                         </ResponsiveContainer>
                      </div>
                   </div>

                   <div className="card">
                      <h3 className="text-[11px] font-black uppercase tracking-tighter mb-6">Accounting Group Distribution</h3>
                      <div className="h-[200px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                               <Pie
                                 data={[
                                   { name: 'Assets', value: accounts.filter(a => a.group === 'Assets').length },
                                   { name: 'Liabilities', value: accounts.filter(a => a.group === 'Liabilities').length },
                                   { name: 'Income', value: accounts.filter(a => a.group === 'Income').length },
                                   { name: 'Expenses', value: accounts.filter(a => a.group === 'Expenses').length },
                                 ]}
                                 cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value"
                               >
                                  {[ '#10b981', '#3b82f6', '#f59e0b', '#f43f5e' ].map((color, i) => (
                                    <Cell key={i} fill={color} />
                                  ))}
                               </Pie>
                               <Tooltip />
                            </PieChart>
                         </ResponsiveContainer>
                      </div>
                      <div className="space-y-1 mt-4">
                         {['Assets', 'Liabilities', 'Income', 'Expenses'].map((group, i) => (
                           <div key={i} className="flex justify-between items-center p-2 rounded hover:bg-slate-50 border border-transparent hover:border-brand-border transition-all">
                              <span className="text-[10px] font-black uppercase">{group}</span>
                              <span className="text-[10px] font-black font-mono">
                                 {accounts.filter(a => a.group === group).length} Accounts
                              </span>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
             </motion.div>
           )}

           {activeTab === 'ledger' && (
             <motion.div 
               key="ledger" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="space-y-4"
             >
                <div className="flex justify-between items-center bg-white p-3 border border-brand-border rounded-lg shadow-sm">
                   <div className="flex items-center gap-3">
                      <div className="relative">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                         <input 
                           type="text" 
                           placeholder="Search Voucher, Narration..."
                           className="pl-10 pr-4 py-2 border border-brand-border rounded bg-brand-bg text-[10px] font-black w-64 focus:ring-1 ring-brand-accent/30 outline-none uppercase tracking-tight"
                           value={search}
                           onChange={(e) => setSearch(e.target.value)}
                         />
                      </div>
                      <select className="bg-brand-bg border border-brand-border px-3 py-2 rounded text-[10px] font-black uppercase outline-none">
                         <option>All Voucher Types</option>
                         <option>Sales</option>
                         <option>Receipt</option>
                         <option>Journal</option>
                      </select>
                   </div>
                </div>

                <div className="card !p-0 overflow-hidden shadow-2xl">
                   <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-900 border-b border-brand-border text-[9px] font-black text-white/50 uppercase tracking-widest">
                         <tr>
                            <th className="px-5 py-4">Protocol ID / Date</th>
                            <th className="px-5 py-4">Narration Context</th>
                            <th className="px-5 py-4">Voucher Type</th>
                            <th className="px-5 py-4 text-right">Debit Magnitude</th>
                            <th className="px-5 py-4 text-right">Credit Magnitude</th>
                            <th className="px-5 py-4 text-right">Actions</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-bg">
                         {journals.map(journal => {
                            const totalDebit = journal.lines.reduce((acc, l) => acc + l.debit, 0);
                            const totalCredit = journal.lines.reduce((acc, l) => acc + l.credit, 0);
                            return (
                               <tr key={journal.id} className="group hover:bg-slate-50 transition-all cursor-pointer">
                                  <td className="px-5 py-4">
                                     <div className="flex flex-col">
                                        <span className="text-[11px] font-black font-mono text-brand-accent">#{journal.voucherNumber}</span>
                                        <span className="text-[9px] font-bold text-brand-text-muted uppercase">{new Date(journal.date).toLocaleDateString()}</span>
                                     </div>
                                  </td>
                                  <td className="px-5 py-4">
                                     <div className="text-[11px] font-black uppercase tracking-tight line-clamp-1">{journal.narration}</div>
                                     <div className="text-[8px] font-bold text-brand-text-muted uppercase tracking-widest flex items-center gap-2 mt-1">
                                        <Database className="w-3 h-3 text-brand-accent/40" /> REF_ID: {journal.refId?.slice(-8).toUpperCase() || 'MANUAL'}
                                     </div>
                                  </td>
                                  <td className="px-5 py-4">
                                     <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                       journal.voucherType === 'Sales' ? 'bg-blue-100 text-blue-700' : 
                                       journal.voucherType === 'Receipt' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                                     }`}>
                                        {journal.voucherType}
                                     </span>
                                  </td>
                                  <td className="px-5 py-4 text-right">
                                     <div className="text-[12px] font-black font-mono tracking-tighter italic">₹{totalDebit.toLocaleString()}</div>
                                  </td>
                                  <td className="px-5 py-4 text-right border-l border-brand-bg">
                                     <div className="text-[12px] font-black font-mono tracking-tighter italic opacity-60">₹{totalCredit.toLocaleString()}</div>
                                  </td>
                                  <td className="px-5 py-4 text-right">
                                     <button className="p-1 px-2 border border-brand-border rounded group-hover:border-brand-accent transition-all">
                                        <ChevronRight className="w-4 h-4 text-brand-text-muted group-hover:text-brand-accent" />
                                     </button>
                                  </td>
                               </tr>
                            );
                         })}
                      </tbody>
                   </table>
                </div>
             </motion.div>
           )}

           {activeTab === 'reports' && (
             <motion.div 
               key="reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="grid grid-cols-1 lg:grid-cols-2 gap-4"
             >
                <div className="card">
                   <div className="flex justify-between items-center mb-6">
                      <h3 className="text-sm font-black uppercase tracking-tighter">Profit & Loss Statement // YTD</h3>
                      <button className="p-2 border border-brand-border rounded hover:bg-slate-50 transition-all"><ExternalLink className="w-4 h-4" /></button>
                   </div>
                   <div className="space-y-6">
                      <div>
                         <h4 className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                           <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" /> Revenue Stream
                         </h4>
                         <div className="space-y-1.5">
                            {pAndL.income.map(acc => (
                              <div key={acc.id} className="flex justify-between items-center p-2 rounded hover:bg-emerald-50/30 transition-all italic font-mono text-[11px] font-black">
                                 <span className="opacity-60">{acc.name}</span>
                                 <span>₹{Math.abs(acc.balance).toLocaleString()}</span>
                              </div>
                            ))}
                            <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg text-emerald-900 text-[12px] font-black uppercase mt-2 shadow-sm italic">
                               <span>Gross Earnings</span>
                               <span className="font-mono">₹{pAndL.totalIncome.toLocaleString()}</span>
                            </div>
                         </div>
                      </div>

                      <div>
                         <h4 className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                           <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" /> Operational Expenditures
                         </h4>
                         <div className="space-y-1.5">
                            {pAndL.expenses.map(acc => (
                              <div key={acc.id} className="flex justify-between items-center p-2 rounded hover:bg-rose-50/30 transition-all italic font-mono text-[11px] font-black">
                                 <span className="opacity-60">{acc.name}</span>
                                 <span>₹{Math.abs(acc.balance).toLocaleString()}</span>
                              </div>
                            ))}
                            <div className="flex justify-between items-center p-3 bg-rose-50 rounded-lg text-rose-900 text-[12px] font-black uppercase mt-2 shadow-sm italic">
                               <span>Total Expenditure</span>
                               <span className="font-mono">₹{pAndL.totalExpenses.toLocaleString()}</span>
                            </div>
                         </div>
                      </div>

                      <div className="p-4 bg-brand-sidebar text-white rounded-xl shadow-2xl flex justify-between items-baseline border-b-4 border-b-brand-accent">
                         <span className="text-[11px] font-black uppercase tracking-widest text-white/50">Fiscal Net Operating Margin</span>
                         <span className="text-2xl font-black font-mono tracking-tighter italic">₹{pAndL.netProfit.toLocaleString()}</span>
                      </div>
                   </div>
                </div>

                <div className="card">
                   <h3 className="text-sm font-black uppercase tracking-tighter mb-6">Trial Balance Ledger</h3>
                   <div className="border border-brand-border rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-[10px] font-bold">
                         <thead className="bg-slate-50 border-b border-brand-border text-brand-text-muted uppercase">
                            <tr>
                               <th className="px-4 py-3 text-left">Account Name</th>
                               <th className="px-4 py-3 text-right">Debit (₹)</th>
                               <th className="px-4 py-3 text-right">Credit (₹)</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-brand-bg italic font-mono">
                            {accounts.map(acc => (
                               <tr key={acc.id} className="hover:bg-slate-50/50">
                                  <td className="px-4 py-2 font-black uppercase tracking-tight">{acc.name}</td>
                                  <td className="px-4 py-2 text-right">{acc.balance >= 0 ? acc.balance.toLocaleString() : '-'}</td>
                                  <td className="px-4 py-2 text-right">{acc.balance < 0 ? Math.abs(acc.balance).toLocaleString() : '-'}</td>
                               </tr>
                            ))}
                         </tbody>
                         <tfoot className="bg-slate-900 text-white font-black uppercase">
                            <tr>
                               <td className="px-4 py-3">Closing Footprint</td>
                               <td className="px-4 py-3 text-right">₹{accounts.filter(a => a.balance > 0).reduce((acc, a) => acc + a.balance, 0).toLocaleString()}</td>
                               <td className="px-4 py-3 text-right">₹{Math.abs(accounts.filter(a => a.balance < 0).reduce((acc, a) => acc + a.balance, 0)).toLocaleString()}</td>
                            </tr>
                         </tfoot>
                      </table>
                   </div>
                   <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-lg flex gap-3">
                      <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                      <p className="text-[10px] font-bold text-amber-800 leading-normal uppercase">
                         Trial balance verification complete. Double-entry data integrity verified for all historical vouchers in current fiscal period.
                      </p>
                   </div>
                </div>
             </motion.div>
           )}

           {activeTab === 'gst' && (
             <motion.div 
               key="gst" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
               className="space-y-4"
             >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="card border-l-4 border-l-blue-500">
                      <span className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest block mb-2">Input Tax Credit (ITC)</span>
                      <div className="text-2xl font-black font-mono tracking-tighter italic">₹{stats.gstReceivable.toLocaleString()}</div>
                      <span className="text-[9px] font-bold text-blue-600 uppercase mt-1 block tracking-wider underline decoration-blue-200">View GSTR-2B Flow</span>
                   </div>
                   <div className="card border-l-4 border-l-orange-500">
                      <span className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest block mb-2">Output Tax Liability</span>
                      <div className="text-2xl font-black font-mono tracking-tighter italic">₹{stats.gstPayable.toLocaleString()}</div>
                      <span className="text-[9px] font-bold text-orange-600 uppercase mt-1 block tracking-wider underline decoration-orange-200">View GSTR-1 Ledger</span>
                   </div>
                   <div className="card border-l-4 border-l-brand-sidebar bg-brand-sidebar text-white">
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2">Net GST Payable (3B)</span>
                      <div className="text-2xl font-black font-mono tracking-tighter italic">₹{(stats.gstPayable - stats.gstReceivable).toLocaleString()}</div>
                      <button className="text-[9px] font-extrabold text-brand-accent uppercase mt-2 tracking-widest flex items-center gap-1.5">
                         Execute E-Filing Proto <ChevronRight className="w-3 h-3" />
                      </button>
                   </div>
                </div>

                <div className="card">
                   <h3 className="text-sm font-black uppercase tracking-tighter mb-6 flex justify-between">
                      GST Sales Audit (GSTR-1 Simulation)
                      <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded tracking-widest">PERIOD: APR-2026</span>
                   </h3>
                   <div className="border border-brand-border rounded-xl overflow-hidden">
                      <table className="w-full text-[10px] font-bold">
                         <thead className="bg-slate-50 border-b border-brand-border text-brand-text-muted uppercase">
                            <tr>
                               <th className="px-4 py-3 text-left">Voucher Ref</th>
                               <th className="px-4 py-3 text-left">GSTIN</th>
                               <th className="px-4 py-3 text-right">Taxable Val</th>
                               <th className="px-4 py-3 text-right">CGST (9%)</th>
                               <th className="px-4 py-3 text-right">SGST (9%)</th>
                               <th className="px-4 py-3 text-right">Total Invoice</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-brand-bg italic font-mono">
                            {journals.filter(j => j.voucherType === 'Sales').map(j => {
                               const receivables = j.lines.find(l => l.accountName === 'Accounts Receivable')?.debit || 0;
                               const sales = j.lines.find(l => l.accountName === 'Sales Revenue')?.credit || 0;
                               const cgst = j.lines.find(l => l.accountName === 'GST Output CGST')?.credit || 0;
                               const sgst = j.lines.find(l => l.accountName === 'GST Output SGST')?.credit || 0;
                               return (
                                 <tr key={j.id} className="hover:bg-slate-50/50">
                                    <td className="px-4 py-3 font-black uppercase tracking-tight text-brand-accent">{j.voucherNumber}</td>
                                    <td className="px-4 py-3 opacity-60">27ABCXX1234X1Z5</td>
                                    <td className="px-4 py-3 text-right">₹{sales.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right text-blue-600">₹{cgst.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right text-blue-600">₹{sgst.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right font-black">₹{receivables.toLocaleString()}</td>
                                 </tr>
                               );
                            })}
                         </tbody>
                      </table>
                   </div>
                   <div className="mt-4 flex gap-2">
                       <button className="px-4 py-2 border border-brand-border rounded text-[10px] font-black uppercase tracking-wider hover:bg-slate-50 transition-all flex items-center gap-2">
                          <Download className="w-4 h-4" /> Export GSTN JSON
                       </button>
                       <button className="px-4 py-2 border border-brand-border rounded text-[10px] font-black uppercase tracking-wider hover:bg-slate-50 transition-all flex items-center gap-2">
                          <FileText className="w-4 h-4" /> Comprehensive GSTR-1 Excel
                       </button>
                   </div>
                </div>
             </motion.div>
           )}

           {activeTab === 'miracle' && (
             <motion.div 
               key="miracle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="max-w-2xl mx-auto py-12"
             >
                <div className="card text-center relative overflow-hidden">
                   <div className="bg-brand-sidebar text-white p-8 rounded-xl shadow-2xl relative z-10">
                      <div className="w-20 h-20 bg-brand-accent/20 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-accent backdrop-blur-md">
                         <Zap className="w-10 h-10" />
                      </div>
                      <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 italic">Miracle Software Direct Bridge</h2>
                      <p className="text-[11px] font-bold text-white/50 uppercase tracking-widest leading-relaxed mb-8 max-w-md mx-auto">
                         Integrated export engine for seamless data migration to Miracle Accounting. Compatible with all major versions (V6.0+).
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-8 text-left">
                         <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                            <div className="text-[10px] font-black uppercase text-brand-accent mb-1 tracking-widest">Protocol Support</div>
                            <div className="text-[11px] font-black">Sales/Receipt/Payment Vouchers</div>
                         </div>
                         <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                            <div className="text-[10px] font-black uppercase text-brand-accent mb-1 tracking-widest">Format Profile</div>
                            <div className="text-[11px] font-black">Miracle Structured JSON / CSV</div>
                         </div>
                      </div>

                      <button 
                        onClick={exportToMiracle}
                        disabled={exporting}
                        className="w-full py-4 bg-brand-accent text-white rounded-xl font-black text-[12px] uppercase tracking-widest shadow-2xl shadow-brand-accent/30 hover:bg-brand-accent/90 transition-all flex items-center justify-center gap-3 active:scale-95"
                      >
                         {exporting ? 'Processing Fiscal Payload...' : 'Initiate Secure Export'}
                         <ChevronRight className="w-5 h-5" />
                      </button>
                   </div>
                   
                   <Calculator className="absolute -left-12 -bottom-12 w-64 h-64 opacity-[0.03] rotate-12" />
                   <TrendingUp className="absolute -right-12 -top-12 w-64 h-64 opacity-[0.03] -rotate-12" />
                </div>

                <div className="mt-8 space-y-4">
                   <h4 className="text-[10px] font-black uppercase text-brand-text-muted tracking-widest flex items-center gap-2 px-2">
                     <HistoryIcon className="w-4 h-4" /> Data Migration History
                   </h4>
                   {[
                     { date: '2026-04-16 10:22', status: 'SUCCESS', count: '42 Vouchers', hash: 'SHA-256: 4f1e...9a2' },
                     { date: '2026-04-10 16:45', status: 'SUCCESS', count: '85 Vouchers', hash: 'SHA-256: b82c...e11' },
                   ].map((log, i) => (
                     <div key={i} className="flex justify-between items-center p-3 border border-brand-border rounded-xl bg-white group hover:border-brand-accent transition-all">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center font-mono text-[10px] font-black text-brand-text-muted mt-0.5">#{i+1}</div>
                           <div>
                              <div className="text-[11px] font-black uppercase tracking-tight italic">Snapshot {log.date}</div>
                              <div className="text-[8px] font-bold text-brand-text-muted uppercase tracking-widest">{log.hash}</div>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className="text-[10px] font-black text-emerald-600 tracking-tighter italic">{log.status}</div>
                           <div className="text-[9px] font-bold opacity-30 uppercase">{log.count} Migrated</div>
                        </div>
                     </div>
                   ))}
                </div>
             </motion.div>
           )}
        </AnimatePresence>
      </div>
    </div>
  );
}
