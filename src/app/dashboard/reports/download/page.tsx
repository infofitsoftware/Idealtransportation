"use client";

import React, { useEffect, useState } from "react";
import { DocumentTextIcon, ArrowDownTrayIcon, ShieldExclamationIcon, XMarkIcon } from "@heroicons/react/24/outline";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { bolService } from "@/services/transaction";
import { useAccessControl } from "@/hooks/useAccessControl";
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

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

export default function BulkDownloadPage() {
  const { currentUser, loading: accessLoading, hasAccess, isSuperuser } = useAccessControl();
  const router = useRouter();
  const [selectedBOLs, setSelectedBOLs] = useState<Set<number>>(new Set());
  const [allBOLs, setAllBOLs] = useState<BillOfLading[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [workOrderFilter, setWorkOrderFilter] = useState('');

  useEffect(() => {
    const fetchBOLs = async () => {
      if (!hasAccess && !accessLoading) return;
      
      try {
        setLoading(true);
        const bols = await bolService.getBOLs({
          skip: 0,
          limit: 1000,
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
          work_order_no: workOrderFilter || undefined,
        });
        setAllBOLs(bols);
      } catch (err: any) {
        console.error('Error fetching BOLs:', err);
        toast.error('Failed to load BOLs');
      } finally {
        setLoading(false);
      }
    };
    
    if (hasAccess || accessLoading) {
      fetchBOLs();
    }
  }, [fromDate, toDate, workOrderFilter, hasAccess, accessLoading]);

  const toggleSelect = (bolId: number) => {
    const newSelected = new Set(selectedBOLs);
    if (newSelected.has(bolId)) {
      newSelected.delete(bolId);
    } else {
      newSelected.add(bolId);
    }
    setSelectedBOLs(newSelected);
  };

  const selectAll = () => {
    if (selectedBOLs.size === allBOLs.length) {
      setSelectedBOLs(new Set());
    } else {
      setSelectedBOLs(new Set(allBOLs.map(bol => bol.id)));
    }
  };

  const downloadSelected = async () => {
    if (selectedBOLs.size === 0) {
      toast.error('Please select at least one BOL to download');
      return;
    }

    setDownloading(true);
    try {
      const selectedBOLList = allBOLs.filter(bol => selectedBOLs.has(bol.id));
      
      for (const bol of selectedBOLList) {
        await downloadBOLPdf(bol);
        // Small delay to prevent browser blocking
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      toast.success(`Downloaded ${selectedBOLs.size} BOL(s) successfully`);
    } catch (err) {
      console.error('Error downloading BOLs:', err);
      toast.error('Failed to download some BOLs');
    } finally {
      setDownloading(false);
    }
  };

  const exportSelectedToExcel = async () => {
    if (selectedBOLs.size === 0) {
      toast.error('Please select at least one BOL to export');
      return;
    }

    setDownloading(true);
    try {
      const selectedBOLList = allBOLs.filter(bol => selectedBOLs.has(bol.id));
      
      const excelData = selectedBOLList.map(bol => ({
        'Driver': bol.driver_name,
        'Date': formatDate(bol.date),
        'Work Order No': bol.work_order_no || 'N/A',
        'Broker Name': bol.broker_name || '',
        'Pickup Name': bol.pickup_name || '',
        'Pickup Address': bol.pickup_address || '',
        'Delivery Name': bol.delivery_name || '',
        'Delivery Address': bol.delivery_address || '',
        'Total Amount': bol.total_amount || 0,
        'Amount Paid': bol.total_collected || 0,
        'Due Amount': bol.due_amount || 0,
        'Vehicle Count': bol.vehicles.length,
        'Vehicles': bol.vehicles.map((v: Vehicle) => `${v.year} ${v.make} ${v.model}`).join('; '),
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(wb, ws, 'BOL Export');
      
      const filename = `BOL_Bulk_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);
      
      toast.success(`Exported ${selectedBOLs.size} BOL(s) to Excel`);
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      toast.error('Failed to export to Excel');
    } finally {
      setDownloading(false);
    }
  };

  if (accessLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-8 mb-8">
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
          <ShieldExclamationIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-700 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-8 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold text-blue-700 tracking-tight flex items-center gap-2">
          <DocumentTextIcon className="h-8 w-8 text-blue-500" /> Bulk Download & Export
        </h1>
        <button
          onClick={() => router.push('/dashboard/reports')}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Filter Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Work Order</label>
            <input
              type="text"
              value={workOrderFilter}
              onChange={(e) => setWorkOrderFilter(e.target.value)}
              placeholder="Search work order..."
              className="block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => { setFromDate(''); setToDate(''); setWorkOrderFilter(''); }}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200 flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-gray-700">
            {selectedBOLs.size} of {allBOLs.length} BOLs selected
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {selectedBOLs.size === allBOLs.length ? 'Deselect All' : 'Select All'}
          </button>
          <button
            onClick={downloadSelected}
            disabled={selectedBOLs.size === 0 || downloading}
            className={`px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 ${
              selectedBOLs.size === 0 || downloading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Download PDFs ({selectedBOLs.size})
          </button>
          <button
            onClick={exportSelectedToExcel}
            disabled={selectedBOLs.size === 0 || downloading}
            className={`px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 ${
              selectedBOLs.size === 0 || downloading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Export to Excel ({selectedBOLs.size})
          </button>
        </div>
      </div>

      {/* BOL List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <div className="text-xl font-semibold text-gray-700">Loading BOLs...</div>
        </div>
      ) : allBOLs.length === 0 ? (
        <div className="text-center py-16">
          <DocumentTextIcon className="h-24 w-24 text-gray-300 mx-auto mb-6" />
          <div className="text-2xl font-semibold text-gray-700 mb-2">No BOLs Found</div>
          <div className="text-gray-500">Try adjusting your filters</div>
        </div>
      ) : (
        <div className="overflow-auto max-h-[600px] border border-gray-200 rounded-lg">
          <table className="min-w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-blue-100">
              <tr>
                <th className="border px-3 py-2 text-left">
                  <input
                    type="checkbox"
                    checked={selectedBOLs.size === allBOLs.length && allBOLs.length > 0}
                    onChange={selectAll}
                    className="rounded"
                  />
                </th>
                <th className="border px-3 py-2 text-left">Driver</th>
                <th className="border px-3 py-2 text-left">Date</th>
                <th className="border px-3 py-2 text-left">Work Order</th>
                <th className="border px-3 py-2 text-left">Total Amount</th>
                <th className="border px-3 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {allBOLs.map((bol) => {
                const isFullyPaid = (bol.due_amount || 0) <= 0;
                return (
                  <tr key={bol.id} className="hover:bg-blue-50">
                    <td className="border px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedBOLs.has(bol.id)}
                        onChange={() => toggleSelect(bol.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="border px-3 py-2">{bol.driver_name}</td>
                    <td className="border px-3 py-2">{formatDate(bol.date)}</td>
                    <td className="border px-3 py-2">{bol.work_order_no || 'N/A'}</td>
                    <td className="border px-3 py-2">{formatCurrency(bol.total_amount)}</td>
                    <td className="border px-3 py-2">
                      {isFullyPaid ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
