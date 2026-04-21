import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import Overview from './Overview';
import Inventory from './Inventory';
import Manufacturing from './Manufacturing';
import Sales from './Sales';
import Accounting from './Accounting';
import Logistics from './Logistics';
import Salesmen from './Salesmen';

export default function AdminDashboard() {
  return (
    <div className="flex h-screen bg-brand-bg overflow-hidden text-brand-text">
      <AdminSidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-12 bg-white border-b border-brand-border flex items-center justify-between px-5 shrink-0">
          <div className="flex-1 max-w-sm">
            <input 
              type="text" 
              placeholder="Search SKU, Batch, Invoice or Customer..." 
              className="w-full bg-brand-bg border border-brand-border px-3 py-1 rounded text-brand-text-muted text-[11px] focus:outline-none focus:ring-1 ring-brand-accent/30"
            />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-warning text-[10px] font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-warning rounded-full" /> Sync Active
            </span>
            <div className="w-8 h-8 bg-brand-border rounded-full flex items-center justify-center font-bold text-brand-text text-[11px]">
              SK
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-3">
            <Routes>
                <Route path="/" element={<Overview />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/manufacturing" element={<Manufacturing />} />
                <Route path="/sales" element={<Sales />} />
                <Route path="/accounts" element={<Accounting />} />
                <Route path="/logistics" element={<Logistics />} />
                <Route path="/salesmen" element={<Salesmen />} />
                <Route path="*" element={<div className="font-mono uppercase text-brand-text-muted p-10 opacity-50">Module Under Implementation...</div>} />
            </Routes>
        </div>
      </main>
    </div>
  );
}
