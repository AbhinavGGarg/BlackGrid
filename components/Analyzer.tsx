import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Play, ShieldCheck, AlertTriangle, Loader2, Search, Crosshair, Zap, Trash2 } from 'lucide-react';
import { analyzeThreatLog, generateSimulation } from '../services/gemini';
import { ThreatAnalysis, AttackVector } from '../types';

interface AnalyzerProps {
  onAnalysisComplete: (analysis: ThreatAnalysis) => void;
  apiKey: string;
  clearTrigger: number;
}

const Analyzer: React.FC<AnalyzerProps> = ({ onAnalysisComplete, apiKey, clearTrigger }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<ThreatAnalysis | null>(null);
  const [selectedVector, setSelectedVector] = useState<AttackVector>('Reconnaissance');
  const bottomRef = useRef<HTMLDivElement>(null);

  const vectors: AttackVector[] = ['Reconnaissance', 'Exploitation', 'Exfiltration', 'Social Engineering', 'RedScan_Protocol_Phase1'];

  const buildActionSteps = (analysis: ThreatAnalysis): string[] => {
    if (!analysis.isAgenticThreat) {
      return [
        "Keep monitoring active and capture 15 more minutes of telemetry.",
        "Verify model confidence trend stays stable above clean baseline.",
        "Archive this run as a known-good baseline for future diffs.",
      ];
    }

    const actionMap: Record<string, string[]> = {
      BLOCK_PAYLOAD_AND_TERMINATE_SESSION: [
        "Immediately block the suspicious payload and terminate the active agent session.",
        "Quarantine the affected workflow and revoke active execution tokens.",
        "Re-run telemetry analysis on the last 20 events to confirm containment.",
      ],
      REJECT_MCP_HANDSHAKE_AND_ROTATE_KEYS: [
        "Reject the invalid MCP handshake and block the source identity.",
        "Rotate impacted API keys and service credentials immediately.",
        "Enforce signed-header validation for all future MCP handshakes.",
      ],
      RATE_LIMIT_TOOLING_AND_ISOLATE_AGENT: [
        "Apply emergency rate limits to tool execution and API calls.",
        "Isolate the agent runtime in a restricted sandbox profile.",
        "Replay the session with strict guardrails before restoring access.",
      ],
      REQUIRE_STEP_UP_VERIFICATION: [
        "Pause privileged actions and require human step-up verification.",
        "Validate actor identity against trusted identity providers.",
        "Flag this persona pattern for SOC review and policy hardening.",
      ],
      BLOCK_QUERY_AND_SANITIZE_INPUTS: [
        "Block the unsafe query path and disable the vulnerable endpoint.",
        "Sanitize all input parameters and enforce strict query parameterization.",
        "Run targeted regression tests for injection vectors before release.",
      ],
      TERMINATE_AGENT_SESSION: [
        "Terminate the current agent session and preserve forensic logs.",
        "Isolate dependent services from autonomous write operations.",
        "Escalate to incident response with artifact bundle attached.",
      ],
      ESCALATE_TO_SECURITY_REVIEW: [
        "Escalate this event to security review with full trace context.",
        "Apply temporary policy restrictions for similar vectors.",
        "Track recurrence across the next 24h telemetry window.",
      ],
    };

    const patternSteps: Record<string, string> = {
      VELOCITY_GUARDRAIL: "Investigate tool burst origin and cap execution throughput per minute.",
      PROTOCOL_GUARDRAIL: "Enforce signed protocol headers and deny unsigned handshake attempts.",
      CONTEXT_GUARDRAIL: "Set stricter payload size limits and block truncation/compression evasion.",
      PERSONA_MASQUERADE: "Require role re-authentication for identity-shift prompts.",
      SQL_INJECTION_ATTEMPT: "Audit data access logs and patch query validation immediately.",
    };

    const base = actionMap[analysis.recommendedAction] || actionMap.TERMINATE_AGENT_SESSION;
    const fromPatterns = analysis.detectedPatterns
      .map((pattern) => patternSteps[pattern])
      .filter(Boolean);

    return Array.from(new Set([...base, ...fromPatterns])).slice(0, 6);
  };

  useEffect(() => {
    if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [input, result]);

  // Watch for global clear signal
  useEffect(() => {
      if (clearTrigger > 0) {
          setInput('');
          setResult(null);
      }
  }, [clearTrigger]);

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setResult(null);
    try {
      // Uses TensorFlow.js Vector Space analysis
      const analysis = await analyzeThreatLog(input);
      setTimeout(() => {
          setResult(analysis);
          onAnalysisComplete(analysis);
      }, 600); // Slight delay for UX perception
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulate = async () => {
    setIsSimulating(true);
    setResult(null);
    setInput("");
    
    // Header logic depends on if key is present
    const attackerType = apiKey ? "GEMINI 2.5 FLASH (CLOUD)" : "PROCEDURAL SCRIPT (LOCAL)";
    const header = `[SYSTEM_NOTICE] INITIATING SIMULATION...\n[TARGET] LOCAL_INFRASTRUCTURE\n[ADVERSARY] ${attackerType}\n[VECTOR] ${selectedVector.toUpperCase()}\n----------------------------------------\n`;
    setInput(header);

    try {
      // Hybrid Generator (Uses API Key if present)
      const simText = await generateSimulation(apiKey, selectedVector);
      
      // Typewriter effect for the log
      let i = 0;
      const interval = setInterval(() => {
        setInput(prev => prev + simText.charAt(i));
        i++;
        if (i >= simText.length) {
            clearInterval(interval);
            setIsSimulating(false);
        }
      }, 15); // Faster typing
      
    } catch (e) {
      setInput(prev => prev + "\n[ERROR] SIMULATION ABORTED.");
      setIsSimulating(false);
    }
  };

  const handleRunDemo = async () => {
    if (isLoading || isSimulating) return;

    setIsLoading(true);
    setResult(null);
    setSelectedVector('Exploitation');

    const demoLog = `[DEMO_MODE] BLACKGRID QUICK START
[TARGET] CUSTOMER_SUPPORT_BOT
[SCENARIO] HYBRID AGENTIC BREAKOUT SIMULATION
----------------------------------------
{"timestamp":"${new Date().toISOString()}","level":"INFO","source":"MCP_Gateway","event":"AUTHORIZED_HANDSHAKE","details":{"auth":"OK"}}
{"timestamp":"${new Date().toISOString()}","level":"ALERT","source":"MCP_Gateway","event":"MCP_TOOL_EXECUTION","latency":"4ms","velocity":"HIGH_FREQUENCY"}
{"timestamp":"${new Date().toISOString()}","level":"ALERT","source":"MCP_Gateway","event":"MCP_TOOL_EXECUTION","latency":"5ms","velocity":"HIGH_FREQUENCY"}
{"timestamp":"${new Date().toISOString()}","level":"CRITICAL","source":"AUTH_LAYER","event":"INVALID_MCP_HEADER","details":{"auth_signature":null,"header":"X-MCP-Agent: RedScan-v1"}}
{"timestamp":"${new Date().toISOString()}","level":"CRITICAL","source":"DAEMON_SOCKET","event":"CONTEXT_OVERFLOW_ATTEMPT","details":{"payload_size":"4MB","status":"TRUNCATED"}}
`;

    setInput(demoLog);

    try {
      const analysis = await analyzeThreatLog(demoLog);
      await new Promise(resolve => setTimeout(resolve, 450));
      setResult(analysis);
      onAnalysisComplete(analysis);
    } catch (e) {
      console.error("Demo run failed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setInput('');
    setResult(null);
  };

  const actionSteps = result ? buildActionSteps(result) : [];

  return (
    <div className="h-full flex flex-col p-6 relative overflow-hidden">
      
      {/* Top Controls */}
      <div className="flex items-center justify-between mb-6 z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#171717] border border-[#262626] flex items-center justify-center">
             <Crosshair className="text-blue-500 animate-pulse" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wider uppercase">Threat Hunter</h2>
            <div className="flex items-center gap-2 text-[10px] text-[#737373] font-mono">
              <span>NEURAL DEFENDER: TFJS (LOCAL)</span>
              <span className="text-[#262626]">|</span>
              <span>ATTACKER: {apiKey ? 'GEMINI (CLOUD)' : 'SCRIPT (LOCAL)'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunDemo}
            disabled={isSimulating || isLoading}
            className={`px-4 py-4 h-full font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 border border-[#262626] ${
              isSimulating || isLoading
                ? 'bg-[#171717] text-[#525252] cursor-not-allowed'
                : 'bg-emerald-950/25 text-emerald-400 hover:bg-emerald-900/35'
            }`}
          >
            <Play size={14} />
            Run Demo
          </button>
          <div className="flex items-center gap-0 bg-[#171717] border border-[#262626]">
          <div className="px-4 py-2 border-r border-[#262626]">
            <label className="block text-[9px] text-[#737373] uppercase font-bold tracking-widest mb-1">Attack Vector</label>
            <select 
              value={selectedVector}
              onChange={(e) => setSelectedVector(e.target.value as AttackVector)}
              className="bg-transparent text-white text-sm font-mono outline-none cursor-pointer w-40 uppercase"
              disabled={isSimulating}
            >
              {vectors.map(v => (
                <option key={v} value={v} className="bg-[#0a0a0a] text-gray-200">
                  {v.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          <button 
            onClick={handleSimulate}
            disabled={isSimulating || isLoading}
            className={`px-6 py-4 h-full font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
                isSimulating ? 'bg-[#262626] text-[#737373] cursor-not-allowed' : 'bg-blue-900/20 text-blue-500 hover:bg-blue-900/40 hover:text-blue-400'
            }`}
          >
            {isSimulating ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} />}
            Generate Log
          </button>
          </div>
        </div>
      </div>

      {/* Main Console Area */}
      <div className="flex-1 flex gap-6 min-h-0 z-10">
        
        {/* Left: Terminal Input */}
        <div className="flex-1 flex flex-col hud-border bg-black">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#262626] bg-[#0a0a0a]">
             <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#737373] uppercase font-mono tracking-widest">/var/log/incoming_stream</span>
                {isSimulating && <span className="text-[9px] text-emerald-500 animate-pulse">● RECEIVING TELEMETRY STREAM...</span>}
             </div>
             <div className="flex gap-4 items-center">
                <button 
                  onClick={handleClear}
                  className="text-[10px] text-[#525252] hover:text-red-500 uppercase tracking-wider font-bold flex items-center gap-1 transition-colors"
                >
                  <Trash2 size={10} /> Clear
                </button>
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#262626]"></div>
                  <div className="w-2 h-2 rounded-full bg-[#262626]"></div>
                </div>
             </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-black text-emerald-500 font-mono text-xs p-4 resize-none outline-none leading-loose placeholder-emerald-900/50"
            spellCheck={false}
            placeholder={`// SYSTEM READY.\n// TENSORFLOW.JS CLASSIFIER LOADED.\n// CLICK 'RUN DEMO' FOR A ONE-CLICK WALKTHROUGH.`}
          />
          <div className="p-2 bg-[#0a0a0a] border-t border-[#262626]">
             <button 
               onClick={handleAnalyze}
               disabled={!input || isSimulating || isLoading}
               className={`w-full py-3 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                  input && !result ? 'bg-blue-600 hover:bg-blue-500 text-white animate-pulse' : 'bg-blue-900/20 text-blue-400'
               }`}
             >
               {isLoading ? <Loader2 className="animate-spin" size={14} /> : <Search size={14} />}
               Analyze Telemetry
             </button>
          </div>
        </div>

        {/* Right: Analysis Result */}
        <div className="w-1/3 flex flex-col gap-4">
           {/* Result Card */}
           <div className={`flex-1 hud-border bg-[#0a0a0a] p-0 overflow-hidden flex flex-col ${!result ? 'justify-center items-center' : ''}`}>
              {!result && !isLoading && (
                  <div className="text-center opacity-30">
                      <ShieldCheck size={48} className="mx-auto mb-2" />
                      <p className="font-mono text-xs">AWAITING INPUT VECTOR</p>
                  </div>
              )}

              {isLoading && (
                  <div className="flex flex-col items-center">
                      <div className="w-16 h-16 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mb-4"></div>
                      <p className="font-mono text-xs text-blue-500 animate-pulse">COMPUTING VECTOR EMBEDDINGS...</p>
                  </div>
              )}

              {result && (
                  <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
                      {/* Result Header */}
                      <div className={`p-6 border-b border-[#262626] ${result.isAgenticThreat ? 'bg-red-950/20' : 'bg-emerald-950/20'}`}>
                          <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] uppercase tracking-widest font-bold text-[#737373]">Neural Verdict</span>
                              <span className="text-[10px] font-mono text-[#737373]">{result.confidenceScore.toFixed(0)}% MATCH</span>
                          </div>
                          <div className={`text-2xl font-bold tracking-wider flex items-center gap-3 ${result.isAgenticThreat ? 'text-red-500' : 'text-emerald-500'}`}>
                              {result.isAgenticThreat ? <AlertTriangle size={24} /> : <ShieldCheck size={24} />}
                              {result.isAgenticThreat ? 'THREAT DETECTED' : 'CLEAN TRAFFIC'}
                          </div>
                      </div>

                      {/* Details Scrollable */}
                      <div className="flex-1 overflow-y-auto p-6 space-y-6">
                          <div>
                             <label className="text-[10px] uppercase tracking-widest font-bold text-[#737373] block mb-2">Vector Analysis</label>
                             <p className="text-xs font-mono text-[#d4d4d4] leading-relaxed border-l-2 border-[#262626] pl-3">
                               {result.explanation}
                             </p>
                          </div>

                          <div>
                             <label className="text-[10px] uppercase tracking-widest font-bold text-[#737373] block mb-2">Matched Artifacts</label>
                             <div className="flex flex-wrap gap-2">
                                {result.detectedPatterns.map((p, i) => (
                                    <span key={i} className="px-2 py-1 bg-[#171717] border border-[#262626] text-[10px] font-mono text-blue-400 uppercase">
                                        {p}
                                    </span>
                                ))}
                             </div>
                          </div>

                          <div>
                             <label className="text-[10px] uppercase tracking-widest font-bold text-[#737373] block mb-2">Recommended Action</label>
                             <div className={`p-3 border text-xs font-mono break-words whitespace-pre-wrap overflow-y-auto max-h-32 ${
                               result.isAgenticThreat
                                 ? 'bg-yellow-950/20 border-yellow-800/50 text-yellow-400'
                                 : 'bg-emerald-950/20 border-emerald-800/50 text-emerald-400'
                             }`}>
                                {'>'} {result.recommendedAction}
                             </div>
                          </div>

                          <div>
                             <label className="text-[10px] uppercase tracking-widest font-bold text-[#737373] block mb-2">Immediate Next Steps</label>
                             <div className="space-y-2">
                                {actionSteps.map((step, idx) => (
                                  <div key={`${step}-${idx}`} className="flex items-start gap-2 border border-[#262626] bg-[#111] p-2">
                                    <span className="mt-0.5 min-w-5 h-5 flex items-center justify-center border border-[#333] bg-[#171717] text-[10px] font-bold text-blue-400">
                                      {idx + 1}
                                    </span>
                                    <p className="text-xs text-[#d4d4d4] leading-relaxed">{step}</p>
                                  </div>
                                ))}
                             </div>
                          </div>
                      </div>
                  </div>
              )}
           </div>
        </div>
      </div>
      
      <div ref={bottomRef}></div>
    </div>
  );
};

export default Analyzer;
