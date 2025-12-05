
import React, { useState } from 'react';
import Auth from './components/Auth';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import { User, UserRole, Station, SlotStatus, BatteryType } from './types';

// Mock Initial Station Data with Hardware Telemetry
const INITIAL_STATION: Station = {
  id: 'ST-001',
  name: 'Central Hub',
  location: 'Downtown Market',
  coordinates: { lat: -1.2921, lng: 36.8219 }, // Example Coordinates
  slots: [
    { 
      id: 1, 
      status: SlotStatus.EMPTY, 
      isDoorOpen: false,
      doorClosed: true,
      doorLocked: true,
      relayOn: false
    },
    { 
      id: 2, 
      status: SlotStatus.OCCUPIED_FULL, 
      battery: { 
        id: 'b2', 
        type: BatteryType.SCOOTER, 
        chargeLevel: 100, 
        health: 95, 
        temperature: 25, 
        voltage: 54.2, 
        cycles: 50,
        status: 'ACTIVE'
      }, 
      isDoorOpen: false,
      doorClosed: true,
      doorLocked: true,
      relayOn: false // Fully charged, relay off
    },
    { 
      id: 3, 
      status: SlotStatus.OCCUPIED_CHARGING, 
      battery: { 
        id: 'b3', 
        type: BatteryType.E_BIKE, 
        chargeLevel: 45, 
        health: 80, 
        temperature: 40, 
        voltage: 49.5, 
        cycles: 300,
        status: 'ACTIVE'
      }, 
      isDoorOpen: false,
      doorClosed: true,
      doorLocked: true,
      relayOn: true // Charging, relay on
    },
    { 
      id: 4, 
      status: SlotStatus.MAINTENANCE, 
      isDoorOpen: false,
      doorClosed: true,
      doorLocked: false,
      relayOn: false
    },
  ]
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [station, setStation] = useState<Station>(INITIAL_STATION);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const updateStation = (updatedStation: Station) => {
    setStation(updatedStation);
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <>
      {user.role === UserRole.ADMIN ? (
        <AdminDashboard 
          station={station} 
          onUpdateStation={updateStation}
          onLogout={handleLogout} 
        />
      ) : (
        <UserDashboard 
          user={user} 
          station={station} 
          onUpdateStation={updateStation}
          onLogout={handleLogout}
        />
      )}
    </>
  );
};

export default App;
