# BLACKGRID

BLACKGRID is a tactical cyber-defense interface for detecting and containing agent-driven threats in real time.

It combines local semantic analysis, simulated adversarial activity, and operational response tooling in one command-center style platform.

## Why BLACKGRID Exists

Modern agent workflows can fail in ways classic filters miss:
- semantic prompt manipulation
- protocol abuse across tool chains
- high-velocity action bursts
- context-window overflow tactics

BLACKGRID is built to surface these patterns early and turn them into clear, actionable operator decisions.

## Core System Model

BLACKGRID runs as a hybrid model:

1. Attacker Simulation Layer
- Uses Gemini-powered generation (when API key is provided) or local procedural fallbacks
- Produces realistic, structured threat telemetry

2. Defender Analysis Layer
- Runs TensorFlow.js + Universal Sentence Encoder in-browser
- Applies neural scoring + explicit guardrail heuristics

3. Operations Layer
- Displays live telemetry, verdicts, mitigation playbooks, reports, and global threat simulation

## Product Surfaces

### 1) Homepage Entry Surface
- Mission-style front page with system overview
- Direct handoff into the platform via `Enter Defense Grid`

### 2) Threat Hunter
- Generate simulated attack logs by vector
- Run one-click demo scenario
- Analyze telemetry for verdict, severity, artifacts, and recommended action
- Get immediate next-step remediation playbooks

### 3) Global Threat Map
- Tactical world/network visualization with regional nodes:
  - `US-WEST`, `US-EAST`, `EU-CENTRAL`, `APAC-01`, `LATAM`, `MEA`
- Animated threat routes, pulsing targets, and live event feed
- Node state tracking:
  - `SECURE`, `PROBED`, `UNDER ATTACK`, `ISOLATED`, `RECOVERING`
- Reacts to Threat Hunter activity (`Run Demo`, `Generate Log`, `Analyze`)

### 4) Raw Telemetry
- Event ledger for analyzed logs
- Expandable payload inspection
- CSV export for compliance/audit workflows

### 5) Summary Report
- Executive outline of findings
- Most-targeted assets and recurring patterns
- Prioritized response steps
- Downloadable summary report export

## Detection & Severity Model

### Threat Levels
- `LOW`
- `MEDIUM`
- `HIGH`
- `CRITICAL`

### Guardrail Pattern Classes
- `VELOCITY_GUARDRAIL`
- `PROTOCOL_GUARDRAIL`
- `CONTEXT_GUARDRAIL`
- `PERSONA_MASQUERADE`
- `SQL_INJECTION_ATTEMPT`

### Response Logic
Every analysis returns:
- verdict (`THREAT` or `CLEAN`)
- confidence score
- detected artifacts
- recommended action
- ordered operational next steps

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- TensorFlow.js + Universal Sentence Encoder
- Google GenAI SDK (Gemini)
- Recharts
- Lucide React

## Local Setup

### Requirements
- Node.js 18+
- npm 9+
- Modern browser with WebGL enabled

### Install
```bash
git clone https://github.com/AbhinavGGarg/BlackGrid.git
cd BlackGrid
npm install
```

### Run
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

## Usage Flow

1. Open homepage and enter platform
2. Go to **Threat Hunter** and choose attack vector
3. Generate or demo telemetry
4. Analyze and review recommended action + step-by-step response
5. Validate system-wide behavior in **Global Threat Map**
6. Export artifacts from **Raw Telemetry** and **Summary Report**

## Notes

- Gemini key is optional. Without it, BLACKGRID uses local procedural generation.
- Neural loading includes fallback handling so the interface remains operational even when model/CDN load fails.

## Disclaimer

BLACKGRID is designed for simulation, research, and defense workflow prototyping.
Use in controlled environments and pair with layered security controls for production operations.
