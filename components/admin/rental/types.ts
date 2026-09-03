export type RentalBatteryStatus =
  | 'available'
  | 'issued'
  | 'charging'
  | 'maintenance'
  | 'disabled';

export interface RentalRenter {
  id: string;
  name: string;
  phone: string;
}

export interface CurrentRental {
  sessionId: string;
  renter: RentalRenter;
  startTime: string;
  durationMinutes: number;
  startSoc: number;
  currentSoc: number;
  rentalEnergy: number;
  rentalTime: number;
  totalAmount: number;
}

export interface LastRental {
  renterName: string;
  startTime: string;
  endTime: string;
  amount: number;
}

export interface RentalBattery {
  id: string;
  soc: number;
  slotId: string;
  status: RentalBatteryStatus;
  lastUpdated: string;
  currentRental?: CurrentRental;
  lastRental?: LastRental;
}

export type RentalSessionStatus =
  | 'active'
  | 'completed'
  | 'cancelled';

export interface RentalSession {
  id: string;
  riderName: string;
  ownBatteryId: string;
  rentalBatteryId: string;
  startSoc: number;
  currentSoc: number;
  durationMinutes: number;
  amount: number;
  status: RentalSessionStatus;
}