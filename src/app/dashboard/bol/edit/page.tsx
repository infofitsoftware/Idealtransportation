"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { bolService } from "@/services/transaction";
import { useAccessControl } from "@/hooks/useAccessControl";
import toast from 'react-hot-toast';

interface Vehicle {
  year: string;
  make: string;
  model: string;
  vin: string;
  mileage: string;
  price: string;
}

interface BillOfLading {
  id: number;
  driver_name: string;
  date: string;
  work_order_no?: string;
  total_amount?: number;
  total_collected?: number;
  due_amount?: number;
  pickup_name?: string;
  pickup_address?: string;
  pickup_city?: string;
  pickup_state?: string;
  pickup_zip?: string;
  pickup_phone?: string;
  delivery_name?: string;
  delivery_address?: string;
  delivery_city?: string;
  delivery_state?: string;
  delivery_zip?: string;
  delivery_phone?: string;
  condition_codes?: string;
  remarks?: string;
  pickup_agent_name?: string;
  pickup_signature?: string;
  pickup_date?: string;
  delivery_agent_name?: string;
  delivery_signature?: string;
  delivery_date?: string;
  receiver_agent_name?: string;
  receiver_signature?: string;
  receiver_date?: string;
  broker_name?: string;
  broker_address?: string;
  broker_phone?: string;
  vehicles: Vehicle[];
}

function BOLEditContent() {
  const { currentUser, loading: accessLoading, hasAccess, isSuperuser } = useAccessControl();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [bol, setBol] = useState<BillOfLading | null>(null);

  const bolId = searchParams.get('id');

  // Form state
  const [formData, setFormData] = useState({
    driver_name: '',
    date: '',
    work_order_no: '',
    broker_name: '',
    broker_address: '',
    broker_phone: '',
    pickup_name: '',
    pickup_address: '',
    pickup_city: '',
    pickup_state: '',
    pickup_zip: '',
    pickup_phone: '',
    delivery_name: '',
    delivery_address: '',
    delivery_city: '',
    delivery_state: '',
    delivery_zip: '',
    delivery_phone: '',
    condition_codes: '',
    remarks: '',
    pickup_agent_name: '',
    pickup_date: '',
    delivery_agent_name: '',
    delivery_date: '',
    receiver_agent_name: '',
    receiver_date: ''
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { year: '', make: '', model: '', vin: '', mileage: '', price: '' }
  ]);

  useEffect(() => {
    const fetchBOL = async () => {
      if (!bolId || !hasAccess) return;

      try {
        setLoading(true);
        setError("");
        const bolData = await bolService.getBOL(parseInt(bolId));
        setBol(bolData);
        
        // Populate form with existing data
        setFormData({
          driver_name: bolData.driver_name || '',
          date: bolData.date || '',
          work_order_no: bolData.work_order_no || '',
          broker_name: bolData.broker_name || '',
          broker_address: bolData.broker_address || '',
          broker_phone: bolData.broker_phone || '',
          pickup_name: bolData.pickup_name || '',
          pickup_address: bolData.pickup_address || '',
          pickup_city: bolData.pickup_city || '',
          pickup_state: bolData.pickup_state || '',
          pickup_zip: bolData.pickup_zip || '',
          pickup_phone: bolData.pickup_phone || '',
          delivery_name: bolData.delivery_name || '',
          delivery_address: bolData.delivery_address || '',
          delivery_city: bolData.delivery_city || '',
          delivery_state: bolData.delivery_state || '',
          delivery_zip: bolData.delivery_zip || '',
          delivery_phone: bolData.delivery_phone || '',
          condition_codes: bolData.condition_codes || '',
          remarks: bolData.remarks || '',
          pickup_agent_name: bolData.pickup_agent_name || '',
          pickup_date: bolData.pickup_date || '',
          delivery_agent_name: bolData.delivery_agent_name || '',
          delivery_date: bolData.delivery_date || '',
          receiver_agent_name: bolData.receiver_agent_name || '',
          receiver_date: bolData.receiver_date || ''
        });
        
        setVehicles(bolData.vehicles && bolData.vehicles.length > 0 ? bolData.vehicles : [
          { year: '', make: '', model: '', vin: '', mileage: '', price: '' }
        ]);
      } catch (err: any) {
        console.error('Error fetching BOL:', err);
        setError(err.message || 'Failed to load BOL details');
      } finally {
        setLoading(false);
      }
    };

    if (hasAccess && bolId) {
      fetchBOL();
    }
  }, [bolId, hasAccess]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleVehicleChange = (index: number, field: keyof Vehicle, value: string) => {
    setVehicles(prev => prev.map((vehicle, i) => 
      i === index ? { ...vehicle, [field]: value } : vehicle
    ));
  };

  const addVehicle = () => {
    setVehicles(prev => [...prev, { year: '', make: '', model: '', vin: '', mileage: '', price: '' }]);
  };

  const removeVehicle = (index: number) => {
    if (vehicles.length > 1) {
      setVehicles(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bolId) return;

    try {
      setSaving(true);
      setError("");

      // Calculate total amount from vehicles
      const totalAmount = vehicles.reduce((sum, vehicle) => {
        const price = parseFloat(vehicle.price) || 0;
        return sum + price;
      }, 0);

      // Prepare data for backend - include all required fields
      const bolData = {
        driver_name: formData.driver_name,
        date: formData.date || new Date().toISOString().split('T')[0], // Ensure date is never empty
        work_order_no: formData.work_order_no || null,
        broker_name: formData.broker_name || null,
        broker_address: formData.broker_address || null,
        broker_phone: formData.broker_phone || null,
        pickup_name: formData.pickup_name || null,
        pickup_address: formData.pickup_address || null,
        pickup_city: formData.pickup_city || null,
        pickup_state: formData.pickup_state || null,
        pickup_zip: formData.pickup_zip || null,
        pickup_phone: formData.pickup_phone || null,
        delivery_name: formData.delivery_name || null,
        delivery_address: formData.delivery_address || null,
        delivery_city: formData.delivery_city || null,
        delivery_state: formData.delivery_state || null,
        delivery_zip: formData.delivery_zip || null,
        delivery_phone: formData.delivery_phone || null,
        condition_codes: formData.condition_codes || null,
        remarks: formData.remarks || null,
        pickup_agent_name: formData.pickup_agent_name || null,
        pickup_signature: bol?.pickup_signature || null, // Preserve existing signature
        pickup_date: formData.pickup_date || null,
        delivery_agent_name: formData.delivery_agent_name || null,
        delivery_signature: bol?.delivery_signature || null, // Preserve existing signature
        delivery_date: formData.delivery_date || null,
        receiver_agent_name: formData.receiver_agent_name || null,
        receiver_signature: bol?.receiver_signature || null, // Preserve existing signature
        receiver_date: formData.receiver_date || null,
        total_amount: totalAmount, // Required field - calculated from vehicles
        vehicles: vehicles.filter(v => v.year && v.make && v.model).map(v => ({
          year: v.year,
          make: v.make,
          model: v.model,
          vin: v.vin || '',
          mileage: v.mileage || '',
          price: v.price || '0'
        })) // Only include vehicles with basic info and ensure all fields are strings
      };

      console.log('Sending BOL data to backend:', bolData);
      await bolService.updateBOL(parseInt(bolId), bolData);
      toast.success('BOL updated successfully');
      router.push(`/dashboard/bol/detail?id=${bolId}`);
    } catch (err: any) {
      console.error('Error updating BOL:', err);
      console.error('Error response data:', err.response?.data);
      
      // Handle different error response formats
      let errorMessage = 'Failed to update BOL';
      
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (Array.isArray(err.response.data)) {
          // Handle validation errors array
          errorMessage = err.response.data.map((error: any) => {
            if (typeof error === 'string') return error;
            if (error.msg) return error.msg;
            if (error.message) return error.message;
            return JSON.stringify(error);
          }).join(', ');
        } else if (typeof err.response.data === 'object') {
          // Handle object errors - convert to string safely
          try {
            errorMessage = JSON.stringify(err.response.data);
          } catch {
            errorMessage = 'Validation error occurred';
          }
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push(`/dashboard/bol/detail?id=${bolId}`);
  };

  if (accessLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-8 mb-8 border border-blue-100">
        <div className="text-center py-8">
          <div className="text-gray-500">Checking access permissions...</div>
        </div>
      </div>
    );
  }

  if (!hasAccess || !isSuperuser) {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-8 mb-8 border border-red-100">
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-red-700 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to edit BOLs. Only superusers can edit BOLs.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-8 mb-8 border border-blue-100">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <div className="text-xl font-semibold text-gray-700 mb-2">Loading BOL Details</div>
          <div className="text-sm text-gray-500">Fetching BOL information...</div>
        </div>
      </div>
    );
  }

  if (error || !bol) {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-8 mb-8 border border-red-100">
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-red-700 mb-2">Error Loading BOL</h1>
          <p className="text-gray-600 mb-4">{error || 'BOL not found'}</p>
          <button
            onClick={() => router.push('/dashboard/reports')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-8 mb-8 border border-blue-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back to BOL Details
          </button>
          <h1 className="text-3xl font-extrabold text-blue-700 tracking-tight">
            Edit BOL #{bol.id}
          </h1>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="driver_name" className="block text-sm font-medium text-gray-700 mb-1">
                Driver Name *
              </label>
              <input
                type="text"
                id="driver_name"
                name="driver_name"
                value={formData.driver_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="work_order_no" className="block text-sm font-medium text-gray-700 mb-1">
                Work Order Number
              </label>
              <input
                type="text"
                id="work_order_no"
                name="work_order_no"
                value={formData.work_order_no}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Broker Information */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Broker Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="broker_name" className="block text-sm font-medium text-gray-700 mb-1">
                Broker Name
              </label>
              <input
                type="text"
                id="broker_name"
                name="broker_name"
                value={formData.broker_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="broker_phone" className="block text-sm font-medium text-gray-700 mb-1">
                Broker Phone
              </label>
              <input
                type="text"
                id="broker_phone"
                name="broker_phone"
                value={formData.broker_phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="broker_address" className="block text-sm font-medium text-gray-700 mb-1">
                Broker Address
              </label>
              <input
                type="text"
                id="broker_address"
                name="broker_address"
                value={formData.broker_address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Pickup Information */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Pickup Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pickup_name" className="block text-sm font-medium text-gray-700 mb-1">
                Pickup Name
              </label>
              <input
                type="text"
                id="pickup_name"
                name="pickup_name"
                value={formData.pickup_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="pickup_phone" className="block text-sm font-medium text-gray-700 mb-1">
                Pickup Phone
              </label>
              <input
                type="text"
                id="pickup_phone"
                name="pickup_phone"
                value={formData.pickup_phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="pickup_address" className="block text-sm font-medium text-gray-700 mb-1">
                Pickup Address
              </label>
              <input
                type="text"
                id="pickup_address"
                name="pickup_address"
                value={formData.pickup_address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="pickup_city" className="block text-sm font-medium text-gray-700 mb-1">
                Pickup City
              </label>
              <input
                type="text"
                id="pickup_city"
                name="pickup_city"
                value={formData.pickup_city}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="pickup_state" className="block text-sm font-medium text-gray-700 mb-1">
                Pickup State
              </label>
              <input
                type="text"
                id="pickup_state"
                name="pickup_state"
                value={formData.pickup_state}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="pickup_zip" className="block text-sm font-medium text-gray-700 mb-1">
                Pickup ZIP
              </label>
              <input
                type="text"
                id="pickup_zip"
                name="pickup_zip"
                value={formData.pickup_zip}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Delivery Information */}
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Delivery Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="delivery_name" className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Name
              </label>
              <input
                type="text"
                id="delivery_name"
                name="delivery_name"
                value={formData.delivery_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="delivery_phone" className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Phone
              </label>
              <input
                type="text"
                id="delivery_phone"
                name="delivery_phone"
                value={formData.delivery_phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="delivery_address" className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Address
              </label>
              <input
                type="text"
                id="delivery_address"
                name="delivery_address"
                value={formData.delivery_address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="delivery_city" className="block text-sm font-medium text-gray-700 mb-1">
                Delivery City
              </label>
              <input
                type="text"
                id="delivery_city"
                name="delivery_city"
                value={formData.delivery_city}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="delivery_state" className="block text-sm font-medium text-gray-700 mb-1">
                Delivery State
              </label>
              <input
                type="text"
                id="delivery_state"
                name="delivery_state"
                value={formData.delivery_state}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="delivery_zip" className="block text-sm font-medium text-gray-700 mb-1">
                Delivery ZIP
              </label>
              <input
                type="text"
                id="delivery_zip"
                name="delivery_zip"
                value={formData.delivery_zip}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Vehicles */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Vehicles</h2>
            <button
              type="button"
              onClick={addVehicle}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Add Vehicle
            </button>
          </div>
          <div className="space-y-4">
            {vehicles.map((vehicle, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-800">Vehicle {index + 1}</h3>
                  {vehicles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVehicle(index)}
                      className="text-red-600 hover:text-red-800 transition-colors flex items-center gap-1"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <input
                      type="text"
                      value={vehicle.year}
                      onChange={(e) => handleVehicleChange(index, 'year', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
                    <input
                      type="text"
                      value={vehicle.make}
                      onChange={(e) => handleVehicleChange(index, 'make', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                    <input
                      type="text"
                      value={vehicle.model}
                      onChange={(e) => handleVehicleChange(index, 'model', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">VIN</label>
                    <input
                      type="text"
                      value={vehicle.vin}
                      onChange={(e) => handleVehicleChange(index, 'vin', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mileage</label>
                    <input
                      type="text"
                      value={vehicle.mileage}
                      onChange={(e) => handleVehicleChange(index, 'mileage', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={vehicle.price}
                      onChange={(e) => handleVehicleChange(index, 'price', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Additional Information</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="condition_codes" className="block text-sm font-medium text-gray-700 mb-1">
                Condition Codes
              </label>
              <input
                type="text"
                id="condition_codes"
                name="condition_codes"
                value={formData.condition_codes}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-1">
                Remarks
              </label>
              <textarea
                id="remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={handleBack}
            className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function BOLEditPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-8 mb-8 border border-blue-100">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <div className="text-xl font-semibold text-gray-700 mb-2">Loading...</div>
        </div>
      </div>
    }>
      <BOLEditContent />
    </Suspense>
  );
}
