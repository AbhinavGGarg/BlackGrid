export enum ThreatLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export type AttackVector = 'Reconnaissance' | 'Exploitation' | 'Exfiltration' | 'Social Engineering' | 'RedScan_Protocol_Phase1';

export interface ThreatAnalysis {
  isAgenticThreat: boolean;
  threatLevel: ThreatLevel;
  confidenceScore: number; // 0 to 100
  detectedPatterns: string[];
  explanation: string;
  recommendedAction: string;
  // Metadata for the log entry
  timestamp?: string;
  source?: string;
  activity?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  source: string;
  activity: string;
  threatLevel: ThreatLevel;
  details: ThreatAnalysis;
}

export interface SavedSession {
  id: string;
  name: string;
  date: string;
  description: string;
  logCount: number;
  maxSeverity: ThreatLevel;
  logs: LogEntry[];
}

export interface DashboardStats {
  totalScans: number;
  threatsBlocked: number;
  highSevThreats: number;
  avgConfidence: number;
}