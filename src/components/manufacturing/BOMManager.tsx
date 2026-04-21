import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Search, 
  Plus, 
  ChevronRight, 
  Layers, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../AuthContext';
import { BOM } from '../../types/erp';

export default function BOMManager() {
  const { erpUser } = useAuth();
  const [boms, setBoms] = useState<BOM[]>([]);
  const [search, setSearch] = useState('');
  const [selectedBOM, setSelectedBOM] = useState<BOM | null>(null);

  useEffect(() => {
    if (!erpUser?.tenantId) return;
    const q = query(collection(db, 'boms'), where('tenantId', '==', erpUser.tenantId));
    return onSnapshot(q, (snapshot) => {
      setBoms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BOM)));
    });
  }, [erpUser?.tenantId]);

  const filtered = boms.filter(b => b.productName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
      <div className="lg:col-span-1 border-r border-brand-border pr-4 space-y-4">
        <div className="flex justify-between items-center mb-2">
           <h3 className="text-[11px] font-black uppercase tracking-widest text-brand-text-muted">Master Formulation List</h3>
           <Plus className="w-4 h-4 text-brand-accent cursor-pointer hover:scale-110 transition-transform" />
        </div>
        <div className="relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
           <input 
             type="text" 
             placeholder="Filter Products..."
             className="w-full pl-10 pr-4 py-2 bg-white border border-brand-border rounded text-[11px] font-bold focus:ring-1 ring-brand-accent/30 outline-none shadow-sm"
             value={search}
             onChange={(e) => setSearch(e.target.value)}
           />
        </div>
        
        <div className="space-y-1.5 overflow-y-auto max-h-[600px]">
           {filtered.map(bom => (
             <div 
               key={bom.id}
               onClick={() => setSelectedBOM(bom)}
               className={`p-3 border rounded-lg cursor-pointer transition-all flex items-center justify-between group ${
                 selectedBOM?.id === bom.id ? 'bg-brand-sidebar text-white border-brand-sidebar shadow-lg' : 'bg-white hover:border-brand-accent border-brand-border'
               }`}
             >
                <div className="flex flex-col">
                   <span className="text-[10px] font-black uppercase tracking-tight line-clamp-1">{bom.productName}</span>
                   <span className={`text-[9px] font-bold tracking-widest ${selectedBOM?.id === bom.id ? 'text-white/40' : 'text-brand-text-muted'}`}>
                     VER: {bom.version} // {bom.items.length} INGREDIENTS
                   </span>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${selectedBOM?.id === bom.id ? 'text-brand-accent group-hover:translate-x-1' : 'text-brand-text-muted'}`} />
             </div>
           ))}
        </div>
      </div>

      <div className="lg:col-span-2">
         {selectedBOM ? (
           <div className="card h-full flex flex-col">
              <div className="flex justify-between items-start border-b border-brand-border pb-6 mb-6">
                 <div>
                    <div className="flex items-center gap-3 mb-2">
                       <div className="w-10 h-10 bg-brand-sidebar rounded-lg flex items-center justify-center text-brand-accent shadow-xl shadow-brand-sidebar/20">
                          <Layers className="w-6 h-6" />
                       </div>
                       <div>
                          <h2 className="text-xl font-black uppercase tracking-tighter">{selectedBOM.productName}</h2>
                          <div className="flex gap-4">
                             <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Master Formulation v{selectedBOM.version}</span>
                             <span className="text-[10px] font-bold text-success uppercase tracking-widest underline underline-offset-4 decoration-success/20">Active Recipe</span>
                          </div>
                       </div>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    <button className="px-4 py-2 border border-brand-border rounded text-[10px] font-black uppercase tracking-wider hover:bg-slate-50 transition-all">Edit BOM</button>
                    <button className="px-4 py-2 bg-brand-sidebar text-white rounded text-[10px] font-black uppercase tracking-wider hover:bg-zinc-800 shadow-xl shadow-brand-sidebar/10">Lock & Sign</button>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6">
                 <div>
                    <h4 className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest mb-3">Ingredient Proportions // Per 1000L Batch</h4>
                    <div className="space-y-1">
                       {selectedBOM.items.map((item, i) => (
                         <div key={i} className="flex justify-between items-center p-3 bg-brand-bg border border-brand-border/50 rounded group hover:border-brand-accent transition-all">
                            <div className="flex items-center gap-3">
                               <div className="w-6 h-6 bg-white border border-brand-border rounded flex items-center justify-center font-mono text-[9px] font-bold text-brand-text-muted">
                                  {i+1}
                               </div>
                               <div>
                                  <span className="text-[11px] font-black uppercase tracking-tight">{item.materialName}</span>
                                  <span className="block text-[8px] font-bold text-brand-text-muted tracking-widest">RM-ID: {item.materialId.slice(0, 8)}</span>
                               </div>
                            </div>
                            <div className="text-right">
                               <span className="text-[12px] font-black font-mono tracking-tighter">{item.quantity} L</span>
                               <span className="block text-[9px] font-bold text-brand-text-muted">({((item.quantity / 10.0)).toFixed(1)}%)</span>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-brand-sidebar text-white rounded-lg">
                       <div className="flex items-center gap-2 mb-3 text-brand-accent font-black text-[10px] uppercase">
                          <AlertCircle className="w-4 h-4" /> Lab Advisory
                       </div>
                       <p className="text-[10px] leading-relaxed opacity-70">
                          Temperature sensitivity detected. Ensure base oil is pre-heated to 60°C before additive introduction to prevent flocculation.
                       </p>
                    </div>
                    <div className="p-4 bg-slate-50 border border-brand-border border-dashed rounded-lg">
                       <div className="flex items-center gap-2 mb-3 text-brand-text-muted font-black text-[10px] uppercase">
                          <FileText className="w-4 h-4" /> Batch History
                       </div>
                       <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-bold opacity-60"><span>LAST BATCH</span> <span>12/Apr</span></div>
                          <div className="flex justify-between text-[9px] font-bold opacity-60"><span>AVG YIELD</span> <span>99.4%</span></div>
                          <div className="flex justify-between text-[9px] font-bold opacity-60"><span>QC PASS RATE</span> <span className="text-success">100%</span></div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
         ) : (
           <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-brand-border rounded-xl opacity-20">
              <Settings className="w-16 h-16 mb-4 animate-[spin_10s_linear_infinite]" />
              <h3 className="text-sm font-black uppercase tracking-widest">Select Product to Load Master BOM</h3>
           </div>
         )}
      </div>
    </div>
  );
}
