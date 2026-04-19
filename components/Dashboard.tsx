import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { ShieldAlert, Scan, Activity, Lock, Globe, Server, AlertOctagon, ShieldCheck } from 'lucide-react';
import { LogEntry, ThreatLevel } from '../types';

interface DashboardProps {
  logs: LogEntry[];
}

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
  <div className="hud-border p-5 min-h-[120px] flex flex-col justify-between group hover:bg-[#111] transition-colors">
    <div className="flex justify-between items-start">
      <span className="text-[10px] text-[#737373] uppercase tracking-[0.2em] font-bold">{title}</span>
      <Icon size={18} className={`text-${color}-500 opacity-60`} />
    </div>
    <div className="flex items-end gap-3">
      <span className="text-4xl font-mono font-medium text-white tracking-tighter">{value}</span>
      {trend && (
         <span className={`text-xs font-mono mb-1.5 ${trend === 'neutral' ? 'text-slate-500' : 'text-' + color + '-500'}`}>
           {trend}
         </span>
      )}
    </div>
    <div className={`h-0.5 w-full bg-[#262626] mt-3 overflow-hidden relative`}>
       <div className={`absolute top-0 left-0 h-full bg-${color}-600 w-2/3 opacity-50 group-hover:w-full transition-all duration-500`}></div>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black border border-[#333] p-2 shadow-xl">
        <p className="text-[#737373] text-[10px] font-mono uppercase">{label}</p>
        <p className="text-white text-xs font-mono">
          SEVERITY: <span style={{color: payload[0].stroke}}>{['','L','M','H','C'][payload[0].value]}</span>
        </p>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC<DashboardProps> = ({ logs }) => {
  const threats = logs.filter(l => l.details.isAgenticThreat === true);
  const criticalCount = logs.filter(l => l.threatLevel === ThreatLevel.CRITICAL).length;
  
  // Dynamic System Load Calculation: Base 12% + (1% per log) + (5% per Critical threat)
  // Emulates the CPU cost of the TensorFlow.js engine running in the background
  const baseLoad = 12;
  const calculatedLoad = Math.min(98, baseLoad + (logs.length * 0.5) + (criticalCount * 5));
  
  const timeData = logs.slice(-20).map((log, index) => ({
    time: log.timestamp.split('T')[1].split('.')[0],
    severity: log.threatLevel === 'CRITICAL' ? 4 : log.threatLevel === 'HIGH' ? 3 : log.threatLevel === 'MEDIUM' ? 2 : 1,
    idx: index
  }));

  return (
    <div className="p-8 h-full overflow-y-auto pb-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide uppercase flex items-center gap-2">
            <Globe size={20} className="text-blue-600" />
            Global Threat Posture
          </h2>
          <p className="text-[#737373] text-xs font-mono mt-1">SECTOR: ALPHA // NODE: VANGUARD-01 // MODE: OFFLINE</p>
        </div>
        <div className="flex gap-4">
           <div className="flex items-center gap-2 text-xs font-mono text-emerald-500 bg-emerald-950/30 px-3 py-1 border border-emerald-900/50">
              <ShieldCheck size={12} />
              MCP_GUARDRAILS: ACTIVE
           </div>
           <div className="flex items-center gap-2 text-xs font-mono text-blue-400 bg-blue-950/30 px-3 py-1 border border-blue-900/50">
              <Activity size={12} />
              TFJS_NEURAL_NET: ONLINE
           </div>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="h-[60vh] flex flex-col items-center justify-center border border-dashed border-[#262626] rounded-sm bg-[#0a0a0a]">
           <Scan size={48} className="text-[#333] mb-4 animate-pulse" />
           <h3 className="text-white font-mono text-lg mb-2">NO TELEMETRY DATA</h3>
           <p className="text-[#737373] text-sm max-w-md text-center">
             Neural Engine is standing by. Initiate <span className="text-blue-500">Threat Hunter</span> to begin procedural log generation.
           </p>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard 
              title="Events Scanned" 
              value={logs.length} 
              icon={Activity} 
              color="blue" 
              trend="LOG_STREAM_ACTIVE"
            />
            <StatCard 
              title="Agentic Threats" 
              value={threats.length} 
              icon={AlertOctagon} 
              color="orange"
              trend={threats.length > 0 ? "DETECTED" : "NONE"}
            />
            <StatCard 
              title="Breaches Prevented" 
              value={criticalCount} 
              icon={ShieldAlert} 
              color="red"
              trend={criticalCount > 0 ? "BLOCKED" : "SECURE"}
            />
             <StatCard 
              title="Neural Load" 
              value={`${Math.floor(calculatedLoad)}%`} 
              icon={Server} 
              color="emerald"
              trend="COMPUTE_INTENSIVE"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[350px]">
            <div className="lg:col-span-2 hud-border p-5 bg-[#0a0a0a] flex flex-col">
              <div className="flex justify-between mb-4">
                 <h3 className="text-xs text-[#a3a3a3] font-bold uppercase tracking-widest">Anomaly Timeline</h3>
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeData}>
                    <defs>
                      <linearGradient id="colorSeverity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                    <XAxis dataKey="idx" hide />
                    <YAxis stroke="#525252" domain={[0, 4]} tickCount={5} tick={{fontSize: 10, fontFamily: 'monospace'}} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ef4444', strokeWidth: 1 }} />
                    <Area 
                      type="monotone" 
                      dataKey="severity" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorSeverity)" 
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="hud-border p-5 bg-[#0a0a0a]">
              <div className="flex justify-between mb-4">
                 <h3 className="text-xs text-[#a3a3a3] font-bold uppercase tracking-widest">Threat Distribution</h3>
              </div>
              <div className="space-y-4 mt-8">
                {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((level) => {
                  const count = logs.filter(l => l.threatLevel === level).length;
                  const total = logs.length;
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  const color = level === 'CRITICAL' ? 'bg-red-600' : level === 'HIGH' ? 'bg-orange-500' : level === 'MEDIUM' ? 'bg-yellow-500' : 'bg-emerald-600';
                  
                  return (
                    <div key={level}>
                      <div className="flex justify-between text-xs font-mono mb-1 text-[#d4d4d4]">
                        <span>{level}</span>
                        <span>{count}</span>
                      </div>
                      <div className="w-full h-1 bg-[#262626]">
                        <div className={`h-full ${color}`} style={{width: `${pct}%`}}></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;