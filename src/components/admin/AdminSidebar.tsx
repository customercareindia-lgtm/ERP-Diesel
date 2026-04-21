import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Factory, 
  Users, 
  ShoppingCart, 
  Truck, 
  FileText, 
  Settings, 
  LogOut,
  Warehouse,
  Smartphone
} from 'lucide-react';
import { auth } from '../../firebase';

const menuItems = [
  { icon: LayoutDashboard, label: 'Overview', path: '/admin' },
  { icon: Warehouse, label: 'Inventory', path: '/admin/inventory' },
  { icon: Factory, label: 'Manufacturing', path: '/admin/manufacturing' },
  { icon: Smartphone, label: 'Sales Team', path: '/admin/salesmen' },
  { icon: ShoppingCart, label: 'Sales Orders', path: '/admin/sales' },
  { icon: Users, label: 'Customers', path: '/admin/customers' },
  { icon: Truck, label: 'Logistics', path: '/admin/logistics' },
  { icon: FileText, label: 'Accounting', path: '/admin/accounts' },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

export default function AdminSidebar() {
  return (
    <div className="w-[200px] h-screen bg-brand-sidebar text-white flex flex-col">
      <div className="p-4 font-extrabold text-base border-b border-white/10 tracking-tight">
        LUBRIERP<span className="text-brand-accent">PRO</span>
      </div>

      <nav className="flex-1 pt-2.5 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-2.5 transition-all border-l-[3px]
              ${isActive 
                ? 'opacity-100 bg-white/5 border-brand-accent' 
                : 'opacity-70 border-transparent hover:opacity-100 hover:bg-white/3'}
            `}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span className="text-xs font-medium tracking-tight whitespace-nowrap">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 text-[10px] opacity-50 border-t border-white/10">
        <button 
          onClick={() => auth.signOut()}
          className="flex items-center gap-3 w-full hover:opacity-100 transition-opacity group"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-mono">Terminate Session</span>
        </button>
        <div className="mt-2 font-mono">v2.4.1-stable</div>
      </div>
    </div>
  );
}
