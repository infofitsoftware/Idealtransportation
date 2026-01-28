"use client";

import React, { useEffect, useState } from "react";
import { DocumentTextIcon, ArrowDownTrayIcon, ShieldExclamationIcon, PencilIcon, TrashIcon, EyeIcon } from "@heroicons/react/24/outline";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { bolService } from "@/services/transaction";
import { authService } from "@/services/auth";
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
  // Receiver agent fields
  receiver_agent_name?: string;
  receiver_signature?: string;
  receiver_date?: string;
  // Broker information fields
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

// Memoized components for better performance
const MemoizedTableRow = React.memo(({ 
  bol, 
  onDownload, 
  onEdit, 
  onDelete, 
  onView,
  canEdit,
  canDelete 
}: { 
  bol: BillOfLading; 
  onDownload: (bol: BillOfLading) => void;
  onEdit: (bol: BillOfLading) => void;
  onDelete: (bol: BillOfLading) => void;
  onView: (bol: BillOfLading) => void;
  canEdit: boolean;
  canDelete: boolean;
}) => {
  const paymentInfo = React.useMemo(() => {
    const totalAmount = bol.total_amount || 0;
    const collectedAmount = bol.total_collected || 0;
    const dueAmount = bol.due_amount || 0;
    return { totalAmount, collectedAmount, dueAmount };
  }, [bol.total_amount, bol.total_collected, bol.due_amount]);
  
  const isFullyPaid = paymentInfo.dueAmount <= 0;
  const hasPartialPayment = paymentInfo.collectedAmount > 0;
  const hasTransactions = paymentInfo.collectedAmount > 0;
  
  return (
    <tr className={`hover:bg-blue-50 ${!isFullyPaid ? 'bg-red-50' : ''}`}>
      <td className="border px-3 py-2 font-medium whitespace-nowrap">{bol.driver_name}</td>
      <td className="border px-3 py-2 whitespace-nowrap">{formatDate(bol.date)}</td>
      <td className="border px-3 py-2 font-medium whitespace-nowrap">{bol.work_order_no || 'N/A'}</td>
      <td className="border px-3 py-2">
        <div className="font-semibold whitespace-nowrap">{bol.broker_name || 'N/A'}</div>
        <div className="text-xs text-gray-500 whitespace-nowrap">{bol.broker_address}</div>
        <div className="text-xs text-gray-400 whitespace-nowrap">{bol.broker_phone}</div>
      </td>
      <td className="border px-3 py-2">
        <div className="font-semibold whitespace-nowrap">{bol.pickup_name}</div>
        <div className="text-xs text-gray-500 whitespace-nowrap">{bol.pickup_address}</div>
        <div className="text-xs text-gray-400 whitespace-nowrap">{bol.pickup_city}, {bol.pickup_state} {bol.pickup_zip}</div>
      </td>
      <td className="border px-3 py-2">
        <div className="font-semibold whitespace-nowrap">{bol.delivery_name}</div>
        <div className="text-xs text-gray-500 whitespace-nowrap">{bol.delivery_address}</div>
        <div className="text-xs text-gray-400 whitespace-nowrap">{bol.delivery_city}, {bol.delivery_state} {bol.delivery_zip}</div>
      </td>
      <td className="border px-3 py-2 font-medium text-blue-600 whitespace-nowrap">
        {formatCurrency(paymentInfo.totalAmount)}
      </td>
      <td className="border px-3 py-2 font-medium text-green-600 whitespace-nowrap">
        {formatCurrency(paymentInfo.collectedAmount)}
      </td>
      <td className="border px-3 py-2 font-medium text-red-600 whitespace-nowrap">
        {formatCurrency(paymentInfo.dueAmount)}
      </td>
      <td className="border px-3 py-2">
        {isFullyPaid ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
            Paid
          </span>
        ) : hasPartialPayment ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 whitespace-nowrap">
            Partial
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 whitespace-nowrap">
            Pending
          </span>
        )}
      </td>
      <td className="border px-3 py-2">
        <ul className="list-disc pl-4">
          {bol.vehicles.map((v, i) => (
            <li key={i} className="whitespace-nowrap">{v.year} {v.make} {v.model} ({v.vin})</li>
          ))}
        </ul>
      </td>
      <td className="border px-3 py-2 text-center">
        <div className="flex items-center justify-center gap-1">
          <button
            className="bg-gray-600 text-white px-2 py-1 rounded shadow hover:bg-gray-700 transition flex items-center gap-1"
            onClick={() => onView(bol)}
            title="View Details"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          <button
            className="bg-blue-600 text-white px-2 py-1 rounded shadow hover:bg-blue-700 transition flex items-center gap-1"
            onClick={() => onDownload(bol)}
            title="Download PDF"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
          </button>
          {canEdit && (
            <button
              className="bg-green-600 text-white px-2 py-1 rounded shadow hover:bg-green-700 transition flex items-center gap-1"
              onClick={() => onEdit(bol)}
              title="Edit BOL"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          )}
          {canDelete && !hasTransactions && (
            <button
              className="bg-red-600 text-white px-2 py-1 rounded shadow hover:bg-red-700 transition flex items-center gap-1"
              onClick={() => onDelete(bol)}
              title="Delete BOL"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

MemoizedTableRow.displayName = 'MemoizedTableRow';

export default function ReportsPage() {
  const { currentUser, loading: accessLoading, hasAccess, isSuperuser } = useAccessControl();
  const router = useRouter();
  const [displayedData, setDisplayedData] = useState<BillOfLading[]>([]);
  const [allData, setAllData] = useState<BillOfLading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [workOrderFilter, setWorkOrderFilter] = useState('');
  const [driverFilter, setDriverFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all'); // 'all', 'paid', 'pending'
  const [drivers, setDrivers] = useState<Array<{id: number, full_name: string}>>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(50); // Load 50 BOLs at a time for better performance
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalLoaded, setTotalLoaded] = useState(0);

  // Debounced filter values for server-side filtering
  const [debouncedWorkOrder, setDebouncedWorkOrder] = useState('');
  const [debouncedDriver, setDebouncedDriver] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedWorkOrder(workOrderFilter);
    }, 500);
    return () => clearTimeout(timer);
  }, [workOrderFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDriver(driverFilter);
    }, 500);
    return () => clearTimeout(timer);
  }, [driverFilter]);

  // Fetch drivers list for admin users
  useEffect(() => {
    const fetchDrivers = async () => {
      if (isSuperuser) {
        try {
          setLoadingDrivers(true);
          const driverList = await authService.getDrivers();
          setDrivers(driverList || []);
        } catch (err) {
          console.error('Error fetching drivers:', err);
        } finally {
          setLoadingDrivers(false);
        }
      }
    };
    fetchDrivers();
  }, [isSuperuser]);

  // Fetch initial data with server-side pagination and filtering
  useEffect(() => {
    const fetchData = async () => {
      if (!hasAccess && !accessLoading) return;
      
      try {
        setLoading(true);
        setError("");
        
        // Fetch first page with server-side filtering (including payment status)
        const bols = await bolService.getBOLs({
          skip: 0,
          limit: itemsPerPage,
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
          work_order_no: debouncedWorkOrder || undefined,
          driver_name: debouncedDriver || undefined,
          payment_status: paymentStatusFilter !== 'all' ? paymentStatusFilter : undefined,
          sort_by: 'date',
          sort_order: 'asc'
        });
        
        setDisplayedData(bols);
        setAllData(bols);
        setTotalLoaded(bols.length);
        setHasMoreData(bols.length === itemsPerPage);
        setCurrentPage(0);
      } catch (err: any) {
        console.error('Error fetching BOLs:', err);
        setError(err.message || 'Failed to load BOL reports');
      } finally {
        setLoading(false);
      }
    };
    
    if (hasAccess || accessLoading) {
    fetchData();
    }
  }, [itemsPerPage, fromDate, toDate, debouncedWorkOrder, debouncedDriver, paymentStatusFilter, hasAccess, accessLoading]);

  // Load more data with server-side pagination
  const loadMoreData = React.useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    
    setLoadingMore(true);
    
    try {
      const nextPage = currentPage + 1;
      const skip = nextPage * itemsPerPage;
      
      const newBols = await bolService.getBOLs({
        skip,
        limit: itemsPerPage,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        work_order_no: debouncedWorkOrder || undefined,
        driver_name: debouncedDriver || undefined,
        payment_status: paymentStatusFilter !== 'all' ? paymentStatusFilter : undefined,
        sort_by: 'date',
        sort_order: 'asc'
      });
      
      if (newBols.length > 0) {
        const updatedData = [...displayedData, ...newBols];
        setDisplayedData(updatedData);
        setAllData(updatedData);
        setTotalLoaded(updatedData.length);
        setCurrentPage(nextPage);
        setHasMoreData(newBols.length === itemsPerPage);
      } else {
        setHasMoreData(false);
      }
    } catch (err: any) {
      console.error('Error loading more BOLs:', err);
      setError('Failed to load more data');
    } finally {
      setLoadingMore(false);
    }
  }, [currentPage, displayedData, itemsPerPage, fromDate, toDate, debouncedWorkOrder, debouncedDriver, paymentStatusFilter, loadingMore, hasMoreData]);

  const clearFilters = () => {
    setFromDate('');
    setToDate('');
    setWorkOrderFilter('');
    setDriverFilter('');
    setPaymentStatusFilter('all');
  };

  // Handler functions for BOL operations
  const handleViewBOL = (bol: BillOfLading) => {
    // Navigate to a detailed view page using query parameters
    router.push(`/dashboard/bol/detail?id=${bol.id}`);
  };

  const handleEditBOL = (bol: BillOfLading) => {
    // Navigate to edit page with BOL data using query parameters
    router.push(`/dashboard/bol/edit?id=${bol.id}`);
  };

  const handleDeleteBOL = async (bol: BillOfLading) => {
    if (!window.confirm(`Are you sure you want to delete BOL #${bol.id} (Work Order: ${bol.work_order_no})? This action cannot be undone.`)) {
      return;
    }

    try {
      await bolService.deleteBOL(bol.id);
      toast.success('BOL deleted successfully');
      
      // Refresh the data
      const updatedData = displayedData.filter(b => b.id !== bol.id);
      setDisplayedData(updatedData);
      setAllData(updatedData);
      setTotalLoaded(updatedData.length);
    } catch (err: any) {
      console.error('Error deleting BOL:', err);
      toast.error(err.response?.data?.detail || 'Failed to delete BOL');
    }
  };

  // Calculate payment statistics for each BOL
  const getPaymentInfo = (bol: BillOfLading) => {
    const totalAmount = bol.total_amount || 0;
    const collectedAmount = bol.total_collected || 0;
    const dueAmount = bol.due_amount || 0;
    
    return {
      totalAmount: totalAmount,
      collectedAmount: collectedAmount,
      dueAmount: dueAmount
    };
  };

  // Since we're now using server-side filtering, we don't need client-side filtering
  // displayedData already contains the filtered results from the server

  // Calculate overall payment statistics
  const paymentStats = React.useMemo(() => {
    const totalBOLs = displayedData.length;
    const totalAmount = displayedData.reduce((sum, bol) => sum + (bol.total_amount || 0), 0);
    const totalCollected = displayedData.reduce((sum, bol) => sum + (bol.total_collected || 0), 0);
    const totalDue = displayedData.reduce((sum, bol) => sum + (bol.due_amount || 0), 0);
    const completionPercentage = totalAmount > 0 ? ((totalCollected / totalAmount) * 100).toFixed(1) : '0.0';
    const fullyPaidCount = displayedData.filter(bol => (bol.due_amount || 0) <= 0).length;
    const partiallyPaidCount = displayedData.filter(bol => (bol.due_amount || 0) > 0 && (bol.total_collected || 0) > 0).length;
    const pendingCount = displayedData.filter(bol => (bol.due_amount || 0) > 0 && (bol.total_collected || 0) <= 0).length;

    return {
      totalBOLs,
      totalAmount,
      totalCollected,
      totalDue,
      completionPercentage,
      fullyPaidCount,
      partiallyPaidCount,
      pendingCount
    };
  }, [displayedData]);

  const exportToExcel = async () => {
    // For Excel export, fetch all data without pagination
    try {
      setLoadingMore(true);
      const allBols = await bolService.getBOLs({
        skip: 0,
        limit: 1000, // Get all records for export
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        work_order_no: debouncedWorkOrder || undefined,
        driver_name: debouncedDriver || undefined,
        payment_status: paymentStatusFilter !== 'all' ? paymentStatusFilter : undefined,
        sort_by: 'date',
        sort_order: 'asc'
      });
      
      // Server already applied the payment status filter, so use allBols directly
      const exportData = allBols;
      
      // Prepare data for Excel export
      const excelData = exportData.map(bol => {
      const paymentInfo = getPaymentInfo(bol);
      const isFullyPaid = paymentInfo.dueAmount <= 0;
      const hasPartialPayment = paymentInfo.collectedAmount > 0;
      
      return {
        'Driver': bol.driver_name,
        'Date': formatDate(bol.date),
        'Work Order No': bol.work_order_no || 'N/A',
        'Broker Name': bol.broker_name || '',
        'Broker Address': bol.broker_address || '',
        'Broker Phone': bol.broker_phone || '',
        'Pickup Name': bol.pickup_name || '',
        'Pickup Address': bol.pickup_address || '',
        'Pickup City': bol.pickup_city || '',
        'Pickup State': bol.pickup_state || '',
        'Pickup Zip': bol.pickup_zip || '',
        'Delivery Name': bol.delivery_name || '',
        'Delivery Address': bol.delivery_address || '',
        'Delivery City': bol.delivery_city || '',
        'Delivery State': bol.delivery_state || '',
        'Delivery Zip': bol.delivery_zip || '',
        'Total Amount': paymentInfo.totalAmount,
        'Amount Paid': paymentInfo.collectedAmount,
        'Due Amount': paymentInfo.dueAmount,
        'Status': isFullyPaid ? 'Paid' : hasPartialPayment ? 'Partial' : 'Pending',
        'Vehicle Count': bol.vehicles.length,
        'Vehicles': bol.vehicles.map((v: Vehicle) => `${v.year} ${v.make} ${v.model} (${v.vin})`).join('; '),
        'Condition Codes': bol.condition_codes || '',
        'Remarks': bol.remarks || ''
      };
    });

    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Add BOLs worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths for BOLs
    const colWidths = [
      { wch: 15 }, // Driver
      { wch: 12 }, // Date
      { wch: 15 }, // Work Order No
      { wch: 20 }, // Broker Name
      { wch: 25 }, // Broker Address
      { wch: 15 }, // Broker Phone
      { wch: 20 }, // Pickup Name
      { wch: 25 }, // Pickup Address
      { wch: 15 }, // Pickup City
      { wch: 10 }, // Pickup State
      { wch: 10 }, // Pickup Zip
      { wch: 20 }, // Delivery Name
      { wch: 25 }, // Delivery Address
      { wch: 15 }, // Delivery City
      { wch: 10 }, // Delivery State
      { wch: 10 }, // Delivery Zip
      { wch: 15 }, // Total Amount
      { wch: 15 }, // Amount Paid
      { wch: 15 }, // Due Amount
      { wch: 10 }, // Status
      { wch: 12 }, // Vehicle Count
      { wch: 40 }, // Vehicles
      { wch: 20 }, // Condition Codes
      { wch: 30 }  // Remarks
    ];
    ws['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, 'Bill of Lading');

    // Add summary worksheet
    const summaryData = [
      { 'Metric': 'Total BOLs', 'Value': paymentStats.totalBOLs },
      { 'Metric': 'Total Amount', 'Value': paymentStats.totalAmount },
      { 'Metric': 'Total Amount Collected', 'Value': paymentStats.totalCollected },
      { 'Metric': 'Total Amount Due', 'Value': paymentStats.totalDue },
      { 'Metric': 'Payment Completion Rate', 'Value': `${paymentStats.completionPercentage}%` },
      { 'Metric': 'Fully Paid BOLs', 'Value': paymentStats.fullyPaidCount },
      { 'Metric': 'Partially Paid BOLs', 'Value': paymentStats.partiallyPaidCount },
      { 'Metric': 'Pending Payment BOLs', 'Value': paymentStats.pendingCount }
    ];
    
    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    summaryWs['!cols'] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Payment Summary');

    // Generate filename with date range
    let filename = 'BOL_Report';
    if (fromDate && toDate) {
      filename += `_${fromDate}_to_${toDate}`;
    } else if (fromDate) {
      filename += `_from_${fromDate}`;
    } else if (toDate) {
      filename += `_until_${toDate}`;
    }
    filename += '.xlsx';

      // Save the file
      XLSX.writeFile(wb, filename);
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      alert('Failed to export data to Excel');
    } finally {
      setLoadingMore(false);
    }
  };

  // Access control check
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
          <ShieldExclamationIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-700 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page. Only authorized users can view reports.
          </p>
          <p className="text-sm text-gray-500">
            Current user: {currentUser?.email || 'Not logged in'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-8 mb-8 border border-blue-100">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold text-blue-700 tracking-tight flex items-center gap-2">
          <DocumentTextIcon className="h-8 w-8 text-blue-500" /> Bill of Lading Reports
      </h1>
        <div className="flex items-center gap-4">
          {isSuperuser && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Superuser Access
            </span>
          )}
          <button
            onClick={() => router.push('/dashboard/reports/download')}
            className="px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 bg-purple-600 text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Bulk Download
          </button>
          <button
            onClick={exportToExcel}
            disabled={displayedData.length === 0}
            className={`px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 ${
              displayedData.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
            }`}
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Export to Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Filter Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
          <div>
            <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              id="fromDate"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="toDate" className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              id="toDate"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="workOrderFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Work Order Number
            </label>
            <input
              type="text"
              id="workOrderFilter"
              value={workOrderFilter}
              onChange={(e) => setWorkOrderFilter(e.target.value)}
              placeholder="Enter work order number..."
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          {isSuperuser && (
            <div>
              <label htmlFor="driverFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Driver
                {driverFilter && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    Filter Active
                  </span>
                )}
              </label>
              <select
                id="driverFilter"
                value={driverFilter}
                onChange={(e) => setDriverFilter(e.target.value)}
                disabled={loadingDrivers}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">All Drivers</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.full_name}>
                    {driver.full_name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="paymentStatusFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Payment Status
              {paymentStatusFilter !== 'all' && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  Filter Active
                </span>
              )}
            </label>
            <select
              id="paymentStatusFilter"
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">All BOLs</option>
              <option value="paid">Fully Paid</option>
              <option value="pending">Pending/Partial</option>
            </select>
          </div>
          <div>
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
        {(fromDate || toDate || workOrderFilter || driverFilter || paymentStatusFilter !== 'all') && (
          <div className="mt-3 text-sm text-gray-600">
            Showing {displayedData.length} BOLs
            {fromDate && toDate && ` from ${fromDate} to ${toDate}`}
            {fromDate && !toDate && ` from ${fromDate}`}
            {!fromDate && toDate && ` until ${toDate}`}
            {workOrderFilter && ` matching work order "${workOrderFilter}"`}
            {driverFilter && ` for driver "${driverFilter}"`}
            {paymentStatusFilter === 'paid' && ` (fully paid only)`}
            {paymentStatusFilter === 'pending' && ` (pending/partial payments only)`}
            {hasMoreData && ` (more available)`}
          </div>
        )}
      </div>

      {/* Data Summary */}
      {!loading && displayedData.length > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Report Summary</h3>
              <p className="text-sm text-gray-600">
                Showing {displayedData.length} BOL reports
                {hasMoreData && ' (scroll down to load more)'}
                {paymentStatusFilter !== 'all' && (
                  <span className="ml-2 text-blue-600 font-medium">
                    ({paymentStatusFilter === 'paid' ? 'Fully Paid' : 'Pending/Partial'} filter applied)
                  </span>
                )}
              </p>
            </div>
            {hasMoreData && (
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">+</div>
                <div className="text-sm text-gray-600">More Available</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Statistics */}
      {displayedData.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Payment Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded-lg border border-blue-200">
              <div className="text-sm text-gray-600">Total BOLs</div>
              <div className="text-2xl font-bold text-blue-600">{paymentStats.totalBOLs}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-green-200">
              <div className="text-sm text-gray-600">Total Collected</div>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(paymentStats.totalCollected)}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-red-200">
              <div className="text-sm text-gray-600">Total Due</div>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(paymentStats.totalDue)}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-purple-200">
              <div className="text-sm text-gray-600">Completion Rate</div>
              <div className="text-2xl font-bold text-purple-600">{paymentStats.completionPercentage}%</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-green-100 p-3 rounded-lg border border-green-300">
              <div className="text-sm text-green-700">Fully Paid</div>
              <div className="text-lg font-bold text-green-800">{paymentStats.fullyPaidCount} BOLs</div>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg border border-yellow-300">
              <div className="text-sm text-yellow-700">Partially Paid</div>
              <div className="text-lg font-bold text-yellow-800">{paymentStats.partiallyPaidCount} BOLs</div>
            </div>
            <div className="bg-red-100 p-3 rounded-lg border border-red-300">
              <div className="text-sm text-red-700">Pending Payment</div>
              <div className="text-lg font-bold text-red-800">{paymentStats.pendingCount} BOLs</div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
            <div className="text-xl font-semibold text-gray-700 mb-2">Loading BOL Reports</div>
            <div className="text-sm text-gray-500">Fetching your data, please wait...</div>
          </div>
          
          {/* Professional Skeleton Table */}
          <div className="overflow-auto max-h-96 border border-gray-200 rounded-lg">
            <table className="min-w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-100">
                  <th className="border px-3 py-2 text-left min-w-[120px] h-12 bg-gray-200 animate-pulse"></th>
                  <th className="border px-3 py-2 text-left min-w-[120px] h-12 bg-gray-200 animate-pulse"></th>
                  <th className="border px-3 py-2 text-left min-w-[140px] h-12 bg-gray-200 animate-pulse"></th>
                  <th className="border px-3 py-2 text-left min-w-[180px] h-12 bg-gray-200 animate-pulse"></th>
                  <th className="border px-3 py-2 text-left min-w-[200px] h-12 bg-gray-200 animate-pulse"></th>
                  <th className="border px-3 py-2 text-left min-w-[200px] h-12 bg-gray-200 animate-pulse"></th>
                  <th className="border px-3 py-2 text-left min-w-[130px] h-12 bg-gray-200 animate-pulse"></th>
                  <th className="border px-3 py-2 text-left min-w-[130px] h-12 bg-gray-200 animate-pulse"></th>
                  <th className="border px-3 py-2 text-left min-w-[110px] h-12 bg-gray-200 animate-pulse"></th>
                  <th className="border px-3 py-2 text-left min-w-[80px] h-12 bg-gray-200 animate-pulse"></th>
                  <th className="border px-3 py-2 text-left min-w-[250px] h-12 bg-gray-200 animate-pulse"></th>
                  <th className="border px-3 py-2 text-center min-w-[100px] h-12 bg-gray-200 animate-pulse"></th>
              </tr>
            </thead>
            <tbody>
                {[...Array(8)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(12)].map((_, j) => (
                      <td key={j} className="border px-3 py-2 h-16 bg-gray-50"></td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Data</div>
          <div className="text-gray-600">{error}</div>
        </div>
      ) : displayedData.length === 0 ? (
        <div className="text-center py-16">
          <DocumentTextIcon className="h-24 w-24 text-gray-300 mx-auto mb-6" />
          <div className="text-2xl font-semibold text-gray-700 mb-2">No BOL Reports Found</div>
          <div className="text-gray-500 mb-6">
            {displayedData.length === 0 && !loading
              ? "No Bill of Lading reports have been created yet."
              : "No reports match your current filter criteria."
            }
          </div>
          {displayedData.length === 0 && !loading && (
            <button
              onClick={() => window.location.href = '/dashboard/bol'}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First BOL
            </button>
          )}
          {displayedData.length === 0 && (fromDate || toDate || workOrderFilter || driverFilter || paymentStatusFilter !== 'all') && (
            <button
              onClick={clearFilters}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-auto max-h-96 border border-gray-200 rounded-lg">
            <table className="min-w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10">
              <tr className="bg-blue-100 text-blue-800">
                  <th className="border px-3 py-2 text-left min-w-[120px] whitespace-nowrap">Driver</th>
                  <th className="border px-3 py-2 text-left min-w-[120px] whitespace-nowrap">Date</th>
                  <th className="border px-3 py-2 text-left min-w-[140px] whitespace-nowrap">Work Order</th>
                  <th className="border px-3 py-2 text-left min-w-[180px] whitespace-nowrap">Broker</th>
                  <th className="border px-3 py-2 text-left min-w-[200px] whitespace-nowrap">Pickup</th>
                  <th className="border px-3 py-2 text-left min-w-[200px] whitespace-nowrap">Delivery</th>
                  <th className="border px-3 py-2 text-left min-w-[130px] whitespace-nowrap">Total Amount</th>
                  <th className="border px-3 py-2 text-left min-w-[130px] whitespace-nowrap">Amount Paid</th>
                  <th className="border px-3 py-2 text-left min-w-[110px] whitespace-nowrap">Due Amount</th>
                  <th className="border px-3 py-2 text-left min-w-[80px] whitespace-nowrap">Status</th>
                  <th className="border px-3 py-2 text-left min-w-[250px] whitespace-nowrap">Vehicles</th>
                  <th className="border px-3 py-2 text-center min-w-[200px] whitespace-nowrap">Actions</th>
              </tr>
            </thead>
              <tbody>
                {displayedData.map((bol) => (
                  <MemoizedTableRow 
                    key={bol.id} 
                    bol={bol} 
                    onDownload={downloadBOLPdf}
                    onEdit={handleEditBOL}
                    onDelete={handleDeleteBOL}
                    onView={handleViewBOL}
                    canEdit={isSuperuser}
                    canDelete={isSuperuser}
                  />
                ))}
            </tbody>
          </table>
        </div>
          
          {/* Load More Button */}
          {hasMoreData && (
            <div className="mt-6 text-center">
              <button
                onClick={loadMoreData}
                disabled={loadingMore}
                className={`px-8 py-3 text-sm font-medium rounded-lg flex items-center gap-3 mx-auto transition-all duration-200 ${
                  loadingMore
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:scale-105'
                }`}
              >
                {loadingMore ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
                    Loading More BOLs...
                  </>
                ) : (
                <>
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  Load More BOLs
                </>
                )}
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Loaded {displayedData.length} BOLs
                {paymentStatusFilter !== 'all' && ` (${paymentStatusFilter === 'paid' ? 'Fully Paid' : 'Pending/Partial'} filter applied)`}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
} 
