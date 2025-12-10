import React, { useState } from 'react';


import { createBooth } from '../../../../services/adminService';
import Input from '../../../ui/Input';
import toast from 'react-hot-toast';
import { Booth } from '@/types';

interface AddBoothsFormProps {
  onBoothAdded: (booth: Partial<Booth>) => void;
  onCancel: () => void;
}

const AddBoothsForm: React.FC<AddBoothsFormProps> = ({ onBoothAdded, onCancel }) => {
  const [formState, setFormState] = useState({
    name: '',
    location: '',
    lat: '',
    lng: '',
    initialSlots: '4',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errors, setErrors] = useState({
    name: '',
    location: '',
    lat: '',
    lng: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
    // Clear the error for the field being edited
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors = { name: '', location: '', lat: '', lng: '' };
    let isValid = true;

    if (!formState.name.trim()) {
      newErrors.name = 'Booth name is required.';
      isValid = false;
    }
    if (!formState.location.trim()) {
      newErrors.location = 'Location name is required.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    const toastId = toast.loading('Creating new booth...');
    try {
      const result = await createBooth({
        name: formState.name,
        locationAddress: formState.location, // Maps frontend 'location' to backend 'locationAddress'
      });

      // Create a booth object for the UI with the data we have
      // This must match the Booth interface from utils/types/booth.ts
      const newBoothForUI: Partial<Booth> = {
        booth_uid: result.boothUid,
        name: formState.name,
        location_address: formState.location,
        status: 'online', // Set a default status for the UI
        created_at: new Date().toISOString(), // Set a temporary creation date for the UI
      };

      onBoothAdded(newBoothForUI);
      toast.success("Booth Created Successfully!", { id: toastId });

    } catch (error) {
      console.error("Error creating booth:", error);
      // Improve error display for Axios errors
      const errorMessage = (error as any)?.response?.data?.error || (error as Error).message;
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
        <button onClick={onCancel} className="text-gray-400 hover:text-white mb-6 flex items-center gap-2 transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
             Back to Booths
        </button>
        <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-xl">
            <h2 className="text-2xl font-bold mb-6 text-white border-b border-gray-700 pb-4">Add New Booth</h2>
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <Input
                            label="Booth Name"
                            name="name"
                            type="text"
                            value={formState.name}
                            onChange={handleChange}
                            placeholder="e.g. Main Hall Booth"
                            error={errors.name}
                        />
                    </div>
                    <div>
                        <Input
                            label="Location Name"
                            name="location"
                            type="text"
                            value={formState.location}
                            onChange={handleChange}
                            placeholder="e.g. Convention Center"
                            error={errors.location}
                        />
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                    <Input label="Latitude" name="lat" type="number" step="any" value={formState.lat} onChange={handleChange} placeholder="e.g. 1.2921" />
                    <Input label="Longitude" name="lng" type="number" step="any" value={formState.lng} onChange={handleChange} placeholder="e.g. 36.8219" />
                </div>

                <div>
                    <label className="block text-xs uppercase text-gray-500 mb-2 font-bold tracking-wider">Initial Slots</label>
                    <select name="initialSlots" value={formState.initialSlots} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none">
                        <option value="4">4 Slots (Standard)</option>
                        <option value="8">8 Slots (Large)</option>
                        <option value="15">15 Slots (Hub)</option>
                    </select>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isSubmitting ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div> <span>Deploying...</span></> : 'Deploy Booth'}
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default AddBoothsForm;