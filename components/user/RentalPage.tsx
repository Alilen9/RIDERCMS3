import RentalFlow from '@/components/user/RentalFlow';
import React from 'react';
import { useNavigate } from 'react-router-dom';

const RentalPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <RentalFlow
      ownBatterySoc={80}
      ownBatteryId="OWN-BAT-001"
      slotIdentifier="SLOT-08"
      onClose={() => navigate('/dashboard')}
    />
  );
};

export default RentalPage;