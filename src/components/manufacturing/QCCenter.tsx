import React, { useState } from 'react';
import { 
  FlaskConical, 
  Search, 
  Clock, 
  CheckCircle2, 
  XSquare, 
  FileText,
  Thermometer,
  Droplet,
  ArrowRight
} from 'lucide-react';
import { Batch, ProductionOrder, QCResult } from '../../types/erp';
import { manufacturingService } from '../../services/manufacturingService';

interface Props {
  batches: Batch[];
  orders: ProductionOrder[];
}

export default function QCCenter({ batches, orders }: Props) {
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [results, setResults] = useState<QCResult>({
    viscosity: 0,
    density: 0,
    flashPoint: 0,
    appearance: 'Clear & Bright',
    testedBy: 'Lab Admin',
    testDate: new Date().toISOString()
  });
  const [submitting, setSubmitting] = useState(false);

  // Focus only on batches that are awaiting QC
  const pendingBatches = batches.filter(b => b.status === 'qc_pending' || b.status === 'qc_failed');
  const selectedBatch = batches.find(b => b.id === selectedBatchId);
  const activeOrder = orders.find(o => o.batchId === selectedBatchId);

  const handleSubmit = async (passed: boolean) => {
    if (!selectedBatchId || !activeOrder) return;
    setSubmitting(true);
    try {
      await manufacturingService.submitQCResults(activeOrder.id, selectedBatchId, results, passed);
      setSelectedBatchId(null);
      alert(passed ? 'Batch Approved & Released to Inventory' : 'Batch Rejected & Quarantined');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
      <div className="lg:col-span-1 border-r border-brand-border pr-4 space-y-4">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-brand-text-muted flex items-center gap-2">
           <Clock className="w-3.5 h-3.5" /> Testing Queue
        </h3>
        
        <div className="space-y-2 overflow-y-auto max-h-[600px]">
           {pendingBatches.map(batch => {
             const order = orders.find(o => o.batchId === batch.id);
             return (
               <div 
                 key={batch.id}
                 onClick={() => setSelectedBatchId(batch.id)}
                 className={`p-3 border rounded-lg cursor-pointer transition-all flex items-center justify-between group ${
                   selectedBatchId === batch.id ? 'bg-brand-sidebar text-white border-brand-sidebar shadow-lg' : 'bg-white hover:border-brand-accent border-brand-border'
                 }`}
               >
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black uppercase tracking-tight">{batch.batchNumber}</span>
                     <span className={`text-[9px] font-bold tracking-widest line-clamp-1 ${selectedBatchId === batch.id ? 'text-white/40' : 'text-brand-text-muted'}`}>
                       {order?.productName || 'Unknown Product'}
                     </span>
                  </div>
                  <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                    batch.status === 'qc_failed' ? 'bg-red-500 text-white' : 'bg-brand-accent text-white'
                  }`}>
                    {batch.status === 'qc_failed' ? 'RETEST' : 'WAITING'}
                  </div>
               </div>
             );
           })}
           {pendingBatches.length === 0 && (
              <div className="p-8 text-center text-brand-text-muted opacity-40 font-black text-[10px] uppercase border-2 border-dashed border-brand-border rounded">
                 No batches pending QC
              </div>
           )}
        </div>
      </div>

      <div className="lg:col-span-2">
         {selectedBatch ? (
           <div className="card h-full flex flex-col">
              <div className="flex justify-between items-start border-b border-brand-border pb-6 mb-6">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-brand-accent">
                       <FlaskConical className="w-7 h-7" />
                    </div>
                    <div>
                       <h2 className="text-xl font-black uppercase tracking-tighter">Lab Test Registry</h2>
                       <div className="flex gap-4">
                          <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">BATCH: {selectedBatch.batchNumber}</span>
                          <span className="text-[10px] font-bold text-brand-accent uppercase tracking-widest">{selectedBatch.quantity} L Total Run</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="flex-1 space-y-8 overflow-y-auto pr-2">
                 <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 border border-brand-border rounded-lg group hover:border-brand-accent transition-all">
                       <label className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest flex items-center gap-2 mb-3">
                          <Droplet className="w-3.5 h-3.5 text-blue-500" /> Kinetic Viscosity
                       </label>
                       <div className="flex items-baseline gap-2">
                          <input 
                            type="number" 
                            className="bg-transparent text-xl font-black font-mono w-full outline-none focus:text-brand-accent"
                            value={results.viscosity}
                            onChange={(e) => setResults({...results, viscosity: Number(e.target.value)})}
                          />
                          <span className="text-[10px] font-black opacity-30">cSt</span>
                       </div>
                    </div>
                    <div className="p-4 bg-slate-50 border border-brand-border rounded-lg group hover:border-brand-accent transition-all">
                       <label className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest flex items-center gap-2 mb-3">
                          <Database className="w-3.5 h-3.5 text-orange-500" /> Density @ 15°C
                       </label>
                       <div className="flex items-baseline gap-2">
                          <input 
                            type="number" 
                            className="bg-transparent text-xl font-black font-mono w-full outline-none focus:text-brand-accent"
                            value={results.density}
                            onChange={(e) => setResults({...results, density: Number(e.target.value)})}
                          />
                          <span className="text-[10px] font-black opacity-30">g/cm³</span>
                       </div>
                    </div>
                    <div className="p-4 bg-slate-50 border border-brand-border rounded-lg group hover:border-brand-accent transition-all">
                       <label className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest flex items-center gap-2 mb-3">
                          <Thermometer className="w-3.5 h-3.5 text-red-500" /> Flash Point
                       </label>
                       <div className="flex items-baseline gap-2">
                          <input 
                            type="number" 
                            className="bg-transparent text-xl font-black font-mono w-full outline-none focus:text-brand-accent"
                            value={results.flashPoint}
                            onChange={(e) => setResults({...results, flashPoint: Number(e.target.value)})}
                          />
                          <span className="text-[10px] font-black opacity-30">°C</span>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-brand-text-muted">Appearance & Mechanical Consistency</label>
                       <textarea 
                          className="w-full bg-slate-50 border border-brand-border p-3 rounded text-[11px] font-bold focus:ring-1 ring-brand-accent/30 outline-none h-20"
                          placeholder="Note any visual impurities or anomalies..."
                          value={results.appearance}
                          onChange={(e) => setResults({...results, appearance: e.target.value})}
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-brand-text-muted">Lab Remarks</label>
                       <input 
                          type="text" 
                          className="w-full bg-slate-50 border border-brand-border px-3 py-2 rounded text-[11px] font-bold focus:ring-1 ring-brand-accent/30 outline-none"
                          placeholder="Internal quality notes..."
                          value={results.remarks}
                          onChange={(e) => setResults({...results, remarks: e.target.value})}
                       />
                    </div>
                 </div>

                 <div className="p-4 bg-brand-sidebar text-white rounded-xl flex items-center justify-between shadow-2xl shadow-brand-sidebar/30">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center">
                          <FileText className="w-5 h-5 text-brand-accent" />
                       </div>
                       <div>
                          <div className="text-[10px] font-black uppercase tracking-widest">Final Verdict Authorization</div>
                          <p className="text-[9px] font-bold text-white/40 uppercase">Approval adds {selectedBatch.quantity}L to salable inventory</p>
                       </div>
                    </div>
                    <div className="flex gap-2">
                       <button 
                         onClick={() => handleSubmit(false)}
                         disabled={submitting}
                         className="px-6 py-2 bg-danger hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-wider rounded transition-all flex items-center gap-2"
                       >
                          <XSquare className="w-4 h-4" /> Reject Batch
                       </button>
                       <button 
                         onClick={() => handleSubmit(true)}
                         disabled={submitting}
                         className="px-6 py-2 bg-success hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-wider rounded transition-all flex items-center gap-2"
                       >
                          <CheckCircle2 className="w-4 h-4" /> Approve & Release
                       </button>
                    </div>
                 </div>
              </div>
           </div>
         ) : (
           <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-brand-border rounded-xl opacity-20">
              <FlaskConical className="w-16 h-16 mb-4 animate-pulse text-brand-accent" />
              <h3 className="text-sm font-black uppercase tracking-widest">Awaiting Batch for Laboratory Review</h3>
           </div>
         )}
      </div>
    </div>
  );
}

function Database({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
  );
}
