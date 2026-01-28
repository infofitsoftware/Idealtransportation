"""
PDF generation utility for BOL reports
This module provides server-side PDF generation using ReportLab
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from io import BytesIO
from typing import Optional
from datetime import datetime
import base64
import os

def format_date(date_str: Optional[str]) -> str:
    """Format date string to DD-MM-YYYY"""
    if not date_str:
        return ""
    try:
        date_obj = datetime.strptime(date_str, '%Y-%m-%d')
        return date_obj.strftime('%d-%m-%Y')
    except:
        return date_str

def format_currency(amount: Optional[float]) -> str:
    """Format amount as currency"""
    if amount is None:
        return "$0.00"
    return f"${amount:,.2f}"

def generate_bol_pdf(bol_data: dict) -> BytesIO:
    """
    Generate BOL PDF from BOL data dictionary
    Returns BytesIO buffer containing PDF
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, 
                            leftMargin=15*mm, rightMargin=15*mm,
                            topMargin=15*mm, bottomMargin=15*mm)
    
    # Container for PDF elements
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=14,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=6,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=11,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=4,
        fontName='Helvetica-Bold'
    )
    
    # Header Section
    # Try to load logo
    logo_path = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'logo_ideal.png')
    logo_data = None
    if os.path.exists(logo_path):
        try:
            logo_data = Image(logo_path, width=35*mm, height=18*mm)
        except:
            pass
    
    # Company header - create a simple layout
    header_elements = []
    
    # Logo (if available)
    if logo_data:
        header_elements.append(logo_data)
    
    # Company info and BOL info in a table
    company_info = Paragraph(
        "<b>IDEAL TRANSPORTATION SOLUTIONS LLC</b><br/>"
        "16 Palmero Way, Manvel, Texas 77578<br/>"
        "USDOT No: 4193929",
        styles['Normal']
    )
    
    bol_info = Paragraph(
        f"<b>BILL OF LADING</b><br/>"
        f"BOL No: {bol_data.get('work_order_no', bol_data.get('id', ''))}<br/>"
        f"Generated: {format_date(datetime.now().strftime('%Y-%m-%d'))}",
        styles['Normal']
    )
    
    header_table = Table([
        [logo_data if logo_data else "", company_info, bol_info]
    ], colWidths=[40*mm, 100*mm, 70*mm])
    
    header_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    
    elements.append(header_table)
    elements.append(Spacer(1, 5*mm))
    
    # Divider line
    elements.append(Spacer(1, 2*mm))
    
    # Shipment Summary Card
    summary_data = [
        ['Driver', bol_data.get('driver_name', '')],
        ['Work Order No', bol_data.get('work_order_no', 'N/A')],
        ['Date', format_date(bol_data.get('date'))],
    ]
    
    if bol_data.get('broker_name'):
        summary_data.append(['Broker', bol_data.get('broker_name', '')])
    if bol_data.get('broker_phone'):
        summary_data.append(['Broker Phone', bol_data.get('broker_phone', '')])
    
    summary_table = Table(summary_data, colWidths=[50*mm, 130*mm])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#1e40af')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#3b82f6')),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    
    elements.append(summary_table)
    elements.append(Spacer(1, 5*mm))
    
    # Pickup & Delivery (Two-column layout)
    pickup_data = [
        ['PICKUP LOCATION'],
        [bol_data.get('pickup_name', '')],
        [bol_data.get('pickup_address', '')],
        [f"{bol_data.get('pickup_city', '')} – {bol_data.get('pickup_state', '')} {bol_data.get('pickup_zip', '')}"],
        [f"Phone: {bol_data.get('pickup_phone', '')}"]
    ]
    
    delivery_data = [
        ['DELIVERY LOCATION'],
        [bol_data.get('delivery_name', '')],
        [bol_data.get('delivery_address', '')],
        [f"{bol_data.get('delivery_city', '')} – {bol_data.get('delivery_state', '')} {bol_data.get('delivery_zip', '')}"],
        [f"Phone: {bol_data.get('delivery_phone', '')}"]
    ]
    
    pickup_table = Table(pickup_data, colWidths=[85*mm])
    pickup_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), colors.HexColor('#eff6ff')),
        ('TEXTCOLOR', (0, 0), (0, 0), colors.HexColor('#1e40af')),
        ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (0, 0), 11),
        ('FONTSIZE', (0, 1), (0, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#3b82f6')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    
    delivery_table = Table(delivery_data, colWidths=[85*mm])
    delivery_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), colors.HexColor('#f8fafc')),
        ('TEXTCOLOR', (0, 0), (0, 0), colors.HexColor('#1e40af')),
        ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (0, 0), 11),
        ('FONTSIZE', (0, 1), (0, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#3b82f6')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    
    location_table = Table([[pickup_table, delivery_table]], colWidths=[90*mm, 90*mm])
    location_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    
    elements.append(location_table)
    elements.append(Spacer(1, 5*mm))
    
    # Vehicle Table
    vehicles = bol_data.get('vehicles', [])
    vehicle_headers = ['Year', 'Make', 'Model', 'VIN', 'Mileage', 'Price']
    vehicle_rows = [vehicle_headers]
    
    for vehicle in vehicles:
        vehicle_rows.append([
            vehicle.get('year', ''),
            vehicle.get('make', ''),
            vehicle.get('model', ''),
            vehicle.get('vin', ''),
            vehicle.get('mileage', '0000'),
            format_currency(float(vehicle.get('price', 0)) if vehicle.get('price') else 0)
        ])
    
    vehicle_table = Table(vehicle_rows, colWidths=[20*mm, 25*mm, 25*mm, 40*mm, 20*mm, 30*mm])
    vehicle_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.1, colors.HexColor('#c8c8c8')),
        ('ALIGN', (5, 0), (5, -1), 'RIGHT'),  # Price right-aligned
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 3),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    
    elements.append(Paragraph("<b>Vehicle Details</b>", heading_style))
    elements.append(vehicle_table)
    elements.append(Spacer(1, 5*mm))
    
    # Condition & Remarks (Two-block layout)
    condition_remarks_data = []
    if bol_data.get('condition_codes'):
        condition_remarks_data.append(['Condition Codes:', bol_data.get('condition_codes', '')])
    if bol_data.get('remarks'):
        condition_remarks_data.append(['Remarks:', bol_data.get('remarks', '')])
    
    if condition_remarks_data:
        condition_remarks_table = Table(condition_remarks_data, colWidths=[90*mm, 90*mm])
        condition_remarks_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#c8c8c8')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(condition_remarks_table)
        elements.append(Spacer(1, 5*mm))
    
    # Signature Section
    signature_headers = ['Role', 'Name', 'Date', 'Signature']
    signature_rows = [signature_headers]
    
    # Helper function to process signature images
    def process_signature(signature_data: Optional[str], max_width: float = 80*mm, max_height: float = 20*mm):
        """Process base64 signature and return Image object"""
        if not signature_data:
            return None
        try:
            if isinstance(signature_data, str):
                # Handle base64 image
                if ',' in signature_data:
                    signature_data = signature_data.split(',')[1]
                img_data = base64.b64decode(signature_data)
                return Image(BytesIO(img_data), width=max_width, height=max_height)
        except Exception as e:
            print(f"Error processing signature: {e}")
        return None
    
    # Pickup Agent
    pickup_signature_img = process_signature(bol_data.get('pickup_signature'))
    signature_rows.append([
        'Pickup Agent',
        bol_data.get('pickup_agent_name', ''),
        format_date(bol_data.get('pickup_date')),
        pickup_signature_img if pickup_signature_img else ''
    ])
    
    # Delivery Agent
    delivery_signature_img = process_signature(bol_data.get('delivery_signature'))
    signature_rows.append([
        'Delivery Agent',
        bol_data.get('delivery_agent_name', ''),
        format_date(bol_data.get('delivery_date')),
        delivery_signature_img if delivery_signature_img else ''
    ])
    
    # Receiver (if exists)
    if bol_data.get('receiver_agent_name') or bol_data.get('receiver_signature') or bol_data.get('receiver_date'):
        receiver_signature_img = process_signature(bol_data.get('receiver_signature'))
        signature_rows.append([
            'Receiver',
            bol_data.get('receiver_agent_name', ''),
            format_date(bol_data.get('receiver_date')),
            receiver_signature_img if receiver_signature_img else ''
        ])
    
    # Calculate column widths
    role_width = 35*mm
    name_width = 50*mm
    date_width = 35*mm
    signature_width = 180*mm - role_width - name_width - date_width
    
    signature_table = Table(signature_rows, colWidths=[role_width, name_width, date_width, signature_width])
    signature_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.1, colors.HexColor('#c8c8c8')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 3),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3),
        ('TOPPADDING', (0, 0), (-1, 0), 4),  # Header row padding
        ('BOTTOMPADDING', (0, 0), (-1, 0), 4),  # Header row padding
        ('TOPPADDING', (0, 1), (-1, 1), 12),  # Extra top padding for first body row (pickup agent)
        ('BOTTOMPADDING', (0, 1), (-1, 1), 8),  # Bottom padding for first body row
        ('TOPPADDING', (0, 2), (-1, -1), 8),  # Top padding for other body rows
        ('BOTTOMPADDING', (0, 2), (-1, -1), 8),  # Bottom padding for other body rows
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white] * (len(signature_rows) - 1)),  # White background for body rows
    ]))
    
    elements.append(Paragraph("<b>Signatures</b>", heading_style))
    elements.append(signature_table)
    
    # Build PDF
    doc.build(elements, onFirstPage=add_footer, onLaterPages=add_footer)
    
    buffer.seek(0)
    return buffer

def add_footer(canvas_obj, doc):
    """Add footer to each page"""
    canvas_obj.saveState()
    canvas_obj.setFont('Helvetica', 7)
    
    # Footer line
    canvas_obj.setStrokeColor(colors.HexColor('#c8c8c8'))
    canvas_obj.line(15*mm, 20*mm, 195*mm, 20*mm)
    
    # Footer text
    canvas_obj.drawCentredString(105*mm, 25*mm, 
                                'This document was generated by Ideal Transportation Solutions LLC')
    canvas_obj.drawCentredString(105*mm, 29*mm, 
                                'www.idealtransportationsolutions.com')
    
    # Page number
    page_num = canvas_obj.getPageNumber()
    canvas_obj.drawRightString(195*mm, 29*mm, f'Page {page_num}')
    
    canvas_obj.restoreState()
