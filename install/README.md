# Solemar Alimentaria - Sistema Frigorifico

Sistema integral de gestion para frigorificos desarrollado en Next.js 16 + TypeScript + Bun.

## 🚀 Instalacion Rapida

### Windows 11

#### Opcion A: Instalador Automatico (Recomendado)

1. Descargar desde GitHub: https://github.com/aarescalvo/123
2. Extraer el contenido del ZIP en `C:\Solemar`
3. Abrir PowerShell como **Administrador**
4. Ejecutar:
   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process -Force
   cd C:\Solemar\install
   .\install-windows.ps1
   ```
5. Abrir navegador en `http://localhost:3000`

#### Opcion B: Clonar desde GitHub

```powershell
# Abrir PowerShell como Administrador
Set-ExecutionPolicy Bypass -Scope Process -Force

# Instalar Bun
powershell -c "irm bun.sh/install.ps1 | iex"

# Clonar repositorio
git clone https://github.com/aarescalvo/123.git C:\Solemar

# Configurar
cd C:\Solemar
bun install
bun run db:generate
bun run db:push
bun run db:seed
bun run build
bun run start
```

### Instalacion Manual

```bash
# 1. Instalar Bun desde https://bun.sh
# 2. Instalar Git desde https://git-scm.com

# 3. Clonar e instalar
git clone https://github.com/aarescalvo/123.git
cd 123
bun install

# 4. Configurar base de datos
bun run db:generate
bun run db:push
bun run db:seed

# 5. Compilar y ejecutar
bun run build
bun run start
```

## 📋 Requisitos

- Windows 10/11 (64 bits)
- 4 GB RAM minimo (8 GB recomendado)
- 2 GB espacio en disco
- Puerto 3000 disponible
- Conexion a internet (para instalacion inicial)

## 🔑 Credenciales por Defecto

| Usuario | Password | PIN | Rol |
|---------|----------|-----|-----|
| admin | admin123 | 1234 | Administrador |
| balanza | balanza123 | 1111 | Operador Balanza |
| supervisor | super123 | 2222 | Supervisor |

⚠️ **IMPORTANTE**: Cambiar credenciales en produccion

## 📚 Documentacion

- `INSTRUCCIONES-INSTALACION.txt` - Guia detallada de instalacion
- `AI-PROMPT.txt` - Documentacion tecnica completa del sistema

## 📁 Estructura del Proyecto

```
C:\Solemar\
├── src/
│   ├── app/           # Paginas y APIs
│   ├── components/    # Componentes React
│   └── lib/           # Utilidades
├── prisma/            # Esquema de base de datos
├── db/                # SQLite database
├── install/           # Archivos de instalacion
└── scripts/           # Scripts de utilidad
```

## 🛠️ Comandos

| Comando | Descripcion |
|---------|-------------|
| `bun run dev` | Servidor de desarrollo |
| `bun run build` | Compilar para produccion |
| `bun run start` | Iniciar en produccion |
| `bun run db:push` | Sincronizar base de datos |
| `bun run db:seed` | Cargar datos iniciales |

## 📦 Scripts de Utilidad

Despues de la instalacion, encontrara los siguientes scripts en `C:\Solemar\`:

| Script | Descripcion |
|--------|-------------|
| `iniciar.bat` | Inicia el sistema |
| `detener.bat` | Detiene el sistema |
| `backup.bat` | Crea backup de la base de datos |
| `actualizar.bat` | Actualiza desde GitHub |

## 🔄 Actualizacion

### Automatica
```batch
C:\Solemar\actualizar.bat
```

### Manual
```bash
cd C:\Solemar
git pull origin master
bun install
bun run db:push
bun run build
```

## 💾 Backup

### Automatico
```batch
C:\Solemar\backup.bat
```

### Programado
1. Abrir Programador de tareas de Windows
2. Crear tarea basica
3. Accion: Iniciar programa
4. Programa: `C:\Solemar\backup.bat`
5. Programar: Diariamente a las 23:00

## 📞 Soporte

- **Repositorio**: https://github.com/aarescalvo/123
- **Issues**: https://github.com/aarescalvo/123/issues
- **Documentacion**: Ver `AI-PROMPT.txt`

## 🔧 Solucion de Problemas

### Error: "bun no se reconoce"
```powershell
# Instalar Bun
powershell -c "irm bun.sh/install.ps1 | iex"
# Reiniciar PowerShell
```

### Error: "Port 3000 is already in use"
```batch
# Ver proceso que usa el puerto
netstat -ano | findstr :3000
# Matar proceso
taskkill /PID [numero] /F
```

### Error: "Cannot find module"
```bash
cd C:\Solemar
bun install
bun run db:generate
bun run build
```

---

**Solemar Alimentaria** - Sistema de Gestion Frigorifica v2.0
