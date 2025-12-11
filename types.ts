

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
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
  status: 'online' | 'maintenance' | 'offline';
  created_at: string;
  updated_at: string;
  slotCount: number;
  slots: Slot[];
  // Optional fields that might come from other endpoints or be added on the client
  latitude?: number;
  longitude?: number;
}
