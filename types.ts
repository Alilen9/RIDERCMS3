

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  DEVELOPER = 'developer',
  OPERATOR = 'OPERATOR'
}

export enum BatteryType {
  E_BIKE = 'E-Bike',
  SCOOTER = 'Scooter',
  CAR_MODULE = 'Car Module'
}

export enum SlotStatus {
  EMPTY = 'EMPTY',
  OCCUPIED_CHARGING = 'OCCUPIED_CHARGING',
  OCCUPIED_FULL = 'OCCUPIED_FULL',
  MAINTENANCE = 'MAINTENANCE',
  FAULTY = 'FAULTY'
}

export interface User {
  password: any;
  id: string;
  name: string;
  phoneNumber: string;
  role: UserRole;
  balance: number;
  status?: 'ACTIVE' | 'SUSPENDED';
}

export interface Battery {
  id: string;
  type: BatteryType;
  chargeLevel: number; // 0-100
  health: number; // 0-100
  temperature: number; // Celsius
  voltage: number;
  cycles: number;
  ownerId?: string; // If null, it belongs to the station pool
  status?: 'ACTIVE' | 'RETIRED' | 'LOST';
}

export interface Slot {
  userName: any;
  identifier: string;
  status: string;
  doorStatus: string;
  batteryUid: string | null;
  chargeLevel: number | null;
}

export interface Station {
  id: string;
  name: string;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  slots: Slot[];
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  date: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED';
  type: 'DEPOSIT' | 'SWAP' | 'SUBSCRIPTION';
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  actor: string; // User or System
}

export interface Booth {
  booth_uid: string;
  name: string;
  location_address: string;
  status: string;
  created_at: string;
  updated_at: string;
  latitude?: number | null;
  longitude?: number | null;
  slots: BoothSlot[];
  slotCount: number;
}

export interface BoothSlot {
  identifier: string;
  status: string;
  doorStatus: string;
  chargeLevel: number | null;
  batteryUid: string | null;
  userName: string | null; // Added to match the joined user name from the DB
}


/**
 * Session status statistics
 */
export interface SummaryStats {
  pending: number;
  completed: number;
  failed: number;
  failure: number; // alias for failed
}

/**
 * Additional session counts
 */
export interface ExtraStats {
  total: number;
  opening: number;
  inprogress: number;
  cancelled: number;
  redeemed: number;
}

/**
 * Daily trend data point for status trend chart
 */
export interface DailyTrend {
  date: string;
  pending: number;
  completed: number;
  failed: number;
  total: number;
}

/**
 * Breakdown by status
 */
export interface BreakdownByStatus {
  pending: number;
  completed: number;
  failed: number;
  cancelled: number;
}

/**
 * Breakdown by session type
 */
export interface BreakdownBySessionType {
  deposit: number;
  withdrawal: number;
}

/**
 * Complete stats response from /api/stats endpoint
 */
export interface StatsResponse {
  summary: SummaryStats;
  extra: ExtraStats;
  charts: {
    statusTrend: DailyTrend[];
  };
  breakdowns: {
    byStatus: BreakdownByStatus;
    bySessionType: BreakdownBySessionType;
  };
}

/**
 * Query parameters for /api/stats endpoint
 */
export interface StatsQueryParams {
  scope?: 'all' | string;
  sessionType?: 'all' | 'deposit' | 'Withdrawal';
  days?: number; // 1..90, default 7
}

/**
 * Summary data for the admin dashboard
 */
export interface ActiveBatteryEntry {
  battery: Battery;
  slot: Slot;
  sessionId: number;
}

export interface DashboardSummary {
  totalRevenue: number;
  activeStations: number;
  totalSwaps: number;
  activeSessions: number;
  swapVolumeTrend: { time: string; swaps: number }[];
  batteryUsage: { name: string; value: number }[];
}
