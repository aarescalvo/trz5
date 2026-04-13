# Manual de Usuario - Frigorífico Sistema

## Índice

1. [Inicio de Sesión](#inicio-de-sesión)
2. [Módulos del Sistema](#módulos-del-sistema)
3. [Flujo de Trabajo](#flujo-de-trabajo)
4. [Glosario](#glosario)

---

## Inicio de Sesión

### Login
1. Abrir navegador: `http://localhost:3000`
2. Ingresar nombre de usuario
3. Ingresar PIN (4 dígitos)
4. Click en "Ingresar"

### Roles de Usuario

| Rol | Permisos |
|-----|----------|
| **Administrador** | Acceso total |
| **Supervisor** | Reportes, configuración, anular facturas |
| **Operador** | Módulos asignados según configuración |

---

## Módulos del Sistema

### 1. Pesaje de Camiones
**Función:** Registrar el peso de los camiones que traen hacienda.

**Pasos:**
1. Seleccionar "Nuevo Pesaje"
2. Ingresar datos del transporte (patente, chofer)
3. Seleccionar tipo: Entrada o Salida
4. Registrar peso bruto
5. (Más tarde) Registrar peso tara
6. Sistema calcula peso neto automáticamente

---

### 2. Movimiento de Hacienda
**Función:** Ingreso de animales a los corrales.

**Pasos:**
1. Crear nueva tropa
2. Asignar productor y usuario de faena
3. Especificar cantidad de animales
4. Seleccionar corral de destino
5. Confirmar ingreso

---

### 3. Lista de Faena
**Función:** Programar los animales a faenar.

**Pasos:**
1. Seleccionar fecha de faena
2. Agregar animales desde corrales
3. Asignar número de garrón a cada animal
4. Imprimir lista para producción

---

### 4. Romaneo (VB Romaneo)
**Función:** Registrar el peso de las medias reses.

**Pasos:**
1. Seleccionar animal por garrón
2. Registrar peso de media derecha
3. Registrar peso de media izquierda
4. Asignar tipificación si corresponde
5. Repetir para cada animal

---

### 5. Ingreso a Cámara
**Función:** Ubicar las medias reses en cámaras frigoríficas.

**Pasos:**
1. Seleccionar cámara de destino
2. Escanear o ingresar código de media
3. Confirmar ubicación
4. El sistema actualiza stock automáticamente

---

### 6. Despacho 1/2 Res
**Función:** Despachar medias reses a clientes.

**Pasos:**
1. Seleccionar medias desde cámaras
2. Ingresar datos del transporte (destino, patente, chofer)
3. Registrar ticket de pesaje (opcional)
4. Confirmar despacho
5. Opcional: Generar factura

**Datos importantes:**
- Se muestra KG por usuario/cliente
- Se puede anular un despacho (restaura stock)
- Se puede ver detalle completo

---

### 7. Facturación
**Función:** Generar facturas por servicios y productos.

**Pestañas:**

#### Pestaña 1: Desde Despacho
1. Seleccionar despacho pendiente
2. Ingresar precio por KG
3. Confirmar factura

#### Pestaña 2: Otros Items
1. Seleccionar tipo de item:
   - Servicio Desposte
   - Venta de Menudencias
   - Venta de Carne
   - Venta de Cortes
   - Servicio de Frío
   - Otros
2. Ingresar cantidad y precio
3. Agregar más items si es necesario
4. Confirmar factura

#### Pestaña 3: Histórico
- Ver todas las facturas
- Filtrar por estado o cliente
- Editar/Anular (requiere PIN supervisor)

---

### 8. Stock
**Función:** Ver inventario de medias reses en cámaras.

**Vistas:**
- Stock por cámara
- Stock por usuario/cliente
- Stock por tropa

---

### 9. Reportes
**Función:** Generar informes del sistema.

**Reportes disponibles:**
- Faena diaria
- Rinde de faena
- Stock actual
- Despachos por período
- Facturación

---

### 10. Configuración
**Función:** Administrar el sistema.

**Opciones:**
- Gestión de clientes
- Gestión de operadores
- Gestión de corrales
- Gestión de cámaras
- Gestión de tipificadores
- Precios por cliente

---

## Flujo de Trabajo

### Flujo Principal (Ciclo I)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Recepción  │───▶│   Corrales  │───▶│ Lista Faena │
│  (Camiones) │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
                                            │
                                            ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Despacho   │◀───│   Cámaras   │◀───│   Romaneo   │
│             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
       │
       ▼
┌─────────────┐
│ Facturación │
│             │
└─────────────┘
```

---

## Glosario

| Término | Definición |
|---------|------------|
| **Tropa** | Grupo de animales de un mismo productor |
| **Garrón** | Número de identificación del animal en faena |
| **Media Res** | Cada mitad de la res después de la faena |
| **Romaneo** | Pesaje de las medias reses |
| **Usuario/Cliente** | El que faena en el frigorífico (con matrícula) |
| **Operador** | El que usa el sistema de trazabilidad |
| **Despacho** | Salida de medias reses del frigorífico |
| **Expedición** | Salida de productos elaborados (Ciclo II) |

---

**Versión documento:** 0.7.2  
**Última actualización:** Enero 2024
