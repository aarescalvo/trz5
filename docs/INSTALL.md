# 📦 Guía de Instalación - Sistema Frigorífico v2.5.0

## Requisitos del Sistema

### Para Desarrollo
- **Node.js**: v20.x LTS o superior
- **Bun**: v1.x (recomendado) o npm/yarn
- **Sistema Operativo**: Windows 10/11, macOS, Linux

### Para Producción (Servidor)
- **CPU**: 4 núcleos mínimo
- **RAM**: 8 GB mínimo (16 GB recomendado)
- **Disco**: 100 GB mínimo SSD
- **Sistema Operativo**: Windows Server 2019+ o Ubuntu Server 20.04+

---

## Instalación Rápida (Desarrollo)

### 1. Clonar repositorio
```bash
git clone https://github.com/aarescalvo/1532.git
cd 1532
```

### 2. Instalar dependencias
```bash
bun install
```

### 3. Configurar base de datos
```bash
# Crear archivo .env
cp .env.example .env

# Sincronizar base de datos
bun run db:push

# Cargar datos de prueba
bun run db:seed
```

### 4. Iniciar servidor
```bash
bun run dev
```

### 5. Acceder al sistema
Abrir navegador en: `http://localhost:3000`

**Credenciales de prueba:**
- Usuario: `admin`
- Contraseña: `admin123`

---

## Instalación en Producción (Windows Server)

### Opción A: Instalación Automática

1. Descargar `install-auto.bat` del repositorio
2. Ejecutar como Administrador
3. Seguir las instrucciones en pantalla
4. El instalador configura todo automáticamente:
   - Node.js
   - PostgreSQL
   - Base de datos
   - Servicio de Windows
   - Firewall

### Opción B: Instalación Manual

#### Paso 1: Instalar Node.js
```powershell
# Descargar desde https://nodejs.org/
# Versión LTS recomendada: v20.x
```

#### Paso 2: Instalar PostgreSQL
```powershell
# Descargar desde https://www.postgresql.org/download/windows/
# Versión recomendada: PostgreSQL 16

# Durante instalación:
# - Contraseña superuser: [elegir contraseña segura]
# - Puerto: 5432 (por defecto)
```

#### Paso 3: Crear base de datos
```sql
-- Conectar a PostgreSQL
psql -U postgres

-- Crear base de datos y usuario
CREATE DATABASE solemar_frigorifico;
CREATE USER solemar_user WITH ENCRYPTED PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE solemar_frigorifico TO solemar_user;
```

#### Paso 4: Configurar aplicación
```bash
# Clonar repositorio
git clone https://github.com/aarescalvo/1532.git C:\SolemarFrigorifico
cd C:\SolemarFrigorifico

# Instalar dependencias
bun install

# Crear archivo .env
# Editar con los datos de tu base de datos:
DATABASE_URL="postgresql://solemar_user:tu_password@localhost:5432/solemar_frigorifico"

# Sincronizar base de datos
bun run db:push

# Cargar datos iniciales
bun run db:seed
```

#### Paso 5: Crear servicio de Windows
```powershell
# Instalar NSSM (Non-Sucking Service Manager)
choco install nssm

# Crear servicio
nssm install SolemarFrigorifico "C:\Program Files\nodejs\node.exe" "C:\SolemarFrigorifico\node_modules\next\dist\bin\next" "start"

# Configurar servicio
nssm set SolemarFrigorifico AppDirectory "C:\SolemarFrigorifico"
nssm set SolemarFrigorifico DisplayName "Sistema Frigorífico Solemar"
nssm set SolemarFrigorifico Start SERVICE_AUTO_START

# Iniciar servicio
nssm start SolemarFrigorifico
```

#### Paso 6: Configurar Firewall
```powershell
# Abrir puerto 3000
netsh advfirewall firewall add rule name="Solemar Frigorifico" dir=in action=allow protocol=TCP localport=3000
```

---

## Configuración de Red Multi-PC

### Acceso desde otras PCs

1. **Obtener IP del servidor:**
```powershell
ipconfig
# Anotar la dirección IPv4 (ej: 192.168.1.100)
```

2. **Configurar en PCs cliente:**
   - Abrir navegador
   - Acceder a: `http://192.168.1.100:3000`
   - Crear acceso directo en escritorio

### Configuración avanzada

Ver archivo `NETWORK-CONFIG.md` para:
- Configuración de IP estática
- Configuración de dominio local
- Certificados SSL
- Proxy inverso con Nginx

---

## Actualizaciones

### Desde GitHub
```bash
cd C:\SolemarFrigorifico
git pull origin master
bun install
bun run db:push
```

### Desde la interfaz web
1. Acceder como Administrador
2. Ir a Configuración → Admin Sistema
3. Pestaña "Actualizaciones"
4. Click en "Verificar actualizaciones"
5. Click en "Actualizar"

---

## Backups

### Manual
```bash
# SQLite
cp prisma/dev.db backups/backup_$(date +%Y%m%d).db

# PostgreSQL
pg_dump -U solemar_user solemar_frigorifico > backup_$(date +%Y%m%d).sql
```

### Automático
Configurar en: Configuración → Backups Automáticos

- Frecuencia: Diario
- Hora: 03:00 AM (mínimo tráfico)
- Retención: 30 días

---

## Solución de Problemas

### El servidor no inicia
```bash
# Verificar logs
type C:\SolemarFrigorifico\dev.log

# Verificar puerto
netstat -ano | findstr :3000

# Reiniciar servicio
nssm restart SolemarFrigorifico
```

### Error de conexión a base de datos
```bash
# Verificar que PostgreSQL esté corriendo
# Windows Services → postgresql-x64-16

# Verificar conexión
psql -U solemar_user -d solemar_frigorifico -h localhost
```

### Error "Cannot find module"
```bash
# Reinstalar dependencias
rm -rf node_modules
bun install
```

---

## Soporte

- **Repositorio**: https://github.com/aarescalvo/1532
- **Issues**: https://github.com/aarescalvo/1532/issues
- **Documentación**: Ver carpeta `/docs`

---

## Changelog

### v2.5.0 (Actual)
- Arquitectura modular por dominios
- Patrón Repository y Service
- Bus de eventos desacoplado
- Tipos compartidos centralizados
- Mejor escalabilidad

### v2.4.0
- Módulo Trazabilidad
- Reportes Avanzados con gráficos
- Backups Automáticos programables

### v2.3.0
- Personalización de menús (drag & drop)
- Tamaños de módulos configurables

### v2.2.0
- Rate Limiting en autenticación
- Validación con Zod
- Componentes de loading

### v2.1.0
- Panel de administración
- Sistema de versiones
- Exportación de datos
