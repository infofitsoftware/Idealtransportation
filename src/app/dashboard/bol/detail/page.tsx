"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftIcon, PencilIcon, TrashIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
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

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

function formatCurrency(amount?: number) {
  if (amount === undefined || amount === null) return "$0.00";
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

async function downloadBOLPdf(bol: BillOfLading) {
  try {
    // Use backend API for PDF generation (consistent across all pages)
    const blob = await bolService.downloadBOLPdf(bol.id);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BillOfLading_${bol.work_order_no || bol.id}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading PDF from API, falling back to client-side generation:', error);
    // Fallback to client-side generation if API fails
    const fullBol = await bolService.getBOL(bol.id);
    const { generateBOLPdf } = await import('@/utils/bolPdfGenerator');
    await generateBOLPdf(fullBol);
  }
}


function BOLDetailContent() {
  const { currentUser, loading: accessLoading, hasAccess, isSuperuser } = useAccessControl();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bol, setBol] = useState<BillOfLading | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const bolId = searchParams.get('id');

  useEffect(() => {
    const fetchBOL = async () => {
      if (!bolId || !hasAccess) return;

      try {
        setLoading(true);
        setError("");
        const bolData = await bolService.getBOL(parseInt(bolId));
        setBol(bolData);
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

  const handleEdit = () => {
    router.push(`/dashboard/bol/edit?id=${bolId}`);
  };

  const handleDelete = async () => {
    if (!bol || !window.confirm(`Are you sure you want to delete BOL #${bol.id} (Work Order: ${bol.work_order_no})? This action cannot be undone.`)) {
      return;
    }

    try {
      await bolService.deleteBOL(bol.id);
      toast.success('BOL deleted successfully');
      router.push('/dashboard/reports');
    } catch (err: any) {
      console.error('Error deleting BOL:', err);
      toast.error(err.response?.data?.detail || 'Failed to delete BOL');
    }
  };

  const handleBack = () => {
    router.push('/dashboard/reports');
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

  if (!hasAccess) {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-8 mb-8 border border-red-100">
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-red-700 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page.
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
            onClick={handleBack}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  const isFullyPaid = (bol.due_amount || 0) <= 0;
  const hasPartialPayment = (bol.total_collected || 0) > 0;

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
            Back to Reports
          </button>
          <h1 className="text-3xl font-extrabold text-blue-700 tracking-tight">
            BOL #{bol.id} - {bol.work_order_no || 'No Work Order'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => downloadBOLPdf(bol)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Download PDF
          </button>
          {isSuperuser && (
            <>
              <button
                onClick={handleEdit}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <PencilIcon className="h-5 w-5" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <TrashIcon className="h-5 w-5" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* BOL Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h2>
          <div className="space-y-3">
            <div>
              <span className="font-medium text-gray-700">Driver:</span>
              <span className="ml-2 text-gray-900">{bol.driver_name}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Date:</span>
              <span className="ml-2 text-gray-900">{formatDate(bol.date)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Work Order:</span>
              <span className="ml-2 text-gray-900">{bol.work_order_no || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Total Amount:</span>
              <span className="ml-2 text-blue-600 font-semibold">{formatCurrency(bol.total_amount)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Amount Collected:</span>
              <span className="ml-2 text-green-600 font-semibold">{formatCurrency(bol.total_collected)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Due Amount:</span>
              <span className="ml-2 text-red-600 font-semibold">{formatCurrency(bol.due_amount)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Status:</span>
              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isFullyPaid 
                  ? 'bg-green-100 text-green-800' 
                  : hasPartialPayment 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-red-100 text-red-800'
              }`}>
                {isFullyPaid ? 'Paid' : hasPartialPayment ? 'Partial' : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* Broker Information */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Broker Information</h2>
          <div className="space-y-3">
            <div>
              <span className="font-medium text-gray-700">Name:</span>
              <span className="ml-2 text-gray-900">{bol.broker_name || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Address:</span>
              <span className="ml-2 text-gray-900">{bol.broker_address || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Phone:</span>
              <span className="ml-2 text-gray-900">{bol.broker_phone || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Pickup Information */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Pickup Information</h2>
          <div className="space-y-3">
            <div>
              <span className="font-medium text-gray-700">Name:</span>
              <span className="ml-2 text-gray-900">{bol.pickup_name || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Address:</span>
              <span className="ml-2 text-gray-900">{bol.pickup_address || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">City, State, Zip:</span>
              <span className="ml-2 text-gray-900">
                {bol.pickup_city || 'N/A'}, {bol.pickup_state || 'N/A'} {bol.pickup_zip || 'N/A'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Phone:</span>
              <span className="ml-2 text-gray-900">{bol.pickup_phone || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Delivery Information */}
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Delivery Information</h2>
          <div className="space-y-3">
            <div>
              <span className="font-medium text-gray-700">Name:</span>
              <span className="ml-2 text-gray-900">{bol.delivery_name || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Address:</span>
              <span className="ml-2 text-gray-900">{bol.delivery_address || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">City, State, Zip:</span>
              <span className="ml-2 text-gray-900">
                {bol.delivery_city || 'N/A'}, {bol.delivery_state || 'N/A'} {bol.delivery_zip || 'N/A'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Phone:</span>
              <span className="ml-2 text-gray-900">{bol.delivery_phone || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicles */}
      <div className="mt-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Vehicles ({bol.vehicles.length})</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left">Year</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Make</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Model</th>
                <th className="border border-gray-300 px-4 py-2 text-left">VIN</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Mileage</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Price</th>
              </tr>
            </thead>
            <tbody>
              {bol.vehicles.map((vehicle, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">{vehicle.year}</td>
                  <td className="border border-gray-300 px-4 py-2">{vehicle.make}</td>
                  <td className="border border-gray-300 px-4 py-2">{vehicle.model}</td>
                  <td className="border border-gray-300 px-4 py-2 font-mono text-sm">{vehicle.vin}</td>
                  <td className="border border-gray-300 px-4 py-2">{vehicle.mileage}</td>
                  <td className="border border-gray-300 px-4 py-2 font-semibold text-green-600">{formatCurrency(parseFloat(vehicle.price))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Additional Information */}
      {(bol.condition_codes || bol.remarks) && (
        <div className="mt-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Additional Information</h2>
          {bol.condition_codes && (
            <div className="mb-4">
              <span className="font-medium text-gray-700">Condition Codes:</span>
              <p className="mt-1 text-gray-900">{bol.condition_codes}</p>
            </div>
          )}
          {bol.remarks && (
            <div>
              <span className="font-medium text-gray-700">Remarks:</span>
              <p className="mt-1 text-gray-900">{bol.remarks}</p>
            </div>
          )}
        </div>
      )}

      {/* Signatures */}
      {(bol.pickup_agent_name || bol.delivery_agent_name || bol.receiver_agent_name) && (
        <div className="mt-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Signatures</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {bol.pickup_agent_name && (
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Pickup Agent</h3>
                <p className="text-gray-900">{bol.pickup_agent_name}</p>
                {bol.pickup_date && (
                  <p className="text-sm text-gray-600">Date: {formatDate(bol.pickup_date)}</p>
                )}
                {bol.pickup_signature && (
                  <div className="mt-2">
                    <img 
                      src={bol.pickup_signature} 
                      alt="Pickup Signature" 
                      className="max-w-full h-auto border border-gray-300 rounded"
                    />
                  </div>
                )}
              </div>
            )}
            {bol.delivery_agent_name && (
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Delivery Agent</h3>
                <p className="text-gray-900">{bol.delivery_agent_name}</p>
                {bol.delivery_date && (
                  <p className="text-sm text-gray-600">Date: {formatDate(bol.delivery_date)}</p>
                )}
                {bol.delivery_signature && (
                  <div className="mt-2">
                    <img 
                      src={bol.delivery_signature} 
                      alt="Delivery Signature" 
                      className="max-w-full h-auto border border-gray-300 rounded"
                    />
                  </div>
                )}
              </div>
            )}
            {bol.receiver_agent_name && (
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Receiver Agent</h3>
                <p className="text-gray-900">{bol.receiver_agent_name}</p>
                {bol.receiver_date && (
                  <p className="text-sm text-gray-600">Date: {formatDate(bol.receiver_date)}</p>
                )}
                {bol.receiver_signature && (
                  <div className="mt-2">
                    <img 
                      src={bol.receiver_signature} 
                      alt="Receiver Signature" 
                      className="max-w-full h-auto border border-gray-300 rounded"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BOLDetailPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-8 mb-8 border border-blue-100">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <div className="text-xl font-semibold text-gray-700 mb-2">Loading...</div>
        </div>
      </div>
    }>
      <BOLDetailContent />
    </Suspense>
  );
}
