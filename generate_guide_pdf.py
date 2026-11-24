import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont('Helvetica', 9)
        self.setFillColor(colors.HexColor('#64748b'))
        self.drawString(54, 36, 'MEDWATCH — Technical & Operational System Architecture Overview')
        page_str = f'Page {self._pageNumber} of {page_count}'
        self.drawRightString(612 - 54, 36, page_str)
        self.restoreState()

def build_pdf(filepath):
    doc = SimpleDocTemplate(
        filepath,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#0f172a')
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=16,
        textColor=colors.HexColor('#475569')
    )
    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor('#1e3a8a'),
        spaceBefore=12,
        spaceAfter=5
    )
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor('#1e293b')
    )
    bullet_style = ParagraphStyle(
        'Bullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13.5,
        textColor=colors.HexColor('#1e293b'),
        leftIndent=15
    )
    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#0f172a')
    )
    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12.5,
        textColor=colors.white
    )

    elements = []

    # Title & Header
    elements.append(Paragraph('MEDWATCH Platform Core Guide', title_style))
    elements.append(Paragraph('Technical Q&A: Search Engine, User Roles, Alerts, Mobile vs Web, CDSCO Pipeline & Barcode Verification', subtitle_style))
    elements.append(Spacer(1, 8))
    elements.append(HRFlowable(width='100%', thickness=1.5, color=colors.HexColor('#2563eb'), spaceAfter=10))

    # SECTION 1
    elements.append(Paragraph('1. How Does Drug Search Actually Work?', h1_style))
    elements.append(Paragraph('MEDWATCH verifies drug batches through an exact-first, fuzzy-fallback algorithm ensuring no false approvals are rendered:', body_style))
    elements.append(Spacer(1, 4))
    
    search_steps = [
        '<b>Step 1 — Input Verification:</b> The user enters Batch Number + Drug Name (both required for specific lot identification).',
        '<b>Step 2 — Exact Database Query:</b> The system queries the PostgreSQL database matching indexed batch_no and brand/generic name across verified lab failure records.',
        '<b>Step 3 — Fuzzy Fallback Match:</b> If an exact drug name is not matched, the PostgreSQL <code>pg_trgm</code> module computes trigram similarities (>0.3) to display "Did you mean?" suggestions for typos.',
        '<b>Step 4 — Result Classification:</b> Returns one of 6 strict legal labels: <b>NSQ FOUND</b>, <b>SPURIOUS DRUG</b>, <b>ADULTERATED</b>, <b>MISBRANDED</b>, <b>NO ADVERSE REPORT FOUND</b>, or <b>DATA UNAVAILABLE</b>.',
        '<b>Step 5 — Search Audit Logging:</b> Every query records timestamp, searched terms, IP, and outcome in <code>SearchLog</code> for analytical reporting.'
    ]
    for s in search_steps:
        elements.append(Paragraph(f'&bull; {s}', bullet_style))
        elements.append(Spacer(1, 2))
    elements.append(Spacer(1, 8))

    # SECTION 2
    elements.append(Paragraph('2. Who Are the Different Types of Users?', h1_style))
    elements.append(Paragraph('MEDWATCH implements Role-Based Access Control (RBAC) separating public inquiry from regulatory curation:', body_style))
    elements.append(Spacer(1, 4))

    roles_data = [
        [Paragraph('User Role', table_header), Paragraph('Target Persona', table_header), Paragraph('System Entitlements', table_header)],
        [Paragraph('<b>Anonymous Citizen</b>', table_cell), Paragraph('Public users, patients, families', table_cell), Paragraph('Single batch lookups; zero login friction; no personal logs retained.', table_cell)],
        [Paragraph('<b>Registered Citizen</b>', table_cell), Paragraph('Chronic patients, regular buyers', table_cell), Paragraph('Secure SMS OTP login; saved search history; customized drug safety alerts.', table_cell)],
        [Paragraph('<b>Data Uploader</b>', table_cell), Paragraph('Lab assistants, clerical staff', table_cell), Paragraph('Uploads batch failure CSVs and drafts entries into a staging quarantine.', table_cell)],
        [Paragraph('<b>Data Approver</b>', table_cell), Paragraph('Senior Drug Control Officers / Chemists', table_cell), Paragraph('Reviews quarantine records, verifies lab report certificates, commits to live DB.', table_cell)],
        [Paragraph('<b>Department Officer</b>', table_cell), Paragraph('Regulatory liaison officers', table_cell), Paragraph('Uploads legal circulars, recall notifications, and stop-sale enforcement orders.', table_cell)],
        [Paragraph('<b>Super Administrator</b>', table_cell), Paragraph('System Engineers / Technical Leads', table_cell), Paragraph('Platform control, administrative audit logs, pipeline configuration, and mass alerts.', table_cell)]
    ]
    t_roles = Table(roles_data, colWidths=[110, 130, 264])
    t_roles.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e3a8a')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#f8fafc'), colors.white]),
    ]))
    elements.append(t_roles)
    elements.append(Spacer(1, 8))

    # SECTION 3
    elements.append(Paragraph('3. How Do Notifications & Alerts Work?', h1_style))
    elements.append(Paragraph('When a drug is officially declared Not of Standard Quality (NSQ) or Spurious, the alert engine triggers an automated broadcast:', body_style))
    elements.append(Spacer(1, 4))

    notif_points = [
        '<b>Two-Step Administrative Sign-off:</b> Drafted by a Drug Inspector/Uploader & approved by a Senior Approver before public dissemination.',
        '<b>Multi-Channel Dispatch:</b> Delivered instantaneously using <b>Firebase Cloud Messaging (FCM)</b> for mobile apps, Web Push APIs for browsers, and SMTP for verified emails.',
        '<b>Targeted Geographical Filtering:</b> Alerts can broadcast statewide or target specific high-risk districts where affected batches were distributed.',
        '<b>Regulatory DLT Compliance:</b> OTP logins and SMS advisories adhere strictly to TRAI Distributed Ledger Technology (DLT) regulations in India.'
    ]
    for np in notif_points:
        elements.append(Paragraph(f'&bull; {np}', bullet_style))
        elements.append(Spacer(1, 2))
    elements.append(Spacer(1, 8))

    # SECTION 4
    elements.append(Paragraph('4. Mobile App vs. Website — What Are the Differences?', h1_style))
    elements.append(Paragraph('Both clients interact with the identical Django REST Framework API, but each is optimized for specific form factors:', body_style))
    elements.append(Spacer(1, 4))

    client_data = [
        [Paragraph('Feature Aspect', table_header), Paragraph('Web Portal (Next.js)', table_header), Paragraph('Mobile App (Flutter)', table_header)],
        [Paragraph('<b>Primary Audience</b>', table_cell), Paragraph('Desktop users, pharmacy counters, public searches', table_cell), Paragraph('Consumers on the go, pharmacy staff, field inspectors', table_cell)],
        [Paragraph('<b>Deployment</b>', table_cell), Paragraph('Immediate web access via any modern browser', table_cell), Paragraph('Android APK / Play Store / iOS App Store distribution', table_cell)],
        [Paragraph('<b>Barcode / QR Scan</b>', table_cell), Paragraph('Webcam scanning via HTML5 Camera APIs', table_cell), Paragraph('Native hardware camera acceleration (Barcode + 2D QR)', table_cell)],
        [Paragraph('<b>Push Notifications</b>', table_cell), Paragraph('Browser Web Push (Active browser session required)', table_cell), Paragraph('System background lockscreen push notifications via FCM', table_cell)],
        [Paragraph('<b>Offline Capability</b>', table_cell), Paragraph('Browser sessionStorage cache only', table_cell), Paragraph('Local encrypted SQLite database caching previous searches', table_cell)]
    ]
    t_client = Table(client_data, colWidths=[110, 190, 204])
    t_client.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f766e')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#f0fdfa'), colors.white]),
    ]))
    elements.append(t_client)
    elements.append(Spacer(1, 8))

    # SECTION 5
    elements.append(Paragraph('5. How Does CDSCO & State Lab Data Get Imported?', h1_style))
    elements.append(Paragraph('CDSCO publishes monthly PDF lists of tested failures. MEDWATCH ingests this data automatically:', body_style))
    elements.append(Spacer(1, 4))

    etl_points = [
        '<b>Automated Web Ingestion:</b> A Celery background worker periodically checks <code>cdsco.gov.in</code> for new monthly PDF releases.',
        '<b>Tabular Data Parsing:</b> Extracted using <code>pdfplumber</code> and <code>tabula-py</code>, mapping batch IDs, brand names, generic formulations, and manufacturers.',
        '<b>OCR Fallback Engine:</b> For scanned image documents, pages pass through <b>Tesseract OCR</b> to preserve ingestion accuracy.',
        '<b>Quarantine Staging Area:</b> Parsed entries land in a staging table marked <code>Pending Approval</code> until a department officer confirms validity.',
        '<b>Production Publication:</b> Once approved, records become searchable instantly, and automatic alert queues are triggered.'
    ]
    for ep in etl_points:
        elements.append(Paragraph(f'&bull; {ep}', bullet_style))
        elements.append(Spacer(1, 2))
    elements.append(Spacer(1, 8))

    # SECTION 6
    elements.append(Paragraph('6. Packaging Identifiers: 1D Barcodes vs. 2D QR Codes on Medicine', h1_style))
    elements.append(Paragraph('Crucial technical differentiation regarding packaging identification on Indian pharmaceuticals:', body_style))
    elements.append(Spacer(1, 4))

    barcode_data = [
        [Paragraph('Identifier Format', table_header), Paragraph('Embedded Information', table_header), Paragraph('MEDWATCH System Handling', table_header)],
        [
            Paragraph('<b>1D Linear Barcode</b><br/><font color=\"#64748b\">Standard EAN-13 / UPC lines</font>', table_cell),
            Paragraph('Product GTIN representing <b>Brand & Formulation only</b>. Exactly identical on every batch manufactured.', table_cell),
            Paragraph('<b>Partial auto-fill:</b> Scanner identifies Drug Name and Manufacturer; user types or confirms the batch number.', table_cell)
        ],
        [
            Paragraph('<b>2D QR / GS1 DataMatrix</b><br/><font color=\"#64748b\">Square matrix grid (Govt standard)</font>', table_cell),
            Paragraph('Product GTIN + <b>Specific Batch Number</b> + Expiry Date + Unique Serial Number.', table_cell),
            Paragraph('<b>Zero typing:</b> Full Batch Number and Drug Name extracted instantly for 1-click verification.', table_cell)
        ]
    ]
    t_bc = Table(barcode_data, colWidths=[120, 184, 200])
    t_bc.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#334155')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#f8fafc'), colors.white]),
    ]))
    elements.append(t_bc)

    doc.build(elements, canvasmaker=NumberedCanvas)
    print(f'Successfully built: {filepath}')

if __name__ == '__main__':
    desktop = os.path.join(os.environ.get('USERPROFILE', 'C:\\Users\\ADMIN'), 'Desktop', 'MEDWATCH_System_Core_Guide.pdf')
    medwatch_dir = os.path.join('d:\\medwatch', 'MEDWATCH_System_Core_Guide.pdf')
    build_pdf(desktop)
    build_pdf(medwatch_dir)
