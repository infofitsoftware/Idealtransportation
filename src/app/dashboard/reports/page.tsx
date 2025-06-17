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

function downloadBOLPdf(bol: BillOfLading) {
  const doc = new jsPDF();
  let y = 10;
  doc.setFontSize(18);
  doc.text("Bill of Lading", 105, y, { align: "center" });
  y += 10;
  doc.setFontSize(12);
  doc.text('Driver: ' + String(bol.driver_name ?? ''), 14, y);
  doc.text('Date: ' + String(formatDate(bol.date) ?? ''), 150, y);
  y += 8;
  doc.text('Work Order No: ' + String(bol.work_order_no ?? ''), 14, y);
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Pick Up", 14, y);
  doc.setFont("helvetica", "normal");
  y += 6;
  doc.text('Name: ' + String(bol.pickup_name ?? ''), 14, y);
  doc.text('Phone: ' + String(bol.pickup_phone ?? ''), 100, y);
  y += 6;
  doc.text('Address: ' + String(bol.pickup_address ?? ''), 14, y);
  y += 6;
  doc.text('City: ' + String(bol.pickup_city ?? '') + '  State: ' + String(bol.pickup_state ?? '') + '  Zip: ' + String(bol.pickup_zip ?? ''), 14, y);
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Delivery", 14, y);
  doc.setFont("helvetica", "normal");
  y += 6;
  doc.text('Name: ' + String(bol.delivery_name ?? ''), 14, y);
  doc.text('Phone: ' + String(bol.delivery_phone ?? ''), 100, y);
  y += 6;
  doc.text('Address: ' + String(bol.delivery_address ?? ''), 14, y);
  y += 6;
  doc.text('City: ' + String(bol.delivery_city ?? '') + '  State: ' + String(bol.delivery_state ?? '') + '  Zip: ' + String(bol.delivery_zip ?? ''), 14, y);
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Vehicles", 14, y);
  doc.setFont("helvetica", "normal");
  y += 2;
  autoTable(doc, {
    startY: y,
    head: [["Year", "Make", "Model", "VIN", "Mileage", "Price"]],
    body: bol.vehicles.map((v) => [v.year, v.make, v.model, v.vin, v.mileage, v.price]),
    theme: "grid",
    headStyles: { fillColor: [37, 99, 235] },
    styles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 6;
  doc.setFont("helvetica", "bold");
  doc.text("Condition Codes", 14, y);
  doc.setFont("helvetica", "normal");
  y += 6;
  doc.text(String(bol.condition_codes ?? ''), 14, y);
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Remarks", 14, y);
  doc.setFont("helvetica", "normal");
  y += 6;
  doc.text(String(bol.remarks ?? ''), 14, y, { maxWidth: 180 });
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.text("Signatures", 14, y);
  doc.setFont("helvetica", "normal");
  y += 6;
  doc.text('Pickup Agent: ' + String(bol.pickup_agent_name ?? ''), 14, y);
  doc.text('Date: ' + String(formatDate(bol.pickup_date) ?? ''), 100, y);
  y += 2;
  if (bol.pickup_signature && typeof bol.pickup_signature === 'string') {
    try {
      const base64Data = bol.pickup_signature.split(',')[1] || bol.pickup_signature;
      doc.addImage(base64Data, "PNG", 14, y + 2, 40, 16);
    } catch (err) {
      console.error('Error adding pickup signature:', err);
    }
  }
  y += 20;
  doc.text('Delivery Agent: ' + String(bol.delivery_agent_name ?? ''), 14, y);
  doc.text('Date: ' + String(formatDate(bol.delivery_date) ?? ''), 100, y);
  y += 2;
  if (bol.delivery_signature && typeof bol.delivery_signature === 'string') {
    try {
      const base64Data = bol.delivery_signature.split(',')[1] || bol.delivery_signature;
      doc.addImage(base64Data, "PNG", 14, y + 2, 40, 16);
    } catch (err) {
      console.error('Error adding delivery signature:', err);
    }
  }
  y += 22;
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
                      onClick={() => downloadBOLPdf(bol)}
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