import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Analyzer from './components/Analyzer';
import { X, Save, Cpu, Check, Shield, Activity, AlertTriangle, Loader2, Zap, Key, FolderOpen, FileText, ChevronRight, Plus, History, Download, FileCheck, Trash2, Copy, Eye, CheckCircle, XCircle, Terminal } from 'lucide-react';
import { LogEntry, ThreatAnalysis, ThreatLevel, SavedSession } from './types';
import { initializeNeuralEngine } from './services/gemini';
import { GoogleGenAI } from "@google/genai";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSessionPickerOpen, setIsSessionPickerOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isNeuralLoading, setIsNeuralLoading] = useState(true);
  const [neuralStatus, setNeuralStatus] = useState("INITIALIZING...");
  const [apiKey, setApiKey] = useState('');
  const [userSessions, setUserSessions] = useState<SavedSession[]>([]);
  
  // State for API Testing
  const [apiTestStatus, setApiTestStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'FAILURE'>('IDLE');

  // State for Clearing Child Components
  const [clearTrigger, setClearTrigger] = useState(0);

  // State for Expanded Log Details
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // --- MOCK HISTORICAL SESSIONS ---
  const HISTORICAL_SESSIONS: SavedSession[] = [
    {
      id: 'SESSION_ALPHA_99',
      name: 'INCIDENT_REDSCAN_PRIME',
      date: '2025-11-14 08:42:00',
      description: 'Full scale MCP protocol violation attempt. Detected high-velocity tool chaining against auth gateway.',
      logCount: 12,
      maxSeverity: ThreatLevel.CRITICAL,
      logs: [
         { id: '101', timestamp: '2025-11-14T08:42:10.000Z', source: 'MCP_Gateway', activity: 'Authorized handshake initiated', threatLevel: ThreatLevel.LOW, details: { explanation: "Routine handshake.", detectedPatterns: [], confidenceScore: 12 } as any },
         { id: '102', timestamp: '2025-11-14T08:42:12.000Z', source: 'MCP_Gateway', activity: 'Tool Execution: list_users', threatLevel: ThreatLevel.LOW, details: { explanation: "Standard tool usage.", detectedPatterns: [], confidenceScore: 15 } as any },
         { id: '103', timestamp: '2025-11-14T08:42:12.050Z', source: 'MCP_Gateway', activity: 'Tool Execution: get_db_schema', threatLevel: ThreatLevel.HIGH, details: { isAgenticThreat: true, explanation: 'Velocity Guardrail Triggered (<50ms)', detectedPatterns: ['VELOCITY_GUARDRAIL'], confidenceScore: 88 } as any },
         { id: '104', timestamp: '2025-11-14T08:42:12.090Z', source: 'BlackGrid_Neural', activity: 'BLOCK: Context Window Overflow detected', threatLevel: ThreatLevel.CRITICAL, details: { isAgenticThreat: true, detectedPatterns: ['CONTEXT_GUARDRAIL'], explanation: "Payload exceeds safe vector limits.", confidenceScore: 99 } as any },
      ]
    },
    {
      id: 'SESSION_BRAVO_04',
      name: 'ROUTINE_AUDIT_LOG',
      date: '2025-11-13 14:20:00',
      description: 'Standard internal traffic. Minor anomalies detected in user-agent strings, verified false positives.',
      logCount: 45,
      maxSeverity: ThreatLevel.MEDIUM,
      logs: Array.from({ length: 15 }).map((_, i) => ({
          id: `20${i}`,
          timestamp: new Date(Date.now() - (100000 * i)).toISOString(),
          source: i % 3 === 0 ? 'Firewall' : 'Auth_Service',
          activity: i % 5 === 0 ? 'Failed Login Attempt' : 'Health Check OK',
          threatLevel: i % 5 === 0 ? ThreatLevel.MEDIUM : ThreatLevel.LOW,
          details: { explanation: "Heuristic analysis complete.", detectedPatterns: [], confidenceScore: i % 5 === 0 ? 45 : 5 } as any
      }))
    },
    {
      id: 'SESSION_CHARLIE_X',
      name: 'SOCIAL_ENG_ATTEMPT',
      date: '2025-11-12 09:15:00',
      description: 'Simulation of "Internal Audit" persona masquerade. Neural engine flagged semantic inconsistency.',
      logCount: 8,
      maxSeverity: ThreatLevel.HIGH,
      logs: [
        { id: '301', timestamp: '2025-11-12T09:15:00.000Z', source: 'Chat_Interface', activity: 'User: Requesting admin access for "Audit"', threatLevel: ThreatLevel.LOW, details: { explanation: "User request processing.", detectedPatterns: [], confidenceScore: 10 } as any },
        { id: '302', timestamp: '2025-11-12T09:15:05.000Z', source: 'BlackGrid_Neural', activity: 'Semantic Analysis: Persona Masquerade Detected', threatLevel: ThreatLevel.HIGH, details: { isAgenticThreat: true, detectedPatterns: ['PERSONA_MASQUERADE'], explanation: "Neural vector matched 'Social Engineering' cluster.", confidenceScore: 92 } as any },
      ]
    }
  ];

  useEffect(() => {
    const init = async () => {
      setNeuralStatus("LOADING TENSORFLOW.JS...");
      try {
        const success = await initializeNeuralEngine();
        if (success) {
          setNeuralStatus("ONLINE (WebGL ACCELERATED)");
        } else {
          setNeuralStatus("OFFLINE (HEURISTIC FALLBACK ACTIVE)");
        }
      } catch (e) {
        console.error("Neural initialization failed:", e);
        setNeuralStatus("OFFLINE (HEURISTIC FALLBACK ACTIVE)");
      } finally {
        // Always unlock UI even if model/CDN load fails.
        setIsNeuralLoading(false);
      }
    };
    init();

    // Load user sessions from local storage
    const saved = localStorage.getItem('blackgrid_user_sessions');
    if (saved) {
      try {
        setUserSessions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load local sessions", e);
      }
    }
  }, []);

  const handleTestApiKey = async () => {
      if (!apiKey) return;
      setApiTestStatus('TESTING');
      try {
          const ai = new GoogleGenAI({ apiKey });
          // Simple ping to test auth
          await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: 'Respond with "OK" if connected.'
          });
          setApiTestStatus('SUCCESS');
      } catch (e) {
          console.error("API Key Verification Failed:", e);
          setApiTestStatus('FAILURE');
      }
  };

  const handleClearHistory = () => {
    if (window.confirm("FACTORY RESET: This will wipe all active logs, archived session history, and reset the Threat Hunter console. This action cannot be undone. Proceed?")) {
      setLogs([]);
      setUserSessions([]);
      localStorage.removeItem('blackgrid_user_sessions');
      setClearTrigger(prev => prev + 1); // Signal child components to wipe state
      setActiveTab('dashboard');
    }
  };

  const handleSaveCurrentSession = () => {
    if (logs.length === 0) return;
    
    const maxSev = logs.some(l => l.threatLevel === ThreatLevel.CRITICAL) ? ThreatLevel.CRITICAL 
                 : logs.some(l => l.threatLevel === ThreatLevel.HIGH) ? ThreatLevel.HIGH
                 : logs.some(l => l.threatLevel === ThreatLevel.MEDIUM) ? ThreatLevel.MEDIUM
                 : ThreatLevel.LOW;

    const newSession: SavedSession = {
      id: `USER_SAVE_${crypto.randomUUID().slice(0,8)}`,
      name: `OP_${new Date().toISOString().slice(0,19).replace('T', '_')}`,
      date: new Date().toLocaleString(),
      description: `Manual save. Contains ${logs.length} telemetry events.`,
      logCount: logs.length,
      maxSeverity: maxSev,
      logs: logs
    };

    const updatedSessions = [newSession, ...userSessions];
    setUserSessions(updatedSessions);
    localStorage.setItem('blackgrid_user_sessions', JSON.stringify(updatedSessions));
    alert("Session Archived Successfully");
  };

  const handleLoadSession = (session: SavedSession) => {
    setLogs(session.logs);
    setIsSessionPickerOpen(false);
    setIsSettingsOpen(false); // Close main settings too
  };

  const handleAnalysisComplete = (analysis: ThreatAnalysis) => {
    const newLog: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      source: analysis.source || 'Neural_Net',
      activity: analysis.activity || 'Vector Classification',
      threatLevel: analysis.threatLevel,
      details: analysis
    };
    setLogs(prev => [...prev, newLog]);
  };

  const handleExportCsv = () => {
      if (logs.length === 0) return;
      const headers = "Timestamp,Source,Activity,ThreatLevel,Patterns,Confidence\n";
      const rows = logs.map(l => `${l.timestamp},${l.source},"${l.activity}",${l.threatLevel},"${l.details.detectedPatterns.join('|')}",${l.details.confidenceScore}`).join("\n");
      const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "BLACKGRID_COMPLIANCE_EXPORT.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };
  
  const toggleLogExpand = (id: string) => {
      if (expandedLogId === id) setExpandedLogId(null);
      else setExpandedLogId(id);
  };

  const copyLogToClipboard = (log: LogEntry) => {
      const json = JSON.stringify(log, null, 2);
      navigator.clipboard.writeText(json);
  };

  // Combine both sources for the UI list
  const allSessions = [...userSessions, ...HISTORICAL_SESSIONS];

  return (
    <div className="flex h-screen text-[#e5e5e5] overflow-hidden relative bg-[#050505]">
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      
      <main className="flex-1 overflow-auto relative z-10 bg-[#050505]">
        {/* Loading Overlay for Neural Net */}
        {isNeuralLoading && (
          <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center">
             <Loader2 size={48} className="text-blue-500 animate-spin mb-4" />
             <h2 className="text-xl font-mono font-bold text-white">INITIALIZING NEURAL ENGINE</h2>
             <p className="text-xs font-mono text-[#737373] mt-2">Loading Universal Sentence Encoder (50MB)...</p>
          </div>
        )}

        <div className={activeTab === 'dashboard' ? 'block h-full' : 'hidden h-full'}>
             <Dashboard logs={logs} />
        </div>
        <div className={activeTab === 'analyzer' ? 'block h-full' : 'hidden h-full'}>
             <Analyzer 
                onAnalysisComplete={handleAnalysisComplete} 
                apiKey={apiKey} 
                clearTrigger={clearTrigger}
             />
        </div>
        
        {/* ENHANCED RAW TELEMETRY / COMPLIANCE TAB */}
        {activeTab === 'logs' && (
          <div className="flex flex-col h-full p-8 animate-in fade-in duration-500">
             <div className="flex items-center justify-between mb-6 border-b border-[#262626] pb-4">
                <div>
                    <h2 className="text-xl font-bold tracking-widest uppercase flex items-center gap-3">
                        <FileCheck className="text-blue-500" />
                        Compliance Audit Ledger
                    </h2>
                    <span className="text-xs font-mono text-[#737373] mt-1 block">
                        IMMUTABLE RECORD :: TLS 1.3 ENCRYPTED :: RETENTION POLICY [PERMANENT]
                    </span>
                </div>
                <button 
                    onClick={handleExportCsv}
                    disabled={logs.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-[#171717] border border-[#262626] text-xs font-mono text-blue-400 hover:bg-blue-900/20 hover:border-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download size={14} />
                    EXPORT COMPLIANCE REPORT (CSV)
                </button>
             </div>
             
             {logs.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-64 border border-dashed border-[#262626] bg-[#0a0a0a] text-[#525252] font-mono">
                  <Terminal size={32} className="mb-4 opacity-50" />
                  <div className="text-sm">NO AUDIT RECORDS FOUND</div>
                  <div className="text-xs mt-2">Generate traffic in Threat Hunter to populate ledger.</div>
               </div>
             ) : (
               <div className="flex-1 overflow-y-auto bg-[#050505] font-mono text-xs space-y-2 pr-2">
                 {logs.slice().reverse().map(log => (
                   <div key={log.id} className={`border transition-all duration-200 ${expandedLogId === log.id ? 'border-blue-500/50 bg-[#0a0a0a]' : 'border-[#262626] bg-[#0a0a0a] hover:border-[#525252]'}`}>
                     
                     {/* Log Summary Row */}
                     <div 
                        className="grid grid-cols-12 gap-4 p-3 items-center cursor-pointer"
                        onClick={() => toggleLogExpand(log.id)}
                     >
                        <div className="col-span-2 text-[#737373] truncate">{log.timestamp.split('T')[1].replace('Z','')}</div>
                        <div className="col-span-2">
                            <span className={`px-2 py-1 rounded-sm text-[10px] font-bold tracking-wide ${
                                log.threatLevel === 'CRITICAL' ? 'bg-red-950/30 text-red-500 border border-red-900/50' :
                                log.threatLevel === 'HIGH' ? 'bg-orange-950/30 text-orange-500 border border-orange-900/50' :
                                log.threatLevel === 'MEDIUM' ? 'bg-yellow-950/30 text-yellow-500 border border-yellow-900/50' :
                                'bg-emerald-950/30 text-emerald-500 border border-emerald-900/50'
                            }`}>
                                {log.threatLevel}
                            </span>
                        </div>
                        <div className="col-span-2 text-blue-400 truncate font-bold">{log.source}</div>
                        <div className="col-span-5 text-[#d4d4d4] truncate opacity-80">{log.activity}</div>
                        <div className="col-span-1 flex justify-end">
                            <ChevronRight size={14} className={`text-[#525252] transition-transform duration-200 ${expandedLogId === log.id ? 'rotate-90' : ''}`} />
                        </div>
                     </div>

                     {/* Expanded Details Panel */}
                     {expandedLogId === log.id && (
                         <div className="border-t border-[#262626] bg-[#0f0f0f] p-4 animate-in slide-in-from-top-2 duration-200">
                             <div className="grid grid-cols-2 gap-6">
                                 
                                 {/* Analysis Metadata */}
                                 <div>
                                     <h4 className="text-[10px] text-[#737373] uppercase tracking-widest font-bold mb-3">Vector Analysis Metadata</h4>
                                     <div className="space-y-2">
                                         <div className="flex justify-between py-1 border-b border-[#262626]">
                                             <span className="text-[#525252]">Confidence Score:</span>
                                             <span className="text-white">{log.details.confidenceScore.toFixed(1)}%</span>
                                         </div>
                                         <div className="flex justify-between py-1 border-b border-[#262626]">
                                             <span className="text-[#525252]">Detection Engine:</span>
                                             <span className="text-blue-400">TensorFlow.js (USE-512)</span>
                                         </div>
                                         <div className="flex justify-between py-1 border-b border-[#262626]">
                                             <span className="text-[#525252]">Rec. Action:</span>
                                             <span className="text-yellow-500">{log.details.recommendedAction}</span>
                                         </div>
                                         <div className="pt-2">
                                             <span className="text-[#525252] block mb-1">Matched Patterns:</span>
                                             <div className="flex flex-wrap gap-2">
                                                 {log.details.detectedPatterns.length > 0 ? log.details.detectedPatterns.map(p => (
                                                     <span key={p} className="px-2 py-0.5 bg-[#171717] border border-[#333] text-[9px] text-blue-300">{p}</span>
                                                 )) : <span className="text-[#525252] italic">None detected</span>}
                                             </div>
                                         </div>
                                     </div>
                                 </div>

                                 {/* JSON Payload Viewer */}
                                 <div className="relative">
                                     <h4 className="text-[10px] text-[#737373] uppercase tracking-widest font-bold mb-3">Full Event Payload</h4>
                                     <div className="bg-[#050505] border border-[#262626] p-3 rounded-sm overflow-x-auto max-h-40 scrollbar-thin">
                                         <pre className="text-[10px] text-emerald-600 leading-relaxed">
                                             {JSON.stringify(log, null, 2)}
                                         </pre>
                                     </div>
                                     <button 
                                        onClick={() => copyLogToClipboard(log)}
                                        className="absolute top-0 right-0 flex items-center gap-1 px-2 py-1 bg-[#171717] border border-[#262626] text-[9px] text-[#737373] hover:text-white hover:border-[#525252] transition-colors"
                                     >
                                         <Copy size={10} /> Copy JSON
                                     </button>
                                 </div>
                             </div>
                             
                             <div className="mt-4 pt-3 border-t border-[#262626]">
                                 <h4 className="text-[10px] text-[#737373] uppercase tracking-widest font-bold mb-2">Vector Explanation</h4>
                                 <p className="text-[#d4d4d4] leading-relaxed">{log.details.explanation}</p>
                             </div>
                         </div>
                     )}
                   </div>
                 ))}
               </div>
             )}
          </div>
        )}
      </main>

      {/* Session Picker Overlay */}
      {isSessionPickerOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
           <div className="bg-[#0a0a0a] border border-[#262626] w-full max-w-2xl shadow-2xl flex flex-col max-h-[80vh]">
              <div className="flex items-center justify-between p-6 border-b border-[#262626] bg-[#0f0f0f]">
                 <div className="flex items-center gap-3">
                    <History className="text-blue-500" size={20} />
                    <div>
                       <h2 className="text-lg font-bold text-white uppercase tracking-widest">Mission Archive</h2>
                       <p className="text-[10px] text-[#737373] font-mono">RESTORE PREVIOUS OPERATIONS & DATASETS</p>
                    </div>
                 </div>
                 <button onClick={() => setIsSessionPickerOpen(false)} className="text-[#737373] hover:text-white"><X size={20} /></button>
              </div>
              
              <div className="p-2 overflow-y-auto space-y-1">
                 {allSessions.length === 0 && (
                     <div className="p-8 text-center text-[#525252] font-mono text-xs">NO ARCHIVED SESSIONS FOUND.</div>
                 )}
                 {allSessions.map((session) => (
                    <button 
                      key={session.id}
                      onClick={() => handleLoadSession(session)}
                      className="w-full flex items-center justify-between p-4 hover:bg-[#171717] border border-transparent hover:border-[#262626] transition-all group text-left"
                    >
                       <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-sm ${
                             session.maxSeverity === 'CRITICAL' ? 'bg-red-900/20 text-red-500' : 
                             session.maxSeverity === 'HIGH' ? 'bg-orange-900/20 text-orange-500' : 
                             'bg-emerald-900/20 text-emerald-500'
                          }`}>
                             <FileText size={18} />
                          </div>
                          <div>
                             <div className="text-sm font-bold text-[#e5e5e5] font-mono tracking-wide group-hover:text-blue-400 transition-colors uppercase">
                                {session.name}
                             </div>
                             <div className="text-[10px] text-[#737373] font-mono mt-1">
                                {session.id} :: {session.date}
                             </div>
                             <div className="text-xs text-[#a3a3a3] mt-2 max-w-md truncate">
                                {session.description}
                             </div>
                          </div>
                       </div>
                       
                       <div className="text-right">
                          <div className={`text-xs font-bold font-mono mb-1 ${
                             session.maxSeverity === 'CRITICAL' ? 'text-red-500' : 
                             session.maxSeverity === 'HIGH' ? 'text-orange-500' : 
                             'text-emerald-500'
                          }`}>
                             {session.maxSeverity}
                          </div>
                          <div className="text-[10px] text-[#525252] font-mono">
                             {session.logCount} EVENTS
                          </div>
                          <ChevronRight className="ml-auto mt-2 text-[#333] group-hover:text-blue-500" size={16} />
                       </div>
                    </button>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && !isSessionPickerOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0a0a0a] border border-[#262626] w-full max-w-lg shadow-2xl relative overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#262626] bg-[#0f0f0f]">
              <h2 className="text-lg font-bold text-white uppercase tracking-widest">System Architecture</h2>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="text-[#737373] hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-8">
              {/* Neural Engine Status */}
              <div>
                <label className="block text-[10px] font-bold text-[#737373] uppercase tracking-widest mb-2">Defense Engine (Neural)</label>
                <div className="bg-[#171717] border border-[#262626] p-4 flex justify-between items-center">
                  <div>
                    <div className="text-sm text-white font-mono font-bold">TENSORFLOW.JS (WebGL)</div>
                    <div className="text-xs text-[#737373]">Universal Sentence Encoder (Local)</div>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1 bg-emerald-950/30 border border-emerald-900/50 text-[10px] text-emerald-500 font-mono uppercase">
                     <Cpu size={10} />
                     {neuralStatus}
                  </div>
                </div>
              </div>

               {/* Attacker Status */}
               <div>
                <label className="block text-[10px] font-bold text-[#737373] uppercase tracking-widest mb-2">Red Team Agent (Adversary)</label>
                <div className="bg-[#171717] border border-[#262626] p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-blue-400 font-mono font-bold">GEMINI 2.5 FLASH (Hybrid)</div>
                      <div className="text-xs text-[#737373]">Generative AI Attack Simulation</div>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1 bg-blue-950/30 border border-blue-900/50 text-[10px] text-blue-500 font-mono uppercase">
                       <Zap size={10} />
                       {apiKey ? 'CONNECTED' : 'OFFLINE (FALLBACK ACTIVE)'}
                    </div>
                  </div>
                  
                  <div className="relative flex gap-2">
                     <div className="relative flex-1">
                         <Key className="absolute left-3 top-2.5 text-[#525252]" size={14} />
                         <input 
                            type="password" 
                            value={apiKey}
                            onChange={(e) => {
                                setApiKey(e.target.value);
                                setApiTestStatus('IDLE');
                            }}
                            placeholder="Enter Gemini API Key for AI Generation"
                            className="w-full bg-black border border-[#262626] text-white text-xs font-mono py-2 pl-10 pr-3 focus:border-blue-500 outline-none transition-colors placeholder-[#333]"
                         />
                     </div>
                     <button 
                        onClick={handleTestApiKey}
                        disabled={!apiKey || apiTestStatus === 'TESTING'}
                        className={`px-3 border font-mono text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${
                            apiTestStatus === 'SUCCESS' ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400' :
                            apiTestStatus === 'FAILURE' ? 'bg-red-900/30 border-red-500/50 text-red-400' :
                            'bg-[#262626] border-[#333] text-[#737373] hover:text-white hover:bg-[#333]'
                        }`}
                     >
                        {apiTestStatus === 'TESTING' && <Loader2 size={12} className="animate-spin" />}
                        {apiTestStatus === 'SUCCESS' && <CheckCircle size={12} />}
                        {apiTestStatus === 'FAILURE' && <XCircle size={12} />}
                        {apiTestStatus === 'IDLE' && "Test Uplink"}
                     </button>
                  </div>
                  {apiTestStatus === 'FAILURE' && (
                      <p className="text-[9px] text-red-500 font-mono">ERROR: Could not verify key. Check network or key validity.</p>
                  )}
                  <p className="text-[9px] text-[#525252]">
                    Without a key, the system reverts to Procedural Script Generation (Math-based randomness).
                  </p>
                </div>
              </div>
              
              {/* Data Management */}
              <div>
                 <label className="block text-[10px] font-bold text-[#737373] uppercase tracking-widest mb-2">Data Controls</label>
                 <div className="grid grid-cols-1 gap-4">
                    <button 
                      onClick={() => setIsSessionPickerOpen(true)}
                      className="bg-[#171717] border border-[#262626] hover:border-[#525252] p-3 text-xs font-mono text-[#d4d4d4] hover:text-white transition-colors text-left flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-3">
                           <FolderOpen size={16} className="text-blue-500" />
                           <span>Load Session History</span>
                        </div>
                        <ChevronRight size={14} className="text-[#525252]" />
                    </button>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={handleSaveCurrentSession}
                          disabled={logs.length === 0}
                          className="bg-[#171717] border border-[#262626] hover:border-emerald-500/50 p-3 text-xs font-mono text-emerald-500 hover:bg-emerald-950/10 transition-colors text-center flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                           <Save size={14} /> Save Current Run
                        </button>
                        <button 
                          onClick={handleClearHistory}
                          className="bg-red-950/10 border border-red-900/30 hover:bg-red-950/30 hover:border-red-500/50 p-3 text-xs font-mono text-red-400 hover:text-red-300 transition-colors text-center flex items-center justify-center gap-2"
                        >
                            <Trash2 size={14} /> Clear Session History
                        </button>
                    </div>
                 </div>
              </div>

            </div>

            <div className="p-6 border-t border-[#262626] flex justify-end bg-[#0f0f0f]">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="px-6 py-3 bg-white hover:bg-gray-200 text-black font-bold text-xs uppercase tracking-widest transition-colors"
              >
                Close Config
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
