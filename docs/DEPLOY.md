# 🚀 Instalación en Producción

## Guía para Despliegue del Sistema Frigorífico

---

## 🖥️ Opción 1: Servidor Local (Recomendado para frigoríficos)

### Requisitos del Servidor
- **CPU**: Intel Core i5 o superior
- **RAM**: 8 GB mínimo (16 GB recomendado)
- **Disco**: 100 GB SSD
- **Red**: IP fija en la LAN
- **Sistema**: Ubuntu Server 22.04 LTS o Windows Server 2019+

### Pasos de Instalación

#### 1. Preparar el Servidor

**Ubuntu Linux:**
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Crear usuario del sistema
sudo useradd -m -s /bin/bash solemar
sudo su - solemar
```

**Windows Server:**
```powershell
# Instalar Node.js desde https://nodejs.org
# Instalar Bun en PowerShell:
powershell -c "irm bun.sh/install.ps1 | iex"
```

#### 2. Clonar y Configurar

```bash
# Clonar repositorio
git clone https://github.com/aarescalvo/localzai.git /home/solemar/app
cd /home/solemar/app

# Instalar dependencias
bun install

# Configurar base de datos
bun run db:push
bun run db:seed

# Compilar para producción
bun run build
```

#### 3. Configurar como Servicio (Linux con systemd)

```bash
# Crear archivo de servicio
sudo nano /etc/systemd/system/solemar.service
```

Contenido:
```ini
[Unit]
Description=Sistema Frigorífico Solemar
After=network.target

[Service]
Type=simple
User=solemar
WorkingDirectory=/home/solemar/app
ExecStart=/home/solemar/.bun/bin/bun run start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Habilitar servicio
sudo systemctl daemon-reload
sudo systemctl enable solemar
sudo systemctl start solemar

# Ver estado
sudo systemctl status solemar
```

#### 4. Configurar Nginx como Proxy Inverso

```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/solemar
```

Contenido:
```nginx
server {
    listen 80;
    server_name solemar.local;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/solemar /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. Acceso desde la Red

Los equipos de la red acceden a:
```
http://IP-DEL-SERVIDOR:3000
```

O si configuraron Nginx:
```
http://solemar.local
```

---

## ☁️ Opción 2: Servidor en la Nube

### Proveedores Recomendados
- **Vercel** (gratuito para proyectos pequeños)
- **Railway** (fácil despliegue)
- **DigitalOcean** (VPS económico)
- **AWS/Azure/GCP** (empresarial)

### Despliegue en Vercel

```bash
# Instalar CLI de Vercel
bun i -g vercel

# Desplegar
vercel --prod
```

### Despliegue en Railway

1. Crear cuenta en railway.app
2. Conectar repositorio de GitHub
3. Configurar variables de entorno
4. Desplegar automáticamente

---

## 🌐 Opción 3: Docker (Contenedores)

### Crear Dockerfile

```dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

# Instalar dependencias
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Compilar
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# Producción
FROM base AS runner
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/db ./db
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production
EXPOSE 3000

CMD ["bun", "server.js"]
```

### Construir y Ejecutar

```bash
# Construir imagen
docker build -t solemar:latest .

# Ejecutar contenedor
docker run -d \
  --name solemar \
  -p 3000:3000 \
  -v solemar-data:/app/db \
  --restart always \
  solemar:latest
```

---

## 📊 Configuración de Backups Automáticos

### Script de Backup (Linux)

```bash
# Crear script
nano ~/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/solemar/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup de base de datos
cp /home/solemar/app/db/custom.db "$BACKUP_DIR/solemar_$DATE.db"

# Mantener solo últimos 30 días
find $BACKUP_DIR -name "*.db" -mtime +30 -delete

echo "Backup completado: solemar_$DATE.db"
```

```bash
# Dar permisos
chmod +x ~/backup.sh

# Programar en cron (ejecutar a las 2 AM)
crontab -e
# Agregar línea:
0 2 * * * /home/solemar/backup.sh >> /home/solemar/backup.log 2>&1
```

---

## 🔒 Seguridad Recomendada

### Firewall (Ubuntu)
```bash
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 3000/tcp   # Aplicación
sudo ufw allow 80/tcp     # HTTP
sudo ufw enable
```

### Cambiar Contraseñas por Defecto
1. Acceder como admin
2. Ir a Configuración → Operadores
3. Cambiar contraseña de cada usuario

### HTTPS (Certificado SSL)
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tu-dominio.com
```

---

## 📱 Acceso desde Dispositivos Móviles

El sistema es **responsive** y funciona en:
- 📱 Smartphones (Android/iOS)
- 📱 Tablets
- 💻 Computadoras de escritorio

Simplemente acceder desde el navegador del dispositivo a la IP del servidor.

---

## ✅ Verificación Post-Instalación

1. [ ] El sistema carga en http://IP:3000
2. [ ] Se puede iniciar sesión con admin/admin123
3. [ ] El dashboard muestra estadísticas
4. [ ] Se pueden crear tropas nuevas
5. [ ] Los reportes se generan correctamente
6. [ ] Los backups se ejecutan automáticamente

---

*Documento de producción - Solemar Alimentaria*
