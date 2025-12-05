export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
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
  MAINTENANCE = 'MAINTENANCE'
}

export interface User {
  password: any;
  id: string;
  name: string;
  phoneNumber: string;
  role: UserRole;
  balance: number;
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
}

export interface Slot {
  id: number;
  status: SlotStatus;
  battery?: Battery;
  isDoorOpen: boolean;
}

export interface Station {
  id: string;
  name: string;
  location: string;
  slots: Slot[];
}
