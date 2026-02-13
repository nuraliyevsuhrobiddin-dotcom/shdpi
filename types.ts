
export enum RiskLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export enum Subject {
  BIOLOGY = 'Biology',
  CHEMISTRY = 'Chemistry',
  PHARMACY = 'Pharmacy'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export enum SubscriptionTier {
  FREE = 'Free',
  PREMIUM = 'Premium',
  UNIVERSITY = 'University'
}

export enum AiMode {
  STRICT = 'Strict',
  NORMAL = 'Normal'
}

export enum AppLanguage {
  UZ = 'uz',
  RU = 'ru',
  EN = 'en'
}

export interface LabError {
  type: string;
  problem: string;
  explanation: string;
  correction: string;
  riskLevel: RiskLevel;
}

export interface AnalysisResult {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  subject: Subject;
  protocolTitle: string;
  protocolText: string;
  errors: LabError[];
  overallSafetyRating: RiskLevel;
  processingTimeMs?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  isPremium: boolean;
  tier: SubscriptionTier;
  analysesUsed: number;
  lastAnalysisDate?: string;
  role: UserRole;
  isBanned?: boolean;
  createdAt: string;
  language: AppLanguage;
  aiMode: AiMode;
  twoFactorEnabled: boolean;
}

export enum Page {
  LANDING = 'landing',
  DASHBOARD = 'dashboard',
  ANALYSIS_RESULT = 'analysis_result',
  HISTORY = 'history',
  ADMIN = 'admin',
  AUTH = 'auth',
  SETTINGS = 'settings'
}

export interface ApiLog {
  id: string;
  timestamp: string;
  endpoint: string;
  status: number;
  latency: number;
  userEmail: string;
  method: string;
}

export interface GlobalSettings {
  systemPrompt: string;
  freeAnalysisLimit: number;
  premiumPrice: number;
  universityPrice: number;
  maintenanceMode: boolean;
}
