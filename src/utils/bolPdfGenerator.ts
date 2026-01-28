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

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return dateStr;
  }
}

function formatCurrency(amount?: string | number): string {
  if (amount === undefined || amount === null) return "$0.00";
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]/g, '')) : amount;
  if (isNaN(num)) return "$0.00";
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(num);
}

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

export async function generateBOLPdf(bol: BillOfLading): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = 210; // A4 width in mm
  const margin = 15; // 15mm margins
  const contentWidth = pageWidth - (margin * 2);
  let y = margin;

  // ========== HEADER SECTION ==========
  // Left: Logo
  // Center: Company Info
  // Right: BOL Info
  try {
    const logoBase64 = await loadLogoAsBase64();
    if (logoBase64) {
      doc.addImage(logoBase64, 'JPEG', margin, y, 35, 18);
    }
  } catch (err) {
    console.error('Error loading logo:', err);
  }

  // Center: Company Information
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const companyName = 'IDEAL TRANSPORTATION SOLUTIONS LLC';
  doc.text(companyName, pageWidth / 2, y + 6, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('16 Palmero Way, Manvel, Texas 77578', pageWidth / 2, y + 11, { align: 'center' });
  doc.text('USDOT No: 4193929', pageWidth / 2, y + 16, { align: 'center' });

  // Right: BOL Information
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL OF LADING', pageWidth - margin, y + 3, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`BOL No: ${bol.work_order_no || bol.id}`, pageWidth - margin, y + 9, { align: 'right' });
  doc.text(`Generated: ${formatDate(new Date().toISOString())}`, pageWidth - margin, y + 14, { align: 'right' });

  y += 25; // Space after header

  // Divider line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // ========== SHIPMENT SUMMARY CARD ==========
  if (y > 250) {
    doc.addPage();
    y = margin;
  }

  doc.setDrawColor(59, 130, 246); // Dark blue border
  doc.setFillColor(248, 250, 252); // Light gray background
  doc.roundedRect(margin, y, contentWidth, 30, 3, 3, 'FD');
  
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  
  // Create a table-like layout for shipment summary
  const summaryFields = [
    { label: 'Driver', value: String(bol.driver_name || '') },
    { label: 'Work Order No', value: String(bol.work_order_no || 'N/A') },
    { label: 'Date', value: formatDate(bol.date) },
  ];
  
  if (bol.broker_name) {
    summaryFields.push({ label: 'Broker', value: String(bol.broker_name || '') });
  }
  if (bol.broker_phone) {
    summaryFields.push({ label: 'Broker Phone', value: String(bol.broker_phone || '') });
  }
  
  let summaryY = y;
  summaryFields.forEach((field, index) => {
    if (index > 0 && index % 2 === 0) {
      summaryY += 7;
    }
    const colX = index % 2 === 0 ? margin + 5 : margin + 100;
    
    doc.setFont('helvetica', 'bold');
    doc.text(field.label + ':', colX, summaryY);
    doc.setFont('helvetica', 'normal');
    doc.text(field.value, colX + (field.label.length * 2.5), summaryY);
    
    if (index % 2 === 1) {
      summaryY += 7;
    }
  });
  
  y = summaryY + 3;

  // ========== PICKUP & DELIVERY (TWO-COLUMN LAYOUT) ==========
  if (y > 230) {
    doc.addPage();
    y = margin;
  }

  const columnWidth = (contentWidth - 10) / 2; // Two columns with 10mm gap
  const locationHeight = 50;

  // Left: Pickup Location
  doc.setDrawColor(59, 130, 246);
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(margin, y, columnWidth, locationHeight, 3, 3, 'FD');
  
  let pickupY = y + 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PICKUP LOCATION', margin + 5, pickupY);
  
  pickupY += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  if (bol.pickup_name) {
    doc.text(String(bol.pickup_name), margin + 5, pickupY);
    pickupY += 6;
  }
  if (bol.pickup_address) {
    doc.text(String(bol.pickup_address), margin + 5, pickupY);
    pickupY += 6;
  }
  const pickupLocation = [
    bol.pickup_city,
    bol.pickup_state,
    bol.pickup_zip
  ].filter(Boolean).join(' – ');
  if (pickupLocation) {
    doc.text(pickupLocation, margin + 5, pickupY);
    pickupY += 6;
  }
  if (bol.pickup_phone) {
    doc.text(`Phone: ${bol.pickup_phone}`, margin + 5, pickupY);
  }

  // Right: Delivery Location
  doc.setDrawColor(59, 130, 246);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin + columnWidth + 10, y, columnWidth, locationHeight, 3, 3, 'FD');
  
  let deliveryY = y + 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('DELIVERY LOCATION', margin + columnWidth + 15, deliveryY);
  
  deliveryY += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  if (bol.delivery_name) {
    doc.text(String(bol.delivery_name), margin + columnWidth + 15, deliveryY);
    deliveryY += 6;
  }
  if (bol.delivery_address) {
    doc.text(String(bol.delivery_address), margin + columnWidth + 15, deliveryY);
    deliveryY += 6;
  }
  const deliveryLocation = [
    bol.delivery_city,
    bol.delivery_state,
    bol.delivery_zip
  ].filter(Boolean).join(' – ');
  if (deliveryLocation) {
    doc.text(deliveryLocation, margin + columnWidth + 15, deliveryY);
    deliveryY += 6;
  }
  if (bol.delivery_phone) {
    doc.text(`Phone: ${bol.delivery_phone}`, margin + columnWidth + 15, deliveryY);
  }

  y += locationHeight + 10;

  // ========== VEHICLE TABLE (PROFESSIONAL DESIGN) ==========
  if (y > 230) {
    doc.addPage();
    y = margin;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Vehicle Details', margin, y);
  y += 8;

  // Format vehicle prices as currency
  const vehicleTableData = bol.vehicles.map((v) => [
    v.year || '',
    v.make || '',
    v.model || '',
    v.vin || '',
    v.mileage || '0000',
    formatCurrency(v.price)
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Year', 'Make', 'Model', 'VIN', 'Mileage', 'Price']],
    body: vehicleTableData,
    theme: 'grid',
    headStyles: { 
      fillColor: [59, 130, 246], // Dark blue header
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [0, 0, 0]
    },
    columnStyles: {
      3: { cellWidth: 40, fontStyle: 'normal' }, // VIN - monospaced would be ideal but jsPDF doesn't support it well
      5: { halign: 'right' } // Price right-aligned
    },
    margin: { left: margin, right: margin },
    styles: { 
      lineColor: [200, 200, 200],
      lineWidth: 0.1
    }
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  // ========== CONDITION & REMARKS (TWO-BLOCK LAYOUT) ==========
  if (y > 230) {
    doc.addPage();
    y = margin;
  }

  const blockWidth = (contentWidth - 10) / 2;
  const blockHeight = 30;

  // Left: Condition Codes
  if (bol.condition_codes) {
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, blockWidth, blockHeight, 3, 3, 'FD');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Condition Codes:', margin + 5, y + 8);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(String(bol.condition_codes), margin + 5, y + 15, { maxWidth: blockWidth - 10 });
  }

  // Right: Remarks
  if (bol.remarks) {
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin + blockWidth + 10, y, blockWidth, blockHeight, 3, 3, 'FD');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Remarks:', margin + blockWidth + 15, y + 8);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(String(bol.remarks), margin + blockWidth + 15, y + 15, { maxWidth: blockWidth - 10 });
  }

  y += blockHeight + 12;

  // ========== SIGNATURE SECTION (TABLE FORMAT) ==========
  if (y > 200) {
    doc.addPage();
    y = margin;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Signatures', margin, y);
  y += 10;

  // Signature table data
  const signatureData: any[][] = [];
  
  // Pickup Agent
  signatureData.push([
    'Pickup Agent',
    String(bol.pickup_agent_name || ''),
    formatDate(bol.pickup_date),
    '' // Signature will be added as image
  ]);

  // Delivery Agent
  signatureData.push([
    'Delivery Agent',
    String(bol.delivery_agent_name || ''),
    formatDate(bol.delivery_date),
    ''
  ]);

  // Receiver (if exists)
  if (bol.receiver_agent_name || bol.receiver_signature || bol.receiver_date) {
    signatureData.push([
      'Receiver',
      String(bol.receiver_agent_name || ''),
      formatDate(bol.receiver_date),
      ''
    ]);
  }

  // Store signature data with row indices
  const signatureInfo: Array<{rowIndex: number, signature: string}> = [];
  
  // Collect signature data
  if (bol.pickup_signature) {
    signatureInfo.push({ rowIndex: 0, signature: bol.pickup_signature });
  }
  if (bol.delivery_signature) {
    signatureInfo.push({ rowIndex: 1, signature: bol.delivery_signature });
  }
  if (bol.receiver_agent_name || bol.receiver_signature || bol.receiver_date) {
    if (bol.receiver_signature) {
      signatureInfo.push({ rowIndex: 2, signature: bol.receiver_signature });
    }
  }

  // Calculate column widths - give more space to signature column
  const tableWidth = contentWidth;
  const roleWidth = 35;
  const nameWidth = 50;
  const dateWidth = 35;
  const signatureWidth = tableWidth - roleWidth - nameWidth - dateWidth - 10;

  // Define row heights - make signature rows taller
  const defaultRowHeight = 10; // Standard row height
  const signatureRowHeight = 30; // Increased height for rows with signatures

  // Store table start Y position for manual calculation
  const tableStartY = y;
  const headerRowHeight = 8; // Approximate header row height

  // Store row positions as we draw them
  const rowPositions: Array<{rowIndex: number, y: number, height: number, cellX?: number, cellWidth?: number}> = [];

  autoTable(doc, {
    startY: y,
    head: [['Role', 'Name', 'Date', 'Signature']],
    body: signatureData,
    theme: 'grid',
    headStyles: { 
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
      cellPadding: { top: 4, bottom: 4, left: 2, right: 2 }
    },
    bodyStyles: {
      fontSize: 9,
      minCellHeight: signatureRowHeight,
      cellPadding: { top: 5, bottom: 5, left: 2, right: 2 } // Increased padding
    },
    columnStyles: {
      0: { cellWidth: roleWidth },
      1: { cellWidth: nameWidth },
      2: { cellWidth: dateWidth },
      3: { 
        cellWidth: signatureWidth, 
        cellPadding: { top: 5, bottom: 5, left: 2, right: 2 }, // Increased padding
        minCellHeight: signatureRowHeight
      }
    },
    margin: { left: margin, right: margin },
    styles: { 
      lineColor: [200, 200, 200],
      lineWidth: 0.1
    },
    didParseCell: function (data: any) {
      // Set row height for signature rows
      if (data.row.index >= 0 && data.column.index === 3) {
        const rowIndex = data.row.index;
        const hasSignature = signatureInfo.some(sig => sig.rowIndex === rowIndex);
        if (hasSignature) {
          data.row.height = signatureRowHeight;
        }
      }
    },
    didDrawCell: function (data: any) {
      // Capture row positions for signature column cells
      if (data.column.index === 3 && data.row.index >= 0) {
        const rowIndex = data.row.index;
        const hasSignature = signatureInfo.some(sig => sig.rowIndex === rowIndex);
        
        // Only store if this row has a signature and we haven't stored it yet
        if (hasSignature && !rowPositions.find(r => r.rowIndex === rowIndex)) {
          // data.cell.y is the Y position of the cell content area
          // We need to ensure we're capturing the actual cell top, not overlapping with header
          rowPositions.push({
            rowIndex: rowIndex,
            y: data.cell.y,
            height: signatureRowHeight,
            cellX: data.cell.x,
            cellWidth: data.cell.width
          });
        }
      }
    }
  });

  // Add signature images after table is drawn, using captured row positions
  signatureInfo.forEach((sigInfo) => {
    try {
      const rowPos = rowPositions.find(r => r.rowIndex === sigInfo.rowIndex);
      if (!rowPos) {
        console.warn(`Row position not found for signature row ${sigInfo.rowIndex}`);
        return;
      }
      
      // Use captured cell position
      const signatureColX = (rowPos.cellX || (margin + roleWidth + nameWidth + dateWidth)) + 2;
      const cellWidth = rowPos.cellWidth || signatureWidth;
      
      // Calculate Y position - ensure signature stays within cell bounds
      // For the first row (pickup agent), we need significant padding to avoid header overlap
      const isFirstRow = sigInfo.rowIndex === 0;
      const topPadding = isFirstRow ? 10 : 6; // Much more padding for first row
      const bottomPadding = 6;
      
      // The cell.y from autoTable should be the top of the cell content area
      // But we need to ensure we're well below any header overlap
      const cellContentTopY = rowPos.y;
      const cellContentBottomY = cellContentTopY + rowPos.height;
      
      // Calculate available height for signature (within cell content area)
      const availableHeight = rowPos.height - topPadding - bottomPadding;
      
      // For first row, start signature lower to avoid header
      const signatureStartY = cellContentTopY + topPadding;
      const cellContentCenterY = cellContentTopY + topPadding + (availableHeight / 2);
      
      const base64Data = sigInfo.signature.split(',')[1] || sigInfo.signature;
      const maxWidth = cellWidth - 4; // Leave horizontal padding
      const maxHeight = availableHeight; // Use available height
      
      // Scale signature to fit within cell while maintaining aspect ratio
      const imgWidth = Math.min(maxWidth, 85);
      const imgHeight = Math.min(maxHeight, 20); // Reduced max height to ensure fit
      
      // Position signature - for first row, use signatureStartY, for others center
      let imgY;
      if (isFirstRow) {
        // For first row, position signature starting from topPadding to avoid header
        imgY = signatureStartY;
      } else {
        // For other rows, center the signature
        imgY = cellContentCenterY - (imgHeight / 2);
      }
      
      // Ensure signature doesn't exceed cell bottom
      const maxY = cellContentBottomY - bottomPadding - imgHeight;
      const finalY = Math.min(imgY, maxY);
      
      // Final safety check: ensure we're not overlapping header (first row should be at least 10mm from table start)
      const tableStartY = y;
      const headerRowHeight = 8;
      const minSafeY = tableStartY + headerRowHeight + 10; // 10mm below header
      const safeFinalY = isFirstRow ? Math.max(finalY, minSafeY) : finalY;
      
      doc.addImage(base64Data, 'PNG', signatureColX, safeFinalY, imgWidth, imgHeight);
    } catch (err) {
      console.error('Error adding signature:', err);
    }
  });

  y = (doc as any).lastAutoTable.finalY + 15;

  // ========== FOOTER ==========
  // Add footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Footer line
    const footerY = 287; // Near bottom of A4 page
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, footerY, pageWidth - margin, footerY);
    
    // Footer text
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'This document was generated by Ideal Transportation Solutions LLC',
      pageWidth / 2,
      footerY + 5,
      { align: 'center' }
    );
    doc.text(
      'www.idealtransportationsolutions.com',
      pageWidth / 2,
      footerY + 9,
      { align: 'center' }
    );
    
    // Page number
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - margin,
      footerY + 9,
      { align: 'right' }
    );
  }

  // Save the PDF
  doc.save(`BillOfLading_${bol.work_order_no || bol.id}.pdf`);
}
