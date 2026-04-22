import sys, os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.units import mm, cm
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.platypus.flowables import HRFlowable

# Colors
C_PRIMARY = HexColor('#1e40af')
C_DARK = HexColor('#0f172a')
C_RED = HexColor('#dc2626')
C_ORANGE = HexColor('#ea580c')
C_YELLOW = HexColor('#ca8a04')
C_GREEN = HexColor('#16a34a')
C_BLUE = HexColor('#2563eb')
C_GRAY = HexColor('#64748b')
C_LIGHT = HexColor('#f1f5f9')
C_WHITE = white

output_path = '/home/z/my-project/download/Auditoria_TRZ5_Inconsistencias.pdf'

doc = SimpleDocTemplate(
    output_path,
    pagesize=A4,
    leftMargin=20*mm,
    rightMargin=20*mm,
    topMargin=20*mm,
    bottomMargin=20*mm,
    title='Auditoria TRZ5 - Reporte de Inconsistencias',
    author='Z.ai',
    subject='Auditoria completa de inconsistencias en TRZ5'
)

W = A4[0] - 40*mm
styles = getSampleStyleSheet()

# Custom styles
s_title = ParagraphStyle('Title', parent=styles['Title'], fontSize=28, textColor=C_DARK, spaceAfter=6, fontName='Helvetica-Bold')
s_subtitle = ParagraphStyle('Subtitle', parent=styles['Normal'], fontSize=14, textColor=C_GRAY, spaceAfter=20, fontName='Helvetica')
s_h1 = ParagraphStyle('H1', parent=styles['Heading1'], fontSize=18, textColor=C_PRIMARY, spaceBefore=16, spaceAfter=8, fontName='Helvetica-Bold')
s_h2 = ParagraphStyle('H2', parent=styles['Heading2'], fontSize=14, textColor=C_DARK, spaceBefore=12, spaceAfter=6, fontName='Helvetica-Bold')
s_h3 = ParagraphStyle('H3', parent=styles['Heading3'], fontSize=11, textColor=C_DARK, spaceBefore=8, spaceAfter=4, fontName='Helvetica-Bold')
s_body = ParagraphStyle('Body', parent=styles['Normal'], fontSize=9, leading=13, alignment=TA_JUSTIFY, spaceAfter=4, fontName='Helvetica')
s_small = ParagraphStyle('Small', parent=styles['Normal'], fontSize=8, leading=11, alignment=TA_JUSTIFY, spaceAfter=3, fontName='Helvetica')
s_sev = ParagraphStyle('Severity', parent=styles['Normal'], fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)

story = []

# ===== COVER =====
story.append(Spacer(1, 60*mm))
story.append(Paragraph('AUDITORIA DE CODIGO', ParagraphStyle('CoverTitle', parent=s_title, fontSize=32, alignment=TA_CENTER)))
story.append(Spacer(1, 4*mm))
story.append(HRFlowable(width='60%', thickness=2, color=C_PRIMARY, spaceAfter=8*mm, spaceBefore=4*mm))
story.append(Paragraph('TRZ5 - Sistema de Gestion Frigorifica', ParagraphStyle('CoverSub', parent=s_subtitle, fontSize=16, alignment=TA_CENTER, textColor=C_PRIMARY)))
story.append(Spacer(1, 8*mm))
story.append(Paragraph('Reporte de Inconsistencias y Propuestas de Accion', ParagraphStyle('CoverDesc', parent=s_body, fontSize=12, alignment=TA_CENTER, textColor=C_GRAY)))
story.append(Spacer(1, 20*mm))

# Summary box
summary_data = [
    [Paragraph('<b>Resumen Ejecutivo</b>', ParagraphStyle('SH', fontSize=11, textColor=C_WHITE, fontName='Helvetica-Bold'))],
    [Paragraph('Se auditaron 5 grupos de modulos del sistema TRZ5, comparando el schema Prisma (fuente de verdad) contra las rutas API y componentes frontend. Se encontraron <b>87 inconsistencias</b> en total, distribuidas en 4 niveles de severidad.', s_body)],
]
summary_table = Table(summary_data, colWidths=[W])
summary_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), C_PRIMARY),
    ('BACKGROUND', (0, 1), (-1, -1), C_LIGHT),
    ('BOX', (0, 0), (-1, -1), 1, C_PRIMARY),
    ('INNERPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(summary_table)

story.append(Spacer(1, 15*mm))

# Stats table
stats_data = [
    [Paragraph('<b>CRITICAS</b>', s_sev), Paragraph('<b>ALTAS</b>', s_sev), Paragraph('<b>MEDIAS</b>', s_sev), Paragraph('<b>BAJAS</b>', s_sev), Paragraph('<b>TOTAL</b>', s_sev)],
    [Paragraph('<font color="#dc2626"><b>11</b></font>', ParagraphStyle('SC', fontSize=18, alignment=TA_CENTER, fontName='Helvetica-Bold')),
     Paragraph('<font color="#ea580c"><b>18</b></font>', ParagraphStyle('SH', fontSize=18, alignment=TA_CENTER, fontName='Helvetica-Bold')),
     Paragraph('<font color="#ca8a04"><b>38</b></font>', ParagraphStyle('SM', fontSize=18, alignment=TA_CENTER, fontName='Helvetica-Bold')),
     Paragraph('<font color="#16a34a"><b>20</b></font>', ParagraphStyle('SL', fontSize=18, alignment=TA_CENTER, fontName='Helvetica-Bold')),
     Paragraph('<b>87</b>', ParagraphStyle('ST', fontSize=18, alignment=TA_CENTER, fontName='Helvetica-Bold'))],
]
stats_table = Table(stats_data, colWidths=[W/5]*5)
stats_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), C_DARK),
    ('TEXTCOLOR', (0, 0), (-1, 0), C_WHITE),
    ('BACKGROUND', (0, 1), (-1, 1), C_WHITE),
    ('BOX', (0, 0), (-1, -1), 1, C_DARK),
    ('INNERGRID', (0, 0), (-1, -1), 0.5, HexColor('#e2e8f0')),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
]))
story.append(stats_table)

story.append(Spacer(1, 15*mm))
story.append(Paragraph('Fecha: 23 de Abril, 2026', ParagraphStyle('Date', parent=s_body, alignment=TA_CENTER, textColor=C_GRAY)))
story.append(Paragraph('Generado por: Z.ai - Herramienta de Auditoria Automatica', ParagraphStyle('Gen', parent=s_body, alignment=TA_CENTER, textColor=C_GRAY, fontSize=8)))

story.append(PageBreak())

# ===== HELPER FUNCTIONS =====
def sev_badge(sev):
    colors = {'CRITICA': C_RED, 'ALTA': C_ORANGE, 'MEDIA': C_YELLOW, 'BAJA': C_GREEN}
    labels = {'CRITICA': 'CRITICA', 'ALTA': 'ALTA', 'MEDIA': 'MEDIA', 'BAJA': 'BAJA'}
    c = colors.get(sev, C_GRAY)
    return Paragraph(f'<font color="{c.hexval()}"><b>{labels[sev]}</b></font>', s_sev)

def finding_table(items):
    """items = list of (sev, id, title, file, desc, fix)"""
    header = [
        Paragraph('<b>Sev.</b>', s_sev),
        Paragraph('<b>ID</b>', s_sev),
        Paragraph('<b>Descripcion</b>', s_small),
        Paragraph('<b>Archivo</b>', s_small),
        Paragraph('<b>Accion Propuesta</b>', s_small),
    ]
    rows = [header]
    for sev, fid, title, file, desc, fix in items:
        rows.append([
            sev_badge(sev),
            Paragraph(f'<b>{fid}</b>', ParagraphStyle('ID', fontSize=7, fontName='Helvetica-Bold')),
            Paragraph(f'<b>{title}</b><br/>{desc}', s_small),
            Paragraph(file, ParagraphStyle('File', fontSize=7, fontName='Helvetica', textColor=C_BLUE)),
            Paragraph(fix, s_small),
        ])
    t = Table(rows, colWidths=[14*mm, 16*mm, W*0.28, W*0.24, W*0.28])
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), C_DARK),
        ('TEXTCOLOR', (0, 0), (-1, 0), C_WHITE),
        ('BOX', (0, 0), (-1, -1), 0.5, C_DARK),
        ('INNERGRID', (0, 0), (-1, -1), 0.25, HexColor('#e2e8f0')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
    ]
    # Alternate row colors
    for i in range(1, len(rows)):
        if i % 2 == 0:
            style_cmds.append(('BACKGROUND', (0, i), (-1, i), C_LIGHT))
    t.setStyle(TableStyle(style_cmds))
    return t

# ===== GROUP 1: INSUMOS, STOCK, PRODUCTOS =====
story.append(Paragraph('1. Grupo: Insumos, Stock, Productos y Modulos Relacionados', s_h1))
story.append(Paragraph('Se auditaron los modulos de Insumos, Stock de Insumos, Movimientos de Insumos, Productos, Menudencias, Camaras, Corrales, Subproductos, Condiciones de Embalaje, Tipos de Producto y Categorias de Insumos. Se verifico la alineacion de campos entre el schema Prisma, las rutas API y los componentes frontend.', s_body))
story.append(Spacer(1, 4*mm))

story.append(Paragraph('1.1 Hallazgos Criticos', s_h2))
story.append(Paragraph('INS-01 | Productos: Componente completamente desalineado con schema', s_h3))
story.append(Paragraph('El componente <font face="Courier" size="8">src/components/productos/index.tsx</font> tiene una interfaz TypeScript con mas de 30 campos fantasmas que no existen en el modelo <font face="Courier" size="8">Producto</font> del schema Prisma. Campos como <font face="Courier" size="8">codigoSecundario</font>, <font face="Courier" size="8">vencimiento</font> (deberia ser <font face="Courier" size="8">diasConservacion</font>), <font face="Courier" size="8">nroSenasa</font>, <font face="Courier" size="8">unidad</font>, <font face="Courier" size="8">precioDolar</font> (deberia ser <font face="Courier" size="8">precio</font>), <font face="Courier" size="8">jaslo</font>, <font face="Courier" size="8">empresa</font> y muchos otros no existen en la base de datos. Ademas, el componente envia <font face="Courier" size="8">setProductos(data)</font> cuando deberia ser <font face="Courier" size="8">setProductos(data.data)</font>, lo que provoca errores de renderizado. La busqueda usa el parametro <font face="Courier" size="8">buscar</font> pero la API espera <font face="Courier" size="8">especie</font>. Este es el mismo patron de bug que se encontro previamente en el modulo de Insumos.', s_body))
story.append(Spacer(1, 3*mm))

story.append(Paragraph('INS-02 | Insumos: Categorias con valores incorrectos', s_h3))
story.append(Paragraph('El componente <font face="Courier" size="8">src/components/insumos/index.tsx</font> define la constante <font face="Courier" size="8">CATEGORIAS</font> con valores que NO coinciden con el enum <font face="Courier" size="8">CategoriaInsumoTipo</font> del schema. El componente usa <font face="Courier" size="8">LIMPIEZA</font> (schema: <font face="Courier" size="8">HIGIENE</font>), <font face="Courier" size="8">EPP</font> (schema: <font face="Courier" size="8">PROTECCION</font>), <font face="Courier" size="8">REPUESTOS</font> (schema: <font face="Courier" size="8">HERRAMIENTAS</font>), <font face="Courier" size="8">OTRO</font> (schema: <font face="Courier" size="8">OTROS</font>), y ademas falta <font face="Courier" size="8">OFICINA</font>. Al crear un insumo, se envia un valor de enum invalido a Prisma, lo que causa un error en runtime. El mapeo de colores de badges tambien esta afectado. Ademas, los parametros de fecha del Kardex usan <font face="Courier" size="8">desde/hasta</font> pero la API espera <font face="Courier" size="8">fechaDesde/fechaHasta</font>, haciendo que el filtrado de fechas no funcione.', s_body))
story.append(Spacer(1, 3*mm))

story.append(Paragraph('1.2 Hallazgos Adicionales Grupo 1', s_h2))
story.append(finding_table([
    ('MEDIA', 'INS-03', 'Stock Insumos: GET devuelve array raw sin wrapper', 'stock-insumos/route.ts:44', 'Agregar wrapper { success: true, data: ... }', 'Envolver respuesta en formato estandar'),
    ('MEDIA', 'INS-04', 'Mov. Insumos: POST devuelve objeto raw', 'movimientos-insumos/route.ts:284', 'Agregar wrapper estandar', 'Envolver respuesta'),
    ('BAJA', 'INS-05', 'Referencia muerta a SALIDA en tipo movimiento', 'insumos/index.tsx:571,849', 'Eliminar verificaciones de SALIDA', 'Limpieza de codigo muerto'),
]))
story.append(Spacer(1, 6*mm))

# ===== GROUP 2: TROPAS, ANIMALES, PESAJE, ROMANEO =====
story.append(Paragraph('2. Grupo: Tropas, Animales, Pesaje, Romaneo y Lista de Faena', s_h1))
story.append(Paragraph('Se auditaron los modulos centrales de operacion: Tropas, Animales, Pesaje de Camion, Pesaje Individual, Romaneo, Lista de Faena, Asignacion de Garrones y Visto Bueno de Romaneo. Estos modulos manejan el flujo principal del negocio.', s_body))
story.append(Spacer(1, 4*mm))

story.append(Paragraph('2.1 Hallazgos Criticos', s_h2))
story.append(finding_table([
    ('CRITICA', 'TA-01', 'productorId validado contra modelo equivocado', 'pesaje-camion/route.ts:253', 'Cambiar db.cliente.findUnique a db.productorConsignatario.findUnique', 'La FK apunta a ProductorConsignatario, no a Cliente'),
    ('CRITICA', 'TA-02', 'Campo factura de PesajeCamion nunca poblado', 'pesaje-camion/route.ts', 'Agregar campo factura al form y API para SALIDA_MERCADERIA', 'Dato regulatorio faltante'),
    ('CRITICA', 'TA-03', 'Campo precintos de PesajeCamion nunca poblado', 'pesaje-camion/route.ts', 'Agregar campo precintos al form y API para SALIDA_MERCADERIA', 'Dato SENASA faltante'),
]))
story.append(Spacer(1, 3*mm))

story.append(Paragraph('2.2 Hallazgos Altos', s_h2))
story.append(finding_table([
    ('ALTA', 'TA-04', 'Estado BORRADOR definido pero nunca manejado en API', 'pesaje-camion, lista-faena, romaneo routes', 'Implementar endpoints de auto-save o eliminar enum', 'PesajeCamion, ListaFaena, Romaneo tienen BORRADOR sin uso'),
    ('ALTA', 'TA-05', 'Romaneo pesar auto-confirma, bypass de aprobacion', 'romaneo/pesar/route.ts:303', 'Eliminar auto-confirmacion, requerir confirmar explicito', 'El flujo de aprobacion por supervisor es ignorado'),
    ('ALTA', 'TA-06', 'PesajeIndividual PUT no recalcula pesoTotalIndividual', 'pesaje-individual/route.ts:184', 'Extraer recalculo a funcion compartida POST/PUT', 'Peso total de tropa queda desactualizado'),
    ('ALTA', 'TA-07', 'Animales DELETE sin limpieza de relaciones', 'animales/route.ts:180', 'Agregar chequeo de PesajeIndividual, AsignacionGarron, stock', 'Falla por constraint FK o registros huerfanos'),
]))
story.append(Spacer(1, 3*mm))

story.append(Paragraph('2.3 Hallazgos Medios y Bajos', s_h2))
story.append(finding_table([
    ('MEDIA', 'TA-08', 'Romaneo eliminar hardcodea especie BOVINO', 'romaneo/eliminar/route.ts:82', 'Derivar especie del romaneo/tropa', 'Stock equino no se actualiza'),
    ('MEDIA', 'TA-09', 'Romaneo pesar hardcodea especie BOVINO', 'romaneo/pesar/route.ts:183', 'Derivar especie del romaneo/tropa', 'Mismo problema en crear'),
    ('MEDIA', 'TA-10', 'lista-faena/cerrar no actualiza estados animal/tropa', 'lista-faena/cerrar/route.ts:39', 'Agregar actualizacion de animales a FAENADO', 'Animales quedan en EN_FAENA'),
    ('MEDIA', 'TA-11', 'Lista Faena componente missing BORRADOR y EN_PROCESO', 'lista-faena/index.tsx:23', 'Agregar BORRADOR y EN_PROCESO a ESTADOS_LISTA', 'Sin badge para esos estados'),
    ('MEDIA', 'TA-12', 'Dos APIs de asignacion de garrones solapadas', 'lista-faena/asignar, garrones-asignados', 'Consolidar en una sola API con transacciones', 'Riesgo de race conditions'),
    ('MEDIA', 'TA-13', 'MediaRes crear 1 en pesar vs 2 en confirmar', 'romaneo/pesar, romaneo/confirmar', 'Unificar logica de creacion de medias', 'Stock trunca en pesar'),
    ('BAJA', 'TA-14', 'Tropa PUT saltea cantidadCabezas cuando es 0', 'tropas/route.ts:219', 'Cambiar if(cantidadCabezas) a if(cantidadCabezas !== undefined)', 'Valor 0 es legitimo'),
    ('BAJA', 'TA-15', 'EstadoTropa DESPACHADO nunca alcanzado', 'todas las rutas', 'Agregar transicion a DESPACHADO en flujo de despacho', 'Estado definido sin uso'),
]))
story.append(Spacer(1, 6*mm))

# ===== GROUP 3: FACTURACION, CLIENTES, DESPACHOS =====
story.append(Paragraph('3. Grupo: Facturacion, Clientes, Despachos y Modulos Financieros', s_h1))
story.append(Paragraph('Se auditaron los modulos de Facturacion (incluyendo Notas de Credito/Debito), Clientes, Despachos, Liquidaciones, Pagos, Cuenta Corriente, Precios, Transportistas, Productores y Proveedores.', s_body))
story.append(Spacer(1, 4*mm))

story.append(Paragraph('3.1 Hallazgos Criticos y Altos', s_h2))
story.append(finding_table([
    ('CRITICA', 'FN-01', 'Resumen facturacion usa campos fantasmas en DetalleFactura', 'facturacion/resumen/route.ts:65', 'Derivar KPIs de TipoServicio o LiquidacionFaena', 'Todos los resumenes devuelven siempre 0'),
    ('ALTA', 'FN-02', 'Frontend missing BORRADOR estado de factura', 'facturacion/index.tsx:122', 'Agregar BORRADOR a tipo y badge renderer', 'Factura en BORRADOR rompe la UI'),
    ('ALTA', 'FN-03', 'Frontend missing campos AFIP en Factura', 'facturacion/index.tsx:104', 'Agregar campos AFIP a interfaz TypeScript', 'QR, CAE no mostrables'),
    ('ALTA', 'FN-04', 'Campo fantasma fechaEntrega en Despacho causa crash', 'despachos/route.ts:248', 'Eliminar fechaEntrega o agregar al schema', 'Error Prisma en runtime al entregar'),
    ('ALTA', 'FN-05', 'Modelos Pago y PagoFactura desconectados', 'pagos/route.ts:240', 'Agregar FK pagoId a PagoFactura o aclarar arquitectura', 'Anular pago no afecta saldos'),
]))
story.append(Spacer(1, 3*mm))

story.append(Paragraph('3.2 Hallazgos Medios y Bajos', s_h2))
story.append(finding_table([
    ('MEDIA', 'FN-06', 'NotasCreditoDebito.estado es String no enum', 'schema.prisma:3209', 'Migrar a EstadoNota enum', 'Valores inconsistentes'),
    ('MEDIA', 'FN-07', 'DELETE duplicado en facturas con comportamiento diferente', 'facturacion/route.ts:384, [id]/route.ts:193', 'Consolidar en un solo endpoint', 'Uno verifica pagos, otro no'),
    ('MEDIA', 'FN-08', 'PUT factura no actualiza saldo', 'facturacion/[id]/route.ts:117', 'Recalcular saldo cuando cambia total', 'Saldo desactualizado'),
    ('MEDIA', 'FN-09', 'METODOS_PAGO frontend no matchea schema', 'facturacion/index.tsx:145', 'Alinear TARJETA_DEBITO/CREDITO con valores API', 'Valores invalidos almacenados'),
    ('MEDIA', 'FN-10', 'Cuenta corriente bug debe:1 en pago', 'pagos-factura/route.ts:285', 'Cambiar debe:1 a debe:0', 'Balance alterado en CT'),
    ('MEDIA', 'FN-11', 'Despacho transportistaId nunca seteado en POST', 'despachos/route.ts:87', 'Mapear transportistaId desde body', 'Despachos sin FK a transportista'),
    ('MEDIA', 'FN-12', 'precios-servicio POST skip historial', 'precios-servicio/route.ts:75', 'Crear registro PrecioHistorial', 'Trail de precios incompleto'),
    ('MEDIA', 'FN-13', 'precios-servicio PUT pasa body raw a Prisma', 'precios-servicio/route.ts:158', 'Filtrar solo campos permitidos', 'Posible sobreescribir FK'),
    ('MEDIA', 'FN-14', 'condicionIva String vs CondicionIva enum mismatch', 'schema.prisma:318, facturacion/route.ts:279', 'Migrar a enum o validar cast', 'Posible error de cast'),
    ('MEDIA', 'FN-15', 'Proveedor PUT sobreescribe todos los campos', 'proveedores/route.ts:107', 'Agregar checks condicionales como en Clientes', 'Partial update borra datos'),
    ('BAJA', 'FN-16', 'PrecioCliente.fechaDesde nunca seteado', 'precios-cliente/route.ts:89', 'Agregar fechaDesde: new Date()', 'No se puede saber inicio vigencia'),
    ('BAJA', 'FN-17', 'Proveedor hard delete en vez de soft delete', 'proveedores/route.ts:155', 'Cambiar a activo: false', 'Falla FK con OrdenCompra'),
]))
story.append(Spacer(1, 6*mm))

# ===== GROUP 4: CALIDAD, C2, CAMARAS, ALERTAS =====
story.append(Paragraph('4. Grupo: Calidad, Ciclo 2, Camaras y Alertas', s_h1))
story.append(Paragraph('Se auditaron los modulos de Calidad (Reclamos, pH, Novedades), todos los modulos del Ciclo 2 (Desposte, Degradacion, Expedicion, Produccion de Cajas, Pallets, Stock, Subproductos, Rubros, BOM, Rendimiento, Tipos de Cuarto), Alertas de Stock, Cueros, Rendering, Grasa Dressing, Decomisos, Empaque, Ingreso a Despostada y Cuarteo.', s_body))
story.append(Spacer(1, 4*mm))

story.append(Paragraph('4.1 Hallazgos Criticos y Altos', s_h2))
story.append(finding_table([
    ('CRITICA', 'C2-01', 'GrasaDressing: campos fantasmas y tipo faltante en frontend', 'grasa-dressing/index.tsx:31', 'Alinear interfaz con schema, agregar campo tipo', 'precioKg, vendido, fechaIngreso no existen; tipo siempre RENDERING'),
    ('CRITICA', 'C2-02', 'APIs duplicadas de Pallet con comportamiento conflictivo', 'pallet/route.ts, c2-pallets/route.ts', 'Consolidar en /api/c2-pallets, deprecate la otra', 'DELETE restaura cajas a estados diferentes'),
    ('ALTA', 'C2-03', 'Decomiso pesoKg nunca seteado por API', 'decomisos/route.ts:64', 'Agregar pesoKg al mapping de request/response', 'Reportes sumando null'),
    ('ALTA', 'C2-04', 'C2 Expedicion ANULADO no limpia palletId en cajas', 'c2-expedicion/route.ts:240', 'Agregar palletId: null al restaurar cajas', 'Cajas huerfanas de pallet'),
    ('ALTA', 'C2-05', 'C2 Tipo Cuarto DELETE sin chequeo FK', 'c2-tipos-cuarto/route.ts:154', 'Agregar count de Cuartos antes de eliminar', 'Error FK en runtime'),
    ('ALTA', 'C2-06', 'NovedadCalidad.estado es String libre, no enum', 'schema.prisma:4837', 'Crear enum EstadoNovedadCalidad', 'Typos crean datos no filtrables'),
    ('ALTA', 'C2-07', 'AlertasStock GET formato de respuesta inconsistente', 'alertas/stock/route.ts:42', 'Agregar wrapper { success: true, data: ... }', 'Frontend espera wrapper estandar'),
]))
story.append(Spacer(1, 3*mm))

story.append(Paragraph('4.2 Hallazgos Medios y Bajos', s_h2))
story.append(finding_table([
    ('MEDIA', 'C2-08', 'Rendering/Cueros/Grasa PUT pasa body raw a Prisma', 'rendering, cueros, grasa-dressing routes', 'Filtrar campos permitidos antes de update', 'Posible sobreescribir createdAt'),
    ('MEDIA', 'C2-09', 'Tres rutas de creacion de CajaEmpaque solapadas', 'cajas, caja-empaque, c2-produccion-cajas', 'Consolidar en ruta canonica', 'Colision de numeros'),
    ('MEDIA', 'C2-10', 'mapTipoCuarto es heuristica fragil', 'cuarteo/route.ts:6', 'Usar lookup de C2TipoCuarto', 'Mapeo incorrecto por iniciales'),
    ('MEDIA', 'C2-11', 'Ingreso Despostada dos rutas con estados iniciales distintos', 'ingreso-despostada, c2-ingreso-desposte', 'Unificar estado inicial', 'PENDIENTE vs INGRESADO'),
    ('MEDIA', 'C2-12', 'C2 Stock filtro camara no filtra cajas sueltas', 'c2-stock/route.ts:23', 'Agregar filtro por camara real', 'Retorna cajas de cualquier camara'),
    ('MEDIA', 'C2-13', 'C2 Degradacion no calcula vencimiento', 'c2-degradacion/route.ts:127', 'Agregar calculo de diasVencimiento del producto', 'Cajas degradadas sin vto'),
    ('BAJA', 'C2-14', 'Calidad pH rango NORMAL ambiguo en label', 'calidad-ph/config/route.ts:31', 'Usar >= en vez de - para rango', 'pH 5.4 se clasifica normal pero label dice 5.4-5.7'),
    ('BAJA', 'C2-15', 'Rendering/Cueros stats en memoria para todos los registros', 'rendering, cueros routes', 'Usar groupBy/aggregate de DB', 'Performance con muchos registros'),
    ('BAJA', 'C2-16', 'AlertasStock GET ordena prioridad alfabeticamente', 'alertas/stock/route.ts:31', 'Usar CASE expression o sort in-memory', 'CRITICA no ordena primero'),
]))
story.append(Spacer(1, 6*mm))

# ===== GROUP 5: AUTH, MIDDLEWARE, CONFIG, SECURITY =====
story.append(Paragraph('5. Grupo: Autenticacion, Middleware, Configuracion y Seguridad', s_h1))
story.append(Paragraph('Se auditaron los modulos de Auth/Login, Middleware (rate limiting), Operadores, Rótulos, CCIR, Declaracion Jurada, Auditoria, Backup, Seguridad, Reportes, Dashboard, SIGICA, AFIP y Flujo de Faena. Este grupo incluye los hallazgos mas criticos desde el punto de vista de seguridad.', s_body))
story.append(Spacer(1, 4*mm))

story.append(Paragraph('5.1 Hallazgos Criticos y Altos', s_h2))
story.append(finding_table([
    ('CRITICA', 'SC-01', 'PIN almacenado y comparado en texto plano', 'auth/route.ts:232, auth/supervisor/route.ts:38', 'Hashear PINs con bcrypt, migrar datos existentes', 'Vulnerabilidad de seguridad critica'),
    ('ALTA', 'SC-02', 'operadorIdAuth del body bypassa JWT', 'operadores/route.ts:67', 'Eliminar fallback body.operadorIdAuth', 'Cualquier usuario puede suplantar identidad'),
    ('ALTA', 'SC-03', 'Permiso fantasma puedeDashboardFinanciero en middleware', 'middleware.ts:209', 'Agregar campo al modelo o usar permiso existente', 'Error Prisma o acceso denzado erroneo'),
    ('ALTA', 'SC-04', 'Backup usa ruta SQLite pero DB es PostgreSQL', 'backup/ejecutar/route.ts:29', 'Reemplazar con pg_dump o Prisma schema export', 'Backups siempre fallan'),
    ('ALTA', 'SC-05', 'AFIP GET/DELETE sin check de permisos', 'afip/config/route.ts:16,221', 'Agregar checkPermission(puedeConfiguracion)', 'Cualquier usuario lee/borra AFIP'),
]))
story.append(Spacer(1, 3*mm))

story.append(Paragraph('5.2 Hallazgos Medios y Bajos', s_h2))
story.append(finding_table([
    ('MEDIA', 'SC-06', 'Fallas de login no registradas en IntentoLogin', 'auth/route.ts', 'Crear registro en IntentoLogin en cada intento', 'Tabla vacia, seguridad sin auditar'),
    ('MEDIA', 'SC-07', 'No se crean registros Sesion en login', 'auth/route.ts:162', 'Crear Sesion en login, eliminar en logout', 'No se puede controlar concurrencia'),
    ('MEDIA', 'SC-08', 'Rate limiting en memoria no escala', 'rate-limit.ts:19', 'Migrar a Redis para produccion', 'Bypass trivial con multi-instance'),
    ('MEDIA', 'SC-09', 'ConfiguracionSeguridad no se enforcea en login', 'seguridad/config, auth routes', 'Validar password contra config en login/create', 'Politicas de seguridad ignoradas'),
    ('MEDIA', 'SC-10', 'Rotulos: editor visual envia tipo ETIQUETA invalido', 'config-rotulos/index.tsx:712', 'Cambiar a valor valido de TipoRotulo enum', 'Error Prisma en runtime'),
    ('MEDIA', 'SC-11', 'FlujoFaena estado String libre, no enum', 'schema.prisma:4659', 'Crear enum EstadoFlujoFaena', 'No hay type safety'),
    ('MEDIA', 'SC-12', 'FlujoFaena verify no setea datosVerificados', 'flujo-faena/[id]/verificar/route.ts:60', 'Agregar datosVerificados: true', 'Visto bueno inalcanzable'),
    ('MEDIA', 'SC-13', 'FlujoFaena PUT bypass flags de workflow', 'flujo-faena/route.ts:143', 'Agregar seteo de booleanos y timestamps', 'Saltar pasos del flujo'),
    ('MEDIA', 'SC-14', 'Config AFIP usa dos modelos diferentes', 'schema.prisma:3226, 4878', 'Consolidar en un solo modelo', 'Confusion de fuente de verdad'),
    ('BAJA', 'SC-15', 'bcrypt rounds inconsistentes (10 vs 12)', 'operadores/route.ts:142, security.ts', 'Unificar a SALT_ROUNDS=12', 'Inconsistencia menor'),
    ('BAJA', 'SC-16', 'Reportes typo reine en vez de rinde', 'reportes/route.ts:241', 'Corregir typo a rinde', 'Error de display'),
    ('BAJA', 'SC-17', 'corralId filter aceptado pero no usado', 'reportes/route.ts:25', 'Agregar a clausula where o eliminar', 'Filtro sin efecto'),
    ('BAJA', 'SC-18', 'Dashboard metas hardcoded', 'dashboard/route.ts:169', 'Usar modelo Indicador existente', 'No configurable'),
    ('BAJA', 'SC-19', 'SIGICA password en texto plano en DB', 'schema.prisma:4905', 'Encriptar password en reposo', 'Vulnerabilidad menor'),
    ('BAJA', 'SC-20', 'CCIR/DJ operadorId del body en vez de JWT', 'ccir, declaracion-jurada routes', 'Usar header x-operador-id', 'Posible suplantacion'),
]))
story.append(PageBreak())

# ===== PLAN DE ACCION PRIORITARIO =====
story.append(Paragraph('6. Plan de Accion Prioritario', s_h1))
story.append(Paragraph('A continuacion se presenta el plan de accion recomendado, ordenado por prioridad de ejecucion. Las acciones criticas deben resolverse inmediatamente ya que causan errores en produccion o vulnerabilidades de seguridad. Las acciones altas deben abordarse en el corto plazo para prevenir problemas operativos. Las medias y bajas pueden planificarse para sprints posteriores.', s_body))
story.append(Spacer(1, 4*mm))

story.append(Paragraph('Fase 1 - Acciones Inmediatas (Semana 1)', s_h2))
plan1 = [
    ['SC-01', 'Hashear PINs con bcrypt y migrar datos existentes'],
    ['SC-02', 'Eliminar fallback operadorIdAuth del body'],
    ['FN-04', 'Eliminar campo fantasma fechaEntrega de Despacho'],
    ['INS-02', 'Corregir valores de CATEGORIAS en componente Insumos'],
    ['INS-01', 'Reescribir componente Productos para alinear con schema'],
    ['SC-05', 'Agregar checkPermission a AFIP GET/DELETE'],
    ['TA-01', 'Corregir validacion de productorId a ProductorConsignatario'],
]
t_plan1 = Table([[Paragraph(f'<b>{r[0]}</b>', ParagraphStyle('PID', fontSize=8, fontName='Helvetica-Bold')), Paragraph(r[1], s_small)] for r in plan1], colWidths=[20*mm, W-20*mm])
t_plan1.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), HexColor('#fef2f2')),
    ('BOX', (0, 0), (-1, -1), 1, C_RED),
    ('INNERGRID', (0, 0), (-1, -1), 0.25, HexColor('#fecaca')),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ('LEFTPADDING', (0, 0), (-1, -1), 4),
]))
story.append(t_plan1)
story.append(Spacer(1, 4*mm))

story.append(Paragraph('Fase 2 - Corto Plazo (Semana 2-3)', s_h2))
plan2 = [
    ['TA-02/03', 'Agregar campos factura y precintos a PesajeCamion'],
    ['FN-01', 'Rework resumen facturacion para usar TipoServicio/Liquidacion'],
    ['C2-01', 'Alinear interfaz GrasaDressing con schema'],
    ['C2-02', 'Consolidar APIs de Pallet en ruta canonica'],
    ['SC-04', 'Reemplazar backup SQLite con pg_dump'],
    ['TA-05', 'Eliminar auto-confirmed en romaneo pesar'],
    ['TA-06', 'Agregar recalculo de pesoTotalIndividual en PUT'],
    ['TA-07', 'Agregar limpieza de relaciones en Animales DELETE'],
    ['FN-02/03', 'Agregar BORRADOR y campos AFIP a frontend facturacion'],
    ['MW-01', 'Agregar puedeDashboardFinanciero al modelo o corregir middleware'],
]
t_plan2 = Table([[Paragraph(f'<b>{r[0]}</b>', ParagraphStyle('PID2', fontSize=8, fontName='Helvetica-Bold')), Paragraph(r[1], s_small)] for r in plan2], colWidths=[20*mm, W-20*mm])
t_plan2.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), HexColor('#fff7ed')),
    ('BOX', (0, 0), (-1, -1), 1, C_ORANGE),
    ('INNERGRID', (0, 0), (-1, -1), 0.25, HexColor('#fed7aa')),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ('LEFTPADDING', (0, 0), (-1, -1), 4),
]))
story.append(t_plan2)
story.append(Spacer(1, 4*mm))

story.append(Paragraph('Fase 3 - Mediano Plazo (Sprint 3-4)', s_h2))
plan3 = [
    ['SC-06/07', 'Implementar registro de IntentoLogin y Sesion en auth'],
    ['SC-09', 'Enforcear ConfiguracionSeguridad en login y cambio password'],
    ['SC-10/11', 'Normalizar rótulos y FlujoFaena con enums'],
    ['TA-04', 'Implementar estados BORRADOR o eliminar de schema'],
    ['C2-03/04/05', 'Corregir Decomiso pesoKg, Expedicion palletId, TipoCuarto FK'],
    ['FN-06/07/08', 'Normalizar NotasCreditoDebito, consolidar DELETE, fix saldo'],
    ['FN-05', 'Conectar modelos Pago y PagoFactura con FK'],
    ['C2-08/09', 'Sanear PUT body spread, consolidar rutas CajaEmpaque'],
    ['TA-08/09/10', 'Corregir species hardcode y lista-faena/cerrar states'],
]
t_plan3 = Table([[Paragraph(f'<b>{r[0]}</b>', ParagraphStyle('PID3', fontSize=8, fontName='Helvetica-Bold')), Paragraph(r[1], s_small)] for r in plan3], colWidths=[20*mm, W-20*mm])
t_plan3.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), HexColor('#fefce8')),
    ('BOX', (0, 0), (-1, -1), 1, C_YELLOW),
    ('INNERGRID', (0, 0), (-1, -1), 0.25, HexColor('#fef08a')),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ('LEFTPADDING', (0, 0), (-1, -1), 4),
]))
story.append(t_plan3)
story.append(Spacer(1, 4*mm))

story.append(Paragraph('Fase 4 - Mejoras Continuas (Sprint 5+)', s_h2))
plan4 = [
    ['SC-15/16/17', 'Corregir bcrypt rounds, typo reportes, filter corralId'],
    ['SC-18/19/20', 'Dashboard metas, SIGICA password, CCIR/DJ operadorId'],
    ['FN-12/13/14', 'Precio historial, body sanitization, condicionIva'],
    ['FN-15/16/17', 'Proveedor PUT, PrecioCliente fechaDesde, soft delete'],
    ['C2-14/15/16', 'pH label, stats en memoria, alertas orden'],
    ['TA-14/15', 'Tropa cantidadCabezas 0, EstadoTropa DESPACHADO'],
]
t_plan4 = Table([[Paragraph(f'<b>{r[0]}</b>', ParagraphStyle('PID4', fontSize=8, fontName='Helvetica-Bold')), Paragraph(r[1], s_small)] for r in plan4], colWidths=[20*mm, W-20*mm])
t_plan4.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), HexColor('#f0fdf4')),
    ('BOX', (0, 0), (-1, -1), 1, C_GREEN),
    ('INNERGRID', (0, 0), (-1, -1), 0.25, HexColor('#bbf7d0')),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ('LEFTPADDING', (0, 0), (-1, -1), 4),
]))
story.append(t_plan4)

doc.build(story)
print(f'PDF generated: {output_path}')
