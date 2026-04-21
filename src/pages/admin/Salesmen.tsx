import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  MapPin, 
  Navigation, 
  Calendar, 
  TrendingUp, 
  Smartphone, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical,
  Activity,
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Map as MapIcon,
  ChevronRight,
  MapPin as MapPinIcon,
  History,
  Target,
  DollarSign
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../AuthContext';
import { salesmanService } from '../../services/salesmanService';
import { 
  Salesman, 
  Visit, 
  SalesTarget, 
  ERPUser 
} from '../../types/erp';
import { format } from 'date-fns';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const SalesmanManagement: React.FC = () => {
  const { erpUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'tracking' | 'team' | 'performance' | 'visits'>('tracking');
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [targets, setTargets] = useState<SalesTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSalesman, setSelectedSalesman] = useState<Salesman | null>(null);

  useEffect(() => {
    if (!erpUser?.tenantId) return;

    const unsub = salesmanService.subscribeToSalesmen(erpUser.tenantId, (data) => {
      setSalesmen(data);
      setLoading(false);
    });

    // Fetch initial visits and targets
    const loadSecondaryData = async () => {
      const currentMonth = new Date().toISOString().substring(0, 7);
      const [vData, tData] = await Promise.all([
        salesmanService.getVisits(erpUser.tenantId),
        salesmanService.getTargets(erpUser.tenantId, currentMonth)
      ]);
      setVisits(vData);
      setTargets(tData);
    };

    loadSecondaryData();
    return () => unsub();
  }, [erpUser?.tenantId]);

  // Simulation: Move the salesmen slightly for "Live" effect
  useEffect(() => {
    if (activeTab !== 'tracking' || salesmen.length === 0) return;

    const interval = setInterval(() => {
      // Pick a random active salesman and shift them slightly
      const activeIndices = salesmen
        .map((s, i) => s.active ? i : -1)
        .filter(i => i !== -1);
      
      if (activeIndices.length > 0) {
        const randIdx = activeIndices[Math.floor(Math.random() * activeIndices.length)];
        const agent = salesmen[randIdx];
        
        // Simulating a slow move (drift)
        const newLat = agent.currentLocation!.lat + (Math.random() - 0.5) * 0.005;
        const newLng = agent.currentLocation!.lng + (Math.random() - 0.5) * 0.005;
        
        // In real app, we'd call updateSalesmanLocation, but for DEMO we just update local state
        // to avoid excessive DB writes while viewing
        setSalesmen(prev => prev.map((s, i) => i === randIdx ? {
          ...s,
          currentLocation: { ...s.currentLocation!, lat: newLat, lng: newLng, lastUpdated: new Date().toISOString() }
        } : s));
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [activeTab, salesmen.length]);

  const stats = useMemo(() => {
    const active = salesmen.filter(s => s.active).length;
    const totalVisitsToday = visits.filter(v => v.checkIn.startsWith(new Date().toISOString().split('T')[0])).length;
    const totalAchieved = targets.reduce((acc, t) => acc + t.achievedAmount, 0);
    const totalTarget = targets.reduce((acc, t) => acc + t.targetAmount, 0);
    const targetCompletion = totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0;

    return { active, totalVisitsToday, totalAchieved, targetCompletion };
  }, [salesmen, visits, targets]);

  const filteredSalesmen = useMemo(() => {
    return salesmen.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.territory.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [salesmen, searchTerm]);

  const chartData = useMemo(() => {
    return targets.map(t => {
      const salesman = salesmen.find(s => s.id === t.salesmanId);
      return {
        name: salesman?.name || 'Unknown',
        achieved: Math.round(t.achievedAmount / 1000),
        target: Math.round(t.targetAmount / 1000)
      };
    }).sort((a,b) => b.achieved - a.achieved).slice(0, 8);
  }, [targets, salesmen]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Activity className="w-12 h-12 text-brand-accent animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-brand-text-muted animate-pulse">Syncing Field Telemetry...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* High-Tech Command Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-brand-sidebar text-white p-6 rounded-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 opacity-20" />
        
        <div className="relative z-10">
          <h1 className="text-3xl font-black tracking-tighter uppercase flex items-center gap-3">
            <Smartphone className="w-8 h-8 text-brand-accent" /> Field Force Command
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-[10px] font-mono text-white/50 border border-white/10 px-2 py-0.5 rounded tracking-widest uppercase">
              Operational Nexus v4.1
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-tight text-success">{stats.active} Force Active</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 relative z-10">
          <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[10px] font-bold uppercase transition-all flex items-center gap-2">
            <Plus className="w-3.5 h-3.5" /> Recruit Executive
          </button>
          <button className="px-4 py-2 bg-brand-accent text-white rounded text-[10px] font-bold uppercase transition-all shadow-lg shadow-brand-accent/20">
            Export Intelligence
          </button>
        </div>
      </div>

      {/* Real-time Metric Layer */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 border-l-4 border-l-brand-accent">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black uppercase text-brand-text-muted tracking-widest">Active Fleet</span>
            <Navigation className="w-4 h-4 text-brand-accent opacity-40" />
          </div>
          <div className="text-3xl font-black tracking-tight">{stats.active} <span className="text-sm font-medium text-brand-text-muted">/ {salesmen.length}</span></div>
          <p className="text-[9px] font-bold uppercase text-brand-text-muted mt-1 px-1 py-0.5 bg-slate-50 inline-block rounded">Field Saturation: {Math.round((stats.active/salesmen.length)*100)}%</p>
        </div>

        <div className="card p-5 border-l-4 border-l-success">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black uppercase text-brand-text-muted tracking-widest">Client Penetration</span>
            <UserCheck className="w-4 h-4 text-success opacity-40" />
          </div>
          <div className="text-3xl font-black tracking-tight">{stats.totalVisitsToday}</div>
          <p className="text-[9px] font-bold uppercase text-brand-text-muted mt-1">Confirmed Visits Today</p>
        </div>

        <div className="card p-5 border-l-4 border-l-warning">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black uppercase text-brand-text-muted tracking-widest">Quota Attainment</span>
            <Target className="w-4 h-4 text-warning opacity-40" />
          </div>
          <div className="text-3xl font-black tracking-tight">₹{(stats.totalAchieved / 100000).toFixed(1)}L</div>
          <div className="w-full bg-slate-100 h-1.5 mt-3 rounded-full overflow-hidden">
            <div className="bg-warning h-full transition-all duration-1000" style={{ width: `${Math.min(100, stats.targetCompletion)}%` }} />
          </div>
        </div>

        <div className="card p-5 border-l-4 border-l-rose-500">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black uppercase text-brand-text-muted tracking-widest">Revenue Forecast</span>
            <DollarSign className="w-4 h-4 text-rose-500 opacity-40" />
          </div>
          <div className="text-3xl font-black tracking-tight">₹42.5L</div>
          <p className="text-[9px] font-bold uppercase text-success mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +12% from projected
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-brand-border">
        {(['tracking', 'team', 'visits', 'performance'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative
              ${activeTab === tab ? 'text-brand-accent' : 'text-brand-text-muted hover:text-brand-text'}
            `}
          >
            {tab} Intelligence
            {activeTab === tab && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-accent" />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'tracking' && (
          <motion.div 
            key="tracking"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Visual Fleet View */}
            <div className="lg:col-span-2 card overflow-hidden p-0 relative min-h-[500px] border border-brand-border">
              {/* Fake Map UI Overlay */}
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                <div className="bg-white/90 backdrop-blur shadow-xl border border-brand-border p-3 rounded-lg">
                  <div className="text-[9px] font-black uppercase tracking-tight text-brand-text-muted mb-2">Satellite Status</div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold uppercase">GPS Signal Locked</span>
                  </div>
                </div>
              </div>

              {/* Minimal SVG Dashboard Map (Stylized) */}
              <div className="absolute inset-0 bg-[#0f172a] overflow-hidden group">
                <svg viewBox="0 0 800 600" className="w-full h-full opacity-40">
                  <path d="M200,100 L600,100 L700,300 L600,500 L200,500 L100,300 Z" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="5,5" />
                  <path d="M150,150 L650,150 L750,350 L650,550 L150,550 L50,350 Z" fill="none" stroke="#1e293b" strokeWidth="1" />
                </svg>

                {/* Salesman Pulse Points */}
                {salesmen.filter(s => s.active && s.currentLocation).map((s, idx) => {
                  // Projecting the lat/lng onto our visual grid
                  // Base for India: Lat 8-37, Lng 68-97
                  const x = (s.currentLocation!.lng - 68) * 20 + 100;
                  const y = (37 - s.currentLocation!.lat) * 15 + 50;

                  return (
                    <motion.div
                      key={s.id}
                      className="absolute cursor-pointer group"
                      style={{ left: `${x}px`, top: `${y}px` }}
                      whileHover={{ scale: 1.2 }}
                      onClick={() => setSelectedSalesman(s)}
                    >
                      <div className="relative">
                        <div className="absolute inset-0 w-8 h-8 -left-3 -top-3 bg-brand-accent/20 rounded-full animate-ping" />
                        <div className="absolute inset-0 w-4 h-4 -left-1 -top-1 bg-brand-accent/40 rounded-full animate-pulse" />
                        <MapPinIcon className="w-5 h-5 text-brand-accent relative z-10" />
                      </div>
                      
                      {/* Tooltip on Hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                        <div className="bg-brand-sidebar text-white text-[9px] font-bold uppercase px-2 py-1 rounded whitespace-nowrap shadow-xl">
                          {s.name} // {s.territory}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Map Footer Bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-white/10 backdrop-blur-md border-t border-white/5 p-4 flex justify-between items-center text-white/50">
                <div className="flex gap-4 text-[9px] font-mono uppercase">
                  <span>LAT PROJECTION: ON</span>
                  <span>SYNC POLLING: 4.0s</span>
                  <span>AGENT DRIFT: ENABLED</span>
                </div>
                <div className="text-[9px] font-mono uppercase">
                   T{new Date().getTime()} // ENGINE ACTIVE
                </div>
              </div>
            </div>

            {/* Sidebar: Selected / Right Side Feed */}
            <div className="space-y-4">
              <div className="card bg-brand-sidebar text-white p-6 border-transparent">
                <h3 className="text-xs font-black uppercase tracking-widest text-white/50 mb-4">Command Terminal</h3>
                
                {selectedSalesman ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-brand-accent/20 rounded-full flex items-center justify-center border border-brand-accent/40 text-brand-accent">
                         <Smartphone className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-tight">{selectedSalesman.name}</h4>
                        <p className="text-[10px] text-white/40 uppercase font-mono">{selectedSalesman.employeeId}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-white/5 rounded border border-white/5">
                        <div className="text-[9px] text-white/40 uppercase mb-1">Last Update</div>
                        <div className="text-[10px] font-bold">{format(new Date(selectedSalesman.currentLocation!.lastUpdated), 'HH:mm:ss')}</div>
                      </div>
                      <div className="p-3 bg-white/5 rounded border border-white/5">
                        <div className="text-[9px] text-white/40 uppercase mb-1">Territory</div>
                        <div className="text-[10px] font-bold truncate">{selectedSalesman.territory}</div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/10">
                      <div className="flex justify-between items-center text-[10px] uppercase">
                        <span className="text-white/40">Status</span>
                        <span className="text-success font-black tracking-tight">CONNECTED</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] uppercase">
                        <span className="text-white/40">Battery</span>
                        <span className="text-white font-black tracking-tight">84%</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] uppercase">
                        <span className="text-white/40">Signal</span>
                        <div className="flex gap-0.5">
                          {[1,2,3,4].map(i => <div key={i} className={`w-1 h-3 rounded-full ${i <= 3 ? 'bg-brand-accent' : 'bg-white/10'}`} />)}
                        </div>
                      </div>
                    </div>

                    <button 
                      className="w-full py-3 bg-brand-accent text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-brand-accent/80 transition-all"
                      onClick={() => setSelectedSalesman(null)}
                    >
                      Clear Terminal
                    </button>
                  </div>
                ) : (
                  <div className="py-12 text-center text-white/20">
                     <Navigation className="w-12 h-12 mx-auto mb-4 opacity-10" />
                     <p className="text-[10px] uppercase font-bold tracking-widest">Select an agent on the grid <br/> for direct telemetry</p>
                  </div>
                )}
              </div>

              {/* Real-time Activity Feed */}
              <div className="card p-5">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-text-muted mb-4 border-b border-brand-border pb-2 flex items-center gap-2">
                  <Activity className="w-3 h-3 text-brand-accent" /> Live Activity Feed
                </h3>
                <div className="space-y-4">
                  {visits.slice(0, 5).map((v) => (
                    <div key={v.id} className="flex gap-3 relative pb-4 before:absolute before:left-2 before:top-6 before:bottom-0 before:w-px before:bg-brand-border last:before:hidden last:pb-0">
                      <div className={`w-4 h-4 rounded-full border-2 border-white shadow-sm mt-1 shrink-0
                        ${v.status === 'Order Taken' ? 'bg-success' : 'bg-brand-accent'}
                      `} />
                      <div className="min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[11px] font-extrabold uppercase truncate tracking-tight">{v.salesmanName}</span>
                          <span className="text-[9px] font-mono text-brand-text-muted shrink-0">{format(new Date(v.checkIn), 'HH:mm')}</span>
                        </div>
                        <p className="text-[10px] text-brand-text-muted font-mono leading-tight mt-0.5">
                          {v.status} at <span className="font-bold text-brand-text">{v.customerName}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'team' && (
          <motion.div 
            key="team"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Filter Hub */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted group-focus-within:text-brand-accent transition-colors" />
                <input 
                  type="text" 
                  placeholder="SEARCH FIELD FORCE BY NAME / ID / TERRITORY..." 
                  className="w-full pl-10 pr-4 py-3 bg-white border border-brand-border rounded font-mono text-[10px] focus:outline-none focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/5 transition-all uppercase"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <select className="px-4 py-3 bg-white border border-brand-border rounded text-[10px] font-bold uppercase focus:ring-4 focus:ring-brand-accent/5 focus:outline-none">
                  <option>ALL ROLES</option>
                  <option>SALES EXECUTIVE</option>
                  <option>AREA MANAGER</option>
                </select>
                <select className="px-4 py-3 bg-white border border-brand-border rounded text-[10px] font-bold uppercase focus:ring-4 focus:ring-brand-accent/5 focus:outline-none">
                  <option>ACTIVE STATUS</option>
                  <option>INACTIVE</option>
                </select>
              </div>
            </div>

            {/* Sales Force Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredSalesmen.map((agent) => (
                <motion.div 
                  key={agent.id}
                  whileHover={{ y: -4 }}
                  className="card group hover:border-brand-accent transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-3">
                    <div className={`w-2 h-2 rounded-full ${agent.active ? 'bg-success animate-pulse' : 'bg-slate-300'}`} />
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-brand-text-muted group-hover:bg-brand-accent/10 group-hover:text-brand-accent transition-colors">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-tight group-hover:text-brand-accent transition-colors">{agent.name}</h4>
                      <p className="text-[10px] font-mono text-brand-text-muted uppercase">{agent.employeeId} · {agent.role}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[10px] uppercase font-bold text-brand-text-muted">
                      <span className="flex items-center gap-1.5"><MapPinIcon className="w-3 h-3"/> Territory</span>
                      <span className="text-brand-text truncate max-w-[120px]">{agent.territory}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] uppercase font-bold text-brand-text-muted">
                      <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-success"/> Quota</span>
                      <span className="text-brand-text">84%</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-brand-border flex items-center justify-between">
                    <div className="flex -space-x-2">
                       {agent.assignedCustomers.slice(0, 3).map((_, i) => (
                         <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-bold">C{i+1}</div>
                       ))}
                       {agent.assignedCustomers.length > 3 && (
                         <div className="w-6 h-6 rounded-full border-2 border-white bg-brand-sidebar text-white flex items-center justify-center text-[8px] font-bold">+{agent.assignedCustomers.length - 3}</div>
                       )}
                    </div>
                    <button className="text-[9px] font-black uppercase tracking-widest text-brand-accent hover:underline flex items-center gap-1">
                      Full Intelligence <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'performance' && (
          <motion.div 
            key="performance"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Sales Achievement Chart */}
            <div className="card p-6">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest">Quota Attainment</h3>
                  <p className="text-[10px] font-bold text-brand-text-muted uppercase">By Revenue (Top Performers, Amount in ₹k)</p>
                </div>
                <Award className="w-6 h-6 text-warning" />
              </div>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={10} fontWeight="bold" width={80} />
                    <RechartsTooltip 
                      contentStyle={{ background: '#1c1c1c', border: 'none', borderRadius: '4px', padding: '8px' }}
                      itemStyle={{ color: '#fff', fontSize: '10px', textTransform: 'uppercase' }}
                      labelStyle={{ display: 'none' }}
                    />
                    <Bar dataKey="achieved" radius={[0, 4, 4, 0]} barSize={20}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                    <Bar dataKey="target" fill="#f1f5f9" radius={[0, 4, 4, 0]} barSize={12} fillOpacity={0.5} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Participation Pie Chart */}
            <div className="card p-6">
               <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest">Visit Efficiency</h3>
                  <p className="text-[10px] font-bold text-brand-text-muted uppercase">Success Rate of Field Engagements</p>
                </div>
                <Target className="w-6 h-6 text-brand-accent" />
              </div>
              <div className="h-[350px] flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="280">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Order Taken', value: visits.filter(v => v.status === 'Order Taken').length },
                        { name: 'Visited', value: visits.filter(v => v.status === 'Visited').length },
                        { name: 'Not Available', value: visits.filter(v => v.status === 'Not Available').length },
                        { name: 'Follow Up', value: visits.filter(v => v.status === 'Follow Up').length },
                      ]}
                      innerRadius={80}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-4">
                   {[
                     { label: 'Order Taken', color: COLORS[0] },
                     { label: 'Visited', color: COLORS[1] },
                     { label: 'Not Available', color: COLORS[2] },
                     { label: 'Follow Up', color: COLORS[3] }
                   ].map(item => (
                     <div key={item.label} className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                       <span className="text-[9px] font-bold uppercase text-brand-text-muted">{item.label}</span>
                     </div>
                   ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'visits' && (
          <motion.div 
            key="visits"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card p-0 overflow-hidden"
          >
            <div className="p-6 border-b border-brand-border flex justify-between items-center bg-slate-50/50">
              <h3 className="text-[10px] font-black uppercase tracking-widest">Field Engagement Registry</h3>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-slate-100 rounded transition-colors"><History className="w-4 h-4 text-brand-text-muted"/></button>
                <button className="p-2 hover:bg-slate-100 rounded transition-colors"><ChevronRight className="w-4 h-4 text-brand-text-muted"/></button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-brand-border bg-slate-50/30">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-tighter text-brand-text-muted">Agent Intel</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-tighter text-brand-text-muted">Customer Interface</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-tighter text-brand-text-muted">Time-Stamp</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-tighter text-brand-text-muted">Status Code</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-tighter text-brand-text-muted">Telemetry</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-tighter text-brand-text-muted items-end">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border font-mono">
                  {visits.map((visit) => (
                    <tr key={visit.id} className="hover:bg-slate-50 transition-all group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black">
                            {visit.salesmanName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-[11px] font-black uppercase tracking-tight text-brand-text">{visit.salesmanName}</div>
                            <div className="text-[9px] text-brand-text-muted">ID: {visit.salesmanId.substring(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[11px] font-black uppercase tracking-tight text-brand-text">{visit.customerName}</div>
                        <div className="text-[9px] text-brand-text-muted uppercase">Retail Tier B</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[10px] font-bold">{format(new Date(visit.checkIn), 'MMM dd, HH:mm')}</div>
                        <div className="text-[9px] text-brand-text-muted italic underline decoration-brand-accent/20 cursor-help">Duration: 42m</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[8px] font-black uppercase border
                          ${visit.status === 'Order Taken' ? 'bg-success/10 text-success border-success/20' : 
                            visit.status === 'Visited' ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/20' : 
                            'bg-slate-100 text-slate-500 border-slate-200'}
                        `}>
                          {visit.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-[10px] text-brand-text-muted">
                           <MapPin className="w-3 h-3 text-brand-accent/60" />
                           {visit.location.lat.toFixed(4)}, {visit.location.lng.toFixed(4)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <button className="p-2 hover:bg-slate-200 rounded transition-all opacity-0 group-hover:opacity-100"><ExternalLink className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SalesmanManagement;

function User({ className }: { className: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ExternalLink({ className }: { className: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  );
}
