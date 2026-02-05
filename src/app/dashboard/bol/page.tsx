"use client";

import React, { useState, useRef, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import {
  UserIcon,
  TruckIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  CalendarDaysIcon,
  PhoneIcon,
  BuildingOffice2Icon,
  ExclamationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast';
import FormHeader from '@/components/FormHeader';
import { api } from '@/services/auth';
import { useAccessControl } from '@/hooks/useAccessControl';
import FormProgress from '@/components/forms/FormProgress';
import FieldValidation from '@/components/forms/FieldValidation';
import DriverSelect from '@/components/forms/DriverSelect';

interface Vehicle {
  year: string;
  make: string;
  model: string;
  vin: string;
  mileage: string;
  price: string;
}

const initialVehicle: Vehicle = {
  year: "",
  make: "",
  model: "",
  vin: "",
  mileage: "",
  price: "",
};

// Form sections for progress tracking
const FORM_SECTIONS = [
  { id: 'basic', label: 'Basic Info', completed: false },
  { id: 'broker', label: 'Broker', completed: false },
  { id: 'pickup', label: 'Pickup', completed: false },
  { id: 'delivery', label: 'Delivery', completed: false },
  { id: 'vehicles', label: 'Vehicles', completed: false },
  { id: 'signatures', label: 'Signatures', completed: false },
];

function SectionHeader({ 
  icon: Icon, 
  title, 
  isCollapsed, 
  onToggle 
}: { 
  icon: any; 
  title: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div 
      className={`flex items-center justify-between mb-2 mt-6 ${onToggle ? 'cursor-pointer' : ''}`}
      onClick={onToggle}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 tracking-tight">{title}</h2>
      </div>
      {onToggle && (
        isCollapsed ? (
          <ChevronDownIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        ) : (
          <ChevronUpIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        )
      )}
    </div>
  );
}

function SignaturePad({ value, onChange, label }: { value: string; onChange: (data: string) => void; label: string }) {
  const sigRef = useRef<SignatureCanvas>(null);
  const clear = () => {
    sigRef.current?.clear();
    onChange("");
  };
  const handleEnd = () => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      const canvas = sigRef.current.getCanvas();
      const dataUrl = canvas.toDataURL("image/png");
      onChange(dataUrl);
    }
  };
  return (
    <div className="mb-2">
      <label className="block font-medium mb-1 text-gray-700 dark:text-gray-100">{label}</label>
      <div className="border-2 border-blue-200 dark:border-blue-700 rounded bg-gray-50 dark:bg-gray-700 overflow-hidden" style={{ width: '100%', maxWidth: 300, height: 100 }}>
        <SignatureCanvas
          ref={sigRef}
          penColor="#2563eb"
          canvasProps={{ width: 300, height: 100, className: "sigCanvas" }}
          onEnd={handleEnd}
          backgroundColor="#f9fafb"
        />
      </div>
      <div className="flex gap-2 mt-1">
        <button type="button" onClick={clear} className="text-sm text-blue-600 dark:text-blue-400 underline">Clear</button>
        {value && (
          <span className="text-green-600 dark:text-green-400 text-xs">Signature captured</span>
        )}
      </div>
      {value && (
        <img src={value} alt="Signature preview" className="mt-2 border dark:border-gray-600 rounded bg-white dark:bg-gray-800" style={{ width: 150, height: 50 }} />
      )}
    </div>
  );
}

export default function BillOfLadingForm() {
  const router = useRouter();
  const { isSuperuser, currentUser } = useAccessControl();
  const [form, setForm] = useState({
    driver_name: "",
    date: "",
    work_order_no: "",
    // Broker information fields
    broker_name: "",
    broker_address: "",
    broker_phone: "",
    pickup_name: "",
    pickup_address: "",
    pickup_city: "",
    pickup_state: "",
    pickup_zip: "",
    pickup_phone: "",
    delivery_name: "",
    delivery_address: "",
    delivery_city: "",
    delivery_state: "",
    delivery_zip: "",
    delivery_phone: "",
    condition_codes: [] as string[],
    remarks: "",
    pickup_agent_name: "",
    pickup_signature: "",
    pickup_date: "",
    delivery_agent_name: "",
    delivery_signature: "",
    delivery_date: "",
    // Receiver agent fields
    receiver_agent_name: "",
    receiver_signature: "",
    receiver_date: "",
  });
  const [vehicles, setVehicles] = useState<Vehicle[]>([{ ...initialVehicle }]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [workOrderError, setWorkOrderError] = useState<string | null>(null);
  const [checkingWorkOrder, setCheckingWorkOrder] = useState(false);
  
  // Field validation states
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  // Collapsible sections state
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    broker: false,
    pickup: false,
    delivery: false,
    vehicles: false,
    conditionCodes: false,
    remarks: false,
    signatures: false,
  });

  // Calculate form progress
  const calculateProgress = () => {
    let completedSteps = 0;
    const steps = FORM_SECTIONS.map((section) => {
      let completed = false;
      
      switch (section.id) {
        case 'basic':
          completed = !!(form.driver_name && form.date && form.work_order_no && !workOrderError);
          break;
        case 'broker':
          completed = !!(form.broker_name || form.broker_address || form.broker_phone);
          break;
        case 'pickup':
          completed = !!(form.pickup_name || form.pickup_address);
          break;
        case 'delivery':
          completed = !!(form.delivery_name || form.delivery_address);
          break;
        case 'vehicles':
          completed = vehicles.some(v => v.year || v.make || v.model);
          break;
        case 'signatures':
          completed = !!(form.pickup_signature || form.delivery_signature || form.receiver_signature);
          break;
      }
      
      if (completed) completedSteps++;
      return { ...section, completed };
    });
    
    const currentStep = completedSteps;
    return { steps, currentStep, totalSteps: FORM_SECTIONS.length };
  };

  const { steps, currentStep, totalSteps } = calculateProgress();

  // Calculate total amount as vehicles are added/edited
  useEffect(() => {
    let sum = 0;
    vehicles.forEach(v => {
      const price = parseFloat(v.price || '0');
      if (!isNaN(price)) sum += price;
    });
    setTotalAmount(sum);
  }, [vehicles]);

  // Auto-populate date with today's date if empty
  useEffect(() => {
    if (!form.date) {
      const today = new Date().toISOString().split('T')[0];
      setForm(prev => ({ ...prev, date: today }));
    }
  }, []);

  // Auto-populate driver name for drivers
  useEffect(() => {
    if (!isSuperuser && currentUser?.full_name && !form.driver_name) {
      setForm(prev => ({ ...prev, driver_name: currentUser.full_name }));
    }
  }, [isSuperuser, currentUser, form.driver_name]);

  // Validate work order number uniqueness
  useEffect(() => {
    const checkUnique = async () => {
      if (!form.work_order_no) {
        setWorkOrderError(null);
        setFieldErrors(prev => ({ ...prev, work_order_no: '' }));
        return;
      }
      setCheckingWorkOrder(true);
      try {
        const response = await api.get(`/bol/?work_order_no=${encodeURIComponent(form.work_order_no)}`);
        const bols = response.data;
        if (Array.isArray(bols) && bols.some((b: any) => b.work_order_no === form.work_order_no)) {
          const errorMsg = 'Work order number already exists. Please use a unique number.';
          setWorkOrderError(errorMsg);
          setFieldErrors(prev => ({ ...prev, work_order_no: errorMsg }));
        } else {
          setWorkOrderError(null);
          setFieldErrors(prev => ({ ...prev, work_order_no: '' }));
        }
      } catch {
        setWorkOrderError(null);
        setFieldErrors(prev => ({ ...prev, work_order_no: '' }));
      } finally {
        setCheckingWorkOrder(false);
      }
    };
    
    const timeoutId = setTimeout(checkUnique, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [form.work_order_no]);

  // Field validation
  const validateField = (name: string, value: any): string => {
    switch (name) {
      case 'work_order_no':
        if (!value) return 'Work order number is required';
        if (workOrderError) return workOrderError;
        return '';
      case 'date':
        if (!value) return 'Date is required';
        return '';
      case 'driver_name':
        if (!value) return 'Driver name is required';
        return '';
      case 'pickup_name':
        if (form.pickup_address && !value) return 'Pickup name is required when address is provided';
        return '';
      case 'delivery_name':
        if (form.delivery_address && !value) return 'Delivery name is required when address is provided';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    
    // Mark field as touched
    if (!touchedFields[name]) {
      setTouchedFields(prev => ({ ...prev, [name]: true }));
    }
    
    // Validate field
    const error = validateField(name, value);
    setFieldErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleDriverChange = (value: string) => {
    setForm(prev => ({ ...prev, driver_name: value }));
    if (!touchedFields.driver_name) {
      setTouchedFields(prev => ({ ...prev, driver_name: true }));
    }
    const error = validateField('driver_name', value);
    setFieldErrors(prev => ({ ...prev, driver_name: error }));
  };

  const handleVehicleChange = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setVehicles((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [name]: value };
      return updated;
    });
  };

  const addVehicle = () => setVehicles((prev) => [...prev, { ...initialVehicle }]);
  const removeVehicle = (idx: number) => setVehicles((prev) => prev.filter((_, i) => i !== idx));

  const handleConditionCode = (code: string) => {
    setForm((prev) => {
      const codes = prev.condition_codes.includes(code)
        ? prev.condition_codes.filter((c) => c !== code)
        : [...prev.condition_codes, code];
      return { ...prev, condition_codes: codes };
    });
  };

  const handlePickupSignature = (data: string) => {
    setForm((prev) => ({ ...prev, pickup_signature: data }));
  };
  const handleDeliverySignature = (data: string) => {
    setForm((prev) => ({ ...prev, delivery_signature: data }));
  };
  const handleReceiverSignature = (data: string) => {
    setForm((prev) => ({ ...prev, receiver_signature: data }));
  };

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all required fields
    const errors: Record<string, string> = {};
    if (!form.work_order_no) errors.work_order_no = 'Work order number is required';
    if (!form.date) errors.date = 'Date is required';
    if (!form.driver_name) errors.driver_name = 'Driver name is required';
    
    if (workOrderError) {
      errors.work_order_no = workOrderError;
    }
    
    setFieldErrors(errors);
    setTouchedFields({
      work_order_no: true,
      date: true,
      driver_name: true,
    });
    
    if (Object.keys(errors).length > 0 || workOrderError) {
      toast.error('Please fix the errors before submitting');
      return;
    }
    
    try {
      const payload = {
        ...form,
        vehicles,
        condition_codes: form.condition_codes.join(','),
        total_amount: totalAmount,
      };
      await api.post('/bol/', payload);
      toast.success('Bill of Lading saved successfully!');
      setTimeout(() => router.push('/dashboard'), 1200);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message;
      toast.error('Error: ' + errorMsg);
      
      // Parse validation errors from backend
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          const validationErrors: Record<string, string> = {};
          detail.forEach((error: any) => {
            if (error.loc && error.loc.length > 1) {
              validationErrors[error.loc[1]] = error.msg;
            }
          });
          setFieldErrors(prev => ({ ...prev, ...validationErrors }));
        }
      }
    }
  };

  const conditionCodes = [
    { code: "B", label: "Bent" },
    { code: "C", label: "Choice" },
    { code: "D", label: "Dented" },
    { code: "E", label: "Defective" },
    { code: "F", label: "Scuffed" },
    { code: "G", label: "Gouged" },
    { code: "J", label: "Cut" },
    { code: "K", label: "Cracked" },
    { code: "L", label: "Loose" },
    { code: "M", label: "Mission" },
    { code: "P", label: "Painted over" },
    { code: "Q", label: "Paint defect" },
    { code: "O", label: "Hall damage" },
    { code: "R", label: "Punctured" },
    { code: "S", label: "Scratched" },
    { code: "T", label: "Torn" },
    { code: "W", label: "Wavy" },
    { code: "V", label: "Present" },
    { code: "Z", label: "Other" },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white dark:bg-gray-800 shadow-xl rounded-2xl mt-4 sm:mt-8 mb-4 sm:mb-8 border border-blue-100 dark:border-gray-700">
      <FormHeader />
      
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-2 text-blue-700 dark:text-blue-400 tracking-tight flex items-center gap-2">
          <DocumentTextIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 dark:text-blue-400" /> Bill of Lading
        </h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Fill out the form below to create a new Bill of Lading.</p>
      </div>

      {/* Form Progress Indicator */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-gray-600">
        <FormProgress 
          currentStep={currentStep} 
          totalSteps={totalSteps} 
          steps={steps}
        />
      </div>

      {/* Total Amount Display */}
      <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-gray-600 flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Amount:</span>
          <span className="text-2xl sm:text-3xl font-bold text-green-700 dark:text-green-400 ml-3">${totalAmount.toFixed(2)}</span>
        </div>
        {vehicles.length > 0 && vehicles.some(v => v.price) && (
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {vehicles.filter(v => v.price).length} vehicle{vehicles.filter(v => v.price).length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Section */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 sm:p-6 border border-blue-100 dark:border-gray-600">
          <SectionHeader icon={DocumentTextIcon} title="Basic Information" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FieldValidation
              error={fieldErrors.driver_name}
              touched={touchedFields.driver_name}
              required
            >
              <DriverSelect
                value={form.driver_name}
                onChange={handleDriverChange}
                required
                error={fieldErrors.driver_name}
                touched={touchedFields.driver_name}
              />
            </FieldValidation>
            
            <FieldValidation
              error={fieldErrors.date}
              touched={touchedFields.date}
              required
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-1 flex items-center gap-1">
                  <CalendarDaysIcon className="h-4 w-4 text-blue-400" />
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  onBlur={() => setTouchedFields(prev => ({ ...prev, date: true }))}
                  className={`input ${fieldErrors.date && touchedFields.date ? 'border-red-500' : ''}`}
                  required
                />
              </div>
            </FieldValidation>
            
            <FieldValidation
              error={fieldErrors.work_order_no}
              touched={touchedFields.work_order_no}
              required
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-1 flex items-center gap-1">
                  <PencilSquareIcon className="h-4 w-4 text-blue-400" />
                  Work Order No. <span className="text-red-500">*</span>
                </label>
                <input
                  name="work_order_no"
                  value={form.work_order_no}
                  onChange={handleChange}
                  onBlur={() => setTouchedFields(prev => ({ ...prev, work_order_no: true }))}
                  className={`input ${fieldErrors.work_order_no && touchedFields.work_order_no ? 'border-red-500' : ''}`}
                  required
                  placeholder="Enter work order number"
                />
                {checkingWorkOrder && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">Checking uniqueness...</span>
                )}
              </div>
            </FieldValidation>
          </div>
        </div>

        {/* Broker Information - Collapsible */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 sm:p-6 border border-green-100 dark:border-gray-600">
          <SectionHeader
            icon={BuildingOffice2Icon}
            title="Broker Information"
            isCollapsed={collapsedSections.broker}
            onToggle={() => toggleSection('broker')}
          />
          {!collapsedSections.broker && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-1 flex items-center gap-1">
                  <BuildingOffice2Icon className="h-4 w-4 text-green-400" />
                  Broker Name
                </label>
                <input
                  name="broker_name"
                  value={form.broker_name}
                  onChange={handleChange}
                  className="input"
                  placeholder="Enter broker name"
                  style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-1 flex items-center gap-1">
                  <BuildingOffice2Icon className="h-4 w-4 text-green-400" />
                  Broker Address
                </label>
                <input
                  name="broker_address"
                  value={form.broker_address}
                  onChange={handleChange}
                  className="input"
                  placeholder="Enter broker address"
                  style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-1 flex items-center gap-1">
                  <PhoneIcon className="h-4 w-4 text-green-400" />
                  Broker Phone
                </label>
                <input
                  name="broker_phone"
                  value={form.broker_phone}
                  onChange={handleChange}
                  className="input"
                  placeholder="Enter broker phone"
                  type="tel"
                />
              </div>
            </div>
          )}
        </div>

        {/* Pickup & Delivery - Collapsible */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="border border-blue-100 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
            <SectionHeader
              icon={BuildingOffice2Icon}
              title="Pick Up"
              isCollapsed={collapsedSections.pickup}
              onToggle={() => toggleSection('pickup')}
            />
            {!collapsedSections.pickup && (
              <div className="space-y-2">
                <FieldValidation
                  error={fieldErrors.pickup_name}
                  touched={touchedFields.pickup_name}
                >
                  <input
                    name="pickup_name"
                    placeholder="Name"
                    value={form.pickup_name}
                    onChange={handleChange}
                    onBlur={() => setTouchedFields(prev => ({ ...prev, pickup_name: true }))}
                    className={`input mb-1 ${fieldErrors.pickup_name && touchedFields.pickup_name ? 'border-red-500' : ''}`}
                    style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                  />
                </FieldValidation>
                <input
                  name="pickup_address"
                  placeholder="Address"
                  value={form.pickup_address}
                  onChange={handleChange}
                  className="input mb-1"
                  style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-1">
                  <input
                    name="pickup_city"
                    placeholder="City"
                    value={form.pickup_city}
                    onChange={handleChange}
                    className="input min-w-0"
                    style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                  />
                  <input
                    name="pickup_state"
                    placeholder="State"
                    value={form.pickup_state}
                    onChange={handleChange}
                    className="input min-w-0"
                    style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                  />
                  <input
                    name="pickup_zip"
                    placeholder="Zip"
                    value={form.pickup_zip}
                    onChange={handleChange}
                    className="input min-w-0"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <PhoneIcon className="h-4 w-4 text-blue-400" />
                  <input
                    name="pickup_phone"
                    placeholder="Phone"
                    value={form.pickup_phone}
                    onChange={handleChange}
                    className="input flex-1"
                    type="tel"
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="border border-blue-100 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
            <SectionHeader
              icon={BuildingOffice2Icon}
              title="Delivery"
              isCollapsed={collapsedSections.delivery}
              onToggle={() => toggleSection('delivery')}
            />
            {!collapsedSections.delivery && (
              <div className="space-y-2">
                <FieldValidation
                  error={fieldErrors.delivery_name}
                  touched={touchedFields.delivery_name}
                >
                  <input
                    name="delivery_name"
                    placeholder="Name"
                    value={form.delivery_name}
                    onChange={handleChange}
                    onBlur={() => setTouchedFields(prev => ({ ...prev, delivery_name: true }))}
                    className={`input mb-1 ${fieldErrors.delivery_name && touchedFields.delivery_name ? 'border-red-500' : ''}`}
                    style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                  />
                </FieldValidation>
                <input
                  name="delivery_address"
                  placeholder="Address"
                  value={form.delivery_address}
                  onChange={handleChange}
                  className="input mb-1"
                  style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-1">
                  <input
                    name="delivery_city"
                    placeholder="City"
                    value={form.delivery_city}
                    onChange={handleChange}
                    className="input min-w-0"
                    style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                  />
                  <input
                    name="delivery_state"
                    placeholder="State"
                    value={form.delivery_state}
                    onChange={handleChange}
                    className="input min-w-0"
                    style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                  />
                  <input
                    name="delivery_zip"
                    placeholder="Zip"
                    value={form.delivery_zip}
                    onChange={handleChange}
                    className="input min-w-0"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <PhoneIcon className="h-4 w-4 text-blue-400" />
                  <input
                    name="delivery_phone"
                    placeholder="Phone"
                    value={form.delivery_phone}
                    onChange={handleChange}
                    className="input flex-1"
                    type="tel"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vehicles - Collapsible */}
        <div className="border border-blue-100 dark:border-gray-600 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
          <SectionHeader
            icon={TruckIcon}
            title="Vehicles"
            isCollapsed={collapsedSections.vehicles}
            onToggle={() => toggleSection('vehicles')}
          />
          {!collapsedSections.vehicles && (
            <>
              {/* Desktop/tablet table view */}
              <div className="overflow-x-auto -mx-4 hidden md:block">
                <table className="min-w-[700px] border mb-2 text-sm mx-4">
                  <thead>
                    <tr className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200">
                      <th className="border px-2 py-1">Year</th>
                      <th className="border px-2 py-1">Make</th>
                      <th className="border px-2 py-1">Model</th>
                      <th className="border px-2 py-1">VIN</th>
                      <th className="border px-2 py-1">Mileage</th>
                      <th className="border px-2 py-1">Price</th>
                      <th className="border px-2 py-1">Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map((v, idx) => (
                      <tr key={idx} className="hover:bg-blue-50 dark:hover:bg-blue-900/30">
                        <td className="border px-2 py-1">
                          <input
                            name="year"
                            value={v.year}
                            onChange={e => handleVehicleChange(idx, e)}
                            className="input w-full"
                            style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                          />
                        </td>
                        <td className="border px-2 py-1">
                          <input
                            name="make"
                            value={v.make}
                            onChange={e => handleVehicleChange(idx, e)}
                            className="input w-full"
                            style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                          />
                        </td>
                        <td className="border px-2 py-1">
                          <input
                            name="model"
                            value={v.model}
                            onChange={e => handleVehicleChange(idx, e)}
                            className="input w-full"
                            style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                          />
                        </td>
                        <td className="border px-2 py-1">
                          <input
                            name="vin"
                            value={v.vin}
                            onChange={e => handleVehicleChange(idx, e)}
                            className="input w-full"
                            style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                          />
                        </td>
                        <td className="border px-2 py-1">
                          <input
                            name="mileage"
                            value={v.mileage}
                            onChange={e => handleVehicleChange(idx, e)}
                            className="input w-full"
                          />
                        </td>
                        <td className="border px-2 py-1">
                          <input
                            name="price"
                            value={v.price}
                            onChange={e => handleVehicleChange(idx, e)}
                            className="input w-full"
                            type="number"
                            step="0.01"
                          />
                        </td>
                        <td className="border px-2 py-1 text-center">
                          {vehicles.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeVehicle(idx)}
                              className="text-red-500 dark:text-red-400 font-bold hover:text-red-700 dark:hover:text-red-300 transition-colors"
                            >
                              X
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile stacked card view */}
              <div className="block md:hidden space-y-4">
                {vehicles.map((v, idx) => (
                  <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 border border-blue-100 dark:border-gray-600">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Year</label>
                        <input
                          name="year"
                          value={v.year}
                          onChange={e => handleVehicleChange(idx, e)}
                          className="input w-full"
                          style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Make</label>
                        <input
                          name="make"
                          value={v.make}
                          onChange={e => handleVehicleChange(idx, e)}
                          className="input w-full"
                          style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Model</label>
                        <input
                          name="model"
                          value={v.model}
                          onChange={e => handleVehicleChange(idx, e)}
                          className="input w-full"
                          style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">VIN</label>
                        <input
                          name="vin"
                          value={v.vin}
                          onChange={e => handleVehicleChange(idx, e)}
                          className="input w-full"
                          style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Mileage</label>
                        <input
                          name="mileage"
                          value={v.mileage}
                          onChange={e => handleVehicleChange(idx, e)}
                          className="input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Price</label>
                        <input
                          name="price"
                          value={v.price}
                          onChange={e => handleVehicleChange(idx, e)}
                          className="input w-full"
                          type="number"
                          step="0.01"
                        />
                      </div>
                    </div>
                    {vehicles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVehicle(idx)}
                        className="text-red-500 dark:text-red-400 font-bold text-sm hover:text-red-700 dark:hover:text-red-300 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addVehicle}
                className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition mt-2 text-sm font-medium"
              >
                + Add Vehicle
              </button>
            </>
          )}
        </div>

        {/* Condition Codes - Collapsible */}
        <div className="border border-blue-100 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
          <SectionHeader
            icon={DocumentTextIcon}
            title="Condition Codes"
            isCollapsed={collapsedSections.conditionCodes}
            onToggle={() => toggleSection('conditionCodes')}
          />
          {!collapsedSections.conditionCodes && (
            <div className="flex flex-wrap gap-3">
              {conditionCodes.map(({ code, label }) => (
                <label key={code} className="flex items-center gap-1 text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 p-2 rounded transition-colors">
                  <input
                    type="checkbox"
                    checked={form.condition_codes.includes(code)}
                    onChange={() => handleConditionCode(code)}
                    className="accent-blue-600"
                  />
                  <span className="font-medium">{code}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Remarks - Collapsible */}
        <div className="border border-blue-100 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
          <SectionHeader
            icon={PencilSquareIcon}
            title="Remarks"
            isCollapsed={collapsedSections.remarks}
            onToggle={() => toggleSection('remarks')}
          />
          {!collapsedSections.remarks && (
            <textarea
              name="remarks"
              value={form.remarks}
              onChange={handleChange}
              className="input w-full min-h-[80px] resize-y"
              placeholder="Enter any remarks here..."
              style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
            />
          )}
        </div>

        {/* Signatures & Dates - Collapsible */}
        <div className="border border-blue-100 dark:border-gray-600 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
          <SectionHeader
            icon={UserIcon}
            title="Signatures & Dates"
            isCollapsed={collapsedSections.signatures}
            onToggle={() => toggleSection('signatures')}
          />
          {!collapsedSections.signatures && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Pick Up Agent</h3>
                  <input
                    name="pickup_agent_name"
                    placeholder="Agent Name"
                    value={form.pickup_agent_name}
                    onChange={handleChange}
                    className="input mb-2"
                    style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                  />
                  <input
                    type="date"
                    name="pickup_date"
                    value={form.pickup_date}
                    onChange={handleChange}
                    className="input mb-2"
                  />
                  <div className="overflow-x-auto max-w-full">
                    <SignaturePad
                      value={form.pickup_signature}
                      onChange={handlePickupSignature}
                      label="Pickup Signature"
                    />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Delivery Agent</h3>
                  <input
                    name="delivery_agent_name"
                    placeholder="Agent Name"
                    value={form.delivery_agent_name}
                    onChange={handleChange}
                    className="input mb-2"
                    style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                  />
                  <input
                    type="date"
                    name="delivery_date"
                    value={form.delivery_date}
                    onChange={handleChange}
                    className="input mb-2"
                  />
                  <div className="overflow-x-auto max-w-full">
                    <SignaturePad
                      value={form.delivery_signature}
                      onChange={handleDeliverySignature}
                      label="Delivery Signature"
                    />
                  </div>
                </div>
              </div>
              {/* Receiver Agent Section */}
              <div className="border-t border-blue-200 dark:border-gray-600 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Receiver Agent</h3>
                <input
                  name="receiver_agent_name"
                  placeholder="Agent Name"
                  value={form.receiver_agent_name}
                  onChange={handleChange}
                  className="input mb-2"
                  style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                />
                <input
                  type="date"
                  name="receiver_date"
                  value={form.receiver_date}
                  onChange={handleChange}
                  className="input mb-2"
                />
                <div className="overflow-x-auto max-w-full">
                  <SignaturePad
                    value={form.receiver_signature}
                    onChange={handleReceiverSignature}
                    label="Receiver Signature"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all text-base sm:text-lg"
          >
            Save Bill of Lading
          </button>
        </div>
      </form>
      <style jsx>{`
        .input {
          @apply border rounded px-3 py-2 w-full mb-1 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm sm:text-base;
          word-wrap: break-word;
          overflow-wrap: break-word;
          white-space: normal;
          border-color: rgb(191 219 254);
          background-color: white;
          color: rgb(17 24 39);
        }
        .input::placeholder {
          color: rgb(107 114 128);
        }
        :global(.dark) .input {
          border-color: rgb(75 85 99);
          background-color: rgb(31 41 55);
          color: rgb(243 244 246);
        }
        :global(.dark) .input::placeholder {
          color: rgb(156 163 175);
        }
        .sigCanvas {
          background: #f9fafb;
          border-radius: 0.25rem;
        }
        :global(.dark) .sigCanvas {
          background: #374151;
        }
        textarea.input {
          resize: vertical;
          min-height: 80px;
        }
      `}</style>
    </div>
  );
}
