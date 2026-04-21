import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, 
  MapPin, 
  Package, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  DollarSign, 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  ExternalLink,
  ChevronRight,
  User,
  Navigation,
  Box,
  Warehouse as WarehouseIcon,
  ShieldCheck,
  AlertTriangle,
  Map,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  BarChart, 
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
import { logisticsService } from '../../services/logisticsService';
import { 
  DispatchOrder, 
  Transporter, 
  Vehicle, 
  Warehouse,
  SalesOrder
} from '../../types/erp';
import { format } from 'date-fns';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Logistics: React.FC = () => {
  const { erpUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'dispatches' | 'fleet' | 'warehouses'>('dashboard');
  const [dispatches, setDispatches] = useState<DispatchOrder[]>([]);
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('Initiating...');
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (erpUser?.tenantId) {
      loadData();
    }
  }, [erpUser?.tenantId]);

  const loadData = async () => {
    if (!erpUser?.tenantId) return;
    
    setLoading(true);
    setLoadingStatus('Aggregating Logistics Nexus...');
    setError(null);
    
    try {
      // Fetching sequentially to avoid Promise.all hang and track progress
      setLoadingStatus('Accessing Transporter Database...');
      const tData = await logisticsService.getTransporters(erpUser.tenantId);
      setTransporters(tData);

      setLoadingStatus('Syncing Fleet Telemetry...');
      const vData = await logisticsService.getVehicles(erpUser.tenantId);
      setVehicles(vData);

      setLoadingStatus('Scanning Warehouse Inventory...');
      const wData = await logisticsService.getWarehouses(erpUser.tenantId);
      setWarehouses(wData);

      setLoadingStatus('Retrieving Dispatch Ledger...');
      const doData = await logisticsService.getDispatchOrders(erpUser.tenantId);
      setDispatches(doData);

    } catch (err) {
      console.error('Error loading logistics data:', err);
      setError('System restricted. Failed to aggregate logistics data streams.');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = dispatches.length;
    const inTransit = dispatches.filter(d => d.status === 'in_transit' || d.status === 'dispatched').length;
    const delivered = dispatches.filter(d => ['delivered', 'completed', 'closed'].includes(d.status)).length;
    const delayed = dispatches.filter(d => d.status === 'delayed').length;
    const totalCost = dispatches.reduce((acc, curr) => acc + (curr.freightCharges || 0) + (curr.handlingCharges || 0), 0);
    
    return { total, inTransit, delivered, delayed, totalCost };
  }, [dispatches]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    dispatches.forEach(d => {
      const s = d.status.charAt(0).toUpperCase() + d.status.slice(1).replace('_', ' ');
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [dispatches]);

  const trendData = useMemo(() => {
    const daily: Record<string, number> = {};
    dispatches.slice(0, 30).forEach(d => {
      try {
        if (!d.createdAt) return;
        const date = format(new Date(d.createdAt), 'MMM dd');
        daily[date] = (daily[date] || 0) + 1;
      } catch (e) {
        console.warn('Invalid date in dispatch record:', d.createdAt);
      }
    });
    return Object.entries(daily).map(([date, count]) => ({ date, count })).reverse();
  }, [dispatches]);

  const costData = useMemo(() => {
    return dispatches.slice(0, 10).map(d => ({
      name: d.dispatchId,
      cost: (d.freightCharges || 0) + (d.handlingCharges || 0)
    }));
  }, [dispatches]);

  const filteredDispatches = useMemo(() => {
    return dispatches.filter(d => {
      const matchesSearch = 
        d.dispatchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [dispatches, searchTerm, statusFilter]);

  const getStatusColor = (status: DispatchOrder['status']) => {
    switch (status) {
      case 'planned': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'dispatched': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'in_transit': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'delivered': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'delayed': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'completed': return 'bg-teal-100 text-teal-700 border-teal-200';
      case 'closed': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
          <Truck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-brand-accent animate-pulse" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-xs font-black uppercase tracking-widest text-brand-text">Initializing Logistics Nexus...</p>
          <p className="text-[10px] font-mono text-brand-text-muted opacity-60 animate-pulse uppercase tracking-tight">{loadingStatus}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 text-center">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/10">
           <AlertTriangle className="w-8 h-8" />
        </div>
        <div>
           <h2 className="text-lg font-black text-brand-text uppercase tracking-tight">Critical Access Error</h2>
           <p className="text-sm text-brand-text-muted mt-2 max-w-sm mx-auto">{error}</p>
        </div>
        <button 
          onClick={() => loadData()}
          className="px-8 py-3 bg-brand-text text-white rounded-xl text-xs font-black uppercase hover:scale-105 transition-all shadow-xl"
        >
          Re-establish Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-text flex items-center gap-2">
            <Truck className="w-8 h-8 text-brand-accent" />
            LOGISTICS & FLEET CONTROL
          </h1>
          <p className="text-brand-text-muted text-sm mt-1">Manage transport, warehouses, and delivery tracking.</p>
        </div>
        <div className="flex items-center gap-2">
           <button className="flex items-center gap-2 px-4 py-2 border border-brand-border rounded-xl bg-white text-sm font-bold text-brand-text hover:bg-slate-50 transition-all">
             <Filter className="w-4 h-4" /> Filters
           </button>
           <button className="flex items-center gap-2 px-4 py-2 bg-brand-accent text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-accent/20 hover:scale-[1.02] transition-all active:scale-[0.98]">
             <Plus className="w-4 h-4" /> New Dispatch
           </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-brand-border overflow-x-auto no-scrollbar">
        {(['dashboard', 'dispatches', 'fleet', 'warehouses'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all relative min-w-fit ${
              activeTab === tab ? 'text-brand-accent' : 'text-brand-text-muted hover:text-brand-text'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div 
                layoutId="activeTabLogistics"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-accent"
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard label="Total Dispatches" value={stats.total} icon={Package} color="indigo" />
              <StatCard label="In Transit" value={stats.inTransit} icon={Navigation} color="blue" />
              <StatCard label="Delivered" value={stats.delivered} icon={CheckCircle2} color="emerald" />
              <StatCard label="Delayed" value={stats.delayed} icon={AlertTriangle} color="rose" />
              <StatCard label="Total Logistics Cost" value={`₹${stats.totalCost.toLocaleString()}`} icon={DollarSign} color="amber" />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 p-6 border border-brand-border rounded-2xl bg-white">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-brand-text-muted flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Dispatch Trend (30 Days)
                  </h3>
                </div>
                <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                         <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                         <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                         <Tooltip 
                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                         />
                         <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={{r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff'}} />
                      </LineChart>
                   </ResponsiveContainer>
                </div>
              </div>

              <div className="p-6 border border-brand-border rounded-2xl bg-white">
                <h3 className="text-xs font-black uppercase tracking-widest text-brand-text-muted mb-6 flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4" /> Delivery Status
                </h3>
                <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                         >
                            {statusData.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                         </Pie>
                         <Tooltip />
                      </PieChart>
                   </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                   {statusData.map((item, i) => (
                     <div key={i} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                        <span className="text-[10px] font-bold text-brand-text-muted uppercase">{item.name}</span>
                     </div>
                   ))}
                </div>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cost Analysis */}
              <div className="p-6 border border-brand-border rounded-2xl bg-white">
                <h3 className="text-xs font-black uppercase tracking-widest text-brand-text-muted mb-6 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> Cost Per Shipment (Latest)
                </h3>
                <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={costData}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                         <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                         <Tooltip />
                         <Bar dataKey="cost" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                   </ResponsiveContainer>
                </div>
              </div>

              {/* Alerts & Critical Status */}
              <div className="p-6 border border-brand-border rounded-2xl bg-rose-50/50">
                <h3 className="text-xs font-black uppercase tracking-widest text-brand-text-muted mb-6 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500" /> Logistics Issues & Alerts
                </h3>
                <div className="space-y-4">
                   {dispatches.filter(d => d.status === 'delayed').slice(0, 4).map((d, i) => (
                     <div key={i} className="flex items-center justify-between p-4 bg-white border border-rose-100 rounded-xl shadow-sm">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center">
                              <MapPin className="w-5 h-5" />
                           </div>
                           <div>
                              <div className="text-[11px] font-black uppercase">{d.dispatchId} - Delayed</div>
                              <div className="text-[10px] text-brand-text-muted">{d.customerName} | Last: {d.lastLocation}</div>
                           </div>
                        </div>
                        <button className="text-[10px] font-black text-rose-600 uppercase flex items-center gap-1 hover:underline">
                           Resolve <ChevronRight className="w-3 h-3" />
                        </button>
                     </div>
                   ))}
                   {stats.delayed === 0 && (
                     <div className="flex flex-col items-center justify-center h-48 text-brand-text-muted">
                        <ShieldCheck className="w-12 h-12 text-emerald-500 opacity-20 mb-2" />
                        <p className="text-sm font-bold">No critical delays reported</p>
                     </div>
                   )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'dispatches' && (
          <motion.div
            key="dispatches"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
             {/* Dispatch Ledger Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-white border border-brand-border rounded-2xl shadow-sm">
                <div className="relative w-full md:w-96">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                   <input 
                      type="text" 
                      placeholder="Search Dispatch ID, Customer, Vehicle..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-brand-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                   />
                </div>
                <select 
                  className="w-full md:w-48 px-4 py-2 bg-slate-50 border border-brand-border rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-accent/20"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                 >
                   <option value="all">All Statuses</option>
                   <option value="planned">Planned</option>
                   <option value="dispatched">Dispatched</option>
                   <option value="in_transit">In Transit</option>
                   <option value="delivered">Delivered</option>
                   <option value="delayed">Delayed</option>
                </select>
            </div>

            <div className="bg-white border border-brand-border rounded-2xl overflow-hidden shadow-sm">
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-slate-50 border-b border-brand-border">
                           <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-brand-text-muted">Dispatch Details</th>
                           <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-brand-text-muted">Customer & Destination</th>
                           <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-brand-text-muted">Vehicle & Driver</th>
                           <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-brand-text-muted">Status & ETA</th>
                           <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-brand-text-muted text-right">Action</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-brand-border">
                        {filteredDispatches.map((dispatch) => (
                           <tr key={dispatch.id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-6 py-4">
                                 <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                                       <Box className="w-5 h-5" />
                                    </div>
                                    <div>
                                       <div className="text-sm font-black text-brand-text">{dispatch.dispatchId}</div>
                                       <div className="text-[10px] font-bold text-brand-text-muted uppercase">SO: {dispatch.orderNumber}</div>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="text-sm font-bold text-brand-text">{dispatch.customerName}</div>
                                 <div className="text-[10px] text-brand-text-muted flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> {dispatch.deliveryAddress.substring(0, 30)}...
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="text-sm font-bold text-brand-text">{dispatch.vehicleNumber}</div>
                                 <div className="text-[10px] text-brand-text-muted flex items-center gap-1 uppercase font-bold">
                                    <User className="w-3 h-3" /> {dispatch.driverName}
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${getStatusColor(dispatch.status)}`}>
                                    {dispatch.status.replace('_', ' ')}
                                 </span>
                                 <div className="text-[10px] text-brand-text-muted mt-1 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {dispatch.eta ? format(new Date(dispatch.eta), 'MMM dd, HH:mm') : 'N/A'}
                                 </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                 <button className="p-2 text-brand-text-muted hover:text-brand-accent hover:bg-brand-accent/5 rounded-lg transition-all">
                                    <ExternalLink className="w-4 h-4" />
                                 </button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'fleet' && (
           <motion.div
              key="fleet"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
           >
              {transporters.map((t) => (
                <div key={t.id} className="p-6 border border-brand-border rounded-2xl bg-white shadow-sm hover:shadow-md transition-all">
                   <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                         <Truck className="w-6 h-6 text-slate-600" />
                      </div>
                      <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase">Active Partner</span>
                   </div>
                   <h3 className="text-lg font-black text-brand-text">{t.name}</h3>
                   <div className="text-[10px] font-bold text-brand-text-muted uppercase mb-4">GSTIN: {t.gstin}</div>
                   
                   <div className="space-y-3 pt-4 border-t border-brand-border">
                      <div className="flex items-center gap-3 text-sm">
                         <User className="w-4 h-4 text-brand-text-muted" />
                         <span className="font-bold">{t.contactPerson}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                         <AlertCircle className="w-4 h-4 text-brand-text-muted" />
                         <span className="font-bold">{t.phone}</span>
                      </div>
                   </div>

                   <button className="w-full mt-6 py-3 border border-brand-border rounded-xl text-xs font-black uppercase text-brand-text-muted hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                      View Fleet <ChevronRight className="w-4 h-4" />
                   </button>
                </div>
              ))}
           </motion.div>
        )}

        {activeTab === 'warehouses' && (
           <motion.div
              key="warehouses"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
           >
              {warehouses.map((w) => (
                <div key={w.id} className="p-8 border border-brand-border rounded-2xl bg-white relative overflow-hidden group hover:border-brand-accent transition-all">
                   <WarehouseIcon className="absolute -right-8 -bottom-8 w-48 h-48 text-brand-accent/5 group-hover:text-brand-accent/10 transition-colors" />
                   <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 bg-brand-accent/5 rounded-2xl flex items-center justify-center">
                        <Map className="w-8 h-8 text-brand-accent" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-brand-text">{w.name}</h3>
                        <div className="text-[10px] font-bold text-brand-text-muted uppercase flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {w.location}
                        </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-2xl">
                         <div className="text-[10px] font-black text-brand-text-muted uppercase mb-1">Total Capacity</div>
                         <div className="text-xl font-black text-brand-text">{(w.capacity / 1000).toFixed(0)}K Liters</div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl">
                         <div className="text-[10px] font-black text-brand-text-muted uppercase mb-1">Occupancy</div>
                         <div className="text-xl font-black text-emerald-600">65%</div>
                      </div>
                   </div>

                   <div className="mt-8 flex gap-3">
                      <button className="flex-1 py-3 bg-brand-text text-white rounded-xl text-xs font-black uppercase hover:bg-black transition-all">Inventory Audit</button>
                      <button className="px-4 py-3 border border-brand-border rounded-xl hover:bg-slate-50 transition-all">
                        <Navigation className="w-4 h-4" />
                      </button>
                   </div>
                </div>
              ))}
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string | number; icon: any; color: string }> = ({ label, value, icon: Icon, color }) => {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };

  return (
    <div className={`p-6 border rounded-2xl bg-white shadow-sm hover:shadow-md transition-all ${colorMap[color].split(' ')[2]}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colorMap[color].split(' ')[0]} ${colorMap[color].split(' ')[1]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-[10px] font-black uppercase text-brand-text-muted tracking-widest">{label}</div>
      <div className="text-2xl font-black text-brand-text mt-1">{value}</div>
    </div>
  );
};

export default Logistics;
