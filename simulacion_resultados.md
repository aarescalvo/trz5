# SIMULACIÓN INTEGRAL DEL SISTEMA TRAZASOLE

**Fecha:** 25 de Marzo de 2026
**Servidor:** http://localhost:3000
**Versión del Sistema:** 3.2.8

---

## RESUMEN EJECUTIVO

| Métrica | Valor |
|---------|-------|
| **Total de Endpoints Probados** | 41 |
| **Endpoints Funcionando** | 37 |
| **Endpoints con Error** | 4 |
| **Tasa de Éxito** | 90.2% |

---

## RESULTADOS DETALLADOS POR MÓDULO

### 1. CONFIGURACIÓN (10 endpoints)

| Endpoint | Estado | Registros | Observaciones |
|----------|--------|-----------|---------------|
| `/api/camaras` | ✅ OK | 11 | Cámaras de frío configuradas |
| `/api/corrales` | ✅ OK | 13 | Corrales activos |
| `/api/operadores` | ✅ OK | 1 | Operadores registrados |
| `/api/tipificadores` | ✅ OK | 1 | Tipificadores disponibles |
| `/api/transportistas` | ✅ OK | 3 | Transportistas habilitados |
| `/api/clientes` | ✅ OK | 10 | Clientes registrados |
| `/api/proveedores` | ❌ ERROR | - | **Error al obtener proveedores** |
| `/api/productos` | ✅ OK | 0 | Sin productos cargados |
| `/api/insumos` | ✅ OK | 1 | Insumos disponibles |
| `/api/usuarios` | ❌ ERROR | - | **Error al obtener usuarios** |

**Subtotal:** 8 OK, 2 ERROR

---

### 2. HACIENDA (4 endpoints)

| Endpoint | Estado | Registros | Observaciones |
|----------|--------|-----------|---------------|
| `/api/tropas` | ✅ OK | 15 | Tropas registradas |
| `/api/animales` | ⚠️ PARAM | - | Requiere parámetro `tropaId` |
| `/api/corrales/stock` | ✅ OK | 13 | Stock por corral disponible |
| `/api/pesaje-camion` | ✅ OK | 19 | Pesajes de camión registrados |

**Subtotal:** 3 OK, 1 requiere parámetro

---

### 3. FAENA (6 endpoints)

| Endpoint | Estado | Registros | Observaciones |
|----------|--------|-----------|---------------|
| `/api/lista-faena` | ✅ OK | 7 | Listas de faena activas |
| `/api/garrones-asignados` | ✅ OK | 3 | Garrones asignados |
| `/api/romaneos` | ✅ OK | 43 | Romaneos registrados |
| `/api/vb-romaneo` | ✅ OK | 1 | Vistos buenos pendientes |
| `/api/romaneo/medias-dia` | ✅ OK | 0 | Sin medias del día |
| `/api/pesaje-individual` | ✅ OK | 37 | Pesajes individuales |

**Subtotal:** 6 OK, 0 ERROR

---

### 4. STOCK (4 endpoints)

| Endpoint | Estado | Registros | Observaciones |
|----------|--------|-----------|---------------|
| `/api/stock-camaras` | ✅ OK | 1 | Stock en cámaras |
| `/api/despachos` | ✅ OK | 0 | Sin despachos pendientes |
| `/api/stock` | ✅ OK | 8 | Items en stock general |
| `/api/movimientos-camara` | ✅ OK | 41 | Movimientos registrados |

**Subtotal:** 4 OK, 0 ERROR

---

### 5. SUBPRODUCTOS (4 endpoints)

| Endpoint | Estado | Registros | Observaciones |
|----------|--------|-----------|---------------|
| `/api/menudencias` | ✅ OK | 3 | Menudencias registradas |
| `/api/cueros` | ✅ OK | 3 | Cueros en inventario |
| `/api/rendering` | ✅ OK | 3 | Rendering procesado |
| `/api/tipos-menudencia` | ✅ OK | 3 | Tipos configurados |

**Subtotal:** 4 OK, 0 ERROR

---

### 6. REPORTES (5 endpoints)

| Endpoint | Estado | Registros | Observaciones |
|----------|--------|-----------|---------------|
| `/api/reportes` | ✅ OK | 1 | Reportes disponibles |
| `/api/rindes` | ✅ OK | 1 | Rindes calculados |
| `/api/reportes-senasa` | ✅ OK | 0 | Sin reportes SENASA |
| `/api/reportes/faena` | ✅ OK | 1 | Reporte de faena |
| `/api/reportes/stock` | ✅ OK | 1 | Reporte de stock |

**Subtotal:** 5 OK, 0 ERROR

---

### 7. ADMINISTRATIVO (3 endpoints)

| Endpoint | Estado | Registros | Observaciones |
|----------|--------|-----------|---------------|
| `/api/facturacion` | ✅ OK | 0 | Sin facturación pendiente |
| `/api/auditoria` | ✅ OK | 14 | Registros de auditoría |
| `/api/dashboard` | ✅ OK | 1 | Dashboard operativo |

**Subtotal:** 3 OK, 0 ERROR

---

### 8. CALIDAD (3 endpoints)

| Endpoint | Estado | Registros | Observaciones |
|----------|--------|-----------|---------------|
| `/api/calidad-reclamos` | ✅ OK | 1 | Reclamos registrados |
| `/api/ccir` | ✅ OK | 1 | CIR disponible |
| `/api/declaracion-jurada` | ✅ OK | 0 | Sin declaraciones pendientes |

**Subtotal:** 3 OK, 0 ERROR

---

### 9. RÓTULOS (1 endpoint)

| Endpoint | Estado | Registros | Observaciones |
|----------|--------|-----------|---------------|
| `/api/rotulos` | ✅ OK | 1 | Rótulos configurados |

**Subtotal:** 1 OK, 0 ERROR

---

### 10. SISTEMA (1 endpoint)

| Endpoint | Estado | Registros | Observaciones |
|----------|--------|-----------|---------------|
| `/api/sistema/status` | ❌ ERROR | - | **No autorizado** |

**Subtotal:** 0 OK, 1 ERROR

---

## ERRORES DETECTADOS

Se encontraron **4 endpoints con errores** que requieren corrección:

### 1. `/api/proveedores`
- **Error:** "Error al obtener proveedores"
- **Severidad:** Media
- **Posible causa:** Error en la consulta a la base de datos o tabla no inicializada
- **Acción recomendada:** Verificar conexión a la tabla Proveedor y seed de datos

### 2. `/api/usuarios`
- **Error:** "Error al obtener usuarios"
- **Severidad:** Alta
- **Posible causa:** Error en la consulta a la base de datos o tabla de usuarios vacía
- **Acción recomendada:** Verificar que la tabla Usuario esté correctamente configurada

### 3. `/api/animales`
- **Error:** "tropaId requerido"
- **Severidad:** Baja
- **Causa:** El endpoint requiere un parámetro obligatorio
- **Acción recomendada:** Normal - el endpoint funciona correctamente pero requiere el parámetro tropaId en la query string

### 4. `/api/sistema/status`
- **Error:** "No autorizado"
- **Severidad:** Baja
- **Causa:** El endpoint requiere autenticación
- **Acción recomendada:** Normal - el endpoint está protegido por autenticación

---

## ESTADÍSTICAS DEL SISTEMA

### Registros por Módulo

| Módulo | Cantidad de Registros |
|--------|----------------------|
| Romaneos | 43 |
| Movimientos de Cámara | 41 |
| Pesaje Individual | 37 |
| Pesaje Camión | 19 |
| Auditoría | 14 |
| Corrales | 13 |
| Stock Corrales | 13 |
| Cámaras | 11 |
| Clientes | 10 |
| Tropas | 7 |
| Lista Faena | 7 |
| Stock | 8 |
| Transportistas | 3 |
| Garrones Asignados | 3 |
| Menudencias | 3 |
| Cueros | 3 |
| Rendering | 3 |
| Tipos Menudencia | 3 |

---

## CONCLUSIONES

### Estado General del Sistema
El sistema TrazaSole se encuentra **OPERATIVO** con un 90.2% de funcionalidad correcta.

### Puntos Fuertes
- ✅ Todos los endpoints de FAENA funcionan correctamente
- ✅ Todos los endpoints de STOCK funcionan correctamente
- ✅ Todos los endpoints de SUBPRODUCTOS funcionan correctamente
- ✅ Todos los endpoints de REPORTES funcionan correctamente
- ✅ Todos los endpoints de CALIDAD funcionan correctamente
- ✅ Sistema de auditoría operativo (14 registros)

### Requiere Atención
- ❌ Endpoint `/api/proveedores` necesita revisión
- ❌ Endpoint `/api/usuarios` necesita revisión
- ⚠️ El endpoint `/api/productos` está vacío (0 registros) - considerar cargar datos

### Recomendaciones
1. **Inmediato:** Revisar y corregir el endpoint `/api/proveedores`
2. **Inmediato:** Revisar y corregir el endpoint `/api/usuarios`
3. **Corto plazo:** Cargar datos de productos en `/api/productos`
4. **Documentación:** Actualizar documentación de endpoints que requieren parámetros

---

## ARCHIVO DE LOG

Los logs completos de la simulación se encuentran en:
- `/home/z/my-project/dev.log`
- `/tmp/server.log`

---

**Generado automáticamente por el sistema de simulación TrazaSole**
