import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, AlertTriangle, Filter, Globe2, Pause, Play, Shield, Target } from 'lucide-react';
import { AttackVector, LogEntry, ThreatLevel } from '../types';

type SimulationSource = 'demo' | 'generate' | 'analyze' | 'telemetry';
type NodeState = 'SECURE' | 'PROBED' | 'UNDER ATTACK' | 'ISOLATED' | 'RECOVERING';
type SeverityFilter = 'ALL' | ThreatLevel;
type VectorFilter = 'ALL' | AttackVector;

interface GlobalThreatMapProps {
  logs: LogEntry[];
  activeVector: AttackVector;
  triggerPulse: number;
  triggerSource: SimulationSource;
}

interface MapNode {
  id: string;
  label: string;
  kind: 'REGION' | 'ASSET';
  lon: number;
  lat: number;
}

interface ThreatRoute {
  id: string;
  sourceId: string;
  targetId: string;
  severity: ThreatLevel;
  vector: AttackVector;
  createdAt: number;
}

interface ThreatEvent {
  id: string;
  timestamp: string;
  source: string;
  target: string;
  severity: ThreatLevel;
  vector: AttackVector;
  message: string;
}

interface NodeStatusEntry {
  state: NodeState;
  updatedAt: number;
  severity: ThreatLevel;
}

const MAP_WIDTH = 940;
const MAP_HEIGHT = 470;

const MAP_NODES: MapNode[] = [
  { id: 'US-WEST', label: 'US-WEST', kind: 'REGION', lon: -122.3, lat: 37.7 },
  { id: 'US-EAST', label: 'US-EAST', kind: 'REGION', lon: -74.0, lat: 40.7 },
  { id: 'EU-CENTRAL', label: 'EU-CENTRAL', kind: 'REGION', lon: 8.7, lat: 50.1 },
  { id: 'APAC-01', label: 'APAC-01', kind: 'REGION', lon: 103.8, lat: 1.3 },
  { id: 'LATAM', label: 'LATAM', kind: 'REGION', lon: -58.4, lat: -34.6 },
  { id: 'MEA', label: 'MEA', kind: 'REGION', lon: 55.3, lat: 25.2 },
  { id: 'VANGUARD-01', label: 'VANGUARD-01', kind: 'ASSET', lon: -118.2, lat: 34.0 },
  { id: 'ALPHA-NODE', label: 'ALPHA NODE', kind: 'ASSET', lon: 2.3, lat: 48.8 },
  { id: 'NODE-SIGMA', label: 'NODE SIGMA', kind: 'ASSET', lon: 139.7, lat: 35.6 },
  { id: 'ORBIT-GATE', label: 'ORBIT GATE', kind: 'ASSET', lon: 73.0, lat: 23.0 },
];

const VECTOR_OPTIONS: VectorFilter[] = [
  'ALL',
  'Reconnaissance',
  'Exploitation',
  'Exfiltration',
  'Social Engineering',
  'RedScan_Protocol_Phase1',
];

const SEVERITY_COLORS: Record<ThreatLevel, string> = {
  LOW: '#60a5fa',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

const coastlines: [number, number][][] = [
  [[-168, 70], [-140, 65], [-122, 55], [-103, 49], [-95, 40], [-80, 26], [-95, 15], [-114, 23], [-135, 34], [-152, 52], [-168, 70]],
  [[-82, 12], [-72, 5], [-66, -12], [-60, -22], [-58, -35], [-70, -53], [-78, -30], [-82, 12]],
  [[-10, 72], [8, 64], [30, 60], [50, 52], [38, 42], [20, 36], [4, 44], [-10, 56], [-10, 72]],
  [[-15, 35], [10, 33], [28, 22], [34, 7], [30, -11], [18, -29], [6, -35], [-6, -20], [-12, 8], [-15, 35]],
  [[35, 58], [64, 56], [92, 52], [115, 42], [124, 30], [130, 20], [120, 6], [105, 12], [92, 18], [78, 24], [58, 36], [35, 58]],
  [[112, -12], [126, -18], [146, -25], [154, -36], [138, -40], [122, -30], [112, -12]],
];

const inferVectorFromLog = (log: LogEntry): AttackVector => {
  const text = `${log.activity} ${(log.details.detectedPatterns || []).join(' ')}`.toUpperCase();
  if (text.includes('CONTEXT_GUARDRAIL') || text.includes('EXFIL')) return 'Exfiltration';
  if (text.includes('PROTOCOL_GUARDRAIL') || text.includes('INVALID_MCP_HEADER')) return 'RedScan_Protocol_Phase1';
  if (text.includes('VELOCITY_GUARDRAIL') || text.includes('EXPLOIT')) return 'Exploitation';
  if (text.includes('PERSONA') || text.includes('SOCIAL')) return 'Social Engineering';
  return 'Reconnaissance';
};

const pickSeverityByVector = (vector: AttackVector): ThreatLevel => {
  const r = Math.random();
  if (vector === 'Exfiltration') return r > 0.35 ? ThreatLevel.CRITICAL : ThreatLevel.HIGH;
  if (vector === 'Exploitation') return r > 0.55 ? ThreatLevel.CRITICAL : ThreatLevel.HIGH;
  if (vector === 'RedScan_Protocol_Phase1') return r > 0.5 ? ThreatLevel.CRITICAL : ThreatLevel.HIGH;
  if (vector === 'Social Engineering') return r > 0.45 ? ThreatLevel.HIGH : ThreatLevel.MEDIUM;
  return r > 0.25 ? ThreatLevel.MEDIUM : ThreatLevel.LOW;
};

const mapSourceFromLogSource = (source: string): string | null => {
  const s = source.toUpperCase();
  if (s.includes('AUTH')) return 'EU-CENTRAL';
  if (s.includes('MCP') || s.includes('FIREWALL')) return 'US-EAST';
  if (s.includes('CHAT')) return 'APAC-01';
  if (s.includes('NEURAL')) return 'MEA';
  return null;
};

const GlobalThreatMap: React.FC<GlobalThreatMapProps> = ({
  logs,
  activeVector,
  triggerPulse,
  triggerSource
}) => {
  const [events, setEvents] = useState<ThreatEvent[]>([]);
  const [routes, setRoutes] = useState<ThreatRoute[]>([]);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('ALL');
  const [vectorFilter, setVectorFilter] = useState<VectorFilter>('ALL');
  const [paused, setPaused] = useState(false);
  const processedLogIdsRef = useRef<Set<string>>(new Set());

  const [nodeStatus, setNodeStatus] = useState<Record<string, NodeStatusEntry>>(() =>
    MAP_NODES.reduce((acc, node) => {
      acc[node.id] = { state: 'SECURE', updatedAt: Date.now(), severity: ThreatLevel.LOW };
      return acc;
    }, {} as Record<string, NodeStatusEntry>)
  );

  const nodeById = useMemo(
    () => MAP_NODES.reduce((acc, node) => ({ ...acc, [node.id]: node }), {} as Record<string, MapNode>),
    []
  );

  const regionIds = useMemo(() => MAP_NODES.filter((n) => n.kind === 'REGION').map((n) => n.id), []);

  const projectPoint = useCallback((lon: number, lat: number) => {
    const x = ((lon + 180) / 360) * MAP_WIDTH;
    const y = ((90 - lat) / 180) * MAP_HEIGHT;
    return { x, y };
  }, []);

  const updateNodeState = useCallback((nodeId: string, severity: ThreatLevel) => {
    const state: NodeState =
      severity === ThreatLevel.CRITICAL
        ? 'ISOLATED'
        : severity === ThreatLevel.HIGH
          ? 'UNDER ATTACK'
          : severity === ThreatLevel.MEDIUM
            ? 'PROBED'
            : 'PROBED';

    setNodeStatus((prev) => ({
      ...prev,
      [nodeId]: { state, updatedAt: Date.now(), severity }
    }));
  }, []);

  const generateEvent = useCallback(
    (vector: AttackVector, sourceMode: SimulationSource, forcedSeverity?: ThreatLevel, preferredSource?: string) => {
      const targetPools: Record<AttackVector, string[]> = {
        Reconnaissance: ['ALPHA-NODE', 'US-EAST', 'VANGUARD-01'],
        Exploitation: ['NODE-SIGMA', 'VANGUARD-01', 'ORBIT-GATE'],
        Exfiltration: ['VANGUARD-01', 'NODE-SIGMA', 'LATAM'],
        'Social Engineering': ['ALPHA-NODE', 'US-WEST', 'MEA'],
        RedScan_Protocol_Phase1: ['ORBIT-GATE', 'ALPHA-NODE', 'US-EAST'],
      };

      const targetId = targetPools[vector][Math.floor(Math.random() * targetPools[vector].length)];
      const availableSources = regionIds.filter((id) => id !== targetId);
      const sourceId = preferredSource && availableSources.includes(preferredSource)
        ? preferredSource
        : availableSources[Math.floor(Math.random() * availableSources.length)];

      const severity = forcedSeverity || pickSeverityByVector(vector);
      const sourceLabel = nodeById[sourceId]?.label || sourceId;
      const targetLabel = nodeById[targetId]?.label || targetId;

      const actionText: Record<AttackVector, string> = {
        Reconnaissance: `performing reconnaissance on ${targetLabel}`,
        Exploitation: `launched exploitation pattern on ${targetLabel}`,
        Exfiltration: `launched exfiltration route toward ${targetLabel}`,
        'Social Engineering': `executing identity spoof sequence on ${targetLabel}`,
        RedScan_Protocol_Phase1: `attempted protocol bypass against ${targetLabel}`,
      };

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const timestamp = new Date().toLocaleTimeString();

      const event: ThreatEvent = {
        id,
        timestamp,
        source: sourceLabel,
        target: targetLabel,
        severity,
        vector,
        message: `[${severity}] ${sourceLabel} ${actionText[vector]}`
      };

      setEvents((prev) => [event, ...prev].slice(0, 80));
      setRoutes((prev) => [{ id, sourceId, targetId, severity, vector, createdAt: Date.now() }, ...prev].slice(0, 24));
      updateNodeState(targetId, severity);

      if (sourceMode === 'demo') {
        const sourceSeverity = severity === ThreatLevel.CRITICAL ? ThreatLevel.HIGH : ThreatLevel.MEDIUM;
        updateNodeState(sourceId, sourceSeverity);
      }
    },
    [nodeById, regionIds, updateNodeState]
  );

  useEffect(() => {
    if (paused) return;

    const interval = window.setInterval(() => {
      const randomVector = VECTOR_OPTIONS.filter((v): v is AttackVector => v !== 'ALL')[Math.floor(Math.random() * 5)];
      const vector = Math.random() > 0.6 ? activeVector : randomVector;
      generateEvent(vector, 'generate');
    }, 2600);

    return () => window.clearInterval(interval);
  }, [paused, activeVector, generateEvent]);

  useEffect(() => {
    const cleanup = window.setInterval(() => {
      const now = Date.now();
      setRoutes((prev) => prev.filter((route) => now - route.createdAt < 6500));
      setNodeStatus((prev) => {
        const next = { ...prev };
        Object.entries(next).forEach(([nodeId, entry]) => {
          const age = now - entry.updatedAt;
          if (entry.state === 'ISOLATED' && age > 11000) next[nodeId] = { ...entry, state: 'RECOVERING' };
          else if (entry.state === 'UNDER ATTACK' && age > 10000) next[nodeId] = { ...entry, state: 'RECOVERING' };
          else if (entry.state === 'PROBED' && age > 9000) next[nodeId] = { ...entry, state: 'SECURE', severity: ThreatLevel.LOW };
          else if (entry.state === 'RECOVERING' && age > 17000) next[nodeId] = { ...entry, state: 'SECURE', severity: ThreatLevel.LOW };
        });
        return next;
      });
    }, 1000);
    return () => window.clearInterval(cleanup);
  }, []);

  useEffect(() => {
    if (!triggerPulse) return;
    const timeouts = [0, 260, 640].map((delay, idx) =>
      window.setTimeout(() => {
        const severity = idx === 0 ? ThreatLevel.CRITICAL : undefined;
        generateEvent(activeVector, triggerSource, severity);
      }, delay)
    );

    return () => timeouts.forEach((id) => window.clearTimeout(id));
  }, [triggerPulse, activeVector, triggerSource, generateEvent]);

  useEffect(() => {
    const unseen = logs.filter((log) => !processedLogIdsRef.current.has(log.id));
    if (unseen.length === 0) return;

    unseen.forEach((log) => {
      processedLogIdsRef.current.add(log.id);
      const vector = inferVectorFromLog(log);
      const preferredSource = mapSourceFromLogSource(log.source || '');
      generateEvent(vector, 'telemetry', log.threatLevel, preferredSource || undefined);
    });
  }, [logs, generateEvent]);

  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        const bySeverity = severityFilter === 'ALL' || event.severity === severityFilter;
        const byVector = vectorFilter === 'ALL' || event.vector === vectorFilter;
        return bySeverity && byVector;
      }),
    [events, severityFilter, vectorFilter]
  );

  const activeThreatCount = useMemo(
    () => routes.filter((route) => route.severity === ThreatLevel.HIGH || route.severity === ThreatLevel.CRITICAL).length,
    [routes]
  );

  const mostTargeted = useMemo(() => {
    const counts = events.reduce((acc, event) => {
      acc[event.target] = (acc[event.target] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const [label, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];
    return { label, count };
  }, [events]);

  return (
    <div className="h-full flex flex-col p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-5 border-b border-[#262626] pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-widest uppercase flex items-center gap-2">
            <Globe2 size={18} className="text-blue-500" />
            Global Threat Map
          </h2>
          <p className="text-[10px] text-[#737373] font-mono uppercase tracking-widest mt-1">
            Telemetry-seeded simulation with real geospatial node coordinates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="border border-[#262626] bg-[#0a0a0a] px-3 py-2 text-[10px] font-mono text-[#a3a3a3] uppercase tracking-widest">
            Active Threats: <span className="text-red-400 font-bold">{activeThreatCount}</span>
          </div>
          <button
            onClick={() => setPaused((prev) => !prev)}
            className="flex items-center gap-2 px-3 py-2 border border-[#262626] bg-[#171717] text-xs uppercase tracking-widest font-bold text-blue-400 hover:bg-blue-900/20"
          >
            {paused ? <Play size={12} /> : <Pause size={12} />}
            {paused ? 'Resume' : 'Pause'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.65fr_1fr] gap-4 flex-1 min-h-0">
        <div className="hud-border bg-[#070707] p-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#737373]">Global Attack Surface</div>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="text-[#525252] uppercase tracking-widest">Most targeted:</span>
              <span className="text-white">{mostTargeted.label}</span>
              <span className="text-orange-400">({mostTargeted.count})</span>
            </div>
          </div>

          <div className="relative flex-1 border border-[#262626] bg-[#060606] overflow-hidden">
            <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="w-full h-full">
              <defs>
                <linearGradient id="mapGridFade" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0b1220" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#050505" stopOpacity="1" />
                </linearGradient>
              </defs>
              <rect x={0} y={0} width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#mapGridFade)" />

              {Array.from({ length: 12 }).map((_, i) => (
                <line
                  key={`grid-v-${i}`}
                  x1={(MAP_WIDTH / 12) * i}
                  y1={0}
                  x2={(MAP_WIDTH / 12) * i}
                  y2={MAP_HEIGHT}
                  stroke="#1f2937"
                  strokeOpacity="0.35"
                  strokeWidth="1"
                />
              ))}
              {Array.from({ length: 8 }).map((_, i) => (
                <line
                  key={`grid-h-${i}`}
                  x1={0}
                  y1={(MAP_HEIGHT / 8) * i}
                  x2={MAP_WIDTH}
                  y2={(MAP_HEIGHT / 8) * i}
                  stroke="#1f2937"
                  strokeOpacity="0.35"
                  strokeWidth="1"
                />
              ))}

              {coastlines.map((shape, idx) => (
                <polyline
                  key={`coast-${idx}`}
                  fill="none"
                  stroke="#334155"
                  strokeOpacity="0.45"
                  strokeWidth="1.1"
                  points={shape.map(([lon, lat]) => {
                    const p = projectPoint(lon, lat);
                    return `${p.x},${p.y}`;
                  }).join(' ')}
                />
              ))}

              {routes.map((route) => {
                const from = nodeById[route.sourceId];
                const to = nodeById[route.targetId];
                if (!from || !to) return null;
                const p1 = projectPoint(from.lon, from.lat);
                const p2 = projectPoint(to.lon, to.lat);
                const d = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
                const color = SEVERITY_COLORS[route.severity];
                return (
                  <g key={route.id}>
                    <path
                      d={d}
                      fill="none"
                      stroke={color}
                      strokeWidth={route.severity === ThreatLevel.CRITICAL ? 2.2 : 1.6}
                      strokeOpacity="0.9"
                      strokeDasharray="7 7"
                      className="threat-route"
                    />
                    <circle r={route.severity === ThreatLevel.CRITICAL ? 3 : 2.3} fill={color}>
                      <animateMotion dur={route.severity === ThreatLevel.CRITICAL ? '1.4s' : '2.2s'} repeatCount="indefinite" path={d} />
                    </circle>
                  </g>
                );
              })}

              {MAP_NODES.map((node) => {
                const p = projectPoint(node.lon, node.lat);
                const status = nodeStatus[node.id] || { state: 'SECURE', severity: ThreatLevel.LOW };
                const color =
                  status.state === 'SECURE'
                    ? '#22c55e'
                    : status.state === 'PROBED'
                      ? '#f59e0b'
                      : status.state === 'RECOVERING'
                        ? '#60a5fa'
                        : '#ef4444';
                return (
                  <g key={node.id} transform={`translate(${p.x}, ${p.y})`}>
                    <circle className="node-ring" r={node.kind === 'REGION' ? 10 : 8} fill="none" stroke={color} strokeOpacity="0.4" />
                    <circle className={status.state === 'UNDER ATTACK' || status.state === 'ISOLATED' ? 'node-pulse' : ''} r={node.kind === 'REGION' ? 4 : 3.2} fill={color} />
                    <text
                      x={8}
                      y={-8}
                      fill="#cbd5e1"
                      fontSize="10"
                      style={{ fontFamily: 'Space Mono, monospace', letterSpacing: '0.08em' }}
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-mono uppercase tracking-widest">
            <div className="border border-[#262626] bg-[#0a0a0a] px-2 py-1.5 text-[#737373] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#60a5fa]"></span>LOW
            </div>
            <div className="border border-[#262626] bg-[#0a0a0a] px-2 py-1.5 text-[#737373] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span>MEDIUM
            </div>
            <div className="border border-[#262626] bg-[#0a0a0a] px-2 py-1.5 text-[#737373] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]"></span>HIGH
            </div>
            <div className="border border-[#262626] bg-[#0a0a0a] px-2 py-1.5 text-[#737373] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span>CRITICAL
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 min-h-0">
          <div className="hud-border bg-[#0a0a0a] p-3">
            <div className="flex items-center gap-2 text-[10px] text-[#737373] uppercase tracking-widest font-bold mb-2">
              <Filter size={12} className="text-blue-400" />
              Threat Filters
            </div>
            <div className="grid grid-cols-1 gap-2">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
                className="bg-black border border-[#262626] text-[#d4d4d4] text-xs font-mono py-2 px-2 outline-none"
              >
                <option value="ALL">ALL SEVERITIES</option>
                <option value={ThreatLevel.LOW}>LOW</option>
                <option value={ThreatLevel.MEDIUM}>MEDIUM</option>
                <option value={ThreatLevel.HIGH}>HIGH</option>
                <option value={ThreatLevel.CRITICAL}>CRITICAL</option>
              </select>
              <select
                value={vectorFilter}
                onChange={(e) => setVectorFilter(e.target.value as VectorFilter)}
                className="bg-black border border-[#262626] text-[#d4d4d4] text-xs font-mono py-2 px-2 outline-none"
              >
                {VECTOR_OPTIONS.map((vector) => (
                  <option key={vector} value={vector}>
                    {vector === 'ALL' ? 'ALL VECTORS' : vector.toUpperCase().replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="hud-border bg-[#0a0a0a] flex-1 min-h-0 flex flex-col">
            <div className="p-3 border-b border-[#262626] flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-widest text-[#737373] font-bold">Live Threat Feed</div>
              <div className="text-[10px] font-mono text-[#525252]">{filteredEvents.length} EVENTS</div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {filteredEvents.length === 0 && (
                <div className="text-center text-[#525252] text-xs font-mono p-6">NO EVENTS MATCH FILTER</div>
              )}
              {filteredEvents.slice(0, 40).map((event) => (
                <div key={event.id} className="border border-[#262626] bg-[#101010] p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-[10px] font-bold font-mono tracking-wide"
                      style={{ color: SEVERITY_COLORS[event.severity] }}
                    >
                      [{event.severity}]
                    </span>
                    <span className="text-[10px] text-[#525252] font-mono">{event.timestamp}</span>
                  </div>
                  <div className="text-xs text-[#d4d4d4] leading-relaxed">{event.message}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="hud-border bg-[#0a0a0a] p-3">
            <div className="text-[10px] uppercase tracking-widest text-[#737373] font-bold mb-2">Node Status</div>
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {MAP_NODES.filter((n) => n.kind === 'REGION').map((node) => {
                const status = nodeStatus[node.id];
                const color =
                  status.state === 'SECURE'
                    ? 'text-emerald-400'
                    : status.state === 'PROBED'
                      ? 'text-yellow-400'
                      : status.state === 'RECOVERING'
                        ? 'text-blue-400'
                        : 'text-red-400';
                return (
                  <div key={`status-${node.id}`} className="border border-[#262626] bg-[#101010] px-2 py-1.5 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-[#d4d4d4]">{node.label}</span>
                    <span className={`${color} font-bold`}>{status.state}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 border border-[#262626] bg-[#0a0a0a] px-4 py-3 grid grid-cols-1 md:grid-cols-4 gap-3 text-[10px] font-mono uppercase tracking-widest">
        <div className="flex items-center gap-2 text-[#d4d4d4]">
          <Target size={12} className="text-blue-400" />
          Most Targeted: <span className="text-white">{mostTargeted.label}</span>
        </div>
        <div className="flex items-center gap-2 text-[#d4d4d4]">
          <AlertTriangle size={12} className="text-orange-400" />
          Current Vector Bias: <span className="text-white">{activeVector.replace(/_/g, ' ')}</span>
        </div>
        <div className="flex items-center gap-2 text-[#d4d4d4]">
          <Activity size={12} className="text-emerald-400" />
          Simulation: <span className="text-white">{paused ? 'PAUSED' : 'LIVE'}</span>
        </div>
        <div className="flex items-center gap-2 text-[#d4d4d4]">
          <Shield size={12} className="text-blue-400" />
          Data Source: <span className="text-white">TELEMETRY + NEURAL SIM</span>
        </div>
      </div>

      <style>{`
        .threat-route {
          animation: threat-route-dash 1.7s linear infinite;
        }
        @keyframes threat-route-dash {
          0% { stroke-dashoffset: 24; }
          100% { stroke-dashoffset: 0; }
        }
        .node-ring {
          animation: node-ring-pulse 2.4s ease-in-out infinite;
        }
        .node-pulse {
          animation: node-hot-pulse 1.3s ease-in-out infinite;
        }
        @keyframes node-ring-pulse {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(1.25); }
        }
        @keyframes node-hot-pulse {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default GlobalThreatMap;
