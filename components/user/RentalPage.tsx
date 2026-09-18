import RentalFlow from '@/components/user/RentalFlow';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as boothService from '../../services/boothService';

const RentalPage: React.FC = () => {
  const navigate = useNavigate();

  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const checkFeature = async () => {
      try {
        const status =
          await boothService.getRentalFeatureStatus();

        if (cancelled) return;

        setEnabled(status.enabled);

        if (!status.enabled) {
          navigate('/dashboard', { replace: true });
        }
      } catch {
        if (!cancelled) setEnabled(true);
      }
    };

    checkFeature();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (!enabled) return null;

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