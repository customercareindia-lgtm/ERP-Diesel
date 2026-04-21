import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Edit,
  AlertTriangle,
  Droplet,
  Beaker,
  Box
} from 'lucide-react';
import { RawMaterial } from '../../types/erp';

interface Props {
  materials: RawMaterial[];
}

export default function RawMaterialsList({ materials }: Props) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const filtered = materials.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.code.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || m.category === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-3 border border-brand-border rounded-lg">
        <div className="flex items-center gap-3">
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
             <input 
               type="text" 
               placeholder="Search Material Code or Name..."
               className="pl-10 pr-4 py-2 border border-brand-border rounded bg-brand-bg text-[11px] font-bold w-64 focus:ring-1 ring-brand-accent/30 outline-none"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
          </div>
          <select 
            className="bg-brand-bg border border-brand-border px-3 py-2 rounded text-[11px] font-bold outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="Base Oil">Base Oils</option>
            <option value="Additive">Additives</option>
            <option value="Package">Packaging</option>
          </select>
        </div>
        <div className="flex gap-2">
           <button className="p-2 border border-brand-border rounded hover:bg-slate-50 transition-all"><Download className="w-4 h-4 text-brand-text-muted" /></button>
           <button className="bg-brand-sidebar text-white px-4 py-2 rounded font-black text-[10px] uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Material
           </button>
        </div>
      </div>

      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-left">
          <thead>
             <tr className="bg-slate-50 border-b border-brand-border text-[10px] font-black text-brand-text-muted uppercase tracking-widest">
                <th className="px-5 py-3">Code / ID</th>
                <th className="px-5 py-3">Material Name</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3 text-right">Available Stock</th>
                <th className="px-5 py-3 text-right">Unit Cost</th>
                <th className="px-5 py-3 text-right">Total Valuation</th>
                <th className="px-5 py-3 text-center">Status</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-brand-bg">
             {filtered.map(m => (
               <tr key={m.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-5 py-3">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black font-mono text-brand-accent">{m.code}</span>
                       <span className="text-[9px] font-bold text-brand-text-muted">{m.supplier}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                     <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded bg-slate-100`}>
                           {m.category === 'Base Oil' ? <Droplet className="w-3.5 h-3.5 text-blue-500" /> : <Beaker className="w-3.5 h-3.5 text-orange-500" />}
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-tight">{m.name}</span>
                     </div>
                  </td>
                  <td className="px-5 py-3 text-[10px] font-bold uppercase">{m.category}</td>
                  <td className="px-5 py-3 text-right">
                     <span className={`text-[11px] font-black font-mono ${m.stockQuantity <= m.minStockLevel ? 'text-danger' : 'text-brand-text'}`}>
                        {m.stockQuantity.toLocaleString()} {m.unit}
                     </span>
                  </td>
                  <td className="px-5 py-3 text-right text-[10px] font-bold font-mono text-brand-text-muted">₹{m.costPerUnit}</td>
                  <td className="px-5 py-3 text-right text-[11px] font-black font-mono">₹{(m.stockQuantity * m.costPerUnit).toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-center">
                       {m.stockQuantity <= m.minStockLevel ? (
                         <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[9px] font-black uppercase">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                         </div>
                       ) : (
                         <div className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase">
                            Optimal
                         </div>
                       )}
                    </div>
                  </td>
               </tr>
             ))}
             {filtered.length === 0 && (
               <tr>
                 <td colSpan={7} className="px-5 py-20 text-center opacity-30 italic text-[11px] uppercase font-black tracking-widest">
                    No matching manufacturing materials found
                 </td>
               </tr>
             )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
