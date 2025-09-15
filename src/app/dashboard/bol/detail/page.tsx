"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftIcon, PencilIcon, TrashIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { bolService } from "@/services/transaction";
import { useAccessControl } from "@/hooks/useAccessControl";
import toast from 'react-hot-toast';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

// Function to load logo as base64
async function loadLogoAsBase64(): Promise<string | null> {
  try {
    const response = await fetch('/logo_ideal.png');
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading logo:', error);
    return null;
  }
}

async function downloadBOLPdf(bol: BillOfLading) {
  const doc = new jsPDF();
  let y = -2;

  // Company Header with Logo and Address on same line
  try {
    const logoBase64 = await loadLogoAsBase64();
    if (logoBase64) {
      doc.addImage(logoBase64, 'JPEG', 5, y, 80, 40);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Ideal Transportation Solutions LLC', 85, y + 12, { align: 'left' });
      y += 12;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('16 Palmero Way, Manvel, Texas 77578', 85, y + 8, { align: 'left' });
      y += 8;
      doc.text('USDOT NO: 4193929', 85, y + 8, { align: 'left' });
      y += 25;
    } else {
      // Fallback without logo
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Ideal Transportation Solutions LLC', 105, y, { align: 'center' });
      y += 6;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('16 Palmero Way, Manvel, Texas 77578', 105, y, { align: 'center' });
      y += 6;
      doc.text('USDOT NO: 4193929', 105, y, { align: 'center' });
      y += 8;
    }
  } catch (err) {
    console.error('Error loading logo:', err);
    // Fallback without logo
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Ideal Transportation Solutions LLC', 105, y, { align: 'center' });
    y += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('16 Palmero Way, Manvel, Texas 77578', 105, y, { align: 'center' });
    y += 6;
    doc.text('USDOT NO: 4193929', 105, y, { align: 'center' });
    y += 8;
  }

  // Divider line
  doc.setDrawColor(200, 200, 200);
  doc.line(14, y, 196, y);
  y += 10;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill of Lading', 105, y, { align: 'center' });
  y += 15;

  // Report Details Box
  doc.setDrawColor(59, 130, 246);
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(14, y, 182, 25, 3, 3, 'FD');
  y += 8;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Driver: ' + String(bol.driver_name ?? ''), 20, y);
  doc.text('Date: ' + String(formatDate(bol.date) ?? ''), 120, y);
  y += 8;
  doc.text('Work Order No: ' + String(bol.work_order_no ?? ''), 20, y);
  doc.text('Generated: ' + new Date().toLocaleDateString(), 120, y);
  y += 8;

  // Add broker information if available
  if (bol.broker_name || bol.broker_address || bol.broker_phone) {
    doc.text('Broker: ' + String(bol.broker_name ?? ''), 20, y);
    doc.text('Phone: ' + String(bol.broker_phone ?? ''), 120, y);
    y += 6;
    if (bol.broker_address) {
      doc.text('Address: ' + String(bol.broker_address), 20, y);
      y += 6;
    }
  }
  y += 15;

  // Check page overflow before Pickup Section
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  // Pickup Section
  doc.setDrawColor(59, 130, 246);
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(14, y, 182, 45, 3, 3, 'FD');
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Pick Up', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text('Name: ' + String(bol.pickup_name ?? ''), 25, y);
  doc.text('Phone: ' + String(bol.pickup_phone ?? ''), 100, y);
  y += 6;
  doc.text('Address: ' + String(bol.pickup_address ?? ''), 25, y);
  y += 6;
  doc.text('City: ' + String(bol.pickup_city ?? '') + '  State: ' + String(bol.pickup_state ?? '') + '  Zip: ' + String(bol.pickup_zip ?? ''), 25, y);
  y += 20;

  // Check page overflow before Delivery Section
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  // Delivery Section
  doc.setDrawColor(59, 130, 246);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 182, 45, 3, 3, 'FD');
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Delivery', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text('Name: ' + String(bol.delivery_name ?? ''), 25, y);
  doc.text('Phone: ' + String(bol.delivery_phone ?? ''), 100, y);
  y += 6;
  doc.text('Address: ' + String(bol.delivery_address ?? ''), 25, y);
  y += 6;
  doc.text('City: ' + String(bol.delivery_city ?? '') + '  State: ' + String(bol.delivery_state ?? '') + '  Zip: ' + String(bol.delivery_zip ?? ''), 25, y);
  y += 20;

  // Check page overflow before Vehicles Section
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  // Vehicles Section
  const vehicleTableHeight = Math.max(30, (bol.vehicles.length + 1) * 8);
  doc.setDrawColor(59, 130, 246);
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(14, y, 182, vehicleTableHeight + 10, 3, 3, 'FD');
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Vehicles', 20, y);
  y += 2;

  // Check if we need a new page for the vehicle table
  const estimatedTableHeight = (bol.vehicles.length + 1) * 8;
  if (y + estimatedTableHeight > 270) {
    doc.addPage();
    y = 20;
    doc.setDrawColor(59, 130, 246);
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(14, y, 182, vehicleTableHeight + 10, 3, 3, 'FD');
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Vehicles', 20, y);
    y += 2;
  }

  autoTable(doc, {
    startY: y,
    head: [['Year', 'Make', 'Model', 'VIN', 'Mileage', 'Price']],
    body: bol.vehicles.map((v) => [v.year, v.make, v.model, v.vin, v.mileage, v.price]),
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 9 },
    margin: { left: 20, right: 20 },
    didDrawPage: function (data) {
      doc.setFontSize(8);
      doc.text('Page ' + doc.getCurrentPageInfo().pageNumber, 105, 280, { align: 'center' });
    }
  });
  y = (doc as any).lastAutoTable.finalY + 15;

  // Check page overflow before Condition Codes Section
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  // Condition Codes Section
  if (bol.condition_codes) {
    doc.setDrawColor(59, 130, 246);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y, 182, 25, 3, 3, 'FD');
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Condition Codes', 20, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.text(String(bol.condition_codes ?? ''), 25, y);
    y += 15;
  }

  // Check page overflow before Remarks Section
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  // Remarks Section
  if (bol.remarks) {
    doc.setDrawColor(59, 130, 246);
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(14, y, 182, 30, 3, 3, 'FD');
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Remarks', 20, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.text(String(bol.remarks ?? ''), 25, y, { maxWidth: 160 });
    y += 15;
  }

  // Check page overflow before Signatures Section
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  // Signatures Section
  const signatureBoxHeight = 70 + (bol.receiver_agent_name || bol.receiver_signature || bol.receiver_date ? 40 : 0);
  doc.setDrawColor(59, 130, 246);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 182, signatureBoxHeight, 3, 3, 'FD');
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Signatures', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text('Pickup Agent: ' + String(bol.pickup_agent_name ?? ''), 25, y);
  doc.text('Date: ' + String(formatDate(bol.pickup_date) ?? ''), 100, y);
  y += 2;
  if (bol.pickup_signature && typeof bol.pickup_signature === 'string') {
    try {
      const base64Data = bol.pickup_signature.split(',')[1] || bol.pickup_signature;
      doc.addImage(base64Data, 'PNG', 25, y + 2, 40, 16);
    } catch (err) {
      console.error('Error adding pickup signature:', err);
    }
  }
  y += 25;
  doc.text('Delivery Agent: ' + String(bol.delivery_agent_name ?? ''), 25, y);
  doc.text('Date: ' + String(formatDate(bol.delivery_date) ?? ''), 100, y);
  y += 2;
  if (bol.delivery_signature && typeof bol.delivery_signature === 'string') {
    try {
      const base64Data = bol.delivery_signature.split(',')[1] || bol.delivery_signature;
      doc.addImage(base64Data, 'PNG', 25, y + 2, 40, 16);
    } catch (err) {
      console.error('Error adding delivery signature:', err);
    }
  }
  y += 25;
  if (bol.receiver_agent_name || bol.receiver_signature || bol.receiver_date) {
    doc.text('Receiver Agent: ' + String(bol.receiver_agent_name ?? ''), 25, y);
    doc.text('Date: ' + String(formatDate(bol.receiver_date) ?? ''), 100, y);
    y += 2;
    if (bol.receiver_signature && typeof bol.receiver_signature === 'string') {
      try {
        const base64Data = bol.receiver_signature.split(',')[1] || bol.receiver_signature;
        doc.addImage(base64Data, 'PNG', 25, y + 2, 40, 16);
      } catch (err) {
        console.error('Error adding receiver signature:', err);
      }
    }
    y += 25;
  }

  // Footer
  doc.setDrawColor(200, 200, 200);
  doc.line(14, y, 196, y);
  y += 8;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('This report was generated by Ideal Transportation Solutions LLC', 105, y, { align: 'center' });

  doc.save(`BillOfLading_${bol.id}.pdf`);
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
