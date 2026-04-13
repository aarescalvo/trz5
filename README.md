# 🥩 Sistema de Gestión Frigorífica

Sistema integral para la gestión de faena, romaneo y procesamiento de carne bovina y equina.

## 📋 Características Principales

### CICLO I - Recepción y Faena
- **Pesaje Camiones**: Pesaje bruto y tara de camiones
- **Pesaje Individual**: Pesaje de animales individuales
- **Movimiento de Hacienda**: Gestión de corrales y movimiento de animales
- **Lista de Faena**: Planificación diaria de animales a faenar
- **Ingreso a Cajón**: Asignación de garrones
- **Romaneo**: Pesaje de medias
- **VB Romaneo**: Verificación de romaneo
- **Expedición**: Gestión de despachos

### CICLO II - Despostada
- **Cuarteo**: Cuarteo de medias
- **Ingreso Despostada**: Registro de ingreso a despostada
- **Movimientos Despostada**: Movimientos entre cámaras
- **Cortes Despostada**: Registro de cortes
- **Empaque**: Empaque de productos

### Subproductos
- **Menudencias**: Gestión de menudencias
- **Cueros**: Control de cueros
- **Rendering**: Grasa, desperdicios, fondo digestor

### Stocks y Reportes
- **Stock Corrales**: Vista de stock por corral
- **Stock Cámaras**: Vista de stock en cámaras
- **Planilla 01**: Planilla oficial SENASA
- **Búsqueda Filtro**: Búsqueda general
- **Reportes SENASA**: Generación de reportes

### Administración
- **Despachos**: Gestión de expediciones
- **Facturación**: Facturación de ventas
- **Control de Calidad**: Registro de reclamos

### Configuración
- **Operadores**: Gestión de usuarios y permisos
- **Productos**: Catálogo de productos
- **Corrales**: Configuración de corrales
- **Balanzas, Impresoras, Terminales**: Configuración de hardware

## 🚀 Instalación

### Requisitos Previos
- Node.js 18+ o Bun
- SQLite3

### Pasos de Instalación

```bash
# Clonar el repositorio
git clone https://github.com/aarescalvo/1532.git
cd 1532

# Instalar dependencias
bun install

# Configurar base de datos
bun run db:push
bun run db:seed

# Iniciar en desarrollo
bun run dev
```

### Acceso por Defecto
- **Usuario**: admin
- **PIN**: 1234

## 🏗️ Build para Producción

```bash
# Construir
bun run build

# Iniciar producción
bun start
```

## 🛠️ Tecnologías

- **Frontend**: Next.js 16, React 19, TypeScript
- **UI**: Tailwind CSS, shadcn/ui, Lucide Icons
- **Base de Datos**: SQLite, Prisma ORM
- **Estado**: Zustand, TanStack Query

## 📁 Estructura del Proyecto

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # APIs REST
│   ├── page.tsx           # Página principal
│   └── ...
├── components/            # Componentes React
│   ├── ui/               # Componentes base (shadcn)
│   ├── lista-faena/      # Módulo Lista de Faena
│   ├── romaneo/          # Módulo Romaneo
│   └── ...
├── lib/                   # Utilidades y configuración
├── prisma/               # Esquema y seed de base de datos
└── types/                # Tipos TypeScript
```

## 🔐 Permisos

El sistema maneja los siguientes roles:
- **ADMINISTRADOR**: Acceso completo
- **SUPERVISOR**: Supervisión y cierre de listas
- **OPERADOR**: Operaciones básicas

## 📝 Licencia

Uso interno - Sistema de Gestión Frigorífica

---

Versión: 0.3.0
Última actualización: Enero 2025
