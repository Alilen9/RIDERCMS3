import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { updateBooth, UpdateBoothData } from '../../../../services/adminService';
import Input from '../../../ui/Input';
import { Booth } from '@/types';

interface EditBoothsFormProps {
  boothToEdit: Booth;
  onBoothUpdated: (updatedBooth: Booth) => void;
  onCancel: () => void;
}

const EditBoothsForm: React.FC<EditBoothsFormProps> = ({ boothToEdit, onBoothUpdated, onCancel }) => {
  const [formState, setFormState] = useState({
    name: '',
    locationAddress: '',
    latitude: '',
    longitude: '',
  });

  const [errors, setErrors] = useState({
    name: '',
    locationAddress: '',
    latitude: '',
    longitude: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-populate the form when the component loads or boothToEdit changes
  useEffect(() => {
    if (boothToEdit) {
      setFormState({
        name: boothToEdit.name,
        locationAddress: boothToEdit.location_address,
        latitude: boothToEdit.latitude != null ? String(boothToEdit.latitude) : '',
        longitude: boothToEdit.longitude != null ? String(boothToEdit.longitude) : '',
      });
    }
  }, [boothToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors = { name: '', locationAddress: '', latitude: '', longitude: '' };
    let isValid = true;

    if (!formState.name.trim()) {
      newErrors.name = 'Booth name is required.';
      isValid = false;
    }
    if (!formState.locationAddress.trim()) {
      newErrors.locationAddress = 'Location name is required.';
      isValid = false;
    }
    if (formState.latitude.trim()) {
      const parsedLatitude = Number(formState.latitude);
      if (!Number.isFinite(parsedLatitude)) {
        newErrors.latitude = 'Latitude must be a valid number.';
        isValid = false;
      } else if (parsedLatitude < -90 || parsedLatitude > 90) {
        newErrors.latitude = 'Latitude must be between -90 and 90.';
        isValid = false;
      }
    }
    if (formState.longitude.trim()) {
      const parsedLongitude = Number(formState.longitude);
      if (!Number.isFinite(parsedLongitude)) {
        newErrors.longitude = 'Longitude must be a valid number.';
        isValid = false;
      } else if (parsedLongitude < -180 || parsedLongitude > 180) {
        newErrors.longitude = 'Longitude must be between -180 and 180.';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    const trimmedName = formState.name.trim();
    const trimmedLocationAddress = formState.locationAddress.trim();
    const updatePayload: UpdateBoothData = {};

    if (trimmedName !== boothToEdit.name.trim()) {
      updatePayload.name = trimmedName;
    }
    if (trimmedLocationAddress !== boothToEdit.location_address.trim()) {
      updatePayload.locationAddress = trimmedLocationAddress;
    }

    const currentLatitude = boothToEdit.latitude ?? null;
    const currentLongitude = boothToEdit.longitude ?? null;

    const nextLatitude = formState.latitude.trim() === '' ? null : Number(formState.latitude.trim());
    const nextLongitude = formState.longitude.trim() === '' ? null : Number(formState.longitude.trim());

    if (nextLatitude !== currentLatitude) {
      updatePayload.latitude = nextLatitude;
    }
    if (nextLongitude !== currentLongitude) {
      updatePayload.longitude = nextLongitude;
    }

    if (Object.keys(updatePayload).length === 0) {
      toast('No changes to save.');
      return;
    }

    const loadingToast = toast.loading('Updating booth...');
    setIsSubmitting(true);
    try {
      const updatedBooth = await updateBooth(boothToEdit.booth_uid, updatePayload);

      toast.dismiss(loadingToast);
      toast.success('Booth updated successfully!');
      onBoothUpdated(updatedBooth);

    } catch (error) {
      toast.dismiss(loadingToast);
      const errorMessage = (error as any)?.response?.data?.error || (error as Error).message;
      toast.error(errorMessage);
      console.error("Error updating booth:", error);
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
        <h2 className="text-2xl font-bold mb-6 text-white border-b border-gray-700 pb-4">Edit Booth</h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-6">
            <Input
              label="Booth Name"
              name="name"
              type="text"
              value={formState.name}
              onChange={handleChange}
              error={errors.name}
            />
            <Input
              label="Location Name"
              name="locationAddress"
              type="text"
              value={formState.locationAddress}
              onChange={handleChange}
              error={errors.locationAddress}
            />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <Input
              label="Latitude (Optional)"
              name="latitude"
              type="number"
              step="any"
              value={formState.latitude}
              onChange={handleChange}
              placeholder="Leave blank to clear"
              error={errors.latitude}
            />
            <Input
              label="Longitude (Optional)"
              name="longitude"
              type="number"
              step="any"
              value={formState.longitude}
              onChange={handleChange}
              placeholder="Leave blank to clear"
              error={errors.longitude}
            />
          </div>
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBoothsForm;
