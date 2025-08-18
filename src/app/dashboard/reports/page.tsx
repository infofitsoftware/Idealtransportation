"use client";

import React, { useEffect, useState } from "react";
import { DocumentTextIcon, ArrowDownTrayIcon, ShieldExclamationIcon } from "@heroicons/react/24/outline";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { bolService } from "@/services/transaction";
import { useAccessControl } from "@/hooks/useAccessControl";
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
  return new Date(dateStr).toLocaleDateString();
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
  let y = -2; // Pulled logo up further by starting at y=-2 instead of y=2

  // Company Header with Logo and Address on same line
  try {
    const logoBase64 = await loadLogoAsBase64();
    if (logoBase64) {
      // Larger logo on the left (shifted left from 10 to 5, increased size from 72x36 to 80x40)
      doc.addImage(logoBase64, 'JPEG', 5, y, 80, 40);
      // Company name and address on the right, shifted further left (from 90 to 85)
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Ideal Transportation Solutions LLC', 85, y + 12, { align: 'left' });
      y += 12;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('16 Palmero Way, Manvel, Texas 77578', 85, y + 8, { align: 'left' });
      y += 8;
      doc.text('USDOT NO: 4193929', 85, y + 8, { align: 'left' });
      y += 25; // Increased space after header to avoid divider touching logo
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

  // Divider line - moved down to avoid touching logo
  doc.setDrawColor(200, 200, 200);
  doc.line(14, y, 196, y);
  y += 10;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill of Lading', 105, y, { align: 'center' });
  y += 15;

  // Report Details Box
  doc.setDrawColor(59, 130, 246); // Blue border
  doc.setFillColor(239, 246, 255); // Light blue background
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
  y += 20; // Gap between pickup and delivery

  // Check page overflow before Delivery Section
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  // Delivery Section
  doc.setDrawColor(59, 130, 246);
  doc.setFillColor(248, 250, 252); // Light gray background
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
  y += 20; // Increased gap between delivery and vehicles to prevent overlap

  // Check page overflow before Vehicles Section
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  // Vehicles Section - Dynamic height based on number of vehicles
  const vehicleTableHeight = Math.max(30, (bol.vehicles.length + 1) * 8); // +1 for header, minimum 30
  doc.setDrawColor(59, 130, 246);
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(14, y, 182, vehicleTableHeight + 10, 3, 3, 'FD'); // +10 for padding
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Vehicles', 20, y);
  y += 2;
  
  // Check if we need a new page for the vehicle table
  const estimatedTableHeight = (bol.vehicles.length + 1) * 8;
  if (y + estimatedTableHeight > 270) {
    doc.addPage();
    y = 20;
    // Redraw the vehicle section header on new page
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
      // Add page number
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

  // Signatures Section - Increased height to prevent overflow
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
  y += 25; // Spacing between pickup and delivery signatures
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

export default function ReportsPage() {
  const { currentUser, loading: accessLoading, hasAccess, isSuperuser } = useAccessControl();
  const [data, setData] = useState<BillOfLading[]>([]);
  const [filteredData, setFilteredData] = useState<BillOfLading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const bols = await bolService.getBOLs();
        setData(bols);
        setFilteredData(bols);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter data based on date range
  useEffect(() => {
    let filtered = data;

    if (fromDate) {
      filtered = filtered.filter(bol => 
        new Date(bol.date) >= new Date(fromDate)
      );
    }

    if (toDate) {
      filtered = filtered.filter(bol => 
        new Date(bol.date) <= new Date(toDate)
      );
    }

    setFilteredData(filtered);
  }, [data, fromDate, toDate]);

  const clearFilters = () => {
    setFromDate('');
    setToDate('');
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

  // Calculate overall payment statistics
  const paymentStats = React.useMemo(() => {
    const totalBOLs = filteredData.length;
    const totalAmount = filteredData.reduce((sum, bol) => sum + (bol.total_amount || 0), 0);
    const totalCollected = filteredData.reduce((sum, bol) => sum + (bol.total_collected || 0), 0);
    const totalDue = filteredData.reduce((sum, bol) => sum + (bol.due_amount || 0), 0);
    const completionPercentage = totalAmount > 0 ? ((totalCollected / totalAmount) * 100).toFixed(1) : '0.0';
    const fullyPaidCount = filteredData.filter(bol => (bol.due_amount || 0) <= 0).length;
    const partiallyPaidCount = filteredData.filter(bol => (bol.due_amount || 0) > 0 && (bol.total_collected || 0) > 0).length;
    const pendingCount = filteredData.filter(bol => (bol.due_amount || 0) > 0 && (bol.total_collected || 0) <= 0).length;

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
  }, [filteredData]);

  const exportToExcel = () => {
    // Prepare data for Excel export
    const excelData = filteredData.map(bol => {
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
        'Vehicles': bol.vehicles.map(v => `${v.year} ${v.make} ${v.model} (${v.vin})`).join('; '),
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
            onClick={exportToExcel}
            disabled={filteredData.length === 0}
            className={`px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 ${
              filteredData.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
            }`}
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Export to Excel
          </button>
        </div>
      </div>

      {/* Date Filters */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Filter by Date Range</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
        {(fromDate || toDate) && (
          <div className="mt-3 text-sm text-gray-600">
            Showing {filteredData.length} of {data.length} BOLs
            {fromDate && toDate && ` from ${fromDate} to ${toDate}`}
            {fromDate && !toDate && ` from ${fromDate}`}
            {!fromDate && toDate && ` until ${toDate}`}
          </div>
        )}
      </div>

      {/* Payment Statistics */}
      {filteredData.length > 0 && (
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
        <div className="text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-blue-100 text-blue-800">
                <th className="border px-2 py-1">Driver</th>
                <th className="border px-2 py-1">Date</th>
                <th className="border px-2 py-1">Work Order</th>
                <th className="border px-2 py-1">Broker</th>
                <th className="border px-2 py-1">Pickup</th>
                <th className="border px-2 py-1">Delivery</th>
                <th className="border px-2 py-1">Total Amount</th>
                <th className="border px-2 py-1">Amount Paid</th>
                <th className="border px-2 py-1">Due Amount</th>
                <th className="border px-2 py-1">Status</th>
                <th className="border px-2 py-1">Vehicles</th>
                <th className="border px-2 py-1">Download</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((bol) => {
                const paymentInfo = getPaymentInfo(bol);
                const isFullyPaid = paymentInfo.dueAmount <= 0;
                const hasPartialPayment = paymentInfo.collectedAmount > 0;
                
                return (
                  <tr key={bol.id} className={`hover:bg-blue-50 ${!isFullyPaid ? 'bg-red-50' : ''}`}>
                    <td className="border px-2 py-1 font-medium">{bol.driver_name}</td>
                    <td className="border px-2 py-1">{formatDate(bol.date)}</td>
                    <td className="border px-2 py-1 font-medium">{bol.work_order_no || 'N/A'}</td>
                    <td className="border px-2 py-1">
                      <div className="font-semibold">{bol.broker_name || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{bol.broker_address}</div>
                      <div className="text-xs text-gray-400">{bol.broker_phone}</div>
                    </td>
                    <td className="border px-2 py-1">
                      <div className="font-semibold">{bol.pickup_name}</div>
                      <div className="text-xs text-gray-500">{bol.pickup_address}</div>
                      <div className="text-xs text-gray-400">{bol.pickup_city}, {bol.pickup_state} {bol.pickup_zip}</div>
                    </td>
                    <td className="border px-2 py-1">
                      <div className="font-semibold">{bol.delivery_name}</div>
                      <div className="text-xs text-gray-500">{bol.delivery_address}</div>
                      <div className="text-xs text-gray-400">{bol.delivery_city}, {bol.delivery_state} {bol.delivery_zip}</div>
                    </td>
                    <td className="border px-2 py-1 font-medium text-blue-600">
                      {formatCurrency(paymentInfo.totalAmount)}
                    </td>
                    <td className="border px-2 py-1 font-medium text-green-600">
                      {formatCurrency(paymentInfo.collectedAmount)}
                    </td>
                    <td className="border px-2 py-1 font-medium text-red-600">
                      {formatCurrency(paymentInfo.dueAmount)}
                    </td>
                    <td className="border px-2 py-1">
                      {isFullyPaid ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Paid
                        </span>
                      ) : hasPartialPayment ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Partial
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="border px-2 py-1">
                      <ul className="list-disc pl-4">
                        {bol.vehicles.map((v, i) => (
                          <li key={i}>{v.year} {v.make} {v.model} ({v.vin})</li>
                        ))}
                      </ul>
                    </td>
                    <td className="border px-2 py-1 text-center">
                      <button
                        className="bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-700 transition flex items-center gap-1 mx-auto"
                        onClick={async () => await downloadBOLPdf(bol)}
                      >
                        <ArrowDownTrayIcon className="h-5 w-5" /> Download
                      </button>
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