import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { updateBooth } from '../../../../services/adminService';
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
    location: '',
  });

  const [errors, setErrors] = useState({
    name: '',
    location: '',
  });

  // Pre-populate the form when the component loads or boothToEdit changes
  useEffect(() => {
    if (boothToEdit) {
      setFormState({
        name: boothToEdit.name,
        location: boothToEdit.location_address,
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
    const newErrors = { name: '', location: '' };
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
    if (!validate()) return;

    const loadingToast = toast.loading('Updating booth...');
    try {
      const updatedBooth = await updateBooth(boothToEdit.booth_uid, {
        name: formState.name,
        locationAddress: formState.location,
      });

      toast.dismiss(loadingToast);
      toast.success('Booth updated successfully!');
      onBoothUpdated(updatedBooth);

    } catch (error) {
      toast.dismiss(loadingToast);
      const errorMessage = (error as any)?.response?.data?.error || (error as Error).message;
      toast.error(errorMessage);
      console.error("Error updating booth:", error);
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
              name="location"
              type="text"
              value={formState.location}
              onChange={handleChange}
              error={errors.location}
            />
          </div>
          <div className="pt-4">
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg transition-colors">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBoothsForm;