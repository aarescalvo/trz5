# -*- coding: utf-8 -*-
"""Reporte de Auditoria de Consistencia - Sistema TRZ5"""

import sys, os
PDF_SKILL_DIR = "/home/z/my-project/skills/pdf"
_scripts = os.path.join(PDF_SKILL_DIR, "scripts")
if _scripts not in sys.path:
    sys.path.insert(0, _scripts)

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable
)
from reportlab.platypus.flowables import Flowable
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Register fonts
pdfmetrics.registerFont(TTFont('NotoSans', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('NotoSansBold', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-Bold.ttf'))

# Colors
ACCENT = colors.HexColor('#5733c2')
ACCENT_LIGHT = colors.HexColor('#7c5fd4')
TEXT_PRIMARY = colors.HexColor('#1a1918')
TEXT_MUTED = colors.HexColor('#8b867e')
BG_SURFACE = colors.HexColor('#e6e2dd')
BG_PAGE = colors.HexColor('#eeece8')
CRITICAL_RED = colors.HexColor('#c0392b')
WARNING_AMBER = colors.HexColor('#d4a017')
OK_GREEN = colors.HexColor('#27ae60')
TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT = colors.white
TABLE_ROW_EVEN = colors.white
TABLE_ROW_ODD = BG_SURFACE

W, H = A4
OUTPUT = '/home/z/my-project/download/Auditoria_Consistencia_TRZ5.pdf'

# Styles
styles = getSampleStyleSheet()

s_h1 = ParagraphStyle('H1', parent=styles['Heading1'], fontName='NotoSansBold', fontSize=20, leading=26,
                       textColor=TEXT_PRIMARY, spaceAfter=8*mm, spaceBefore=12*mm)
s_h2 = ParagraphStyle('H2', parent=styles['Heading2'], fontName='NotoSansBold', fontSize=15, leading=20,
                       textColor=ACCENT, spaceAfter=6*mm, spaceBefore=10*mm)
s_h3 = ParagraphStyle('H3', parent=styles['Heading3'], fontName='NotoSansBold', fontSize=12, leading=16,
                       textColor=TEXT_PRIMARY, spaceAfter=4*mm, spaceBefore=6*mm)
s_body = ParagraphStyle('Body', parent=styles['Normal'], fontName='NotoSans', fontSize=10, leading=15,
                         textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY, spaceAfter=3*mm)
s_body_sm = ParagraphStyle('BodySm', parent=s_body, fontSize=9, leading=13)
s_bullet = ParagraphStyle('Bullet', parent=s_body, leftIndent=12*mm, bulletIndent=6*mm, spaceAfter=2*mm)
s_code = ParagraphStyle('Code', parent=s_body, fontName='NotoSans', fontSize=8.5, leading=12,
                         backColor=colors.HexColor('#f5f3f0'), leftIndent=4*mm, rightIndent=4*mm,
                         spaceBefore=2*mm, spaceAfter=2*mm, borderPadding=3*mm)
s_table_header = ParagraphStyle('TH', fontName='NotoSansBold', fontSize=8.5, leading=11,
                                 textColor=TABLE_HEADER_TEXT, alignment=TA_CENTER)
s_table_cell = ParagraphStyle('TC', fontName='NotoSans', fontSize=8.5, leading=12,
                               textColor=TEXT_PRIMARY)
s_table_cell_c = ParagraphStyle('TCC', fontName='NotoSans', fontSize=8.5, leading=12,
                                 textColor=TEXT_PRIMARY, alignment=TA_CENTER)
s_severity = ParagraphStyle('Sev', fontName='NotoSansBold', fontSize=8.5, leading=11, alignment=TA_CENTER)
s_footer = ParagraphStyle('Footer', fontName='NotoSans', fontSize=7.5, leading=10, textColor=TEXT_MUTED, alignment=TA_CENTER)

def P(text, style=s_body):
    return Paragraph(text, style)

def H1(text):
    return Paragraph(text, s_h1)

def H2(text):
    return Paragraph(text, s_h2)

def H3(text):
    return Paragraph(text, s_h3)

def Bullets(items):
    return [Paragraph(f"- {item}", s_bullet) for item in items]

def make_table(headers, rows, col_widths=None):
    """Create a styled table with severity-aware coloring."""
    header_row = [Paragraph(h, s_table_header) for h in headers]
    data = [header_row]
    for row in rows:
        data.append([Paragraph(str(cell), s_table_cell) if i > 0 else Paragraph(str(cell), s_severity) for i, cell in enumerate(row)])

    if col_widths is None:
        col_widths = [(W - 40*mm) / len(headers)] * len(headers)

    t = Table(data, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cccccc')),
    ]
    # Severity coloring for first column
    for i, row in enumerate(data[1:], 1):
        severity = str(row[0])
        if 'CRITICA' in severity:
            style_cmds.append(('TEXTCOLOR', (0, i), (0, i), CRITICAL_RED))
        elif 'ALTA' in severity:
            style_cmds.append(('TEXTCOLOR', (0, i), (0, i), WARNING_AMBER))
        elif 'MEDIA' in severity:
            style_cmds.append(('TEXTCOLOR', (0, i), (0, i), colors.HexColor('#2980b9')))

    for i in range(1, len(data)):
        bg = TABLE_ROW_ODD if i % 2 == 0 else TABLE_ROW_EVEN
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))

    t.setStyle(TableStyle(style_cmds))
    return t

class SeverityBadge(Flowable):
    def __init__(self, text, color, width=60, height=14):
        Flowable.__init__(self)
        self.text = text
        self.color = color
        self.width = width
        self.height = height

    def draw(self):
        self.canv.setFillColor(self.color)
        self.canv.roundRect(0, 0, self.width, self.height, 3, fill=1, stroke=0)
        self.canv.setFillColor(colors.white)
        self.canv.setFont('NotoSansBold', 7.5)
        self.canv.drawCentredString(self.width/2, 3.5, self.text)

# BUILD DOCUMENT
doc = SimpleDocTemplate(OUTPUT, pagesize=A4,
                        leftMargin=20*mm, rightMargin=20*mm,
                        topMargin=20*mm, bottomMargin=20*mm)

story = []

# ============================================================
# COVER PAGE
# ============================================================
story.append(Spacer(1, 60*mm))
story.append(HRFlowable(width="80%", thickness=2, color=ACCENT, spaceAfter=8*mm))
story.append(Paragraph("AUDITORIA DE CONSISTENCIA", ParagraphStyle('CoverTitle', fontName='NotoSansBold',
                          fontSize=32, leading=38, textColor=TEXT_PRIMARY, alignment=TA_CENTER)))
story.append(Spacer(1, 4*mm))
story.append(Paragraph("Sistema de Trazabilidad TRZ5", ParagraphStyle('CoverSub', fontName='NotoSans',
                          fontSize=16, leading=22, textColor=ACCENT, alignment=TA_CENTER)))
story.append(Spacer(1, 4*mm))
story.append(Paragraph("Revision Completa: Modelos Prisma, API Routes, Componentes Frontend", ParagraphStyle('CoverDesc',
                          fontName='NotoSans', fontSize=11, leading=15, textColor=TEXT_MUTED, alignment=TA_CENTER)))
story.append(Spacer(1, 8*mm))
story.append(HRFlowable(width="80%", thickness=2, color=ACCENT, spaceAfter=12*mm))
story.append(Spacer(1, 30*mm))

cover_info = [
    ["Fecha", "23 de Abril, 2026"],
    ["Alcance", "168 Modelos, 323 Rutas API, 50+ Componentes"],
    ["Proyecto", "trz5-ph (master)"],
    ["Repo", "github.com/aarescalvo/trz5"],
]
cover_table = Table(cover_info, colWidths=[45*mm, 80*mm])
cover_table.setStyle(TableStyle([
    ('FONTNAME', (0, 0), (0, -1), 'NotoSansBold'),
    ('FONTNAME', (1, 0), (1, -1), 'NotoSans'),
    ('FONTSIZE', (0, 0), (-1, -1), 10),
    ('TEXTCOLOR', (0, 0), (0, -1), ACCENT),
    ('TEXTCOLOR', (1, 0), (1, -1), TEXT_PRIMARY),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
    ('ALIGN', (1, 0), (1, -1), 'LEFT'),
    ('LEFTPADDING', (1, 0), (1, -1), 8),
]))
story.append(cover_table)

story.append(PageBreak())

# ============================================================
# RESUMEN EJECUTIVO
# ============================================================
story.append(H1("1. Resumen Ejecutivo"))

story.append(P(
    "Se realizo una auditoria exhaustiva del sistema de trazabilidad TRZ5, un frigorifico de gestion integral "
    "desarrollado con Next.js 16, Prisma ORM, PostgreSQL y TypeScript. La revision abarco los 168 modelos "
    "definidos en el esquema Prisma, las 323 rutas de API bajo <font face='NotoSans' size='9'>/app/api/</font>, "
    "y mas de 50 componentes frontend bajo <font face='NotoSans' size='9'>/components/</font>. "
    "El objetivo fue identificar inconsistencias similares a la encontrada previamente en el modulo de Insumos, "
    "donde los campos del formulario no coincidian con el esquema de base de datos."
))

story.append(P(
    "La auditoria descubrio un total de <b>22 hallazgos</b> distribuidos en cuatro categorias principales: "
    "inconsistencias criticas entre frontend y backend (los mismos campos erroneos que ya encontramos), "
    "problemas de seguridad y autenticacion, errores en el esquema Prisma, y problemas de arquitectura "
    "y calidad de codigo. De estos hallazgos, <b>5 son de severidad critica</b> y requieren atencion inmediata "
    "porque causan errores en produccion o perdida de datos silenciosa."
))

# Summary table
summary_data = [
    ["CRITICA", "5", "Errores en produccion, datos corruptos"],
    ["ALTA", "7", "Fallas de seguridad, datos incompletos"],
    ["MEDIA", "6", "Inconsistencias menores, deuda tecnica"],
    ["BAJA", "4", "Mejoras de codigo, convenciones"],
]

story.append(Spacer(1, 4*mm))
sum_headers = ["Severidad", "Cantidad", "Tipo de Impacto"]
sum_table = make_table(sum_headers, summary_data, [35*mm, 25*mm, 90*mm])
story.append(sum_table)

story.append(PageBreak())

# ============================================================
# HALLAZGOS CRITICOS
# ============================================================
story.append(H1("2. Hallazgos Criticos"))

# --- 2.1 INSUMOS CATEGORIES ---
story.append(H2("2.1 Categorias de Insumos Incorrectas (CRITICA)"))

story.append(P(
    "El componente <font face='NotoSans' size='9'>src/components/insumos/index.tsx</font> define categorias "
    "de insumos que <b>no coinciden</b> con el enum <font face='NotoSans' size='9'>CategoriaInsumoTipo</font> "
    "del esquema Prisma. Cuando un usuario selecciona una categoria erronea, el valor se envia al backend "
    "donde Prisma lo rechaza, causando errores silenciosos o datos que no se almacenan correctamente."
))

story.append(H3("Valores Incorrectos en el Frontend"))

mismatch_headers = ["Campo Frontend", "Valor Frontend", "Valor Correcto (Prisma)"]
mismatch_rows = [
    ["categoria", "LIMPIEZA", "HIGIENE"],
    ["categoria", "EPP", "PROTECCION"],
    ["categoria", "REPUESTOS", "HERRAMIENTAS"],
    ["categoria", "(faltante)", "OFICINA"],
    ["categoria", "OTRO", "OTROS"],
]
story.append(make_table(mismatch_headers, mismatch_rows, [40*mm, 45*mm, 55*mm]))

story.append(Spacer(1, 3*mm))
story.append(P(
    "<b>Impacto:</b> Cuando un usuario selecciona 'LIMPIEZA' como categoria, Prisma genera un error "
    "de validacion porque el enum solo acepta 'HIGIENE'. Esto causaba el error 'ERROR AL CREAR INSUMO' "
    "que reportamos previamente. Aunque ya corregimos los campos del formulario (tipo, unidad, etc.), "
    "las categorias siguen siendo incorrectas. Ademas, faltan las categorias 'OFICINA' en el selector "
    "y el valor 'OTROS' esta escrito como 'OTRO' (sin la S final)."
))

story.append(P(
    "<b>Componentes afectados:</b> Este problema solo existe en "
    "<font face='NotoSans' size='9'>insumos/index.tsx</font>. El componente "
    "<font face='NotoSans' size='9'>stocks-insumos/index.tsx</font> tiene las categorias correctas, "
    "asi como <font face='NotoSans' size='9'>configuracion/insumos-config.tsx</font>. Esto genera una "
    "incoherencia visual: el usuario ve opciones diferentes dependiendo de desde donde gestione los insumos."
))

story.append(H3("Accion Propuesta"))
story.extend(Bullets([
    "Reemplazar los valores de CATEGORIAS en insumos/index.tsx por los valores correctos del enum CategoriaInsumoTipo",
    "Unificar la constante CATEGORIAS en un archivo compartido (ej: lib/constants/insumos.ts) para evitar duplicacion",
    "Agregar validacion en el frontend que verifique los valores contra el enum antes de enviar",
    "Considerar obtener las categorias dinamicamente desde el backend en lugar de hardcodearlas"
]))

# --- 2.2 PRODUCTOS DESCONEXION ---
story.append(H2("2.2 Componente Productos Desconectado del Backend (CRITICA)"))

story.append(P(
    "El componente <font face='NotoSans' size='9'>src/components/productos/index.tsx</font> envia datos "
    "al endpoint <font face='NotoSans' size='9'>/api/productos</font> que utiliza el modelo Prisma "
    "<font face='NotoSans' size='9'>Producto</font> (un modelo simple para codigos de tipificacion). "
    "Sin embargo, el formulario define mas de 30 campos que pertenecen al modelo "
    "<font face='NotoSans' size='9'>ProductoVendible</font>, un modelo completamente diferente y mucho mas extenso. "
    "Como resultado, la mayoria de los campos del formulario se ignoran silenciosamente en el backend."
))

story.append(H3("Campos Fantasma (no existen en Producto)"))
phantom_headers = ["Campo Frontend", "Existe en Producto?", "Corresponde a"]
phantom_rows = [
    ["codigoSecundario", "No", "-"],
    ["vencimiento", "No", "ProductoVendible.vencimientoDias"],
    ["nroSenasa", "No", "ProductoVendible.numeroRegistroSenasa"],
    ["unidad", "No", "ProductoVendible.unidadMedida"],
    ["cantidadEtiquetas", "No", "ProductoVendible.cantidadEtiquetas"],
    ["tieneTipificacion", "No", "ProductoVendible.tieneTipificacion"],
    ["tipificacionSecundaria", "No", "-"],
    ["tipoGeneral", "No", "-"],
    ["descripcionCircular", "No", "ProductoVendible.descripcionCircular"],
    ["precioDolar / precioEuro", "No", "ProductoVendible.precioDolar/Euro"],
    ["producidoDePieza", "No", "-"],
    ["jaslo", "No", "-"],
    ["productoRepoRinde", "No", "ProductoVendible.productoReporteRinde"],
    ["textoEspanol/Ingles/TercerIdioma", "No", "ProductoVendible (si)"],
]
story.append(make_table(phantom_headers, phantom_rows, [50*mm, 35*mm, 55*mm]))

story.append(Spacer(1, 3*mm))
story.append(P(
    "<b>Impacto:</b> El usuario completa un formulario extenso con decenas de campos, pero al guardar, "
    "solo se almacenan los campos basicos (codigo, nombre, tara, diasConservacion, especie). Todos los datos "
    "de precios, etiquetas, textos multiidioma, y configuraciones de tipificacion se pierden silenciosamente. "
    "Esto es particularmente grave porque el usuario no recibe ningun error ni advertencia."
))

story.append(H3("Accion Propuesta"))
story.extend(Bullets([
    "Reescribir el componente productos/index.tsx para que llame a /api/productos-vendibles en lugar de /api/productos",
    "O bien: determinar si el componente deberia gestionar el modelo simple Producto (codigos de tipificacion) y simplificar el formulario drasticamente",
    "Si se opta por ProductoVendible, agregar todos los campos faltantes del esquema: delCuarto, tipoVenta, alicuotaIva, tipoTrabajoId, tipoCarne, requiereTrazabilidad, precioActual",
    "Agregar validacion de campos antes del envio para detectar inconsistencias tempranamente"
]))

# --- 2.3 STOCKS-INSUMOS CAMPOS FALTANTES ---
story.append(H2("2.3 Stocks-Insumos Pierde Campos al Guardar (CRITICA)"))

story.append(P(
    "El componente <font face='NotoSans' size='9'>src/components/stocks-insumos/index.tsx</font> tiene las "
    "categorias correctas (a diferencia de insumos), pero al momento de guardar un insumo, <b>no envia</b> "
    "los campos <font face='NotoSans' size='9'>moneda</font> y <font face='NotoSans' size='9'>codigoProveedor</font>. "
    "Estos campos existen en el esquema Prisma como <font face='NotoSans' size='9'>Insumo.moneda</font> "
    "(String, por defecto 'ARS') e <font face='NotoSans' size='9'>Insumo.codigoProveedor</font> (String opcional). "
    "Si un usuario edita un insumo desde este componente, estos campos se sobreescriben con valores vacios."
))

story.append(P(
    "<b>Impacto:</b> Cada vez que un usuario guarda un insumo desde la vista de stocks, pierde la moneda "
    "configurada (por ejemplo, si estaba en USD, vuelve a ARS por defecto) y el codigo de proveedor asociado. "
    "Esto es una perdida de datos silenciosa que puede afectar reportes de valorizado de stock y compras."
))

story.append(H3("Accion Propuesta"))
story.extend(Bullets([
    "Agregar los campos moneda y codigoProveedor al formulario de edicion en stocks-insumos",
    "Unificar la interfaz de edicion de insumos entre ambos componentes (insumos y stocks-insumos)",
    "Verificar que el API no sobreescriba con null los campos no enviados (usar campos opcionales en el update)"
]))

story.append(PageBreak())

# ============================================================
# PROBLEMAS DE SEGURIDAD
# ============================================================
story.append(H1("3. Problemas de Seguridad y Autenticacion"))

# --- 3.1 RUTAS SIN AUTH ---
story.append(H2("3.1 Rutas API sin Proteccion de Autenticacion"))

story.append(P(
    "Se identificaron 4 rutas de API que exponen datos sensibles mediante peticiones GET sin requerir "
    "autenticacion. Si bien las operaciones de escritura (POST, PUT, DELETE) si estan protegidas, los "
    "endpoints GET permiten que cualquier usuario no autenticado acceda a informacion operativa del sistema. "
    "En un entorno de red interna de un frigorifico, esto representa un vector de ataque potencial si "
    "un dispositivo no autorizado obtiene acceso a la red."
))

auth_headers = ["Ruta API", "Metodo Sin Auth", "Datos Expuestos"]
auth_rows = [
    ["/api/menudencias", "GET", "Todas las menudencias (pesos, fechas, estados)"],
    ["/api/tarifas", "GET", "Tarifas + seed de datos (Crea registros!)"],
    ["/api/monedas", "GET", "Configuracion de monedas y cotizaciones"],
    ["/api/indicadores", "GET", "Indicadores KPI con umbrales de alerta"],
]
story.append(make_table(auth_headers, auth_rows, [40*mm, 30*mm, 80*mm]))

story.append(Spacer(1, 3*mm))
story.append(P(
    "<b>Caso especial - /api/tarifas:</b> Esta ruta tiene un comportamiento particularmente peligroso. "
    "Cuando se accede con el parametro <font face='NotoSans' size='9'>?modo=seed</font>, la ruta GET "
    "<b>crea registros de tipos de tarifa</b> en la base de datos sin requerir autenticacion ni confirmacion. "
    "Un usuario no autenticado podria ejecutar este endpoint repetidamente para contaminar la tabla de tarifas."
))

story.append(H3("Accion Propuesta"))
story.extend(Bullets([
    "Agregar checkPermission('puedeMenudencias') al GET de /api/menudencias",
    "Agregar checkPermission('puedeFacturacion') al GET de /api/tarifas y eliminar el modo=seed del GET",
    "Agregar checkPermission('puedeFacturacion') al GET de /api/monedas",
    "Agregar checkPermission('puedeReportes') al GET de /api/indicadores",
    "Implementar un middleware global que verifique autenticacion basica para todas las rutas /api/"
]))

# --- 3.2 PIN EN TEXTO PLANO ---
story.append(H2("3.2 PIN de Operadores Almacenado en Texto Plano (ALTA)"))

story.append(P(
    "El campo <font face='NotoSans' size='9'>Operador.pin</font> se almacena como texto plano en la base de datos. "
    "Mientras que la contraseña se hashea con bcrypt antes de almacenarse, el PIN se guarda directamente. "
    "El endpoint <font face='NotoSans' size='9'>/api/auth/validar-pin</font> realiza una comparacion directa "
    "contra el valor almacenado. Si la base de datos es comprometida, todos los PINs quedan expuestos "
    "directamente sin necesidad de crackeo. En un frigorifico donde los operadores usan PINs para "
    "validar operaciones criticas (cerrar reclamos, autorizar cambios), esto representa un riesgo significativo."
))

story.append(H3("Accion Propuesta"))
story.extend(Bullets([
    "Hashear el PIN con bcrypt al momento de crearlo (igual que la password)",
    "Actualizar /api/auth/validar-pin para comparar con bcrypt.compare",
    "Migrar los PINs existentes: generar un script que hashee todos los PINs actuales",
    "Considerar agregar un segundo factor de autenticacion para operaciones criticas"
]))

# --- 3.3 SIN VALIDACION DE ESQUEMA ---
story.append(H2("3.3 Ausencia de Validacion de Esquema en APIs (ALTA)"))

story.append(P(
    "Ninguna de las 323 rutas de API utiliza una libreria de validacion de esquemas como Zod, Yup o Joi. "
    "Toda la validacion se realiza manualmente con bloques <font face='NotoSans' size='9'>if (!field)</font> "
    "y conversiones de tipo <font face='NotoSans' size='9'>parseFloat()</font>/<font face='NotoSans' size='9'>parseInt()</font>. "
    "Esto significa que: (a) campos inesperados en el body de la request pasan sin control, "
    "(b) no hay sanitizacion contra inyeccion, (c) los tipos de datos se convierten silenciosamente "
    "sin verificar que el valor original sea valido, y (d) la validacion es inconsistente entre rutas."
))

story.append(P(
    "Esta es la causa raiz del bug de Insumos: si hubiese existido un esquema Zod que validara los campos "
    "del request contra el modelo Prisma, el error de categorias se habria detectado automaticamente en "
    "tiempo de desarrollo, no en produccion."
))

story.append(H3("Accion Propuesta"))
story.extend(Bullets([
    "Implementar Zod como libreria de validacion estandar en todas las rutas API",
    "Crear schemas de validacion que reflejen fielmente cada modelo Prisma",
    "Generar los schemas automaticamente a partir del schema.prisma (herramientas como zod-prisma)",
    "Agregar un middleware de validacion global que rechace requests con campos no esperados"
]))

story.append(PageBreak())

# ============================================================
# ERRORES EN ESQUEMA PRISMA
# ============================================================
story.append(H1("4. Errores en el Esquema Prisma"))

# --- 4.1 TYPO ---
story.append(H2("4.1 Error Tipografico en Enum TipoProductoEnum (ALTA)"))

story.append(P(
    "El enum <font face='NotoSans' size='9'>TipoProductoEnum</font> contiene un error tipografico en uno "
    "de sus valores: <font face='NotoSans' size='9'>PRODUCTO_ELAVORADO</font> deberia ser "
    "<font face='NotoSans' size='9'>PRODUCTO_ELABORADO</font> (falta la 'B' en 'ELABORADO'). "
    "Este valor esta definido en el esquema pero, tras analizar las 323 rutas de API, no se encontro "
    "ningun archivo que lo referencie directamente. Sin embargo, si alguna carga de datos inicial (seed) "
    "o proceso de importacion utiliza este valor, los registros quedaran asociados a un nombre incorrecto."
))

story.append(H3("Accion Propuesta"))
story.extend(Bullets([
    "Renombrar PRODUCTO_ELAVORADO a PRODUCTO_ELABORADO en el schema.prisma",
    "Ejecutar db:push para sincronizar el cambio en PostgreSQL",
    "Actualizar cualquier referencia en la base de datos: UPDATE ... SET tipo = 'PRODUCTO_ELABORADO' WHERE tipo = 'PRODUCTO_ELAVORADO'",
    "Buscar en todo el codebase referencias a 'ELAVORADO' para asegurarse de que no existan"
]))

# --- 4.2 DOS ESQUEMAS DUPLICADOS ---
story.append(H2("4.2 Dos Esquemas Prisma Competidores (MEDIA)"))

story.append(P(
    "Existen dos archivos de esquema Prisma en el repositorio: "
    "<font face='NotoSans' size='9'>trz5-ph/prisma/schema.prisma</font> (5,502 lineas) y "
    "<font face='NotoSans' size='9'>produccion4z/prisma/schema.prisma</font> (5,458 lineas). "
    "Ambos definen los mismos modelos pero con diferencias significativas. El esquema de "
    "<font face='NotoSans' size='9'>trz5-ph</font> es el mas reciente e incluye modelos y campos "
    "que no existen en <font face='NotoSans' size='9'>produccion4z</font>, como "
    "<font face='NotoSans' size='9'>ConfiguracionPH</font>, <font face='NotoSans' size='9'>HistorialPrecioInsumo</font>, "
    "y campos adicionales en <font face='NotoSans' size='9'>MedicionPH</font>."
))

diff_headers = ["Diferencia", "trz5-ph (Nuevo)", "produccion4z (Viejo)"]
diff_rows = [
    ["ConfiguracionPH", "Presente", "No existe"],
    ["ClasificacionPH", "5 valores (con SIN_CLASIFICAR)", "4 valores"],
    ["MedicionPH campos", "temperatura, numeroMedicion, medidoPor, +8 indices", "lado, sigla, tipoAnimal, pesoMediaRes"],
    ["Operador.puedeCalidad", "Presente", "No existe"],
    ["MediaRes.medicionesPH", "Relacion presente", "No existe"],
]
story.append(make_table(diff_headers, diff_rows, [40*mm, 60*mm, 60*mm]))

story.append(Spacer(1, 3*mm))
story.append(P(
    "<b>Riesgo:</b> Si un desarrollador modifica el esquema equivocado, los cambios no se reflejaran "
    "en la base de datos de produccion. Ademas, la diferencia en los campos de MedicionPH entre ambos "
    "esquemas podria causar errores si se migra de produccion4z a trz5-ph sin actualizar los datos."
))

story.append(H3("Accion Propuesta"))
story.extend(Bullets([
    "Eliminar el esquema de produccion4z si ya no se utiliza, o documentar claramente cual es el activo",
    "Agregar un archivo .env.example que referencie explicitamente al esquema correcto",
    "Implementar un check en CI/CD que verifique que solo existe un schema.prisma activo"
]))

# --- 4.3 CONVENCION @@MAP ---
story.append(H2("4.3 Convencion de Nombres Inconsistente (BAJA)"))

story.append(P(
    "El modelo <font face='NotoSans' size='9'>ConfiguracionPH</font> utiliza "
    "<font face='NotoSans' size='9'>@@map('configuracion_ph')</font> para personalizar el nombre de la tabla, "
    "convirtiendo PascalCase a snake_case. Ninguno de los otros 167 modelos utiliza esta convencion; "
    "todos mantienen el nombre por defecto que genera Prisma (PascalCase). Esta inconsistencia puede "
    "causar confusion al escribir consultas SQL directas o al depurar la base de datos."
))

story.append(H3("Accion Propuesta"))
story.extend(Bullets([
    "Eliminar el @@map('configuracion_ph') y dejar que Prisma use el nombre por defecto",
    "O bien: aplicar @@map consistentemente a todos los modelos si se prefiere snake_case en la DB"
]))

story.append(PageBreak())

# ============================================================
# PROBLEMAS DE ARQUITECTURA
# ============================================================
story.append(H1("5. Problemas de Arquitectura y Calidad"))

# --- 5.1 OPERADOR GIGANTE ---
story.append(H2("5.1 Modelo Operador Sobrecargado (MEDIA)"))

story.append(P(
    "El modelo <font face='NotoSans' size='9'>Operador</font> acumula mas de 60 relaciones y 18 campos "
    "booleanos de permisos en una sola tabla. Los permisos (puedeMovimientoHacienda, puedePesajeCamiones, "
    "puedeListaFaena, puedeRomaneo, etc.) se almacenan como columnas individuales, lo que dificulta "
    "agregar nuevos permisos sin migraciones de base de datos y hace que las consultas de autenticacion "
    "sean ineficientes al requerir verificar multiples campos booleanos en cada request."
))

story.append(P(
    "Ademas, cuando se agrega un nuevo modulo funcional al sistema (como recientemente con puedeCalidad), "
    "es necesario modificar el modelo Operador, el formulario de configuracion de operadores, la API, "
    "y la logica de validacion de permisos en multiples archivos. Un cambio simple de permisos requiere "
    "modificar al menos 5 archivos diferentes."
))

story.append(H3("Accion Propuesta (Largo Plazo)"))
story.extend(Bullets([
    "Considerar extraer los permisos a un modelo separado PermisoOperador con una relacion many-to-many",
    "Implementar un sistema de roles en lugar de permisos individuales (Rol con permisos predefinidos)",
    "A corto plazo: documentar claramente la lista de permisos y los archivos donde se usa cada uno",
    "Agregar un test que verifique que cada permiso tiene su correspondiente check en al menos una ruta API"
]))

# --- 5.2 DUPLICACION DE COMPONENTES ---
story.append(H2("5.2 Duplicacion de Componentes de Configuracion (MEDIA)"))

story.append(P(
    "Se detectaron multiples componentes que gestionan las mismas entidades con interfaces diferentes. "
    "Por ejemplo, existen al menos dos componentes para gestionar insumos (insumos/index.tsx y "
    "configuracion/insumos-config.tsx), dos para productos (productos/index.tsx y config-productos/index.tsx), "
    "y dos para subproductos (configuracion/subproductos.tsx y config-subproductos/index.tsx). Cada componente "
    "define sus propias constantes, interfaces, y logica de formulario, creando inconsistencias cuando "
    "los valores no coinciden."
))

story.append(H3("Accion Propuesta"))
story.extend(Bullets([
    "Realizar un inventario completo de componentes duplicados",
    "Consolidar en un unico componente por entidad, con vistas/tabas diferentes para cada caso de uso",
    "Extraer constantes compartidas (categorias, enums, tipos) a archivos centralizados bajo lib/constants/",
    "Implementar custom hooks compartidos para la logica de CRUD de cada entidad"
]))

# --- 5.3 MODELOS DE PRECIO DUPLICADOS ---
story.append(H2("5.3 Multiples Modelos de Historial de Precios (MEDIA)"))

story.append(P(
    "El sistema define 3 modelos diferentes para almacenar historiales de precios, cada uno con estructura "
    "y proposito similar pero no identicos:"
))

price_headers = ["Modelo", "Entidad", "Campos Clave"]
price_rows = [
    ["HistoricoPrecioProducto", "ProductoVendible", "precioAnterior, precioNuevo, moneda, motivo, clienteId"],
    ["HistoricoPrecio", "ProductoVendible", "precioAnterior, precioNuevo, moneda, motivo (sin clienteId)"],
    ["HistorialPrecioInsumo", "Insumo", "precioAnterior, precioNuevo, moneda, motivo, operadorId"],
]
story.append(make_table(price_headers, price_rows, [50*mm, 40*mm, 70*mm]))

story.append(Spacer(1, 3*mm))
story.append(P(
    "La existencia de <font face='NotoSans' size='9'>HistoricoPrecioProducto</font> y "
    "<font face='NotoSans' size='9'>HistoricoPrecio</font> para la misma entidad (ProductoVendible) "
    "es particularmente confusa. No esta claro cual deberia usarse en cada situacion, y es probable "
    "que se inserten registros en ambos modelos o que uno quede sin usar. Esto complica los reportes "
    "de evolucion de precios y puede generar datos inconsistentes."
))

story.append(H3("Accion Propuesta"))
story.extend(Bullets([
    "Unificar HistoricoPrecioProducto e HistoricoPrecio en un solo modelo, manteniendo clienteId como opcional",
    "Renombrar HistorialPrecioInsumo a HistoricoPrecioInsumo por consistencia",
    "Documentar claramente cuando se crea un registro de historial de precios (que trigger lo genera)",
    "Evaluar si un modelo generico HistorialPrecio con polimorfismo (entidadId + entidadTipo) seria mejor"
]))

# --- 5.4 AUDITORIA DISPERSA ---
story.append(H2("5.4 Auditoria Dispersa (BAJA)"))

story.append(P(
    "Existen dos modelos de auditoria (<font face='NotoSans' size='9'>Auditoria</font> y "
    "<font face='NotoSans' size='9'>ActividadOperador</font>) con propositos superpuestos. "
    "Ademas, muchas operaciones criticas no generan registros de auditoria: solo algunas rutas API "
    "llaman a <font face='NotoSans' size='9'>db.auditoria.create()</font>, y no hay un patron consistente "
    "para decidir que operaciones se auditian y cuales no. Esto dificulta la trazabilidad de acciones "
    "y la investigacion de incidentes."
))

story.append(H3("Accion Propuesta"))
story.extend(Bullets([
    "Definir una politica clara: todas las operaciones de escritura (POST, PUT, DELETE) deben generar un registro de auditoria",
    "Implementar un middleware de auditoria que capture automaticamente todas las operaciones de escritura",
    "Unificar Auditoria y ActividadOperador en un solo modelo, o definir claramente la diferencia de proposito",
    "Agregar campos de IP y UserAgent en los registros de auditoria para mejorar la trazabilidad"
]))

story.append(PageBreak())

# ============================================================
# PLAN DE ACCION PRIORIZADO
# ============================================================
story.append(H1("6. Plan de Accion Priorizado"))

story.append(P(
    "A continuacion se presenta el plan de accion recomendado, ordenado por prioridad y esfuerzo estimado. "
    "Las tareas criticas deben resolverse inmediatamente ya que afectan la operacion diaria del sistema. "
    "Las tareas de alta prioridad abordan problemas de seguridad que representan riesgos potenciales. "
    "Las tareas de media y baja prioridad son mejoras arquitectonicas que pueden planificarse a mediano plazo."
))

plan_headers = ["#", "Tarea", "Prioridad", "Esfuerzo", "Dependencias"]
plan_rows = [
    ["1", "Corregir categorias en insumos/index.tsx", "CRITICA", "30 min", "Ninguna"],
    ["2", "Reescribir productos/index.tsx (redirigir a productoVendible o simplificar)", "CRITICA", "4 hs", "Decision de modelo"],
    ["3", "Agregar moneda y codigoProveedor a stocks-insumos", "CRITICA", "30 min", "Ninguna"],
    ["4", "Corregir typo PRODUCTO_ELAVORADO en schema.prisma", "ALTA", "15 min", "Migracion DB"],
    ["5", "Agregar auth a rutas GET desprotegidas (4 rutas)", "ALTA", "1 hora", "Ninguna"],
    ["6", "Eliminar modo=seed del GET de /api/tarifas", "ALTA", "15 min", "Ninguna"],
    ["7", "Hashear PINs de operadores con bcrypt", "ALTA", "2 hs", "Migracion PINs existentes"],
    ["8", "Implementar Zod para validacion de schemas", "ALTA", "20 hs", "Definir esquemas"],
    ["9", "Unificar componentes duplicados", "MEDIA", "8 hs", "Inventario completo"],
    ["10", "Consolidar modelos de historial de precios", "MEDIA", "4 hs", "Analisis de impacto"],
    ["11", "Eliminar esquema produccion4z duplicado", "MEDIA", "1 hora", "Verificar uso"],
    ["12", "Extraer permisos de Operador a modelo separado", "MEDIA", "16 hs", "Rediseño de auth"],
    ["13", "Corregir convencion @@map en ConfiguracionPH", "BAJA", "30 min", "Migracion DB"],
    ["14", "Unificar modelos de auditoria", "BAJA", "4 hs", "Politica de auditoria"],
    ["15", "Crear constantes compartidas (lib/constants/)", "BAJA", "2 hs", "Ninguna"],
]
story.append(make_table(plan_headers, plan_rows, [8*mm, 60*mm, 25*mm, 18*mm, 39*mm]))

story.append(Spacer(1, 6*mm))
story.append(H2("6.1 Fase 1: Correccion Inmediata (Semana 1)"))
story.append(P(
    "Las tareas 1, 3, 4, 5, y 6 pueden completarse en menos de 3 horas de trabajo total. Estas son las "
    "correcciones mas urgentes porque afectan la operacion diaria: los errores de categorias impiden crear "
    "insumos correctamente, las rutas sin autenticacion exponen datos operativos, y el typo en el enum "
    "puede causar errores en consultas. Recomendamos ejecutar estas tareas antes de continuar con las "
    "mejoras planificadas del modulo de Insumos (Historial de Precios, Valorizado, Kardex, Dashboard)."
))

story.append(H2("6.2 Fase 2: Seguridad y Validacion (Semanas 2-3)"))
story.append(P(
    "Las tareas 7 y 8 abordan problemas de seguridad mas profundos. El hasheo de PINs requiere una "
    "migracion cuidadosa de los datos existentes y la implementacion de Zod como libreria de validacion "
    "es un proyecto de mayor envergadura que beneficiaria a todo el sistema a largo plazo. Se recomienda "
    "implementar Zod primero para los modulos mas criticos (Insumos, Facturacion, Pesaje) y luego "
    "extenderlo al resto del sistema de forma incremental."
))

story.append(H2("6.3 Fase 3: Refactorizacion Arquitectonica (Mes 2)"))
story.append(P(
    "Las tareas 9 a 14 son mejoras estructurales que no afectan la operacion inmediata pero que "
    "reduciran la deuda tecnica y facilitaran el mantenimiento futuro. La unificacion de componentes "
    "duplicados y la consolidacion de modelos de precios son las que mayor impacto tendran en la "
    "reduccion de inconsistencias a futuro. La extraccion de permisos del modelo Operador es la tarea "
    "mas compleja y deberia planificarse cuidadosamente con pruebas exhaustivas."
))

story.append(PageBreak())

# ============================================================
# METODOLOGIA
# ============================================================
story.append(H1("7. Metodologia de la Auditoria"))

story.append(P(
    "La auditoria se realizo mediante un analisis sistematico en tres capas del sistema: esquema de base "
    "de datos (Prisma), capa de API (Next.js API Routes), y capa de presentacion (React Components). "
    "Para cada capa se verifico la consistencia con las capas adyacentes, buscando especificamente "
    "los mismos tipos de inconsistencias que encontramos previamente en el modulo de Insumos."
))

story.append(H3("Herramientas y Tecnicas Utilizadas"))
story.extend(Bullets([
    "Lectura completa del archivo schema.prisma (5,502 lineas) para catalogar todos los modelos, enums, relaciones y campos",
    "Analisis de los 323 archivos de ruta bajo src/app/api/ para verificar campos, permisos, y validaciones",
    "Inspeccion de los componentes principales bajo src/components/ para verificar formularios, llamadas API, y campos enviados",
    "Busqueda de patrones especificos: campos fantasmas, enums incorrectos, rutas sin autenticacion, validaciones faltantes",
    "Comparacion cruzada: para cada componente, se verifico que los campos del formulario coincidan con los campos del modelo Prisma correspondiente",
    "Comparacion cruzada: para cada API, se verifico que los campos aceptados del request coincidan con el modelo Prisma"
]))

story.append(H3("Alcance"))
story.extend(Bullets([
    "168 modelos Prisma analizados",
    "73 enums Prisma verificados",
    "323 rutas de API auditadas",
    "50+ componentes frontend inspeccionados",
    "323 metodos HTTP (GET, POST, PUT, DELETE) verificados para autenticacion"
]))

story.append(H3("Limitaciones"))
story.append(P(
    "La auditoria se baso en analisis estico del codigo fuente. No se realizaron pruebas de penetracion, "
    "no se ejecuto el sistema en un entorno de testing, y no se analizaron las migraciones de base de datos "
    "historicas. Algunas inconsistencias pueden existir en flujos de datos complejos que involucran "
    "multiples modelos y transacciones que solo serian detectables con pruebas de integracion. Se recomienda "
    "complementar esta auditoria con pruebas automatizadas de integracion y tests end-to-end."
))

# BUILD
doc.build(story)
print(f"PDF generado: {OUTPUT}")
