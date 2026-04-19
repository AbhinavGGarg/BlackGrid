import React, { useMemo } from 'react';
import { ArrowRight, Check, Cpu, Radar, Shield, Activity, Lock, Gauge, TerminalSquare } from 'lucide-react';

interface LandingPageProps {
  onEnterPlatform: () => void;
}

const landingFeatures = [
  "Threat detection",
  "Telemetry analysis",
  "Attack vector simulation",
  "Neural defense engine",
  "Local threat modeling",
  "Protocol guardrail enforcement",
];

const LandingPage: React.FC<LandingPageProps> = ({ onEnterPlatform }) => {
  const farStars = useMemo(
    () =>
      Array.from({ length: 110 }, (_, i) => ({
        left: ((i * 37) % 1000) / 10,
        top: ((i * 91) % 1000) / 10,
        size: i % 4 === 0 ? 2 : 1,
        opacity: 0.25 + ((i % 6) * 0.08),
        duration: 5 + (i % 8) * 0.9,
        delay: (i % 9) * 0.35,
      })),
    []
  );

  const nearStars = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        left: ((i * 61 + 190) % 1000) / 10,
        top: ((i * 47 + 320) % 1000) / 10,
        size: i % 5 === 0 ? 3 : 2,
        opacity: 0.35 + ((i % 5) * 0.1),
        duration: 4 + (i % 7) * 0.75,
        delay: (i % 10) * 0.4,
      })),
    []
  );

  return (
    <div className="relative h-screen overflow-y-auto bg-[#050505] text-[#e5e5e5]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(42,101,255,0.08),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.05),transparent_35%),linear-gradient(to_bottom,rgba(0,0,0,0.2),rgba(0,0,0,0.55))]" />
        <div className="star-layer far absolute inset-0">
          {farStars.map((star, idx) => (
            <span
              key={`far-${idx}`}
              className="absolute rounded-full bg-white"
              style={{
                left: `${star.left}%`,
                top: `${star.top}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                opacity: star.opacity,
                animation: `blackgrid-star-pulse ${star.duration}s ease-in-out ${star.delay}s infinite`,
              }}
            />
          ))}
        </div>
        <div className="star-layer near absolute inset-0">
          {nearStars.map((star, idx) => (
            <span
              key={`near-${idx}`}
              className="absolute rounded-full bg-white"
              style={{
                left: `${star.left}%`,
                top: `${star.top}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                opacity: star.opacity,
                animation: `blackgrid-star-pulse ${star.duration}s ease-in-out ${star.delay}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 md:px-10 py-8 md:py-12 space-y-8 md:space-y-10 relative z-10">
        <header className="border border-[#262626] bg-[#0a0a0a]/90 px-5 py-4 md:px-6 md:py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white border border-[#d4d4d4] flex items-center justify-center">
                <Cpu size={18} className="text-black" />
              </div>
              <div>
                <p className="text-lg font-bold tracking-[0.14em] text-white">BLACKGRID</p>
                <p className="text-[10px] uppercase tracking-[0.22em] text-[#737373]">Adaptive Defense Platform</p>
              </div>
            </div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#525252]">
              Zero-Trust Telemetry Surface
            </div>
          </div>
        </header>

        <section className="relative border border-[#262626] bg-[#0a0a0a] p-6 md:p-10 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="absolute -top-20 right-0 w-[520px] h-[520px] bg-blue-600/20 blur-3xl"></div>
          </div>
          <div className="relative z-10 max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 border border-[#333] bg-[#101010] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-blue-400 font-bold">
              <TerminalSquare size={12} />
              Live Threat Posture
            </div>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-wide text-white uppercase">
              Command Surface for Autonomous Threat Containment
            </h1>
            <p className="text-sm md:text-base text-[#a3a3a3] max-w-2xl leading-relaxed">
              BLACKGRID detects hostile agent behavior, analyzes semantic telemetry, and executes actionable response decisions in real time.
            </p>
            <button
              onClick={onEnterPlatform}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 border border-blue-400/60 px-6 py-3 text-xs md:text-sm font-bold uppercase tracking-widest transition-colors"
            >
              Enter Defense Grid
              <ArrowRight size={15} />
            </button>
          </div>
        </section>

        <section className="border border-[#262626] bg-[#0a0a0a] p-6 md:p-8">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#737373] mb-3">Problem</p>
          <p className="text-sm md:text-base leading-relaxed text-[#d4d4d4] max-w-4xl">
            Traditional controls miss semantic threats. Autonomous agents can chain tools, spoof personas, and hide intent in high-volume context streams before static filters react.
            BLACKGRID closes this gap with behavior-aware detection and protocol-level guardrails.
          </p>
        </section>

        <section className="space-y-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#737373]">What It Does</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-[#262626] bg-[#0a0a0a] p-5 space-y-3">
              <Radar className="text-blue-500" size={18} />
              <h3 className="text-sm font-bold uppercase tracking-wider">Capture</h3>
              <p className="text-xs text-[#a3a3a3] leading-relaxed">
                Ingests raw telemetry and operational traces from agent execution paths.
              </p>
            </div>
            <div className="border border-[#262626] bg-[#0a0a0a] p-5 space-y-3">
              <Cpu className="text-blue-500" size={18} />
              <h3 className="text-sm font-bold uppercase tracking-wider">Classify</h3>
              <p className="text-xs text-[#a3a3a3] leading-relaxed">
                Scores semantic risk vectors with local neural analysis and fallback heuristics.
              </p>
            </div>
            <div className="border border-[#262626] bg-[#0a0a0a] p-5 space-y-3">
              <Shield className="text-blue-500" size={18} />
              <h3 className="text-sm font-bold uppercase tracking-wider">Contain</h3>
              <p className="text-xs text-[#a3a3a3] leading-relaxed">
                Produces deterministic response actions for immediate isolation and control.
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-4">
          <div className="border border-[#262626] bg-[#0a0a0a] p-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#737373] mb-4">Capabilities</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {landingFeatures.map((feature) => (
                <div key={feature} className="flex items-center gap-3 border border-[#262626] bg-[#101010] px-3 py-2">
                  <span className="w-5 h-5 border border-emerald-600/60 bg-emerald-950/30 flex items-center justify-center">
                    <Check size={12} className="text-emerald-400" />
                  </span>
                  <span className="text-xs uppercase tracking-wide text-[#d4d4d4]">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-[#262626] bg-[#0a0a0a] p-6 space-y-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#737373]">Impact</p>
            <div className="grid grid-cols-1 gap-3">
              <div className="border border-[#262626] bg-[#101010] p-3">
                <div className="flex items-center gap-2 text-blue-400 text-xs uppercase tracking-widest font-bold mb-1">
                  <Gauge size={13} />
                  Response Speed
                </div>
                <p className="text-sm text-white font-mono">&lt;100ms threat triage path</p>
              </div>
              <div className="border border-[#262626] bg-[#101010] p-3">
                <div className="flex items-center gap-2 text-blue-400 text-xs uppercase tracking-widest font-bold mb-1">
                  <Lock size={13} />
                  Safety Posture
                </div>
                <p className="text-sm text-white font-mono">Protocol abuse surfaced before execution completion</p>
              </div>
              <div className="border border-[#262626] bg-[#101010] p-3">
                <div className="flex items-center gap-2 text-blue-400 text-xs uppercase tracking-widest font-bold mb-1">
                  <Activity size={13} />
                  Operational Clarity
                </div>
                <p className="text-sm text-white font-mono">Actionable recommendations tied to trace artifacts</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border border-[#262626] bg-[#0a0a0a] p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#737373]">Ready State</p>
            <h2 className="text-lg md:text-2xl font-bold uppercase tracking-wide text-white mt-2">
              Launch live monitoring and enter mission control
            </h2>
          </div>
          <button
            onClick={onEnterPlatform}
            className="inline-flex items-center gap-2 border border-blue-500/60 bg-blue-900/20 text-blue-400 hover:bg-blue-900/35 px-5 py-3 text-xs font-bold uppercase tracking-widest transition-colors"
          >
            Launch Ops Center
            <ArrowRight size={14} />
          </button>
        </section>
      </div>

      <style>{`
        @keyframes blackgrid-star-pulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.25); }
        }

        @keyframes blackgrid-star-drift-far {
          0% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(-8px, 12px, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }

        @keyframes blackgrid-star-drift-near {
          0% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(10px, -10px, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }

        .star-layer.far {
          animation: blackgrid-star-drift-far 24s ease-in-out infinite;
        }

        .star-layer.near {
          animation: blackgrid-star-drift-near 18s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .star-layer.far,
          .star-layer.near {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
