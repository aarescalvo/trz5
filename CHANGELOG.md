# Changelog - Sistema Frigorífico

## [0.5.0] - 2025-03-18

### Agregado
- **Sistema de Plantillas ZPL desde Zebra Designer**:
  - Importación de archivos .zpl, .prn, .txt desde Zebra Designer
  - Detección automática de variables en formato {{VAR}} y &VAR&
  - Mapeo inteligente a campos del sistema (30+ variables soportadas)
  - Vista previa de ZPL con datos de prueba
  - Copiar ZPL al portapapeles
  - Descargar ZPL procesado

- **APIs para plantillas ZPL**:
  - `POST /api/rotulos/upload-zpl`: Subir archivos ZPL
  - `GET/POST /api/rotulos/procesar-zpl`: Procesar ZPL con datos
  - `GET/POST /api/rotulos/imprimir`: Imprimir rótulos (ambos tipos)

- **Variables ZPL soportadas**:
  - FECHA, FECHA_FAENA → fechaFaena
  - FECHA_VENC, FECHA_VENCIMIENTO → fechaVencimiento
  - TROPA, TROPA_CODIGO → tropa
  - GARRON, NUMERO_GARRON → garrón
  - PESO, PESO_KG → peso
  - PRODUCTO, NOMBRE_PRODUCTO → nombreProducto
  - ESTABLECIMIENTO → establecimiento
  - NRO_ESTABLECIMIENTO → número de establecimiento
  - USUARIO_FAENA, NOMBRE_USUARIO_FAENA → usuario de faena
  - CUIT_PRODUCTOR, CUIT_USUARIO → CUITs
  - MATRICULA → matrícula
  - CODIGO_BARRAS, BARRAS → código de barras
  - Y más...

- **Interfaz actualizada**:
  - Tabs para Editor Drag & Drop vs Zebra Designer
  - Indicadores visuales para tipo de plantilla (EDITOR/ZPL)
  - Estadísticas separadas por tipo de rótulo
  - Modal de importación con preview del ZPL

- **Modelo de datos actualizado**:
  - Campo `tipoPlantilla` (EDITOR | ZPL)
  - Campo `contenidoZPL` para almacenar ZPL raw
  - Campo `camposZPL` para mapeo de variables
  - Campo `nombreArchivoZPL` para referencia

### Flujo de trabajo ZPL
1. Diseñar etiqueta en Zebra Designer con variables {{VAR}}
2. Exportar como archivo .zpl o .prn
3. Importar en el sistema con "Importar ZPL"
4. Al imprimir, las variables se reemplazan automáticamente

## [0.4.0] - 2025-03-17

### Agregado
- **Editor de Rótulos Drag & Drop**:
  - Canvas interactivo para diseño visual de etiquetas
  - 7 tipos de elementos: texto, campo dinámico, imagen, rectángulo, círculo, línea, código de barras
  - Drag & drop para mover elementos
  - Handles de resize en las 4 esquinas
  - Panel de propiedades completo (posición, tamaño, rotación, opacidad, colores, fuentes)
  - Control de capas (zIndex): subir/bajar elementos
  - Sistema de zoom 1x-6x (zoom inicial 3x)
  - Subida de logos/imágenes

- **Campos dinámicos del rótulo** (31 campos organizados por categoría):
  - **Faena**: fechaFaena, fechaVencimiento (calculada), tropa, garrón, tipificador, clasificación, peso, lado, nombreProducto, especie
  - **Establecimiento**: nombre, número, CUIT, matrícula, dirección, localidad, provincia
  - **Usuario de Faena**: nombre, CUIT, matrícula, dirección, localidad, provincia, teléfono
  - **Productor**: nombre, CUIT
  - **Otros**: código de barras, lote, N° SENASA, días de consumo, temperatura máxima

- **Campo calculado - Fecha de Vencimiento**:
  - Se calcula automáticamente: fecha actual + días de conservación
  - Indicador visual en el selector de campos

- **Selector de campos agrupado por categoría**:
  - Mejor organización visual
  - Indicador para campos calculados

### Corregido
- **Zoom del editor de rótulos**:
  - Zoom inicial aumentado de 1x a 3x
  - Zoom máximo aumentado de 2x a 6x
  - Incrementos de zoom de 0.5x

## [0.3.0] - 2025-01-17

### Corregido
- **Lista de Faena**: Stocks ahora visibles para agregar a la lista
  - Corregido API stock-corrales: campo `disponibles` (plural) en lugar de `disponible`
  - Agregado campo `tropaEspecie` y `usuarioFaena` como objeto
  - Estados de búsqueda corregidos de `PESADO,LISTO_FAENA` a `RECIBIDO,PESADO`
  
- **Lista de Faena**: Animales visibles en Ingreso a Cajón y Romaneo después de cerrar lista
  - API animales-hoy ahora busca listas CERRADA además de ABIERTA
  - Busca la lista más reciente con tropas asignadas

- **Lista de Faena**: Lista cerrada visible en "Lista Actual"
  - Priorización: ABIERTA hoy > CERRADA hoy > más reciente
  - Botón de imprimir disponible para listas cerradas

- **Lista de Faena**: Error al quitar tropas corregido
  - Cambiado `findUnique` por `findFirst` en DELETE
  - `corralId` pasado correctamente desde el componente
  - Orden de tropas preservado con `orderBy createdAt`

- **Base de datos**: Error "readonly database" corregido
  - APIs de escritura usan conexión Prisma fresca
  - Patrón `getPrisma()` con `datasourceUrl` explícito

- **EditableBlock**: Contenido visible en modo normal
  - Separación de modos de renderizado (normal vs edición)

## [0.2.0] - 2025-01-15

### Agregado
- Sistema WYSIWYG completo en 40+ módulos
  - TextoEditable para textos inline
  - EditableBlock para drag & drop
  - Persistencia en SQLite via API layout-modulo

- Módulos implementados:
  - CICLO I: Pesaje Camiones, Pesaje Individual, Movimiento Hacienda, Lista Faena, Ingreso Cajón, Romaneo, VB Romaneo, Expedición
  - CICLO II: Cuarteo, Ingreso Despostada, Movimientos Despostada, Cortes Despostada, Empaque
  - SUBPRODUCTOS: Menudencias, Cueros, Rendering
  - STOCKS: Insumos, Corrales, Cámaras
  - ADMINISTRACIÓN: Despachos, Facturación, Reportes SENASA
  - REPORTES: Planilla 01, Búsqueda Filtro, VB Faena
  - CALIDAD: Registro de Usuarios

## [0.1.0] - 2025-01-10

### Agregado
- Proyecto inicial Next.js 16 con TypeScript
- Sistema de autenticación con operadores
- Gestión de tropas y animales
- Módulos de pesaje
- Configuración del sistema
