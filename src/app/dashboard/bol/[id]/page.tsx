"use client";

import React, { useState, useEffect } from "react";
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  UserIcon,
  TruckIcon,
  BuildingOffice2Icon,
  PhoneIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { useRouter, useParams } from 'next/navigation';
import { useAccessControl } from "@/hooks/useAccessControl";
import { bolService } from "@/services/transaction";
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

  // Pickup Section
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

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

  // Delivery Section
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

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

  // Vehicles Section
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  const vehicleTableHeight = Math.max(30, (bol.vehicles.length + 1) * 8);
  doc.setDrawColor(59, 130, 246);
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(14, y, 182, vehicleTableHeight + 10, 3, 3, 'FD');
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Vehicles', 20, y);
  y += 2;

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

  // Condition Codes Section
  if (bol.condition_codes) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
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

  // Remarks Section
  if (bol.remarks) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
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

  // Signatures Section
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

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

export default function BOLDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bolId = params.id as string;
  const { hasAccess, isSuperuser } = useAccessControl();
  
  const [bol, setBol] = useState<BillOfLading | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBOL = async () => {
      try {
        setLoading(true);
        const bolData = await bolService.getBOL(parseInt(bolId));
        setBol(bolData);
      } catch (err: any) {
        console.error('Error loading BOL:', err);
        setError('Failed to load BOL data');
        toast.error('Failed to load BOL data');
      } finally {
        setLoading(false);
      }
    };
    
    if (bolId) {
      loadBOL();
    }
  }, [bolId]);

  const handleDelete = async () => {
    if (!bol) return;
    
    if (!window.confirm(`Are you sure you want to delete BOL #${bol.id} (Work Order: ${bol.work_order_no})? This action cannot be undone.`)) {
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-8 mb-8 border border-blue-100">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <div className="text-xl font-semibold text-gray-700 mb-2">Loading BOL Details</div>
          <div className="text-sm text-gray-500">Please wait while we load the BOL information...</div>
        </div>
      </div>
    );
  }

  if (error || !bol) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-8 mb-8 border border-red-100">
        <div className="text-center py-12">
          <div className="text-red-600 text-lg font-semibold mb-2">Error Loading BOL</div>
          <div className="text-gray-600 mb-4">{error || 'BOL not found'}</div>
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

  const isFullyPaid = (bol.due_amount || 0) <= 0;
  const hasPartialPayment = (bol.total_collected || 0) > 0;
  const hasTransactions = (bol.total_collected || 0) > 0;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-8 mb-8 border border-blue-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back
          </button>
          <h1 className="text-3xl font-extrabold text-blue-700 tracking-tight flex items-center gap-2">
            <DocumentTextIcon className="h-8 w-8 text-blue-500" /> BOL #{bol.id}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadBOLPdf(bol)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Download PDF
          </button>
          {isSuperuser && (
            <>
              <button
                onClick={() => router.push(`/dashboard/bol/edit/${bol.id}`)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              >
                <PencilIcon className="h-5 w-5" />
                Edit
              </button>
              {!hasTransactions && (
                <button
                  onClick={handleDelete}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                >
                  <TrashIcon className="h-5 w-5" />
                  Delete
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-6">
        {isFullyPaid ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            Fully Paid
          </span>
        ) : hasPartialPayment ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            Partially Paid
          </span>
        ) : (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            Pending Payment
          </span>
        )}
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <UserIcon className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Driver</h3>
          </div>
          <p className="text-gray-700">{bol.driver_name}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Date</h3>
          </div>
          <p className="text-gray-700">{formatDate(bol.date)}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <DocumentTextIcon className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Work Order</h3>
          </div>
          <p className="text-gray-700">{bol.work_order_no || 'N/A'}</p>
        </div>
      </div>

      {/* Payment Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-gray-800">Total Amount</h3>
          </div>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(bol.total_amount)}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <CurrencyDollarIcon className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Amount Collected</h3>
          </div>
          <p className="text-2xl font-bold text-blue-700">{formatCurrency(bol.total_collected)}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <CurrencyDollarIcon className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-gray-800">Amount Due</h3>
          </div>
          <p className="text-2xl font-bold text-red-700">{formatCurrency(bol.due_amount)}</p>
        </div>
      </div>

      {/* Broker Information */}
      {(bol.broker_name || bol.broker_address || bol.broker_phone) && (
        <div className="bg-green-50 rounded-lg p-6 border border-green-200 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <BuildingOffice2Icon className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-800">Broker Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-gray-700">Name</h4>
              <p className="text-gray-600">{bol.broker_name || 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700">Address</h4>
              <p className="text-gray-600">{bol.broker_address || 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700">Phone</h4>
              <p className="text-gray-600">{bol.broker_phone || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Pickup & Delivery */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <BuildingOffice2Icon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">Pickup Location</h2>
          </div>
          <div className="space-y-2">
            <div>
              <h4 className="font-medium text-gray-700">Name</h4>
              <p className="text-gray-600">{bol.pickup_name || 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700">Address</h4>
              <p className="text-gray-600">{bol.pickup_address || 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700">City, State, Zip</h4>
              <p className="text-gray-600">{bol.pickup_city}, {bol.pickup_state} {bol.pickup_zip}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700">Phone</h4>
              <p className="text-gray-600">{bol.pickup_phone || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <BuildingOffice2Icon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">Delivery Location</h2>
          </div>
          <div className="space-y-2">
            <div>
              <h4 className="font-medium text-gray-700">Name</h4>
              <p className="text-gray-600">{bol.delivery_name || 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700">Address</h4>
              <p className="text-gray-600">{bol.delivery_address || 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700">City, State, Zip</h4>
              <p className="text-gray-600">{bol.delivery_city}, {bol.delivery_state} {bol.delivery_zip}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700">Phone</h4>
              <p className="text-gray-600">{bol.delivery_phone || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicles */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <TruckIcon className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">Vehicles ({bol.vehicles.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-blue-100">
                <th className="border px-4 py-2 text-left">Year</th>
                <th className="border px-4 py-2 text-left">Make</th>
                <th className="border px-4 py-2 text-left">Model</th>
                <th className="border px-4 py-2 text-left">VIN</th>
                <th className="border px-4 py-2 text-left">Mileage</th>
                <th className="border px-4 py-2 text-left">Price</th>
              </tr>
            </thead>
            <tbody>
              {bol.vehicles.map((vehicle, index) => (
                <tr key={index} className="hover:bg-blue-50">
                  <td className="border px-4 py-2">{vehicle.year}</td>
                  <td className="border px-4 py-2">{vehicle.make}</td>
                  <td className="border px-4 py-2">{vehicle.model}</td>
                  <td className="border px-4 py-2 font-mono text-sm">{vehicle.vin}</td>
                  <td className="border px-4 py-2">{vehicle.mileage}</td>
                  <td className="border px-4 py-2 font-semibold">{formatCurrency(parseFloat(vehicle.price))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Condition Codes */}
      {bol.condition_codes && (
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <DocumentTextIcon className="h-6 w-6 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-800">Condition Codes</h2>
          </div>
          <p className="text-gray-700">{bol.condition_codes}</p>
        </div>
      )}

      {/* Remarks */}
      {bol.remarks && (
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <DocumentTextIcon className="h-6 w-6 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-800">Remarks</h2>
          </div>
          <p className="text-gray-700">{bol.remarks}</p>
        </div>
      )}

      {/* Signatures */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {bol.pickup_agent_name && (
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center gap-2 mb-4">
              <UserIcon className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">Pickup Agent</h2>
            </div>
            <div className="space-y-2">
              <div>
                <h4 className="font-medium text-gray-700">Name</h4>
                <p className="text-gray-600">{bol.pickup_agent_name}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700">Date</h4>
                <p className="text-gray-600">{formatDate(bol.pickup_date)}</p>
              </div>
              {bol.pickup_signature && (
                <div>
                  <h4 className="font-medium text-gray-700">Signature</h4>
                  <img src={bol.pickup_signature} alt="Pickup signature" className="border rounded bg-white" style={{ width: 150, height: 50 }} />
                </div>
              )}
            </div>
          </div>
        )}

        {bol.delivery_agent_name && (
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center gap-2 mb-4">
              <UserIcon className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">Delivery Agent</h2>
            </div>
            <div className="space-y-2">
              <div>
                <h4 className="font-medium text-gray-700">Name</h4>
                <p className="text-gray-600">{bol.delivery_agent_name}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700">Date</h4>
                <p className="text-gray-600">{formatDate(bol.delivery_date)}</p>
              </div>
              {bol.delivery_signature && (
                <div>
                  <h4 className="font-medium text-gray-700">Signature</h4>
                  <img src={bol.delivery_signature} alt="Delivery signature" className="border rounded bg-white" style={{ width: 150, height: 50 }} />
                </div>
              )}
            </div>
          </div>
        )}

        {bol.receiver_agent_name && (
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center gap-2 mb-4">
              <UserIcon className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">Receiver Agent</h2>
            </div>
            <div className="space-y-2">
              <div>
                <h4 className="font-medium text-gray-700">Name</h4>
                <p className="text-gray-600">{bol.receiver_agent_name}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700">Date</h4>
                <p className="text-gray-600">{formatDate(bol.receiver_date)}</p>
              </div>
              {bol.receiver_signature && (
                <div>
                  <h4 className="font-medium text-gray-700">Signature</h4>
                  <img src={bol.receiver_signature} alt="Receiver signature" className="border rounded bg-white" style={{ width: 150, height: 50 }} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
