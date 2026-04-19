# BLACKGRID
## Neural Defense Grid (Hybrid Architecture)

**Author:** Ritvik Indupuri
**Version:** 2.1.0
**Status:** Active // Production Ready

---

### 1. Executive Summary

**BlackGrid** is a browser-based cybersecurity platform designed to detect and neutralize **"Agentic Breakouts"**.

As AI agents become more autonomous (utilizing tools via the **Model Context Protocol**), traditional regex-based firewalls fail to detect semantic threats like persona masquerading or context-window overflow attacks. BlackGrid solves this by deploying a **Local Neural Network** directly in the browser to analyze telemetry in real-time.



---

### 2. High-Level Architecture

The system employs a **Bicameral (Two-Brain) Architecture** that decouples threat generation (Cloud) from threat detection (Edge), ensuring zero-trust privacy for analysis.

<p align="center">
  <img src="https://i.imgur.com/kp4COh6.png" alt="BlackGrid Hybrid Architecture Diagram" width="700" />
  <br>
  <em>Figure 1: BlackGrid Hybrid Data Flow (Cloud Generation → Local Neural Analysis)</em>
</p>

**Architecture Breakdown:**

1.  **Cloud Layer (The Attacker):**
    *   **Google Gemini 2.5 Flash** acts as the "Red Team."
    *   It generates high-fidelity, context-aware **JSON Attack Logs** simulating advanced tradecraft (RedScan Protocol, Context Overflows) based on specific prompts.

2.  **Local Client Layer (The Defender):**
    *   **Threat Hunter Console:** The interface where operators inject logs or trigger simulations.
    *   **TensorFlow.js Engine:** The core defense logic. It runs the **Universal Sentence Encoder** entirely in the browser's WebGL backend. It converts incoming logs into 512-dimensional vectors and performs matrix multiplication against known threat anchors.
    *   **Ops Center:** Visualizes the output (Threat Scores, System Load) in real-time.

---

### 3. Core Capabilities

#### Neural Heuristics Engine
Instead of sending sensitive logs to the cloud, BlackGrid loads the **Universal Sentence Encoder** model directly into the browser's GPU. It measures the semantic distance between incoming logs and known threat anchors.
*   **Zero-Shot Learning:** Detects novel threats based on conceptual similarity rather than exact keyword matches.

####  Procedural Telemetry Generator
A dual-mode engine that constructs realistic cyber-attack logs for training and testing.
*   **Cloud Mode:** Uses Gemini API to generate context-aware Red Team logs.
*   **Local Mode:** Uses algorithmic templates for offline simulation.

####  MCP Guardrails
Specific detectors for **Model Context Protocol** violations:
*   **Velocity:** Detects inhuman tool execution speeds (>3 ops/sec).
*   **Protocol:** Flags missing authentication signatures in agent handshakes.
*   **Context:** Identifies payload truncation attempts designed to hide malicious code.

---

### 4. Technology Stack

*   **Frontend Framework:** React 19 (TypeScript)
*   **Defense Engine:** TensorFlow.js (WebGL) + Universal Sentence Encoder
*   **Attack Engine:** Google GenAI SDK (Gemini 2.5 Flash)
*   **Visualization:** Recharts
*   **Styling:** Tailwind CSS
*   **Icons:** Lucide React

---

### 5. Installation & Setup

**Prerequisites:**
- Node.js (v18 or higher)
- NPM (v9 or higher)
- Modern Browser (Chrome/Edge/Firefox) with WebGL enabled

**Step 1: Clone the Repository**
```bash
git clone https://github.com/AbhinavGGarg/BlackGrid.git
cd BlackGrid
```

**Step 2: Install Dependencies**
```bash
npm install
```

**Step 3: Launch Application**
```bash
npm start
```
The application will launch at `http://localhost:3000`.
*Note: Upon first load, the system will download the TensorFlow.js model shards (approx 30MB). This happens once and is cached.*

---

### 6. Usage Guide

#### Phase 1: Threat Hunting (Simulation)
1.  Navigate to **Threat Hunter**.
2.  Select an Attack Vector (e.g., "Exfiltration").
3.  (Optional) Enter a Gemini API Key in Settings for AI-powered generation.
4.  Click **GENERATE LOG**. The system will "type out" a simulated attack log.

#### Phase 2: Neural Analysis (Defense)
1.  Click **ANALYZE TELEMETRY**.
2.  The local TensorFlow model computes the vector embeddings.
3.  A verdict (THREAT/CLEAN) is returned in <100ms.

#### Phase 3: Compliance & Auditing
1.  Navigate to **Raw Telemetry**.
2.  Review the immutable audit trail.
3.  Click **EXPORT COMPLIANCE REPORT** to download a CSV for external auditing.

---

### 7. Disclaimer

This tool uses client-side machine learning for educational and research purposes. While the Universal Sentence Encoder is powerful, production security systems should rely on multi-layered defense strategies involving network-level firewalls and SIEM integration.
