"use client";

import React, { useEffect, useState } from "react";
import { DocumentTextIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
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
  vehicles: Vehicle[];
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString();
}

// Function to load logo as base64
async function loadLogoAsBase64(): Promise<string | null> {
  try {
    const response = await fetch('/logo.jpeg');
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
      doc.text('Ideal Transportation Solutions Private Limited', 85, y + 12, { align: 'left' });
      y += 12;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('16 Palmero Way, Manvel, Texas 77578', 85, y + 8, { align: 'left' });
      y += 25; // Increased space after header to avoid divider touching logo
    } else {
      // Fallback without logo
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Ideal Transportation Solutions Private Limited', 105, y, { align: 'center' });
      y += 6;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('16 Palmero Way, Manvel, Texas 77578', 105, y, { align: 'center' });
      y += 8;
    }
  } catch (err) {
    console.error('Error loading logo:', err);
    // Fallback without logo
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Ideal Transportation Solutions Private Limited', 105, y, { align: 'center' });
    y += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('16 Palmero Way, Manvel, Texas 77578', 105, y, { align: 'center' });
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
  doc.setDrawColor(59, 130, 246);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 182, 70, 3, 3, 'FD'); // Increased from 50 to 70
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
  y += 25; // Increased spacing between pickup and delivery signatures
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
  y += 30; // Increased final spacing

  // Footer
  doc.setDrawColor(200, 200, 200);
  doc.line(14, y, 196, y);
  y += 8;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('This report was generated by Ideal Transportation Solutions Private Limited', 105, y, { align: 'center' });

  doc.save(`BillOfLading_${bol.id}.pdf`);
}

export default function ReportsPage() {
  const [data, setData] = useState<BillOfLading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/bol/`);
        if (!res.ok) throw new Error("Failed to fetch reports");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-8 mb-8 border border-blue-100">
      <h1 className="text-3xl font-extrabold mb-6 text-blue-700 tracking-tight flex items-center gap-2">
        <DocumentTextIcon className="h-8 w-8 text-blue-500" /> Reports
      </h1>
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
                <th className="border px-2 py-1">Pickup</th>
                <th className="border px-2 py-1">Delivery</th>
                <th className="border px-2 py-1">Vehicles</th>
                <th className="border px-2 py-1">Download</th>
              </tr>
            </thead>
            <tbody>
              {data.map((bol) => (
                <tr key={bol.id} className="hover:bg-blue-50">
                  <td className="border px-2 py-1 font-medium">{bol.driver_name}</td>
                  <td className="border px-2 py-1">{bol.date}</td>
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 