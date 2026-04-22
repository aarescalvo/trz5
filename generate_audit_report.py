#!/usr/bin/env python3
"""
Auditoria Completa - TRZ5 (Solemar Alimentaria)
Reporte de Inconsistencias Encontradas y Propuestas de Accion
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, black, white, red, Color
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable
)
from reportlab.platypus.flowables import Flowable
from reportlab.lib import colors
import os
from datetime import datetime

# ── Colors ──
PRIMARY = HexColor('#1e3a5f')
SECONDARY = HexColor('#2d6a4f')
ACCENT_RED = HexColor('#dc2626')
ACCENT_ORANGE = HexColor('#ea580c')
ACCENT_YELLOW = HexColor('#ca8a04')
ACCENT_GREEN = HexColor('#16a34a')
BG_LIGHT = HexColor('#f8fafc')
BG_RED = HexColor('#fef2f2')
BG_ORANGE = HexColor('#fff7ed')
BG_YELLOW = HexColor('#fefce8')
BG_GREEN = HexColor('#f0fdf4')
BORDER_RED = HexColor('#fca5a5')
BORDER_ORANGE = HexColor('#fdba74')
BORDER_YELLOW = HexColor('#fde047')
BORDER_GREEN = HexColor('#86efac')
TEXT_DARK = HexColor('#1e293b')
TEXT_MUTED = HexColor('#64748b')

OUTPUT = '/home/z/my-project/download/auditoria_trz5.pdf'

# ── Styles ──
styles = getSampleStyleSheet()

title_style = ParagraphStyle('CustomTitle', parent=styles['Title'],
    fontSize=28, leading=34, textColor=PRIMARY,
    fontName='Helvetica-Bold', spaceAfter=6, alignment=TA_LEFT)

subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'],
    fontSize=14, leading=18, textColor=TEXT_MUTED,
    fontName='Helvetica', spaceAfter=12, alignment=TA_LEFT)

h1_style = ParagraphStyle('H1', parent=styles['Heading1'],
    fontSize=20, leading=26, textColor=PRIMARY,
    fontName='Helvetica-Bold', spaceBefore=18, spaceAfter=10,
    borderWidth=0, borderPadding=0)

h2_style = ParagraphStyle('H2', parent=styles['Heading2'],
    fontSize=16, leading=20, textColor=SECONDARY,
    fontName='Helvetica-Bold', spaceBefore=14, spaceAfter=8)

h3_style = ParagraphStyle('H3', parent=styles['Heading3'],
    fontSize=13, leading=17, textColor=TEXT_DARK,
    fontName='Helvetica-Bold', spaceBefore=10, spaceAfter=6)

body_style = ParagraphStyle('Body', parent=styles['Normal'],
    fontSize=10, leading=15, textColor=TEXT_DARK,
    fontName='Helvetica', spaceAfter=6, alignment=TA_JUSTIFY)

code_style = ParagraphStyle('Code', parent=styles['Code'],
    fontSize=8.5, leading=12, textColor=HexColor('#334155'),
    fontName='Courier', backColor=HexColor('#f1f5f9'),
    borderWidth=0.5, borderColor=HexColor('#cbd5e1'),
    borderPadding=6, spaceAfter=8, spaceBefore=4,
    leftIndent=10)

badge_style = ParagraphStyle('Badge', parent=styles['Normal'],
    fontSize=8, leading=10, fontName='Helvetica-Bold',
    textColor=white, alignment=TA_CENTER)

footer_style = ParagraphStyle('Footer', parent=styles['Normal'],
    fontSize=8, leading=10, textColor=TEXT_MUTED,
    fontName='Helvetica', alignment=TA_CENTER)

# ── Helper: Severity badge ──
def sev_badge(severity):
    colors_map = {
        'CRITICA': (ACCENT_RED, BG_RED, BORDER_RED),
        'ALTA': (ACCENT_ORANGE, BG_ORANGE, BORDER_ORANGE),
        'MEDIA': (ACCENT_YELLOW, BG_YELLOW, BORDER_YELLOW),
        'BAJA': (ACCENT_GREEN, BG_GREEN, BORDER_GREEN),
    }
    fg, bg, border = colors_map.get(severity, (TEXT_MUTED, BG_LIGHT, TEXT_MUTED))
    data = [[Paragraph(f'<font color="{fg.hexval()}">{severity}</font>', badge_style)]]
    t = Table(data, colWidths=[70])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg),
        ('BOX', (0,0), (-1,-1), 1, border),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ]))
    return t

# ── Helper: Issue card ──
def issue_card(severity, title, file, description, fix):
    """Returns a list of flowables for one issue."""
    elements = []
    
    # Header row with badge + title
    badge = sev_badge(severity)
    title_p = Paragraph(f'<b>{title}</b>', ParagraphStyle('CardTitle',
        fontSize=11, leading=14, textColor=TEXT_DARK, fontName='Helvetica-Bold'))
    
    header_data = [[badge, title_p]]
    header_table = Table(header_data, colWidths=[80, 380])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    elements.append(header_table)
    
    # File path
    elements.append(Paragraph(f'<font color="{TEXT_MUTED.hexval()}">Archivo: <font face="Courier" size="9">{file}</font></font>',
        ParagraphStyle('FilePath', fontSize=9, leading=13, textColor=TEXT_MUTED, fontName='Helvetica',
            spaceBefore=2, spaceAfter=4)))
    
    # Description
    elements.append(Paragraph(description, ParagraphStyle('CardDesc',
        fontSize=10, leading=14, textColor=TEXT_DARK, fontName='Helvetica',
        spaceAfter=6, alignment=TA_JUSTIFY)))
    
    # Fix proposal
    fix_p = Paragraph(f'<b>Propuesta:</b> {fix}', ParagraphStyle('CardFix',
        fontSize=9.5, leading=13, textColor=SECONDARY, fontName='Helvetica',
        backColor=BG_GREEN, borderWidth=0.5, borderColor=BORDER_GREEN,
        borderPadding=8, spaceAfter=10))
    elements.append(fix_p)
    
    return elements

# ── Page number callback ──
def add_page_number(canvas, doc):
    canvas.saveState()
    # Footer line
    canvas.setStrokeColor(HexColor('#e2e8f0'))
    canvas.setLineWidth(0.5)
    canvas.line(50, 40, A4[0] - 50, 40)
    # Page number
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawCentredString(A4[0] / 2, 25,
        f'Auditoria TRZ5 - Solemar Alimentaria | Pagina {doc.page}')
    canvas.restoreState()

# ── Build document ──
doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=A4,
    leftMargin=50,
    rightMargin=50,
    topMargin=50,
    bottomMargin=55,
)

story = []
page_width = A4[0] - 100  # available width

# ═══════════════════════════════════════════════════════════
# COVER PAGE
# ═══════════════════════════════════════════════════════════
story.append(Spacer(1, 60))
story.append(HRFlowable(width="100%", thickness=3, color=PRIMARY, spaceAfter=20))
story.append(Paragraph('Auditoria de Codigo', title_style))
story.append(Paragraph('TRZ5 - Sistema de Gestion Frigorifica', subtitle_style))
story.append(HRFlowable(width="40%", thickness=1, color=SECONDARY, spaceAfter=30))

cover_info = [
    ['Proyecto:', 'TRZ5 - Solemar Alimentaria'],
    ['Repositorio:', 'github.com/aarescalvo/trz5'],
    ['Rama:', 'master'],
    ['Fecha:', datetime.now().strftime('%d/%m/%Y')],
    ['Alcance:', 'Auditoria completa de inconsistencias'],
    ['Tecnologia:', 'Next.js 16 + Prisma ORM + PostgreSQL'],
]
cover_table = Table(cover_info, colWidths=[120, page_width - 120])
cover_table.setStyle(TableStyle([
    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
    ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
    ('FONTSIZE', (0, 0), (-1, -1), 10),
    ('TEXTCOLOR', (0, 0), (0, -1), PRIMARY),
    ('TEXTCOLOR', (1, 0), (1, -1), TEXT_DARK),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
    ('ALIGN', (1, 0), (1, -1), 'LEFT'),
    ('LEFTPADDING', (1, 0), (1, -1), 12),
]))
story.append(cover_table)

story.append(Spacer(1, 40))

# Summary box
summary_data = [
    [Paragraph('<b>Resumen Ejecutivo</b>', ParagraphStyle('SH', fontSize=12, leading=16,
        textColor=white, fontName='Helvetica-Bold'))],
    [Paragraph(
        'Se realizo una auditoria completa del codigo fuente del sistema TRZ5, comparando '
        'sistematicamente los campos utilizados en los API routes y componentes frontend contra '
        'el esquema Prisma como fuente de verdad. Se auditaron 36+ API routes y 15+ componentes '
        'frontend. Se encontraron <b>2 bugs criticos</b> que causan errores en tiempo de ejecucion, '
        '<b>1 bug de alta severidad</b> que permite validacion incorrecta, <b>1 issue de severidad '
        'media</b> con datos faltantes, y <b>1 issue de baja severidad</b>. Los modulos C2 '
        '(despostada, cuarteo, empaque, expedicion) no presentaron inconsistencias.',
        ParagraphStyle('SD', fontSize=10, leading=15, textColor=TEXT_DARK,
            fontName='Helvetica', alignment=TA_JUSTIFY))],
]
summary_table = Table(summary_data, colWidths=[page_width])
summary_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (0, 0), PRIMARY),
    ('BACKGROUND', (0, 1), (0, 1), BG_LIGHT),
    ('TOPPADDING', (0, 0), (-1, -1), 10),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ('LEFTPADDING', (0, 0), (-1, -1), 14),
    ('RIGHTPADDING', (0, 0), (-1, -1), 14),
    ('BOX', (0, 0), (-1, -1), 1, PRIMARY),
]))
story.append(summary_table)

story.append(PageBreak())

# ═══════════════════════════════════════════════════════════
# TABLE OF CONTENTS
# ═══════════════════════════════════════════════════════════
story.append(Paragraph('Indice', h1_style))
story.append(Spacer(1, 10))

toc_items = [
    '1. Metodologia de Auditoria',
    '2. Hallazgos por Severidad',
    '   2.1 CRITICA - Bug #1: Insumos PUT - Campos Fantasma',
    '   2.2 CRITICA - Bug #2: Despachos PUT - Campo Fantasma fechaEntrega',
    '   2.3 ALTA - Bug #3: Pesaje Camion - Validacion contra Modelo Incorrecto',
    '   2.4 MEDIA - Issue #4: Despachos - Datos Denormalizados Faltantes',
    '   2.5 BAJA - Issue #5: Decomisos - Campo pesoKg Sin Uso',
    '3. Modulos Auditados (Sin Problemas)',
    '4. Resumen de Acciones Recomendadas',
    '5. Archivos Corregidos Previamente',
]
for item in toc_items:
    indent = 20 if item.startswith('   ') else 0
    story.append(Paragraph(item.strip(), ParagraphStyle('TOCItem',
        fontSize=10, leading=18, textColor=TEXT_DARK, fontName='Helvetica',
        leftIndent=indent, spaceAfter=2)))

story.append(PageBreak())

# ═══════════════════════════════════════════════════════════
# 1. METODOLOGIA
# ═══════════════════════════════════════════════════════════
story.append(Paragraph('1. Metodologia de Auditoria', h1_style))
story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceAfter=12))

story.append(Paragraph(
    'La auditoria se realizo de forma sistematica, utilizando el esquema Prisma '
    '(<font face="Courier">prisma/schema.prisma</font>, 5502 lineas, 70+ modelos) como '
    'fuente de verdad para la estructura de datos. Se compararon los nombres de campos, '
    'tipos de datos, valores de enumeradores y relaciones utilizados en cada API route y '
    'componente frontend contra las definiciones correspondientes en el esquema. El objetivo '
    'principal fue detectar el mismo tipo de inconsistencia que se encontro previamente en el '
    'modulo de Insumos (donde el componente usaba <font face="Courier">tipo</font> pero el '
    'esquema tenia <font face="Courier">categoria</font>), buscando patrones similares en '
    'todos los demas modulos del sistema.',
    body_style))

story.append(Paragraph(
    'Se auditaron 36 archivos de API routes y 15 componentes frontend principales, '
    'cubriendo los modulos core del sistema: Tropas, Animales, Corrales, Camaras, '
    'Operadores, Clientes, Transportistas, Productos, Menudencias, Pesaje de Camion, '
    'Pesaje Individual, Romaneo, Lista de Faena, Medias Res, Despachos, Facturacion, '
    'Calidad (Reclamos, pH, Novedades), C2 (Despostada, Cuarteo, Empaque, Expedicion, '
    'Subproductos, Degradacion, BOM, Rubros, Rendimiento, Stock, Productos, Tipos Cuarto), '
    'Cueros, Rendering, Grasa Dressing, Decomisos e Insumos.',
    body_style))

story.append(Paragraph('<b>Criterios de busqueda:</b>', body_style))
criteria = [
    'Nombres de campos en API routes que no coinciden con el esquema Prisma',
    'Campos fantasma (phantom fields): campos usados en el codigo que no existen en el modelo',
    'Campos faltantes: campos del esquema que deberian usarse pero no se implementan',
    'Desajuste de enumeradores: valores de enum en el codigo que no existen en el esquema',
    'Desajuste de tipos: tipos de datos incorrectos (String vs Int, etc.)',
    'Errores de relacion: validaciones contra tablas incorrectas, relaciones inexistentes',
]
for c in criteria:
    story.append(Paragraph(f'  &bull; {c}', ParagraphStyle('BulletItem',
        fontSize=10, leading=14, textColor=TEXT_DARK, fontName='Helvetica',
        leftIndent=15, spaceAfter=3, bulletIndent=5)))

story.append(PageBreak())

# ═══════════════════════════════════════════════════════════
# 2. FINDINGS
# ═══════════════════════════════════════════════════════════
story.append(Paragraph('2. Hallazgos por Severidad', h1_style))
story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceAfter=12))

# Summary table
summary_header = [
    Paragraph('<b>N.</b>', badge_style),
    Paragraph('<b>Severidad</b>', badge_style),
    Paragraph('<b>Modulo</b>', badge_style),
    Paragraph('<b>Tipo</b>', badge_style),
    Paragraph('<b>Descripcion</b>', badge_style),
]
summary_rows = [summary_header]
findings_summary = [
    ('1', 'CRITICA', 'Insumos', 'Campo Fantasma', 'motivoPrecio y operadorId se propagan a Insumo.update()'),
    ('2', 'CRITICA', 'Despachos', 'Campo Fantasma', 'fechaEntrega no existe en modelo Despacho'),
    ('3', 'ALTA', 'Pesaje Camion', 'Validacion Incorrecta', 'productorId validado contra Cliente en vez de ProductorConsignatario'),
    ('4', 'MEDIA', 'Despachos', 'Datos Faltantes', 'usuarioId/usuarioNombre no se setean en DespachoItem'),
    ('5', 'BAJA', 'Decomisos', 'Campo Sin Uso', 'pesoKg nunca se escribe (solo peso)'),
]
for row in findings_summary:
    sev = row[1]
    sev_colors = {'CRITICA': ACCENT_RED, 'ALTA': ACCENT_ORANGE, 'MEDIA': ACCENT_YELLOW, 'BAJA': ACCENT_GREEN}
    sev_color = sev_colors.get(sev, TEXT_MUTED)
    summary_rows.append([
        Paragraph(row[0], ParagraphStyle('SC', fontSize=9, alignment=TA_CENTER, fontName='Helvetica-Bold')),
        Paragraph(f'<font color="{sev_color.hexval()}"><b>{sev}</b></font>',
            ParagraphStyle('SC2', fontSize=9, alignment=TA_CENTER, fontName='Helvetica-Bold')),
        Paragraph(row[2], ParagraphStyle('SC3', fontSize=9, fontName='Helvetica')),
        Paragraph(row[3], ParagraphStyle('SC4', fontSize=9, fontName='Helvetica')),
        Paragraph(row[4], ParagraphStyle('SC5', fontSize=9, fontName='Helvetica', leading=12)),
    ])

summary_t = Table(summary_rows, colWidths=[25, 60, 70, 80, page_width - 235])
summary_t.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
    ('TEXTCOLOR', (0, 0), (-1, 0), white),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, -1), 9),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e2e8f0')),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, BG_LIGHT]),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
]))
story.append(summary_t)
story.append(Spacer(1, 20))

# ── BUG #1: CRITICA ──
story.append(Paragraph('2.1 Bug Critico #1: Insumos PUT - Campos Fantasma', h2_style))
story.extend(issue_card(
    'CRITICA',
    'Campos motivoPrecio y operadorId propagados erroneamente a Insumo.update()',
    'src/app/api/insumos/route.ts (lineas 80, 126-132)',
    'En el handler PUT de la API de Insumos, el codigo realiza <font face="Courier">const { id, ...data } = body</font> '
    'y luego propaga <font face="Courier">...data</font> directamente en <font face="Courier">db.insumo.update()</font>. '
    'El problema es que los campos <font face="Courier">motivoPrecio</font> y <font face="Courier">operadorId</font> '
    'pertenecen al modelo <font face="Courier">HistorialPrecioInsumo</font>, no al modelo '
    '<font face="Courier">Insumo</font>. Cuando estos campos estan presentes en el body '
    '(por ejemplo, al actualizar el precio con un motivo), Prisma lanza un '
    '<font face="Courier">PrismaClientValidationError: Unknown arg</font> en tiempo de ejecucion. '
    'Si bien el componente frontend actual no envia estos campos directamente, cualquier cliente '
    'que llame a la API con estos campos causara un error 500.',
    'Destructurar los campos antes de propagar: <font face="Courier">const { id, motivoPrecio, operadorId, ...data } = body;</font> '
    'y usar motivoPrecio/operadorId solo en la creacion del historial (lineas 113-122), no en la actualizacion del insumo.'
))

# ── BUG #2: CRITICA ──
story.append(Paragraph('2.2 Bug Critico #2: Despachos PUT - Campo Fantasma fechaEntrega', h2_style))
story.extend(issue_card(
    'CRITICA',
    'Campo fechaEntrega no existe en el modelo Despacho (usa fechaDespacho)',
    'src/app/api/despachos/route.ts (linea 248)',
    'En el handler PUT, cuando la accion es "entregar" (marcar como ENTREGADO), el codigo asigna '
    '<font face="Courier">data.fechaEntrega = new Date()</font>. Sin embargo, el modelo '
    '<font face="Courier">Despacho</font> en el esquema Prisma (linea 1909-1976) <b>no tiene un '
    'campo llamado fechaEntrega</b>. El campo correcto es <font face="Courier">fechaDespacho</font> '
    '(linea 1970 del esquema). El unico campo <font face="Courier">fechaEntrega</font> en todo el '
    'esquema pertenece al modelo <font face="Courier">OrdenCompra</font> (linea 4379). Esto causa '
    'que <b>toda operacion de "entregar" un despacho falle con error 500</b>, ya que Prisma rechaza '
    'el campo desconocido. Nota: el estado "ENTREGADO" si existe en el enum EstadoDespacho, '
    'pero el campo de fecha es incorrecto.',
    'Cambiar la linea 248 por <font face="Courier">data.fechaDespacho = new Date()</font> para usar '
    'el campo correcto del modelo Despacho. Alternativamente, agregar el campo '
    '<font face="Courier">fechaEntrega DateTime?</font> al modelo Despacho en el esquema si se '
    'quiere distinguir entre fecha de despacho y fecha de entrega efectiva.'
))

story.append(PageBreak())

# ── BUG #3: ALTA ──
story.append(Paragraph('2.3 Bug Alta Severidad #3: Pesaje Camion - Validacion contra Modelo Incorrecto', h2_style))
story.extend(issue_card(
    'ALTA',
    'productorId validado contra tabla Cliente en vez de ProductorConsignatario',
    'src/app/api/pesaje-camion/route.ts (lineas 253-256)',
    'En el handler POST del pesaje de camion, cuando se crea una tropa, el codigo valida la '
    'existencia del <font face="Courier">productorId</font> usando <font face="Courier">'
    'db.cliente.findUnique({ where: { id: productorId } })</font>. Sin embargo, en el esquema '
    'Prisma (linea 431-432), <font face="Courier">Tropa.productorId</font> es una clave foranea '
    'que referencia al modelo <font face="Courier">ProductorConsignatario</font>, no a '
    '<font face="Courier">Cliente</font>. Esto significa que: (1) un ID que existe en Cliente '
    'pero no en ProductorConsignatario pasara la validacion y luego fallara con error de '
    'constraint en la creacion de la tropa, y (2) un ID valido de ProductorConsignatario que '
    'no esta en Cliente sera incorrectamente rechazado.',
    'Cambiar la validacion a <font face="Courier">db.productorConsignatario.findUnique({ where: { id: productorId } })</font> '
    'para que coincida con la relacion real en el esquema.'
))

# ── ISSUE #4: MEDIA ──
story.append(Paragraph('2.4 Issue Media #4: Despachos - Datos Denormalizados Faltantes', h2_style))
story.extend(issue_card(
    'MEDIA',
    'usuarioId y usuarioNombre no se setean al crear DespachoItem',
    'src/app/api/despachos/route.ts (lineas 157-163)',
    'Cuando se crean los registros de <font face="Courier">DespachoItem</font> en el handler POST '
    'de despachos, el codigo popula <font face="Courier">mediaResId</font>, <font face="Courier">peso</font>, '
    '<font face="Courier">tropaCodigo</font> y <font face="Courier">garron</font>, pero <b>nunca '
    'establece los campos denormalizados</b> <font face="Courier">usuarioId</font> y '
    '<font face="Courier">usuarioNombre</font> que existen en el modelo (lineas 1995-1996 del '
    'esquema). Estos campos estan destinados a almacenar el nombre del cliente (usuario de faena) '
    'propietario de cada media res despachada. Al no setearlos, siempre quedan como null, lo que '
    'rompe los reportes que dependen de saber a que cliente pertenece cada media res despachada. '
    'El campo <font face="Courier">MediaRes.usuarioFaenaId</font> contiene esta informacion y '
    'podria usarse para poblar estos campos.',
    'Al crear los DespachoItem, incluir: <font face="Courier">usuarioId: m.usuarioFaenaId, '
    'usuarioNombre: m.usuarioFaena?.nombre</font>. Requiere incluir la relacion '
    '<font face="Courier">usuarioFaena</font> en la consulta de medias res.'
))

# ── ISSUE #5: BAJA ──
story.append(Paragraph('2.5 Issue Baja #5: Decomisos - Campo pesoKg Sin Uso', h2_style))
story.extend(issue_card(
    'BAJA',
    'Campo pesoKg del modelo Decomiso nunca se escribe (solo peso)',
    'src/app/api/decomisos/route.ts',
    'El modelo <font face="Courier">Decomiso</font> tiene dos campos de peso: '
    '<font face="Courier">pesoKg Float?</font> (linea 2925) y <font face="Courier">peso Float?</font> '
    '(linea 2926, documentado como alias). La API route consistentemente escribe en '
    '<font face="Courier">peso</font> pero <b>nunca escribe en pesoKg</b>. Si algun reporte '
    'o codigo downstream depende de <font face="Courier">pesoKg</font>, siempre sera null. '
    'La presencia de ambos campos sugiere una duplicacion o migracion incompleta.',
    'Decidir un campo canonico para el peso de decomisos. Si se mantiene ambos, escribir el '
    'mismo valor en ambos campos en las operaciones POST y PUT. Si se deprecia uno, eliminarlo '
    'del esquema con una migracion.'
))

story.append(PageBreak())

# ═══════════════════════════════════════════════════════════
# 3. MODULES WITHOUT ISSUES
# ═══════════════════════════════════════════════════════════
story.append(Paragraph('3. Modulos Auditados Sin Problemas', h1_style))
story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceAfter=12))

story.append(Paragraph(
    'Los siguientes modulos fueron auditados completamente y no presentaron inconsistencias '
    'entre los API routes, componentes frontend y el esquema Prisma. Todos los campos, '
    'enumeradores, tipos de datos y relaciones coinciden correctamente.',
    body_style))

modules_ok = [
    ('Tropas', 'tropas/route.ts, tropas/[id]/route.ts, tropas/mover/route.ts'),
    ('Animales', 'animales/route.ts, animales/baja/route.ts, animales/mover/route.ts, animales/buscar/route.ts'),
    ('Corrales', 'corrales/route.ts, corrales/animales/route.ts, corrales/stock/route.ts'),
    ('Camaras', 'camaras/route.ts, movimiento-camaras/route.ts, stock-camaras/route.ts'),
    ('Operadores', 'operadores/route.ts'),
    ('Clientes', 'clientes/route.ts'),
    ('Transportistas', 'transportistas/route.ts'),
    ('Productos', 'productos/route.ts, productos/proximo-codigo/route.ts'),
    ('Menudencias', 'menudencias/route.ts, tipos-menudencia/route.ts'),
    ('Pesaje Individual', 'pesaje-individual/route.ts'),
    ('Romaneo', 'romaneo/route.ts, romaneo/confirmar/route.ts, romaneo/cierre/route.ts'),
    ('Lista de Faena', 'lista-faena/route.ts, lista-faena/cerrar/route.ts, lista-faena/asignar/route.ts'),
    ('Medias Res', 'medias-res/route.ts'),
    ('Facturacion', 'facturacion/route.ts, facturacion/[id]/route.ts'),
    ('Calidad - Reclamos', 'calidad-reclamos/route.ts'),
    ('Calidad - pH', 'calidad-ph/route.ts'),
    ('Calidad - Novedades', 'calidad-novedades/route.ts'),
    ('Cueros', 'cueros/route.ts'),
    ('Rendering', 'rendering/route.ts'),
    ('Grasa Dressing', 'grasa-dressing/route.ts'),
    ('C2 - Expedicion', 'c2-expedicion/route.ts'),
    ('C2 - Produccion Cajas', 'c2-produccion-cajas/route.ts'),
    ('C2 - Stock', 'c2-stock/route.ts'),
    ('C2 - Subproductos', 'c2-subproductos/route.ts'),
    ('C2 - Degradacion', 'c2-degradacion/route.ts'),
    ('C2 - Ingreso Desposte', 'c2-ingreso-desposte/route.ts'),
    ('C2 - Pallets', 'c2-pallets/route.ts'),
    ('C2 - Rubros', 'c2-rubros/route.ts'),
    ('C2 - BOM', 'c2-bom/route.ts'),
    ('C2 - Rendimiento', 'c2-rendimiento/route.ts'),
    ('C2 - Productos Desposte', 'c2-productos-desposte/route.ts'),
    ('C2 - Tipos Cuarto', 'c2-tipos-cuarto/route.ts'),
    ('Componente Insumos (frontend)', 'components/insumos/index.tsx (corregido previamente)'),
]

mod_header = [
    Paragraph('<b>Modulo</b>', ParagraphStyle('MH', fontSize=9, fontName='Helvetica-Bold', textColor=PRIMARY)),
    Paragraph('<b>Archivos Auditados</b>', ParagraphStyle('MH2', fontSize=9, fontName='Helvetica-Bold', textColor=PRIMARY)),
]
mod_rows = [mod_header]
for name, files in modules_ok:
    mod_rows.append([
        Paragraph(name, ParagraphStyle('MC', fontSize=8.5, fontName='Helvetica', leading=11)),
        Paragraph(f'<font face="Courier" size="7.5">{files}</font>',
            ParagraphStyle('MC2', fontSize=7.5, fontName='Courier', leading=10)),
    ])

mod_t = Table(mod_rows, colWidths=[120, page_width - 120])
mod_t.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), HexColor('#f0fdf4')),
    ('GRID', (0, 0), (-1, -1), 0.3, HexColor('#e2e8f0')),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, HexColor('#f8fafc')]),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
]))
story.append(mod_t)

story.append(PageBreak())

# ═══════════════════════════════════════════════════════════
# 4. RECOMMENDED ACTIONS
# ═══════════════════════════════════════════════════════════
story.append(Paragraph('4. Resumen de Acciones Recomendadas', h1_style))
story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceAfter=12))

story.append(Paragraph(
    'A continuacion se presenta un plan de accion priorizado para resolver los hallazgos '
    'de la auditoria. Se recomienda abordar primero los bugs criticos ya que causan errores '
    'en tiempo de ejecucion que impactan directamente a los usuarios del sistema.',
    body_style))

story.append(Paragraph('<b>Prioridad Inmediata (Semana 1):</b>', h3_style))
story.append(Paragraph(
    '<b>1. Corregir Insumos PUT (Bug Critico #1):</b> Modificar la linea 80 de '
    '<font face="Courier">src/app/api/insumos/route.ts</font> para destructurar los campos '
    '<font face="Courier">motivoPrecio</font> y <font face="Courier">operadorId</font> antes '
    'de la propagacion. Este cambio es trivial (una linea) y elimina un error 500 que se '
    'dispara cada vez que se actualiza un precio con motivo. Adicionalmente, se recomienda '
    'agregar al formulario del componente frontend un campo opcional para el motivo de cambio '
    'de precio, de modo que el historial registre informacion util en lugar de siempre grabar '
    '"Actualizacion manual".',
    body_style))

story.append(Paragraph(
    '<b>2. Corregir Despachos PUT (Bug Critico #2):</b> Cambiar la linea 248 de '
    '<font face="Courier">src/app/api/despachos/route.ts</font> de '
    '<font face="Courier">data.fechaEntrega</font> a <font face="Courier">data.fechaDespacho</font>. '
    'Este cambio de una linea restaura la funcionalidad de marcar despachos como entregados, '
    'que actualmente esta completamente rota. Se recomienda ademas considerar si se desea '
    'distinguir entre la fecha de despacho (salida del frigorifico) y la fecha de entrega '
    '(llegada al destino), en cuyo caso deberia agregarse un campo nuevo al esquema.',
    body_style))

story.append(Paragraph('<b>Prioridad Alta (Semana 2):</b>', h3_style))
story.append(Paragraph(
    '<b>3. Corregir Pesaje Camion (Bug Alta #3):</b> Cambiar la validacion en '
    '<font face="Courier">src/app/api/pesaje-camion/route.ts</font> linea 253 de '
    '<font face="Courier">db.cliente.findUnique</font> a <font face="Courier">'
    'db.productorConsignatario.findUnique</font>. Este cambio afecta el flujo de ingreso de '
    'hacienda cuando se especifica un productor, garantizando que solo IDs validos de '
    'ProductorConsignatario sean aceptados. Se recomienda probar el flujo completo de '
    'ingreso de hacienda con productor despues del cambio.',
    body_style))

story.append(Paragraph('<b>Prioridad Media (Semana 3-4):</b>', h3_style))
story.append(Paragraph(
    '<b>4. Mejorar Datos de Despacho (Issue Media #4):</b> Agregar la poblacion de '
    '<font face="Courier">usuarioId</font> y <font face="Courier">usuarioNombre</font> en la '
    'creacion de DespachoItem, leyendo desde la relacion MediaRes.usuarioFaena. Esto requiere '
    'modificar la consulta de medias res para incluir la relacion usuarioFaena. Es un cambio '
    'pequeno pero importante para la calidad de los reportes de despacho.',
    body_style))

story.append(Paragraph('<b>Prioridad Baja (Backlog):</b>', h3_style))
story.append(Paragraph(
    '<b>5. Unificar Campo de Peso en Decomisos (Issue Baja #5):</b> Decidir si se mantiene '
    'ambos campos (peso y pesoKg) o se unifica en uno solo. Si se mantiene ambos, actualizar '
    'los handlers POST y PUT para escribir en ambos. Si se elimina uno, crear una migracion '
    'Prisma para remover el campo obsoleto. Este es un cambio de bajo riesgo pero que mejora '
    'la consistencia del esquema.',
    body_style))

story.append(Spacer(1, 20))

# ═══════════════════════════════════════════════════════════
# 5. PREVIOUSLY FIXED
# ═══════════════════════════════════════════════════════════
story.append(Paragraph('5. Correcciones Previamente Aplicadas', h1_style))
story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceAfter=12))

story.append(Paragraph(
    'En sesiones previas se corrigieron los siguientes problemas que sirvieron como punto de '
    'partida para esta auditoria. Estos cambios ya estan commitidos en el repositorio.',
    body_style))

prev_data = [
    [Paragraph('<b>Modulo</b>', badge_style),
     Paragraph('<b>Problema</b>', badge_style),
     Paragraph('<b>Commit</b>', badge_style)],
    [Paragraph('Insumos (componente)', ParagraphStyle('PC', fontSize=9, fontName='Helvetica')),
     Paragraph('Campos tipo/unidad/pesoUnitario en lugar de categoria/unidadMedida/precioUnitario. Reescritura completa del componente.', ParagraphStyle('PC2', fontSize=9, fontName='Helvetica', leading=12)),
     Paragraph('Reescritura previa a auditoria', ParagraphStyle('PC3', fontSize=8, fontName='Courier'))],
    [Paragraph('Insumos (API)', ParagraphStyle('PC', fontSize=9, fontName='Helvetica')),
     Paragraph('API route actualizado con nombres de campo correctos.', ParagraphStyle('PC2', fontSize=9, fontName='Helvetica', leading=12)),
     Paragraph('679d2ad', ParagraphStyle('PC3', fontSize=8, fontName='Courier'))],
    [Paragraph('Calidad Reclamos', ParagraphStyle('PC', fontSize=9, fontName='Helvetica')),
     Paragraph('Filtro RESPONDIDO faltante en historial de reclamos.', ParagraphStyle('PC2', fontSize=9, fontName='Helvetica', leading=12)),
     Paragraph('e35d802', ParagraphStyle('PC3', fontSize=8, fontName='Courier'))],
    [Paragraph('Rate Limiter', ParagraphStyle('PC', fontSize=9, fontName='Helvetica')),
     Paragraph('Rate limit API_WRITE muy agresivo (30 req/min). Ajustado a 100 req/min.', ParagraphStyle('PC2', fontSize=9, fontName='Helvetica', leading=12)),
     Paragraph('448191a', ParagraphStyle('PC3', fontSize=8, fontName='Courier'))],
]

prev_t = Table(prev_data, colWidths=[90, page_width - 180, 90])
prev_t.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
    ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e2e8f0')),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, BG_LIGHT]),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
]))
story.append(prev_t)

# ── Build ──
os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
print(f'PDF generado exitosamente: {OUTPUT}')
print(f'Tamano: {os.path.getsize(OUTPUT) / 1024:.1f} KB')
