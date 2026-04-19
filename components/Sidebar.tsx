import React from 'react';
import { LayoutGrid, Radar, Terminal, Settings, Cpu, Activity, FileText } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSettings: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onOpenSettings }) => {
  const navItems = [
    { id: 'dashboard', label: 'Ops Center', icon: LayoutGrid },
    { id: 'analyzer', label: 'Threat Hunter', icon: Radar },
    { id: 'logs', label: 'Raw Telemetry', icon: Terminal },
    { id: 'reports', label: 'Summary Report', icon: FileText },
  ];

  return (
    <div className="w-64 bg-[#0a0a0a] border-r border-[#262626] flex flex-col h-screen sticky top-0 z-20">
      
      {/* Header Logo */}
      <div className="h-20 flex items-center px-6 border-b border-[#262626] bg-[#050505]">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 flex items-center justify-center bg-white border border-[#d4d4d4] rounded-sm">
             <Cpu className="text-black" size={18} />
          </div>
          <div className="leading-none">
            <h1 className="font-bold text-white tracking-wider text-lg">BLACKGRID</h1>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-8 px-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm transition-all duration-200 group relative ${
              activeTab === item.id
                ? 'bg-[#171717] text-white'
                : 'text-[#737373] hover:text-[#d4d4d4] hover:bg-[#171717]/50'
            }`}
          >
            {activeTab === item.id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r"></div>
            )}
            <item.icon size={18} strokeWidth={1.5} />
            <span className="font-medium text-sm tracking-wide uppercase">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* System Status Footer */}
      <div className="p-4 border-t border-[#262626] bg-[#050505]">
        <div className="bg-[#171717] border border-[#262626] rounded-sm p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-[#737373] uppercase tracking-wider font-bold">Immunity System</span>
            <Activity size={12} className="text-emerald-500 animate-pulse" />
          </div>
          <div className="text-xs font-mono text-emerald-500 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
            ACTIVE_MONITORING
          </div>
        </div>

        <button 
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-3 py-2 text-[#737373] hover:text-white hover:bg-[#171717] rounded-sm transition-colors"
        >
          <Settings size={16} />
          <span className="text-xs uppercase tracking-wider font-bold">Platform Config</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
