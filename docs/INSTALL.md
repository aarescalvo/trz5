# Guía de Instalación - Frigorífico Sistema

## Requisitos del Sistema

| Requisito | Mínimo | Recomendado |
|-----------|--------|-------------|
| Sistema Operativo | Linux, macOS | Ubuntu 22.04+ |
| RAM | 2 GB | 4 GB |
| Disco | 1 GB | 5 GB (con backups) |
| Bun | 1.0.0+ | Última versión |

## Instalación Rápida

### Opción 1: Instalador Automático

```bash
# Descomprimir release
tar -xzvf vX.X.X.tar.gz
cd vX.X.X

# Ejecutar instalador
chmod +x install.sh
./install.sh
```

### Opción 2: Instalación Manual

```bash
# 1. Instalar Bun (si no está instalado)
curl -fsSL https://bun.sh/install | bash

# 2. Clonar o descomprimir el proyecto
cd frigorifico-sistema

# 3. Instalar dependencias
bun install

# 4. Crear base de datos
bun run db:push

# 5. (Opcional) Crear datos de prueba
bun run db:seed

# 6. Iniciar servidor
bun run dev
```

## Verificación de Instalación

1. Abrir navegador en `http://localhost:3000`
2. Verificar que aparezca la pantalla de login
3. Usuario por defecto: `admin` / PIN: `1234`

## Configuración de Producción

### Build de Producción

```bash
# Crear build optimizado
bun run build

# Iniciar en modo producción
bun run start
```

### Variables de Entorno (opcional)

Crear archivo `.env`:
```env
# Base de datos (SQLite por defecto)
DATABASE_URL="file:./db/custom.db"

# Puerto (default: 3000)
PORT=3000
```

### Servicio Systemd (Linux)

Crear `/etc/systemd/system/frigorifico.service`:
```ini
[Unit]
Description=Frigorífico Sistema
After=network.target

[Service]
Type=simple
User=usuario
WorkingDirectory=/ruta/al/proyecto
ExecStart=/home/usuario/.bun/bin/bun run start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable frigorifico
sudo systemctl start frigorifico
```

## Actualización

```bash
# 1. Hacer backup de la base de datos
./scripts/backup-db.sh

# 2. Descargar nueva versión
# (descomprimir o git pull)

# 3. Instalar nuevas dependencias
bun install

# 4. Actualizar base de datos si hay cambios
bun run db:push

# 5. Reiniciar servidor
bun run dev
```

## Solución de Problemas

### Error: "Cannot find module"
```bash
bun install
```

### Error: "Database is locked"
```bash
# Detener servidor y reiniciar
```

### Error: "Port 3000 already in use"
```bash
# Ver qué proceso usa el puerto
lsof -i :3000
# Matar proceso si es necesario
kill -9 <PID>
```

---

**Versión documento:** 0.7.2  
**Última actualización:** Enero 2024
