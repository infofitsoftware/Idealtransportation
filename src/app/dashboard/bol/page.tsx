"use client";

import React, { useState, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import {
  UserIcon,
  TruckIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  CalendarDaysIcon,
  PhoneIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/outline";

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

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-2 mt-8">
      <Icon className="h-6 w-6 text-blue-600" />
      <h2 className="text-lg font-semibold text-gray-800 tracking-tight">{title}</h2>
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
      <label className="block font-medium mb-1 text-gray-700">{label}</label>
      <div className="border-2 border-blue-200 rounded bg-gray-50" style={{ width: 300, height: 100 }}>
        <SignatureCanvas
          ref={sigRef}
          penColor="#2563eb"
          canvasProps={{ width: 300, height: 100, className: "sigCanvas" }}
          onEnd={handleEnd}
          backgroundColor="#f9fafb"
        />
      </div>
      <div className="flex gap-2 mt-1">
        <button type="button" onClick={clear} className="text-sm text-blue-600 underline">Clear</button>
        {value && (
          <span className="text-green-600 text-xs">Signature captured</span>
        )}
      </div>
      {value && (
        <img src={value} alt="Signature preview" className="mt-2 border rounded bg-white" style={{ width: 150, height: 50 }} />
      )}
    </div>
  );
}

export default function BillOfLadingForm() {
  const [form, setForm] = useState({
    driver_name: "",
    date: "",
    work_order_no: "",
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
  });
  const [vehicles, setVehicles] = useState<Vehicle[]>([{ ...initialVehicle }]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        vehicles,
        condition_codes: form.condition_codes.join(','),
      };
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/bol/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save Bill of Lading');
      alert('Bill of Lading saved!');
    } catch (err: any) {
      alert('Error: ' + err.message);
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
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-8 mb-8 border border-blue-100">
      <h1 className="text-3xl font-extrabold mb-2 text-blue-700 tracking-tight flex items-center gap-2">
        <DocumentTextIcon className="h-8 w-8 text-blue-500" /> Bill of Lading
      </h1>
      <p className="text-gray-500 mb-6">Fill out the form below to create a new Bill of Lading.</p>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-blue-50 rounded-lg p-4 border border-blue-100">
          <div>
            <label className="block font-semibold text-gray-700 mb-1 flex items-center gap-1"><UserIcon className="h-5 w-5 text-blue-400" />Driver</label>
            <input name="driver_name" value={form.driver_name} onChange={handleChange} className="input" required />
          </div>
          <div>
            <label className="block font-semibold text-gray-700 mb-1 flex items-center gap-1"><CalendarDaysIcon className="h-5 w-5 text-blue-400" />Date</label>
            <input type="date" name="date" value={form.date} onChange={handleChange} className="input" required />
          </div>
          <div>
            <label className="block font-semibold text-gray-700 mb-1 flex items-center gap-1"><PencilSquareIcon className="h-5 w-5 text-blue-400" />Work Order No.</label>
            <input name="work_order_no" value={form.work_order_no} onChange={handleChange} className="input" />
          </div>
        </div>

        {/* Pickup & Delivery */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-blue-100 rounded-lg p-4 bg-gray-50">
            <SectionHeader icon={BuildingOffice2Icon} title="Pick Up" />
            <input name="pickup_name" placeholder="Name" value={form.pickup_name} onChange={handleChange} className="input mb-1" />
            <input name="pickup_address" placeholder="Address" value={form.pickup_address} onChange={handleChange} className="input mb-1" />
            {/* City/State/Zip Row - Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-1">
              <input name="pickup_city" placeholder="City" value={form.pickup_city} onChange={handleChange} className="input min-w-0" />
              <input name="pickup_state" placeholder="State" value={form.pickup_state} onChange={handleChange} className="input min-w-0" />
              <input name="pickup_zip" placeholder="Zip" value={form.pickup_zip} onChange={handleChange} className="input min-w-0" />
            </div>
            <div className="flex items-center gap-1">
              <PhoneIcon className="h-4 w-4 text-blue-400" />
              <input name="pickup_phone" placeholder="Phone" value={form.pickup_phone} onChange={handleChange} className="input flex-1" />
            </div>
          </div>
          <div className="border border-blue-100 rounded-lg p-4 bg-gray-50">
            <SectionHeader icon={BuildingOffice2Icon} title="Delivery" />
            <input name="delivery_name" placeholder="Name" value={form.delivery_name} onChange={handleChange} className="input mb-1" />
            <input name="delivery_address" placeholder="Address" value={form.delivery_address} onChange={handleChange} className="input mb-1" />
            {/* City/State/Zip Row - Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-1">
              <input name="delivery_city" placeholder="City" value={form.delivery_city} onChange={handleChange} className="input min-w-0" />
              <input name="delivery_state" placeholder="State" value={form.delivery_state} onChange={handleChange} className="input min-w-0" />
              <input name="delivery_zip" placeholder="Zip" value={form.delivery_zip} onChange={handleChange} className="input min-w-0" />
            </div>
            <div className="flex items-center gap-1">
              <PhoneIcon className="h-4 w-4 text-blue-400" />
              <input name="delivery_phone" placeholder="Phone" value={form.delivery_phone} onChange={handleChange} className="input flex-1" />
            </div>
          </div>
        </div>

        {/* Vehicles */}
        <div className="border border-blue-100 rounded-lg p-4 bg-blue-50">
          <SectionHeader icon={TruckIcon} title="Vehicles" />
          <table className="min-w-full border mb-2 text-sm">
            <thead>
              <tr className="bg-blue-100 text-blue-800">
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
                <tr key={idx} className="hover:bg-blue-50">
                  <td className="border px-2 py-1"><input name="year" value={v.year} onChange={e => handleVehicleChange(idx, e)} className="input w-20" /></td>
                  <td className="border px-2 py-1"><input name="make" value={v.make} onChange={e => handleVehicleChange(idx, e)} className="input w-24" /></td>
                  <td className="border px-2 py-1"><input name="model" value={v.model} onChange={e => handleVehicleChange(idx, e)} className="input w-24" /></td>
                  <td className="border px-2 py-1"><input name="vin" value={v.vin} onChange={e => handleVehicleChange(idx, e)} className="input w-32" /></td>
                  <td className="border px-2 py-1"><input name="mileage" value={v.mileage} onChange={e => handleVehicleChange(idx, e)} className="input w-20" /></td>
                  <td className="border px-2 py-1"><input name="price" value={v.price} onChange={e => handleVehicleChange(idx, e)} className="input w-20" /></td>
                  <td className="border px-2 py-1 text-center">
                    {vehicles.length > 1 && (
                      <button type="button" onClick={() => removeVehicle(idx)} className="text-red-500 font-bold">X</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" onClick={addVehicle} className="bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-700 transition">Add Vehicle</button>
        </div>

        {/* Condition Codes */}
        <div className="border border-blue-100 rounded-lg p-4 bg-gray-50">
          <SectionHeader icon={DocumentTextIcon} title="Condition Codes" />
          <div className="flex flex-wrap gap-3">
            {conditionCodes.map(({ code, label }) => (
              <label key={code} className="flex items-center gap-1 text-gray-700">
                <input
                  type="checkbox"
                  checked={form.condition_codes.includes(code)}
                  onChange={() => handleConditionCode(code)}
                  className="accent-blue-600"
                />
                <span className="font-medium">{code}</span>
                <span className="text-xs text-gray-400">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Remarks */}
        <div className="border border-blue-100 rounded-lg p-4 bg-gray-50">
          <SectionHeader icon={PencilSquareIcon} title="Remarks" />
          <textarea name="remarks" value={form.remarks} onChange={handleChange} className="input w-full min-h-[60px]" placeholder="Enter any remarks here..." />
        </div>

        {/* Signatures & Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-blue-100 rounded-lg p-4 bg-blue-50">
            <SectionHeader icon={UserIcon} title="Pick Up Agent" />
            <input name="pickup_agent_name" placeholder="Agent Name" value={form.pickup_agent_name} onChange={handleChange} className="input mb-1" />
            <input type="date" name="pickup_date" value={form.pickup_date} onChange={handleChange} className="input mb-1" />
            <SignaturePad
              value={form.pickup_signature}
              onChange={handlePickupSignature}
              label="Pickup Signature (sign below)"
            />
          </div>
          <div className="border border-blue-100 rounded-lg p-4 bg-blue-50">
            <SectionHeader icon={UserIcon} title="Delivery Agent" />
            <input name="delivery_agent_name" placeholder="Agent Name" value={form.delivery_agent_name} onChange={handleChange} className="input mb-1" />
            <input type="date" name="delivery_date" value={form.delivery_date} onChange={handleChange} className="input mb-1" />
            <SignaturePad
              value={form.delivery_signature}
              onChange={handleDeliverySignature}
              label="Delivery Signature (sign below)"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="bg-blue-700 text-white px-8 py-2 rounded-lg font-bold shadow hover:bg-blue-800 transition text-lg">
            Save Bill of Lading
          </button>
        </div>
      </form>
      <style jsx>{`
        .input {
          @apply border border-blue-200 rounded px-2 py-1 w-full mb-1 focus:outline-none focus:ring-2 focus:ring-blue-200 transition;
        }
        .sigCanvas {
          background: #f9fafb;
          border-radius: 0.25rem;
        }
      `}</style>
    </div>
  );
} 