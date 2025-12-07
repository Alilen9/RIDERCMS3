import React, { useState, useEffect } from 'react';
import * as adminService from '../../services/adminService';
import { toast } from 'react-hot-toast';

const SystemConfig: React.FC = () => {
  const [settings, setSettings] = useState<adminService.AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await adminService.getSettings();
        setSettings(data);
      } catch (err) {
        setError('Failed to load system configuration.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleInputChange = (category: keyof adminService.AppSettings, key: string, value: string | number) => {
    setSettings(prev => {
      if (!prev) return null;
      const newSettings = { ...prev };
      // @ts-ignore
      newSettings[category] = { ...newSettings[category], [key]: value };
      return newSettings;
    });
  };

  const handleToggleChange = (category: keyof adminService.AppSettings, key: string, value: boolean) => {
    setSettings(prev => {
      if (!prev) return null;
      const newSettings = { ...prev };
      // @ts-ignore
      newSettings[category] = { ...newSettings[category], [key]: value };
      return newSettings;
    });
  };

  const handleSaveChanges = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await adminService.updateSettings(settings);
      toast.success('Settings updated successfully!');
    } catch (err) {
      toast.error('Failed to save settings.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const renderSkeleton = () => (
    <div className="space-y-6 animate-pulse">
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <div className="h-6 bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-2 gap-6">
          <div className="h-10 bg-gray-700 rounded w-full"></div>
          <div className="h-10 bg-gray-700 rounded w-full"></div>
          <div className="h-10 bg-gray-700 rounded w-full"></div>
        </div>
      </div>
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-10 bg-gray-700 rounded w-full"></div>
      </div>
    </div>
  );

  if (loading) return renderSkeleton();
  if (error) return <div className="text-center p-8 text-red-400">{error}</div>;

  return (
    <div className="animate-fade-in max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">System Configuration</h2>
        <button
          onClick={handleSaveChanges}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-bold text-sm"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="space-y-6">
        {/* Pricing Config */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-bold mb-4 text-emerald-400">Pricing Rules</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs uppercase text-gray-500 mb-1">Base Swap Fee (KES)</label>
              <input type="number" value={settings?.pricing?.base_swap_fee || ''} onChange={(e) => handleInputChange('pricing', 'base_swap_fee', parseFloat(e.target.value))} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" />
            </div>
            <div>
              <label className="block text-xs uppercase text-gray-500 mb-1">Cost per kWh (KES)</label>
              <input type="number" value={settings?.pricing?.cost_per_kwh || ''} onChange={(e) => handleInputChange('pricing', 'cost_per_kwh', parseFloat(e.target.value))} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" />
            </div>
            <div>
              <label className="block text-xs uppercase text-gray-500 mb-1">Overtime Penalty (KES/min)</label>
              <input type="number" value={settings?.pricing?.overtime_penalty_per_min || ''} onChange={(e) => handleInputChange('pricing', 'overtime_penalty_per_min', parseFloat(e.target.value))} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" />
            </div>
          </div>
        </div>

        {/* Access Control */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-bold mb-4 text-purple-400">Access Control</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">Allow Open Registration</p>
              <p className="text-sm text-gray-500">If disabled, only admins can create new user accounts.</p>
            </div>
            <button onClick={() => handleToggleChange('access_control', 'allow_open_registration', !settings?.access_control?.allow_open_registration)} className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${settings?.access_control?.allow_open_registration ? 'bg-emerald-600' : 'bg-gray-600'}`}>
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${settings?.access_control?.allow_open_registration ? 'transform translate-x-6' : ''}`}></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemConfig;